-- Public-beta AI guardrail: reserve a conservative maximum before each
-- provider call. This creates a hard, app-wide $10 weekly ceiling even when
-- a provider's billing dashboard offers only monthly limits.

alter table public.ai_usage_buckets
  drop constraint if exists ai_usage_buckets_bucket_kind_check;
alter table public.ai_usage_buckets
  add constraint ai_usage_buckets_bucket_kind_check
  check (bucket_kind in ('hour', 'day', 'week'));

create table if not exists public.ai_beta_spend_buckets (
  week_start timestamptz primary key,
  reserved_cents integer not null default 0 check (reserved_cents >= 0),
  updated_at timestamptz not null default now()
);

alter table public.ai_beta_spend_buckets enable row level security;
revoke all on table public.ai_beta_spend_buckets from public, anon, authenticated;
grant select, insert, update on table public.ai_beta_spend_buckets to service_role;

drop function if exists public.claim_ai_request(uuid, integer);

create function public.claim_ai_request(
  p_user_id uuid,
  p_weight integer default 1,
  p_reserved_cents integer default 1
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_hour_limit constant integer := 20;
  v_day_limit constant integer := 100;
  v_weekly_budget_cents constant integer := 1000;
  v_hour timestamptz := date_trunc('hour', now());
  v_day timestamptz := date_trunc('day', now());
  v_week timestamptz := date_trunc('week', now());
  v_hour_count integer;
  v_day_count integer;
  v_reserved_cents integer;
begin
  if p_user_id is null
    or p_weight < 1 or p_weight > 100
    or p_reserved_cents < 1 or p_reserved_cents > v_weekly_budget_cents then
    return false;
  end if;

  insert into public.ai_usage_buckets (user_id, bucket_kind, bucket_start, requests)
  values
    (p_user_id, 'hour', v_hour, 0),
    (p_user_id, 'day', v_day, 0)
  on conflict do nothing;

  select requests into v_hour_count
    from public.ai_usage_buckets
    where user_id = p_user_id and bucket_kind = 'hour' and bucket_start = v_hour
    for update;
  select requests into v_day_count
    from public.ai_usage_buckets
    where user_id = p_user_id and bucket_kind = 'day' and bucket_start = v_day
    for update;

  if v_hour_count + p_weight > v_hour_limit
    or v_day_count + p_weight > v_day_limit then
    return false;
  end if;

  insert into public.ai_beta_spend_buckets (week_start, reserved_cents)
  values (v_week, 0)
  on conflict do nothing;

  select reserved_cents into v_reserved_cents
    from public.ai_beta_spend_buckets
    where week_start = v_week
    for update;

  if v_reserved_cents + p_reserved_cents > v_weekly_budget_cents then
    return false;
  end if;

  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = p_user_id and bucket_kind = 'hour' and bucket_start = v_hour;
  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = p_user_id and bucket_kind = 'day' and bucket_start = v_day;
  update public.ai_beta_spend_buckets
    set reserved_cents = reserved_cents + p_reserved_cents, updated_at = now()
    where week_start = v_week;
  return true;
end;
$$;

revoke all on function public.claim_ai_request(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_ai_request(uuid, integer, integer)
  to service_role;

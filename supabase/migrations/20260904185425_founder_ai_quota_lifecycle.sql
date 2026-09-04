-- Keep the public beta inside its conservative shared budget while allowing
-- the server-controlled founder account to operate the product it owns.
-- The structured result also lets the UI explain which limit fired and when
-- it resets instead of collapsing every refusal into a generic 429.

create or replace function public.claim_ai_request_v2(
  p_user_id uuid,
  p_weight integer default 1,
  p_reserved_cents integer default 1
) returns jsonb
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
  v_is_founder boolean;
begin
  if p_user_id is null
    or p_weight < 1 or p_weight > 100
    or p_reserved_cents < 0 or p_reserved_cents > v_weekly_budget_cents then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid-request',
      'reset_at', null,
      'reservation_cents', 0
    );
  end if;

  select exists (
    select 1
    from public.founder_admins
    where user_id = p_user_id
  ) into v_is_founder;

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

  if not v_is_founder and v_hour_count + p_weight > v_hour_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'hourly-limit',
      'reset_at', v_hour + interval '1 hour',
      'reservation_cents', 0
    );
  end if;

  if not v_is_founder and v_day_count + p_weight > v_day_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'daily-limit',
      'reset_at', v_day + interval '1 day',
      'reservation_cents', 0
    );
  end if;

  if not v_is_founder and p_reserved_cents > 0 then
    insert into public.ai_beta_spend_buckets (week_start, reserved_cents)
    values (v_week, 0)
    on conflict do nothing;

    select reserved_cents into v_reserved_cents
      from public.ai_beta_spend_buckets
      where week_start = v_week
      for update;

    if v_reserved_cents + p_reserved_cents > v_weekly_budget_cents then
      return jsonb_build_object(
        'allowed', false,
        'reason', 'weekly-budget-limit',
        'reset_at', v_week + interval '1 week',
        'reservation_cents', 0
      );
    end if;
  end if;

  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = p_user_id and bucket_kind = 'hour' and bucket_start = v_hour;
  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = p_user_id and bucket_kind = 'day' and bucket_start = v_day;

  if not v_is_founder and p_reserved_cents > 0 then
    update public.ai_beta_spend_buckets
      set reserved_cents = reserved_cents + p_reserved_cents, updated_at = now()
      where week_start = v_week;
  end if;

  return jsonb_build_object(
    'allowed', true,
    'reason', case when v_is_founder then 'founder' else 'allowed' end,
    'reset_at', null,
    'reservation_cents', case when v_is_founder then 0 else p_reserved_cents end
  );
end;
$$;

comment on function public.claim_ai_request_v2(uuid, integer, integer) is
  'Claims an AI request with a structured refusal reason. Founder admins bypass public beta limits without consuming the shared budget.';

revoke all on function public.claim_ai_request_v2(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_ai_request_v2(uuid, integer, integer)
  to service_role;

-- Preserve the boolean contract for already-deployed callers while routing
-- them through the same founder-aware enforcement.
create or replace function public.claim_ai_request(
  p_user_id uuid,
  p_weight integer default 1,
  p_reserved_cents integer default 1
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_claim jsonb;
begin
  v_claim := public.claim_ai_request_v2(p_user_id, p_weight, p_reserved_cents);
  return coalesce((v_claim ->> 'allowed')::boolean, false);
end;
$$;

revoke all on function public.claim_ai_request(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_ai_request(uuid, integer, integer)
  to service_role;

-- Release only the unused weekly reservation. Request counts remain in place
-- so provider outages cannot be used to bypass abuse protection.
create or replace function public.release_ai_reservation(
  p_user_id uuid,
  p_reserved_cents integer
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_week timestamptz := date_trunc('week', now());
begin
  if p_user_id is null or p_reserved_cents < 1 or p_reserved_cents > 1000 then
    return false;
  end if;

  if exists (
    select 1
    from public.founder_admins
    where user_id = p_user_id
  ) then
    return true;
  end if;

  update public.ai_beta_spend_buckets
    set reserved_cents = greatest(0, reserved_cents - p_reserved_cents),
        updated_at = now()
    where week_start = v_week;
  return true;
end;
$$;

comment on function public.release_ai_reservation(uuid, integer) is
  'Returns a clearly unused AI provider reservation to the current weekly beta budget.';

revoke all on function public.release_ai_reservation(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.release_ai_reservation(uuid, integer)
  to service_role;

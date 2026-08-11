-- Generation engine Phase 0: rate-limit AI work by artifact cost instead of
-- assuming every request has the same provider/runtime footprint.
drop function if exists public.claim_ai_request(integer, integer);

create or replace function public.claim_ai_request(
  p_hour_limit integer default 20,
  p_day_limit integer default 100,
  p_weight integer default 1
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_hour timestamptz := date_trunc('hour', now());
  v_day timestamptz := date_trunc('day', now());
  v_hour_count integer;
  v_day_count integer;
begin
  if v_user is null then return false; end if;
  if p_hour_limit < 1 or p_day_limit < 1 or p_weight < 1 or p_weight > 100 then return false; end if;

  insert into public.ai_usage_buckets (user_id, bucket_kind, bucket_start, requests)
  values (v_user, 'hour', v_hour, 0), (v_user, 'day', v_day, 0)
  on conflict do nothing;

  select requests into v_hour_count
    from public.ai_usage_buckets
    where user_id = v_user and bucket_kind = 'hour' and bucket_start = v_hour
    for update;
  select requests into v_day_count
    from public.ai_usage_buckets
    where user_id = v_user and bucket_kind = 'day' and bucket_start = v_day
    for update;

  if v_hour_count + p_weight > p_hour_limit or v_day_count + p_weight > p_day_limit then return false; end if;

  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = v_user and bucket_kind = 'hour' and bucket_start = v_hour;
  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = v_user and bucket_kind = 'day' and bucket_start = v_day;
  return true;
end;
$$;

revoke all on function public.claim_ai_request(integer, integer, integer) from public;
grant execute on function public.claim_ai_request(integer, integer, integer) to authenticated;

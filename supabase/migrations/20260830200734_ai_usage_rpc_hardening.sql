-- Only the trusted Edge Function may claim AI capacity. Keeping the user ID
-- and fixed limits behind the service-role boundary prevents a signed-in
-- browser from supplying its own higher limits through the public RPC API.
drop function if exists public.claim_ai_request(integer, integer, integer);

create or replace function public.claim_ai_request(
  p_user_id uuid,
  p_weight integer default 1
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hour_limit constant integer := 20;
  v_day_limit constant integer := 100;
  v_hour timestamptz := date_trunc('hour', now());
  v_day timestamptz := date_trunc('day', now());
  v_hour_count integer;
  v_day_count integer;
begin
  if p_user_id is null or p_weight < 1 or p_weight > 100 then return false; end if;

  insert into public.ai_usage_buckets (user_id, bucket_kind, bucket_start, requests)
  values (p_user_id, 'hour', v_hour, 0), (p_user_id, 'day', v_day, 0)
  on conflict do nothing;

  select requests into v_hour_count
    from public.ai_usage_buckets
    where user_id = p_user_id and bucket_kind = 'hour' and bucket_start = v_hour
    for update;
  select requests into v_day_count
    from public.ai_usage_buckets
    where user_id = p_user_id and bucket_kind = 'day' and bucket_start = v_day
    for update;

  if v_hour_count + p_weight > v_hour_limit or v_day_count + p_weight > v_day_limit then
    return false;
  end if;

  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = p_user_id and bucket_kind = 'hour' and bucket_start = v_hour;
  update public.ai_usage_buckets set requests = requests + p_weight
    where user_id = p_user_id and bucket_kind = 'day' and bucket_start = v_day;
  return true;
end;
$$;

revoke all on function public.claim_ai_request(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.claim_ai_request(uuid, integer)
  to service_role;

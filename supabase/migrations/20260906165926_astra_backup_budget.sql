-- Owner-authorized project-wide backup allowance, independent of beta/founder limits.
-- No student content, keys, or identifying data in this ledger.
create table public.astra_backup_weeks (
  week_start timestamptz primary key,
  committed_cents integer not null default 0 check (committed_cents >= 0)
);
create table public.astra_backup_reservations (
  id uuid primary key default gen_random_uuid(),
  week_start timestamptz not null references public.astra_backup_weeks(week_start),
  reserved_cents integer not null check (reserved_cents > 0),
  settled_cents integer check (settled_cents >= 0)
);
alter table public.astra_backup_weeks enable row level security;
alter table public.astra_backup_reservations enable row level security;
revoke all on public.astra_backup_weeks, public.astra_backup_reservations from public, anon, authenticated;
grant all on public.astra_backup_weeks, public.astra_backup_reservations to service_role;

create function public.reserve_astra_backup(p_cents integer) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_week timestamptz := date_trunc('week', now() at time zone 'UTC') at time zone 'UTC';
  v_id uuid;
begin
  if p_cents is null or p_cents <= 0 or p_cents > 1000 then return null; end if;
  insert into public.astra_backup_weeks(week_start) values (v_week) on conflict do nothing;
  update public.astra_backup_weeks set committed_cents = committed_cents + p_cents
    where week_start = v_week and committed_cents + p_cents <= 1000;
  if not found then return null; end if;
  insert into public.astra_backup_reservations(week_start,reserved_cents) values(v_week,p_cents) returning id into v_id;
  return v_id;
end $$;

create function public.settle_astra_backup(p_id uuid, p_cents integer) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_row public.astra_backup_reservations;
begin
  if p_cents is null or p_cents < 0 then raise exception 'Invalid settlement'; end if;
  select * into v_row from public.astra_backup_reservations where id = p_id for update;
  if not found or v_row.settled_cents is not null then return; end if;
  -- Charge the original reservation week, even when the response crosses Monday.
  update public.astra_backup_weeks set committed_cents = committed_cents - v_row.reserved_cents + p_cents
    where week_start = v_row.week_start;
  update public.astra_backup_reservations set settled_cents = p_cents where id = p_id;
end $$;
revoke all on function public.reserve_astra_backup(integer), public.settle_astra_backup(uuid,integer) from public, anon, authenticated;
grant execute on function public.reserve_astra_backup(integer), public.settle_astra_backup(uuid,integer) to service_role;

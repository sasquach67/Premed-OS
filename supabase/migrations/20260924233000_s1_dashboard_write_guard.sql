-- S1 revision 3: stop older app versions from replacing newer cloud data.
--
-- Optimistic concurrency with two version columns that deployed apps never
-- send. PostgREST PATCH and merge-duplicates upserts assign only the request's
-- columns, so an old `{data, updated_at}` save leaves write_rev unchanged and
-- is rejected once the row is claimed. The guard never inspects `data`, so
-- gzip/text-JSON transport encodings cannot hide anything from it.
--
-- States: legacy = both NULL. Claimed = cloud_schema 1..2^31-1 AND
-- write_rev 1..2^53-1 (JavaScript's safe-integer limit). Anything else is
-- illegal, and a stored illegal state fails closed.
--
-- Adds nothing to existing rows: every row stays unclaimed, so behavior is
-- unchanged for everyone until a current app claims its own row. Never bulk
-- claim. Safe to run twice. No RLS, grant or auth change.
--
-- Rollback is out-of-band only (scripts/s1/ROLLBACK.md). Once any row is
-- claimed, dropping this trigger or these columns reopens the data loss and
-- breaks current readers: roll forward instead.

alter table public.dashboards add column if not exists cloud_schema integer;
alter table public.dashboards add column if not exists write_rev bigint;

comment on column public.dashboards.cloud_schema is
  'S1 cloud contract version. NULL with write_rev NULL = unclaimed legacy row. Never lowered or cleared once set.';
comment on column public.dashboards.write_rev is
  'S1 per-row write counter. Claimed rows accept only write_rev = previous + 1; capped at 2^53-1.';

create or replace function public.guard_dashboard_write()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  max_rev constant bigint := 9007199254740991;
  new_legacy constant boolean := new.cloud_schema is null and new.write_rev is null;
  new_claimed constant boolean := coalesce(new.cloud_schema >= 1 and new.write_rev between 1 and max_rev, false);
  old_legacy boolean;
  old_claimed boolean;
  reason text;
begin
  if tg_op = 'INSERT' then
    -- Deployed apps insert legacy rows; current apps insert a first claim.
    if new_legacy or (new_claimed and new.write_rev = 1) then
      return new;
    end if;
    reason := 'insert must be legacy (both NULL) or a first claim (write_rev = 1)';
  else
    old_legacy := old.cloud_schema is null and old.write_rev is null;
    old_claimed := coalesce(old.cloud_schema >= 1 and old.write_rev between 1 and max_rev, false);
    if old_legacy then
      if new_legacy or (new_claimed and new.write_rev = 1) then
        return new;
      end if;
      reason := 'unclaimed row accepts only a legacy write or a first claim (write_rev = 1)';
    elsif not old_claimed then
      reason := 'stored version metadata is invalid';
    elsif (new_claimed
           and new.write_rev = old.write_rev + 1
           and new.cloud_schema >= old.cloud_schema) is true then
      return new;
    else
      reason := 'claimed row requires write_rev = previous + 1 and no schema downgrade';
    end if;
  end if;

  raise exception using
    errcode = 'P0001',
    message = 'This tab is out of date. Your recent changes are still on this device. Export them, then reopen Premed OS.',
    detail = 'S1_SCHEMA_GUARD',
    hint = reason;
end;
$$;

-- The failed v1 in-document guard (never applied to production) must never
-- coexist with this one: it rejected legitimate encoded saves.
drop trigger if exists dashboards_schema_guard on public.dashboards;
drop function if exists public.guard_dashboard_schema();

drop trigger if exists dashboards_write_guard on public.dashboards;
create trigger dashboards_write_guard
  before insert or update on public.dashboards
  for each row execute function public.guard_dashboard_write();

revoke all on function public.guard_dashboard_write() from public, anon, authenticated;

-- New columns must be visible to the API before any current app reads them.
notify pgrst, 'reload schema';

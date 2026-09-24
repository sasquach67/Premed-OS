-- S1 rollback: OUT-OF-BAND ONLY. Never auto-applied; never place in supabase/migrations.
-- Read scripts/s1/ROLLBACK.md first. After any row is claimed, running this
-- reopens the old-tab data loss AND breaks every current client (they fail
-- closed without the columns). Prefer roll-forward. Needs Andy's explicit,
-- separate production approval.
begin;
drop trigger if exists dashboards_write_guard on public.dashboards;
drop function if exists public.guard_dashboard_write();
alter table public.dashboards drop column if exists write_rev;
alter table public.dashboards drop column if exists cloud_schema;
notify pgrst, 'reload schema';
commit;

-- Make the local/cloud dashboard contract reproducible and tighten the two
-- authenticated Academics RPC boundaries. This migration is intentionally
-- idempotent because dashboards predates the tracked migration history.
create table if not exists public.dashboards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboards enable row level security;

drop policy if exists "dashboards_select_own" on public.dashboards;
drop policy if exists "dashboards_insert_own" on public.dashboards;
drop policy if exists "dashboards_update_own" on public.dashboards;
drop policy if exists "dashboards_delete_own" on public.dashboards;

create policy "dashboards_select_own" on public.dashboards
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "dashboards_insert_own" on public.dashboards
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "dashboards_update_own" on public.dashboards
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "dashboards_delete_own" on public.dashboards
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.dashboards from anon;
grant select, insert, update, delete on table public.dashboards to authenticated;

drop policy if exists "Users own academic chunks" on public.academic_source_chunks;
create policy "Users own academic chunks"
  on public.academic_source_chunks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.academic_source_chunks from anon;
grant select, insert, update, delete on table public.academic_source_chunks to authenticated;

-- Usage counters are mutated only through the guarded SECURITY DEFINER RPC.
revoke all on table public.ai_usage_buckets from anon, authenticated;

revoke all on function public.claim_ai_request(integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_ai_request(integer, integer, integer)
  to authenticated;

revoke all on function public.match_academic_chunks(text, text, extensions.vector, integer)
  from public, anon, authenticated;
grant execute on function public.match_academic_chunks(text, text, extensions.vector, integer)
  to authenticated;

-- ============================================================
-- Premed Premed OS — cloud sync schema. Run ONCE in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run). Idempotent.
-- One row per user holds the entire dashboard as jsonb; RLS makes each
-- row private to its owner (the public anon key can't read others' data).
-- ============================================================

create table if not exists public.dashboards (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboards enable row level security;

drop policy if exists "dashboards_select_own" on public.dashboards;
drop policy if exists "dashboards_insert_own" on public.dashboards;
drop policy if exists "dashboards_update_own" on public.dashboards;
drop policy if exists "dashboards_delete_own" on public.dashboards;

create policy "dashboards_select_own" on public.dashboards
  for select using (auth.uid() = user_id);
create policy "dashboards_insert_own" on public.dashboards
  for insert with check (auth.uid() = user_id);
create policy "dashboards_update_own" on public.dashboards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dashboards_delete_own" on public.dashboards
  for delete using (auth.uid() = user_id);

-- Founder console authorization and critical-action audit trail.
-- The founder identity is resolved once from the verified Auth record; browser
-- code never grants access from an email string or editable user metadata.

create table if not exists public.founder_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  canonical_email text not null unique,
  created_at timestamptz not null default now(),
  constraint founder_admins_email_normalized
    check (canonical_email = lower(trim(canonical_email)))
);

comment on table public.founder_admins is
  'Server-controlled Premed OS founder identities. Never expose this table directly to browser roles.';

create table if not exists public.founder_admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_user_id uuid,
  target_email text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint founder_admin_audit_action_nonempty check (length(trim(action)) > 0)
);

create index if not exists founder_admin_audit_log_actor_user_id_idx
  on public.founder_admin_audit_log (actor_user_id);

comment on table public.founder_admin_audit_log is
  'Append-only server audit trail for destructive founder-console actions; it contains no academic content.';

alter table public.founder_admins enable row level security;
alter table public.founder_admin_audit_log enable row level security;

revoke all on table public.founder_admins from anon, authenticated;
revoke all on table public.founder_admin_audit_log from anon, authenticated;
revoke all on sequence public.founder_admin_audit_log_id_seq from anon, authenticated;

grant all on table public.founder_admins to service_role;
grant all on table public.founder_admin_audit_log to service_role;
grant usage, select on sequence public.founder_admin_audit_log_id_seq to service_role;

create or replace function public.is_founder_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.founder_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_founder_admin() from public, anon;
grant execute on function public.is_founder_admin() to authenticated;

do $$
declare
  founder_count integer;
begin
  select count(*) into founder_count
  from auth.users
  where lower(email) = 'elephon08@gmail.com';

  if founder_count <> 1 then
    raise exception 'Expected exactly one verified founder Auth record, found %', founder_count;
  end if;
end;
$$;

insert into public.founder_admins (user_id, canonical_email)
select id, lower(email)
from auth.users
where lower(email) = 'elephon08@gmail.com'
on conflict (user_id) do update
set canonical_email = excluded.canonical_email;

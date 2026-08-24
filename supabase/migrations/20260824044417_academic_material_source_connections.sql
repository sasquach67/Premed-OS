-- Optional connected-material sources are server-owned. The browser receives
-- only a sanitized connection summary through the Edge Function; it never
-- reads a provider credential table directly.
create table if not exists public.academic_material_source_connections (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google-drive')),
  folder_id text not null check (folder_id ~ '^[A-Za-z0-9_-]{8,256}$'),
  root_label text not null check (length(trim(root_label)) between 1 and 160),
  selected_at timestamptz not null default now(),
  last_checked_at timestamptz,
  connection_state text not null default 'connected' check (connection_state in ('connected', 'needs-reconnect')),
  recovery_reason text check (recovery_reason in (
    'grant-expired', 'folder-inaccessible', 'folder-empty',
    'native-document-unavailable', 'invalid-folder'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists academic_material_source_connections_user_idx
  on public.academic_material_source_connections (user_id, provider);

-- These two tables deliberately have no user policies. A service-role Edge
-- Function is the only code path that can read a credential, pending PKCE
-- verifier, or accepted remote-file token. RLS remains enabled as defence in
-- depth if direct grants are ever changed later.
create table if not exists public.academic_material_source_secrets (
  connection_id uuid primary key references public.academic_material_source_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_refresh_token text not null,
  encryption_iv text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_material_source_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null,
  folder_id text not null check (folder_id ~ '^[A-Za-z0-9_-]{8,256}$'),
  root_label text not null check (length(trim(root_label)) between 1 and 160),
  code_verifier text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists academic_material_source_oauth_states_expiry_idx
  on public.academic_material_source_oauth_states (expires_at);

-- File byte retrieval is unavailable until the local review engine has
-- accepted a proposal and has explicitly recorded this exact revision.
create table if not exists public.academic_material_source_accepted_files (
  connection_id uuid not null references public.academic_material_source_connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_id text not null,
  content_identity text not null,
  accepted_at timestamptz not null default now(),
  primary key (connection_id, file_id, content_identity)
);

create index if not exists academic_material_source_accepted_files_user_idx
  on public.academic_material_source_accepted_files (user_id, connection_id);

alter table public.academic_material_source_connections enable row level security;
alter table public.academic_material_source_secrets enable row level security;
alter table public.academic_material_source_oauth_states enable row level security;
alter table public.academic_material_source_accepted_files enable row level security;

revoke all on table public.academic_material_source_connections from anon, authenticated;
revoke all on table public.academic_material_source_secrets from anon, authenticated;
revoke all on table public.academic_material_source_oauth_states from anon, authenticated;
revoke all on table public.academic_material_source_accepted_files from anon, authenticated;

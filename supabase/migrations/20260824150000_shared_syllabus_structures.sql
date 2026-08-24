-- #56 · A deliberately isolated, structure-only anonymous sharing store.
-- It has no foreign keys to local classes, materials, grades, notes, profiles,
-- or auth.users. The only access is the server-owned Edge Function.
create table if not exists public.shared_syllabus_structures (
  id uuid primary key default gen_random_uuid(),
  institution text not null check (institution = lower(trim(institution)) and length(institution) between 2 and 160),
  course_code text not null check (course_code = upper(trim(course_code)) and length(course_code) between 2 and 32),
  term_label text not null check (term_label = lower(trim(term_label)) and length(term_label) between 2 and 64),
  section_label text not null check (section_label = lower(trim(section_label)) and length(section_label) between 1 and 32),
  units jsonb not null default '[]'::jsonb check (jsonb_typeof(units) = 'array'),
  date_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(date_facts) = 'array'),
  grade_categories jsonb not null default '[]'::jsonb check (jsonb_typeof(grade_categories) = 'array'),
  policy_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(policy_flags) = 'array'),
  public_logistics jsonb not null default '[]'::jsonb check (jsonb_typeof(public_logistics) = 'array'),
  structure_fingerprint text not null check (structure_fingerprint ~ '^[a-f0-9]{64}$'),
  independent_parse_count integer not null default 1 check (independent_parse_count >= 1),
  publish_capability_hash text not null unique check (publish_capability_hash ~ '^[a-f0-9]{64}$'),
  parent_candidate_id uuid references public.shared_syllabus_structures(id) on delete restrict,
  parsed_at timestamptz not null default now(),
  revised_at timestamptz,
  import_count integer not null default 0 check (import_count >= 0),
  correction_count integer not null default 0 check (correction_count >= 0),
  conflicts jsonb not null default '[]'::jsonb check (jsonb_typeof(conflicts) = 'array'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_syllabus_structures_scope_idx on public.shared_syllabus_structures
  (institution, course_code, term_label, section_label, expires_at)
  where revoked_at is null;

alter table public.shared_syllabus_structures enable row level security;
revoke all on table public.shared_syllabus_structures from anon, authenticated;

comment on table public.shared_syllabus_structures is
  'Anonymous #56 parsed-syllabus structure only. Source documents/text and personal study records are structurally excluded.';

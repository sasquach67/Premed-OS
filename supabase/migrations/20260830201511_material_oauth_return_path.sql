alter table public.academic_material_source_oauth_states
  add column if not exists return_to text;

alter table public.academic_material_source_oauth_states
  drop constraint if exists academic_material_source_oauth_states_return_to_check;
alter table public.academic_material_source_oauth_states
  add constraint academic_material_source_oauth_states_return_to_check
  check (
    return_to is null
    or (
      length(return_to) between 1 and 512
      and return_to like '#/academics%'
      and return_to not like '%://%'
      and return_to not like '%\\%'
    )
  );

create index if not exists academic_material_source_oauth_states_user_idx
  on public.academic_material_source_oauth_states (user_id);
create index if not exists academic_material_source_secrets_user_idx
  on public.academic_material_source_secrets (user_id);
create index if not exists shared_syllabus_structures_parent_idx
  on public.shared_syllabus_structures (parent_candidate_id);

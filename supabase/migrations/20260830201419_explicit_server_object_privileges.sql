-- Server-owned structures are intentionally absent from the browser Data API.
-- Grant the Edge Function role explicitly instead of relying on changing
-- platform default grants.
grant select, insert, update, delete on table
  public.academic_material_source_connections,
  public.academic_material_source_secrets,
  public.academic_material_source_oauth_states,
  public.academic_material_source_accepted_files,
  public.shared_syllabus_structures
to service_role;

revoke all on table
  public.academic_material_source_connections,
  public.academic_material_source_secrets,
  public.academic_material_source_oauth_states,
  public.academic_material_source_accepted_files,
  public.shared_syllabus_structures
from anon, authenticated;

-- New public-schema objects must declare their browser grants deliberately.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

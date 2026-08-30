-- Remove PostgreSQL's broader default table privileges before restoring only
-- the CRUD operations the authenticated local/cloud sync clients use.
revoke all on table public.dashboards from anon, authenticated;
grant select, insert, update, delete on table public.dashboards to authenticated;

revoke all on table public.academic_source_chunks from anon, authenticated;
grant select, insert, update, delete on table public.academic_source_chunks to authenticated;

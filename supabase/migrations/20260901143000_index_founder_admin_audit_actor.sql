-- Keep founder audit lookups and protected-user deletes efficient in production.
create index if not exists founder_admin_audit_log_actor_user_id_idx
  on public.founder_admin_audit_log (actor_user_id);

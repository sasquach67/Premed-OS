# S1 production preflight — STOPPED before apply

The production apply and one-release security-header waiver were authorized by Andy in the Claude planning conversation, verified through its visible original question answers and user message `u make codex do option b`. Andy then explicitly changed the browser to Arc in this Codex conversation. The SQL apply was conditional on the preflight matching expectations.

## Observed in Arc

- Project: `premed-os`, `main PRODUCTION`, `poichxqptuupzrkyewrq`. This matches the app .env.local project URL; no key was exposed.
- Supabase SQL Editor query: `6892c952-ec87-46c4-8d01-564b34b88c45`.
- Read-only query inspected pg_trigger, information_schema.columns, pg_proc/pg_namespace, and supabase_migrations.schema_migrations. It did not select from dashboards or any account-content table.
- Non-internal dashboard triggers: `[]`.
- S1 tracking columns (`cloud_schema`, `write_rev`): `[]`.
- S1 functions (`guard_dashboard_schema`, `guard_dashboard_write`): `[]`.
- **Unexpected:** migration history includes the eight versions below, absent from the reviewed checkout's migration directory:

| Version | Production name |
|---|---|
| 20260906230000 | null |
| 20260907010000 | null |
| 20260907030000 | null |
| 20260907060000 | null |
| 20260907070000 | null |
| 20260907090000 | null |
| 20260907185638 | study_generation_usage |
| 20260907185927 | study_usage_request_ownership |

## Outcome

Stopped at the migration-history gate as explicitly required. S1 migration NOT executed. No schema/grant/auth/RLS mutation, account-content read, account claim, production merge, or deployment. No migration-history repair or baselining is authorized by this record.

The local reviewed combined branch remained `b156d73` at preflight; freshly fetched origin/main remains `230975d`. Reconcile the unexpected history against its original SQL and deployment records before proposing continuation; do not blindly mark versions applied or replay missing migrations.

## Expected local pre-S1 files

- `20260727_d6_ai_coverage.sql`
- `20260811_generation_phase0.sql`
- `20260824044417_academic_material_source_connections.sql`
- `20260824215610_shared_syllabus_structures.sql`
- `20260830200449_cloud_sync_and_ai_hardening.sql`
- `20260830200734_ai_usage_rpc_hardening.sql`
- `20260830201130_restrict_academics_table_privileges.sql`
- `20260830201419_explicit_server_object_privileges.sql`
- `20260830201511_material_oauth_return_path.sql`
- `20260830201800_ai_usage_invoker_hardening.sql`
- `20260830211701_global_weekly_ai_budget.sql`
- `20260901021500_founder_admin_console.sql`
- `20260901143000_index_founder_admin_audit_actor.sql`
- `20260904185425_founder_ai_quota_lifecycle.sql`
- `20260906035516_academic_originals_private_storage.sql`
- `20260906165926_astra_backup_budget.sql`

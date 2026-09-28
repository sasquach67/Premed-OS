# S1 production preflight — pending authorized apply

## Follow-up after Andy's discrepancy decision

Andy selected `Yes, proceed (Recommended)` with a condition to compare the eight recorded migration statements against `codex/generation-usage`, and `Report only for now (Recommended)` for the generation timer. These answers were verified in the original Claude planning conversation. The following read-only checks ran through the same Arc SQL Editor. No production mutation followed.

- The first six versions listed below have **NULL statements**, as well as NULL names. Their historical SQL cannot be compared. Their contents remain unknown; local branch files are not proof of what actually ran.
- The final two versions each contain one recorded SQL statement. Exact byte lengths and MD5 fingerprints match the branch files at `codex/generation-usage` (`a54e54ef3a028af266b531bcbee93aa580cbe05c`):
  - `20260907185638`: 1,716 bytes; `c51fef7744670b9e88fa8ac7f16c6592`.
  - `20260907185927`: 818 bytes; `44674e03c3f3793a75b9b3ba92e3b04c`.
- Live cron metadata shows `premedos-generation-runner` active every **5 seconds**, not the branch's original 10 seconds. `premedos-generation-reaper` is active on `* * * * *`.
- All three required Vault secret **names** exist: `generation_runner_url`, `generation_runner_jwt`, `generation_runner_secret`. No secret values were queried or exposed.
- Job status counts: succeeded 1, failed 5. Task status counts: done 58, failed 5, pending 7, skipped 1. No content or identifiers were read.
- The live `dispatch_generation_work` function definition was inspected. It sends HTTP requests only for runnable tasks whose parent job is queued/running, matches the current stage, is unexpired, has attempts remaining, and has no active lease. The read-only aggregate using these same predicates returned **0**. Thus the configured timer has no runnable work at this observation; this does not disable it or prove its entire past activity.

The missing six SQL records prevent satisfying the new comparison condition literally. Claude Planning was notified and presented Andy with a separate choice to proceed using fresh live overlap/catalog checks while explicitly retaining the historical uncertainty.

### Revised authorization, verified before proceeding

Andy subsequently selected **`Yes, go ahead (Recommended)`** in the original Claude planning conversation. This answer was independently read in its visible history. It replaces the impossible exact-match condition for the six rows. Those six remain **statements NULL, applied SQL unknown**.

The replacement precondition is to rerun, immediately before applying, the non-internal dashboard trigger check, absence of both S1 columns and `guard_dashboard_write`, plus a catalog list of current generation tables and function signatures. Stop on overlap. The two exact matches and report-only timer checks above are complete. The timer remains unchanged. Arc is currently in use by Andy; execution is waiting for his availability. No S1 apply, migration-history insert, account-content access, claim, merge, or deployment has occurred.

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

## Fresh metadata preflight after Arc input handoff

Andy pasted the prepared read-only query into Arc after native automated paste failed. Codex inspected all 23 lines before clicking Run in the verified production project. The query returned 21 metadata rows. No migration has been applied yet.

- `dashboard_triggers`, `s1_columns`, `s1_functions`, and `s1_history`: all `[]`.
- Generation tables: generation_provider_capabilities, generation_stage_stats, study_generation_jobs, study_generation_tasks, study_generation_usage.
- Generation function signatures: add_generation_tasks(uuid,text,jsonb); advance_generation_stage(uuid,text,real); claim_generation_task(integer,uuid,uuid); complete_generation_task(uuid,uuid,text,jsonb,jsonb,integer,text,text,text,uuid,boolean,boolean); dispatch_generation_work(integer); generation_job_view(uuid); lease_generation_job(uuid,uuid,integer); reap_generation_work(); start_generation_job(uuid,text,jsonb,integer); subdivide_generation_task(uuid,uuid,jsonb); update_generation_job(uuid,uuid,text,text,jsonb,text,text,text,uuid,boolean,integer,integer,jsonb,jsonb,boolean). No name overlap with S1 objects.
- Migration-history fields confirmed: version text required; statements text[] and name text nullable. Other metadata fields remain untouched.
- Prepared `02-apply-S1-and-verify.sql` outside the repo for Andy to paste. It includes metadata-only stop conditions immediately before the exact reviewed SQL, the new history entry, and installation checks. Migration MD5: `26ae9611554c07b05e9f88f4248a98ad`. The six NULL historical SQL rows remain unknown and untouched.
- The deployment branch now preserves main b10a4e5; Research's approved build flag is prepared. Final tests: 298 files / 2,285 tests passed; build passed; lint zero errors (55 existing warnings); production-dependency audit zero vulnerabilities; retained-assets tests 6/6. The same five security-header failures remain under Andy's one-release waiver. No push or deployment yet.

## Priority resumption after beta23 release

Andy/Claude requested S1 before lesson batches and the notebook-list feature. The existing production authorization and one-release header waiver remain in force. Combined branch now merges main b169def through 173fdfa, preserving beta23. No production apply record exists because no apply has occurred.

Arc showed Audible on resumption; availability was requested before switching it. The next production action is a fresh catalog/overlap preflight in Arc, followed by the exact migration and history insert using the prepared reviewed-SQL wrapper. If paste remains unavailable to automation, Andy pastes the file and Codex inspects it before Run. No lesson/account data access, claims, history repair, or timer changes are authorized.

### Renewed preflight receipt — 2026-09-28T15:23:28.829386+00:00

Andy confirmed Arc was free. Codex reopened saved SQL query 4a6fcec4-1795-4fd0-b8bb-60cdc632d69d in poichxqptuupzrkyewrq main PRODUCTION and reran the metadata-only Step 1 query. It again returned 21 rows: zero non-internal dashboard triggers, zero S1 columns, zero S1 functions, no S1 migration history entry, and the same five generation tables/eleven function signatures listed above. No account rows were read. Six historical NULL-statement versions remain contents unknown.

Step 2 has not been pasted into the editor or executed. Waiting only for the previously agreed manual paste of 02-apply-S1-and-verify.sql; no renewed production approval is required. The wrapper repeats overlap checks before writes. Final combined beta23 checks passed: 298 files / 2,287 tests and build with Research enabled. No production schema change, merge to main, or S1 deployment has occurred.

## Production apply completed — 2026-09-28T15:38:58.101905+00:00

Andy confirmed `go` after pasting the prepared Step 2. Codex executed it through Arc SQL Editor in project poichxqptuupzrkyewrq, query 456d8042-c915-4b86-85cb-59e3367597d1. The supplied pasted-text attachment matches the prepared 216-line script exactly (ignoring terminal whitespace). Its transaction repeats the overlap stop conditions immediately before the reviewed migration and records only version 20260924233000.

Observed four successful installation results:
- cloud_schema integer and write_rev bigint: nullable YES, default NULL.
- guard_dashboard_write(): security_definer false, search_path=pg_catalog, body_matches true.
- dashboards_write_guard: enabled O, BEFORE INSERT OR UPDATE, executes guard_dashboard_write().
- history: s1_dashboard_write_guard, version 20260924233000, one statement, exact_sql_matches true (MD5 26ae9611554c07b05e9f88f4248a98ad).

No account-content read, real-row write/claim, history repair, or timer change was performed. Six older NULL-statement migrations remain applied SQL unknown. Installation alone does not establish protection of Andy's account; he must confirm Cloud protection: on in the released client. API verification and deployment follow.

API probe: public deployed anon credentials, GET /rest/v1/dashboards?select=updated_at,cloud_schema,write_rev&limit=0. Returned HTTP 401 / Postgres 42501 permission denied for table dashboards. This is the existing deliberate anon privilege boundary; no grant was changed. Column catalog and pg_notify verification passed, but authenticated live API selection remains unverified without an approved test session. The supplied scope does not authorize reading Andy's session or creating a production auth user. Prior authenticated PostgREST/browser acceptance remains disposable-local evidence only.

# S1 sync/schema guard — feasibility review

Reviewed September 24, 2026 by Codex Planning. Brief: `docs/dev-workflow @ 60a5617942d789da490a9396982575ed7446e790`, `premed-hq-documentation/implementation/briefs/S1-sync-schema-guard.md`. Source baseline: **5c7a3e4f1c28c3b36392815c0a63fe3c963cb225**, not the now-advanced origin/main. Review only; no implementation dispatch, database write, production migration, or release approval.

**Verdict: server enforcement is feasible and necessary for this old-client defect, but revise the brief before Andy approves it.** The principal factual correction is that an ordinary upload rejection does NOT pause account sync in 5c7a3e4. The restore contract and forward-version contract also need decisions in the brief.

## 1. Old-client rejection behavior: verified correction

`src/store/useCloudSync.ts:195-209` calls `cloudRequest`; its upload catch sets `status='error'` and the message, without calling `pauseAccountSync`. The pause at line 200 is for a zero-row CAS result; the pause at line 152 belongs to reconciliation. They are different paths.

I archived the exact 5c7a3e4 source to an isolated temporary directory and added two diagnostic tests to its existing safety harness. Both passed (40 unrelated tests skipped):

- A synthetic HTTP 400 schema rejection leaves the fake remote row **and its updated_at** unchanged, preserves the newly edited local note in the saved device cache, and exposes the error through the hook. `isAccountSyncReady` remains **true**.
- No additional attempt happens during 120 seconds without edits, including an online event. **Another store edit triggers another debounced upload attempt.** There is no idle timed retry loop for 400, but there is no global pause either.
- Old validation accepts `_schema:51` and an unknown collection. Old snapshots and subsequent local persistence omit both. The marker does not itself crash validation, but acceptance is not lossless reading.

Evidence: `/var/folders/c1/yrkl287j5hd_lmhrgtzhtgrc0000gn/T/s1-review-2x2e3t2b/src/store/useCloudSync.safety.test.ts`; run `./node_modules/.bin/vitest run src/store/useCloudSync.safety.test.ts -t 'S1 review' --maxWorkers=1` from that directory. Production source was unchanged; Supabase was mocked. This is **not** a SQL, PostgREST, browser-UI, or IndexedDB integration result. The fallback cache in this harness is localStorage. A first invocation with unsupported `--minWorkers` failed before execution; the corrected command above passed.

The visible error path exists in `src/components/layout/AppShell.tsx:145` and Settings lines 422/443. A plain local autosave label can still say Saved, accurately describing device persistence; do not require all local Saved labels to disappear. Verify the cloud indicator specifically in the browser test.

Specify a stable non-retryable error: `P0001` maps to HTTP 400, or use an explicit `PT409`. Put the useful instruction in MESSAGE because the old hook surfaces message, not HINT. Suggest exporting local edits and opening the current app, without claiming that sync is globally paused. Avoid SQLSTATE classes mapped to 5xx: `cloudRequest.ts:30-50` retries those up to four attempts, and the hook can schedule reconciliation after 60 seconds.

Drive uses `isAccountSyncReady`/`assertAccountUpload` (`useBackup.ts:47-54`), so this rejection alone does **not** disable old-client backups. Existing complete Drive snapshots are immutable (`googleDrive.ts:199+`), but a new snapshot made by that old client can still be incomplete. S1 cannot retrofit old browser code; state this limitation. New-client schema rejection should explicitly fence both uploads and backups until recovery, with export available.

## 2. Define the version contract before tolerant-reader work

Do not let carrying through a remote `_schema` claim that a client understands that schema. Two fixtures are needed:

1. Same supported schema plus an opaque future top-level key: retain it through hydration, edit, local persistence, cloud save and backup/restore.
2. A schema newer than this client supports: preserve the raw incoming document for recovery and block downgrade/mutation; do not silently stamp its higher marker onto an older client's reconstructed payload.

Top-level preservation cannot protect new fields nested inside known sections. For example, the existing store hydration reconstructs `academics` from four named fields (`store.ts:937+`). Nor does a retained top-level key protect its value against replacement with `[]` or null. Call this a **schema downgrade/top-level omission guard**, not a general no-data-loss guarantee. Require a schema bump before shipping incompatible nested data changes; define how CURRENT_STORE_VERSION relates to the cloud contract. The local envelope version and backup format version are separate existing concepts.

Unknown JSON should live in an account-scoped data container, not be blindly spread into a Zustand object that also contains actions such as update/replaceAll. Explicitly cover `DATA_KEYS`, `snapshotData`, `partialize`, merge/migration, durable checks, conflict comparison/recovery, guest/account switches, and outgoing privacy filtering. Known fields/actions must not be overwritten by opaque input. Preserve unknown keys without treating them as rendered/executable state. Maintain existing Story Bank local-only filtering; opaque future fields need a documented remote-safe contract rather than a blanket privacy promise.

“Validate known collections deeply” is broader than the current structural validator (`validateAppData.ts:1-64`). Bound it to the supported schema and this change's invariants, or list the additional validator work as scope. Do not inadvertently reject accepted legacy workspaces by turning this into an app-wide validator rewrite.

## 3. Restore/removal confirmation currently conflicts with the trigger

A UI confirmation cannot authorize an omission that the SQL trigger forbids. Restoring an old backup also cannot simply lower `_schema`.

Recommended first release: normalize supported older backups into the current schema, retain current unknown sections by default, show which **known** sections/records would change, and block unsupported future-format restore. Explicit known-section clearing can retain the section key with its legitimate empty value after confirmation. Do not offer to delete unknown collections in S1: that requires a separately designed authorized destructive path. A versioned retired-key allowlist is for schema migrations, not arbitrary user restore consent.

The current first-login and conflict-replacement writers in `accountMutationSafety.ts:132-140,241` must use the same contract, as must JSON/ZIP restore and reset. Unknown metadata roundtripping does not prove a complete backup of files referenced by unknown collections: `workspaceBackup.ts:66+` enumerates supported asset bindings. State this limit or add asset-manifest compatibility explicitly.

## 4. Trigger mechanics and coverage

- Use a per-row BEFORE UPDATE OF data trigger, a pure OLD/NEW comparison, SECURITY INVOKER and a fixed search_path; return NEW on acceptance, raise on rejection. No extra table scans, writes or RLS changes are needed. Do not return NULL for rejection: that resembles the old client's CAS-miss path.
- CAS remains useful. A nonmatching updated_at filter affects no row, so a row trigger does not fire; the client reconciles. A matching write rejected by an exception rolls back data and updated_at together. There is no updated_at-maintenance trigger in the inspected migration; the client supplies that value. Check actual installed triggers as part of release preflight.
- Check JSON root type and marker presence/type/range explicitly. Distinguish missing from JSON null; avoid casts of arbitrary strings/arrays/fractional numbers. Include legacy unmarked rows, equal/higher/lower schema, missing/null/invalid markers, omitted keys, empty values, and same-schema unrelated edits in SQL tests.
- An unmarked old-to-old update may remain allowed until a compatible client has stamped the row; this is expected. Key omission checks also work on an unmarked row containing future keys, but cannot protect incompatible changes that keep all keys.
- First inserts have no old row to protect. Confirm first-login new clients supply a valid marker; preserving legacy first inserts is a compatibility choice. ON CONFLICT DO UPDATE takes the UPDATE guard path. No current frontend delete-and-reinsert writer was found. DELETE is nevertheless allowed by current policy, so leaving deletion unchanged is an explicit limit, not protection against all possible replacement paths. Keep genuine account deletion working.
- Guest/demo work without account uploads never reaches this trigger. Test those modes locally; account setup/sign-in transitions do reach it.
- Top-level key checks avoid a recursive JSON comparison, but MB-sized JSONB can still incur detoasting/decompression and parsing/storage overhead. Do not assert negligible cost without measurement. Benchmark representative synthetic 1 MiB and larger supported workspaces with and without the trigger, including successful saves and rejection; no personal data is needed.
- Prefer an empty retired-key policy initially. If included now, bind retirement to a specific migration/version transition and test retries; a generic `new schema > old schema` exception is not a complete retirement lifecycle.

## 5. Test environment: none ready was found

Read-only environment checks found no supabase/docker/psql executable on PATH, no Docker/OrbStack/Podman app under /Applications, and no listener on default local Supabase ports 54321/54322. This does not rule out a manually configured service elsewhere, but there is no demonstrated local test stack.

The connected Supabase inventory exposes one project, `premed-os` (`poichxqptuupzrkyewrq`), ACTIVE_HEALTHY, PostgreSQL 17.6. Its branch listing contains only default `main`, the same project reference, with status MIGRATIONS_FAILED. **That is not a separate staging environment.** The branch status alone does not establish a current production outage. Do not apply test DDL there or treat a separate user in that production project as database isolation.

The brief needs an explicit test-environment prerequisite: disposable local Supabase/Postgres 17 plus PostgREST/auth integration, or an authorized separate staging project/branch. No environment was provisioned and no SQL was executed in this review.

## 6. Simpler scope and release evidence

The smallest protection for the demonstrated deployed-client defect is a server-enforced marker downgrade/missing-marker guard, installed **before** any new client writes new-schema data. The top-level omission check is reasonable defense in depth, but does not replace the marker and need not bring a retired-key framework in its first release. A client-only warning or tolerant-reader patch cannot protect tabs already running 5c7a3e4. Server-side shallow merging would conceal missing writes and cannot safely resolve intentional deletion or nested changes; keep rejection.

Separate the mandatory protection from future extensibility if that makes S1 reviewable, but do not ship T4's new data first. Carry-through is still worthwhile; it needs the explicit version, recovery and restore contract above.

Revise Done when:

1. Retain the actual old-build browser + test-account check after SQL tests. Assert equal JSONB data **and unchanged updated_at**, rather than wire-format “byte identical” (JSONB normalizes representation).
2. Specify no idle retries for the selected error status; record that old-client edits can retry and old backups are not paused. Test new clients' terminal pause behavior separately.
3. Test lost CAS races, insert/upsert, all replacement writers, two accounts, unsupported future versions, opaque same-version roundtrip, durable persistence, privacy filtering, local-only modes and restore cancellation/failure.
4. Preserve preexisting known-key emptying behavior where intentional; don't describe omitted-key checking as protection against record deletion.
5. Test migration and rollback on the test DB. Put rollback SQL outside forward auto-applied migrations, or the next migration run could immediately remove the guard. After new-schema rows exist, dropping the guard reopens the original data-loss risk; document a protected rollback/roll-forward procedure rather than treating DROP TRIGGER as a safe production recovery by itself.
6. S1 being live is a dependency, **not automatic proof** of T4 §3e or release authorization. Re-run T4's concrete old/new compatibility fixture against the deployed guard, capture the evidence, and retain its separate release approval.

## Primary references consulted

- [PostgreSQL 17 trigger behavior](https://www.postgresql.org/docs/17/trigger-definition.html): per-row execution, exception rollback, UPDATE path for upserts. These support the mechanics above; performance remains unmeasured.
- [PostgREST error mapping](https://docs.postgrest.org/en/stable/references/errors.html): P0001→400, PTxyz explicit status, and 5xx mappings. Confirm the deployed API version's behavior in the integration test.
- [PostgreSQL 17 JSON types](https://www.postgresql.org/docs/17/datatype-json.html) and [JSON functions](https://www.postgresql.org/docs/17/functions-json.html): JSONB representation and top-level inspection.
- Supabase project/branch metadata and documentation search were read-only. No account records, secrets or real workspace content were retrieved.

**Next:** Claude revise S1 with these corrections, then present the exact revised scope to Andy. No builder was dispatched by this review.

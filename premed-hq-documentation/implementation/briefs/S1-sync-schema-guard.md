# S1 · Shared sync: stop older app versions from dropping newer data

**Revision 3 (consolidated), Sep 24, 2026.** Written by Claude. It replaces the earlier in-document-marker design (revisions `60a5617` → `3cec85d`, amended at `175d896`), which local testing proved **cannot** see compressed or encoded workspaces.

**Binding reviews:**

- `goals/reviews/2026-09-24-codex-S1-sync-review.md`
- `2026-09-24-claude-S1-prepared-review.md`
- `2026-09-24-codex-S1-revision2-review.md` (this revision implements all of its A–E)
- `2026-09-24-codex-S1-revision3-review.md` (its three clarifications are folded into items 11, 14 and 15; no further objections)

**Type:** shared-system brief (`DEV-WORKFLOW.md` §4). **Builds in:** the Claude implementation tab (Codex paused Sep 24; the previous work on `codex/s1-sync-schema-guard` is reference only, and its v1 guard must be removed). **Reviewed by:** Claude. **Blocks:** any release that adds saved data (Research T4 first).

## Why

The already-deployed apps (`d60f682` live, `5c7a3e4` in stale tabs) save the whole workspace, with only the sections they know. Their save **replaces** the cloud copy and drops anything newer. The payload goes through `dashboardTransport.ts`:

- large workspaces become `{format: 'premed-os-dashboard-gzip-v1', gzip}`
- some Unicode becomes `{format, json}`
- old decoders require **exactly two** wrapper keys

So nothing inside `data` can be enforced or even seen by the database. Local acceptance (`3883610`, `implementation/evidence/S1/local-db/`) showed encoded old saves **accepted** while losing sections.

**The standard technique: optimistic concurrency with required version columns** that old writers never send. PostgREST `PATCH`, and merge-duplicates upsert, assign **only the request's columns** (PostgREST v16.2 source; see the review's references). The deployed apps send only `data` and `updated_at`.

## Server contract (SQL)

1. **Columns** on `public.dashboards`, both nullable, **no defaults, no server auto-increment**:
   - `cloud_schema int`: the cloud contract version
   - `write_rev bigint`: a per-row write counter, capped at `Number.MAX_SAFE_INTEGER` (2^53−1) in the DB and the client, with deterministic rejection at the cap
2. **Legal states:**
   - **Legacy:** both NULL.
   - **Claimed:** `cloud_schema` in 1…2^31−1 **and** `write_rev` in 1…2^53−1.
   - Anything else (half-set, zero, negative, out of range) is illegal. A stored illegal state fails closed.
3. **Trigger** on **every UPDATE** (not only `OF data`), per row, `SECURITY INVOKER`, fixed `search_path`, null-safe logic (`IS DISTINCT FROM` / predicate `IS NOT TRUE`):
   - **Legacy → legacy** (both still NULL): allowed. This is today's behavior for unclaimed rows.
   - **Legacy → claimed:** allowed only with `write_rev = 1` and a valid `cloud_schema`.
   - **Claimed → claimed:** allowed only with `NEW.write_rev = OLD.write_rev + 1` **and** `NEW.cloud_schema >= OLD.cloud_schema`.
   - **Claimed → anything else**, including metadata-only unclaim or downgrade, or an old `{data, updated_at}` PATCH (which leaves `write_rev` unchanged): **rejected**.
   - Rejections raise `P0001`, `detail = 'S1_SCHEMA_GUARD'`, with MESSAGE "This tab is out of date. Your recent changes are still on this device. Export them, then reopen Premed OS."
   - The trigger never edits data and never returns NULL.
4. **INSERT:** a legacy insert (both NULL) stays allowed for old apps. A new-app insert must be a valid claim (`write_rev = 1`). Illegal states are rejected.
5. **What the server does NOT promise:**
   - It doesn't validate payload contents (logical keys inside gzip are invisible).
   - It rejects known-obsolete and non-conforming **writers** after claim. A conforming but buggy client, or a deliberate caller supplying a counter, can still lose data.
   - `DELETE` and reinsert stay the declared limit.
   - RLS and auth are unchanged. This is not a new authorization boundary.
6. **Migration:**
   - Adds the columns and trigger with **all rows unclaimed**, so there's no behavior change for anyone.
   - **Never claims rows in bulk.**
   - Reloads and verifies the PostgREST schema cache.
   - Can be run twice.
   - **The v1 in-document guard from earlier S1 commits is removed from the branch and must never ship.** It was never applied to production.
7. **Rollback:**
   - Out-of-band only.
   - After any row is claimed, dropping the trigger or columns reopens the loss and breaks new readers. **Prefer roll-forward and keep both columns.**
   - The invalid-marker repair runbook is rewritten for the column contract, and the old version is deleted, not left behind with wrong instructions.

## Client contract

8. **Carry row metadata everywhere, before hydration:**
   - `DashboardRow` (`supabase.ts`)
   - every select in `useCloudSync` / `accountMutationSafety`
   - the public merge/setup readers
   - `SyncBaseline` and its persisted version (`accountSyncSafety.ts:68–80`). A stale baseline without metadata triggers a fresh read, never an invented revision.
   - conflict and raw-recovery objects
   - first-login insert, device-choice replacement, normal upload, reset/restore reconciliation, account switch, and readonly/future gates
9. **Future versions are blocked early.** Read `cloud_schema` and reject unsupported future versions **before** hydration, migration, asset sync, edits or preparing a replacement. A writer declares its **own** supported version and never echoes a future one. `write_rev` belongs to one account's row and is never restored from a backup or another account.
10. **Writes:**
    - **Legacy row:** a conditional first claim, with `updated_at` = the reviewed timestamp and `cloud_schema IS NULL AND write_rev IS NULL`.
    - **Claimed row:** compare-and-set on `write_rev` (and `updated_at`), sending `write_rev + 1`.
    - **No row:** INSERT, never a blind upsert.
    - A zero-row result is ordinary concurrency and goes to **reconcile**, never to a permanent "outdated tab" pause.
    - **Lost response:** retry with the **same** attempted counter and predicate, then reread and reconcile. Never increment blindly, never resubmit stale data.
    - Confirm success from the returned server metadata.
11. **Portable version identity** (review C). Keep a logical `_schema` **inside** the decoded document as portable metadata, so local snapshots, offline reload, JSON/ZIP and Drive backups keep version identity. The SQL no longer inspects it; the **`cloud_schema` column is the server authority**.
    - **Version cases** (from the rev-3 review):
      - null column pair + no logical marker = a **legacy candidate**
      - null pair + a supported logical marker = **unclaimed versioned data** (not a mismatch by itself)
      - claimed columns require a **present, equal, valid** logical marker; a missing marker there does **not** make the row legacy, it blocks
    - On write, the two must be equal.
    - On read, if they disagree, or either says "future", block and keep the raw document for recovery.
    - Offline backups and restores use the portable gate **without** granting a claim or revision.
    - Evidenced T4 signatures are checked **before** any destructive hydration or rebuild, including the local and import paths.
    - Nothing is ever stamped down.
    - The store's migration number, the backup format and the cloud contract stay separate. (Both S1 and T4 are at store v51, so the store number can't tell them apart.)
12. **Logical preservation stays client-side** (the Part 2 opaque container, restore keeps unknown sections, no deleting unknown sections). Its tests stay.
13. **Schema-1 clients never claim T4 data** (review D):
    - A schema-1 writer must **refuse to claim** an unclaimed row showing evidenced T4 signatures: the four Research collections, or T4's nested fields.
    - Detection is bounded to those signatures. Unresolved cases fail safe, and the limits are documented.
    - **Sequencing (proposed, Andy's call):** ship the S1 client **together with T4 rebased on S1, as schema 2**, so the first claiming writer can handle Research data.
14. **Protection is proven, not assumed.**
    - Opening the app is **not** a claim, since sync can skip clean data.
    - On load, a new client with a supported unclaimed row performs an **explicit conditional claim write**.
    - **"Same content" means** the exact decoded **reviewed remote** document, changing only the justified logical `_schema` (added or upgraded) plus the row metadata and timestamp. That means:
      - all nested and opaque fields preserved
      - no implicit local replacement, defaults, migration or privacy rewrite disguised as a claim
    - Dirty local edits and reconciliation stay intact. A claim acknowledgment is **not** proof that every local edit synced.
    - Tests cover exact logical equality apart from the marker, plus the dirty-local and concurrent-write cases.
    - It shows "Cloud protection: on" (for example in Settings' sync status) **only after** the server confirms the claimed metadata. Until then, the account is exposed.
15. **Missing columns** (migration not yet applied): new clients keep edits **durably on the device** and show a clear "cloud sync unavailable/paused" state. There's **no unguarded fallback writer**. Old-app compatibility before the migration is a separate case.
16. **Transport:** `dashboardTransport.ts` is unchanged. Unicode and compression round-trips stay lossless.

## Andy's already-upgraded account

His real row holds T4 Research data and is **unclaimed**. It stays **exposed** to the live and stale apps until a **schema-2-capable** client (T4 on S1) makes a **confirmed** claim (item 14). Until then, premedos.app stays closed on his devices. **No one reads, inspects, stamps or repairs his row.** Everything is designed and verified with **synthetic** T4 fixtures.

## Acceptance (local disposable stack only)

- **Real PATCH and a synthetic merge-upsert** omitting the columns, sending NULLs, and sending defaults. Upsert is tested synthetically only; the deployed apps don't use it.
- **Races:**
  - legacy → claimed vs an old writer
  - two new writers
  - competing inserts
  - lost response with retry
- **Gates and bounds:**
  - an unsupported future `cloud_schema` blocked before hydration
  - metadata-only downgrade or unclaim rejected
  - malformed stored states
  - the safe-integer cap
- **Real browsers:** both old builds (`d60f682`, `5c7a3e4`) and the current build. Resolve the prior "Failed to fetch" first. Cover every bare / gzip / text-JSON combination, on claimed and legacy rows.
- **Portable identity:** a future-data block that survives reload and restore (JSON/ZIP/Drive).
- **Synthetic unmarked T4 row:** the schema-1 client refuses to claim it; a schema-2 client claims it and keeps the nested fields.
- **Claim proof:** the protection status appears only after server confirmation.
- **Cleanup:** containers stopped, volume removed or kept per the runbook.
- **Final full `npm test`, build and lint** on the final revision.
- The earlier bare-SQL measurements and old hooks **don't count** as Revision 3 acceptance. Re-run the benchmark with the new trigger.

## Must not

- Change RLS, auth, other tables, or add bulk claims.
- Read or write any real account row, or run any repair.
- Apply SQL to production, merge or release.

## Andy decisions

1. ✅ **Decided ("Yes, allow")**, override scope: add **two columns** (`cloud_schema`, `write_rev`) to `public.dashboards`, the trigger, and the matching client readers/writers/baselines/portable-version changes. This replaces the earlier override ("trigger + `_schema` marker"), which is now superseded.
2. ✅ **Decided ("Yes, together (Recommended)")**, sequencing: ship S1's client **together with T4** (schema 2), so the first claiming writer handles Research data. *Recommended.*
3. **Production apply** stays a later checklist that needs your yes.

## Approvals (Revision 3)

| Date | Chat | Andy's exact answers (selected options) | Brief revision | Covers |
|---|---|---|---|---|
| Sep 24, 2026 | Claude planning (session 429b1fa7) | **"Yes, allow"** to adding two tracking columns plus the guard rule and matching app code, tested only on the throwaway database on his Mac. **"Yes, together (Recommended)"** to shipping S1's client together with Research T4. | `1ec9eb7` (Revision 3 + the rev-3 clarifications) | **Building Revision 3** in the Claude implementation tab: the two columns, the trigger, and all client paths (items 1–16), with acceptance **only** on the disposable local Supabase (Docker Desktop). The override covers exactly this scope. **Sequencing:** the S1 client ships together with T4 rebased as schema 2. **Not:** production SQL, any real-row read or write, repair runbook execution, merge or release. |

## History (limited to their revisions)

| Revision | What Andy approved | Status |
|---|---|---|
| `3cec85d` | "Approve build": Parts 1+2 (in-document marker guard), tested locally. Override: "Yes, allow it" (trigger + `_schema` marker). Test DB: "On my Mac (Recommended)". | **Superseded.** The design failed local acceptance (encoded payloads). The test-DB-on-Mac decision still stands. |

## Next stage

After Andy approves this revision: the S1 task rebuilds against it (removing the v1 guard), runs local acceptance, then Claude reviews. T4 rebases on S1 as schema 2. Then one combined release brief, with the production-apply checklist and Andy's confirmed-claim check.

## Build report (Revision 3)

**Built by** the Claude implementation tab, Sep 24–27, 2026, on branch `s1/sync-guard-r3` from `origin/main` `d60f682`. Approval verified in the planning session's own transcript ("Yes, allow", "Yes, together (Recommended)"). Nothing merged, pushed, deployed or applied to production. No real account row was read or written.

**Commits**

| Commit | What |
|---|---|
| `94ae8e2` | docs: pin this brief (from `docs/dev-workflow` `874b40c`) and its four binding reviews |
| `af7356c` | SQL: `supabase/migrations/20260924233000_s1_dashboard_write_guard.sql` (items 1–7) |
| `e8821a0` | client: row metadata, gates, claim, compare-and-set, missing-column fail-closed, protection status (items 8–16) |
| `3ab55c5` | typecheck fix in `cloudClaim` (caught by `npm run build`) |
| `7cf5bbc` | acceptance harness `scripts/s1/` (README, ROLLBACK.md) |
| next commit | harness check fixes (browser only) + evidence `implementation/evidence/S1-r3/` + this report |

**How each item was met**

- **1–4 (server):** nullable `cloud_schema int` and `write_rev bigint`, no defaults. `guard_dashboard_write()` is `SECURITY INVOKER` with `search_path = pg_catalog`. The trigger runs `BEFORE INSERT OR UPDATE ... FOR EACH ROW`, is null-safe, and never edits data or returns NULL. Legal states and transitions are exactly as the brief lists them. Rejection raises `P0001`, `detail = S1_SCHEMA_GUARD`, with the brief's message; `hint` carries the reason.
- **5:** the limits stand as written. DELETE is still allowed (tested). A metadata-only write that follows the counter (+1, no downgrade) is accepted, because it is a conforming write. That is tested and documented.
- **6:** the migration claims no row. It is idempotent: `if not exists`, `create or replace`, and drop-then-create for the trigger. It drops the never-shipped v1 trigger/function if present and ends with `notify pgrst, 'reload schema'`. The v1 guard is not on this branch.
- **7:** `scripts/s1/rollback.sql` is out-of-band. `scripts/s1/ROLLBACK.md` prefers roll-forward and contains the column-contract repair runbook (rehearsed in SQL section H). The old marker runbook was never carried over.
- **8:** a single module `src/store/dashboardRows.ts` covers the select, parse, read and write paths. Its users:
  - `useCloudSync` (reconcile, push)
  - `accountMutationSafety` (first login, device-choice replacement, conflict review)
  - the public readers `MergeGate`, `MergePage` and `FirstLoginSetupPage`

  `SyncBaseline` carries `claim` under `sync-baseline:v2`; v1 is still written for older tabs. A baseline without metadata forces a fresh read before any write.
- **9, 11:** `assertSupportedRemote` implements the rev-3 cases:
  - legacy candidate
  - unclaimed versioned
  - a claimed row with a missing or unequal marker blocks
  - a future version in either place blocks

  All of these run before hydration. A block keeps the raw cloud copy for download and fences edits, uploads and Drive. The portable `_schema` stays inside the document for local, JSON/ZIP and Drive paths. `CURRENT_CLOUD_SCHEMA = 1` is separate from store v51.
- **10:** INSERT is a first claim. On a legacy row, the claim is conditional on its `updated_at` with both columns NULL. On a claimed row, the write is compare-and-set on `updated_at`, `cloud_schema` and `write_rev`, sending +1. A zero-row result means reconcile, never an out-of-date pause. A lost response is retried with the same counter and predicate, then confirmed only by rereading the exact attempted revision. A `23505` conflict gets the same treatment. Success comes from returned server metadata.
- **12:** the Part 2 opaque container, restore-keeps-unknown and restore review are ported from `codex/s1-sync-schema-guard`, with their tests.
- **13:** bounded T4 signatures are the four Research collections plus `research`, `estimatedHoursDeletedAt`, `thoughts`, `parentDeletedAt` and `bio`, found in live collections, Trash and the recovery stack. They are refused while `CURRENT_CLOUD_SCHEMA < 2`, in cloud, local-load and import paths.
- **14:** on load, an unclaimed supported row gets an explicit claim of exactly the decoded reviewed document plus `_schema`. The baseline is rebased only if it matched the reviewed revision; dirty local edits stay dirty. Settings shows "Cloud protection: on" only from server-returned claimed metadata.
- **15:** missing columns (`42703`/`PGRST204`) produce "Cloud sync is paused … changes are saved on this device". There is no writer, no Drive, and a re-read every 60 s.
- **16:** `dashboardTransport.ts` is unchanged.

**Checks** (evidence index: `implementation/evidence/S1-r3/README.md`)

| Check | Result |
|---|---|
| `npm test` (one clean full run, code at `3ab55c5`, which equals `7cf5bbc` for `src/`) | 289 files, 2188 tests pass |
| `npm run build` | pass |
| `npx eslint .` | 0 errors (warnings only; the changed areas match the `d60f682` warning count) |
| SQL matrix | 54/54 |
| Repeat-apply, rollback rehearsal | pass |
| Benchmark (3 runs, 1/4 MiB) | no consistent guard cost; old-writer rejection 0.3–5 ms |
| Real PostgREST HTTP | 23/23: deployed shapes; synthetic merge-upsert omitted/NULL/`missing=default`; two concurrent writers; lost response; claim vs old writer ×12 (both orderings seen, both safe); competing inserts; RLS isolation |
| Actual sync code, deployed `d60f682` | 20/20: every bare/gzip/text-JSON stored × written pair. On claimed rows: 400 P0001, row unchanged, edit kept on device, no idle retry. On legacy rows: today's behavior. |
| Actual sync code, stale `5c7a3e4` | 20/20 (same) |
| Actual sync code, this branch | 23/23 + missing-columns 1/1: claim of exactly the reviewed document in every encoding, write_rev 2 after edits, future-version block, T4 refusal, exact nested-field claim, lost response confirmed once |
| Headless Chrome, production builds of all three | 21/21. Old builds on claimed rows show "This tab is out of date…", row unchanged, edit durable after reload. This branch claims on open, shows "Cloud protection: on", keeps encoding and unknown sections, blocks a future version and T4 data, and never shows protection without a confirmed claim. |

**Found during acceptance**

- The earlier "Failed to fetch" in S1 browser runs is the app's own CSP. `index.html` allows `connect-src` only to `*.supabase.co` and sets `upgrade-insecure-requests`, so no local build can reach a loopback API. Browser fixtures patch their copied `index.html` for `127.0.0.1:55431` only. The app's CSP is unchanged.
- After a reload with unsynced edits, the deployed app routes to its existing "You've got work on this device" review. This is existing behavior, not S1; the edit is intact in device storage.
- Docker Desktop quit mid-run on Sep 24. Codex reopened it on Sep 27. Drift re-checked: `origin/main` and the live release are still `d60f682`.

**Gaps and holds (named per DEV-WORKFLOW's final-deploy rule; none are skipped by it)**

1. **Research T4 as cloud schema 2 (required before release).** "A schema-2 client claims an unmarked T4 row and keeps the nested fields" cannot run until T4 is rebased on S1 with `CURRENT_CLOUD_SCHEMA = 2` and its keys added to `KNOWN_WORKSPACE_KEYS`. Tested now: the schema-1 refusal, and that a claim sends exactly the reviewed document, including unknown nested fields.
2. **Review:** Claude planning review of this build, plus Codex Planning's read-only contract review.
3. **Production-apply checklist:** needs Andy's explicit yes. Not written or run here.
4. **Andy's confirmed-claim check** on his real account, after the combined S1+T4 release. His row stays unclaimed and exposed until then; keep premedos.app closed.
5. **Stale local store v51.** Both S1 and T4 are at v51, which T4's rebase must resolve.
6. **Browser portable restore.** The "future block survives restore" check is covered by unit tests only: `readJsonFile`, `prepareWorkspaceBackup`, `createWorkspaceBackup` and the Drive restore path. No browser file-upload run was done.
7. `supabase/schema.sql` (the run-once file) does not include the two columns. The tracked migration is authoritative.

**Next stage:** review, then T4 rebase as schema 2 (separate follow-up), then the combined release brief with the production checklist.

### Build report addendum: review fixes and combined schema-2 acceptance (Sep 27–28)

**Final S1 revision: `4076ebd`** (runtime last changed at `ed6acff`). **Combined acceptance revision: `8dd37c6f`** (`codex/s1-research-r3`). Evidence index: `implementation/evidence/S1-r3/final-4076ebd/README.md`, with real logs for test, build and lint.

**Fixes from Codex review**

| Commit | Finding | Fix | Proof |
|---|---|---|---|
| `6e01440` | P2: `syncContent` included `_schema`, so every `d60f682` baseline mismatched and upgrades paused as false conflicts | marker left out of content identity; digests byte-identical to `d60f682` | fixture digest computed by the actual `d60f682` code; both upgrade cases fail on the previous code; two-sided changes still pause |
| `6e01440` | P2: a workspace section named `digest` could become the trusted baseline | workspace data always hashed; separate `rebaseSyncBaseline` | regression fails on the previous code |
| `b82692d` | browser runner exited 0 on failures | exit 1 on any failed or zero-scenario run | both paths verified |
| `ed6acff` | reload paused sync ("differs from its saved copy") for any workspace hydrated from a bare JSONB row; **pre-existing on `d60f682`** | `sameJson`: logical equality, ignoring object-key order only | regression fails on the old comparison; real-API reload passes; `d60f682` reproduction recorded |
| `4734662` | `ROLLBACK.md` repair could recreate an old compare-and-set tuple | fresh `updated_at`, null-safe predicate on all metadata, exactly one row | SQL section H: stale pre-repair tuple matches 0 rows |

Also:
- `fff440a`: lint ignores the fixture copies.
- `fbc879c`: merges `origin/main` `230975d`. A merge, not a rebase, keeps reviewed IDs valid under the integration branch.

**Final checks at `4076ebd`**

| Check | Result |
|---|---|
| `npm test` | 2212 / 2212 (290 files) |
| `npm run build` | pass |
| `npx eslint .` | 0 errors |
| SQL matrix | 57 / 57 |
| schema-1 client, real API | 25 passed |
| Chrome, production build | 10 / 10 |

**Combined schema-2 acceptance at `8dd37c6f`**

| Check | Result |
|---|---|
| hooks | 5 / 5 |
| Chrome | 3 / 3 |

The combined runs covered an unmarked synthetic T4 row with all four collections and the nested `research`, `estimatedHoursDeletedAt`, `thoughts`, `parentDeletedAt` and `bio` fields, in bare, gzip and text-JSON storage:
- the first claim is exactly the decoded reviewed document plus `_schema: 2`;
- "Cloud protection: on" is shown;
- the next save goes to `write_rev` 2 with every T4 value kept;
- a reload opens with no review.

A schema-1 row is upgraded to schema 2 by the next save. The schema-1 client at `4076ebd` refuses a schema-2 Research row (hooks and browser). Pre-S1 guarded-write evidence for `d60f682` and `5c7a3e4` stands unchanged.

**Gaps and holds that remain.** The final-deploy rule skips none of them.
1. Andy's yes on the production database checklist.
2. Production security headers: `verify-production-security.mjs` fails all 5 headers on premedos.app. Codex observed this; I didn't re-run it. It's a separate release blocker.
3. Final reviews: the Claude planning chat and Codex parent.
4. Andy's confirmed-claim check on his real account after the combined release. Keep premedos.app closed until then.
5. Browser-level restore of a future-version file is covered by unit tests only.
6. `supabase/schema.sql` doesn't list the two columns; the tracked migration is authoritative.

Nothing was merged to `main`, deployed, or run against production.

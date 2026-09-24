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

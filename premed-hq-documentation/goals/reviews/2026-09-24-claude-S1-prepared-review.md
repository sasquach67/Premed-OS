# S1 prepared implementation: Claude's review

**Reviewed:** `codex/s1-sync-schema-guard` @ `f345176` (base `d60f682`), against S1 brief `3cec85d` (approved). Sep 24, 2026. This is a code review of the prepared parts. **Database acceptance (containers, SQL, auth, rollback, benchmarks, real old-browser runs) is still pending**, waiting on Andy's Docker Desktop.

**Verdict:** the design matches the brief. There are five findings. Two need action before DB acceptance, one needs action when T4 integrates, and two are small.

## Matches the brief (read in code)

- **Migration `20260924160447_s1_dashboard_schema_guard.sql`:**
  - `BEFORE UPDATE OF data`, per row, `SECURITY INVOKER`, `search_path = pg_catalog`
  - explicit object/number/range/integer gates before any cast
  - rejects a missing/lowered/invalid incoming marker once the stored row is marked
  - rejects any dropped top-level key
  - `raise` with `P0001` and the agreed MESSAGE (`detail = 'S1_SCHEMA_GUARD'`); never returns NULL, never edits
  - the NULL `old_version` comparison evaluates false as intended
- **Rollback** is out-of-band in `scripts/s1/rollback.sql`, with the maintenance-window warning.
- **Client:**
  - `CURRENT_CLOUD_SCHEMA = 1`, independent of store and backup versions
  - `DATA_KEYS = KNOWN_WORKSPACE_KEYS`, one list, no drift
  - unknown top-level data is kept in `workspaceOpaque`, not spread into store actions
  - `prepareWorkspaceData` refuses a higher marker **before** stamping, so a higher marker is never stamped onto an older document
  - restore keeps current opaque sections and blocks future-format input
  - `isSchemaGuardError` recognizes the guard by code + detail

## Findings

1. **Deployed revision: now known (action before DB acceptance).** `https://premedos.app/release-assets.json` lists **`d60f682` first** and `5c7a3e4` second (checked Sep 24). Production has moved to `d60f682`.
   - The old-client browser test must use **`d60f682` as the deployed build**.
   - Keep `5c7a3e4` too, since tabs opened before today's deploy may still be running it.
   - `d60f682` touches no sync, store or validation files, so identical behavior is expected. Record both.
2. **One clean full-suite run (action before acceptance).** The report says the broad run had assertion, timeout and worker failures that were handled in bounded reruns. Acceptance needs **one clean `npm test` invocation** on the final revision, or a named, reproduced explanation for any failure that exists on `d60f682` without S1.
3. **T4 integration (record now; act at T4 rebase/release):**
   - When T4 rebases onto S1, its four collections go into `KNOWN_WORKSPACE_KEYS`.
   - **T4 also adds nested fields inside known collections:**
     - `thoughts`, `parentDeletedAt` on hour entries
     - the `research` extension and `estimatedHoursDeletedAt` on experiences
     - `bio` on Person
   - An S1-era client that edits one of those records could drop those fields.
   - Per S1's own contract (item 1: nested incompatible changes require a bump), **T4's release must set `CURRENT_CLOUD_SCHEMA = 2`**, so S1-era clients are blocked rather than dropping fields. This goes into T4's release brief.
4. **Migration re-runnability (small).** `create trigger` has no preceding `drop trigger if exists dashboards_schema_guard on public.dashboards;`. Add it, matching the repo's other idempotent migrations (`drop policy if exists …`).
5. **A stored row with an invalid marker becomes unwritable (small; document).**
   - If a stored `_schema` is ever non-numeric, negative or fractional, every later update is rejected, forever.
   - That's correct fail-safe behavior, but the brief's recovery path should say how such a row gets repaired: an out-of-band SQL runbook in `scripts/s1/`, used only with Andy's authorization.
   - Add a SQL test showing the lock-out, so it's a known limit rather than a surprise.

## Still pending (not findings)

- DB acceptance: containers, SQL tests, PostgREST/auth, the real old/new browser run, rollback and the MB benchmark. **Waiting on Andy to start Docker Desktop.** As of this review it's installed but not running.
- Production apply: a later Andy checklist.

# S1 Revision 3: disposable local acceptance

Everything here runs against a **throwaway local Supabase** (Docker Desktop, project
`premed-s1-disposable`, API `127.0.0.1:55431`, DB `127.0.0.1:55432`). Never link this
project, never point any script at a hosted project, and never copy `.env` files in.
Every runner refuses to start unless `S1_LOCAL_CONFIRMED=yes` is set; that variable
is an operator gate, not evidence of anyone's approval.

Brief: `premed-hq-documentation/implementation/briefs/S1-sync-schema-guard.md`.
Evidence: `premed-hq-documentation/implementation/evidence/S1-r3/`.

## Start the stack

```bash
cd scripts/s1/local
PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH" npx --yes supabase@2.117.0 start
PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH" npx --yes supabase@2.117.0 status -o json
```

Save only `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` (all local) to the ignored
`scripts/s1/local/status.json`. Never print or commit them.

## Run order (from the repository root)

| Step | Command | What it proves |
|---|---|---|
| 1 | `node scripts/s1/run-local.mjs bootstrap` | Applies `supabase/schema.sql`, the authenticated grant, then the S1 migration (which also drops the never-shipped v1 guard if present). |
| 2 | `node scripts/s1/run-local.mjs sql` | The SQL matrix (`sql-tests.sql`): installation, legacy behavior, conditional claim, every rejected writer with the row proven unchanged, inserts, the 2^53 − 1 cap, illegal stored states, the repair rehearsal, and delete. Rolls back. |
| 3 | `node scripts/s1/run-local.mjs repeat-apply` | Applying twice changes no row and leaves exactly one guard. |
| 4 | `node scripts/s1/run-local.mjs rollback-check` | Rollback removes the guard and columns; roll-forward reinstalls them. Rolls back. |
| 5 | `node scripts/s1/run-local.mjs benchmark` | Guarded vs unguarded saves at about 1 MiB and 4 MiB (synthetic). Rolls back. |
| 6 | `node scripts/s1/postgrest.mjs` | Real auth + PostgREST HTTP: deployed request shapes, the claim, rejection body/status, synthetic merge-upserts (omitted, NULL, `missing=default`), two concurrent writers, lost response, claim vs old writer (×12), competing inserts, RLS isolation. |
| 7 | `node scripts/s1/hooks.mjs old-deployed`, `old-stale`, `current` | The actual `useCloudSync` + client + transport + store of each exact revision (jsdom, real local API): every stored × written encoding pair (bare / gzip / text-JSON) on claimed and legacy rows, plus current-only cases (future version, T4 refusal, exact claim, lost response). |
| 8 | `node scripts/s1/hooks.mjs current missing-columns` | Temporarily rolls the disposable DB back, proves the current client fails closed without the columns, then re-applies the migration. |
| 9 | `node scripts/s1/browser.mjs` | Headless Chrome over CDP on **production builds** of `d60f682` (deployed), `5c7a3e4` (stale tabs) and this branch: UI message, HTTP status, row state, and persistence after reload. Every request outside the local app and API is failed by CDP interception. |

Prefix each with `S1_LOCAL_CONFIRMED=yes`.

## Fixture notes

- Fixtures are `git archive` snapshots of exact revisions (committed code only) under
  the ignored `scripts/s1/.runtime/`. They share this checkout's `node_modules`. The
  lockfile is identical at `d60f682` and this branch; `5c7a3e4` has no dependency or
  sync-code difference from `d60f682`.
- **Why the browser fixtures patch `index.html`:** the production CSP allows
  `connect-src` only to `*.supabase.co` and sets `upgrade-insecure-requests`, so an
  unmodified build cannot reach a loopback API. `fetch` fails before any network
  event. That caused the unexplained "Failed to fetch" in the earlier S1 browser
  attempt. Fixture copies add exactly `http://127.0.0.1:55431` and drop the upgrade.
  The app's real CSP is unchanged.
- jsdom's `Blob` lacks `stream()`, so the hook harness uses Node's `Blob` for the gzip
  transport, as the unit tests do.

## Cleanup

Synthetic users are deleted by each runner. Stop the stack with
`npx --yes supabase@2.117.0 stop` from `scripts/s1/local`. That keeps the volume;
add `--no-backup` only if you intend to delete it.

Rollback and repair: `ROLLBACK.md`.

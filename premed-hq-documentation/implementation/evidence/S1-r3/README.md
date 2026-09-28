# S1 Revision 3: local acceptance evidence

Disposable local Supabase only (`premed-s1-disposable`: PostgreSQL 17.6, PostgREST
and auth behind Kong at `127.0.0.1:55431`, Docker Desktop 29.8.0). No hosted
project, production SQL or real account row was used. Synthetic users only, all
deleted; the database ended with 0 users and 0 rows, containers stopped, volume kept.

Code under test: branch `s1/sync-guard-r3` at `7cf5bbc`. The acceptance harness was
then adjusted at the next commit (browser checks only; no `src/` change). Old baselines:
`d60f682` (live: first in `https://premedos.app/release-assets.json`, re-checked
2026-09-27T15:35Z; `origin/main` still `d60f682`) and `5c7a3e4` (second: stale tabs).

| File | What | Result |
|---|---|---|
| `sql.txt` | SQL matrix (`scripts/s1/sql-tests.sql`) | 54/54 |
| `repeat-apply.txt` | migration applied twice | rows unchanged, one guard, v1 absent |
| `rollback-check.txt` | rollback then roll-forward, rolled back | pass |
| `benchmark.txt` | 3 runs, 1 MiB and 4 MiB | no consistent guard cost; old-writer rejection 0.3–5 ms |
| `http.txt` | real auth + PostgREST (`scripts/s1/postgrest.mjs`) | 23/23 |
| `hooks-old-deployed.txt` | actual `d60f682` sync code, 9 encoding pairs × claimed/legacy + idle-retry | 20/20 |
| `hooks-old-stale.txt` | actual `5c7a3e4` sync code, same | 20/20 |
| `hooks-current.txt` | this branch: 18 encoding cases + future block, T4 refusal, exact claim, lost response | 23/23 (+1 run separately) |
| `hooks-current-missing-columns.txt` | columns removed, fail-closed, then roll-forward | 1/1, migration re-applied, SQL re-passed |
| `browser/summary.txt`, `browser/browser-report.json` | headless Chrome on production builds of all three revisions | 21/21 scenarios |
| `browser/*.png` | deployed and stale apps showing the guard message; current app loaded/after edit; future-version block | screenshots |

Earlier bare-SQL measurements and hooks from the v1 guard (`codex/s1-sync-schema-guard`)
are not part of this evidence.

# S1 Revision 3: final evidence (Sep 27–28, 2026)

Supersedes the Sep 24–27 runs for the revisions below. Earlier files in the parent
folder (including `browser/browser-report.json`, 21/21 at `7cf5bbc`) stay as history.
Disposable local stack only; the database ended with 0 users and 0 rows, and its
containers were stopped (volume kept). No hosted project, production SQL or real
account row was used.

**Revisions**
- S1: `s1/sync-guard-r3` at `4076ebd` (runtime last changed at `ed6acff`). It merges
  `origin/main` `230975d` at `fbc879c`, a merge rather than a rebase so the reviewed
  S1 commit IDs stay valid under the Research integration branch.
- Combined S1 + Research, cloud schema 2: `codex/s1-research-r3` at `8dd37c6f`
  (contains `ed6acff`), in separate fixtures (`hooks-combined`, `web-combined`).
- Old baselines `d60f682` and `5c7a3e4`: runtime unchanged, so their earlier runs stand
  (`../hooks-old-*.txt`, `../browser/`). `hooks-old-deployed-reload-repro.txt` reran
  `d60f682` only to reproduce the reload defect.

| File | What | Result |
|---|---|---|
| `test.txt` | `npm test` at `4076ebd` | 290 files, 2212 tests, exit 0 |
| `build.txt` | `npm run build` at `4076ebd` | exit 0 |
| `lint.txt` | `npx eslint .` at `4076ebd` | 0 errors (55 warnings), exit 0 |
| `sql.txt` | SQL matrix incl. the corrected repair (fresh `updated_at`, exact predicate, stale pre-repair tuple misses) | 57/57 |
| `hooks-current.txt` | schema-1 client at `4076ebd` against the real local API: encoding pairs, future/T4/schema-2 refusal, exact claim, lost response, **save + reload with no review** | 25 passed (+1 run only in missing-columns mode) |
| `hooks-old-deployed-reload-repro.txt` | `d60f682`: the same save + reload reproduces the pre-existing false "unsaved" review | 21 passed (reproduction asserted) |
| `hooks-combined-8dd37c6.txt` | combined schema 2: unmarked T4 row (all four collections + nested fields) claimed as schema 2 exactly, saved, reloaded, in bare/gzip/text; schema-1 row upgraded by the next save | 5/5 |
| `hooks-combined-a054d407-reload-false-review.txt` | history: the failed reload that found the key-order defect | 1 failed (the finding) |
| `browser/browser-report-current.json` | Chrome, production build of `4076ebd` | 10/10 |
| `browser/browser-report-combined.json` | Chrome, production build of `8dd37c6f`: T4 claim at schema 2, protection on, save at write_rev 2 with every T4 field kept, durable after reload, per encoding | 3/3 |

Unchanged since the earlier runs, and not re-run: the server contract (`http.txt` 23/23,
`repeat-apply.txt`, `rollback-check.txt`, `benchmark.txt`) and the old-build browser runs.

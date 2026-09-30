# Account sync test evidence

Base commit: `9aa401c1f7515cc455d03b5e5786c99d44a94f72`.
Runtime: existing project dependencies; fake-indexeddb 6.2.5; mocked Supabase/PostgREST semantics; synthetic account IDs and data only.

## Observed red runs before fixes

| Command | Observed result | Signal |
|---|---|---|
| `npm test -- --maxWorkers=2 src/store/accountCopyComparison.test.ts src/store/accountCopyPresentation.test.ts src/pages/public/MergePage.test.tsx` | 6 failed, 18 passed | Hidden reordered records, spurious housekeeping display, whole-copy equality for four omitted-section differences. |
| `npx vitest run src/store/accountSyncInvestigation.test.ts` (initial four probes) | 3 failed, 1 passed | Route-only local change creates false review; focus/visibility leave stale content. Missing-IDB account restore already passed. |
| `npm test -- src/lib/academics/notebook/sharedNotebookAssets.test.ts` (initial image probes) | 3 failed, 11 passed | Rejected local reader blocks intact cloud bytes; stalled upload/read never times out. |
| Same image command after adding upload-error probes, before the upload fix | 5 failed, 16 passed | HTTP/retryability lost, pause during backoff ignored, retry-to-409 cannot reach verified readback. |

These are observed failures, not intentionally disabled or permanently failing tests. The delivered tests pass with the delivered production patch.

The initial intact-cloud test was subsequently refined to preserve existing local-first cache warming; its meaningful failure assertion (intact cloud must still verify when the local read rejects) remains. Late-reader and freshness safety controls were added after the original red run.

## Focused green checks

- Comparison/presentation/MergePage: 24 tests, 3 files.
- Image assets, account image ownership, account mutation safety, cloud hook safety: 141 tests, 4 files.
- Identity isolation, workspace persistence, persistent-storage grant checks: 39 tests, 3 files.
- Final restore/baseline/passive-refresh/race suite: 20 tests, 1 file.
- These groups overlap. Do not add their counts together.
- Identity split and IndexedDB deletion are characterization tests: they verify safe client behavior under mocked UUID decisions and externally deleted fake storage. They do not identify what the hosted Auth service or Arc actually did.

## Final gates

Final results are recorded with the delivered logs under `output/account-sync-investigation/evidence/`:

- Full suite: **315 files / 2,485 tests passed**, 70.84 seconds (`npm test -- --maxWorkers=4`).
- `npm run build`: passed; Vite reports existing large chunk warnings.
- `npm run lint`: passed with 0 errors and 55 existing warnings.
- `git diff --check`: passed.
- Tests-only patch applies cleanly to the exact base (checked against a temporary Git index).
- Full patch base-application check: passed against the exact base using a temporary Git index.

An earlier build found a TypeScript control-flow narrowing issue in the new online guard. It was corrected by re-evaluating availability through a function, and the final build passed. Independent review also identified refresh cancellation and redundant image-sweep risks; the final code and tests address them, including an edit during baseline recording with a pending IDB save.

## Reproducing the failures safely

Use a disposable checkout at the base SHA, install its locked dependencies with `npm ci`, then apply `regressions-only.patch`. Run the focused commands above. The initial root failure set can be selected with:

```sh
npx vitest run src/store/accountSyncInvestigation.test.ts -t 'does not mistake route-only|refreshes an unchanged visible'
```

The tests-only patch also contains compatibility and race controls that depend on the fixes and will fail on base. To test the completed change, use a separate clean base checkout and apply `account-sync.patch`, then run:

```sh
npm test -- --maxWorkers=4
npm run build
npm run lint
```

Do not apply both patches in sequence to the same checkout: the full patch already contains the regression tests. Neither patch contains dependencies, schema migrations, auth settings, course source material or real account data.

No live Arc/Safari session, live account read/write, production release, or Supabase configuration validation was performed. React DOM tests establish synthetic rendering behavior; they are not a real-browser UI verification.

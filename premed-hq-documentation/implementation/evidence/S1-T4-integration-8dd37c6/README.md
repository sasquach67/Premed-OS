# Combined S1 / Research T4 verification

Runtime revision: `8dd37c6f5df5b39328eae7dc8029a70a2f081b36`.
Source tree: `ac34252cd1afd5051b065ed372c84964c1291083`.
Includes main `230975d`, schema 2, store 52, T4 and S1 JSONB reload fix `ed6acff`.

- `npm test -- --maxWorkers=1`: 298 files, 2,285 tests passed.
- Focused sync / Research persistence / logical JSON tests: 85 passed.
- `npm run build`: passed.
- `npm run lint`: no errors, 55 warnings.
- `git diff --check`: clean at the tested runtime revision.

These are local checks. Real API/browser acceptance uses the disposable local database and lives in the S1 evidence folder with its exact fixture revisions. Nothing here asserts a deployed release, production database migration, or confirmed protection of a real account.

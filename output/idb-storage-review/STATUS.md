# Local IndexedDB milestone — September 14, 2026

Branch: `codex/indexeddb-workspace`, based on released `b803549`. Not deployed. The broader workflow and cloud-image/complete-backup work remain unfinished.

## Automated verification

- 261 files / 1,957 tests passed with `npm test -- --maxWorkers=4` (`/private/tmp/premed-idb-final-bounded-tests.log`). An uncapped run concurrent with builds/lint had six 5-second timeouts; the bounded rerun passed without changing assertions or timeouts.
- Production build passed (`/private/tmp/premed-idb-final-build.log`). Lint: zero errors, 56 existing warnings (`/private/tmp/premed-idb-final-lint.log`). Lockfile changes add only fake-indexeddb 6.2.5 for tests.
- Covered: large metadata with a tiny localStorage write budget, staged/interrupted migration, oldest namespace interrupted after pointer activation, demo pointer before seed stamp, CAS collisions, late legacy writes, actual transaction abort after request success, failed queue, owner switch, image journal retention, real-store reload, and local durability before cloud/Drive dispatch.

## Native synthetic verification

Frozen build at `http://127.0.0.1:5274/output/idb-storage-review/index.html`, containing only synthetic records. Account key: `hq:app-data:account:synthetic-idb-qa`. No real-account migration, signout, restoration or backend upload was performed.

- 7,020,000 note characters saved with a 63-character localStorage pointer.
- A notebook edit, history, practice response, source, notes and 26,904-byte PNG survived reload. See `frozen-native-receipt.json`.
- A failed metadata commit retained prior content. Recovery download contained the committed large workspace and migration original (`frozen-recovery-check.json`). A new tab after the rejected commit reopened the saved content. The failing tab prevented reload through its before-unload protection and was retained.
- The actual production-built `index.html` opened the synthetic class and notebook, rendered its original image and source details, and accepted a manual title edit through the real editor. The manual title edit survived full-app reload. A complete notebook ZIP downloaded from the real reader preserved the title, correct class, two historical versions, notes, practice response, source and hash-verified PNG. See `full-app-export-check.json`.

The earlier live-development fixture lost synthetic visible state during hot module replacement while persistence modules were being edited. Its `native-receipt.json` is pre-HMR evidence only. The fixture lacked main's hydration gate; it now refuses to adopt defaults after failed hydration. `blockStoredWorkspace` also blocks the persistence coordinator. The final checks use frozen compiled assets, without HMR.

## Remaining scope

Cloud currently syncs workspace JSON and academic original files; notebook image bytes are not yet included. Drive currently backs up JSON only. Those references do not constitute complete cross-device image recovery. Cloud images and a versioned complete backup format require implementation, verification and a separate readiness statement. No production deployment or user class-quality validation is claimed here.

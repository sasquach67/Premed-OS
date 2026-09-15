# Local IndexedDB milestone — September 14, 2026

Branch: `codex/indexeddb-workspace`, based on released `b803549`. Local milestone committed as b155f04. Cloud images and complete backups implemented; release verification is recorded below. The broader class-quality trials remain unfinished.

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

## Cloud/complete-backup milestone — release candidate

- 266 test files / 1,977 tests passed, including Drive candidate discovery, selecting earlier verified backups, account changes, image upload/readback integrity, large complete ZIPs, and actual IndexedDB restore transaction abort after put success.
- Subsequent removal of an unused hook dependency: 2 files / 7 backup/sync tests passed and the hook linted cleanly. Integrity-error wording was made actionable and affected archive/restore tests rerun.
- Production TypeScript/build passed. Full lint had zero errors; its one newly introduced hook warning was removed (56 pre-existing warnings remain). Production dependency audit: zero vulnerabilities. Retained-release asset tests: 4 passed.
- Full compiled app, synthetic Guest only: exported a complete ZIP with an original notebook PNG and attached text file, imported it at a fresh origin, reloaded, rendered the image in the correct class, edited its title, reloaded again, and exported the edited workspace. Current/source/history/notes/progress content and both binary hashes were preserved; attached files received fresh local addresses. Evidence: `complete-backup-native-check.json`.
- Damaged ZIP rejected in Settings with an integrity error before replacement. No real account data or real cloud files were changed by QA.
- Live Supabase metadata rechecked: `academic-originals` private, 52,428,800-byte limit, authenticated CRUD restricted to `auth.uid()` as the first path folder. No policy or bucket changes required. Synthetic policy probe rolled back; no actual file upload/download was performed against Supabase or Drive.
- Independent read-only Planning review found no additional release blocker; its archive/Drive focused run passed 2 files / 6 tests.

## Explicit limits

Authenticated cross-device cloud/Drive binary round trips have not been exercised with a real account. Browser storage can still be evicted or cleared; independent complete backups remain necessary. Very old clients predating existing workspace guards cannot be retroactively fenced by this frontend change. Boot-time recovery exports preserve raw metadata copies and are diagnostic recovery files, not complete ZIP backups; unresolved storage conflicts keep editing and sync paused. Student class trials and learning-quality ratings remain separate from this storage release.

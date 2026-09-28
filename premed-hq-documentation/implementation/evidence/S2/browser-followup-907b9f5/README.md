# S2 final archive/notice behavior — local browser follow-up

**7 scenarios / 56 assertions passed** on September 28, 2026, using candidate
`907b9f5` and the same production-build, local Auth/PostgREST, headless Chrome
harness. All seven were at 375px; both themes were exercised. Source hashes and
commit correspondence are recorded beside this report.

| Case | Assertions | Observed behavior |
|---|---:|---|
| Device additions, dark | 8 | Additive notice; verified recovery before PATCH |
| Cloud additions, light | 8 | Additive notice; recovery retained before normal operation resumed |
| Device-only record deletion, light | 8 | No notice; verified recovery before PATCH |
| Cloud-only record deletion, dark | 8 | No notice; deleted record absent, prior copies recoverable |
| Cloud-only note deletion, light | 9 | No notice; note remains absent, prior copies recoverable |
| Housekeeping-only differences, dark | 8 | Matching-work notice; **0 snapshots, 0 PATCH requests** |
| Ordinary dirty device edit, light | 7 | Edit uploaded; **0 snapshots, no notice** |

The housekeeping fixture has both raw sides differing from the exact baseline,
but their authored work matches. It verifies the exceptional matching-work notice
without making a recovery-copy claim. The ordinary edit keeps the cloud equal to
its baseline and changes one existing local task. It verifies normal autosave does
not produce recovery/archive churn.

Replacement cases still verify recovery hashes and both prior task collections.
Every observed replacement PATCH is intercepted before sending while recovery
copies are read and independently hashed. The ordinary edit's PATCH is separately
expected to have no recovery snapshots. Silent cloud-to-device replacement ordering
is covered by core tests; browser recovery is checked after that resolution.

The prior `../browser/` matrix remains historical evidence: **10/94 at 674f612**,
including both-changed panels, both timestamp winners, keyboard Tab/Enter, and
divergent deletion. This follow-up supersedes its automatic-path notice/archive
expectations. It does not claim those older UI cases were rerun at 907b9f5.

Visually inspected the new dark matching-work notice and light silent-deletion
screen: readable, no horizontal overflow. The notice says only “Your saved work
matches. Sync resumed.” The deletion case has no recovery notice, while Settings
still exposes its recovery download. No screen-reader speech is claimed.

Cleanup confirmed: **0 users, 0 dashboard rows, no running disposable containers,
no S2 Chrome or preview process**. Volume kept. No production/real-account access.
The 20-routine-load and exact-byte archive deduplication cases are core test
coverage supplied by the parent task, not claims made by this browser run.

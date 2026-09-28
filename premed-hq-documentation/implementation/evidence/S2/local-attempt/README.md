# S2 local browser attempt — acceptance NOT completed

The disposable S1 stack started successfully and its bootstrap passed against
PostgreSQL 17.6, beginning with zero dashboard rows. A production fixture build
succeeded. Its first useful headless Chrome case reached real local Auth,
PostgREST, signed-in Settings, and `Cloud protection: on`.

That case did **not** pass S2 acceptance: it observed a device-add PATCH with zero
recovery snapshots and timed out waiting for the additive recovery notice. This
fixture was based on raw initial data instead of a fully hydrated workspace, and
used an invalid legacy task kanban value. Both can introduce unrelated content
changes and bypass the narrowly additive classifier. Thus this is an inconclusive
fixture result, not a verified product defect or passing acceptance. The corrected
harness uses the hydrated snapshot and `todo`, and records diagnostic differences.
Its rebuild was stopped before completion at the parent agent's request after
severe host resource contention (slow shell, Chrome, and test worker startup).

No complete matrix, theme/375px visual validation, keyboard result, or recovery
ordering assertion is claimed. The harness is in `scripts/s2/browser.mjs`; rerun
in isolation when host resources permit. It includes both addition directions,
independent additions, overlapping edits, record deletions on either side, and a
note-map deletion. Only disposable local accounts are permitted.

Cleanup was verified: **0 local users, 0 dashboard rows, no running disposable
containers, no S2 Chrome/preview/runner processes**. The Supabase volume is kept.
No hosted project or real account was accessed. The observed failed result is
retained in `inconclusive-device-add.json` with synthetic identifiers omitted.

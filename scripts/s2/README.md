# S2 disposable-local account-copy acceptance

Uses S1's existing disposable Supabase project (`scripts/s1/local`, API
`127.0.0.1:55431`) and its reviewed bootstrap. No hosted account or project is
read or modified. Start the stack using `scripts/s1/README.md`, save the three
local-only status fields to its ignored `status.json`, and run:

```sh
S1_LOCAL_CONFIRMED=yes node scripts/s1/run-local.mjs bootstrap
S1_LOCAL_CONFIRMED=yes node scripts/s2/browser.mjs
```

An optional argument filters scenarios by name. `S2_EVIDENCE_DIR` selects another
evidence output directory. Each run creates and deletes only synthetic local Auth
users; deleting them cascades their local dashboard rows. The runner closes its
headless Chrome profile and preview server. Stop the disposable stack afterwards,
keeping its volume as S1 does; do not stop unrelated containers.

The harness reuses S1's headless Chrome/CDP and Vite production-build pattern.
It copies the current working tree into ignored `scripts/s2/.runtime/browser`,
records SHA-256 source hashes and the base revision, and adds a fixture-only
bridge for setup and reading the actual store. The bridge seeds the app's own
initial-data shape, schema preparation, baseline digest, and workspace repository.
It never chooses or resolves a conflict. Actual UI/hook/transport code performs
all reconciliation and writes through local Auth and PostgREST. Fixture copies
allow only the loopback API in CSP. CDP rejects requests outside the local app/API.
No `.env` is copied; the generated bundle is checked for hosted project URLs.

Cases: device additions, cloud additions, independent additions on both sides,
cloud-newest vs device-newest selection, overlapping edits, deletions on either
side, a deleted note-map entry, and housekeeping-only differences (recent routes, last opened, calendar last sync). Requests are paused before each dashboard write
while the harness reads IndexedDB recovery records and verifies their stored
SHA-256 hashes. This tests recovery-before-replace, not just a post-write count.
Both themes are checked at 375px, with a desktop overlapping-edit case. Native CDP
Tab and Enter exercise choosing the timestamp winner; screenshots, accessible
button labels, initial collapsed differences and horizontal overflow are checked.

This is deterministic synthetic evidence. It does not establish the state of a
real account, a hosted test account, or browser assistive technology speech output.

Fixture hygiene: the baseline is cloned from a hydrated app snapshot, seeded with
complete native task defaults, and run through `migrateAll`. Before storage, the
runner asserts that another real migration changes none of the authored fields
in the baseline, device, or cloud fixture. Earlier raw seeds failed that condition
and are excluded from acceptance. `S2_REUSE_BUILD=yes` is a debugging convenience
only; do not use it for final evidence after any source or fixture change.

Latest expectations (907b9f5): additive fast-forwards retain recovery and show the
additive notice. One-sided known deletions retain recovery but show no notice.
Housekeeping-only divergence shows the matching-work notice only when both raw
sides differ from the baseline; it creates no recovery snapshot or PATCH. An
ordinary local edit over unchanged cloud uploads without an archive or notice.
The affected-case filter accepts comma-separated exact names, for example:
`device-add,cloud-add,device-delete,cloud-delete,note-delete,housekeeping-only,ordinary-device-edit`.
Use a new `S2_EVIDENCE_DIR` for follow-ups so prior evidence is preserved.

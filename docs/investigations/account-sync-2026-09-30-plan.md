# Account sync investigation

Base: main 9aa401c1f7515cc455d03b5e5786c99d44a94f72. Work occurs in an isolated checkout. No real account records, tokens, email addresses, browser storage, or hosted configuration are read.

1. Read-only map of comparison, reconciliation, mutation, image, identity and persistence code. Complete.
2. Synthetic Vitest reproduction using the existing fake-indexeddb dependency and mocked Supabase. Preserve red-run evidence separately.
3. Small client-only fixes for proven defects, with regression controls for authored differences, unknown sections, ownership changes, missing bytes and stale writes. Preserve existing localStorage fallback, signed-out operation and conditional cloud writes.
4. Review and run focused tests, full suite, build and lint. Deliver report plus patch; no merge or deployment is requested by this investigation.

Evidence boundary: source and synthetic tests can establish mechanisms, not the exact Sep 21/30 data differences, the reason Arc storage disappeared, hosted identity-linking settings, or historical bucket counts. No database, cloud protocol or auth configuration change is included. Any proposed change in those areas must be identified separately.

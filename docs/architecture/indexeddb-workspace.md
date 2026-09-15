# Durable workspace storage

Implementation branch: codex/indexeddb-workspace, based on released b803549.

## First milestone and release gate

Move the complete account/Guest workspace snapshot (including notebook metadata, history, progress and source references) into a transactional IndexedDB repository. Existing original-file and notebook-image databases remain intact. Render editing routes and start sync only after the active workspace has hydrated successfully. A save is acknowledged only after the IndexedDB transaction completes; pending writes and failures are visible.

The repository owns atomic revision checks, immutable migration originals, interrupted-cutover recovery and conflict copies. A small coordinator owns per-workspace write queues and hydrated/committed snapshots. The store and every import/sync caller use this seam instead of reading localStorage directly. Compare revisions inside the write transaction. Hash and validate before opening short transactions. No normal save mirrors the growing snapshot into localStorage.

Migration stages the original bytes and decoded snapshot together, verifies the readback, then replaces the old key with a small unsupported-format pointer. It activates only after verifying that pointer and the persisted snapshot. Restart resumes staged work only when legacy bytes or the pointer match exactly. Divergent late legacy writes are quarantined; they never silently replace IndexedDB state. Migration originals remain exportable. A failed migration leaves the original bytes or a recoverable pointer plus immutable original; it never seeds empty data.

Released guarded clients reject the unknown `premed-os:workspace:idb:v1:` format and cannot overwrite the pointer through their normal save path. Clients predating those guards cannot be retroactively controlled. The new coordinator rejects a replaced pointer and preserves both copies. Backend enforcement against old unguarded clients remains a separate cloud release consideration.

## Existing cloud and backup gaps

- Dashboard cloud sync already uses account ownership, shared conflict pause and conditional timestamp writes. Those checks must wait for local acknowledged state and verify its IndexedDB revision.
- `syncAcademicOriginals` uploads `idb://academics/...` original files, up to the existing 50 MB limit. It does not currently back up notebookAssetStore image bytes.
- Drive currently uploads AppData JSON, so image references are not a complete image backup. Cloud notebook assets and complete portable backups require separate implementation and verification.
- The asset import journal must finalize only after metadata is durably committed. Failed writes must preserve staged assets and earlier notebook/progress/history state without a destructive rollback write.

## Evidence required before cutover

Tests through the real repository/coordinator: metadata over 5 MiB with small localStorage quota; interrupted migration before/after pointer; rejected transaction; reload; changed owner/signout; two concurrent writers; late legacy writes; intact notebooks/source references/progress/history and image journal behavior. Native synthetic IndexedDB QA is separate from unit tests. No actual account conversion, signout or restore during verification. Local passing tests, production release and cross-device cloud readiness remain distinct milestones.

Transaction durability reference: https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction . Use `durability: 'strict'` and resolve on transaction completion, not request success. Browser eviction or user-cleared site data still requires independent backups; IndexedDB is not unlimited or an off-device backup.

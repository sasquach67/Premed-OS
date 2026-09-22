# Connected materials folder pilot

The pilot is opt-in at Class Center → class → Materials → Folder pilot. Existing materials and notebook imports remain accessible through Previously added materials. Connecting a folder does not import its notebook or flashcards into their study tools.

## Scope

- Start with the copied BIOL Lesson 1 trial, not the original course collection.
- One connected folder per class, with nested folders and short filenames preserved.
- Natural filename ordering; editable material types are suggestions from filenames/paths, not claims that document contents were analyzed.
- Rename, move, drag into a folder, new folder, recoverable Trash, and restore affect the connected folder.
- Notebook package internals remain intact. The enclosing package folder can move or be renamed.
- Local folder access requires a browser with File System Access and Web Locks (tested in Arc). Other devices can browse the account catalog and explicitly uploaded copies. Safari and unsupported browsers retain the existing folder/ZIP import path.
- Filesystem refresh runs on opening/focusing the view or pressing Refresh while permission is available. This is not a background filesystem daemon. External moves are shown as new paths and missing old paths, rather than guessed as renames.

## Storage and safety

- App state contains a metadata catalog only. Filesystem handles stay in owner-scoped IndexedDB; document bytes never enter the workspace JSON or localStorage.
- Catalog limit: 5,000 entries, nesting depth 20; visible list: 50 rows/page.
- Explicit Save account copies uploads sequentially to the existing private academic-originals bucket, using account/hash paths and upsert:false. Identical bytes share one uploaded object.
- 50 MiB per upload/copy operation, 64 MiB cumulative pilot upload allowance per library (including prior versions and reservations). Reservations are durable before upload. This is an application pilot bound, not a claim about the subscription's storage quota or a server-enforced account limit.
- Only explicitly opened remote previews enter a disposable IndexedDB LRU cache, capped at 32 MiB across tabs. Local originals are not cached. PDFs render one page at a time on a bounded canvas; closing destroys their worker.
- Files larger than 50 MiB can remain listed locally but cannot be copied or uploaded by the pilot. Download remains available.
- Moves copy and verify all bytes before removing sources, journal progress under .premedos/operations, check for intervening file changes, and offer resume or keep-originals recovery. Trash is inside .premedos/Trash; it is excluded from scans/uploads and has no permanent-delete control.
- Workspace/session fences and cross-tab locks stop stale-account or concurrent work. This does not add account-conflict auto-resolution.
- Existing uploaded revisions remain retained; cloud cleanup and unlimited class migration are outside this pilot.

## Verification

- Local Arc browser: connected copied trial folder; displayed 73 files in their hierarchy; opened transcript; renamed and renamed back; moved transcript to Trash and restored; reloaded and reconnected to the saved catalog; previewed PDF pages 1 and 2.
- After these operations, SHA-256 matched all 73 source files and all 73 trial copies to the existing manifest. Original class folders were unchanged.
- Automated tests cover interrupted/colliding moves (including case-insensitive filename collisions), source changes, account fences, Trash/restore, package integrity, excluded directories, suggested types, deduplicated uploads, upload reservations, failed uploads, cache bounds, wrong-account downloads, pagination, on-demand downloads, preview disposal, and bounded PDF paging.
- Cloud account upload/download requests are tested with a mocked storage transport. The existing private bucket and owner-prefix RLS were inspected read-only; an authenticated end-to-end cloud transfer has not been performed for this pilot.
- An existing calendar acceptance test was made independent of the current date: a four-week window does not always include the 15th.

## Rollback

Use Previously added materials to return to the existing app workflow. No migration or deletion of existing app materials occurs. Keep the trial folder and its .premedos recovery metadata until testing is complete. A code rollback leaves the optional metadata field unused; file contents remain in Finder.

## September 22 sync-readiness regression

Reproduced the exact “Account sync has not finished checking” folder error by mounting another sync controller after initial account verification. Settings mounted two controllers in addition to the shell; visiting it restarted reconciliation and attachment verification. The shell now owns the only production controller. Settings and the folder pilot observe its state through AccountCloudContext. Folder connection displays pending readiness and becomes available automatically; actual conflicts and session fences still block writes.

Regression coverage mounts and unmounts two Settings observers with a deferred cloud read, verifies the folder write fence remains available and only one auth subscription exists, then verifies a real sync pause still blocks it. A UI test covers pending-to-ready connection controls. These automated checks do not constitute the user's folder trial or an authenticated folder upload/download test.

## September 22 initial-check performance

The initial notebook-image pass re-read and validated the entire workspace at every asynchronous boundary. A 20-image real-coordinator regression recorded 113 full saved-workspace reads. This grows with the product of image count and workspace size; the recovered account has 200 images and approximately 24 MB of JSON.

Reconciliation now fully validates before the image batch, captures the immutable store references and acknowledged disk bytes, and checks ownership, storage health, unchanged state and pause leases at each await. It fully validates again before allowing account sync. The regression verifies all 20 images while allowing fewer than 20 full workspace reads. Mid-download edits, replaced disk data, account changes, pauses, and pending IndexedDB commits still invalidate the operation. Initial-image progress is shown in Materials and Settings. This preserves binary verification rather than skipping image checks.

## September 22 connected-folder readiness

A restored folder immediately refreshed its catalog on mount or window focus even while account reconciliation was pending. The resulting write fence raised the exact “Account sync has not finished checking” error; connected-folder action buttons also remained enabled. A UI regression reproduces that message with a remembered handle and a pending account check. The page now defers automatic refresh, disables connected-folder mutations while pending, and refreshes automatically when readiness returns. Failed checks show their actual error and a retry action, while genuine conflicts continue to require review. This change does not resolve or bypass account conflicts and does not constitute an authenticated folder upload test.

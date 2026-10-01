# Refreshing a stale merge review

## Scope

Implementation and synthetic testing only, based on `c38aeba`. This change has not been merged or deployed. The separate cached-account comparator proposal is excluded. No real account, browser profile, workspace, authentication operation, schema, protocol, or hosted configuration was accessed or changed.

The five files are `src/store/accountMutationSafety.ts`, its existing test file, `src/pages/public/MergePage.tsx`, the new `MergePage.refresh.test.tsx`, and this report. All fixtures are invented. Existing safety test bodies are unchanged.

## Problem and resulting behavior

The merge page captures device and cloud copies for review. If the cloud changes before a continuation action, the exact pre-write freshness check refuses the old review. Previously, both continuation buttons became available again but kept the same old snapshots. Repeated clicks failed, and the page could still describe its obsolete comparison as matching.

The same refusal now enters a stale-review state. Both continuation buttons stay disabled and the obsolete comparison is hidden. **Refresh review** reads new device and cloud snapshots, resets every area to **Keep my account's**, updates counts and equality wording, and requires another explicit continuation. Reading or refreshing does not flush, commit, archive, activate, upload, resolve a conflict, or mark the merge as seen.

Failed refreshes remain retryable with stale actions disabled. No refresh control is offered during a write or for uncertain completion after the server accepted a write. Those errors retain their existing handling.

## Protection boundaries

- `StaleAccountReviewError` extends `Error` with the identical existing message. It is thrown at the same exact reviewed-cloud mismatch, before archiving or writing. The comparison expression and every existing mutation guard are unchanged.
- Cached-account divergence remains a separate preserved conflict. No comparable-content relaxation or automatic conflict clearing is introduced.
- Refresh captures the authenticated identity, request generation, workspace key/epoch, local snapshot, and saved bytes. It checks them after asynchronous reads and checks the session again before publishing the review.
- Auth changes, including a change away and back to the original account, invalidate pending reads. Late results after unmount are ignored. Store subscriptions are released immediately on invalidation and when reads finish.
- Local changes during refresh, including changes to saved bytes without a corresponding memory change, cannot publish an obsolete review. A stale initial signed-out session result cannot override a newer observed sign-in.
- Fresh continuation still runs the existing ownership, durable-storage, exact freshness, opaque-section, recovery, and conditional-write guards. A second cloud change is rejected again.

## Verification

The initial real-page regression went red before implementation. The new page tests use fake IndexedDB, the real store and mutation guards, and a mocked cloud table. They cover both actions recovering, all area choices resetting, refreshed counts and equality, zero refresh writes, a second stale-cloud refusal, retryable read failure, local/workspace/auth changes, identity change-and-return, late initial reads, raw saved-copy changes, and write/uncertain-completion restrictions.

Additional mutation tests prove authored and housekeeping changes still fail the exact freshness gate with the same message and before any archive/write. Separate cases preserve generic cached conflicts and confirmed-write uncertainty. Existing safety test bodies remain intact.

Seven additional initial-load cases cover guest and demo namespaces with no session, no cloud row, and an existing cloud row, plus a different account-prefixed open workspace. Signed-out sessions still go to sign-in; a missing cloud row still goes to account setup; existing copies open an explicit review. Another account's owned workspace is intentionally refused before reading the signed-in account's cloud copy. Guest and demo device-copy sources remain accepted.

The original full suite passed **2,512 tests across 316 files**. Expanded validation of the seven additional initial-path cases, together with the separate test-only boot fix described below, passed **2,519 tests across 316 files** (`npm test -- --maxWorkers=4`) in a clean archive. Command outputs and the complete diff are recorded in the accompanying local review bundles. Neither run observes production account data.

The production build passed with a bundle-size warning. Repository lint completed with **zero errors and 55 warnings**. The changed TypeScript files pass lint without warnings, and `git diff --check` passes.

One first full-suite attempt missed an unchanged boot-recovery test's email-input readiness assertion. That test passed alone; a clean archive of the base release passed its full suite. Both logs are retained alongside the final run instead of treating the first failure as a pass. No unrelated boot code or test was changed.

Follow-up diagnosis reproduced that failure with the recovery component receiving a null auth-client mock. Concurrent resolution of two queued mock registrations can select the earlier default instead of the test's replacement. A separate test-only commit, `1eb223ec233e63ac3e666b4ab8da4ab8de25845a`, serializes those registrations. Controlled red/green and all nine boot tests passed without changing assertions, fixtures, timeouts, or runtime code. The original uninstrumented log does not prove its historical scheduling; the diagnosis is supported by the matching traced recurrence and controlled reproduction. This separate fix is not part of the five-file diff.

## Disposable browser acceptance

Fifteen production-built Chrome scenarios passed 327 checks, including both continuation actions, stale/refreshed states, every account-default choice, current counts, equality, fresh conditional-write predicates, and 375-pixel layout in both theme contexts. Native pointer input exercised the controls. Refresh preserved workspace records, ownership, merge decisions, and storage; it issued no cloud mutation. Temporary browser profiles were removed afterward.

The build used the actual app modules with an additional fixture-only bridge and loopback synthetic cloud responses. External requests were blocked, so screenshots use fallback fonts. The public layer intentionally retains its own fixed color palette; the two theme classes were explicitly supplied by the harness to check compatibility, not to claim public-route theme initialization. No hosted account, actual authentication service, or production data was exercised.

No periodic workspace writer is mounted on the merge route. Sync-status/synthetic-focus updates and a DOM-only fixture notification allowed refresh to finish on its first attempt. The latter changes a dataset marker; actual image loading or asset-cache completion was not exercised. Simulated route, activity, theme, backup-completion, and calendar-completion updates during an in-flight read caused one conservative refusal; the next attempt succeeded without writes once that update finished. A backup completion changes durable workspace bytes even though backup metadata is excluded from sync identity, so preserving that refusal honors the durable-copy fence. Continuous real edits are not promised to settle.

Exact `syncContent` includes navigation timestamps/routes, activity, theme settings, calendar caches/timestamps/errors, ordinary recovery/trash, notebook metadata, and opaque fields. It excludes the `_schema` marker, the entire backup settings object, and local-only stories with their associated private-story trash/recovery. No additional field was normalized or ignored for this fix.

## Review and release

Independent read-only review found no actionable issues in the actual diff or the stated safety boundaries. It confirmed the five-file scope, unchanged existing test bodies, excluded comparator changes, and intact mutation guards. The local review bundle records the receipt and remaining limitations. Merge and deployment are held for the separately required review and release decision; this implementation grants neither.

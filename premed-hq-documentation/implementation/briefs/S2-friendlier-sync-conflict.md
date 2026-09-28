# S2: friendlier account-copy conflicts

From Claude planning, Sep 28 2026. Andy's words are quoted verbatim.

## Why
After S1 went live, Andy hit **"Account copies need review"**: this device and the cloud held different data, and sync paused. He said: "ngl i dont feel like comparing any copies so i'lll just choose", then asked: "regular users won't have tod o thsi right? the cloud protection will mostly be hands off and it would never show up like this righ t". Claude proposed the plan below, and Andy answered **"sure"**.

The pause is correct: it replaces silent last-writer-wins data loss. But the screen asks every user to read a field-by-field diff and make an all-or-nothing choice, even when the answer is obvious.

## Established method (check the repo first, then the standard)
- **The standard approach:** compare both copies against their common ancestor (the last synced baseline). If only one side changed, **fast-forward** to it without asking, as git does with a fast-forward merge. Ask the user only when both sides changed the same thing.
- **What the app already has:** it persists a sync baseline (`accountSyncSafety.ts`, `SyncBaseline`) and a record-level comparison (`accountCopyComparison.ts`).
- **Reuse both. Don't build a new merge engine.**

## Build
1. **Superset fast path. No screen.**
   - One copy "contains the other" when every record in it exists in the other copy with identical content. One side may also add records the other lacks.
   - When that holds, keep the fuller copy automatically.
   - Save the other copy as a recovery download first, then resume sync.
   - Show a small notice: "Kept the copy with your newest work. The other copy is saved under Settings → Local data."
2. **Simple default when both changed.** Replace the diff-first screen with one short panel:
   - one line per copy: when it was last saved, plus a plain summary such as "3 notebooks and 2 Research entries only on this device"
   - a primary **Keep newest** button (the copy saved most recently), and a secondary **Keep the other copy** button
   - **See differences**, which opens today's detailed comparison and download links, unchanged
3. **Never lose the loser.** Whichever copy isn't kept is stored first as a verified recovery copy (today's mechanism). The notice says where to find it.

## Must not
- Auto-resolve when the **same record changed on both sides**, or when a record is **missing on one side** (it may have been deleted on purpose). Those cases always get the panel.
- Change the S1 guard, the write protocol, the schema or storage versions.
- Read or write Andy's real account while building or testing.
- Add new dependencies.
- Break the design foundation: tokens, lucide, both themes, 375px.

## Verify
- **Unit tests:** superset in each direction resolves silently, with a recovery copy saved first. Additions on both sides, the same record edited on both sides, and a deletion on one side each show the panel. "Keep newest" picks by saved time. The recovery copy exists before any replace.
- **Real-API fixtures:** reuse the local S1 stack harness.
- **Headless Chrome:** the panel in both themes and at 375px, keyboard and screen-reader labels, and the notice after the silent path.
- **Release:** deploy under the standing final-change rule, then report to Andy.

## Addendum (Sep 28): the save looks frozen
Andy reported the review "kinda stuck". After he chose a copy, `AccountConflictReview` shows the same **"Checking saved copies…"** label while `apply()` runs, the fieldset greys out, and there's no progress. Most of that time goes to `syncNotebookImages` uploading every notebook image before `writeDashboard`, which takes minutes for image-heavy notebooks.
- Show a distinct saving state with real progress, e.g. "Uploading notebook images: 12 of 80", then "Saving your choice…".
- If it stalls past a time limit, say so, with a safe retry. The recovery copies already exist.
- Keep the chosen radio visibly selected while it's busy.
- **Test:** 80 fixture images with a slowed repository show progress and complete. A stalled upload shows the retry message and loses no data.

## Build report (Sep 28, review candidate)

Branch: `codex/s2-friendly-conflicts`, isolated worktree from main `03543688`.

- Reused the existing baseline fingerprint and comparison module. Because the baseline has no historical records, a safe superset must have an unchanged smaller side proven against that fingerprint. With no such proof, both-side additions, competing edits and missing records go to review. Missing note-map records and opaque top-level sections also block automatic deletion. The existing four empty Research-container compatibility rules remain intact.
- Uncapped safety comparison is separate from the existing 60-item display limit. Unknown sections and ordering changes never establish a superset. Verified recovery of both copies precedes activation or upload; recovery failure remains paused.
- Review automatically prepares a compact choice panel. Tied or unavailable timestamps get explicit device/cloud choices. A protection-only claim does not make the old document appear newly edited; a claim-race reread updates the timestamp with the actual new document. Detailed comparison and existing downloads remain under See differences.
- Settings → Local data downloads verified, account-scoped recovery copies as a ZIP containing ordinary importable account JSON plus exact stored caches and recovery records. Original image/material bytes are not included, and the readme/UI say so. No storage schema, S1 write contract, guard, dependency or migration changed.
- Saving exposes actual image verification progress and the selected copy. After 120 seconds without image progress, the pre-write attempt is disposed; all late continuations are fenced before any workspace write. Retry requires a fresh comparison. Existing cloud-request timeouts still govern the subsequent save.

### Evidence status

Initial full suite before the final edge-case/addendum fixes: 302 files / 2,314 tests passed. Initial build passed, lint 0 errors (55 existing warnings), production dependency audit 0 vulnerabilities. Focused tests cover deletion, baseline ambiguity, recovery failure and download integrity; real 80-image service and stalled-continuation tests added. Final full checks and disposable-local API/Chrome acceptance are in progress, so this is not release acceptance yet.

Independent review found two issues (claim-race saved time and note-map deletion); both are fixed with regressions. No real account accessed.

The standard reference for one-sided fast-forward vs divergent histories is [Git merge](https://git-scm.com/docs/git-merge); this implementation uses the existing account baseline rather than inventing a record merge engine.

### Release gate

The live security preflight still fails five missing HTTP headers (CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options). The Sep 28 S1 waiver explicitly covered that release only. This check is unchanged. S2 remains unmerged/undeployed pending completed acceptance, planning review, and an S2 release decision on this existing hosting gate.

### Review follow-up and completed local checks

Claude identified housekeeping-only divergence as a false-conflict cause. Comparison now ignores only `meta.lastOpenedAt`, `meta.recentRoutes`, `settings.calendar.lastSyncedAt`, and the four existing empty Research defaults. Baseline fingerprints, remote payloads and persisted schema remain unchanged. Authored or unknown differences remain meaningful. Matching work archives both snapshots before resuming.

Claude also proposed restoring one-sided deletion fast-forward. This conflicts with the approved brief's explicit missing-record prohibition, so the implementation keeps that prohibition while Claude asks Andy to clarify the scope; no new approval is inferred.

Current checks: **302 files / 2,325 tests pass** in a clean full run; build passes; lint 0 errors / 55 existing warnings; dependency audit 0 vulnerabilities. Eighty distinct image assets pass through the real image service with a delayed reader; save-progress and stalled late-continuation fences are separately tested. Disposable-local browser/API acceptance is being rerun after correcting fixture normalization and stopping overlapping processes. Earlier inconclusive results remain labeled under evidence/S2/local-attempt; none counts as acceptance.

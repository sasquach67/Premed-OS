# Class notebook dates and ordering

Build receipt and deployment handoff. Claude Planning approved original implementation `164b82e`; the one-time header waiver is recorded below, and release awaits the serial handoff after exam fidelity.

## Scope and decisions

Source: `~/Documents/Premed OS Academics Audit/2026-09-27_114133/codex-prompt-notebook-list.md`, updated September 29. Built in isolated worktree `d199/premed-os`, branch `codex/notebook-list-order`, from main `26dfc90`.

The class notebook defaults to student-entered class date, oldest first. Entries without a valid class date appear last, ordered by when they were added. Rows use the class date for both the stamp and label; undated rows show a secondary “Added Sep 28” label. Import edits never become class dates or change added dates. Equal dates break ties by added time, then stable ID.

Dragging the GripVertical handle or choosing Move up / Move down sets a class's manual order. “Sort by class date” appears only in manual mode and clears it. Editing a date reorders default-mode lists while preserving manual order. New entries append after explicitly ordered entries and sort among themselves by the default rules. Menus remain reachable for imported and native entries, with keyboard alternatives, disabled boundary moves, and live announcements.

The existing `LectureRecord.order` number carries explicit order as contiguous negative ranks (`-N` through `-1`). Existing nonnegative ranks retain the new default date ordering. Reset writes nonnegative ranks. No new persisted field, migration, store version, cloud schema, dependency, import behavior, or account access is involved. Store remains v52 / cloud schema 2, leaving T4-b's v53 / schema 3 reservation untouched. Deleting the final negative-ranked entry naturally returns any remaining new entries to their existing default date order; an empty class starts in date mode.

All lecture pickers, the reader switcher, list-generated lesson numbers, and Continue studying use the shared order. A saved explicit lesson number stays part of the title; reordering does not rewrite it. Reader/switcher eyebrows no longer add a conflicting positional number. Explicitly named titles now take priority over generated title suggestions, so renaming is visible without changing generated content or metadata. Generic “Lecture N” titles retain their generated-heading fallback.

## Implementation and verification milestones

1. `catalogDate.ts`: shared date policy, stable ordering, course-local rank/reset operations; unit and persisted codec/hydration coverage.
2. `ClassHub`, `NotebookSortableList`, `LectureRecordMenu`: existing Accordion and record menu reused; handle-only dnd-kit interaction, menu moves, class dates, reset, local announcements. The standard sortable preset uses PointerSensor plus KeyboardSensor and `sortableKeyboardCoordinates`, following the existing dependency and [official dnd-kit sortable guidance](https://dndkit.com/legacy/presets/sortable/overview/).
3. `LectureCapturePanel`, notebook selectors, and `lectureLabels`: consistent ordering and student title precedence. Regression tests use synthetic records and preserve notebook original/current/history/progress.
4. Component, full-suite, build, lint, and disposable headless Chrome checks. No course files were opened or used; browser fixtures are synthetic and signed out.

## Design review

The existing notebook card, Add to notebook action, date stamp, fonts, and palette remain the foundation. Sort by class date is a ghost action; drag and overflow controls use lucide icons. New row backgrounds use `--card`, other colors use existing tokens, and reduced motion disables sorting transitions. Menus are permanently visible in notebook rows for touch discoverability. Both handle and overflow targets measure 44×44 px; the reset target is at least 44px high. Light/dark desktop and 375px screenshots are saved under `implementation/evidence/notebook-list/`; page widths and computed token values are recorded by the CDP harness.

Repeat browser check: start `npm run dev -- --host 127.0.0.1 --port 4179`, then `node scripts/qa/notebook-list-browser.mjs`. It creates and removes its own Chrome profile and never uses the user's browser/account data. It checks both themes, desktop/mobile overflow, touch target size, actual pointer drag, reload, reset, reduced motion, and the empty state. Component tests separately exercise real dnd-kit keyboard drag, menu actions, editing, and persistence.

## Validation result

- `npm test -- --maxWorkers=2`: **304 files, 2,353 tests passed**. Worker concurrency is bounded for this shared machine; every root-app test was collected. An earlier unrestricted run was stopped after resource-contention timeouts, then the full bounded run passed.
- `npm run build`: passed (existing bundle-size warnings only).
- `npm run lint`: passed, **0 errors / 55 existing warnings**. Changed/new source and the browser harness also passed targeted lint.
- `git diff --check`: passed.
- Six dedicated UI tests exercise real keyboard drag, menu moves/boundaries/announcements, reset and rehydration, imported editing in both ordering modes, Added labels, legacy generated title precedence, and explicit lesson identity in reader/switcher. Shared helper tests cover dated/undated/ties, scoped manual mode, appending, reset, codec and hydration round trips.
- Headless Chrome CDP: pointer drag and reload, reset, both themes at 1280px and 375px, zero horizontal page overflow, 44px controls, reduced-motion transition duration `0s`, and empty state passed. `browser-results.json` records measurements; four screenshots show the final list.
- Independent code review found and verified fixes for conflicting reader numbers and hidden student renames. No remaining material gap was reported in that bounded review. Claude Planning subsequently approved `164b82e`, including negative-rank behavior and both-theme/mobile screenshots.

## Planning review and pre-release refinement

Claude Planning approved `164b82e` with no blockers, including negative-rank manual mode and first-import timestamps. The optional refinement is implemented: hide “Sort by class date” in date mode and show it only after a manual move. Focused coverage checks absent → present → absent across move/reset, and the Chrome harness checks the same visibility plus real date edits before and after dragging. Screenshots and measurements have been refreshed.

One component-test timing issue was isolated to Radix's deferred menu focus restoration. The edit helper now waits one event-loop task before opening its nested date popover. No production interaction change was necessary; Chrome date edits passed, and the focused 11-test suite passed three consecutive runs after the helper correction.

Fetched and integrated `origin/main` again after approval; it remains `26dfc90`, already an ancestor of this branch. No merge/rebase conflict or version drift. Store v52/cloud schema 2 remain unchanged; T4-b's unmerged version reservation is untouched.

## Required release notes

- Named notebook titles now take precedence over AI-generated titles so your title edits appear in the list and reader.
- After dragging entries into your own order, newly added entries appear at the bottom until you choose “Sort by class date.”

## Release boundary and security-header decision

Not merged, pushed, or deployed at waiver receipt. On **September 29, 2026**, Planning verified Andy's answer in **Claude's actual planning chat UI** after Claude explicitly named both the exam-rule fix and the notebook drag/dates feature. Andy's exact answer was:

> waive for this release i guess

**Exact authorized scope:** the one-time waiver covers exam fidelity **PR #2 / `78331aa`** and notebook list **`a6605ab`** only. Planning relayed this verified decision through Codex Planning task `01a07de1-ad82-7df0-aede-00af15f1b673`. This resolves the pending notebook header question; it does not waive checks for unrelated or future releases.

The unchanged `npm run verify:production-security` check still fails on five missing headers: `content-security-policy`, `strict-transport-security`, `referrer-policy`, `permissions-policy`, and `x-content-type-options`. Its result is saved in `implementation/evidence/notebook-list/production-security.txt`. The result remains a failure covered by the scoped waiver, not a passed check. The script is not changed.

**Serial release boundary:** Academics3 releases exam fidelity first. Wait for Planning to relay its exact live revision, then integrate that new main in this isolated worktree, preserve both reviewed changes, rerun appropriate checks, and deploy notebook list under the standing rule. Do not push main concurrently or deploy before that handoff. Confirm `release-assets.json` identifies the exact deployed commit and perform live checks. Report the live SHA to Planning and Andy, and ask Andy to drag an entry and set a class date.

## Authorized serial handoff and integration

Planning relayed exam fidelity live at `7c646ee5948b696cd9f5b8123ed7217fc63f3e69` (CI/Pages run `36582764543`) on September 29 and explicitly authorized this second release. Integrated that exact main without conflicts; exam-fidelity prompt files remain byte-for-byte identical to the new main. No Research/T4-b or schema changes.

A repeat browser run exposed a mixed keyboard/pointer edge case: Motion's previously Enter-activated menu trigger emits a bubbling `pointercancel` when it blurs, cancelling a drag sensor that just started. The notebook handle now focuses on primary-button pointer capture, with `preventScroll`, before sensor activation. The regression test reproduces the prior control's blur cancellation and confirms successful pointer reorder; a negative control without early focus fails. Independent review found no blocking implication. Integrated Chrome verification again passed both themes at 1280/375, date edits before/after drag, pointer reorder, persistence, reset, reduced motion, and empty state.

The synthetic browser harness now supports the production origin with an exact expected release SHA guard, an isolated Chrome debug port/profile, and loaded-bundle hash verification. Production fixtures remain signed-out guest-only data created for this check.

Final integration validation: **304 test files / 2,356 tests passed**; production build passed; lint passed with 0 errors and 55 existing warnings; retained-assets tests 6/6; production dependency audit 0 vulnerabilities; diff whitespace check passed. The first concurrent test run overlapped the deliberate regression negative-control experiment and was discarded; the final full run used stable source files.

# Class notebook dates and ordering

Build receipt for Claude Planning review. Release is held for that review.

## Scope and decisions

Source: `~/Documents/Premed OS Academics Audit/2026-09-27_114133/codex-prompt-notebook-list.md`, updated September 29. Built in isolated worktree `d199/premed-os`, branch `codex/notebook-list-order`, from main `26dfc90`.

The class notebook defaults to student-entered class date, oldest first. Entries without a valid class date appear last, ordered by when they were added. Rows use the class date for both the stamp and label; undated rows show a secondary “Added Sep 28” label. Import edits never become class dates or change added dates. Equal dates break ties by added time, then stable ID.

Dragging the GripVertical handle or choosing Move up / Move down sets a class's manual order. “Sort by class date” clears it. Editing a date reorders default-mode lists while preserving manual order. New entries append after explicitly ordered entries and sort among themselves by the default rules. Menus remain reachable for imported and native entries, with keyboard alternatives, disabled boundary moves, and live announcements.

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
- Independent code review found and verified fixes for conflicting reader numbers and hidden student renames. No remaining material gap was reported in that bounded review. This does not substitute for Claude Planning's release review.

## Release boundary

Not merged or deployed. Send the final revision and evidence to Planning task `01a07de1-ad82-7df0-aede-00af15f1b673` for Claude review. After approval, integrate current main, complete release checks, and report the live revision. Andy's post-release check is to drag an entry and set a class date.

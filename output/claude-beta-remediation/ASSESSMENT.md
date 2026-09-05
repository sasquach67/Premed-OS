# Claude beta audit: assessment and implementation

September 5, 2026. Local branch `codex/claude-beta-remediation` in the isolated `claude-beta-remediation` worktree. Not deployed. Original dirty checkout and lecture-generation files were preserved.

## Evidence and judgment

Claude's AUDIT.md was retrieved from its signed-in desktop Code session. Claude audited cloud revision `cf266e1a` by reading source; it did not install dependencies, run the app, or prove its 16 proposed runtime checks. Its report is useful, but its severity labels are not runtime evidence. Implementation started from `c3dd249` and incorporates the scoped Academics commit `2867e7f` as `192e8c8`.

The strongest findings were broken command search, inaccessible date/tab interactions, misleading creation into reserved sections, short-lived Undo actions, and modal/focus inconsistencies. Several explanations needed correction: account creation was still reachable through another button; the Academics table freeze was an unstable filtered-array identity problem, not caused by the lack of a shared empty-state component; unimported source files remain included in TypeScript checking.

## Finding-by-finding decisions

| Claude | Decision and delivered behavior |
|---|---|
| S1 Auth tabs | Fixed Arrow Left/Right and Home/End with focus following selection. The blanket claim that keyboard users cannot create accounts was overstated. Regression and browser verified. |
| S2 Search double filtering | Disabled cmdk's second filter when supplying ranked results. Search matches record labels even when values are UUIDs. Moved dialog-only headings inside dialog content. Regression and real local-record search verified. |
| S3 Unavailable creation | Quick Add offers Task, Course, Assignment. Reserved kinds fall back to that chooser. Unavailable creation commands and record destinations are excluded. Overview capture remains usable in Activity & capture and no longer promises an available Story Bank page. Existing records are preserved. |
| S4 Destructive confirmations | Settings reset, demo reset, source-copy deletion and sign-out-everywhere use themed Radix alert dialogs. Workspace reset offers backup export and starts focus on Cancel. Existing native emergency crash recovery is retained. Unrelated library confirmations are outside this change. |
| S5 Bare-key shortcuts | Removed q, / and [. Search uses Cmd/Ctrl K; sidebar Cmd/Ctrl B; Quick Add Cmd/Ctrl Shift A. Editing, composition and open modal guards prevent shortcut interference. Help documents the replacements. |
| S6 Assignment class | Class selection is explicit and required. Missing classes have an Open Academics path. Submission validates the chosen class rather than choosing the first one. Browser verified no-class prevention. |
| S7 Reserved action destinations | Attention and Smart actions suppress unavailable destinations. Active Academics/task/system feeds continue to appear. Regression verifies a reserved clinical warning is not surfaced. |
| S8 Scroll position | Shell navigation resets the actual main scroll container on pathname change. Browser verified scrolled Settings to Overview returns to zero. |
| S9 Help overlay | Open help closes the launcher dialog. Removed the nonexistent ? shortcut claim and used a labelled 44px icon. Browser verified destination and zero remaining dialogs. |
| S10 Undo lifetime | Action toasts persist until used/dismissed; informational timers pause on hover/focus. Timer cleanup prevents orphan callbacks. Scrollable stack keeps actions reachable; it sits above the Help button instead of covering it. Undo tested after 60 seconds. |
| S11 Sidebar action | Palette invokes the shell's actual sidebar toggle through shared actions. No storage migration is required. Browser verified expanded state changes. |
| S12 Breadcrumbs | Added hidden route metadata and meaningful task/goal/class/review labels; raw goal UUIDs no longer become breadcrumbs. |
| S13 Dismissal recovery | Bulk dismissal writes once without incrementing mute counters per card. Undo restores only the still-matching dismissal, preserving subsequent actions. Settings restores dismissed suggestions, muted rules and snoozes while retaining accepted suggestions. |
| S14 Goal progress | Quarterly goal progress subscribes to courses, MCAT, experiences and hour entries used in its calculation. |
| S15 Expanded peek | Expanded mode remains a Radix modal with focus management. Escape is handled by the topmost dialog; nested discard confirmation does not collapse the parent. Split shortcut honors allowSplit. Regression verified. |
| S16 Notification handoff | Menu/palette notifications open after the previous overlay dismisses. Browser verified palette closes and notification controls receive focus. |
| S17 Reserved navigation | Preserved the approved sidebar structure and added visible Soon labels. Palette navigation says Coming soon. No pillar implementations were enabled. |
| S18 Date navigation | One date tab stop, selected grid-cell semantics, today marker, arrows, Home/End, Page Up/Down and year stepping. Crossing month boundaries updates focus. Date cells fit the existing popup width. Regression and browser verified. |
| S19 Laptop grid | Activity & capture spans the full six-column laptop grid; its xl span remains four. At CSS width 1152: two 411px companion cards align; capture spans 838px. No document overflow. |
| S20 Filtered empty states | Added filtered-empty/Clear filters support to CollectionState. Integrated Academics fixes supply accurate weekly/calendar messages and clear controls. Its table loop was independently reproduced and fixed through stable row identity. |
| S21 Crash appearance | Crash fallback reads the document theme and offers Copy error details. It remains independent of the store, router and UI kit; its small workspace-key helper is acknowledged in the comment. |
| S22 Blank submission | Quick Add Create is disabled for whitespace-only titles and invalid assignment scope. |
| S23 Last column | Integrated Academics guard: the last visible column is disabled and an empty selection is defensively rejected. |
| S24 Reduced motion | One helper selects instant versus smooth scrolling. Applied to capture, public pages/docs, syllabus groups, Planner and Class Hub. |
| S25 Recency ranking | All recents receive a consistent boost; a nonmatching item can no longer become a result merely because it is recent. Regression failed before and passed after. |
| S26 Editing guards | Shared guard handles descendants of rich-text editors, select, textbox/searchbox/combobox roles. Replaced copies in record workspace, founder prototype and integrated AssignmentsPanel. |
| S27 Surface contrast | Restored solid inner surfaces in Settings, task options, Review and Quick Add; Overview support surfaces also follow the recipe. Retained hover tints and intentional hero glass. Representative Settings measurement changed from 25% alpha to rgb(50,46,40) in dark and rgb(239,230,212) in light, matching --muted. Added measurement instructions to the local Claude verification command. This is not a claim that every alpha class is defective or that all 162 occurrences were changed. |
| S28 Dead-code cleanup | No deletions or dependency churn. Reserved pillars and unused UI primitives are future scaffolding, not demonstrated shipped failures. TypeScript includes source modules even when not routed. A separate ownership-led cleanup can decide what is abandoned. |

Optional polish accepted: the status chip consistently opens Attention; notifications size to content up to a maximum; patch notes no longer advertise version 0.0.0. Settings restructuring, navigation removal, and preference-storage migrations were not justified by this beta defect pass. Existing authored Academics deep-link mode behavior and MCAT focus routing were preserved.

## Validation

- Shared changes: 1,128 tests passed before Academics integration.
- Combined changes: 178 test files / 1,135 tests passed. Production TypeScript/Vite build passed; existing large-bundle warnings remain.
- Changed shared files: scoped ESLint completed with zero errors and four warnings (one existing component-export warning; three compiler-purity warnings for event-handler timestamps). No whole-repository clean-lint claim.
- Browser checks used an isolated guest workspace on localhost:5197 with synthetic task data. No real account deletion, external message, source deletion, or paid generation was performed.
- Verified auth tab focus, label-based record search, actual sidebar toggle, Quick Add type availability and class requirement, date keyboard selection, persistent Undo, Help overlay dismissal, notification focus, safe reset cancellation, dark-mode reset appearance, scroll reset and responsive geometry.
- Viewports observed: 1422, 1152, 810 and 375 CSS pixels. Screenshots from viewport overrides have a provider raster-scale discrepancy; DOM viewport and element rectangles are the geometry evidence.
- References: shared visual recipes lines 80–91 and approved overview-bento-control-panel grid; [cmdk external filtering](https://github.com/dip/cmdk), [ARIA tab keyboard pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [character-key shortcut requirement](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html).

## Still open outside these Claude fixes

The Academics owner reports imported citation splitting, stale-chunk recovery, source-failure/PDF-worker issues, and remaining Materials filing hierarchy as open or owned elsewhere. None is silently marked fixed by this integration.

The generation owner reported two failed live attempts on deployed revision `2a45df7`: one Study Guide auditor rejection, then a Mastery validation failure after Guide passed. No generated output was saved. Lecture generation is not end-to-end verified or launch-ready. Its source data and ongoing changes were not modified here.

The code is committed locally for review. It has not been merged to main, pushed or deployed; live production still requires a separate integration/release verification.

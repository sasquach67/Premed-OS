# T1 · Academics Daily · Class Hub Assignments — Variant A fidelity

**Stage:** E · FRONTEND FIDELITY  
**Variant:** A · course-scoped execution first, grade context supporting  
**Build gate:** `academics-class-hub.html` = `YES`  
**Scope:** Class Hub Assignments tab only.

## Step 1 · audit first

### A · spec to paper

No ruled Class Hub Assignments feature is undrawn. Variant A shows the
Agenda/Weekly/Calendar switch, locked class scope, urgency groups, practical
task actions, all-assignments handoff, and secondary grade/what-if context.

### B · mockup to app

The underlying execution behavior exists in `AssignmentsPanel`: course lock,
Agenda/Weekly/Calendar, complete with Undo, persisted collapse/view settings,
reorder/reschedule, important, details, add, and the global handoff. The
category-based what-if calculation also uses stored grade categories.

The tab does not yet match the drawing. Its control strip is an extra flat
card, the empty agenda and projected-workload panel dominate the course view,
and the grade scenario is a generic full-width form rather than the mockup's
clearly subordinate course-grade context.

| Surface | Approved mockup value | Current app value |
| --- | --- | --- |
| assignment filter ladder | transparent `.fb`; individual `#322e28` chips with `#3c352d` borders | wrapper `rgb(43,39,34)` + `rgb(60,53,45)` border, 10px padding, computed 0px radius |
| urgency group | `#262320`, `#3c352d`, 13px radius | shared agenda card; absent entirely in the honest empty state |
| supporting cards | `#2b2722`, `#3c352d`, 16px radius | generic `class-hub-panel`, not arranged as supporting grade context |

### C · already built; do not rebuild

- Global assignment execution behavior and views: `719d867`.
- Existing local-first `ClassAssignment` and `GradeCategory` records,
  persistence, assignment dialog/table, workload calculation, and what-if
  calculation remain authoritative.
- Current dirty-root course-lock/handoff work in `AssignmentsPanel.tsx` is
  preserved verbatim; this stage does not edit that already-dirty shared file.

### D · gate

`premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md` explicitly
sets `01-academics/academics-class-hub.html` to `YES`.

### E · decisions files

The same-name source and documentation-mirror HTML/MD are byte-identical. The
MD records both behavior and appearance: course-fixed execution first; grade
and what-if below; warm-dark `#2b2722` / `#322e28` / `#3c352d` ladder; Baloo 2
hierarchy; solid surfaces; only the banner stat strip may use glass.

### F · integrations and services

No external integration is required. Assignment records, grade categories,
preferences, and scenarios are local-first store data. Syllabus import is an
existing in-app handoff. There is no account/configuration blocker for this
stage.

## Why stage E

A and B pass because the approved surface and its appearance decision exist.
C/D do not apply because the data/interaction model is already implemented.
The first failure is literal frontend translation, so this is one fidelity
brief only.

## References read

- `mockup-lab/01-academics/academics-class-hub.html?view=assignments`
- `mockup-lab/01-academics/academics-class-hub.md`
- byte-identical documentation mirror HTML/MD
- `premed-hq-documentation/tabs/01-academics.md` §4.1-H, §4.1-I.D, §6.5
- `_shared/_visual-recipes.md`
- `implementation/component-inventory.md`
- `src/components/common/AssignmentsPanel.tsx`
- `src/components/academics/ClassHub.tsx`

## Work · one stage

1. Keep `AssignmentsPanel` as the single execution model; style only its
   Class-Hub-scoped rendering to the exact Variant A filter/group/row ladder.
2. Keep class scope obvious as a compact locked label and keep `All
   assignments` visible without an explanatory paragraph.
3. Place `Course grade context · supporting` below execution. Show persisted
   category facts and the existing category-based what-if in the mockup's broad
   stage + narrow result composition. Never mutate canonical grades.
4. Keep empty agenda and missing-category states honest and action-led, without
   invented workload or demo values.
5. Match the exact dark ladder and locked paper light ladder, Baloo/Nunito
   hierarchy, 13/16px radii, padding, borders, and 390px stacking. Add a source
   comment naming the approved Class Hub Assignments view.

## Do not break

- complete/Undo, reorder, important, edit, Weekly reschedule, Calendar detail,
  create, course lock, global handoff, preferences, persistence, table/export;
- one assignment dataset and required `courseId`;
- hypothetical what-if never writes grades;
- no Planning files, global CSS, store/types, or unrelated dirty work.

## Done when

- [x] the course agenda is the primary visual hierarchy in all three views;
- [x] class lock and global handoff are visible and active;
- [x] grade/what-if is visually secondary and uses real categories only;
- [x] empty/populated, dark/light, desktop/390px, keyboard controls are checked;
- [x] focused tests, TypeScript/build, and scoped diff-check pass;
- [ ] no BUILT promotion without all six proofs and commit provenance.

## Execution audit

- `AssignmentsPanel` remains the one assignment execution component. Only a
  presentation hook was added to its already-built class handoff; its local
  CRUD, Undo, reorder/reschedule, importance, details, persisted view and
  collapse state, table/export, and course lock were not changed.
- The Class Hub now ports the mockup's transparent filter row, solid inner
  urgency surface, compact rows, and visible global handoff. Agenda, Weekly,
  and Calendar were exercised live on a disposable origin and all rendered.
- `Course grade context · supporting` now separates the category-backed
  what-if from the execution list. Persisted categories and graded assignment
  facts form the broad stage; the existing hypothetical result forms the
  narrow rail. Missing categories and missing category results remain honest.
- A disposable app-native fixture was used for populated visual QA; it was
  served from a separate origin and deleted afterward. The user's local
  profile was not cleared or filled with test grades.

### Measured mockup to app fidelity

| Property | Approved Variant A / authority | App result |
| --- | --- | --- |
| filter row | transparent `.fb`; individual solid chips | transparent wrapper; compact `var(--muted)` controls |
| urgency group | `#262320`, `#3c352d`, 13px | `rgb(38,35,32)`, `rgb(60,53,45)`, `13px` |
| row spacing | `9px 14px` | `9px 14px` |
| grade shell | `#2b2722`, `#3c352d`, 16px | `rgb(43,39,34)`, `rgb(60,53,45)`, `16px` |
| scenario stage/result | 1fr + 400px; inner solid; 13px | 725px + 400px at fixture width; `rgb(38,35,32)`; `13px` |
| paper grade shell | locked `#fffaf0`, `#e9e2d5` | `rgb(255,250,240)`, `rgb(233,226,213)` |
| paper inner | locked paper muted/card mix | `color(srgb .963608 .934902 .87749)`, `rgb(233,226,213)`, `13px` |
| narrow | one column, controls reachable | true 390 CSS px render; scenario/result stacked and inputs remained reachable |

### Verification and promotion check

- screenshots: `/tmp/class-hub-assignments-dark-desktop.png`,
  `/tmp/class-hub-assignments-light-desktop.png`,
  `/tmp/class-hub-assignments-dark-mobile.png`;
- focused Class Hub suite: 7/7; TypeScript clean; production build passed
  (4,445 modules);
- live controls: Agenda/Weekly/Calendar changed views, `All assignments`
  resolved to `?mode=daily&tab=assignments`, and course scope stayed locked;
- reload/persistence and integration contracts are inherited unchanged from
  the existing `AssignmentsPanel` implementation; empty state was verified in
  the real local profile and populated state on the disposable origin;
- **not promoted:** the shared dirty-root package has no isolated commit hash
  yet, so six-condition terminal provenance is not satisfied.

## Commit

`fix(academics): translate class-scoped Assignments Variant A`

## Next stage — not in this brief

Re-run the router. Promotion requires the full six-condition proof; otherwise
the next failed Daily/Class Hub surface gets its own brief.

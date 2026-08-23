# T1 · Academics — Assignments deadline-surface fidelity

**Stage:** E · FRONTEND MISSING

**Scope:** Translate the already-working Daily → Assignments surface to the
approved Agenda / Weekly / Calendar visual language. The assignment model,
creation/edit/delete, persisted view and bucket preferences, drag reschedule,
table editor, and workload calculation already exist. This is a fidelity pass;
do not replace those behaviours, create a second assignment surface, or change
storage, migrations, provider configuration, or the app shell.

## 1. Fidelity audit

### A. Spec → paper

All ruled Assignments behaviours have a manifest-cleared paper owner.

| Ruled behaviour | Decided surface |
| --- | --- |
| Course-linked records only; non-class work belongs in Overview → Tasks | `tabs/01-academics.md` §4.1-H and `academics-assignments.md` |
| Agenda is default; Weekly and Calendar project the same records | `academics-assignments.{html,md}` |
| Collapsible/capped urgency buckets and a collapsed Completed group | `academics-assignments.{html,md}` |
| Large banner `Add assignment` primary plus the reachable dashed repeat | `academics-assignments.{html,md}` |
| A solid filter bar; table demoted to overflow; workload is a bottom panel | `academics-assignments.{html,md}` |
| Relative, type-aware due/upcoming wording; exam readiness only from linked topics | `tabs/01-academics.md` §4.1-H and `academics-assignments.md` |
| Solid records below the banner; glass only on the shared banner surfaces | `academics-assignments.md`, visual recipes, and 04 §0c |

There is no Stage-A paper gap blocking this pass. The gate permits both
`01-academics/academics-daily-main-page.html` and
`01-academics/academics-assignments.html` with **Build? = YES**. Do not edit
the manifest.

### B. Mockup → app

`src/components/common/AssignmentsPanel.tsx:300-1058` already owns the real
page: filters, search, Agenda / Weekly / Calendar, keyboard creation, bucket
volume control, per-record actions, drag rescheduling, Calendar detail rail,
and the calculated six-week workload. `src/pages/Academics.tsx:165-251` owns
the shared Academics banner and its one page-primary Add action.

| Approved drawing | Current implementation | Finding |
| --- | --- | --- |
| Banner remains the shared Daily banner, with Add assignment as its clear single primary action | Existing `PageHeader` action has `Add assignment` and `⌘N` | Built; preserve it |
| One compact solid filter bar reads as a calm level-3 control strip | `AssignmentsPanel` has the correct controls but uses a broad soft card with the normal card elevation | Divergent surface hierarchy |
| Agenda communicates urgency by compact bucket/row geometry before date reading | The grouping and row data exist, but all buckets use the same tall soft-card treatment | Divergent density/depth |
| Weekly is seven balanced day columns; a day label says Free/Light/Busy/Heavy and event cards are compact | Existing 7-column data, keyboard drag, and labels work; day cells inherit tall, elevated card styling | Divergent weekly rhythm |
| Calendar is month geometry plus a quiet detail rail; event chips remain solid and legible | Existing calendar and rail work | Needs literal solid-surface / density comparison, not a rebuild |
| Bottom workload is a secondary collapsed report, not a competing fourth view | Existing projected-workload model and persistence work | Its card/chrome must be harmonized with the approved bottom-panel hierarchy |
| Class record rows show factual course/type/weight and relative contextual time | Existing row fields work; `relativeDue()` handles tasks and `fmtEventDate()` protects exam wording | Built; preserve behaviour while tightening information hierarchy |

#### Measured primary record surface — Weekly view, dark theme

Measured in the running app on 2026-08-23 using computed styles for the
active Weekly surface. The current theme roles are correct, but their
application produces too much generic card elevation for the approved deadline
surface.

| Surface | Current app measurement | Approved intent | Finding |
| --- | --- | --- | --- |
| Filter bar | `rgb(43, 39, 34)`, 16px radius, 12px padding, `0 1px 2px` + `0 6px 16px -8px` shadow | Solid quiet control strip below the banner | Fill is right; elevation and density need fidelity work |
| Weekly day cell | same fill, 16px radius, 10px padding, 220px height, same soft-card shadow | Balanced, solid daily column | Too tall and card-like relative to the drawing |
| Workload panel | same fill, 16px radius, same soft-card shadow | Secondary report at page bottom | Too visually equivalent to a main view until restyled |

This is a real Stage-E gap. It is not permission to flatten the page: retain
the signed-in surface ladder and use the existing solid-depth recipe rather
than making controls plain or introducing glass below the banner.

### C. Already built — preserve, do not rebuild

- Course-owned data boundary, assignment dialog validation, create/edit/remove
  with undo, and the command-key creation shortcut.
- Persisted view, completed/bucket/workload preferences, filters, search, CSV
  export, and the demoted table editor.
- Agenda caps/collapse, type-aware `due` versus exam event wording, topic
  readiness, per-record context menus, and keyboard/screen-reader labels.
- Weekly pointer/keyboard drag between days, Calendar detail rail, and the
  workload calculation's honest `Not enough graded work yet` state.
- Existing app-specific annotations, source-generation decisions, and all
  existing shared shell/header work. A later app annotation wins over an older
  mockup screenshot.

### D. Backend gate

**Pass.** This surface reads and updates the existing local Academics store.
No missing provider, OAuth scope, Supabase function, storage bucket, or model
migration blocks this visual pass. Google Calendar review is a separate
course-level handoff surface, not a prerequisite for a local assignment
record's Agenda, Weekly, or Calendar presentation.

### E. Decision records

**Pass.** `academics-assignments.md` specifies both behaviour and appearance:
hierarchy, solid/depth treatment, view roles, responsive mode, keyboard focus,
reduced motion, and the exact primary/secondary action distinction. No
Stage-B decisions brief is required.

### F. Integrations and services

None in scope. Do not add Canvas import, Google Calendar writes, AI generation,
or a network call to justify visual fidelity. The existing assignment records
remain the single source for all three projections.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.1-H and §4d.
- `mockup-lab/01-academics/academics-assignments.{html,md}` — Variant A.
- `mockup-lab/01-academics/academics-daily-main-page.{html,md}` — shared
  banner context.
- `mockup-lab/_shared/_visual-recipes.md`.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`
  §§2–5c and `04-visual-craft-standards.md` §0–§0c.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
  and `component-inventory.md`.
- `src/pages/Academics.tsx` and `src/components/common/AssignmentsPanel.tsx`.

## 3. The work — translate the existing owner, do not fork it

### 3.1 Shared header and filter hierarchy

1. Preserve `Academics.tsx` as the sole owner of the banner `Add assignment`
   primary action. It remains the only dominant action on the page. Keep the
   `⌘N` affordance and the existing quiet `How to study` utility action.
2. Keep the view switcher, class filter, search, and overflow in one compact,
   solid level-3 strip. It must read as a control surface below the banner,
   not a competing bento card or a second pill-navigation track.
3. Use existing tokens and shared controls. Do not copy the mockup's inline
   colour, radius, font, or shadow literals into `src`.

### 3.2 Agenda — urgency before date-reading

1. Keep the existing order and behaviour: Overdue → This week → Next week →
   Later → Completed; collapsed/capped controls remain persisted and Completed
   remains quiet by default.
2. Translate buckets into compact solid record groups. Their role may differ
   by urgency through the existing severity badge/accent, but they must not
   become glass, full-width blank rectangles, or a wall of equally elevated
   cards.
3. Preserve the row's factual order:
   `checkbox · title · class chip · type chip · readiness for an exam only ·
   weight/points when recorded · relative contextual time · exact date`.
   Do not create a score, completion percentage, fake estimate, or readiness
   denominator where source data is absent.
4. Keep the dashed end-of-list add row as a reachable repeat of the same
   creation dialog. It is secondary to the banner action, never a second
   primary treatment.

### 3.3 Weekly and Calendar — same records, distinct geometry

1. Keep the existing stored `agenda | weekly | calendar` choice and every
   drag/reschedule path. Weekly must retain seven recognizably equal day
   columns at desktop, with a readable Free/Light/Busy/Heavy label and compact
   course-coloured event cards.
2. At narrow widths, retain accessible day exploration without clipping or
   shrinking individual columns until their content is illegible. If horizontal
   overflow is required, it must be deliberate and keyboard reachable.
3. Keep Calendar's month grid and detail rail; limit cell content before it
   becomes unreadable, then let the rail own full records. A selected or heavy
   date can use restrained solid tint, not a second chart or glass treatment.
4. Event language stays contextual: ordinary records are **due**; exams and
   other scheduled class events are **upcoming**. Never alter semantic wording
   merely to obtain visual symmetry.

### 3.4 Projected workload and feedback

1. Keep workload below the views as a collapsible secondary report. Retain
   the honest missing-weight state and source-backed week labels.
2. Rework only its visual rank: it should read as a calm end-of-page report,
   not another default view or dominant dashboard card. Do not remove class
   segmentation, facts, legend, or the one factual recommendation.
3. Use existing motion tokens. View changes, bucket expansion, and drag
   feedback respect reduced motion; focus indicators stay visible.

### 3.5 Verification

1. Test all three views in both themes with populated and empty records. Check
   filter/search, Add, Create/Edit dialog, bucket expand/collapse, completed
   toggle, row context actions, table overflow, CSV export, workload collapse,
   weekly pointer and keyboard drag, and Calendar rail selection.
2. Run the control-handler audit for each changed `Button`, menu item,
   `ToggleGroupItem`, and draggable path. It must report zero dead controls.
3. Record dark and light computed-style evidence before commit: canvas, filter
   bar, agenda group/row, weekly cell/card, calendar cell/rail, workload panel,
   rest shadow, and focus/hover state. Verify that glass remains confined to
   the shared banner surfaces.
4. Run `npm run test` and `npm run build`.

## 4. Do not break

- No data-model, persistence, migration, provider, auth, calendar-sync,
  prompt, or Supabase change.
- Do not change the Overview task boundary: class-owned work stays here.
- Do not add a fourth view, duplicate Add path, a new tracker table surface,
  or any U-9 score/composite/ranking/progress metric.
- Do not flatten the signed-in hierarchy, add glass below the banner, or alter
  shell/hero/sidebar tokens.
- Do not delete app annotations or live behaviours because the old mockup did
  not show them.

## 5. Done when

- [ ] The shared banner, level-3 control strip, Agenda groups, Weekly columns,
  Calendar/rail, and bottom workload report have the approved visual hierarchy
  in both themes.
- [ ] All existing Assignment behaviours and record semantics remain intact;
  Agenda remains default and the page has exactly one dominant Add action.
- [ ] Empty data is friendly and honest; missing weights/readiness never
  render invented values, zero bars, or demo records.
- [ ] Narrow-width, keyboard-only, drag, focus, and reduced-motion paths work.
- [ ] The handler audit is clean; `npm run test` and `npm run build` pass.

## 6. Commit

`fix(academics): match Assignments deadline fidelity`

Commit unrelated working-tree changes separately.

## 7. Next stage — promotion audit, not in scope

After implementation, conduct the six-condition promotion audit for the
Assignments page. Do not mark it built merely because its visual translation
lands: empty-store, handler, reload persistence, both-theme, integration, and
commit evidence must all be recorded beside the mockup.

# T1 · Academics — Class types visual fidelity

**Stage:** E · FRONTEND MISSING  
**Scope:** Translate the approved STEM / Writing / General class-type surfaces
onto the existing shared Class Hub and Class Center. The type records,
reading-list boundary, and recurring-feedback contract already ship; this pass
changes presentation and interaction geometry only. It is not permission to
redesign the wider Class Center, alter user-approved card annotations, or add
another study model.

## 1. Step-1 audit

### A. Spec → paper

**Pass for this vertical.** `tabs/01-academics.md` §3.3 and §4.1-N are drawn
in `mockup-lab/01-academics/academics-class-types.html` and its decision
record:

- exactly three configurations: `stem`, `writing`, and `general`;
- one shared banner/stat-strip/tab/panel grammar, with only the third tab and
  primary action varying by type;
- Writing's current-paper rail, separately stated self-target and professor
  deadline, reading statuses/term dots, and recurring feedback evidence;
- compact cards with one factual signal line and no type badge; and
- a single urgency-ordered daily list whose per-row verb makes the work type
  readable without grouping classes by type.

The add-class selection outcomes are separately drawn and already translated
in `academics-class-type-selection.html`; do not redo that dialog here.

### B. Mockup → app

**Fail — persisted behavior is present, but the live Writing surface has not
been translated from the drawing.**

The Aug. 23 live audit of `#/academics/classes/demo-course-engl105?classTab=readings`
found the right data and controls but the wrong visual language:

- **Current draft:** the app uses a row of large `Outline` / `Draft` /
  `Revision` / `Submitted` buttons. The drawing uses one compact connected
  pip rail nested below the paper identity; the target date and professor
  deadline remain separately readable.
- **Readings:** the app uses full-width `Select` controls and no factual
  term-dot strip. The drawing uses quiet status chips on the rows plus the
  term strip; controls still need to remain reachable and keyboard-operable.
- **Feedback:** the app correctly stores raw notes and shows only repeated
  exact themes, but its result rows do not yet use the drawn theme hierarchy:
  label, evidence count, real quote when supplied, and linked-paper source
  line.
- **Shared density:** the Writing tab is a generic two-column tool grid,
  rather than the same compact panel ladder and visual weight as STEM. It
  therefore reads as a different utility page instead of an equal class
  configuration.

**Measured primary surface, Aug. 23, 2026:**

| surface | mockup value | live app value |
| --- | --- | --- |
| Dark ladder | page `#211e1a` → panel `#2b2722` → row `#322e28`; edge `#3c352d`; panel / row radii `16px` / `11px` | `rgb(33,30,26)` → `rgb(43,39,34)` → `rgb(50,46,40)`; edge `rgb(60,53,45)`; radii `16px` / `18.4px` |
| Paper ladder | page `#f7efe1` → panel `#fffaf0` → nested `#efe6d4`; edge `#e9e2d5` | `rgb(247,239,225)` → `rgb(255,250,240)` → `rgb(239,230,212)`; edge `rgb(233,226,213)` |

The colors are now correct. The row geometry and content hierarchy are not:
the app's generic `rounded-xl` row must become the mockup's compact `11px`
class-type row **only on these Writing surfaces**. Do not change the global
component radius or a separately approved surface.

### C. Already built — preserve, do not rebuild

- `bbac90e feat(academics): add explainable class-type suggestions (§4.1-N)`
  established the conservative type proposal contract.
- `645c399 fix(academics): wire explainable class-type selection` translated
  the approved add-class decision states; preserve its no-hidden-default and
  no-reclassification behavior.
- `c2b6f53 feat(academics): make Writing reading and feedback signals honest
  (§4.1-N)` shipped the V34 `readingListState`, debt suppression, raw feedback
  writer, exact recurrence rule, migration, and persistence tests. Consume
  those facts; do not create a second state model or recompute a score.
- The user-approved compact square card shell, popup-only Review behavior,
  softened class accents, and all later app annotations are authoritative
  additions. Match the mockup wherever it does not conflict with those
  decisions; never delete an annotation merely because the older mock lacks
  it.

### D. Gate

`BUILD-MANIFEST.md` marks `01-academics/academics-class-types.html` **YES**.
No manifest change is required.

### E. Decision record

**Pass.** `mockup-lab/01-academics/academics-class-types.md` records both
behavior and appearance: equal type density, one shared panel grammar, solid
warm/paper ladders, readable status, no type badge, keyboard focus, and
reduced-motion behavior.

### F. Integrations and services

| dependency | classification | consequence |
| --- | --- | --- |
| Local persisted Academics store | **CODE BUILT AND CONFIGURED** | Draft stages, reading statuses/list boundary, and raw feedback persist locally. |
| Syllabus import | **CODE BUILT; may have incomplete reading data** | The display must honor `unknown` / `partial`; it cannot imply source coverage. |
| AI, Canvas/LMS, catalog, file storage | **NOT REQUIRED** | This fidelity pass renders only student-recorded data; no fetch, model call, or new account configuration belongs here. |

**First failed stage: E.** The features are drawn and decided; the model,
migration, handlers, and persistence exist; the live interactive surface still
does not match its approved Writing hierarchy.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §3.3 and §4.1-N.
- `mockup-lab/01-academics/academics-class-types.{html,md}` — literal Writing
  rail, reading rows/dots, feedback-theme hierarchy, and shared type parity.
- `mockup-lab/01-academics/academics-class-type-selection.{html,md}` —
  preserve the already-built create/edit selection behavior.
- `mockup-lab/_shared/_visual-recipes.md` — literal surface ladder, borders,
  radii, focus, and motion values.
- `src/components/academics/ClassHub.tsx` — `WritingTools()` and the shared
  type-specific banner/stat strip.
- `src/components/academics/ClassCenter.tsx` — `ClassCard()` and
  `classSignal()`; retain card annotations and factual verbs.
- `src/lib/academics/writingEvidence.ts` and `src/lib/types.ts` — consume the
  single existing reading/feedback contracts.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md` and
  `mockup-lab/VARIANT-LAB.md`.

## 3. Work — fidelity only

### 3.1 Translate Writing's three substitute surfaces

1. Retain the one shared `ClassHub` and its existing Writing-only `Readings`
   tab. Do not fork separate STEM/Writing pages and do not add a type badge.
2. Restyle **Current draft** into the drawn compact paper row:
   identity first; professor deadline and the student's self-target as two
   distinct facts; then one connected Outline → Draft → Revision → Submitted
   rail. Completed pips use the existing quiet success treatment; the current
   stage is ringed with the class accent. The rail's stages must remain
   operable with pointer, Enter, Space, visible focus, and reduced motion.
   Do not render a missing deadline as overdue or invent a deadline.
3. Restyle **Readings** as compact rows with a student-editable status chip
   (`Read`, `Skimmed`, `Not started`) and the factual term-dot strip beneath
   the list. Each dot represents a recorded row, never an inferred reading or
   a percentage/progress claim. Keep the existing paste, inline-add,
   this-week, complete-list, and no-readings actions accessible in a quiet
   supporting region—not a second dashboard card.
4. Keep V34's exact state copy at the top of Readings. `unknown`, `partial`,
   and `not-applicable` must have no debt count or denominator; `complete`
   alone may show the current factual debt sentence.
5. Restyle **What keeps coming back** as the drawn theme evidence row: human
   label; accurately labeled paper/note count; exact stored professor quote
   when one exists; and linked paper names/source line. A one-off remains
   retained but renders only the existing honest empty/pending explanation.
   Keep the compact raw **Log feedback** form; it must not be mistaken for an
   AI classification feature.

### 3.2 Restore shared type parity without erasing annotations

1. Use the existing solid warm/paper ladder literally. Limit the mockup's
   compact row geometry to class-type panels: panel `16px`, nested row
   `11px`, literal borders. Do not globally change `rounded-xl`, generic
   dialogs, class cards, or existing app-specific accent treatments.
2. Preserve the existing shared banner, stat-strip footprint, and tab edge.
   Writing stays equal in panel density and visual weight to STEM. General
   continues to omit a study layer rather than show blank topic machinery.
3. Preserve the current compact card layout and Review popup decision. The
   card signal remains one factual line; Writing can say a concrete draft or
   reading fact only. The `Read` verb names a concrete next reading or the
   honest boundary copy, never an invented debt count.
4. Keep the daily list urgency-ordered across classes with its existing
   factual `Recall` / `Draft` / `Read` / `Log` verb treatment. Do not group by
   class type or add a score, percent-ready card, readiness number, or type
   label.

### 3.3 Proof

Add focused UI coverage at the closest existing Academics/Class Hub seam for:

- stage changes through the compact rail and preserves the selected
  `PaperDraft.stage` through reload;
- self-target and professor deadline are independently rendered; an absent
  professor deadline remains `Not recorded` rather than a made-up date;
- each reading status changes through the compact status control and persists;
  the term dots equal the number of actual recorded readings;
- all four V34 reading-list states retain their exact degradation behavior;
- one feedback note stays non-recurring; two exact normalized notes become one
  theme with quotes and linked-paper labels preserved; and
- no card/daily/Overview reader treats a Writing fact as GPA, BCPM,
  requirement, Planner, or cross-type readiness data.

Run focused tests, the full suite, and the production build. Capture fresh
light/dark visual evidence for the Writing Readings tab and compare the full
`page → panel → row` ladder to the audit table. Verify narrow layout has no
clipped status/action row.

## 4. Do not break

- Exactly three types; no checklists, fourth type, auto-reclassification, or
  separate page components.
- V34 reading-list states, raw feedback records, exact deterministic theme
  grouping, and dormant Writing data when type changes.
- User-approved compact square cards, popup-only Review behavior, class-card
  accent softening, Material generation flows, syllabus import/re-import, and
  all later app annotations.
- Type-blind GPA, BCPM, credits, requirements, Planner, and Overview logic.
- U-9: no composite, ranking, readiness, percent-complete, or invented
  denominator. The term dots are factual record markers, not a progress bar.
- Any unrelated dirty documentation, flashcard specification, output, or
  older untracked briefs.

## 5. Done when

- [ ] Writing renders as an equal class configuration with the approved draft
  rail, compact reading rows/dots, and feedback evidence hierarchy.
- [ ] Existing read/add/paste/complete/no-reading and feedback actions remain
  reachable and persist exactly as V34 specifies.
- [ ] A missing/partial list never renders a debt count; an exact recurring
  theme never fabricates a quote or paper count.
- [ ] The live light and dark ladders match the literal mockup values,
  including the class-type nested-row `11px` geometry.
- [ ] Keyboard focus, reduced motion, and narrow stacking work without a
  clipped control row.
- [ ] Focused tests, full suite, and production build pass.

## 6. Commit

`fix(academics): match Writing class tools to approved type surface`

Commit only the Class Hub/Class Center fidelity work and directly required
tests. Keep unrelated work separate.

## 7. Next stage — not in this brief

After execution, run the Class Types Stage F promotion audit: prove every
handler, reload persistence, empty-store honesty, visual match in both themes,
and no unconfigured dependency; note the commit in the decision record and
promote the lab entry only if all six conditions pass. Promotion is not in
scope for this fidelity pass.

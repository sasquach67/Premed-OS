# T1 · Academics — Class-type selection fidelity

**Stage:** E · FRONTEND MISSING  
**Scope:** Translate the approved add-class type-selection states into the
existing `ClassEditorDialog`. This is a fidelity/UI-integration pass over an
already-shipped proposal contract. Do not redesign the Class Center, add a
catalog service, or change the type model.

## 1. Step-1 audit

### A. Spec → paper

**Pass for the active Class Types vertical.**

`tabs/01-academics.md` §3.3 and §4.1-N require three types, an attributable
suggestion when evidence exists, and an explicit no-default choice otherwise.
The four required product states are now drawn in
`mockup-lab/01-academics/academics-class-type-selection.html`:

- `suggested-writing`
- `suggested-stem`
- `needs-choice`
- `mobile`

The rest of Academics remains separately staged under its own briefs; this
audit is intentionally the active Class Types vertical, not permission to
rebuild unrelated surfaces.

### B. Mockup → app

**Fail — the live form has the rule's data contract but not its approved
interaction or appearance.**

`src/components/academics/ClassCenter.tsx` still creates every manual draft
with `type: 'stem'`. `ClassEditorDialog` renders three static buttons, does
not call `proposeClassType()`, names no evidence source, permits save with the
hidden default, and does not distinguish an uncommitted proposal from a saved
student choice. It therefore fails both §4.1-N's "ask rather than guess" rule
and the approved visual treatment.

**Measured primary decision surface, Aug. 23, 2026:**

| Surface | Approved mockup value | Current app value |
| --- | --- | --- |
| Add-class decision surface | Dialog `#2b2722` → type chip `#322e28` → edge `#3c352d`; `16px` dialog / `13px` chip radius | `glass-surface` dialog: `rgba(20, 26, 34, 0.62)`; selected chip `primary/10` / `rgb(75, 156, 211)` edge; `13px` dialog / `18.4px` chip radius |

This is not merely a token-name mismatch: the mockup's solid warm ladder is
being replaced by a cool translucent dialog and a differently shaped selector.

### C. Already built — preserve, do not rebuild

- `proposeClassType()` is a conservative, pure local proposal contract with
  `suggestion` and `needs-choice` outcomes, shipped in
  `bbac90e feat(academics): add explainable class-type suggestions (§4.1-N)`.
- Its source order and no-mutation/no-reclassification contract are covered by
  `src/lib/academics/classTypeProposal.test.ts`.
- The required mockup and appearance/behaviour decision record shipped in
  `1f4a812 feat(mockups): draw explicit class-type selection states`.
- The existing shared Class Center, compact square cards, popup-only Review,
  softened course accents, class-specific hub configurations, and every
  later app annotation stay intact.

### D. Gate

`BUILD-MANIFEST.md` clears `01-academics/academics-class-types.html` with
**Build? = YES**. The selection states extend that cleared Class Types
vertical. No manifest edit is needed for this fidelity pass.

### E. Decisions files

**Pass.** `academics-class-type-selection.md` records both behaviour and
appearance: the two proposal outcomes, uncommitted selection boundary, one
row of equal chips, solid warm/paper ladders, focus, mobile reflow, and
reduced motion. It is not behaviour-only.

### F. Integrations and services

| Dependency | Classification | Current consequence |
| --- | --- | --- |
| `proposeClassType()` | **CODE BUILT AND CONFIGURED** | Its pure local result is available now; this pass only consumes it. |
| Class draft / `ClassWorkspace.type` persistence | **CODE BUILT AND CONFIGURED** | A type can be saved once the student has accepted or chosen it. |
| Parsed-syllabus type facts | **CODE BUILT; may be absent** | An import owner may supply them later; the manual dialog must not invent them. |
| Resolved catalog BCPM metadata | **NOT AVAILABLE to the blank manual form today** | Do not fabricate a STEM suggestion from a course prefix. With no actual evidence, show `needs-choice`. |
| AI, Canvas, catalog API, file upload | **NOT REQUIRED** | No provider call, spinner, or confidence claim belongs in this dialog. |

**First failed stage: E.** Stages A–D pass for this vertical: the surface is
drawn, its decision file is complete, the local behaviour contract is built,
and its persistence model exists. The live frontend is the missing link.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §3.3 and §4.1-N.
- `mockup-lab/01-academics/academics-class-type-selection.{html,md}` — the
  approved four product states and their exact interaction boundary.
- `mockup-lab/_shared/_visual-recipes.md` — literal warm/paper surfaces,
  radii, focus, and reduced-motion values.
- `src/lib/academics/classTypeProposal.ts` and its test — consume this one
  proposal function; do not write another classifier.
- `src/components/academics/ClassCenter.tsx` — `emptyClassForm`,
  `workspaceFields`, all creation entry points, and `ClassEditorDialog`.
- `src/components/ui/dialog.tsx` — do not change the generic dialog for this
  one surface.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md` and
  `mockup-lab/VARIANT-LAB.md`.

## 3. Work — fidelity only

### 3.1 Make new-class type selection honest

1. Remove the unsaved `stem` default from a **new** manual class draft. Keep
   the required persisted `ClassWorkspace.type` model unchanged.
2. In `ClassEditorDialog`, call the existing `proposeClassType()` only for a
   new class and only with evidence the owning flow actually has. For the
   blank/manual current form, course-code evidence may yield Writing; without
   available parsed-syllabus facts or resolved BCPM metadata, it must yield
   `needs-choice` rather than a guessed STEM type.
3. Keep a proposal or student override in local dialog state until the student
   activates **Add class**. Typing a course code, receiving a suggestion, or
   switching a chip must never write a workspace or mutate course metadata.
4. A suggestion starts as a reversible selected proposal and enables creation.
   `needs-choice` starts with no selected chip; **Add class** and
   **Create & import syllabus** are disabled until the student explicitly
   selects STEM, Writing, or General.
5. Once a student taps a chip, retain that override while they edit the course
   code in the open form. Do not surprise them by overwriting it with a new
   proposal. On save, persist exactly the accepted/chosen type.
6. Edit flows retain their already-saved type. Never automatically
   reclassify an existing class from code changes, later syllabus import, or
   re-import. A later separate feature may *offer* a change, never silently
   apply one.

### 3.2 Translate the approved decision surface

1. In create mode, make the course identity compact and put **Class type**
   directly after the course-code/title/term context; preserve the existing
   instructor, meeting, location, nickname, Look, Links, and other
   app-specific fields rather than deleting them. They may remain quiet below
   the decision.
2. Render exactly three equal, reachable chip buttons:

   - STEM — “Topics and recall tools”
   - Writing — “Drafts, readings, feedback”
   - General — “Grades and deadlines”

   Use `aria-pressed`, a visible focus ring, and normal Enter/Space button
   behavior. There is no fourth option, per-feature checklist, dropdown, or
   hidden fallback.
3. In a suggestion, show the exact human reason returned by the proposal
   contract beneath the chips. It must identify evidence, for example
   “Suggested Writing — this course code is usually writing-intensive.”
   Do not label this AI, show probability, or display any U-9 score/rank/
   readiness/progress proxy.
4. In `needs-choice`, show “Choose the study layer that fits this class.”
   Under the disabled actions, show the adjacent honest reason “Choose a class
   type to continue.” This is guidance, not an error toast.
5. Keep the existing structural reassurance in readable language:
   “You can change this later. Grades, credits, and requirements stay the
   same.” It is a quiet line, not a banner or a separate feature card.
6. In create mode name the primary action **Add class** to match the approved
   surface. In edit mode retain **Save class**. Keep the separately annotated
   Create & import syllabus path, simply gate it on a valid type rather than
   removing it.

### 3.3 Match the measured visual treatment

1. Override the generic `glass-surface` only on this dense class editor; do
   not alter `DialogContent` globally. Use the solid class-type form ladder:
   warm dark dialog `#2b2722`, nested/neutral objects `#322e28`, edges
   `#3c352d`, with `16px` dialog and `13px` chip geometry. Map the same
   hierarchy through the project's paper theme tokens rather than hard-coding
   dark colors into light mode.
2. Do not make the inputs or type chips glass. The overlay may float; the
   form itself remains a solid readable surface.
3. The proposed/selected chip gets the restrained Academics blue border/fill
   from the drawing. It must read as reversible selection, not a status
   metric. Unselected chips remain equal in size and visual importance.
4. Preserve accessible contrast, focus-visible ring, and reduced-motion
   behavior. Selection may use a short opacity/border transition, but no
   lift, bouncing checkmark, or travelling animation.
5. At narrow widths, retain one row of three equal chip targets wherever it
   fits the approved mobile layout; support context may stack, but there is no
   horizontal clipping, carousel, or multi-step wizard.

### 3.4 Prove it

Add focused interaction coverage at the existing Class Center test seam (or
the closest established UI-test seam) for:

- blank/manual create → no selected type, Add disabled;
- `ENGL 105` → Writing proposal/reason, Add enabled, then persists Writing
  only after Add;
- explicit chip override → that exact type persists, and typing afterward
  does not overwrite it;
- existing class edit → its saved type stays selected and no proposal line
  appears;
- create-and-import remains available only after a valid type and creates one
  workspace, not a duplicate.

Run the focused tests plus the normal typecheck/build. Capture fresh light and
dark screenshots or computed values of the dialog and a selected/unselected
chip; compare the ladder to the table above.

## 4. Do not break

- The exact three-value `stem | writing | general` model and every type-blind
  calculation (GPA, BCPM, credits, requirements, Planner, grades).
- The pure proposal function, its source order, frozen-input safety, and the
  rule that a suggestion is never a hidden decision.
- Existing saved workspace types, class cards, class hubs, imports/re-imports,
  and all later app annotations.
- The generic dialog component and unrelated dialogs.
- U-9: no confidence percentage, score, ranking, composite, readiness value,
  or progress bar.
- Unrelated dirty documentation, output, and brief files.

## 5. Done when

- [ ] `emptyClassForm()` has no hidden STEM default for a newly created class.
- [ ] Only the one existing `proposeClassType()` function classifies a draft;
  `rg 'function proposeClassType|const proposeClassType' src` finds its one
  implementation.
- [ ] New manual classes either show an attributable proposal or an honest
  unselected required choice; no input evidence is fabricated.
- [ ] No class/workspace write occurs before Add class / Create & import
  syllabus, and accepted/chosen type survives reload.
- [ ] Existing classes retain their saved type without a surprise proposal.
- [ ] Both creation paths gate on a valid type and never duplicate a workspace.
- [ ] The live decision surface measures as the mockup's solid ladder in dark
  and its equivalent paper-theme ladder in light; it is no longer a glass form.
- [ ] Focus, keyboard selection, narrow layout, and reduced motion work; no
  type dropdown, fourth type, U-9 indicator, or automatic reclassification
  exists.
- [ ] Focused tests, full relevant suite, and production build pass.

## 6. Commit

`fix(academics): wire explainable class-type selection`

Commit only the Class Center fidelity/UI tests and directly required files.
Keep unrelated working-tree changes separate.

## 7. Next stage — not in this brief

After execution, run the Class Types **Stage F promotion audit**: measure both
themes, audit all handlers, prove persistence/reload and empty-store honesty,
recheck any integration boundary, record the commit in the mockup decision
file, and then promote the lab page only if all six conditions pass. That
promotion audit is not in scope for this fidelity implementation pass.

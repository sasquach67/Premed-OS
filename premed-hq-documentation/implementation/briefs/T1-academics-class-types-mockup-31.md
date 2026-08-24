# T1 · Academics — Class-type selection at add time

**Stage:** A · NOT DRAWN  
**Scope:** Draw the missing **add-class type-selection** states in the mockup
lab. This is paper only: no `src/`, store, migration, or live form changes.

## 1. Step-1 audit

### A. Spec → paper

**Fail — one ruled interaction has no drawing.**

`01-academics.md` §3.3 and §4.1-N require the type to be selected while a
class is added: one row of three chips, a reasoned suggestion when there is
evidence, and **no preselection** when confidence is low. The existing
`academics-class-types.html` proves the three resulting class-hub
configurations, but it begins after a class already exists. It contains no
add-class form, suggestion reason, unselected low-confidence state, disabled
create state, or keyboard/mobile state for this decision.

That is the only newly identified paper gap for this vertical. The type-specific
hub, card, daily-verb, Writing substitute layer, and partial-reading
degradation are already visible in the existing drawing.

### B. Mockup → app

The just-landed `bbac90e` proposal contract now supplies a deterministic
`suggestion` (type, source, short reason) or `needs-choice`. The live form does
not consume it yet; it still initializes the draft as `stem`. This is not a
fidelity issue to code around: without a drawing of the proposed selection
states, the form’s actual interaction has no approved visual target.

**Measured existing primary record surface, Aug. 23, 2026:** the Class Center
card itself has the correct shared warm-dark rung—app `#211e1a` canvas →
`#322e28` card → `#3c352d` border, `13px` radius—matching the existing
Class Types mockup’s `--bg #211e1a`, `--muted #322e28`, `--bd #3c352d`, and
`13px`. This measurement does **not** prove the missing add-class dialog;
there is no matching mockup surface to measure yet.

### C. Already built — preserve, do not redraw

- The one shared class hub with its three configurations, type-specific third
  tab/primary action, Writing draft/readings/feedback records, and General’s
  deliberately absent study layer.
- The single-shell class cards and urgency-ordered daily verb line
  (`Recall`/`Draft`/`Read`/`Log`). The old lab comment claiming these verbs
  are missing is stale; `ClassCenter.tsx` now owns them.
- The pure offline `proposeClassType()` contract and its no-mutation,
  no-reclassification tests: `bbac90e`.
- All confirmed app annotations, including compact square cards, popup-only
  Review, softened accents, and the rule that no mockup translation deletes a
  later app-specific improvement.

### D. Gate

`BUILD-MANIFEST.md` clears the existing
`01-academics/academics-class-types.html` **YES**. This drawing adds a missing
state to that cleared vertical; no manifest change is requested. The new
mockup must register as `status:"proposed"` until Andy approves its treatment.

### E. Decisions record

The existing `academics-class-types.md` records the hub/card appearance and
the underlying selection rule, but cannot record the appearance of a state it
does not show. The new selection drawing needs its own adjacent `.md` with
both behaviour **and appearance**, not a behavioural note appended silently to
the older parity page.

### F. Integrations and services

| Dependency | Classification | Drawing consequence |
| --- | --- | --- |
| Local class draft + saved workspace | **CODE BUILT AND CONFIGURED** | The selection is made before the workspace is created; the drawing must not imply an immediate save. |
| `proposeClassType()` | **CODE BUILT AND CONFIGURED** | Draw its two honest outcomes: a reasoned suggestion and `needs-choice`. |
| Parsed syllabus facts | **CODE BUILT; may be absent** | It may explain a suggestion; it never silently changes the type. |
| Course-code / BCPM metadata | **CODE BUILT AND CONFIGURED** | Use as lesser, named evidence in the suggestion explanation. |
| Catalog, Canvas, AI provider, file upload | **NOT REQUIRED** | Do not add a loading spinner or pretend a provider has classified the class. |

**First failed stage: A.** The behavior contract is built, but the selection
screen itself is not drawn, so no code execution may proceed.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §3.3 and §4.1-N.
- `mockup-lab/01-academics/academics-class-types.{html,md}` — preserve its
  shared class type language; do not redraw the already-decided hub examples.
- `mockup-lab/_shared/_visual-recipes.md` — use literal surface/radius/focus/
  motion values.
- `src/lib/academics/classTypeProposal.ts` — the actual two-state contract to
  depict; read-only reference for this drawing pass.
- `src/components/academics/ClassCenter.tsx` — current add/edit dialog owner;
  reference only, do not edit.
- `mockup-lab/VARIANT-LAB.md` and
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.

## 3. Work — draw only

### 3.1 New mockup and lab registration

Create:

- `mockup-lab/01-academics/academics-class-type-selection.html`
- `mockup-lab/01-academics/academics-class-type-selection.md`

Register it in `mockup-lab/variant-lab.html` under **Academics → Daily** with
`status:"proposed"`, the normal full-width product-frame treatment, and named
views rather than pretending that required state changes are aesthetic A/B/C
options.

Use these **views**, not variants:

1. `suggested-writing` — an entered course with attributable syllabus evidence
   proposes Writing.
2. `suggested-stem` — an entered BCPM/course-metadata class proposes STEM.
3. `needs-choice` — an ambiguous course has no highlighted chip and cannot be
   added until the student selects one.
4. `mobile` — the same `needs-choice` interaction at narrow width, preserving
   the one-row intent without horizontal clipping.

These are state requirements, not competing treatments. Do not invent A/B/C
just to populate the selector.

### 3.2 Layout and hierarchy

1. The state opens from **Add class** as the existing modal/page context; it is
   not a new route, onboarding wizard, or separate class-type settings page.
2. Keep the ordinary course fields quiet and compact: course code, resolved
   title/term line, then the type decision. The one decision must read as the
   center of the step, not as another long form section.
3. Use exactly one horizontal row of three equal chips:
   - **STEM** — “Topics and recall tools”
   - **Writing** — “Drafts, readings, feedback”
   - **General** — “Grades and deadlines”
4. In a suggestion view, one chip is **preselected as a proposal**, visibly
   distinct from a saved choice, followed by a one-line evidence reason such
   as “Suggested Writing — this syllabus includes writing work.” The other two
   remain available with equal visual weight.
5. In `needs-choice`, none is selected. The helpful one-line copy says why:
   “Choose the study layer that fits this class.” Do not call General a
   default, put a warning icon beside it, or imply that the course is missing
   information.
6. The bottom action is `Add class`. In `needs-choice`, it is disabled with an
   adjacent honest reason (“Choose a class type to continue”), not an error
   toast or a hidden requirement. In suggested states it is enabled, while
   still making clear that the student may choose a different chip first.
7. Add a small, quiet structural reassurance beneath the decision:
   “You can change this later. Grades, credits, and requirements stay the
   same.” It is reassurance, not a feature card.

### 3.3 Appearance and interaction rules

- Use the current Academics form rhythm, solid input/content surfaces, literal
  warm paper/dark ladders, and the shared radii. Glass belongs only on a truly
  floating overlay/context surface—not form fields or the type chips.
- The proposal explanation uses a compact source-aware line, not a badge that
  reads like an AI verdict. Never display a probability, confidence percent,
  score, rank, readiness number, or progress bar (U-9).
- Selection changes only the highlighted chip and explanatory line in the
  mockup. It must not mutate course metadata, BCPM, GPA, requirements, or a
  previously saved workspace.
- Each chip has keyboard focus, visible selection, and a pressed/selected
  state. Enter/Space selection and the disabled Add action are visible in the
  behaviour notes. Reduced motion changes opacity/border immediately; no
  bouncing chip or travelling checkmark.
- On mobile, stack the supporting code/title/context around the same three
  choice targets. Do not turn them into a dropdown, carousel, or multi-step
  wizard.

### 3.4 Adjacent decision record

The new `.md` must explicitly record:

- the precise **behaviour** of `suggestion` vs `needs-choice`, including that
  neither one writes until Add class;
- the **appearance** hierarchy: compact course context → three equal chips →
  evidence/reassurance line → action; selected proposal vs unselected state;
  solid form surfaces; mobile reflow; focus/reduced motion;
- why no A/B/C variants were used: the views are required outcomes of the
  actual backend contract, not alternatives to choose among;
- do-not rules: no AI certainty meter, no automatic type update after
  syllabus import/re-import, no expanded wizard, no fourth type, and no type
  badge on the eventual class card.

## 4. Do not break

- The approved existing Class Types parity drawing and all app-specific visual
  annotations.
- The exact three-value type model and all type-blind academic calculations.
- The pure proposal contract’s closed-source/local-first boundary.
- Existing saved workspace types and dormant data.
- Syllabus import/re-import confirmation-first behavior.
- Unrelated dirty documentation, output, and brief files.

## 5. Done when

- [ ] The lab has all four required views and loads each one directly.
- [ ] Every view visibly distinguishes an uncommitted proposal from an
  unselected required choice.
- [ ] The proposed chip names its actual evidence source in human language;
  the ambiguous state names no made-up reason.
- [ ] The draw contains exactly STEM, Writing, and General—no hidden default,
  type dropdown, fourth option, confidence score, or U-9 proxy.
- [ ] The Add action has an honest enabled/disabled state and the choice can
  be changed before creation.
- [ ] Warm dark, paper, narrow/mobile, keyboard-focus, and reduced-motion
  appearance are recorded in the adjacent decision file.
- [ ] The new registry entry remains `proposed`; no `src/` file or manifest
  row changes in this stage.

## 6. Commit

`feat(mockups): draw explicit class-type selection states`

Commit only the new mockup, its decision record, and its lab registration.
Keep unrelated work separate.

## 7. Next stage — not in this brief

After Andy approves the selection drawing, run the next **Stage E fidelity
brief**. It will consume `proposeClassType()` in the existing add-class form,
remove the hard-coded unsaved STEM default, require a choice only for
`needs-choice`, and measure the selected state in both themes. That UI work is
not authorized in this drawing pass.

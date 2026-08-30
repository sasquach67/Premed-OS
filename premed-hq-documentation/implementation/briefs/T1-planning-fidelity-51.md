# T1 · Academics Planning — approved Variant A fidelity

**Stage:** E · frontend fidelity only  
**Corrected:** 2026-08-27 after the final Academics approval  
**Execution target:** Variant A only

## 1. Audit before implementation

### A. Spec → paper

Pass. `tabs/01-academics.md` §4.2 now rules **two Planning destinations**:

1. **Planner** — the timeline-first course-sequencing workbench.
2. **Grades & Archive** — transcript record, dual GPA, What-if, grade decisions,
   rollover, forecast record, and term retrospective.

Requirements/Tar Heel Tracker and Add course are **named in-context Planner
views**, not sibling tabs. The approved Planner Variant A makes both first-class
regions: source-bearing Plan coverage beside the timeline and course discovery
below it. The old `Planner · Requirements · Grades & Archive` navigation is
superseded.

### B. Mockup → app

The approved mockups and decisions exist, and the manifest marks them `YES`.
The behavior owners also exist, but the current live composition is structurally
different from the drawing:

| Approved region | Current app before this pass | Result |
|---|---|---|
| Two Planning tabs | Three tabs, including a separate Tar Heel Tracker | **Divergent** |
| Compact plan control strip | Generic card header only | **Missing** |
| Editable planning-context strip | No corresponding visual region | **Missing** |
| Timeline-first board in the main column | Board nested inside one generic full-width card | **Partial** |
| Persistent Plan coverage workbench beside the board | Generic outcome rail; requirement evidence lives on another tab | **Missing** |
| Wide course-discovery bay below the timeline | No corresponding visual region | **Missing** |
| Unplaced tray immediately after the workbench | Present but visually generic and detached | **Partial** |
| Course inspector replaces the outcome rail | Functional and structurally correct | **Preserve** |
| Grades & Archive three-view composition | Functional owner exists; needs literal surface treatment | **Partial** |

### C. Already built — preserve

- Planner term persistence, term locks/notes, placement preview, and protected
  course behavior.
- Selected-course inspector and explicit placement commit.
- Saved-plan compare/restore behavior.
- Source-backed Planning library and its official-audit boundary.
- Transcript-faithful ledger, dual GPA, What-if, rollover, forecast record, and
  term report behavior.
- All local-first storage and migrations.

### D. Gate

`BUILD-MANIFEST.md` marks the Planner, Planning library, Grades & Archive,
planning decisions/cold start/rollover/retrospective/forecast surfaces `YES`.
The approved Variant A decision records appearance and behavior. Implementation
is authorized; `BUILT` remains a separate six-proof decision.

## 2. Literal visual source

- `mockup-lab/01-academics/academics-planner-prototype.html` + `.md`
  - `?variant=A&view=plan`
  - `?variant=A&view=requirements`
  - `?variant=A&view=catalog`
- `mockup-lab/01-academics/academics-grades-archive.html` + `.md`
  - ledger, GPA, What-if, transcript record/empty/export, term retrospective
- Approved supporting Planning mockups and their same-name `.md` files:
  `academics-planning-decisions`, `academics-planning-cold-start`,
  `academics-term-rollover`, `academics-term-retrospective`,
  `academics-forecast-accuracy`, and `academics-grade-decisions`.
- `mockup-lab/_shared/_visual-recipes.md`
- `premed-hq-documentation/tabs/01-academics.md` §4.2, §6.8–§6.10, and
  Planning acceptance criteria.

Each new Planning-scoped style/component section must carry a concise source
comment naming the exact mockup HTML and Variant A/view. The app must not embed,
iframe, or import the mockup at runtime; values are transferred into app-native
React/CSS.

## 3. Measured baseline and target

Measured at the real Lab review viewport and the live `localhost:5173` route.
Geometry target values come from the mockup CSS rule because the Lab scales the
isolated frame for review.

| Property / surface | Approved mockup target | Live app before pass |
|---|---:|---:|
| Dark page → card → muted ladder | `#211e1a → #2b2722 → #322e28` | exact tokens available, but generic nesting obscures the step |
| Dark border | `#3c352d` | `#3c352d` |
| Paper page → card → muted ladder | `#f7efe1 → #fffaf0 → #efe6d4` | exact tokens available |
| Display/body type | Baloo 2 `800` / Nunito | correct families available |
| Panel radius | `16px` | outer board `16px` |
| Term radius / padding / width | `13px / 11px / 238px` | `18.4px / 12px / 208px` |
| Course radius / padding | `10px / 8px` | `14.4px / 8px` |
| Main workbench columns | `minmax(0,1fr) 334px`, `12px` gap | generic `minmax(0,1fr) 20rem`, no persistent coverage region |
| Filter/context spacing | `10px 24px`, gaps `9px / 7px` | absent |
| Card title | Baloo 2 `800`, `16px` | generic heading scale |

Both themes must retain the same geometry. Color measurement after the pass must
prove the paper and charcoal ladders separately.

## 4. Work authorized in this pass

### 4.1 Shared Academics route — Planning hunk only

- Render only `Planner · Grades & Archive` in Planning navigation.
- Redirect the retired Tracker destination to Planner's requirement-map view.
- Remove the old generic Planner ledger stack from the default Planner canvas.
  Preserve its behavior through existing in-context actions and Grades & Archive;
  do not delete store data or underlying reusable functions.
- Do not change either Daily tab or Daily render branch.

### 4.2 Planner Variant A

Recompose the existing behavior into the exact approved reading order:

1. compact plan control strip;
2. planning-context strip;
3. timeline-first board of 238px solid term columns;
4. inline MCAT divider;
5. persistent source-bearing Plan coverage rail;
6. outcome guidance, replaced by the selected-course inspector on selection;
7. wide sage-edged course-discovery bay;
8. unplaced tray;
9. requirements as an on-demand right drawer, not a destination.

Use actual local records. If catalog data is unavailable, retain the exact bay
shape but show the honest “data not ingested” state; never insert mock UNC facts.
Search/filter controls must operate on available local records or be replaced
with a truthful official-source action. No inert controls.

### 4.3 Grades & Archive Variant A

Retain ledger/GPA/What-if behavior and copy the mockup's exact card/row ladder,
control density, typography, 16px outer panels, 13px muted rows, and responsive
composition. Supporting grade/rollover/report surfaces stay inside this tab.

### 4.4 Responsive structure

- `>1000px`: timeline/main column + 334px coverage rail.
- `701–1000px`: one main column; coverage spans full width; supporting outcome
  surfaces may form two columns.
- `≤700px`: 12px canvas padding; 220px horizontally scrolling terms; course
  discovery and coverage become deliberate full-width blocks; drawer is full
  width; no control clips.
- Reduced motion removes transitions without removing focus or selection state.

## 5. Do not break

- No new planning arithmetic, degree verdict, completion percentage, or U-9
  score.
- No mock or illustrative data in the production app.
- No store, migration, catalog data, transcript, or Grade/What-if logic change.
- No Daily component, Daily route branch, `src/index.css`, shell, or non-Academics
  change.
- No glass below the banner; only the mode pill and banner stats use glass.
- No generic dashboard-card reinterpretation of the approved workbench.

## 6. Done when

- [x] Two Planning tabs only; retired Tracker deep-link resolves inside Planner.
- [x] All nine Planner regions appear in the approved order.
- [x] Plan coverage and course discovery are visible without opening a drawer.
- [x] Selected-course inspector replaces outcome guidance and commits nothing.
- [x] Desktop and narrow screenshots are side-by-side comparable with Variant A.
- [x] Dark and light computed values prove page → card → muted → course ladder.
- [x] Geometry proves 334px rail, 238/220px term width, 13px term radius, 10px
      course radius, and literal filter/context spacing.
- [x] Every new visible control has a handler or an explicit unavailable-data state.
- [x] Planning-focused tests and production build pass.
- [x] No Daily-owned or unrelated dirty hunk changes.

### Execution evidence · 2026-08-27

| Measurement | App result | Approved target |
|---|---:|---:|
| Desktop coverage rail | `333.99px` | `334px` |
| Desktop / narrow term width | `237.99px / 220px` | `238px / 220px` |
| Term radius / padding | `13px / 11px` | `13px / 11px` |
| Course radius / padding | `10px / 8px` | `10px / 8px` |
| Filter / context padding | `10px 24px` | `10px 24px` |
| Filter / context gaps | `9px / 7px` | `9px / 7px` |
| Dark ladder | `#211e1a → #2b2722 → #322e28`, border `#3c352d` | exact |
| Paper ladder | `#f7efe1 → #fffaf0 → #efe6d4`, border `#e9e2d5` | exact |

The real store contains more coursework than the illustrative mockup. Term
columns therefore use an obvious internal scrollbar and a `640px` bound so the
timeline remains the bounded workbench drawn in Variant A without hiding or
discarding a course or action.

Verified interactions: saved-plan compare dialog, requirement-map drawer,
course inspector replacement, term dialog, ledger/GPA/What-if routing, and
What-if assumption insertion. Scoped result: 9 test files / 66 tests passed;
TypeScript, scoped ESLint, and the production build passed.

## 7. Commit

`fix(planning): port approved Variant A workbench literally`

Because the primary tree is already dirty, stage only Planning-owned new hunks;
never stage a whole pre-dirty file without a reviewed patch.

## 8. Next stage — out of scope now

After this brief executes, re-run the router. The next pass is page-level
promotion proof, not another redesign. No surface becomes `BUILT` until all six
Variant Lab proofs pass, including reload persistence, honest empty store,
configured integrations, zero inert controls, and commit provenance.

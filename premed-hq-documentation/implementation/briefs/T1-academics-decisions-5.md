# T1 · Academics — end-of-term evidence surfaces

**Stage:** B · DRAWN, NOT DECIDED  
**Status:** decision brief only. Do not modify `src/`, the store, migrations,
generation, or external configuration in this pass.

## 1. Fidelity audit

### A. Spec → paper

The two ruled Planning / Grades surfaces that remain after the completed
Requirements pass have paper coverage:

| Ruled feature | Paper evidence | What it must not become |
| --- | --- | --- |
| #43 Term retrospective, fired by the term rollover ritual | `mockup-lab/01-academics/academics-term-retrospective.{html,md}` | A standing dashboard, study-method score, causal claim, or grade on how the student studied. |
| #52 Forecast accuracy ledger, based on resolved per-review predictions | `mockup-lab/01-academics/academics-forecast-accuracy.{html,md}` | An exam forecast, lone percentage, ranking, or a caveated prediction below the sample gate. |

No ruled feature in this scoped pair is undrawn, so stage A passes. The
existing term rollover ritual is already represented by
`academics-term-rollover.{html,md}` and is not being redrawn here.

### B. Mockup → app

| Surface | Existing app evidence | Translation state |
| --- | --- | --- |
| Term rollover ritual | `src/components/academics/TermRollover.tsx`, backed by `src/lib/academics/termRollover.ts` | **Built foundation.** It archives a completed course, preserves topics, and allows their three fates. It does not create or open #43's retrospective. |
| Term retrospective | No `TermRetrospective` component, model, route, or renderer in `src/` | **Mockup only.** |
| Forecast accuracy ledger | No `ForecastAccuracy` component, resolved-prediction record, sample gate, or renderer in `src/` | **Mockup only.** |

#### Measured primary record surface

The relevant product surfaces do not yet exist in the app, so there is no
running retrospective or forecast-ledger element whose computed style could be
measured. The latest concrete Academics comparison is the Requirements audit
recorded in `T1-academics-requirements-decisions.md` (Aug. 22): its app primary
card is `rgb(43, 39, 34)` / `#2b2722`, matching the mockup card rung, while the
older tracker hierarchy did not match the mockup's inner data rung. That gap was
translated in `f71e156`.

This is deliberately **not** a claim that the two new surfaces match. Their
future implementation brief must measure the actual retrospective and ledger
in both themes via `getComputedStyle`, including the canvas → card → dense-data
ladder.

### C. Already built — preserve, do not rebuild

- Term rollover's course archive, three topic fates, `Pause everything`, and
  non-destructive persistence: `b4f9a2e` and the subsequent code in
  `TermRollover.tsx`.
- Planner's operational term building and scenario persistence: `b4f9a2e`.
- Requirements audit's transparent, no-completion-maths screen: `f71e156`.
- Existing review, topic, assignment, course, transcript, and mistake records.
  A future ledger reads recorded history; it does not create a second scheduler,
  fill a history gap with estimates, or replace Anki review/scheduling.

### D. Gate

`BUILD-MANIFEST.md` has **no row** for either
`academics-term-retrospective.html` or `academics-forecast-accuracy.html`.
They are currently `status:"proposed"` in `mockup-lab/variant-lab.html`.

The decision work is safe to record, but no implementation is authorized after
it until Andy explicitly adds and clears the applicable manifest rows. Do not
edit the manifest in this pass.

### E. Decision records

Both decisions files record behaviour **and** appearance, but both explicitly
leave the implementation composition unchosen:

| Surface | Unresolved choice | Why that blocks code |
| --- | --- | --- |
| Term retrospective | A one honest page, or B sectioned review | A has the required end-of-term narrative; B changes the page into a course-by-course interrogation surface. |
| Forecast ledger | A plain-language ledger, B prediction table, or A with B on demand | A makes a claim about the app readable; B makes each call checkable but is denser and colder. |

This is stage B, not C. The mockups are not an instruction to silently choose a
variant.

### F. Integrations and services this surface owns

| Dependency | Classification | Student-visible state today | Decision-pass action |
| --- | --- | --- | --- |
| Local history (topics, reviews, assignments, student-marked mistakes, term rollover) | **CODE BUILT** | Rollover preserves the record; no retrospective is displayed. | Decide the reading composition only. |
| Retrospective observations and thin-state gate | **CODE MISSING** | No retrospective exists. | A later authorized build owns the derived-record policy and its reload tests. |
| Per-review prediction capture, resolution, calibration bands, and forecast suppression | **CODE MISSING** | No forecast claim or accuracy ledger is shown. | A later authorized build owns this full model; do not fabricate a hit rate from existing aggregate data. |
| External provider / cloud service | **NOT REQUIRED** | Nothing waits on a key or OAuth setting. | Keep this deterministic and local. |

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` #43, #52, §6.10-C, §6.12,
  and the U-9 / honest-absence rules.
- `mockup-lab/01-academics/academics-term-retrospective.{html,md}`.
- `mockup-lab/01-academics/academics-forecast-accuracy.{html,md}`.
- `mockup-lab/01-academics/academics-term-rollover.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md`,
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`, and
  `premed-hq-documentation/implementation/component-inventory.md`.
- `src/components/academics/TermRollover.tsx` and
  `src/lib/academics/termRollover.ts` — audit only in this pass.

## 3. Decisions required

### 3.1 Term retrospective — choose **A** or **B**

- **A · One honest page — recommended.** A narrow reading column: what was
  recorded, a few count-attached observations, what to carry forward, then the
  non-causation limit. This directly preserves #43's "one honest page" rule;
  the occasional secondary class detail can open from a quiet disclosure later.
- **B · Sectioned review.** One question at a time, with per-class rows. It is
  more inspectable but weakens the through-line and risks reading like a
  performance dashboard.

The thin state belongs to the selected composition. It remains a quiet honest
absence: no page is generated from lightly tracked history, and it never scolds
the student.

### 3.2 Forecast accuracy — choose **A**, **B**, or **A + B on demand**

- **A · Plain-language ledger — recommended default.** Each confidence band has
  a sample-attached sentence and a restrained verdict word. It makes clear the
  ledger checks Premed OS, not the student.
- **B · Prediction table.** Each resolved call is itemised so a student can
  inspect one topic. It is useful audit detail but too dense as the default.
- **A + B on demand — recommended overall.** A remains the surface default;
  "See resolved calls" opens B as a contextual detail view, not a permanent
  subtab. The below-gate state suppresses **both** any forecast and the ledger.

No selected treatment may show a lone hit rate, a composite, a ranking, an
exam-readiness forecast, or data below the honest sample/accuracy gate.

**Approval response format:** `Retrospective A or B; Forecast A, B, or A+B`.

## 4. Work in this pass

After Andy's selection, update only these two decision records to state the
chosen hierarchy, responsive behaviour, and why it won. Keep alternate lab
views available for review but make the selected treatment the implementation
source of truth. Do not change `src/` or the build manifest.

## 5. Do not break / do not decide silently

- Do not alter annotations or hand-tuned app behaviour because an older mockup
  differs.
- Do not promote either lab page to built.
- Do not invent correlations, causal study advice, grades, percentages without
  a denominator, scores, rankings, or progress bars.
- Do not change FSRS ownership, introduce a second scheduler, or add Anki card
  review/scheduling.
- Do not copy a mockup's inline CSS, font, colour, radius, or spacing value
  into source.

## 6. Done when

- [ ] Andy explicitly chooses the retrospective composition.
- [ ] Andy explicitly chooses the forecast-ledger composition.
- [ ] The two `.md` records name the chosen treatment and its appearance,
  hierarchy, responsive behaviour, and evidence boundary.
- [ ] The manifest remains untouched and both lab entries remain proposed.
- [ ] `git diff --check` passes and only decision documentation is committed.

## 7. Commit

`docs(academics): decide end-of-term evidence surfaces`

Commit unrelated work separately.

## 8. Next stage — C · DECIDED, NOT BUILT (not in scope here)

After the choices are recorded **and** Andy clears the corresponding mockups in
`BUILD-MANIFEST.md`, rerun the tab brief. The next brief may define one
authorized full implementation vertical at a time: data model, persistence,
empty/history gates, frontend translation, handler/reload/empty-store proofs,
and both-theme computed-style fidelity. It does not start in this decision
pass.

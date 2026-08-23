# T1 · Academics — Forecast Accuracy: earned calibration, not a student score

**Stage:** C · DECIDED, NOT BUILT  
**Execution status:** **blocked by manifest authorization.** This is the
implementation-ready brief for one vertical only. It may not be executed until
`BUILD-MANIFEST.md` gains an explicit `Build? = YES` row for
`01-academics/academics-forecast-accuracy.html`. Writing this brief does not
authorize that change.

## 1. Fidelity audit

### A. Spec → paper

The ruled #52 feature is fully drawn and decided:

| Required behaviour | Paper source | Selected treatment |
| --- | --- | --- |
| Record a retrievability prediction before every eligible recall attempt and resolve it from that attempt | `tabs/01-academics.md` #52, §6.12 | Local, append-only prediction outcomes; never exam forecasts. |
| Suppress the product claim until it has earned enough evidence | `academics-forecast-accuracy.html?view=suppressed` | Quiet absence with no number, table, chart, or caveat. |
| Readable accountability claim about Premed OS | `...?view=earning` | **A** is the default: sample-attached plain-language ledger. |
| Audit one individual call | `...?view=table` | **B on demand** via `See resolved calls`; never a permanent Archive subtab. |

`academics-forecast-accuracy.md` records the selected A + B-on-demand
composition, evidence boundary, surface hierarchy, and below-gate treatment.
Stage A and Stage B pass.

### B. Mockup → app

| Surface / requirement | Existing application evidence | Result |
| --- | --- | --- |
| Recall attempt and explicit grade | `AcademicRecallSession.tsx`, `ReviewEvent`, `activeRecall.ts` | Built. The review runner persists a self-grade and updates FSRS. |
| Pre-attempt system expectation | `topicRetrievability()` and the current topic FSRS state | Built calculation seam, **not recorded** before a review. |
| Resolved prediction record / version / outcome | `ReviewEvent` only has `id`, `topicId`, `timestamp`, `grade`, `confidence`, and `order` | Missing. No immutable record can truthfully say what the app called before the response. |
| Sample gate and calibration aggregation | No `ForecastAccuracy` module, model, or tests | Missing. |
| Archive owner and A/B/suppressed renderer | `GradesArchive.tsx` has Ledger, GPA, and What-if only | Missing. |

There is therefore no live Forecast Accuracy surface to measure. The existing
Grades & Archive token ladder is a foundation only, not fidelity proof for this
screen. Before promotion, measure the actual canvas → primary ledger card →
dense resolved-call row with `getComputedStyle` in both themes.

### C. Already built — preserve

- Active Recall response flow, typed/microphone response handling, source
  disclosure, preferences, and timer-only Focus mode: `d712de3`.
- One authoritative FSRS review loop and append-only `ReviewEvent` history.
  Anki remains external and owns its own review history.
- Grades & Archive's Ledger, GPA, and What-if owners: `4cfdccd`.
- Term Report's contextual Archive route: `14ee5f8`; do not turn this ledger
  into a report or another dashboard.
- The separate **Predict** learning exercise (`TopicPrediction` and
  `predict.ts`). It is a pre-lecture priming exercise and is explicitly never
  graded. It must not be reused, renamed, or silently converted into this
  calibration record.
- Current app-specific visual annotations. Where they differ from an older
  screenshot, later app rulings win unless they conflict with a locked rule.

### D. Gate

`BUILD-MANIFEST.md` has **no Forecast Accuracy row**, and the lab page remains
`status:"proposed"`. Do not edit either file in an implementation pass unless
Andy explicitly clears it. Until then, this document is a design/engineering
plan only; no `src/`, store, migration, or Edge Function change belongs to it.

### E. Integration state

| Dependency | Classification | Student-visible state now | Required result |
| --- | --- | --- | --- |
| Local FSRS state and review events | Code built and configured | Reviews work; Premed OS makes no calibration claim. | Reuse as the only source of the prediction and resolution. |
| Durable outcome record, migration, aggregation, and renderer | Code missing | No Forecast Accuracy view. | One lossless local model and deterministic Archive view. |
| AI, provider key, network, Canvas, Google, or file storage | Not required | Nothing is blocked on account configuration. | Keep this entirely deterministic and local. |

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` #52 and §6.12; U-9,
  §6.13, and §6.14 boundaries.
- `mockup-lab/01-academics/academics-forecast-accuracy.{html,md}` — selected
  implementation source: A default, B contextual detail, below-gate absence.
- `src/pages/AcademicRecallSession.tsx`, `src/lib/academics/activeRecall.ts`,
  `src/lib/academics/fsrs.ts`, and `src/lib/types.ts`.
- `src/components/academics/GradesArchive.tsx` and
  `src/lib/academics/gradeLedger.ts`.
- `mockup-lab/_shared/_visual-recipes.md`,
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`,
  and `premed-hq-documentation/implementation/component-inventory.md`.

## 3. Work — only after the manifest gate is cleared

### 3.1 Record the app's call before the student responds

Add one append-only `RetrievabilityPrediction` (or equivalently named) record
owned by the existing Academics class-center data. It represents **the app's
own pre-attempt claim**, not the student's confidence and not `TopicPrediction`.
It stores only what can be known at that moment:

- id, topic id, course id, `predictedAt`, and stable order;
- the qualitative predicted band (`solid`, `fading`, or `likely-gone`) plus
  the scheduler/model version needed to interpret the call later;
- the bounded bucket / interval used to choose that band, never a single
  UI-facing precision percentage;
- the first subsequent eligible recall event id, resolution time, and binary
  resolution (`recalled` or `blanked`) once it exists.

Create the record immediately before the active-recall answer is revealed or
graded, from the exact FSRS state and clock the runner used to select the
topic. Resolve it only when that review receives the student's explicit grade:
`again` resolves `blanked`; `hard`, `good`, and `easy` resolve `recalled`.
The original prediction never changes after resolution. A skip, timer-only
Focus session, abandoned queue item, imported Anki activity, or activity with
no student grade creates no resolution and cannot be counted.

Do not reconstruct old predictions from today's FSRS state or existing review
history: that would manufacture what the app "said". Existing history remains
untouched and starts contributing only after an authentic prediction was
recorded. Add one versioned, lossless, idempotent migration that initializes an
empty collection only; prove frozen input and double-run safety.

### 3.2 Deterministic calibration, with an earned right to speak

Implement a pure `forecastAccuracy` module that reads resolved records and
returns either a structured, no-claim absence or sample-attached qualitative
band summaries.

- Keep every resolved call in the denominator. Never remove inconvenient
  misses, merge calls, score an exam forecast, or compute a global student
  performance rating.
- Use the exact recorded band and resolution. Do not re-bin or re-evaluate old
  calls under a later scheduler version; display a model-version boundary if a
  later implementation introduces one.
- A band may render only when its own denominator meets the documented sample
  threshold, and the whole surface stays suppressed until the overall
  week-four gate can make at least one useful, sample-attached statement. The
  threshold must be a named, tested constant with an explanation—not a hidden
  magic number. It must be calibrated against ordinary review cadence so the
  §6.12 week-four bar is actually provable.
- Show counts with their denominator and a qualitative verdict, for example:
  “When Premed OS called a topic solid, you recalled it on 8 of the next 9
  attempts.” Do **not** show a lone percentage, score, composite, rank, or
  progress bar. The ledger evaluates the app's calibration, never the student.
- Below the gate, render only the honest absence: what kind of future evidence
  is needed, without a preview percentage, a skeleton table, fake zero, or
  promise that the student is behind.

The implementation must make the relationship between a prediction band and a
result inspectable: the B detail opens only resolved calls, in chronological
order, with date, topic, qualitative call, and outcome. It must not disclose a
numeric algorithm weight or imitate an exam-grade ledger.

### 3.3 Put the result in one Archive home

Add Forecast Accuracy as a contextual **Grades & Archive** document/state,
not a fourth standing Planning tab, Class Hub tab, Daily widget, toast, or
recommendation. The default route opens A's reading sequence. `See resolved
calls` reveals B as a nested/contextual detail and returns to A without losing
the state. The zero-data/below-gate case has no link from unrelated surfaces;
it may be reached only from the quiet Archive context once real prediction
records exist.

Translate the selected A hierarchy literally:

1. `What Premed OS called, and what happened` eyebrow and an ordinary-language
   title making the accountability direction clear.
2. One band row at a time: qualitative call → result sentence with denominator
   → word-only verdict. The sample size is part of the sentence, not an
   invisible tooltip.
3. A restrained explanatory boundary: a miss is evidence that the app's
   scheduling call may need calibration, not evidence the student failed.
4. A quiet `See resolved calls` action for B; no permanent side rail or metric
   dashboard.

The below-gate state is a spacious dashed absence with no graph and no
generated/sample content. A future model version or inadequate per-band
evidence has the same honest treatment; it never fills a missing row from a
different band.

### 3.4 Appearance, accessibility, and interaction

- Use existing Archive owner controls, Card, Button, Dialog/Collapsible, and
  row primitives; configure them rather than creating a calibration component
  family.
- The required solid ladder is warm dark `#211e1a → #2b2722 → #322e28`, with
  `#3c352d` borders and `16px → 13px` radii; paper is
  `#f7efe1 → #fffaf0 → #efe6d4` with `#e9e2d5` borders. The floating banner
  is the only permitted glass surface.
- The blue calibration accent is restrained and informational. It may not
  imply completion, urgency, medical status, or a second score system.
- On narrow screens, A's rows stack in their written order and B remains a
  readable list. Every control is keyboard reachable, labelled, and visibly
  focused; reduced motion uses existing short transitions only.

## 4. Do not break

- Do not touch the non-graded pre-lecture Predict exercise or alter its
  “never graded” promise.
- Do not create a second scheduler, FSRS state, Anki history, study-time
  estimate, exam-readiness forecast, AI call, network call, or secret.
- Do not backfill historic predictions, infer an outcome, invent a sample, or
  let a self-confidence selection substitute for a recall grade.
- Do not display an overall score, rank, progress bar, GPA-like value, or
  causal statement about the student's study habits.
- Do not mutate ReviewEvents, Topics, courses, archived records, or the
  existing Grades & Archive ledger when calculating calibration.
- Preserve all unrelated dirty documentation and app-specific visual
  annotations. Do not modify the manifest or promote the lab page in this
  implementation commit.

## 5. Done when

- [ ] A pre-answer prediction is persisted exactly once for each eligible
  student-graded recall attempt and resolves once from that same attempt.
- [ ] Tests prove skips, Focus timers, no-grade exits, and old review history
  never create a resolved call; `again` resolves blanked and the other explicit
  grades resolve recalled.
- [ ] Migration tests prove existing stores retain every byte of prior
  Academics data, gain only an empty prediction collection, and are idempotent
  on frozen input.
- [ ] Aggregation tests prove no call is dropped, bands cannot cross-contaminate,
  no claim renders below the named overall/per-band gates, and output contains
  denominators plus qualitative verdicts but no standalone percentage.
- [ ] The default Archive document, contextual resolved-call detail, and
  below-gate absence work across reload/back-forward without creating or
  rewriting predictions.
- [ ] Empty-store inspection proves no mock prediction, count, verdict, or
  sample copy survives. Every Button, DropdownMenuItem, and ContextMenuItem on
  the surface has a handler or an explicit disabled reason.
- [ ] Computed-style evidence records canvas, primary card, and dense row in
  warm-dark and paper themes against the literal ladder above.
- [ ] Targeted and full tests, production build, and the inert-control audit
  pass. Commit only this vertical's files.

## 6. Commit

`feat(academics): calibrate per-review retrievability predictions`

## 7. Next stage — not in this brief

After a real review history reaches the gate, run the six-condition page
promotion audit for `academics-forecast-accuracy`: visual measurements, live
handlers, reload persistence, empty-store honesty, no integration requirement,
and commit recorded in its decision file. **First, Andy must explicitly add
and clear the manifest row; that approval is not implied by this brief.**

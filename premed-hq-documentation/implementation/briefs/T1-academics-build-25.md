# T1 · Academics — Term Report: evidence-led rollover synthesis

**Stage:** C · DECIDED, NOT BUILT  
**Status:** implementation brief only. It defines one end-of-term vertical:
rollover → evidence review → deterministic report facts → optional bounded AI
synthesis → saved, explainable Term Report. It does not build Forecast Accuracy,
a second scheduler, or a standing Academics dashboard.

## 1. Fidelity audit

### A. Spec → paper

The ruled #43 surface is now drawn and decided in
`mockup-lab/01-academics/academics-term-retrospective.{html,md}`:

| Ruled behaviour | Decided paper surface |
| --- | --- |
| Fires from the end-of-term rollover rather than becoming a standing tab | Term Report entry from the rollover completion state |
| Provides useful cross-course and next-term learning without false causality | Term-at-a-glance facts, plain-language takeaways, and small next-term experiments |
| Uses actual class evidence | Final course grades, returned work, student-marked mistakes, review history, confirmed notes/feedback, and only explicitly selected class material |
| Explains why every takeaway appears | Evidence link on each finding, returning to a record, note, feedback item, or cited material span |
| Says nothing invented for a lightly tracked term | “Too little to say” state, not a zero report or generic study advice |

Stage A passes for this vertical.

### B. Mockup → app

| Surface | Existing app evidence | Translation state |
| --- | --- | --- |
| Term rollover | `src/components/academics/TermRollover.tsx`; `src/lib/academics/termRollover.ts` | Built. Preserves courses/topics and applies topic fates. |
| Course/assessment history | `Course`, `ClassAssignment`, `AcademicMistake`, `ReviewEvent`, `ClassNote`, `FeedbackNote`, and source chunks in `src/lib/types.ts` | Built inputs, not yet assembled as a term-level evidence set. |
| Source-linked AI generation | `src/lib/intelligence/studyTools.ts`, `supabase/functions/study-tools/index.ts`, and closed citation logic | Built generic seam, not a Term Report artifact or local-record evidence route. |
| Term Report | No component, persisted entity, report compiler, artifact schema, tests, or route in `src/` | Not built. |

The report has no app surface yet, so it cannot be visually measured. The
implementation must measure its actual canvas → report card → evidence-row
ladder with `getComputedStyle` in both themes before promotion.

### C. Already built — preserve, do not rebuild

- Non-destructive term rollover and topic fates: `b4f9a2e`.
- Requirements audit: `f71e156`.
- The existing Class Hub five-tab grammar and Materials-versus-Notes boundary.
- Existing source-only study tool policy, server-side provider seam, closed
  material citation validation, and user-owned course records.
- Existing annotations in the live app. They are later product rulings and win
  over a stale screenshot where they differ.

### D. Gate

`BUILD-MANIFEST.md` currently has **no row** for
`01-academics/academics-term-retrospective.html`. This brief is complete enough
to execute only after Andy adds that row with **Build? = YES**. Do not edit the
manifest in this work.

### E. Decision record

**Pass.** The selected treatment is the readable **Term Report**: one report
page with a completion stamp, term-at-a-glance facts, plain-language course
takeaways, specific carry-forward experiments, and an explicit evidence limit.
The report is not a dashboard, scorecard, ranking, or a permanent subtab.

### F. Integrations and services this surface owns

| Dependency | Classification | Student-visible state today | Required result |
| --- | --- | --- | --- |
| Local courses, assignments, review events, notes, feedback, mistakes, and source chunks | **CODE BUILT** | Records exist independently; no report reads them together. | Compile a conservative, local evidence snapshot without changing the originals. |
| Term Report entity, evidence references, eligibility gate, and reload-safe report history | **CODE MISSING** | No report exists. | Add one versioned, lossless store migration and tests. |
| Study-tools source-citation route | **CODE BUILT; Term Report contract missing** | Existing source-linked artifacts use it; no report can be generated. | Add a bounded report request/output schema and keep cited material closed. |
| Provider secret / deployment | **CODE BUILT; live configuration unverified in this brief** | A provider-backed report may be unavailable and must say so without saving a partial report. | Preserve an honest unavailable state. Do not place a key in `src/` or require a browser key. |

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` #43, #47–49, #55, §6.10-C,
  §6.12, §6.14, and all U-rules.
- `mockup-lab/01-academics/academics-term-retrospective.{html,md}` — Variant A
  is the implementation source.
- `mockup-lab/01-academics/academics-term-rollover.{html,md}`.
- `src/components/academics/TermRollover.tsx` and
  `src/lib/academics/termRollover.ts`.
- `src/lib/types.ts`, `src/store/store.ts`, and current migration tests.
- `src/lib/intelligence/studyTools.ts`, `src/lib/generation/citations.ts`, and
  `supabase/functions/study-tools/index.ts`.
- `mockup-lab/_shared/_visual-recipes.md`,
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`, and
  `premed-hq-documentation/implementation/component-inventory.md`.

## 3. BACKEND — evidence first, AI second

### 3.1 One durable report record

Add a versioned `TermReport` record under the existing Academics class-center
data. It owns:

- the human term label and its included course ids;
- creation/updated time and a report state (`draft`, `ready`, `unavailable`, or
  `insufficient-evidence`);
- a frozen, structured evidence snapshot; and
- the saved report blocks and their references.

It never duplicates or mutates courses, assignments, notes, materials,
mistakes, or review events. It is a reading of history at report time, not a
new truth about the student. Reopening it later shows the saved report and its
evidence; regenerating creates a new revision rather than silently replacing a
previously read report.

Use discriminated evidence references for local records (`course`,
`assignment`, `mistake`, `review-event`, `note`, `feedback`) and the existing
file/chunk/span references for selected material. A report block must carry one
or more references. A material quote must preserve exact chunk offsets; a local
fact must link back to the exact local record.

### 3.2 Compile facts deterministically

Build a pure `termReportEvidence()` module before any model call. Given a term
and the current store, it collects only:

1. **Course facts:** completed courses in that term; each final letter grade only
   when the student recorded it.
2. **Returned work:** assignments with both earned and possible points, named
   assessments, and student-entered course feedback where present.
3. **Study evidence:** append-only review events, student-marked mistakes and
   their optional student-selected causes, and explicit class/exam-review notes.
4. **Optional supporting material:** only course material the student checks in
   the report source-review view. Course material explains content or instructor
   feedback; it never becomes evidence that the student used a study method.

Do not infer study behaviour from uploads, topic links, raw file presence,
calendar events, or unmeasured time. A transcript/slides file can support a
specific factual takeaway only if selected and cited; it cannot prove “you
studied this way.”

The compiler returns an eligibility result with plain reasons. A report may
open only when it has meaningful term facts plus enough supporting evidence to
describe at least one observation. If there is too little, persist the honest
absence/reason or show the thin state without calling a model. Never use demo
data, averages, a completion percentage, or a generic productivity lesson.

### 3.3 Bounded AI synthesis

AI is for turning the compiled, closed evidence set into readable language—not
for discovering evidence, diagnosing a student, or deciding how they studied.

The Term Report artifact contract must require:

- 2–4 plain-language takeaways, each with exact evidence refs;
- 1–2 bounded **“Try next term”** experiments stated as suggestions, never as
  causal conclusions or prescriptions;
- an explicit limit block separating recorded facts from the suggestions;
- no score, grade prediction, composite, rank, inferred habit, clinical/mental
  health claim, or claim that a method caused a grade;
- no use of material outside the source-review selection and no unsupported
  prose block.

Examples of acceptable language:

- “You marked 14 of 23 saved trouble spots as ‘knew it, but blanked.’ A short
  closed-notes check before re-reading may be worth trying next term.”
- “CHEM 262 has four saved post-exam notes. Put a short returned-work review on
  the calendar while feedback is fresh.”

Examples that must fail validation:

- “Retrieval practice improved your CHEM grade.”
- “You are a visual learner.”
- “You spent too little time studying.”

Reuse the authenticated `study-tools` transport and source-citation closure for
selected material. Extend the response validator so every local-record ref is
an id present in the submitted deterministic snapshot, and every material ref
is within the verified closed citation set. Reject the entire generated draft
if any block lacks valid evidence. No partial report is saved.

### 3.4 Privacy and failure behaviour

Before a provider call, name exactly what leaves the device: the compact,
student-reviewed evidence snapshot and any selected material excerpts. Keep a
local-only report path that displays deterministic term facts and the evidence
limit without any AI wording. If generation is unavailable, the student can
still read those facts and retry later; no raw provider error, synthetic
fallback, or unsourced “tips” appears.

## 4. FRONTEND — report as a rollover outcome

1. After a student confirms or pauses a rollover, offer a quiet **View your
   Term Report** transition. It is not a popup interrupt and not a permanent
   top-level Academics tab.
2. The report opens in Grades & Archive as the selected one-column document:
   completion stamp → term-at-a-glance → what stands out → carry into next term
   → how to read this. Use human labels such as “Final grades recorded,”
   “Returned work,” and “Why this appears”; never surface spec identifiers or
   internal counters such as connected topics.
3. The report’s evidence control opens an existing inspector/peek or contextual
   detail for the linked course, returned work, note, marked mistake, or cited
   material span. It must not clone those editors inside the report.
4. The first view includes a compact source review: selected optional material
   is visible and removable before generation. Structured local records are
   listed as facts, not as editable model prompts.
5. Render three honest states: ready report; insufficient evidence; and
   provider unavailable with a local-facts fallback. Do not show an empty chart
   or report skeleton as if a result exists.
6. The carry-forward action makes a reviewable draft for the existing Spring
   Planner/Notes owner. It never writes courses, tasks, dates, or study rules
   automatically.

### Appearance, accessibility, and motion

- Translate Variant A literally in hierarchy, then apply app tokens rather than
  mockup inline CSS. It is a solid-with-depth document; glass is reserved for a
  real floating banner/overlay.
- At compact width, preserve reading order and wrap the completion stamp below
  the heading. Evidence rows remain labelled and keyboard reachable.
- Use one existing card/inspector/button family. Configure; do not fork a
  report-card or source-link component.
- “Why this appears,” source review, regenerate, carry-forward, and retry
  controls all have handlers and visible focus. Respect reduced motion; only
  existing opacity/transform transitions are permitted.

## 5. Do not break

- No second scheduler, Anki review loop, hidden model of study time, fake dated
  logs, percentage/composite/ranking, or prediction.
- No mutation or deletion of historic records during report generation.
- No AI-derived study method, trait, causal claim, or material not selected by
  the student.
- No external key in client code, no change to existing generator prompts, and
  no alteration of unrelated dirty documentation.
- Do not build Forecast Accuracy in this pass.

## 6. Done when

- [ ] A versioned, idempotent migration adds the report collection without
  clobbering existing Academics data; tests prove empty and twice-run safety.
- [ ] Pure evidence compilation tests prove: only in-term records are included;
  missing grades stay absent; an upload alone never proves study behaviour; and
  the insufficient-evidence gate is honest.
- [ ] Artifact validation tests reject an unsupported local ref, an out-of-set
  material citation, a causal claim, and a report block without evidence.
- [ ] Rollover can reach the report without changing its existing fate/archive
  semantics; reload preserves the report and every evidence link.
- [ ] Each report state is friendly, keyboard-complete, and contains no mock or
  hardcoded student data when the store is empty.
- [ ] Both themes are measured with `getComputedStyle` for canvas, report card,
  and dense evidence row; the exact values are recorded beside the mockup.
- [ ] `npm run test` and `npm run build` pass. A real signed-in provider run is
  separately captured before promotion; unavailable configuration stays honest.

## 7. Commit

`feat(academics): build evidence-led term report`

Commit unrelated work separately.

## 8. Next stage — E/F promotion, then Forecast Accuracy (not in scope)

After this vertical is implemented and all real-data/visual/handler/reload
proofs exist, run the promotion audit. Forecast Accuracy remains its own later
vertical because it needs a distinct resolved-prediction and calibration model.

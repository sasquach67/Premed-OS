# T1 · Academics — Exam Prep Mode

**Stage:** C · DECIDED, NOT BUILT

**Scope:** Build only the class-scoped Exam Prep mode described by
`academics-exam-prep-mode.html`. This brief includes its durable local model,
deterministic plan behaviour, and its visual translation. It does not build
Learning Signals, Grade Decisions, Materials extensions, Lecture Capture,
Planning Decisions, cold start, or term rollover: those sources do not have
their own `YES` manifest rows.

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

There is no remaining Stage-A paper blocker for the currently cleared
Academics surfaces. Exam Prep has a complete source and decision record:

- `mockup-lab/01-academics/academics-exam-prep-mode.html` draws accelerated,
  steady, catch-up, and post-exam states.
- `mockup-lab/01-academics/academics-exam-prep-mode.md` records both the
  interaction rules and the day-as-finish-time composition.

The separate recent sources for Learning Signals, Grade Decisions, Materials
extensions, Lecture Capture, Planning Decisions, Planning cold start, and Term
rollover are drawn. They are intentionally **not** implementation candidates
here: a drawing is not a `BUILD-MANIFEST.md` permission.

### b. Mockup → app

| Surface | App evidence | Audit result |
|---|---|---|
| Exam Prep Mode | No `ExamPrepPlan`, `examPrep`, or class-scoped plan owner exists in `src/`. The class workspace can list exams and launch active recall, but it cannot assemble, persist, or recover a two-week exam plan. | **Not built. This is the first failed stage.** |
| Practice-exam generator | `src/components/academics/ClassCenter.tsx` contains a separate practice-exam flow. | Do not repurpose it as Exam Prep. A generated practice attempt is not a schedule or a plan. |
| Class Hub / exam scope | `src/components/academics/ClassHub.tsx` owns the class page, its next exam, covered topic links, Materials, Topics, and Assignments views. | Reuse and extend; do not fork another class workspace. |
| Active recall | `src/pages/AcademicRecallSession.tsx` and `src/lib/academics/activeRecall.ts` own recall execution and review history. | Reuse as the plan's route; do not create a second review engine. |
| Syllabus Import / re-import | `69a0b41`, `93bfeb8`, `1ee2c87`; its new visual decision record is `6efb8ba`. | Behaviour is built, but its mockup fidelity is a later **Stage E** item. Do not touch it in this build. |
| Learning Signals, Grade Decisions, Materials extensions, Lecture Capture, Planning decisions, term rollover | Their proposed lab sources exist, but none has an individual manifest row. | Not authorized for source implementation in this brief. |

### c. Already built — do not rebuild

- Class Center and Class Hub ownership: `9f4d3ac`, `7ddf493`.
- Active recall / FSRS loop: `9f9d98a`.
- Class types and cold-start Class Center: `cb963a3`.
- Syllabus parsing, local retention, scoped entry, weights, and identity-based
  re-import: `69a0b41`, `93bfeb8`, `1ee2c87`.
- The relative-date labelling rules used by course work: `6ffd436`.

### d. Gate

`BUILD-MANIFEST.md` lists
`01-academics/academics-exam-prep-mode.html` with **Build? = YES**. This brief
is therefore authorized for that source only.

The manifest does not individually list `academics-learning-signals.html`,
`academics-grade-decisions.html`, `academics-materials-extensions.html`,
`academics-lecture-capture.html`, `academics-planning-decisions.html`,
`academics-planning-cold-start.html`, or `academics-term-rollover.html`.
They remain out of scope, even though they are useful proposed drawings.

### e. Decision-file audit

| Candidate | Appearance record | Result |
|---|---|---|
| Exam Prep Mode | `academics-exam-prep-mode.md` records the banner, finish-time emphasis, day rail, accelerated/steady control, catch-up treatment, and post-exam closure. | Pass |
| Syllabus Import | `academics-syllabus-import.md`, committed in `6efb8ba`, records its reading column, review workspace, diff defaults, and solid-versus-glass treatment. | Pass, but later Stage E |
| Existing Daily / Planning sources | Their companion documents encode their visual hierarchy in the opening decisions block; no current candidate is behaviour-only. | Pass for this rung |

### f. Integrations and services owned by this surface

| Dependency | Classification | Student-visible state today | Brief action |
|---|---|---|---|
| Class assignments, linked topics, files, and active-recall history | **CODE BUILT, CONFIGURED** | The class page has the underlying records but no plan that assembles them around an exam. | Consume these local records; do not duplicate them. |
| Exam Prep plan persistence and plan-session records | **CODE MISSING** | There is no dedicated mode, saved intensity, planned work, missed-work record, or post-exam closure. | Build in this brief with a versioned, lossless migration. |
| Google Calendar / Canvas feed | **Not required for v1** | An exam can be created or imported as a normal class assignment. | Do not block this mode on a connected calendar or Canvas. A later Canvas source may propose changes, never overwrite the plan. |
| Grounded study generation | **CODE BUILT, CONFIGURATION NOT VERIFIED** | A provider can be unavailable; class work must stay useful without it. | Exam Prep links to existing grounded tools only. It must never imply generated study content is available or required. |

There is no Andy cloud checklist for this pass: Exam Prep v1 is local-first and
deterministic. The generation-provider configuration remains a separate
configuration gap, not an excuse to ship a placeholder plan.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §§4.1-R, 4.1-I, 4.1-J,
  6.7, 6.11, 6.15–6.16, 9, and 13.
- `mockup-lab/01-academics/academics-exam-prep-mode.html` and `.md`.
- `mockup-lab/01-academics/academics-class-hub.html` and `.md`.
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `premed-hq-documentation/implementation/component-inventory.md`.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`
  §§2, 3, 4b-ii, 4e, and 5c.
- `premed-hq-documentation/specifications/general.md` U-2, U-5, U-8, and U-9.

## 3. Frontend — translate the approved Exam Prep drawing

1. **Entry and ownership**
   - Open Exam Prep only from a class with a dated, active exam assignment.
     It is a temporary class mode, not a Daily tab, Planning tab, global page,
     or sibling to Active Recall.
   - Add a quiet class-page entry beside existing exam-scope/next-exam controls.
     If no dated exam exists, show an honest one-line recovery with an action to
     create or date an exam; do not show a fake plan.
   - Use the shared center-peek → expand model when entered from the class
     record, then show the full temporary workspace when expanded.

2. **Composition**
   - Translate the selected mockup literally: class breadcrumb and exam context
     in the header; the finish-time treatment as the primary anchor; the
     selected intensity control; a calm day plan; and one dominant action for
     the next session.
   - Implement exactly two intensity choices: **Accelerated** and **Steady**.
     They change planned allocation, never the student's worth or a hidden
     readiness calculation. Catch-up is a derived state of either plan, not a
     third choice.
   - Each day names only the items that come from a real linked topic,
     assignment, source, or manual plan item. Route every row to its owner:
     active recall, a topic, Materials, Assignments, or a manual task. Do not
     duplicate editors inside the mode.
   - The catch-up view must state which planned item was missed, what the
     proposed reallocation changes, and what remains unscheduled. Applying it
     is explicit; merely opening the state changes nothing.
   - The post-exam state closes the plan into factual inputs: optional returned
     grade, selected mistakes/feedback, and a route to the regular class
     workspace. It must not produce a retrospective prediction or a scorecard.

3. **Visual rules**
   - Reuse the class banner geometry and existing Typography/Icon system.
     The banner/stat treatment may be glass only where it floats over art;
     day cards, plan rows, source evidence, and catch-up details stay
     solid-with-depth.
   - Keep the finish-time visual and the next action dominant. Secondary
     evidence and past/completed plan rows recede without becoming a dense
     rectangle wall.
   - Use `opacity`/`transform` only for entrance and quiet state motion;
     honor reduced motion. Preserve keyboard focus and direct links to owner
     surfaces.

## 4. Backend — durable local plan, no inferred outcomes

1. Add the smallest explicit, course-scoped persisted shape needed for this
   mode. It must identify the course, exam assignment, selected intensity,
   created/updated timestamps, and the student's plan items. A plan item must
   point to a real owner (`topicId`, `assignmentId`, `fileId`, or an explicit
   manual item), have a planned date/order, and preserve its explicit
   completion/missed state. Do not store a derived readiness, percentage,
   ranking, or grade forecast.
2. Add a new store version and a lossless, idempotent migration. Existing
   class data, topics, assignments, files, review events, and practice exams
   must be byte-equivalent after hydration; older stores simply receive empty
   Exam Prep collections. Add migration tests for empty initialization,
   preservation of a populated legacy class center, and rerunning the
   migration.
3. Implement deterministic plan construction from only confirmed local data:
   the selected dated exam, its linked topics, existing review state, actual
   open assignments, and student-confirmed intensity. When any required input
   is absent, leave that portion dormant with its reason and offer the owning
   action; never fabricate hours, topics, course coverage, or an exam outcome.
4. Marking a plan item complete must only update that explicit item. A missed
   item makes a catch-up **proposal**; accepting the proposal is the only way
   to move later work. Do not silently reschedule a plan after time passes.
5. Reuse the existing active-recall queue and review history rather than
   implementing cards, self-rating, or a second scheduler. Reuse the existing
   grounded-material policy for any optional study-guide link; no selected
   student source means no generated course content.
6. Add focused unit tests for plan construction, both intensity choices,
   no-date/no-linked-topic dormant cases, explicit catch-up confirmation,
   post-exam closure, migration idempotence, and reduced-motion/keyboard paths
   at the component level where they can regress.

## 5. Do not break

- Do not add an Academics top-level tab, a sixth Class Hub tab, a global exam
  dashboard, or a second review/scheduling system.
- Do not modify the existing syllabus import/re-import flow, its local file
  retention, parser, or migration.
- Do not make Google Calendar, Canvas, a provider key, or an external service a
  required input for v1.
- Do not invent a score, composite, ranking, readiness percentage, predicted
  grade, or progress bar (`U-9`). Insufficient inputs stay dormant with a
  reason (`U-5`).
- Do not turn Catch-up into a third intensity mode, auto-apply a reschedule, or
  turn a missed plan row into an overdue moral judgment.
- Do not copy mockup CSS, colors, font sizes, radii, or icons. Use application
  tokens and the shared component inventory.
- Do not alter localStorage without the versioned lossless migration and tests.
- Preserve signed-out local functionality, both themes, mobile bounds,
  keyboard-only operation, and reduced motion.

## 6. Done when

- [ ] A dated class exam opens one persistent, class-scoped Exam Prep mode;
  opening it does not create a duplicate course, assignment, topic, or review
  queue.
- [ ] Accelerated and Steady are the only intensity choices; Catch-up is a
  confirmation-first state of either one.
- [ ] Every displayed plan row is attributable to a local class record or an
  explicitly entered manual item, with a reachable owner action.
- [ ] Missing date, linked topics, or source material render a friendly reason
  and recovery action—not a placeholder plan or zero metric.
- [ ] Post-exam closure preserves factual entered feedback without claiming a
  prediction, score, rank, composite, or percentage.
- [ ] `rg -n -i "readiness|composite|rank|predicted grade|[0-9]+%"` over the
  new Exam Prep component/model/tests finds no new forbidden output claim.
- [ ] The store migration passes empty, populated, frozen-input, and
  idempotence tests.
- [ ] `npm run test` and `npm run build` pass; signed-out mode, light/dark,
  keyboard-only interaction, and reduced motion are verified.
- [ ] The built screen is visually checked against Exam Prep Variant A, and the
  mockup decision record receives the resulting commit before any `built`
  status promotion.

## 7. Commit

`feat(academics): add class-scoped exam prep mode (§4.1-R)`

Commit only the Exam Prep model, migration, tests, UI, and its narrowly needed
shared wiring. Unrelated current working-tree changes must remain separate.

## 8. Next stage — not in scope here

After this build is committed and verified, rerun `TAB-BRIEF-PROMPT.md` for
Academics. The expected next cleared stop is **E · FRONTEND MISSING** for the
already-working Syllabus Import review screen, using its complete decision
record. The other proposed Academics sources remain blocked from implementation
until the manifest names and clears them.

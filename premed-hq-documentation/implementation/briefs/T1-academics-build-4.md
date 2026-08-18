# T1 · Academics — Learning signals

**Stage:** C · DECIDED, NOT BUILT · **EXECUTED Aug 18, 2026**

**Scope:** The §4.1 Learning signals panel on a STEM class Overview, in the
ruled **A · priority rail** composition, plus the deterministic read model
behind its **first live signal set**. Frontend and backend in this one brief.
Signal types whose input records do not exist stay unbuilt and unmentioned.

---

## 1. Fidelity audit

### a. Spec → paper

**Pass.** `tabs/01-academics.md` §4.1 "Learning signals — the class-page
surface" is drawn by `mockup-lab/01-academics/academics-learning-signals.html`,
and the placement composition was ruled **A · priority rail** on Aug 18, 2026
(`1dd83a2`). The companion `.md` now records behaviour, appearance, hierarchy,
and mobile.

### b. Mockup → app

**Missing.** `grep -n "LearningSignals" src/` returns nothing. `ClassHub.tsx`'s
STEM `Overview` renders Class status → Material coverage → `StudyMethodPanel` →
Due today / Exam scope / Coming up. There is no signal panel, no evidence rail,
and no module deriving evidence-backed signals.

### c. Already built — do not rebuild

- `StudyMethodPanel` + `src/lib/academics/studyMethod.ts` (`a245721`) own the
  §4.1-K study cycle. **Do not fork, rename, or absorb them**, and **do not
  emit a signal that restates one of their groups** — `just-covered` already
  says "covered, not yet recalled" and `due-to-review` already says "FSRS says
  due". A Learning signal that repeats either is a duplicate surface, not a
  signal.
- `ForgettingCurve` + `forgettingCurve.ts` (`775611e`) own retrievability.
  A signal may route to a topic; **no chart belongs in this panel.**
- `ExamPrepMode`, `CoverageLedger`, Topics/Materials/Assignments tabs and the
  `/academics/review/:courseId` route are the existing owners a signal routes
  **to**. The panel never repairs anything inline.
- `ClassHub.tsx`'s `NonStemOverview` already handles Writing/General. The panel
  must not appear there.

### d. Gate

**Pass.** `BUILD-MANIFEST.md` marks `01-academics/academics-learning-signals.html`
**`YES`** (cleared Aug 18, 2026), and the lab entry is now `status:"approved"`.

### e. Decisions file

**Pass.** `academics-learning-signals.md` records the ruling, exact placement,
row anatomy, rail contents, hierarchy, depth/motion, and the mobile rule.

**One ruled amendment the build follows, not the drawing:** the frame sets
`.rail{display:none}` below 760px, which would drop the evidence requirement on
phones. The `.md` rules that the rail **card** is removed and each signal's
evidence moves inline under its cause line. **The `.md` wins.**

### f. Integrations and services

**None. Nothing on this panel may be gated on a service.** Every signal in this
brief derives from records already in the local store: `Topic`, `ReviewEvent`,
`ClassAssignment`, and `ClassWorkspace.type`. No calendar, Canvas, lecture
capture, embeddings, or AI call. Signed-out mode renders it identically.

**Deferred because their input records do not exist** — do not simulate, do not
add a placeholder row, do not mention them in the UI:

| Signal | Blocked on |
|---|---|
| #22 cross-class overlap (`TopicLink` proposal) | no `TopicLink` entity |
| #39 concept-map gaps | same |
| #21 prerequisite decay, #64 MCAT decay | no prerequisite/content mapping |
| #26 re-read detection, #30 material staleness | no material-open instrumentation |
| #36 lecture-lab lag | no lab schedule record |
| #16 interleaving check, #25 cram detection | need session-level review grouping (§4.1-J timer) |

⚠️ The violet `TopicLink` row drawn in the mockup is therefore **not built**.
Its kind stays defined in the read model so the row turns on when the entity
lands, and no component changes when it does.

---

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.1 — placement, STEM
  boundary, three-item cap, cause → consequence → one action, evidence
  requirement, no-empty-panel rule, U-9 prohibitions.
- `mockup-lab/01-academics/academics-learning-signals.html` — the A frame.
- `mockup-lab/01-academics/academics-learning-signals.md` — the ruling and the
  mobile amendment. **Authoritative over the frame where they disagree.**
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
  — panel recipe, depth, motion, focus.
- `src/lib/academics/studyMethod.ts` — the pattern this module copies: rules in
  the lib, drawing in the component, dormancy provable by test.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  `Panel`/`Button`/`Link`; no new card family.

---

## 3. The work

### Backend — `src/lib/academics/learningSignals.ts` (new)

1. `export type SignalKind = 'routine' | 'timing' | 'proposal'` — the row's
   **kind**, never a severity or rank.
2. `export interface LearningSignal { id, type, kind, title, cause,
   actionLabel, action, evidenceLabel, evidenceDetail }`. `title` is the cause
   in one line, `cause` the consequence sentence, `evidence*` the record the
   signal read, and `action` is a discriminated
   `{ type:'route'; to } | { type:'tab'; tab }` — exactly one owner per signal,
   either another page or a tab on the hub the student is already on.
3. `export function learningSignals(input, now?): LearningSignal[]` — derives,
   orders deterministically, and **slices to three**.
4. `export function signalsShouldRender(signals, classType?): boolean` — false
   for any non-`stem` type and for an empty list. Both rules live here, as in
   `panelShouldRender`.

**The first live signal set — exactly three types, all deterministic:**

- **`assignment-topic-link` (#37, kind `timing`).** An unfinished, dated
  `ClassAssignment` due within 14 days whose `linkedTopicIds` include at least
  one topic with `fsrs.reps === 0`. Evidence: the assignment record and the
  named unpractised topics. Action → the Assignments tab.
- **`post-exam-decay` (#41, kind `routine`).** An `exam` assignment whose
  `dueDate` passed at least 14 days ago, with `coveredTopicIds`, where no
  covered topic has a `ReviewEvent` after that date. Evidence: the exam record
  and the date. Action → review that class.
- **`topic-difficulty-outlier` (#27, kind `routine`).** One topic with at least
  three recorded reviews and at least two lapses, whose lapse count is strictly
  greater than every other topic's. Evidence: the review record, stated as
  counts. Action → review that topic.

**Ordering** is fixed by kind, then by the type list above — not by a computed
score. **Never** compute a composite, rank, percentage, or readiness number.

5. `src/lib/academics/learningSignals.test.ts` — cover: empty store yields
   none; non-STEM yields none; each type fires only on its own evidence; the
   cap holds at three; no signal duplicates a `studyGroups` group.

### Frontend — `src/components/academics/LearningSignalsPanel.tsx` (new)

6. Two-column layout at `lg` and above — signal list, then a 330px-equivalent
   evidence rail (`lg:grid-cols-[minmax(0,1fr)_20.5rem]`, `gap-4`). One column
   below that.
7. Signal list card: existing panel recipe (`rounded-2xl border border-border
   bg-card`, `shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]`) — the exact string
   `StudyMethodPanel` already uses. Header: eyebrow `Learning signals`, an
   `h3`, one muted line, and a right-aligned `STEM only` label.
8. Rows separated by `border-t border-border`, none on the first. A 7px mark
   with a 4px halo at left: `timing` → amber, `routine` → the Academics accent,
   `proposal` → violet. Title 14px display 800; cause 11.5px muted; **one**
   action as a `--cat` text route, never a button.
9. Evidence rail: its own card headed `Why these appear` / `Evidence stays
   visible`, one `border-t` row per signal — display-font source label over the
   muted record line. It states records, never conclusions.
10. **Mobile (the ruled amendment):** below `lg` the rail card is not rendered
    and each signal's `evidenceLabel`/`evidenceDetail` render inline under its
    cause line. Evidence never disappears.
11. Mount in `ClassHub.tsx`'s STEM `Overview` **directly below
    `StudyMethodPanel`** and above the Due today / Exam scope / Coming up row —
    that is "below the primary next action, above supporting class information".
12. Solid-with-depth only; no glass. Motion `.15s cubic-bezier(.16,1,.3,1)`
    with a `motion-reduce` fallback; focus `:focus-visible` only. Both themes.

---

## 4. Do not break

- **U-9:** no score, composite, ranking, progress bar, gauge, percentage
  readiness, or "you may be behind" phrasing anywhere in this panel.
- **U-5:** no empty state. Zero signals renders **nothing** — no card, no
  header, no "all clear" line.
- At most three rows, one action each, every action routing to an owner that
  already exists.
- No signal in Writing or General workspaces; no cross-class merge; no shared
  review credit; no auto-created `TopicLink`.
- No alerts, nudges, calendar writes, Canvas calls, or AI recommendations —
  §6.11's auction owns promotion into Alerts and is not in scope.
- Do not modify `studyMethod.ts`, `StudyMethodPanel`, `forgettingCurve.ts`, or
  `ForgettingCurve`.
- No new dependency. No localStorage schema change — this reads existing
  records only, so no migration is involved.
- Signed-out mode and both themes must be identical in behaviour.

---

## 5. Done when

- [x] `learningSignals.ts` exports the read model; all three types derive from
      real records and nothing is simulated.
- [x] `signalsShouldRender` returns false for `writing`, `general`, and empty.
- [x] The panel renders in the ruled A composition and is absent when empty.
- [x] Mobile keeps every signal's evidence inline; the rail card is what goes.
- [x] `grep -nE "readiness|composite|score|rank|Progress" src/components/academics/LearningSignalsPanel.tsx src/lib/academics/learningSignals.ts`
      returns **only comment lines stating the prohibition** — five in
      `learningSignals.ts`, none in the component, and no code line in either.
- [x] `grep -n "TopicLink" src/lib/academics/learningSignals.ts` shows only the
      dormant `proposal` kind, never a constructed signal.
- [x] `npm run build` passes and the new tests pass.

## 6. Commit

`feat(academics): add the Learning signals panel and its read model (§4.1)`

## 7. Found while executing — the linkage records have no writer

⚠️ **Recorded here because it decides whether this tab can ever reach stage F.**

`ClassAssignment.linkedTopicIds` is initialised `[]` in all five places the app
creates an assignment (`ClassCenter.tsx` ×4, `QuickAddDialog.tsx`,
`AssignmentsPanel.tsx`) and **is never written afterwards — there is no UI that
links a topic to an assignment.** `coveredTopicIds` is written only by
`data/seed.ts` and `data/demoSeed.ts`; nothing in the app sets it either, and
`ExamScope` merely reads it.

Consequence, stated plainly:

| Signal | Fires on a real student's records today? |
|---|---|
| `topic-difficulty-outlier` (#27) | **Yes** — `ReviewEvent` and `fsrs.lapses` are written by the review flow. |
| `assignment-topic-link` (#37) | **No** — needs `linkedTopicIds`, which nothing writes. |
| `post-exam-decay` (#41) | **No** — needs `coveredTopicIds`, which only the seeds write. |

Both derivations are correct and tested, and both turn on the moment the record
has a writer. **The missing writer belongs to Assignments/Exam scope, not to
this panel**, so it was not built here. It is the first thing the next
Academics pass should land.

## 8. Next stage — explicitly out of scope

Stage D/F for this surface. Additional signal types turn on only as their input
records land (`TopicLink`, prerequisite links, session timer, material
instrumentation), each as its own pass. Promotion of a signal into Alerts is
§6.11's nudge auction and belongs to the shell, not here.

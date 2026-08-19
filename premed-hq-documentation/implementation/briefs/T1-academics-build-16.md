# T1 · Academics — Predict (§6.6)

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The **Predict** step only. Pretest and Full mock are named here as
blocked, with what blocks them.

---

## 1. Audit — one of the three is buildable

`studyMethod.ts` marks three steps engineless. Read against §6.6:

| Step | §6.6 requires | Buildable now? |
|---|---|---|
| **Predict** | "One prompt before class… answers are stored and **surfaced again after the lecture** so the user sees where their expectation was violated" | **YES.** A prompt, a record, and a resurfacing. No generation |
| Pretest | "serve 3–5 questions on that upcoming topic" | **No** — the questions must be generated from the class's own material |
| Full mock | "a whole practice exam… generated from the class's own materials under the permissive Academics policy (§6.3)" | **No** — same |

So Pretest and Full mock are downstream of `specifications/generation`
Phases 2–4, not of this brief.

**Placement is ruled:** *"Pretest and Predict sit in the Materials module
beside the existing priming block (all three are pre-lecture acts)."*

**Gate:** `academics-study-method.html` is **`YES`**. **Integrations:** none.

---

## 2. The record

1. `TopicPrediction { id, courseId, topicId, prompt, answer, createdAt,
   updatedAt, revealedAt?, order }` in `classCenter.topicPredictions[]`.
   `revealedAt` marks that the student has seen it back — **the violation is
   the point**, so knowing whether they have looked matters.
2. `migrateTopicPredictionsV22` — adds the empty array. Pure, idempotent.

---

## 3. The work

### `src/lib/academics/predict.ts` (new)

3. `canPredict(topic, predictions)` → a topic **not yet covered** with no
   prediction recorded. Once covered, the moment has passed: a prediction
   written after the lecture is a memory, not an expectation.
4. `pendingReveal(topics, predictions)` → predictions whose topic has **since**
   been covered and which have not been revealed. This is the whole feature —
   an unrevealed prediction is a dead record.
5. `recordPrediction` / `revealPrediction`.
6. `predict.test.ts` — cannot predict a covered topic, cannot predict twice,
   reveal only after coverage, and **no FSRS field is ever touched**.

### `src/components/academics/PredictPanel.tsx` (new)

7. In the Materials module. Two states, never both for one topic:
   - **Before:** *"What do you think this lecture will cover?"* with a free-text
     answer and the topic it is about.
   - **After coverage:** the answer shown back, with the plain framing —
     **where the expectation was violated is where the encoding happened.**
8. One `MascotNote` teaching the mechanism once (§4.1-F).
9. **No score, no correct/incorrect, no grading.** §6.6 rules the pretesting
   family is priming, never performance; a prediction has no right answer at
   all.

---

## 4. Do not break

- **Never touches FSRS, weak-topic flags, or review history.** Priming is not
  performance.
- No grading of a prediction, ever. There is nothing to be right about.
- A prediction cannot be written for an already-covered topic.
- U-9: no prediction-accuracy score or streak.
- Surfaces measured against the drawing before done.

## 5. Done when

- [ ] A student can predict an uncovered topic, once.
- [ ] After the topic is covered, the prediction is surfaced back.
- [ ] Nothing in FSRS or weak areas changes, proven by test.
- [ ] Migration pure and idempotent.
- [ ] Build passes; suite green.

## 6. Commit

`feat(academics): add the Predict step (§6.6)`

## 7. Next

Pretest and Full mock return with generation Phases 2–4.

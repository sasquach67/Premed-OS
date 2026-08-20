# T1 · Academics — Pretest (§6.6)

**Stage:** C · DECIDED, NOT BUILT · **EXECUTED Aug 19, 2026**

---

## 1. It does not need the generator

Pretest was deferred twice as "needs generated questions". Re-reading §6.6
against the data model, that was wrong:

> **Pretest (pre-lecture).** Before a lecture is covered, serve 3–5 questions on
> that upcoming topic. **Getting them wrong is the point** — the *pretesting
> effect* means a failed attempt before instruction improves retention of the
> subsequent instruction more than reading alone.

`KeyPoint` already holds `text` and `sourceChunkIds`, produced during material
ingestion, and its text is already a recall prompt — *"Explain vesicle release
and the postsynaptic response."* **The questions exist.** Waiting on the
generator would have deferred a buildable feature behind an unproven one.

## 2. The rules §6.6 is explicit about

- **"The UI must say so plainly, or users will read a 0/5 as failure and quit."**
  Getting them wrong is the mechanism, and the surface has to lead with that.
- **"Score is never recorded as performance; it's a priming act, and it must not
  touch FSRS state or weak-topic flags."**
- Placement: the Materials module, beside Prime and Predict — all three are
  pre-lecture acts.

## 3. The work

1. `Topic.pretestedAt?: number` — optional and additive, so no migration.
   Its presence is the engine for the `pretest` step, nothing more.
2. `src/lib/academics/pretest.ts`:
   - `canPretest(topic)` — uncovered, and not already pretested.
   - `pretestPrompts(topic, keyPoints, limit = 5)` — that topic's key points,
     capped. **Fewer than three returns none**: two questions is not a pretest,
     and padding them from another topic would be inventing the lecture.
   - `recordPretest(topics, topicId)` — writes the timestamp and **nothing
     else**, asserted by test against the whole FSRS object.
3. `PretestPanel.tsx` — the questions, an answer box per question, and a reveal
   that frames a wrong answer as the mechanism working. No score anywhere.
4. `studyMethod.ts` — `pretest` gains an engine, `completedSteps` fills its dot
   from `pretestedAt`, and **the `before-class` group turns on**, since Prime,
   Pretest and Predict now all have engines.

## 4. Do not break

- No score, no correct/incorrect tally, no streak.
- Never writes FSRS, `status`, or a weak-area record.
- A topic already covered cannot be pretested — the moment has passed.
- Fewer than three key points means the panel does not appear.

## 5. Done when

- [x] A student can pretest an upcoming topic once, and see the answers.
- [x] Nothing in FSRS or weak areas changes, proven by test.
- [x] The before-class study-method group appears.
- [x] Build passes; suite green.

## 5a. A second half-done step this exposed

Turning on Pretest's cycle step made the test list read `['predict', 'mock']` —
revealing that **Predict shipped without its own step ever being enabled**,
exactly as Connect had. Building a feature and lighting its dot are two changes,
and this is the second time only the first was made. Both are on now, and only
Full mock remains engineless.

The `before-class` group also fired far too eagerly at first, for every
uncovered topic in the class, which would have made the panel permanently
non-empty and broken the "absence is the congratulation" rule. It is now gated
on the topic having material to prime from — priming a topic the class has
published nothing for is an instruction with no object.

## 6. Commit

`feat(academics): add the Pretest step and turn on the before-class group (§6.6)`

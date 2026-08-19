# T1 · Academics — Topic ↔ assignment linking (the writer)

**Stage:** C · DECIDED, NOT BUILT

**Scope:** Build the affordance that **writes** `ClassAssignment.linkedTopicIds`,
`ClassAssignment.coveredTopicIds`, and `Topic.linkedAssignmentIds`, in the ruled
**A + C** composition. Frontend and backend in this one brief.

---

## 1. Fidelity audit

### a–c. Paper, app, already built

- Drawn and ruled: `academics-topic-linking.html` + `.md`, **A + C ruled Aug 18
  2026** with the handoff specified in text (`413fca9`).
- **Still missing in `src/`:** no component writes any of the three fields.
  `AssignmentRow` renders `No linked topics` and `TopicRow` renders none of it.
- **Do not rebuild:** the three fields already exist in `types.ts` — **no
  schema change and no migration**. `AssignmentRow`, `TopicRow`, `ExamScope`,
  `ExamPrepMode`, and the Assignments page composition stay as they are.
  `learningSignals.ts` / `LearningSignalsPanel` (`b21d89f`) are the consumer and
  **must not be touched** — they begin firing on their own once records exist.
- **Reuse, do not fork:** `CenterPeek` is the picker shell and **already renders
  a full-screen `SidePeek` below 768px**, which is exactly the ruled mobile
  behaviour. `Button`, `Badge`, `Input` as they are.

### d. Gate

**Passes.** `BUILD-MANIFEST.md` carries `01-academics/academics-topic-linking.html`
as **`YES`** (Andy, Aug 18 2026).

### e. Decisions file

**Passes.** Behaviour, appearance, the handoff, and mobile are all recorded.

### f. Integrations and services

**None.** Local records only; no network call, no AI, no configuration.
Signed-out mode identical. **No ANDY CHECKLIST items.**

---

## 2. References

- `mockup-lab/01-academics/academics-topic-linking.html` — chips, typeahead,
  picker, empty and unlink states.
- `mockup-lab/01-academics/academics-topic-linking.md` — **the ruling and the
  six-point handoff; authoritative over the frame.**
- `tabs/01-academics.md` §4.1 (#37, exam scope), §4.1-H, §4.1-R.
- `src/lib/academics/studyMethod.ts` — the pattern: rules in the lib, drawing in
  the component.
- `src/components/common/CenterPeek.tsx` — picker shell.

---

## 3. The work

### Backend — `src/lib/academics/topicLinks.ts` (new)

1. `export type LinkField = 'coverage' | 'scope'` — `coverage` is
   `linkedTopicIds`, `scope` is `coveredTopicIds`. **Two fields, never merged.**
2. `linkedIds(assignment, field)` and `isLinked(assignment, field, topicId)`.
3. `setLinks(state, { assignmentId, field, topicIds })` → new
   `{ assignments, topics }`. **One call writes both directions:** the
   assignment's field, and `Topic.linkedAssignmentIds` kept in sync as the
   mirror of `coverage` only, so the two sides can never drift.
   `scope` does **not** write the topic mirror — scope is a property of the
   exam, and the topic side derives it for display.
4. `assignmentsForTopic(state, topicId)` → `{ assignment, field }[]`, so the
   topic side can render a coverage chip and a scope chip differently from one
   source of truth.
5. `shouldOfferPicker(topicCount)` → `topicCount > 5`. **The threshold lives
   here, not in a component**, because the ruling ties the escape hatch to it.
6. `src/lib/academics/topicLinks.test.ts` — both directions stay in sync;
   scope never writes the mirror; unlink removes from both; the threshold holds
   at 5/6; no duplicate ids; unlink never touches FSRS or review history.

### Frontend — `src/components/academics/TopicLinkFields.tsx` (new)

7. `TopicLinkField` — on an assignment record, one per field. Chips
   (`--cat` for coverage, `--warning` for scope) each carrying `×`, then a
   dashed `+ Link topic` / `+ Add to scope` chip opening a **typeahead in
   place**, then a quieter text `Link many…` **only when
   `shouldOfferPicker`**.
8. `AssignmentLinkField` — the same field on a topic record, listing the class's
   work; scope chips render distinctly and route through the same writer.
9. `LinkPicker` — `CenterPeek` with `allowSplit={false}`, header naming the
   record, checkbox list of every candidate, footer with the selected count and
   Cancel / Save. **Opens pre-populated with current state; Cancel writes
   nothing; Save closes and the chip row re-renders as the single rendering of
   the record.**
10. Empty case: a class with no topics shows the ruled line rather than an empty
    picker, and the affordance stays visible.
11. Mount: `AssignmentRow` gets coverage, plus scope when `type === 'exam'`;
    `TopicRow` gets `AssignmentLinkField`. Nothing else in `ClassHub` moves.
12. Solid-with-depth, both themes, `motion-reduce` fallback,
    `:focus-visible` only.

---

## 4. Do not break

- **U-9:** no "N of M linked" meter, percentage, ranking, or completion badge.
  The picker's footer count is a count of the current selection, nothing more.
- **U-5:** the no-topics case states why; it is not a styled void.
- No auto-linking from import, title similarity, or unit-name match.
- Scope and coverage stay two fields; scope is never inferred from a title.
- Unlink never deletes a topic or assignment and never touches FSRS or
  `ReviewEvent`.
- No schema change, no migration, no new dependency.
- Do not modify `learningSignals.ts`, `LearningSignalsPanel`, `studyMethod.ts`,
  or the approved Assignments page composition.

## 5. Done when

- [ ] A student can link and unlink from both directions, and the two sides
      agree after every operation.
- [ ] Exam scope writes `coveredTopicIds` and is visually distinct from
      coverage.
- [ ] `Link many…` appears only above five topics; the picker opens
      pre-populated and Cancel writes nothing.
- [ ] `#37` and `#41` fire in the running app once a link exists.
- [ ] `npm run build` passes; new tests pass; full suite green.

## 6. Commit

`feat(academics): write topic links and exam scope from both directions (§4.1)`

## 7. Next stage

Stage F for this surface once it runs on real records. Syllabus-import
*proposals* remain a separate, later pass.

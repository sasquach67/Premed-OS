# T1 · Academics — Topic ↔ assignment linkage (the missing affordance)

**Stage:** A · NOT DRAWN

**Scope:** Draw the surface that lets a student say *"this assignment covers
these topics"* and *"this exam covers these topics"*. **Nothing is coded this
pass.** No `src/`, store, migration, or manifest change.

---

## 1. Fidelity audit

### a. Spec → paper

**Fail — this is why the brief exists.** The spec rules the *consequences* of
the link in four places and never rules the act of making one:

- §4.1 #37 assignment-to-topic linkage — "this problem set covers Units 5–6, so
  schedule those topics *before* it's due".
- §4.1 exam scope, which `ExamScope` reads from `coveredTopicIds`.
- §4.1-R exam prep, which plans against that same scope.
- §4.1-L / the forgetting curve, which uses the exam an assignment represents.

`grep -riE "link[a-z ]{0,15}topic|covered topic" mockup-lab/01-academics/*.md`
returns **nothing** outside the learning-signals file. No frame anywhere draws
the picker, the row affordance, the confirmation, or the empty case.

**The app already promises it.** `ClassHub.tsx`'s Exam scope empty state reads
*"Add an exam and link its covered topics to see scope"* — instructions for an
affordance that does not exist. That string is a bug until this lands.

### b. Mockup → app

`AssignmentRow` ([ClassHub.tsx:927](../../../src/components/academics/ClassHub.tsx))
already **displays** the link — `No linked topics` or the linked titles — so the
read side is built and drawn-by-precedent. Only the write side is missing.

### c. Already built — do not rebuild

- `ClassAssignment.linkedTopicIds` / `coveredTopicIds` and
  `Topic.linkedAssignmentIds` already exist in `types.ts`. **The schema is not
  the gap and must not be redesigned** — no migration is in scope.
- `AssignmentRow`, `ExamScope`, `ExamPrepMode`, the Assignments tab and the
  Topics tab all exist and read the link today.
- `InlineAddRow` and `ExpandableEntryRow` are the shared write patterns. Draw
  with them; do not invent a third row family.
- The Assignments page composition is **APPROVED and locked**
  (`academics-assignments.md`): agenda default, three views, add is the primary
  action. **This drawing may not restructure that page.**

### d. Gate

`academics-assignments.html` is **`YES`** in `BUILD-MANIFEST.md`. A new frame
still needs its own row before anything is built from it — **Andy's call, and
not needed for this drawing pass.**

### e. Decisions file

N/A until the frame exists. The variants below are what the Stage-B decision
will choose between.

### f. Integrations and services

**None.** Both fields are local records. No Canvas, no calendar, no AI
suggestion. A parsed syllabus may later *propose* links, but a proposal still
needs the confirmation surface this brief draws, so that dependency runs the
other way.

---

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.1 (#37, exam scope), §4.1-H
  (Assignments), §4.1-R (Exam prep).
- `mockup-lab/01-academics/academics-assignments.html` + `.md` — the **locked**
  page this affordance lives inside.
- `mockup-lab/01-academics/academics-class-hub.html` — the class-hub tabs and
  row hierarchy the picker must match.
- `mockup-lab/01-academics/academics-learning-signals.md` — the consumer that
  is dormant without this record.
- `specifications/mockups/_shared/_visual-recipes.md` — tokens, depth, motion.
- `implementation/component-inventory.md` — `InlineAddRow`,
  `ExpandableEntryRow`, `CenterPeek`, `Badge`.
- `implementation/briefs/T1-academics-build-4.md` §7 — the finding that
  produced this brief.

---

## 3. What to draw

One new frame, `mockup-lab/01-academics/academics-topic-linking.html`, with
three product views:

1. **Link from the assignment** — an assignment record with its topic list, the
   picker open, and the linked state after confirming. Must show the
   `No linked topics` → linked transition `AssignmentRow` already renders.
2. **Exam scope** — the same act on an `exam`, writing `coveredTopicIds`, drawn
   beside the Exam scope panel it unblocks. **Exam scope and ordinary linkage
   are two fields and the drawing must not blur them** — an exam has both.
3. **Link from the topic** — the reverse direction from the Topics tab, since
   `Topic.linkedAssignmentIds` exists and a student thinking topic-first will
   look there.

**Rules the drawing must obey:**

- **A link is a student statement, never an inference.** Nothing auto-links on
  syllabus import, title similarity, or unit match. A future proposal must be
  visibly a proposal with its evidence and an explicit confirm.
- **Both directions write one record.** Linking from either side produces the
  same link; the drawing must not imply two independent lists.
- **Unlink is drawn**, and is as reachable as link. A link a student cannot
  remove is a trap.
- **The empty case is honest**: a class with no topics yet cannot link, and the
  picker says that plainly rather than opening empty.
- **No score, count-as-progress, coverage percentage, or "N of M topics
  linked" completion meter** (U-9). The link is a fact, not an achievement.
- The Assignments page structure stays exactly as approved; this is an
  affordance inside a record, not a new page.

**Three variants worth trying** (Stage B picks one):

| | Treatment | The trade |
|---|---|---|
| **A** | **Inline chips on the record** — topics appear as removable chips on the assignment row with a `+ Link topic` chip that opens a typeahead in place. | Fastest; keeps the ≤5-second logging rule. Gets crowded on an assignment with many topics. |
| **B** | **Expandable detail row** — the row expands into a detail panel where topics are one section among grade, weight, and notes, using `ExpandableEntryRow`. | Matches the existing row family and has room for exam scope as its own field. One more click before linking. |
| **C** | **Scope picker in a `CenterPeek`** — a focused overlay listing every class topic with checkboxes, opened from either side. | Best for an exam covering twelve topics, and the only one that makes bulk linking pleasant. Heaviest for the one-topic case. |

A mixed answer is legitimate and should be drawn if it is the honest one — e.g.
**A** for one or two topics with **C** as the "link many" escape hatch. If so,
draw the handoff between them, not just the two states.

---

## 4. Do not break

- Nothing in `src/` changes this pass. **Drawing only.**
- No schema change: `linkedTopicIds`, `coveredTopicIds`, and
  `linkedAssignmentIds` are the fields; do not propose new ones.
- Do not restructure the approved Assignments page or the class-hub tabs.
- No auto-linking, no AI suggestion, no silent syllabus-import writes.
- No U-9 completion meter over linked topics.
- Solid-with-depth panels; glass only where `_visual-recipes.md` allows it.

## 5. Done when

- [ ] `academics-topic-linking.html` exists with all three product views and
      all three variants, and the empty and unlink states are drawn.
- [ ] It is registered in `variant-lab.html` — **both** the surface entry and
      the `orderedProfiles` list, or the lab silently drops it.
- [ ] A companion `.md` records behaviour and states plainly that the placement
      composition is **not settled**, so the router lands on Stage B next.
- [ ] No `src/`, store, migration, or `BUILD-MANIFEST.md` change.

## 6. Commit

`docs(mockups): draw the topic-to-assignment linking affordance`

## 7. Next stage — explicitly out of scope

Stage B: Andy picks A, B, or C, and the `.md` records appearance. Only then can
a Stage-C brief build the writer — and only then do `assignment-topic-link`
(#37) and `post-exam-decay` (#41) stop being dormant on a real student's
records.

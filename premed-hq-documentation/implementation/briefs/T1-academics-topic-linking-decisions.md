# T1 · Academics — Topic ↔ assignment linking decisions

**Stage:** B · DRAWN, NOT DECIDED · **EXECUTED Aug 18, 2026 — A + C mix ruled, manifest row added**

**Scope:** Choose the one placement composition for the affordance that writes
`linkedTopicIds`, `coveredTopicIds`, and `linkedAssignmentIds`. Decision pass
only: no `src/`, store, migration, or manifest change is authorized here.

---

## 1. Fidelity audit

### a. Spec → paper

**Now passes.** The gap that produced this surface — the spec ruling the
consequences of a link and never the act of making one — is closed by
`mockup-lab/01-academics/academics-topic-linking.html` (`7170600`): three
product views (link from the assignment · exam scope · link from the topic),
three variants, plus the no-topics and unlink states.

### b. Mockup → app

**Missing, and deliberately so.** `AssignmentRow`
([ClassHub.tsx:927](../../../src/components/academics/ClassHub.tsx)) already
*reads* the link — `No linked topics` or the linked titles — so only the write
side is absent. `grep -rn "linkedTopicIds" src --include=*.tsx` still returns
initialisations and reads, never a write.

### c. Already built — do not rebuild

- The three fields exist in `types.ts`. **The schema is not the gap** and no
  migration is in scope for the build this decision unblocks.
- `AssignmentRow`, `ExamScope`, `ExamPrepMode`, the Assignments tab, and the
  Topics tab all read the link today and stay as they are.
- `InlineAddRow` / `ExpandableEntryRow` are the shared write patterns. No third
  row family.
- The Assignments page composition is **APPROVED and locked**
  (`academics-assignments.md`): agenda default, three views, add as the primary
  action. The chosen variant lives *inside a record*; it does not restructure
  that page.
- `LearningSignalsPanel` and `learningSignals.ts` (`b21d89f`) are the consumer.
  They are correct and tested; **do not touch them** — they start firing when
  the writer lands, with no change of their own.

### d. Gate

⚠️ **FAILS — and only Andy can clear it.** `BUILD-MANIFEST.md` has **no row**
for `01-academics/academics-topic-linking.html`. The manifest is the sole build
authority; an approved drawing is not permission. **This decision may be
recorded without the row, but nothing may be built until Andy adds it as
`YES`.**

### e. Decisions file

**Blocked, by design.** `academics-topic-linking.md` records behaviour and
appearance and then states plainly that the placement composition is not
settled. A/B/C compares three compositions without changing any data rule.

### f. Integrations and services

**None, at any point.** All three fields are local records. No Canvas, no
calendar, no AI, no network call. Signed-out mode is identical. **No ANDY
CHECKLIST items.**

A later syllabus import may *propose* links; a proposal still needs the
confirmation surface this decision picks, so that dependency runs toward this
surface, never around it.

---

## 2. References

- `mockup-lab/01-academics/academics-topic-linking.html` — **open all three
  variants across all three views before deciding.** Both axes switch with the
  chips inside the frame.
- `mockup-lab/01-academics/academics-topic-linking.md` — behaviour, appearance,
  and the three compositions.
- `premed-hq-documentation/tabs/01-academics.md` §4.1 (#37, exam scope), §4.1-H,
  §4.1-R.
- `mockup-lab/01-academics/academics-assignments.md` — the locked page.
- `specifications/mockups/_shared/_visual-recipes.md` — literal values.
- `implementation/briefs/T1-academics-build-4.md` §7 — why this exists.

---

## 3. The one decision Andy needs to make

Open the frame and choose **one**:

| Treatment | What the student does | The trade |
|---|---|---|
| **A · Inline chips** | Removable topic chips sit on the record; `+ Link topic` opens a typeahead in place. | Fastest, and the only one that keeps a single link inside the ≤5-second rule. Crowds a record naming six topics. **Recommended for the common case.** |
| **B · Expandable row** | The row opens into its record; topics are one field beside weight, points, and status. | Matches the existing row family and gives exam scope its own titled field — the clearest separation of scope from coverage. Costs a click before any linking. |
| **C · Scope picker** | A focused overlay lists every topic at once, opened from either side. | The only pleasant way to set an exam scope of eight topics. Heaviest for the one-topic case. |

**A mixed answer is legitimate and may be the honest one:** A for one or two
topics, C as the "link many" escape hatch. If that is the choice, the handoff
between them must be recorded too — what opens C from A, and what A shows after
C saves.

Recording the decision means editing the companion `.md` from "placement
composition is not settled" to the chosen treatment, with:

1. exact placement inside the record;
2. hierarchy, and how exam scope stays visually distinct from coverage;
3. mobile treatment;
4. why this composition wins over the other two.

Then the lab entry moves `proposed` → `approved`. **This brief makes neither
edit; the selection is Andy's.**

---

## 4. Do not break

- No U-9 treatment: no "N of M topics linked" meter, coverage percentage,
  ranking, or completion badge. Unlinked work is a normal, permanent state.
- A link is a student statement — no auto-linking on import, title similarity,
  or unit-name match. Any future proposal shows evidence and waits for confirm.
- Both directions write **one** record; removing from either side removes it.
- Exam scope and ordinary coverage stay two fields. Scope is never inferred
  from a title like "Units 3–5".
- Unlink stays as reachable as link, and never deletes a topic or an assignment
  or touches review history.
- Do not restructure the approved Assignments page or the class-hub tabs.
- Do not modify `learningSignals.ts` or `LearningSignalsPanel`.

## 5. Done when

- [x] Andy has selected A, B, C, or a recorded mix after opening the frame.
- [x] The companion `.md` names the winning treatment and records behaviour
      **and** appearance, including mobile and the scope/coverage distinction.
- [x] The lab entry reads `status:"approved"`.
- [x] No `src/`, store, integration, or manifest change.

## 6. Commit

`docs(mockups): rule the topic-linking composition`

## 7. Blocked on Andy, separately from the decision

✅ **RESOLVED Aug 18, 2026 — Andy added the row as `YES`.** The original text follows.

**`BUILD-MANIFEST.md` needs a `YES` row for
`01-academics/academics-topic-linking.html`.** Without it the Stage-C brief can
be written but nothing may be built — and until it is built, `#37` and `#41`
stay dormant on every real student's records.

## 8. Next stage — explicitly out of scope

Stage C: one implementation brief for the chosen composition, writing all three
fields from both directions, with the unlink and no-topics states. Not part of
this brief.

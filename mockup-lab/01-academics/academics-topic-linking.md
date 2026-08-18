# Academics · Topic ↔ assignment linking — decisions

**Status:** PROPOSED · Stage-A coverage
**Source:** `academics-topic-linking.html` · **Spec:** `tabs/01-academics.md` §4.1 (#37, exam scope), §4.1-H, §4.1-R
**Drawn under:** `implementation/briefs/T1-academics-mockup-3.md`

## Why this exists

`ClassAssignment.linkedTopicIds`, `ClassAssignment.coveredTopicIds`, and
`Topic.linkedAssignmentIds` are read in five places and **written by nothing in
the app** — every creation site initialises them `[]`, and only the seeds ever
fill them. The spec rules the consequences of a link (#37 assignment-to-topic
linkage, exam scope, exam prep, the forgetting curve) and never ruled the act
of making one. The Exam scope empty state already instructs the student to
"link its covered topics", for an affordance that does not exist.

Until this ships, two of the three built Learning signals can never fire on a
real student's records.

## Product views

| View | Job |
|---|---|
| Link from the assignment | Say which topics a piece of work covers, from the work. |
| Exam scope | Say what an exam **tests** — a separate field from what it covers. |
| Link from the topic | The same record written from the Topics side. |

## Behaviour

- **A link is a student statement, never an inference.** Nothing auto-links on
  syllabus import, title similarity, or unit-name match. A future import may
  *propose* links, and a proposal shows its evidence and waits for an explicit
  confirmation.
- **Both directions write one record.** Linking from a topic and linking from
  an assignment produce the same link; removing it from either side removes it
  everywhere. There are not two lists to keep in agreement.
- **Exam scope and ordinary coverage are two fields, never merged.** Scope
  drives Exam prep and the forgetting curve; coverage does not. "Covered but
  not tested" is a legitimate state, and scope is never inferred from a title
  like "Units 3–5" — the unit names in a title prove nothing about which topic
  records they contain.
- **Unlink is a first-class action**, as reachable as linking, and it never
  deletes the topic or the assignment and never touches review history.
- **Unlinked is a normal, permanent state.** No count, meter, ratio, badge, or
  reminder is attached to leaving work unlinked (U-9).
- **The empty case says why.** A class with no topic records cannot link one;
  the surface says so and keeps the affordance visible rather than opening an
  empty picker or hiding itself.
- Only the class's own topics and its own work are ever offered. No cross-class
  option appears here — that is `TopicLink`, which does not exist.

## Appearance

- The class banner, tab row, and underline hierarchy are Class Hub's, unchanged.
  This is an affordance **inside a record**, not a new page, and the approved
  Assignments composition — agenda default, three views, add as the primary
  action — does not move.
- Linked topics read as chips: 1px `--cat`-tinted border on a `--cat` 11% fill,
  Baloo 2 11.5px, each carrying its own `×`. **Scope chips are `--warning`
  tinted** so scope and coverage never read as one list.
- `+ Link topic` is a dashed `--cat` chip, so the empty field still shows where
  the action is.
- All three variants use the standard panel recipe (`--card`, 1px `--bd`, 16px
  radius, `0 10px 26px -14px` shadow), solid-with-depth. Glass appears nowhere
  on this surface.
- Motion is `.15s cubic-bezier(.16,1,.3,1)` with a `motion-reduce` fallback;
  focus is `:focus-visible` only.

## Variant question

**The product rules above are settled; the placement composition is not.**

| | Treatment | The trade |
|---|---|---|
| **A** | **Inline chips** — chips on the record with a typeahead opening in place. | Fastest, and the only one that keeps a one-topic link inside the ≤5-second rule. Crowds a record naming six topics. |
| **B** | **Expandable row** — the row opens into its record; topics are one field beside weight, points, and status. | Matches the existing row family and gives exam scope its own titled field. Costs a click before any linking. |
| **C** | **Scope picker** — a focused overlay listing every topic at once. | The only pleasant way to set an exam scope of eight topics. Heaviest for the single-topic case. |

A mixed answer is legitimate: **A for one or two, C as the "link many" escape
hatch**. If that is the choice, the handoff between them has to be recorded
too, not just the two end states.

**Andy chooses one before any implementation is briefed.**

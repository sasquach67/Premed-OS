# Academics · Topic ↔ assignment linking — decisions

**Status:** APPROVED · **A + C mix ruled Aug 18, 2026 (Andy)**
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

## The ruling — A + C, with a specified handoff

**A · inline chips is the primary affordance. C · scope picker is the escape
hatch for linking many.** B is retired; its frame stays in the lab only as the
record of what was compared.

**Why A leads.** Linking one topic to one problem set is the overwhelmingly
common act, and it has to clear the ≤5-second logging rule. A does it without
leaving the row. B spends a click on every link — including the single-link
case — to buy room the common case does not need.

**Why C survives as the escape hatch.** Exam scope is the opposite shape: eight
topics chosen in one sitting from the syllabus. Doing that eight times through a
typeahead is the worst interaction in the tab. C is the only composition that
makes it one pass.

**Why not B at all.** B's one genuine advantage — a titled field per record, so
scope and coverage cannot blur — is achievable in A by the chip tint and the
separate field label, which the frame already draws. That leaves B paying a
click for nothing.

### The handoff, specified

This is the part a mix has to answer, and it is **specified here in text; the
frame draws the two end states but not the transition.** Stage C builds from
this section.

1. **C opens from A, never independently.** The chip row's last element is
   `+ Link topic`; a second, quieter control `Link many…` sits beside it **only
   when the class has more than five topics recorded.** Below that threshold the
   picker is not offered — it would be a heavier path to the same two chips.
2. **C opens pre-populated with A's current state.** Every already-linked topic
   is checked on open. The picker is an editor of the same record, never a
   fresh start, and never appends a second set.
3. **On save, C closes and A reflects it immediately** — the chip row is the
   single rendering of the record's state. There is no separate "linked via
   picker" presentation.
4. **On cancel, nothing is written**, including any box toggled while it was
   open.
5. **Unlink stays available in both** — the chip's `×` in A, unchecking in C.
   Neither is the privileged path.
6. **Exam scope opens C by default** when the class has more than five topics,
   because scope is the case C exists for. The `+ Add to scope` chip remains,
   so a one-topic scope correction never requires the overlay.

### Placement and hierarchy

- Chips sit inside the record, under a small uppercase field label, below the
  record's own title/meta line. The Assignments page composition — agenda
  default, three views, add as the primary action — does not move.
- **Coverage chips are `--cat`-tinted; scope chips are `--warning`-tinted**,
  with separate field labels (`Topics this covers` / `Exam scope`). The tint is
  what stops the two fields reading as one list at a glance.
- `+ Link topic` is a dashed `--cat` chip so an empty field still shows where
  the action is. `Link many…` is plain text weight, quieter than the dashed
  chip — the escape hatch never outranks the primary path.
- The picker is a `CenterPeek`: solid card, `0 26px 60px -20px` shadow over a
  dimmed stage, its own header stating which record is being edited, and a
  footer carrying the selected count and Cancel / Save.

### Mobile

- The chip row wraps and stays the primary affordance; nothing collapses behind
  a disclosure control.
- The typeahead opens full-width beneath the chips rather than as a floating
  menu.
- **The picker becomes a full-height sheet below 760px**, not a centred card —
  a 520px centred overlay on a 375px viewport is a modal with margins.
- `Link many…` keeps its threshold and its quieter weight on mobile; the
  five-topic rule does not change by viewport.

## Retired variant

- **B · expandable row** — the row expands into its record with topics as one
  field among grade, weight, and notes. Not built.

# T1 · Academics — dead controls

**Stage:** E · FIDELITY · **EXECUTED Aug 19, 2026** — the screens exist and three controls do nothing.

**Scope:** Every Academics control that renders as actionable and is not.
Andy, Aug 19 2026: *"everything needs to be working. like buttons, things like
that."*

---

## 1. The audit

A script over every `Button`, `DropdownMenuItem` and `ContextMenuItem` in
`src/components/academics/` found nine with no `onClick`, `onSelect`, or
`asChild`. **Six are false positives** — `DropdownMenuTrigger asChild` wrappers
and one deliberately `disabled` empty-state row, all correct.

**Three are genuinely inert:**

| Control | Where | What it should do |
|---|---|---|
| `Plan 90 min` | `ClassCenter.tsx:1025`, review-queue actions | §4.1 item 8 — the FSRS study-session planner |
| `Open linked notes` | `ClassHub.tsx:932`, topic Quiz-me menu | Open the notes linked to that topic |
| `Open context` | `ClassHub.tsx:942`, topic context menu | Same, from the right-click menu |

## 2. `Plan 90 min` — build it, and a near miss worth recording

**The first draft of this brief said to cut it**, on the grounds that nothing
specified it. That was wrong, and only a grep caught it before the change
landed. §4.1 item 8:

> **FSRS study-session planner** — "you have 90 minutes" → an optimal,
> interleaved mix of what's due across classes (**interleaving beats blocking
> for retention**).

**The lesson: "I cannot find a spec for this control" is a reason to search
harder, not a licence to delete.** Removing it would have quietly dropped a
specified feature and left the app looking tidier for it.

### What it does

`studySessionPlan(dueTopics, minutes)` → an ordered queue that **interleaves
across classes** rather than blocking one class at a time, because that is the
whole retention claim behind the feature.

- Round-robin across courses, so no two adjacent blocks share a class where
  another class still has due work.
- The per-topic estimate is a **stated assumption, not a measurement.**
  `ReviewEvent` records no duration, so the plan says what it assumed rather
  than implying it timed anything (§4.1-J's timer is what would make this
  measurable, and it is not built).
- A session shorter than one topic returns nothing rather than half a topic.

## 3. The two notes items — wire to the real destination

`ClassNote.topicIds` already records which notes belong to a topic, so both
items route to the class's Notes tab with that topic preselected. Neither
needs a new record.

## 4. Do not break

- No invented feature to justify a button. Cut, or wire to something real.
- No route that lands on an empty screen with no explanation.

## 5. Done when

- [x] The inert-control script returns only legitimate triggers.
- [x] Build passes; suite green.

## 5a. Two further gaps the wiring exposed

Routing the notes items somewhere real surfaced two problems that had nothing
to do with the menu:

1. **The Notes tab had no `study-guide` section at all.** Its four sections
   cover exam intel, questions, priming and lecture notes — so a generated
   study guide, persisted an hour earlier as `type: 'study-guide'`, would have
   been **invisible in the app**. A successful generation would have looked
   like a failed one.
2. **Notes could not filter by topic**, so "Open linked notes" had nowhere
   meaningful to land. It now scopes to the topic, says which topic it is
   showing, says plainly when there are none, and offers a way back.

## 6. Commit

`fix(academics): wire or remove every inert control`

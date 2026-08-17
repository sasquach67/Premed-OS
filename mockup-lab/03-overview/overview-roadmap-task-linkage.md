# Overview roadmap task linkage

**Status:** APPROVED · **Scope:** the one permitted handoff from a Timeline
milestone to an Overview task.

## Behaviour

- A Timeline-owned milestone may create one linked Overview-owned task. The
  milestone keeps its title, target date, guidance, and strategic completion;
  the task keeps its own editable work state.
- The handoff is explicit: a quiet `Add task` action on the current roadmap
  card opens a short confirmation. The confirmation names the task destination
  and relationship before creating anything. Cancel changes nothing.
- After creation, the roadmap card shows a compact linked-task fact and an
  `Open task` handoff. Completing or archiving the task never silently
  completes, deletes, or rewrites the milestone.
- This is a separate, user-created **implementation task**, not a Timeline
  checklist `step`. A node's authored `step` still stays Timeline-owned and
  flows into Overview → Soon as the same record. One milestone may create one
  linked implementation task; its link remains recoverable if that task is
  completed, archived, or moved to Trash, and v1 offers no unlink/recreate
  path.
- With no milestone records, Overview shows only the Timeline setup route. It
  never fabricates a date, a generic schedule, a task, or a current step.

## Appearance

- **One treatment only.** These are states of the existing horizontal roadmap
  panel, not a new Overview tab, a ninth bento block, or A/B/C alternatives.
- The current milestone remains the visual anchor: raised solid card, primary
  dot/ring, `You are here` eyebrow, and one compact primary `Add task` action.
  `Open Timeline` is secondary and quiet.
- Creation uses two short solid rows directly beneath the same spine: task
  title, then relationship/ownership. It does not grow into a task editor or a
  second task card.
- Once linked, the task becomes a single subdued fact row with a clear
  `Open task` handoff. The no-milestones state is centered and airy, matching
  the existing roadmap empty-state geometry.
- All dense surfaces are solid-with-depth. There is no glass, meter, bar,
  percentage, ranking, score, or readiness treatment. Mobile retains the
  state order in one column; reduced motion is instant.

## Deliberately absent

No copied Timeline step, second linked implementation task, default date,
automatic task completion, task editor inside the roadmap, Atlas graph,
generic generated schedule, or completion percentage.

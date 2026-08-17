# T2 · Overview — roadmap handoff ownership decision

**Stage:** B · **DRAWN, NOT DECIDED — EXECUTED Aug 17, 2026**
**Decision:** **Option B.** A Timeline milestone may create one separate,
linked Overview implementation task. It is not a Timeline checklist `step`.
The manifest gate is now cleared for the approved board; this decision stage
still changes no `src/`, persisted data, routes, or service configuration.

The existing Overview work is largely shipped. The first remaining ladder
failure is a proposed roadmap state board whose visual treatment is complete,
but whose record ownership contradicts the more specific Timeline ruling. The
conflict must be resolved before the board can become an implementation source.

---

## 1. Fidelity audit

### a. Spec → paper

The approved Overview sources now give every ruled surface a reviewable paper
home:

| Ruled feature | Paper surface | Finding |
|---|---|---|
| Eight-block bento, Hero, mixed spans, stat tiles, and horizontal roadmap | `overview-bento-control-panel.html` + `.md` | Present. Its sample data is appearance-only; it cannot seed the app. |
| Tasks: Now/Soon/Done, full task route, detail/edit, completion, empty state, Timeline step treatment | `overview-task-states.html` + `.md` | Present. |
| Where I Stand expansion, Smart Actions absence, conditional Quick Access, roadmap empty state | `overview-status-states.html` + `.md` | Present. |
| Goal editor/no-goals, Capture paths, local widget loading/error/mobile states | `overview-capture-goals-states.html` + `.md` | Present. |
| Evidence-backed pace: unavailable, collapsed, expanded | `overview-projection-states.html` + `.md` | Present. |
| Roadmap-to-action handoff | `overview-roadmap-task-linkage.html` + `.md` | **Drawn, but not a valid decided surface yet.** It says a milestone creates a normal Overview task, while `tabs/11-timeline-tasks.md` rules that actionable node steps remain Timeline records and flow into Overview → Soon as one record, two doors. |

There is no other ruled Overview feature with no button, state, screen, or
field in the lab. The static bento's percentage completion treatment is a
spec/mockup conflict with `general.md` U-9; it is not a missing feature and
must not be reproduced.

### b. Mockup → app

| Mockup | App surface | Status and fidelity finding |
|---|---|---|
| `overview-bento-control-panel` | `src/pages/Home.tsx`; Overview components | Built. Home composes the ordered eight-block mixed-span bento; content surfaces use solid depth, with glass confined to Hero. |
| `overview-task-states` | `src/components/overview/OverviewTasks.tsx`; `/overview/tasks` | Built in `3abdb68`. Widget and expanded route share one task system, task detail peek, in-row controls, completion recovery, and no inline quick-add path. |
| `overview-status-states` | `OverviewStatus.tsx`, `SmartActionPanel.tsx`, `OverviewSupport.tsx`, `OverviewRoadmap.tsx` | Built in `3abdb68` and later fixes. Domains suppress a bar without a target; Smart Actions unmount when absent; conditional launchers and roadmap empty state exist. |
| `overview-capture-goals-states` | `OverviewSupport.tsx`; overview v13 migration | Built in `3abdb68`. Goals are explicitly check-off or measured; text/URL Capture persists to Story Bank. File capture is visibly unavailable, not falsely successful. |
| `overview-projection-states` | `OverviewStatus.tsx`; dated experience-hour selectors | Built in `5358d39` and `36b512b`. Calculations remain dormant without attributable dated evidence. |
| `overview-roadmap-task-linkage` | No matching legitimate app path | **Not built.** More importantly, the proposed `Add task` interaction cannot be built as written without contradicting Timeline record ownership. |

### c. Already built — do not rebuild

- `3abdb68` — `feat(overview): translate approved state coverage` (Tasks,
  Where I Stand, goals, Capture, Smart Actions, Quick Access, and resilience
  coverage).
- `bec129c` — `fix(timeline): make roadmap milestones canonical Timeline
  records` (one Timeline-owned milestone collection and a lossless migration).
- `5358d39` — `feat(overview): add evidence-backed pace disclosure`.
- `36b512b` — `feat(experiences): log dated hours for Overview pace`.
- `d7811d7` — `fix(overview): remove temporary advising panel`.
- `src/components/overview/OverviewHero.tsx`,
  `src/components/common/HeroDailySchedule.tsx`,
  `src/components/layout/Sidebar.tsx`, and
  `src/components/layout/AppShell.tsx` remain frozen approved work.

### d. Gate

At audit, `BUILD-MANIFEST.md` cleared the existing Overview sources but omitted
`overview-roadmap-task-linkage.html`. **Resolved in this decision execution:**
the approved board now has its own exact `YES` row. It is build-cleared for the
next brief; this decision stage still authorizes no app code.

### e. Decisions files

The existing state files are adequate decisions: each records both behaviour
and appearance. **Resolved in this execution:**
`overview-roadmap-task-linkage.md` now distinguishes the selected linked
implementation-task model from a Timeline-owned authored step. This was a
decision conflict, not a missing visual-description problem.

### f. Integrations and services Overview owns

| Dependency | Classification | Student sees today | Closure |
|---|---|---|---|
| Google Calendar Hero | **Code built and configured for the Primary calendar; public OAuth remains unverified** | A student who completes the Google test/consent flow can see timed events from the Primary calendar. The Hero does not merge secondary/subscribed calendars or all-day events. | OAuth verification is Andy-owned Google configuration. Broader calendar selection is a later product decision and code pass, not part of this roadmap decision. |
| Quick Capture thought and URL | **Code built and working locally** | A thought or valid `http`/`https` URL persists as a Story Bank record; the Atlas connection remains visibly reserved. | No work in this brief. |
| Quick Capture file | **Code missing, deliberately unavailable** | The student is told the file cannot yet be stored safely; no attachment is pretended to have saved. | A later Overview backend brief requires an attachment persistence model first. |
| Dated experience logs | **Code built and working locally** | Position detail writes attributable dated logs; Overview reads those logs for its honest pace disclosure. | No work in this brief. |

---

## 2. Why this lands at Stage B

Stage A passes: the handoff is drawn, mirrored, registered in the lab, and has
a companion decision file with appearance and behaviour.

Stage B initially failed because that behaviour contained two incompatible
definitions of the thing being created:

1. `03-overview.md` §6.7 and the proposed board say **a milestone may spawn a
   separate Overview-owned general Task**; the proposed board calls this
   `Add task`.
2. `tabs/11-timeline-tasks.md` and `03-overview.md` §6.4 say an actionable
   roadmap item is a **Timeline-owned typed `step`**. Overview → Soon reads it
   as part of a computed union. It is never copied into `tasks` and completion
   is shared.

The second is the detailed record-ownership ruling. This execution records the
explicit exception for the first: a milestone can create one separate linked
implementation task; authored Timeline steps remain the one-record/two-doors
flow. Stage B is now complete. The next brief may begin at Stage C; it must
build the selected relationship as a deliberate model, not reopen this choice.

---

## 3. References

- `premed-hq-documentation/specifications/03-overview.md` §0, §5–§6.9, §9,
  §11, especially §6.4 and §6.7
- `premed-hq-documentation/tabs/11-timeline-tasks.md` — node checklist typing,
  one-record/two-doors union, and Timeline ownership
- `mockup-lab/03-overview/overview-roadmap-task-linkage.html` + `.md`
- `mockup-lab/03-overview/overview-bento-control-panel.html` + `.md`
- `mockup-lab/03-overview/overview-task-states.html` + `.md`
- Remaining `mockup-lab/03-overview/*-states.html` decision sources
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/component-inventory.md`
- `premed-hq-documentation/general.md` U-5, U-7, U-8, U-9, U-12, U-13
- `src/lib/types.ts`, `src/lib/overview.ts`,
  `src/components/overview/OverviewRoadmap.tsx`, and `src/pages/Timeline.tsx`

---

## 4. Work — resolve the one ownership treatment

**Resolved Aug 17, 2026: Option B.** The current board's separate linked
implementation task is approved. The following records what the decision
settled for the next brief.

### Option A — follow the Timeline one-record rule *(rejected)*

Replace the board's normal `Add task` flow with the Timeline-owned **step**
treatment. The current node exposes authored actionable steps; those steps
appear in Overview → Soon, link back to the node, and share completion. No new
normal `Task` is created, no `TaskItem.timelineMilestoneId` relationship is
introduced, and there is no separate task confirmation state.

If chosen, redraw the board and update `03-overview.md` §6.7 to remove or
clarify its "milestones can spawn a task" wording so it cannot be read as a
second model.

### Option B — explicitly introduce a separate linked Overview task *(approved)*

Keep the board's `Add task` flow, but amend the Timeline one-record ruling to
say exactly when a milestone creates a separate general Task, its relationship
field, whether the node can have more than one, which operation breaks the
link, how trash/recovery works, and why that task is not a typed Timeline step.
This requires a new data-model and migration brief before any UI build.

### In either option

1. The decision file and board must name the final owner unambiguously.
2. The source must stay a compact state board within the existing horizontal
   spine: solid-with-depth, raised current card, quiet secondary handoff,
   one-column mobile order, and instant reduced-motion equivalent.
3. Do not add a score, readiness claim, rank, completion percentage,
   normalized bar, hardcoded date, generic roadmap, inline task editor, or
   duplicate list.
4. The lab source and companion record now say `APPROVED`, and the manifest
   contains the exact `YES` row. The next implementation brief must preserve
   this decision rather than reopen it.

---

## 5. Do not break

- No app, store, migration, route, OAuth, or manifest change in this stage.
- Do not create a second task collection, make Timeline own normal Tasks, or
  change a Timeline step by writing a copy into `tasks`.
- Do not remove the existing no-milestones route, change the eight-block bento,
  or modify frozen Hero/shell files.
- Do not imply that a general Task silently completes a milestone, or that a
  milestone silently completes a Task.
- Do not claim file Capture, all visible calendars, or public Google OAuth
  verification work before their respective paths are actually complete.

---

## 6. Done when

- [x] One owner model is explicitly ruled: a separate Overview implementation
  Task, distinct from Timeline steps.
- [x] The roadmap board and its `.md` name the model unambiguously.
- [x] Completion, archive/Trash recovery, and one-task-only behaviour are
  recorded without turning authored Timeline steps into copies.
- [x] The board has no U-9 score/progress/ranking treatment or fabricated data.
- [x] The board is `APPROVED` and its matching manifest row is `YES`.
- [x] No app code, persisted shape, or external configuration changed.

---

## 7. Commit

```text
docs(mockups): resolve Overview roadmap handoff ownership
```

Commit only the final board, its decision record, the amended owning spec, and
the exact manifest approval after Andy makes the ruling. Keep existing
unrelated mockup reorganization, School List, research, and other tab work
out of that commit.

---

## 8. Next stage — not in this brief

After the ownership ruling, board approval, and `YES` manifest gate, rerun
`TAB-BRIEF-PROMPT.md` for Overview. It will produce either a narrow fidelity
brief for the selected Timeline-step treatment or a full model/build brief for
an explicitly authorized separate Task. Google Calendar's additional-calendar
selection, public OAuth verification, and safe Capture attachment persistence
remain separate later closures.

# T2 · Overview — roadmap ownership backend

**Stage:** D · **BACKEND MISSING**

This is a narrow repair to the one remaining Overview data-path violation. It
does not redraw or restyle Home. The approved Overview build in `3abdb68`
already translated the other ruled state coverage.

---

## 1. Fidelity audit

### a. Spec → paper

**Pass.** Every ruled Overview feature has a reviewable approved mockup source:

| Ruled feature | Approved paper surface |
|---|---|
| Eight-block bento, task hierarchy, stat tiles, Quick Access, and roadmap | `overview-bento-control-panel.html` + `.md` |
| Task detail/empty/completion/expanded handoff | `overview-task-states.html` + `.md` |
| Where I Stand expansion, Smart Actions absence, conditional launchers, roadmap empty | `overview-status-states.html` + `.md` |
| Goal types/editor/empty, Capture paths, widget resilience/mobile | `overview-capture-goals-states.html` + `.md` |

No new paper is needed. The standalone historical Where I Stand mockup is
superseded by the approved status state board.

### b. Mockup → app

| Surface | Finding |
|---|---|
| Parent bento, frozen hero, Tasks, Smart Actions, stat tiles, conditional Quick Access | Built; retain. |
| Where I Stand inspector | Built in `3abdb68`; one open row, owner handoff, and no targetless bar. |
| Quarterly Goals and Capture | Built in `3abdb68`; explicit kind migration, Story Bank text/URL capture, honest unavailable file affordance. |
| Roadmap | **Backend divergent.** `OverviewRoadmap.tsx` calls `roadmapMilestones(tasks)` and patches `tasks`; `Timeline.tsx` also filters `TaskItem.milestone`. This is a task-backed second roadmap model, not Timeline-owned milestone records as required by `03-overview.md` §6.7. |

### c. Already built — do not rebuild

- The approved Overview state coverage shipped in `3abdb68`
  (`feat(overview): translate approved state coverage`).
- The temporary advisor panel was removed in `d7811d7`.
- `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, and
  `AppShell.tsx` remain frozen.

### d. Gate

**Pass.** `BUILD-MANIFEST.md` marks the Overview bento, target refinement, and
Where I Stand reference **YES**. `sauce-two-doors.html` remains **NO** and is
not part of this work.

### e. Decisions files

**Pass.** The four approved Overview decision files record appearance as well
as behaviour. Their solid-card, hero-only-glass, nested inspector, goal tag,
and local error/skeleton treatments remain binding.

---

## 2. Why this is stage D, not F

Stages A–C pass: the ruled surfaces are drawn, decided, and the approved
Overview UI/data work has landed. Stage D fails because a user-visible
interaction still persists to the wrong entity: checking a roadmap milestone
mutates `tasks`, while `03-overview.md` §6.7 and §0 rule that a roadmap node is
owned by Timeline and is **not** a flagged task.

Do not promote any Overview lab page to `built` until this record ownership is
true in the persisted model and both Overview and Timeline read the same
records.

---

## 3. References

- `specifications/03-overview.md` §0, §5–§6.9, especially §6.7 and its
  `TaskItem.milestone` ruling
- `tabs/11-timeline-tasks.md` — Timeline roadmap ownership
- `specifications/mockups/03-overview/overview-bento-control-panel.html` + `.md`
- `specifications/mockups/03-overview/overview-status-states.html` + `.md`
- `specifications/mockups/_shared/_visual-recipes.md`
- `implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `implementation/component-inventory.md`
- `general.md` U-5, U-7, U-8, U-9, U-12
- `src/lib/types.ts`, `src/lib/overview.ts`, `src/pages/Timeline.tsx`,
  `src/components/overview/OverviewRoadmap.tsx`, and `src/store/migrations/`

---

## 4. BACKEND — canonical Timeline milestone records only

1. Introduce one explicit persisted Timeline milestone entity and collection.
   It must hold the current roadmap information without borrowing task fields:
   label/title, target date when student-set, completion state, optional
   detail/guidance, order, and any existing owner route/reference needed for
   a safe handoff. Do not add generic default dates, readiness values, or a
   score.
2. Add a versioned, lossless migration from legacy `TaskItem.milestone ===
   true` records. Preserve each legacy task until its relationship and recovery
   behaviour are proved; do not delete a user's task or invent dates/content.
   If a clean lossless conversion requires a task-to-milestone reference, add
   that reference deliberately and test it.
3. Make one canonical selector return Timeline milestones. The existing
   Overview and Timeline renderers must obtain the same projected rows through
   that selector after the migration. This is data wiring, not a layout pass.
4. Completion changes the canonical milestone record, never a generic task.
   A milestone may later spawn/relate to a task, but it may not become one.
5. Export/backup/trash/recovery must include the new collection. Any new
   storage shape requires focused migration, restore, and idempotence tests.

### Explicitly out of scope

- No change to bento spans, card styling, hero, sidebar, task UI, or mockups.
- No Atlas branch graph, generated roadmap, hardcoded default milestones, or
  dates invented from the profile.
- No calendar work, OAuth, hour logs, pace, completion percentage presented as
  an evaluation, readiness score, or task duplication.

---

## 5. Do not break

- Existing normal tasks remain Overview-owned and must survive unchanged.
- The current roadmap empty state continues to route to Timeline setup.
- Existing task-backed milestone data is never silently discarded.
- Preserve keyboard controls, reduced motion, dark/light themes, and the
  current solid-with-depth/hero-only-glass judgment.
- Do not touch the four frozen shell/hero files.

---

## 6. Done when

- [ ] `TaskItem.milestone` is no longer the canonical roadmap data source.
- [ ] One versioned, lossless migration preserves every legacy milestone's
  title, date, completion state, detail, and recoverability.
- [ ] Re-running the migration is a no-op and frozen legacy input is safe.
- [ ] Overview and Timeline read the same canonical milestone selector.
- [ ] Completing a roadmap item writes only the Timeline milestone record.
- [ ] No generic milestone, target date, score, readiness calculation, or
  normalized progress is introduced.
- [ ] Full tests and production build pass.

---

## 7. Commit

```
fix(timeline): make roadmap milestones canonical Timeline records
```

Commit only the milestone model, migration, migration tests, selector wiring,
and this brief's direct support. Keep unrelated mockup, School List, research,
and other tab work separate.

---

## 8. Next stage — not in this brief

After the backend pass, re-run `TAB-BRIEF-PROMPT.md` for Overview. If the
existing visuals then match their approved sources, it should return **F** and
only then promote the Overview pages in `mockup-lab/variant-lab.html` to
`status:"built"` with the implementation commits noted beside their sources.

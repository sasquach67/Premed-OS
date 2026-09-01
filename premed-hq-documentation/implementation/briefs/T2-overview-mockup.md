# T2 · Overview — roadmap action state

**Stage:** A · **NOT DRAWN**

This is a drawing-only brief. It closes the first remaining Overview ladder
gap and does not authorize any `src/` changes. Re-run the tab brief generator
after this state is drawn, approved, and its visual decision is recorded.

---

## 1. Fidelity audit

### a. Spec → paper

The approved Overview sources cover the eight-block bento, Hero and its quiet
calendar prompt, Smart Actions and its absence state, task details and
lifecycle, Where I Stand expansion, stat tiles, conditional Quick Access,
quarterly-goal creation/editing/empty states, Capture, roadmap absence, and
per-widget loading/error/mobile states.

| Ruled feature with no paper surface | Why it is required | What must be drawn |
|---|---|---|
| **Roadmap milestone → linked task action and resulting linked state** | `03-overview.md` §6.7 says a milestone may spawn a task; the milestone remains Timeline-owned, the task remains Overview-owned, and the relationship is linked rather than duplicated. The component table also calls for completing/scheduling a milestone. The bento only draws passive cards and a Timeline link; no existing Overview board shows the action, confirmation, relationship, or the unavailable/empty condition. | One state board anchored to an existing roadmap card: (1) a current milestone with its quiet **Add task** action; (2) the short creation/confirmation state that identifies the task's Overview destination and keeps the Timeline milestone intact; (3) the already-linked state, including an **Open task** handoff. Show the no-milestones treatment in context, not a default schedule. |

This is the first failure. It must be drawn before another implementation or
fidelity brief can be written. The static bento's percentage-width completion
line is also a **spec/mockup conflict** with `general.md` U-9: it must not be
treated as a target for new code or a product judgement. The later source must
keep the factual completed/current/future state without introducing a score,
completion percentage, or normalised evaluation.

### b. Mockup → app

| Approved drawing | App finding | Fidelity finding |
|---|---|---|
| `overview-bento-control-panel.html` + current-app alignment | `src/pages/Home.tsx` composes the eight blocks; `OverviewHero`, `SmartActionPanel`, Tasks, Status, Support, and Roadmap own their real surfaces. | Parent bento, task header, solid-card hierarchy, and hero-only glass are already translated. Keep them. Its static sample milestones are visual context, never seed data. |
| `overview-task-states.html` | `OverviewTasks.tsx` and `/overview/tasks` provide the one task list at two sizes, CenterPeek editing, visible context-menu equivalents, and recoverable completion. | Built in `3abdb68`; do not create a second task product. The board's Timeline-step treatment supplies paper coverage for a received task, not for a Timeline milestone creating one. |
| `overview-status-states.html` | `WhereIStand`, `SmartActionPanel`, `QuickAccess`, and `OverviewRoadmap` cover the stated controls. | Current code still needs later fidelity review for record-level handoffs and the missing Quick Access log-hours launcher, but paper exists for those surfaces. They are not this first-stage mockup gap. |
| `overview-capture-goals-states.html` | `QuarterlyGoalsPanel` and `ActivityAndCapture` persist check-off/measured goals and Story Bank thought/URL capture. | Built in `3abdb68`. File save remains visibly unavailable pending safe local attachment persistence; do not draw it as successful. |
| `overview-projection-states.html` | `OverviewStatus.tsx` now renders unavailable, collapsed, and traceable dated-log projection states through `hourPaceProjection`. | Built in `5358d39`; actual dated-log entry is available from an Experience position in `36b512b`. |

### c. Already built — do not rebuild

- `3abdb68` — `feat(overview): translate approved state coverage`: Tasks,
  Where I Stand, goals, Capture, Quick Access, and resilience state coverage.
- `bec129c` — `fix(timeline): make roadmap milestones canonical Timeline
  records`: one Timeline-owned milestone collection and lossless migration.
- `5358d39` — `feat(overview): add evidence-backed pace disclosure`.
- `36b512b` — `feat(experiences): log dated hours for Overview pace`.
- `d7811d7` — `fix(overview): remove temporary advising panel`.
- `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, and
  `AppShell.tsx` are frozen approved work. This brief must not use a new state
  as a reason to alter them.

### d. Gate

The existing Overview bento, S3 task refinement, and Where I Stand row are
`YES` in `BUILD-MANIFEST.md`. This brief authorizes no app work. The new
roadmap-action state must be registered as `proposed`; when it reaches an
implementation brief, its specific mockup source also needs a `YES` manifest
row before code may change.

### e. Decisions files

**Pass for existing sources.** `overview-bento-control-panel.md`,
`overview-task-states.md`, `overview-status-states.md`,
`overview-capture-goals-states.md`, and `overview-projection-states.md` all
record both behaviour and appearance. The new roadmap-action board needs its
own companion decision record before a build brief can exist.

### f. Integrations and services owned by Overview

| Dependency | Classification | Student-facing state today |
|---|---|---|
| Hero → Google Calendar | **CODE BUILT, NOT CONFIGURED** | The Hero offers a quiet connect/class-schedule fallback, not the student's live Google events. `useCalendarSync`, Google Identity Services, silent renewal, caching, and day-event retrieval are already code-complete. |
| Quick Capture file | **CODE BUILT, DELIBERATELY UNAVAILABLE** | The File control explains that a safe local attachment store is required. Thought and URL capture save to Story Bank; no fake successful file capture exists. |
| Dated experience logs | **CODE BUILT AND WORKING LOCALLY** | `experienceHourEntries` are persisted locally; the position-detail form writes real dated logs and Overview projections read only those logs. |

#### Andy checklist — configure live Google Calendar

1. Enable **Google Calendar API** in the Premed OS Google Cloud project.
2. Configure the consent screen and only the `calendar.events.owned.readonly` scope.
3. Create/use a Web OAuth client with authorized JavaScript origins for
   `http://127.0.0.1:5173` and `https://sasquach67.github.io` (plus a real
   custom production origin if used).
4. Set `VITE_GOOGLE_CLIENT_ID` in local `.env.local`; set
   `VITE_GOOGLE_API_KEY` only if that chosen Google setup requires it.
5. Add the required public build variables as repository secrets and inject
   them in `.github/workflows/deploy.yml`; it currently injects Supabase only.
6. Verify: Connect in Hero → grant access → today's real events render → a
   refresh silently renews while the Google session permits it → Disconnect
   removes live schedule data.

This is configuration only, **not** backend work for this brief. Until it is
finished, Overview cannot reach Stage F even if all local records render.

---

## 2. Why this lands at Stage A

The prior Stage A state (honest projection) is now drawn and built; Stage B
passes because its decision file records appearance; Stage C passed in
`5358d39`; and the former roadmap ownership Stage D passed in `bec129c`.

However, the roadmap's required *spawn a linked task* interaction has no
button, confirmation, relationship state, or screen in any mockup. The
ladder stops at that first missing paper surface. This brief deliberately does
not code its model or polish any later fidelity issue.

---

## 3. References

- `premed-hq-documentation/specifications/03-overview.md` §0, §5–§6.9,
  especially §6.4, §6.7, §9, and §11
- `premed-hq-documentation/tabs/11-timeline-tasks.md` — milestone ownership
  and task relationship rules
- `mockup-lab/03-overview/overview-bento-control-panel.html` + `.md`
- `mockup-lab/03-overview/overview-task-states.html` + `.md`
- `mockup-lab/03-overview/overview-status-states.html` + `.md`
- `mockup-lab/03-overview/overview-capture-goals-states.html` + `.md`
- `mockup-lab/03-overview/overview-projection-states.html` + `.md`
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/component-inventory.md`
- `premed-hq-documentation/general.md` U-5, U-7, U-8, U-9, U-12, U-13
- `src/components/overview/OverviewRoadmap.tsx`, `src/pages/Timeline.tsx`,
  `src/lib/types.ts`, and `src/store/migrations/timelineV14.ts`

---

## 4. Work — draw one roadmap-action state board

1. Add a named state board under `mockup-lab/03-overview/`; register it in
   `mockup-lab/variant-lab.html` with `status:"proposed"`; mirror its HTML and
   companion `.md` under `premed-hq-documentation/specifications/mockups/03-overview/`.
2. Keep the state inside the existing horizontal roadmap card/spine geometry.
   It is **not** a ninth Overview block, a new Overview tab, or an alternative
   overall bento layout.
3. Draw the three actual product states in one selected treatment:
   - current milestone, with a quiet **Add task** action;
   - creation/confirmation, naming the exact task title and the fact it will
     appear in Overview Tasks while the milestone remains on Timeline;
   - already linked, with a compact task fact and **Open task** handoff.
   A no-milestones state remains a one-line setup route to Timeline, with no
   generic dates or default roadmap.
4. The visual hierarchy must be deliberate: raised current milestone first,
   then one subdued secondary action or linked-task line. Use a solid card;
   no glass, modal dashboard, progress meter, or duplicated task card.
5. Write the companion `.md` with both **Behaviour** and **Appearance**:
   selected treatment; geometry inside the spine; hierarchy; click, cancel,
   confirmation, and linked-state outcomes; mobile/reduced-motion treatment;
   and all deliberately absent UI.

---

## 5. Do not break

- Do not edit `src/`, storage, service configuration, frozen Hero/shell files,
  or the existing task/milestone collections in this stage.
- Do not draw a second task list, inline task editor, generic default roadmap,
  hardcoded dates, Atlas graph, or live Atlas route.
- Do not turn a linked task into the milestone's owner or imply that checking
  a task automatically completes the milestone unless a later approved model
  explicitly says so.
- Do not show a score, readiness claim, rank, completion percentage, normalised
  progress bar, or judgement of the student's position (U-5/U-8/U-9/U-13).
- Do not show successful file persistence or live Google events as mock data.
- Use the existing tokens and solid-with-depth recipe; glass remains only on
  qualified floating Hero/overlay surfaces.

---

## 6. Done when

- [ ] The three milestone-to-task states and no-milestones state are reachable
  from one named lab entry without pretending they are A/B/C alternatives.
- [ ] The state makes Timeline milestone ownership and Overview task ownership
  visually unmistakable.
- [ ] Its `.md` records both appearance and behaviour.
- [ ] The page is registered as `proposed` and mirrored in the canonical
  mockup directory.
- [ ] `rg -n -i "score|readiness|rank|[0-9]+%|progress"` over the new source
  is reviewed; no U-9 evaluation or percentage is drawn.
- [ ] There is no invented milestone date, prefilled task, fake external data,
  or second task system.

---

## 7. Commit

```text
docs(mockups): draw Overview roadmap task linkage
```

Commit only the new Overview state source, its decision record, and lab/canonical
registration. Keep unrelated app, Academics, MCAT, School List, research, and
mockup edits separate.

---

## 8. Next stage — not in this brief

After the state is drawn and Andy approves its appearance, rerun
`TAB-BRIEF-PROMPT.md` for Overview. It will re-audit paper coverage and land
on the next unfinished stage. The future implementation must include the task
relationship data path and UI together; it is **not** in scope here. Live
Google Calendar remains an Andy configuration prerequisite for Stage F, not a
reason to add OAuth-token backend code.

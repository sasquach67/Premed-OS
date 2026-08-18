# T2 · Overview — linked roadmap implementation task

**Stage:** C · DECIDED, NOT BUILT  
**Scope:** build only the approved `overview-roadmap-task-linkage` state in
the existing Overview roadmap panel. It is a normal Overview Task linked to
one Timeline milestone; it is **not** a Timeline authored `step`.

> This is a new companion rather than an edit to the existing uncommitted
> `T2-overview-build.md`. That file is unrelated working-tree work. The
> execution runner should use this newer, specifically named brief.

---

## 1. Fidelity audit

### a. Spec → paper

Every ruled Overview feature now has a reviewable source. Nothing lands at
Stage A.

| Ruled feature | Review source | Paper finding |
|---|---|---|
| Eight-block bento, Hero, Tasks, domains, stat tiles, capture, and roadmap | `mockup-lab/03-overview/overview-bento-control-panel.html` + `.md` | Present. Its sample content is visual-only and cannot seed app data. |
| Task detail/edit, empty, done, and expanded states | `overview-task-states.html` + `.md` | Present. |
| Where I Stand expansion, Smart Actions absence, conditional launchers, roadmap empty state | `overview-status-states.html` + `.md` | Present. |
| Quarterly goals, Capture paths, widget loading/error/mobile states | `overview-capture-goals-states.html` + `.md` | Present. |
| Evidence-backed pace disclosure | `overview-projection-states.html` + `.md` | Present. |
| One optional handoff from a milestone to a normal task | `overview-roadmap-task-linkage.html` + `.md` | Present and approved. |

The percentage treatment in the older bento drawing conflicts with `general.md`
U-9. It is not a missing feature and must never be translated into the app.

### b. Mockup → app

| Mockup | Existing app surface | Fidelity finding |
|---|---|---|
| `overview-bento-control-panel` | `src/pages/Home.tsx` and `src/components/overview/*` | Built. The eight ordered bento blocks exist; Hero is the sole glass context. |
| `overview-task-states` | `OverviewTasks.tsx`, `/overview/tasks` | Built in `3abdb68`; widget and expanded route share the same records and editor. |
| `overview-status-states` | `OverviewStatus.tsx`, `SmartActionPanel.tsx`, `OverviewSupport.tsx`, `OverviewRoadmap.tsx` | Built in `3abdb68` plus follow-up fixes: no target means no progress bar, and empty Smart Actions unmounts. |
| `overview-capture-goals-states` | `OverviewSupport.tsx`, overview v13 migration | Built in `3abdb68`; check-off/measured goals and thought/URL Story Bank capture persist. File capture honestly remains unavailable. |
| `overview-projection-states` | `OverviewStatus.tsx`, dated experience-hour selectors | Built in `5358d39` and `36b512b`; pace stays dormant without attributable dated evidence. |
| `overview-roadmap-task-linkage` | No legitimate matching implementation | **Not built.** `OverviewRoadmap.tsx` only renders Timeline milestones, their strategic checkbox, a forbidden completion count, and a percentage bar. It has no confirmation, relationship, task creation, or Open task handoff. |

### c. Already built — do not rebuild

- `3abdb68` — `feat(overview): translate approved state coverage`: Tasks,
  Where I Stand, goals, Capture, Smart Actions, Quick Access, and resilience
  states.
- `bec129c` — `fix(timeline): make roadmap milestones canonical Timeline
  records`: Timeline owns milestone records and their lossless migration.
- `5358d39` — `feat(overview): add evidence-backed pace disclosure`.
- `36b512b` — `feat(experiences): log dated hours for Overview pace`.
- `d7811d7` — `fix(overview): remove temporary advising panel`.
- `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, and
  `AppShell.tsx` remain frozen approved work. Do not modify them.

### d. Gate

`BUILD-MANIFEST.md` explicitly marks
`03-overview/overview-roadmap-task-linkage.html` **YES**. The selected
source is eligible to implement. `sauce-two-doors.html` is still `NO` and is
out of scope.

### e. Decisions files

All Overview state decisions files record behaviour **and appearance**. In
particular, `overview-roadmap-task-linkage.md` settles a single solid,
inline treatment: the current milestone remains the visual anchor; its short
creation confirmation and linked-task fact live underneath the same roadmap
spine. It is not a new tab, a ninth bento block, or an A/B/C choice.

### f. Integrations and services Overview owns

| Dependency | Classification | Student sees today | What closes the gap |
|---|---|---|---|
| Google Calendar Hero | **CODE BUILT, NOT CONFIGURED for verified public OAuth** | A Primary-calendar timed-event connection can work for a consented tester, but Google shows an unverified-app warning. Secondary/subscribed calendars and all-day events are not silently merged. | Andy completes Google OAuth branding/verification; this is account-console work, not code in this brief. |
| Quick Capture: thought and valid URL | **CODE BUILT AND CONFIGURED locally** | The item persists as a Story Bank record; the Atlas route is visibly reserved. | No change here. |
| Quick Capture: file | **CODE MISSING, deliberately unavailable** | The app refuses to pretend a file saved. | A future attachment model and approved source are required before it can be built; do not invent either here. |
| Dated experience logs for pace | **CODE BUILT AND CONFIGURED locally** | Attributable dated logs feed the honest pace disclosure; aggregates do not. | No change here. |

### Andy checklist — make Calendar public after this code is otherwise ready

1. In Google Cloud **Auth Platform → Branding**, provide the live home,
   privacy, and terms URLs; add the deployed site domain as an authorized
   domain. When moving from GitHub Pages to a custom domain, add the new
   domain and its exact OAuth redirect/origin **before** cutting traffic over;
   keep the old GitHub Pages entries until the move is confirmed.
2. In **Data Access**, retain only the Calendar scopes the app actually asks
   for (currently read-only) and make sure the Google Calendar API is enabled
   in this project.
3. In **Audience**, keep personal tester accounts listed while testing. For
   public access, submit the OAuth verification flow rather than trying to
   bypass the warning.
4. In Supabase Auth, add the same exact deployed callback URL(s) and ensure
   the Google provider uses this Google client. In Google’s OAuth client,
   add the matching Supabase callback and each deployed web origin.
5. Test from the deployed URL with a non-developer Google account: connect,
   consent, refresh the Hero, disconnect, and reconnect. A real timed event
   today must appear; a failed consent must show a recoverable local error,
   never mock events.

This configuration gap prevents the whole Overview tab from reaching Stage F,
but it is not code to add in this Stage C brief.

---

## 2. Why the first blocked stage is C

Stage A passes: the task-linkage state is drawn. Stage B passes: its companion
decision document defines both the short confirmation's behaviour and its
solid, inline appearance, and the ownership conflict is formally resolved.

Stage C is the first failure because the approved source has **no** app
implementation. This brief builds the frontend and durable relationship
together. It does not rebuild any previously shipped Overview surface.

---

## 3. References

- `premed-hq-documentation/specifications/03-overview.md` §0, §5–§6.9, §9,
  and §11, especially §6.4 and §6.7
- `premed-hq-documentation/tabs/11-timeline-tasks.md` — authored `step`
  ownership and its explicit one-linked-implementation-task exception
- `mockup-lab/03-overview/overview-roadmap-task-linkage.html` + `.md`
- Remaining `mockup-lab/03-overview/*` sources listed in the audit
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/component-inventory.md`
- `premed-hq-documentation/general.md` U-5, U-7, U-8, U-9, U-12, U-13
- `src/lib/types.ts`, `src/lib/overview.ts`, `src/store/store.ts`,
  `src/store/migrations/timelineV14.ts`,
  `src/components/overview/OverviewRoadmap.tsx`, and
  `src/components/overview/OverviewTasks.tsx`

---

## 4. Work — full implementation of the one approved handoff

### 4.1 Durable model and migration

1. Add `implementationTaskId?: ID` to `TimelineMilestone`. It points to the
   one separately created normal task. It is **not** `legacyTaskId`, and it
   must never reuse `TaskItem.timelineMilestoneId`.
2. Add a v16 hydration migration and advance `CURRENT_STORE_VERSION` to 16.
   The migration is additive and lossless: existing milestones receive no
   invented relationship, date, priority, schedule, category, or completion
   state. Existing `implementationTaskId` values survive unchanged. Return a
   fresh structure only when a change is necessary and remain idempotent.
3. Keep the ID on the milestone when its linked task is finished, archived, or
   placed in Trash. That preserved relationship is the recovery path. There is
   no v1 unlink, clear, replacement, or automatic recreation action.
4. Add a single store-level action for this relationship. It must create the
   ordinary Task and patch the owning milestone in **one Immer transaction**.
   A second activation for the same milestone must be a no-op/reject, never a
   duplicate task. Use the standard task factory/defaults; do not infer fields
   from the milestone and do not add a parallel task model.
5. The created task is a standard `tasks` record and must **not** have
   `milestone` or `timelineMilestoneId` set. Therefore it continues to appear
   in the normal Overview task selector and can be edited, scheduled,
   completed, archived, deleted, restored, or permanently removed under the
   existing task rules. Its title starts as the milestone title so the student
   can change it in the short confirmation before creation.

### 4.2 Roadmap frontend

Translate the approved board inside the existing `OverviewRoadmap` card:

1. Keep the current milestone as the anchor: raised solid card, primary
   ring/dot, `You are here` eyebrow, quiet `Open Timeline` link. The new
   `Add task` action appears only for the current, non-completed milestone
   with no `implementationTaskId`.
2. Activating `Add task` reveals the two compact solid rows directly below
   the spine:
   - a labeled, editable Task title prefilled from the milestone title;
   - a plain relationship fact naming Timeline as owner and Overview Tasks as
     destination.
   The only actions are `Create linked task` and `Cancel`. Escape and Cancel
   make no write. This is explicitly **not** a task editor.
3. Creating calls the one atomic store action. On success, replace the
   confirmation with one subdued linked-task fact row and an `Open task`
   handoff. The link must open that exact normal task in Overview’s existing
   detail/CenterPeek path, not a copied detail page or a Timeline route.
4. If the stored linked task is finished, archived, in Trash, or permanently
   absent, keep the relationship fact honest. Show its actual recoverable
   state where it can be resolved through the normal task/trash path; do not
   offer a duplicate, silently relink, or mark the milestone completed.
5. Preserve the existing no-milestones absence state: centered, airy, and
   limited to `Open Timeline`. It creates no generic roadmap, target date,
   current milestone, or task.
6. Remove the existing `completed / milestones` badge and percentage-width
   completion bar from `OverviewRoadmap`. They are U-9 violations and conflict
   with the approved linkage source. A neutral roadmap spine is allowed; no
   ratio, meter, score, ranking, readiness, or progress treatment is.
7. Reuse the existing `Card`, `Button`, `Input`, `Badge`, `CenterPeek`, link,
   focus, motion, and task-edit components. Do not fork a task card, route, or
   timeline record card. The relationship state is dense solid-with-depth;
   there is no glass.
8. Keep keyboard behaviour, labelled regions, visible focus, and reduced
   motion. Mobile retains the same state order in a single column without
   truncating the relationship or hiding its actions.

### 4.3 Boundaries that must hold

- Timeline remains the canonical owner of milestone title, target date,
  detail, ordering, and strategic completion. Marking a milestone complete
  never finishes its linked task; completing/archiving/deleting a task never
  changes the milestone.
- Timeline authored `step` records remain Timeline-owned and flow to Overview
  as their existing one-record/two-doors union. Do not convert a linked task
  into a step or create a step from it.
- Do not change `src/pages/Timeline.tsx` or draw a new Timeline surface: the
  Timeline spine mockup is still blocked in the manifest. This brief makes the
  relationship visible on the approved Overview source only.
- Do not touch Hero/calendar code, Capture attachment persistence, the frozen
  shell files, demo seed data, or any unapproved mockup.
- No hardcoded mockup colours, fonts, radii, spacing, or inline style rules;
  use signed-in app tokens and the real component system.

### 4.4 Tests and verification

Add focused tests that prove:

1. v15 → v16 retains every existing milestone/task field, adds no relationship
   where none existed, and preserves an existing `implementationTaskId` on a
   second run.
2. One create action writes exactly one ordinary Task plus exactly one
   milestone link; reactivation cannot create a second task.
3. The ordinary linked task is included by `overviewTasks()` (it has no legacy
   `timelineMilestoneId`) and changing its completion/archive/trash state does
   not mutate the milestone.
4. Soft-delete then restore keeps the same link; permanent deletion leaves the
   retained milestone link honest and does not enable recreation.
5. The confirmation writes nothing before `Create linked task`; Cancel/Escape
   writes nothing.
6. The direct `Open task` handoff opens the real selected task in the existing
   Overview task-detail path.
7. The roadmap renders no completion fraction or CSS percentage width. Grep
   must find no `completed /`, `progress`, or percentage completion treatment
   in `OverviewRoadmap.tsx`.
8. `npm run test` and `npm run build` pass; signed-out/local mode, both themes,
   keyboard-only operation, and reduced motion retain the existing Overview
   behaviour.

---

## 5. Do not break

- The one-store, lossless migration contract; test frozen input and repeated
  migration execution.
- The existing task lifecycle, undo/recovery, trash, data export/import, and
  one-list/two-sizes task UI.
- Honest absence: no invented milestone, task, schedule, due date, priority,
  source, readiness, or numeric progress.
- U-9, U-5, U-7, U-8, U-12, and U-13.
- The approved visual hierarchy: Hero only floats with glass; roadmap and its
  creation state are solid, contextual, and quiet.

---

## 6. Done when

- [ ] One Timeline milestone can create one, and only one, separately linked
  normal Overview Task.
- [ ] The relationship survives task completion, archive, and Trash without
  changing the milestone or enabling a duplicate.
- [ ] The confirmation is short, inline, cancellable, keyboard-accessible,
  reduced-motion safe, and does not become a second task editor.
- [ ] `Open task` reaches the one real task detail path.
- [ ] The normal task remains visible in Overview’s normal task collection;
  authored Timeline steps retain their different one-record/two-doors path.
- [ ] `OverviewRoadmap` contains no count, ratio, percentage, or progress bar.
- [ ] No frozen shell/Hero file, Timeline surface, attachment system, calendar
  code, demo data, or blocked mockup was changed.
- [ ] Tests and production build pass.

## 7. Commit

`feat(overview): link roadmap milestones to implementation tasks`

Commit only the implementation and tests for this brief. Commit unrelated
working-tree changes separately.

## 8. Next stage — out of scope

After execution, re-run `TAB-BRIEF-PROMPT.md` for Overview. Do **not** promote
Overview to Stage F yet: public Google OAuth still needs Andy’s verification
work, and file Capture remains deliberately unavailable until an attachment
model is decided and drawn. Those are not invitations to extend this brief.

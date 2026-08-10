# S6 brief — move tasks to Overview, narrow Timeline to the roadmap

Implements the Aug 2026 rulings in `tabs/11-timeline-tasks.md` and `specifications/03-overview.md` §0: **tasks are Overview's, deadlines belong to their owners, Timeline is the four-year roadmap and nothing else.**

**If something here is unclear or the spec is silent, stop and ask — do not guess.**

---

## Read this before starting: the seven links are dead ends

`OverviewTasks.tsx` has 7 affordances that call `navigate('/timeline')` — set due date (×2), edit category, edit due date, open a task, "+N more", and an empty-state CTA. **Every one of them lands on a page that cannot do the thing.**

**Timeline never had task editing either.** Its `Board` tab is a kanban with **no edit affordances at all** — cards move between columns, nothing else. Its `Add task` button creates a task with an **empty title and no field to type one into**. Its rich editing surface, `AssignmentsPanel`, operates on the **`assignments` collection, not `tasks`** — that is Academics' D3 work and always was.

**So this is not a port. Nothing functional is being moved, because nothing functional is there.** Overview is not losing a capability; it is gaining one the app never had.

That makes the ordering constraint easier than it looked: **Group 3 cannot break task editing, because task editing does not exist.** Still run Group 2 first, so the app is never worse than it is now.

**A note on scale.** `deferred.md` originally called S6 "four links." That was wrong: it is **19 references across 9 files**, plus three of Timeline's four tabs. The count was taken from the shell spec's §3.3–§3.5 paragraphs rather than from the code.

### The bar (Andy, Aug 2026)

*"It should have full functionality. Even though it's a little widget on the Overview, it should be fully functional, and if you want to expand it, then you expand it in Overview."*

**The widget is the product, not a preview of it.** `03-overview.md` §6.4 already says *"one list at two sizes, not two implementations"* and *"if the expanded view ever grows behavior the widget lacks, that is a defect."* **This brief is where that rule gets enforced for the first time.**

**Full functionality is defined by `TaskItem`'s own fields** — if the model carries it, the user can edit it. See the parity table in Group 2.

---

## Out of scope — do not attempt

- **The quest-log redesign.** Sequenced nodes, soft-lock, per-node content, achievements — all of `11-timeline-tasks.md`'s design is a **later chunk, blocked on S7.** `RoadmapGraphic` stays exactly as it is here.
- **Splitting `TaskItem`** into task / deadline / node entities. That is **S7**, needs a versioned migration, and nothing in this brief depends on it.
- Any change to `AssignmentsPanel`'s internals. It moves; it does not get rewritten.

---

## Group 0 — two milestone leaks (commit: `fix(shell): stop milestones leaking into task surfaces`)

**Do this first. It is independent of every other group and ships on its own.**

Roadmap milestones are stored as rows in `data.tasks` with `milestone: true`. **Every reader of `tasks` must filter them out, and two readers do not.** These are live defects today, not consequences of this brief.

0a. **`attention.ts:93`** — `...data.tasks.map((task) => deadlineItem(task, today))` has **no `!task.milestone` filter**, so a dated roadmap milestone appears in the Attention bell as a deadline with the action label `Open task`. **Add the filter.**
0b. **`CommandSearch.tsx:60`** — `for (const row of store.tasks)` has **no filter**, so milestones are returned as task records in search. **Add the filter.**

**These are guards, not the fix.** The fix is **S7**: a node should not be a row in the tasks array at all. **Do not extend the guard pattern** — if you find a third reader that needs `!task.milestone`, add it and **report it**, because the count of places repeating this filter is the argument for S7.

**Reference readers that already do it right:** `overview.ts:65`, `Timeline.tsx:77`.

## Group 1 — nav and routes (commit: `refactor(shell): rename Timeline, add /overview/tasks`)

1. **`routes.tsx`** — `id: 'timeline'` label `'Timeline & Tasks'` → **`'Timeline'`**. Tagline `'The cycle as a graphic + your assignment tracker.'` → **`'The roadmap for your whole premed journey.'`** The old tagline names two things this tab no longer holds.
2. **Add the `/overview/tasks` sub-route.** Full screen, inside Overview. Precedent and pattern: `/academics/classes/:courseId`. **Not a sidebar entry** (`nav: false`), **not a `CenterPeek`**.
3. **`/overview/tasks` renders the same component as the widget**, at a larger size, per `03-overview.md` §6.4: *"one list at two sizes, not two implementations."* **Do not fork a second task list.** The expanded view adds room to filter and search — **no behavior the widget lacks.** If you find yourself adding a capability to only one of them, stop and ask.

## Group 2 — full task functionality on Overview (commit: `feat(overview): own task editing`)

### 2a. The parity table — what "fully functional" means

**Every field on `TaskItem` (`types.ts:500`) must be editable, or explicitly ruled out.** Current state:

| Field | Editable today | Target |
|---|---|---|
| `title` | **NO. Set once at quick-add and never renameable anywhere in the app.** | **Inline rename on the row.** The most basic missing thing here |
| `deadline` | **NO** — dead-end nav ×3 | **Date picker on the row**, no navigation |
| `notes` | **NO surface anywhere in the app** | Task detail (2c) |
| `fileUrl` | **NO surface anywhere in the app** | Task detail (2c) |
| `type` (category) | yes — dropdown + context submenu | keep. **The dropdown shows `CATEGORIES.slice(0, 4)`, the context menu shows all 8** — an inconsistency, not a design. Show all 8 in both |
| `progress` | yes — checkbox complete/reopen | keep |
| `important` | yes — star + both menus | keep |
| `horizon` | yes — `Move to Now/Soon` | keep |
| `order` | yes — drag within tab | keep |
| `archived` | yes — via complete | keep |
| `kanban` | only from Timeline's board, which is being deleted | **No UI.** A redundant third progress model beside `progress` and Now/Soon/Done. `complete()` already writes it; **keep writing it, surface nothing.** S7 decides if it survives |
| `course` / `courseId` | no | **Deliberately none.** A course-linked task is an *assignment* and belongs to Academics (`D3-assignments.md`). **Do not add a course picker** — it would rebuild the boundary this ruling removed |
| `milestone` | no | **Deliberately none.** Timeline's, and S7's problem |

### 2b. Fix the seven dead ends

4. **`Set due date`** (dropdown ~324, context menu ~352) — opens a date picker **in place**. `01` §4b requires a visible equivalent outside the context menu; the row's date badge is it.
5. **Edit category (~298) and edit due date (~302)** — inline edit on the row, no navigation. **The date badge only renders when `task.deadline` exists**, so add an affordance for setting a *first* date on a task that has none.
6. **Row title link (~295)** — becomes **inline rename**, plus opening the detail (2c).
7. **`+N more →`** (~209) → **`/overview/tasks`**.
8. **Both empty-state CTAs** (~120 header, ~150 `done` tab) — currently `Timeline` / `Open Timeline`. **Neither should send the user off the page.** The header button becomes the expand affordance (`/overview/tasks`); the `done`-tab CTA is simply wrong and goes. **Also fix the empty copy at ~154** — *"Add a title below or move work here from Timeline"* names a workflow that will not exist.

### 2c. Task detail — the one new surface

`notes` and `fileUrl` cannot live on a row at either size. **They open in a `CenterPeek`**, the shared one-record pattern (`01` §2.1), reachable identically from the widget and from `/overview/tasks`.

**This does not violate "expand adds only room."** The peek is not the expansion — it is a third surface available at both sizes. The expansion still adds filtering and search and **nothing else**.

### 2d. Re-point the rest
9. **`QuickAddDialog.tsx:72`** — `task: '/timeline'` → **`'/overview/tasks'`**.
10. **`CommandSearch.tsx`** — `action-overdue` sub-label `'Open Timeline & Tasks'` → **`'Open tasks'`**, route `/timeline?filter=overdue` → **`/overview/tasks?filter=overdue`**. Task record hits (line ~60) route to **`/overview/tasks`**.
11. **`attention.ts:53`** — deadline items route `/timeline` → **the owning record's page.** An assignment deadline opens Academics, a task deadline opens `/overview/tasks`. **The bell is the aggregator; it must not funnel everything to one tab** (shell §2.2, Aug 2026).
12. **`Topbar.tsx:88`** (`LiveStatusChip`) and **`AlertsStrip.tsx:24`** (`View all →`) → **`/overview/tasks`**.
13. **`NextEventWidget.tsx:45,50`** → **`/overview/tasks`**. Its empty copy says *"No upcoming deadlines — add one"*; adding a deadline now means adding it **to the record it belongs to**, so this needs rewording, not just re-pointing. Propose copy and flag it.
14. **`logActivity('timeline', …)`** at `OverviewTasks.tsx:96, 238, 249` — the activity feed still files task events under Timeline. Re-tag to Overview, and **check whether existing feed entries need a migration** so history does not deep-link to a page that no longer holds tasks.

## Group 3 — narrow Timeline (commit: `refactor(timeline): roadmap only`)

**Only after Group 2 is working.** `Timeline.tsx` has four tabs; **three of them belong to other pages.**

15. **`Assignments` tab → delete.** `AssignmentsPanel` is Academics' (`briefs/D3-assignments.md`: *"Anything tied to a class lives here — `courseId` is required"*). If it is not already mounted on Academics → Daily → Assignments, **mount it there before removing it here.**
16. **`Board` tab (`TaskBoard`) → delete.** A kanban over `tasks`, which are Overview's, with **no edit affordances** — it only moves cards between columns. Overview's Now/Soon/Done plus the star is the locked model (`03-overview.md` §6.4). **The `kanban` field stays on `TaskItem` and keeps being written** (2a); only the UI goes. **Do not drop data.**
17. **`Verify` tab (`VerifyChecklist`) → does not belong here, and does not obviously belong anywhere.** It renders `advisingQs` and Andy's `don't-do` tips — neither is a task, a deadline, or a roadmap node. **Do not delete it. Do not silently relocate it. Move it out of Timeline and report where you think it should live** — Help and Overview are both plausible, and this is a product call, not an implementation one.
18. **`Add task` page action → delete.** It creates a task with an empty title and no way to name it; Overview's quick-add replaces it properly.
19. **`RoadmapGraphic` becomes the whole page** — no `Tabs` wrapper around a single view.
20. **`overview.ts:87`** — `milestoneRoute`'s fallback returns `/timeline`, which **stays correct**: a roadmap milestone with no better home does belong to Timeline. **No change. Listed so it is not swept up with the others.**
21. **`UltimateGuideDialog.tsx:138`** — `Open cycle timeline` → `/timeline` **stays correct. No change.**

## Group 4 — spec sync (commit: `docs(shell): clear the stale-route warning`)

22. **Remove the stale-route warning** in `00-product-shell.md` §2.1 once Groups 1–3 land, and update §3.3–§3.5's as-built paragraphs to describe the new wiring.
23. **Tick S6** in `implementation/deferred.md` §1.

---

## Report

For each numbered item: **done / partial / skipped**, with file references.

**Call out specifically:**

- **The parity table (2a)** — confirm every `TaskItem` field is either editable or on the ruled-out list. **This is the acceptance test for the whole brief.**
- **Item 17** — where you think `VerifyChecklist` belongs, and why.
- **Item 13** — your proposed `NextEventWidget` empty-state copy.
- **Item 14** — whether existing activity-feed entries need migrating.
- **Any 20th reference** to `/timeline` this brief missed.
- **Any third reader needing the Group 0 milestone guard** — each one found strengthens S7.

## Verify

- **Parity at both sizes.** Every action available in the widget is available at `/overview/tasks`, and **vice versa**. A capability on only one of them is a defect (`03-overview.md` §6.4).
- `npm run test` and `npm run build` pass before each commit.
- **Signed-out mode** works, per `CLAUDE.md`'s localStorage-first rule.
- **Both themes**, keyboard-only, and reduced-motion — the row grew inline editing, so **check that rename and the date picker are reachable without a pointer.**
- **Empty states** on all three tabs read as a friendly one-liner, never a blank void.

`npm run test` and `npm run build` must both pass before each commit. Verify **signed-out mode** and **both themes**, per `CLAUDE.md`.

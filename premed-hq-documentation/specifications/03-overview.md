# 03 — Overview (Home)

**Status:** Approved for implementation
**Date:** July 21, 2026
**Repo:** `sasquach67/Premed-OS` — `src/pages/Home.tsx`
**Depends on:** `specifications/00-product-shell.md`, `architecture/01-global-design-system.md`, `architecture/02-global-intelligence-framework.md`, `architecture/04-admissions-framework.md`, `general.md`

> ## ▶ APPROVED VISUAL REFERENCE — read before building
>
> **`specifications/mockups/03-overview/overview-bento-control-panel.html`** — open this file in a browser **before writing any Overview code**. It is the **approved** layout, density, hierarchy, and feel for this page (approved July 2026).
>
> - The mockup shows **what it should look like**; this spec is law for **behavior, data, and rules**. Where they disagree on behavior, the spec wins; where they disagree on layout/density, the mockup wins.
> - **Do not copy its markup.** It is static HTML with no data. Rebuild every block from the real library components named in **§6a Components used** — the mockup's inline CSS exists only to show the target.
> - It encodes the decisions most easily lost in translation: the **bento grid of mixed-size panels** (§5), **block order**, **no attention strip** (§6.2), **tasks as Now/Soon/Done tabs with star-only prioritization** (§6.4), **compact-but-with-pace domain rows** (§6.5), **stat tiles** (§6.5a), **quick access** (§6.5b), and the **horizontal milestone-card roadmap** (§6.7).
> - Glass judgment is visible in it and is binding (`04` §0c): frosted glass **only** on the hero cards floating over the banner and on the context menu; every content panel, row, tab, field, and badge is **solid-with-depth**.

---

## 0. Ownership (added Aug 2026)

**Overview has no `Ownership` section historically**, because it read as a pure dashboard: a projection of records other tabs own. That is still mostly true, **with two exceptions that are genuinely Overview's**:

- **Owns (canonical create/edit/archive):** **`Task`** (general to-dos) · the **shell calendar** (`00-product-shell.md` §7.9, already ruled Overview-owned because it spans every pillar).
- **References only:** every pillar's records, GPA, hours, milestones, deadlines, and everything else it renders.

**Why Tasks are Overview's** (RULED Aug 2026, Andy): general to-dos are the one record type **no pillar owns**. They are not clinical, academic, or application-specific. Overview is where a student already works them, and an earlier arrangement making Timeline the technical owner while Overview held the screen was bookkeeping that helped nobody. Andy: *"I don't think it laying in the Timeline makes a lot of sense."*

**Timeline keeps the roadmap, and only the roadmap** (RULED Aug 2026, Andy). **Deadlines are not Timeline's either** — each belongs to whatever the date is attached to (assignments → Academics, submission windows → Research, follow-ups → Letters), and they aggregate in the **Attention bell**, never in a second list. Timeline's scope is *four years*; anything resolving inside one term is out of scope for it. See `tabs/11-timeline-tasks.md`.

**Assignments are Academics'** and never appear in the task widget (§6.4).

## 1. Purpose and Scope

Overview is the student's home base — the screen they land on and return to. Its job is to answer four questions at a glance, and nothing else:

1. **Where am I?**
2. **What needs attention?**
3. **What should I work on?**
4. **What's changed?**

Every widget on this page must earn its place by answering one of those four. Anything that can't is cut.

### What Overview owns

**Nothing.** Overview is a pure composition layer (per `00-product-shell` §2.2). It reads from every other page's data and deep-links back to the owning page to act. It never becomes a second editing surface for records it doesn't own.

### The one exception: hybrid inline actions

Overview is a **status board you can act in for a few high-frequency things only**. Exactly three inline actions are permitted, because they're done daily and routing out for them would be hostile:

- Check off / complete a task
- Create a task from the Tasks header (standard create form)
- Quick Capture an idea or source (into Atlas)

Every other action opens the owning page. Editing a task's details, logging structured hours, managing a goal — all route out. If a fourth inline action is ever proposed, it must be justified against this rule, not smuggled in.

---

## 2. Current Implementation

Grounded in `src/pages/Home.tsx` as of this date (699 lines).

Current widgets, top to bottom: **Hero** (themed Ghibli/Doraemon banner, greeting, live clock, countdown to next timed calendar event, mascot bubble, today's-schedule timeline) → **TaskWorkspace** (Today/All toggle, pinned focus targets, task rows, standard add dialog) → **AtAGlance** (GPA / hours / best MCAT stat tiles) → **McatOverviewCard** (large: phase, study-plan progress, launch-a-block, QOTD peek) → **PremedRoadmap** (8 hardcoded stages) → **UpcomingPanel** ("Soon" alerts, 14-day) → **LowerWidgets** (MCAT QOTD, Quarterly goals, Recent activity, Ideas capture).

---

## 3. Current Strengths (preserve)

1. **The hero's "what's now" band is genuinely useful** — live countdown to the current/next calendar event plus a today's-schedule timeline answers "where am I *right now*" better than most dashboards.
2. **Tasks already support the hybrid model** — standard-form creation and inline check-off exist and feel right.
3. **The roadmap gives a real long-view** — Foundation → Matriculate answers "where am I in the whole journey."
4. **Recent activity** cheaply answers "what's changed."
5. **Themed hero banner is brand, and it stays** — personality is a feature here, not clutter.

---

## 4. Current Weaknesses (this spec fixes)

1. **MCAT eats ~40% of the page** — a full hero card *plus* a QOTD widget *plus* a QOTD peek inside the card. One domain dominates; Clinical, Research, Volunteering, Essays get nothing on Home.
2. **QOTD was rejected in the handoff** yet appears twice. It does not materially improve workflow given the dedicated MCAT features.
3. **No domain-level status.** There's no single place to see where *every* domain stands — the thing a home base most needs.
4. **No intelligence.** Nothing here makes Premed OS feel like an intelligent OS rather than a tracker. No recommendations, no "next best action."
5. **Ideas capture is a dead end** — captured text goes nowhere and connects to nothing.
6. **Attention is scattered** — the "Soon" panel duplicates what the shell's Attention bell now owns.
7. **AtAGlance is a thin subset** of what a real domains view should show.

---

## 5. Target Structure

**Layout model — bento control panel (locked).** Overview is *not* a stack of equal full-width rectangles. It is a **12-column bento grid of mixed-size panels** — some tall, some wide-and-short, some small squares — so the page reads as a control panel with visual hierarchy and rhythm. Uniform stacked rectangles are a defect. Panel sizes below are the reference spans; motion, glass judgment, and depth per `04` §0c/§7a.

Eight blocks. Each is tagged with the question it answers.

| # | Block | Question | Bento span |
|---|---|---|---|
| 1 | **Hero** (banner, greeting, countdown, today's schedule) | what's now | full-width, ~250px tall |
| 2 | **Smart next actions** (≤3, explainable) | what should I work on | full width, short (3 cards across) |
| 3 | **Tasks** (Now / Soon / Done tabs) | what should I work on | **tall**, 7 cols |
| 4 | **Where I stand** (domains, compact + pace) | where am I | **tall**, 5 cols |
| 5 | **Stat tiles** — GPA sparkline · MCAT ring · Hours bars | where am I (numbers) | small 3 + small 3 + medium 6 |
| 6 | **Quick access widgets** | act immediately | 4 cols |
| 7 | **Quarterly goals** · **Recent activity + Quick Capture** | where am I / what changed | 4 cols each |
| 8 | **Premed roadmap** (milestone cards on a horizontal spine) | where am I (long view) | full width, short |

**Order is deliberate:** Smart next actions sits directly under the hero, and **Tasks is the first substantial working surface** — intelligence first, then the work.

**Removed from the current build:** the large MCAT card and all QOTD instances (MCAT is a stat tile + a domain row); AtAGlance is absorbed into Where I stand + the stat tiles; **the "Needs attention" strip is removed entirely** (§6.2).

---

## 6. Widget Specifications

### 6.1 Hero

Keep the current hero, including the themed banner. Contract:

- Left: date + live clock; greeting ("Good to see you again, {firstName}"); a **countdown chip** to the current event's end or the next event's start (existing `normalizeTimedEvents` logic). The mascot is **not** a floating hero bubble — it appears as a small illustration inside the structured **"Your Plan"** card below (per shell §14.4): clean, purposeful, delivering the plan message rather than floating decoratively.
- Right: **today's schedule** — the timeline strip of timed events with the now-marker (existing).
- The themed image (Ghibli/Doraemon per `visualTheme`) stays. It is brand, not a widget, and is exempt from the "actionable over decorative" rule.
- The schedule's **Connect** control (calendar source) stays; when no calendar is connected, show a single quiet prompt, not an error.
- Hero is read-only except the Connect affordance. No records are created here.

### 6.2 Needs attention — REMOVED (locked)

The standalone attention strip is **cut from Overview**. It duplicated what Tasks already shows, and duplication on the landing page is worse than a missing glance.

Urgency is expressed where the user can act on it instead:

- **On the task rows themselves** — an overdue/due chip on the row (`overdue`, `today`, `9d`), colored by severity (§6.4).
- **In Smart next actions** — a blocking/urgent item that isn't a task surfaces as an explained recommendation (§6.3), which is where the deterministic engine already ranks it.
- **In the shell's Attention bell** (`00-product-shell` §7.5) — still the **full** list, unchanged. Nothing is lost; Home simply stops mirroring it.

**Known gap (accepted):** deadlines that are not tasks (an exam date, AMCAS opening) have no dedicated Home strip. They surface via the hero's schedule and **the bell, which is the app's only cross-cutting deadline surface** (shell §2.2, Aug 2026). Do **not** reintroduce a strip to cover this. **Roadmap cards are no longer part of the answer** — Timeline's scope is four years, and a term-scoped date does not belong on it.

### 6.3 Smart next actions *(new — Atlas Intelligence)*

The widget that makes Overview *intelligent* rather than a tracker. Surfaces **1–3** rules-based, **explainable** recommendations (per `02` Recommendation Architecture and `general.md` smart recommendations).

- Each card: the recommendation, a one-line **why it appeared**, and a primary action.
- Examples (rules-based, v1): "Letter #2 requested 41 days ago, no reply — follow up" → Letters; "Clinical hours haven't updated in 5 weeks — log recent shifts" → Quick Add hours; "PS draft 2 untouched 3 weeks, target date 90 days out" → Essays.
- Every recommendation **must** state its reason. No unexplained suggestions (`02` explainability; `00-vision` "explain every recommendation").
- Actions: primary (act), and **dismiss** (with the recommendation entering suppression per `02` — a dismissed rec should not immediately reappear).
- Ranking by impact/urgency, capped at 3 to protect attention (`02` avoiding alert fatigue).
- Placement: **high, directly under Needs attention** — the intelligence promise should be visible on landing.
- Empty state: if no recommendation clears the threshold, the widget hides. Never manufacture a recommendation to fill space (`00-vision` non-goal: "generate content merely to appear intelligent").
- **Dismissal behavior (locked).** Dismissing a card animates it out (fade + height collapse, ~200ms, `AnimatePresence`) and the remaining cards reflow up. **When the last card is dismissed the entire widget unmounts** and the bento grid closes the gap — there is never an empty "Smart next actions" shell. Dismissals feed `06` suppression so the same recommendation does not immediately return.
- Placement in the bento: **full-width, directly under the hero, above Tasks** — the intelligence promise is the first thing under the fold-line.
- **v1 fallback:** these are deterministic rules initially. The widget's contract does not change when Atlas later supplies richer recommendations — same card shape, same explain-line.

### 6.4 Tasks — Now / Soon / Done tabs, drag-to-reorder, star-to-prioritize

The "what should I work on" core, the **first substantial working surface on the page**, and the primary home of the hybrid inline model. Rendered as a **tall bento panel (7 cols)**.

**Structure — tabs, not columns or stacked bands (locked).**

- Three **tabs**: **Now · Soon · Done**, each with a live count. Solid segmented control (`Tabs`, de-glassed per `04` §0c — solid track, solid raised active pill).
- Checking a task's checkbox **completes it** → it animates out of Now/Soon and lands in **Done**. Done is a *tab*, not a column, and it is the completion archive (not a planning horizon).
- **There is no "Later" tab, and no other page holds one** (revised Aug 2026). An earlier line sent later-horizon work to Timeline; **Timeline is a four-year roadmap and never lists tasks.** A task with a distant date simply sits in `Soon` until it is not distant. The horizon problem was imaginary: `/overview/tasks` (§ below) already gives the long list room.
- **Drag reorders within the current tab only** (`Reorder`, grip handle on the left). Dragging never changes tab — moving between horizons is done via the context menu ("Move to Soon"). This removes the check-vs-drag ambiguity: **checkbox = complete, grip = reorder.**

**Important (star) — the single prioritization concept (locked).**

- A **star** toggle on each row marks a task **important**. Starred tasks collect into a pinned **"Important"** group at the top of the tab, above an **"Everything else"** group; important rows carry a warm accent left-border. Same mental model as Gmail.
- There is **exactly one** prioritization concept. An earlier "Focus"/pinned-focus-strip idea is **removed** — Focus + Important side by side confused which was which. The Important group *is* the focus area. Do not reintroduce a second pin/focus mechanism.
- Star is toggleable inline (click the star) **and** from the context menu (`⌘I`).

**Row anatomy:** grip · checkbox · title · category tag (`Badge`, per-pillar color: MCAT / Academics / Clinical / Letters / Essays…) · due chip (severity-colored: overdue = destructive, today/soon = warning) · star.

**Context menu (right-click a row)** — `Context Menu`, a floating overlay so it keeps full frosted glass (`04` §0c): **Mark important (⌘I)** · **Tag ▸** · **Set due date** · **Move to Soon** · **Duplicate** · **Delete**. Governing rule (also `01` §4b): *the context menu never contains an action that has no visible equivalent elsewhere* — it is a shortcut, never the only path.

- Organize open tasks into **Now / Soon / Done** (per `general.md` planning model). Do not force milestones or passive records into this model.
- **Overview OWNS tasks outright (RULED Aug 2026, Andy).** Both the `Task` entity and every surface. **Timeline does not own tasks**, and an earlier split where it held the model while Overview held the screen is withdrawn: it served no purpose. Andy: *"I don't think it laying in the Timeline makes a lot of sense."* **Timeline keeps the roadmap and nothing else** — deadlines went back to their owners in the same pass (§0).
- **The expand is `/overview/tasks`, a sub-route.** An expand arrow on this widget opens the full-screen list. Andy: *"in the backslash it'll be like Overview\Tasks, so that Tasks lays inside Overview."* **The URL states the ownership.** Precedent: `/academics/classes/:courseId`.
  - **Not a `CenterPeek`** (that is for one record) and **not a sidebar entry** (it is this widget with room, not a cold destination).
  - **One list at two sizes, not two implementations.** Same component, same store, same rules. **If the expanded view ever grows behavior the widget lacks, that is a defect.**
  - **The widget is the product, not a preview of it** (Andy, Aug 2026): *"even though it's a little widget on the Overview, it should be fully functional, and if you want to expand it, then you expand it in Overview."* **Full functionality is defined by `TaskItem`'s own fields** — if the model carries it, the user can edit it. **Title, due date, category, notes, and attachment all edit from the widget**; `notes` and `fileUrl` open in a `CenterPeek` because they cannot fit a row at *either* size, which is why the peek is not an exception to the rule. Field-by-field parity table in `implementation/briefs/S6-tasks-to-overview.md` §2a.
  - **Known gap as of Aug 2026:** none of that is built. A task's **title cannot be renamed anywhere in the app**, its due date has no editor, and `notes`/`fileUrl` have no surface at all. The seven "edit" affordances on the widget navigate to `/timeline`, **which cannot do those things either.** Tracked as S6.
  - **All it adds is room** to filter and search a long list. `Done` is already the archive and Settings holds the global one, so *"find what I did four months ago"* was answered before this existed.
- **Roadmap steps flow in automatically (RULED Aug 2026, Andy).** A Timeline node's checklist items typed `step` (actionable) appear in **`Soon`**; items typed `note` (guidance, *"keep in mind…"*) never do. **This is `one record, two doors`, not a second owner:** the record stays Timeline's, Overview reads it, and ticking it in either place ticks it in both. **The list is a union computed at read time — never a write into `tasks`.** Steps render distinguishably from general to-dos and link back to their node. **Only the current node's steps flow** (~25 nodes × ~5 steps would bury the week's real work), and **a step cannot be deleted here** — complete or dismiss only, since deleting would damage the roadmap. Full ruling in `tabs/11-timeline-tasks.md`.
- **General to-dos only — never assignments.** This widget shows general/personal/application workflow tasks. **Assignments** (course-linked academic deliverables) are owned by Academics and live on the **Academics → Assignments** page; they never appear in this widget. The two are distinct lists with distinct owners: Home = your general to-do list; Assignments = coursework, on its own page. *(An assignment's due date may still surface in the attention strip/bell — attention is "what's due," not the to-do list — but the assignment record itself is never listed here.)*
- **Inline actions permitted:** check off / complete a task; create a task via the header `＋ Add task` button. Creating here makes a general task, never an assignment.
- **Routes out:** opening a task, editing its details, changing type or due date → **`/overview/tasks`** (revised Aug 2026 — Overview is the owning page now, so this "routes out" to its own sub-route, not to another tab).
- Starred/important tasks pin to the top group (see above). No separate focus strip.
- Completing a task shows a toast with Undo (per `01` undo standards).
- Replaces the current Today/All toggle with the Now/Soon/Done tab set; keep it compact (cap visible rows per tab, **"+N more →" to `/overview/tasks`**).
- **Task creation is a regular `＋ Add task` button in the panel header** (⭐ RULED Aug 2026, Andy — supersedes the inline quick-add row this line used to specify). It opens the standard create form. **The inline "type and hit enter" row is removed**; it is not a second path and must not be reintroduced alongside the button. Mockup: `mockups/03-overview/overview-s3-target.html`.

### 6.5 Where I stand (Domains)

The honest-status answer to "where am I." Replaces AtAGlance and the MCAT card. Rendered as a **tall bento panel (5 cols)** beside Tasks.

**Compact but information-dense (locked).** An earlier pass compacted this into bare dot + number rows and lost the pace feedback — that was wrong. The *feedback* ("on track", "on pace", "behind", "1 overdue") is the point of the block. Keep every row to a **single compact line** that still carries all four parts:

`accent chip · domain name · value against goal (e.g. 80/150 hrs) · mini progress bar · pace chip`

- Group headers (Foundation / Experiences / Application) are thin inline dividers, not section cards.
- The card header carries a one-line summary of the exceptions: *"1 behind · 1 at risk."*
- All nine domains fit in roughly the height five uncompacted rows used to take.
- Pace-chip vocabulary: `on track` · `on pace` · `behind` · `at risk` / `63d out` · `1 overdue` · `no goal` (neutral when no standing target exists). Colors map to the attention severity scale (success / warning / destructive / neutral).

- One row per domain, **grouped by sidebar group**: **Foundation** (Academics, MCAT), **Experiences** (Clinical, Volunteering, Shadowing, Research, Extracurriculars), **Application** (School List, Essays, Letters). Three short labeled clusters mirroring the nav.
- **Rows expand to show where the number came from** (added Aug 2026). The collapsed row answers *how much*; the chevron answers *from where*. **Mockup:** `mockups/03-overview/overview-where-i-stand-expandable.html`.
  - **Two targets in one row.** The chevron expands in place. The row body still opens the domain page, which is the behaviour above and must not be lost.
  - **One row open at a time.** This is a tall 5-col bento cell holding nine rows; several open at once grows unbounded, which `01` §5c forbids.
  - **Capped at three positions**, then `+N more` to the pillar page. The panel answers *from where*, not *show me everything*.
  - **Three link levels, broad to specific:** row body → the pillar page · position row → **that record's inspector, deep-linked** · an org named in an attribution line → **the other pillar's record**. Position rows are not titles; someone expands Clinical to check a position, and landing them on the pillar page makes them hunt for it.
  - **Each position carries its own state** — active, ended, or **estimated**. An estimated backfill block is visually distinct because it never feeds weekly pace.
  - **Each pillar expands into its own vocabulary.** Shadowing lists physicians. Extracurriculars lists roles and dates with **no hours column at all**. Expansion reveals; it never computes a metric the collapsed row did not already have, and it never adds judgment — the pace chip stays on the collapsed row.
  - **The cross-link attribution line lives here** and nowhere else: *"64h come from Carolina Health Access, which is also one of your student organizations. Counted here, once."* This is the single place hour ownership (`tabs/03-clinical.md` §2.0) speaks unprompted. The org name **must be a link**, because naming a relationship without a way to follow it is worse than not mentioning it.
- **Honest state per domain** (per `04` — each domain's own meaningful metric; never a universal readiness score, never invented percentages):

  | Domain | State (always shown) | Optional goal → pace |
  |---|---|---|
  | Academics | `3.82 cum · 3.71 sci` | target GPA (usually none — deterministic) |
  | MCAT | `Content phase · best FL 508 · exam in 180d` | target score |
  | Clinical | `124 hrs · active` | target hours → pace |
  | Volunteering | `80 hrs · 2 orgs` | target hours → pace |
  | Shadowing | `40 hrs · 4 specialties` | target hours → pace |
  | Research | `1 project · poster stage` | milestone (no hours goal) |
  | Extracurriculars | `3 roles · 1 leadership` | none — never hours (`04` rule) |
  | Essays | `PS draft 2 · 3/12 secondaries` | # secondaries → pace |
  | Letters | `2/4 received` | progress inherent in the count |
  | School List | `12 schools · 4 reach` | balance, not a bar |

- **No normalized bars unless the user set the goal.** A pace chip appears only when a standing target exists for that domain (§6.6). Count domains (Letters, School List) carry inherent progress; qualitative domains (Research stage, ECs) stay as labels.
- Empty domain: "Not started — add your first {X}" linking into the page.
- This block is read-only; all rows route out.

### 6.5a Stat tiles — every quantitative thing becomes a graphic *(new)*

The GPA tracker is **not** absorbed into a domain row. Home carries a small set of **varied-size stat tiles** that turn each quantitative dimension into a graphic. This is the "control panel" texture — different shapes, not repeated rectangles.

| Tile | Span | Content |
|---|---|---|
| **GPA** | small (3 col) | Cumulative in bold Baloo + delta chip (`▲ +0.06 this term`), a **term-by-term trend line** (science GPA as a second dashed series), footer `Science 3.68 · 6 terms` |
| **MCAT** | small (3 col) | **Ring gauge** — best practice score against target (`511 of 515`) + questions completed |
| **Hours** | medium (6 col) | One **comparative bar per category** — **Clinical, Volunteering, and Research only** — with exact totals. **Shadowing and Extracurriculars are excluded** (corrected Aug 2026): drawing hour bars for them contradicts their own specs, where Shadowing's metric is specialties covered (`tabs/05-shadowing.md` §2.2) and Extracurriculars never centers hours (`tabs/07-extracurriculars.md` §2.1). A tile that renders bars those pillars forbid makes the app contradict itself. |

Rules: values are **exact** and read from computed selectors (`06`) — never estimated, never distorted by animation (`04` §7a). Tiles deep-link to their owning tab (GPA → Academics, ring → MCAT). Tiles carry **no** pace judgment — that's Where I stand's job; these are the numbers themselves.

### 6.5b Quick access widgets *(new)*

A 4-col panel of **one-click launchers** into the most urgent/functional things, so Overview is a place you *act from*, not only read. Each: icon chip (per-pillar color) · title · one-line live subtitle.

Confirmed set: **Start MCAT block** (launches a timed focus session — subtitle names the next section + length) · **Review session** (FSRS-due count from Academics Class Center) · **Drop into Atlas** (file / link / note — the Quick Capture affordance, §6.9) · **Log hours** (subtitle = last log, e.g. "Last: 4h Tuesday").

Extensible candidates (add as their tabs land): resume a paused focus session · new reflection → Story Bank · GPA what-if · add a school · next letter follow-up · secondary pre-write · capture from clipboard.

Rules: a widget appears only when its target exists and is meaningful (no dead launchers); each is a single click to the *thing itself*, never to a landing page; live counts come from `06` selectors.

### 6.6 Quarterly goals

The **sprint** half of a two-horizon goal system. Not redundant with domain pace — a different time horizon.

- **Standing domain goal** = the long finish line (e.g., "150 clinical hrs by application"). Lives as the pace chip on the domain row (§6.5).
- **Quarterly goal** = this quarter's push (e.g., "+40 clinical hrs, finish PS draft 1"). A quarterly goal may **reference a standing target**: "+40 clinical hrs *(toward your 150)*."
- The domain row shows lifetime pace; this widget shows this-quarter progress. One linked system at two zoom levels — never duplicated.
- This widget is where standing domain targets are **set/edited** (the goal-setting surface that feeds §6.5's pace chips).
- Goals can also be free-form (not every goal maps to a domain): "read 3 papers."
- Inline: check off a completed quarterly goal. Editing/creating goals opens a goal editor (drawer or dedicated view — pattern per `01`).

### 6.7 Premed roadmap

The strategic pacing layer — a sense of direction that keeps the user *ahead of the herd*, not a list of tips.

- **Milestones, not activities.** Every roadmap item is a discrete, checkable thing you *do or complete at a moment* — "request LORs," "register for the MCAT," "submit primary," "draft PS." Continuous background states — "take classes," "protect GPA," "study all semester" — are **not** roadmap items (they're ongoing, not completable). Litmus: if you can't check it off at a point in time, it doesn't belong here. *(This purges the current hardcoded `ROADMAP`, which mixes real milestones with vague ongoing stages like "Foundation / protect GPA.")*
- **Ahead-of-conventional timing.** Each milestone's recommended target is intentionally **earlier** than standard advice — the roadmap's job is to pace the user ahead, not on-schedule.
- **Personalized from onboarding/Profile.** The milestone set and timing derive from the user's path and dates — `track`, `startTerm`, `matriculationTarget`, `applicationCycle` (Profile fields, populated by onboarding). A gap-year applicant's pacing differs from a no-gap one. No hardcoded constant.
- **Milestones can spawn a task.** The roadmap is direction on top; the task is action underneath. When a milestone comes due, the user can turn it into a real task — linked, never duplicated. The milestone tracks *whether the pacing point is met*; the task tracks *the work*. **The task lands in Overview's own store** (§0, revised Aug 2026), which makes this simpler than it was: the spawning surface and the receiving surface are the same page.
- **Atlas-grounded (phased).** Long-term, the milestone set and their ahead-of-herd timing come from **Atlas knowledge** — authoritative roadmap sources the user uploads (videos, guides) processed into the knowledge base. **v1 ships a sensible general default** roadmap (by path/cycle); the Atlas hook is reserved so the roadmap gets smarter and source-grounded once Atlas↔HQ is wired (same phased posture as Quick Capture's connection slot). See `specifications/02-atlas-interface-and-knowledge-map.md`.
- **Linear spine, branching depth.** The roadmap is *linear on the surface, a graph underneath.* At the macro level it's an ordered pacing **timeline** (the spine). But diving into any milestone **branches out Obsidian/mind-map style** into a network — sub-steps, dependencies, required pieces, linked Atlas knowledge, and the user's own HQ records/tasks — and those branches lead to further branches. This is the **local-neighborhood pattern** from the Atlas graph model (`02` §graph): the roadmap is a *time-ordered lens* over a slice of the branching knowledge-and-action network, sharing the same graph substrate as Atlas.
- **Rendering on Overview — horizontal spine of milestone cards (locked).** Full-width, short bento panel at the **bottom** of the page. The spine runs left→right with a progress line behind it (completed segment in success color, current in primary, future in neutral border). Each milestone is a **card on the spine**, not a bare label:
  - dot on the line (check icon when done; current dot is primary with a soft ring),
  - **label** (`Draft personal statement`), **target date** (`Target · Aug 15`), and a **detail line** (`Draft 2 of 3 · 22 days left`, `3 of 4 sent`, `12 schools`),
  - the current milestone card is **raised** — solid card background, primary border, "You are here" eyebrow, plus its branch chip (`3 sub-steps`),
  - completed cards recede (reduced opacity).
  *(A full-height vertical spine was explored and rejected — it fought the page's horizontal rhythm. Keep the depth and per-milestone detail, lay it horizontally.)*
  **Note (Aug 2026): the Timeline tab's spine IS vertical** (`mockups/11-timeline/timeline-spine.html`, approved). **That is deliberate, not drift** — four years at full depth does not fit a horizontal rhythm, while a bento panel does not fit a vertical one. **Two jobs, two axes. Do not reconcile them.**
- **Three zoom levels of one dataset (stateless views per `01`).** (1) **Overview** renders just the compact **spine** — a glance, "am I on pace." (2) The **Timeline tab** hosts the **full roadmap** — the "cycle as a graphic": every node laid out across four years, each one openable to its steps and guidance, **with earned achievements on the same spine** (`11-timeline-tasks.md`). *(Revised Aug 2026: this used to say milestones were "wired to actual tasks/deadlines." They are not — tasks are Overview's and deadlines belong to their owners.)* (3) The **Atlas tab** holds the **deep branching graph** the milestones are grounded in. Home stays a glance and routes to the Timeline tab to open the roadmap up; deep graph exploration is Atlas. The branching depth is the phase-2, Atlas-wired capability; v1's spine + Timeline view are buildable now.
- **Data:** roadmap nodes are **owned by Timeline** (`tabs/11-timeline-tasks.md`). Overview and the Timeline tab are two projections of one node set. **The current code models a milestone as `TaskItem.milestone === true`, and that is now wrong on both ends** — tasks moved to Overview, and a node grew real content (steps, guidance, achievements). **A node is its own entity, not a flagged task.** Migration tracked in `implementation/deferred.md`.
- **Achievements ride the same spine** (`11-timeline-tasks.md` § Achievements): prescribed nodes point forward, earned achievements sit at their real dates. **Overview's compact spine may show the current node and the most recent achievement, and nothing more** — the full two-type line is the Timeline tab's job, not a bento panel's.
- Each milestone links to the relevant page; completing/scheduling one (and, later, expanding its branch) is the interaction here.

### 6.8 Recent activity

- Compact "what's changed" — last few logged actions (existing `logActivity` stream).
- Read-only; each entry links to the related record where possible.

### 6.9 Quick Capture *(Atlas Import surface)*

One low-friction box that feeds Atlas. This is Overview's **only** Atlas touchpoint (per the design decision: on Home you *feed* Atlas; in the Atlas tab you *work* Atlas).

- **Fused input:** typing a thought creates an **idea**; pasting a URL or dropping a file/screenshot creates a **source**. One box, one habit.
- Both flow into **Atlas** for processing; **triage, promotion, and the knowledge graph live in the Atlas tab**, not here.
- Home shows only: the capture box + a count ("7 unsorted") linking into Atlas. No sorting on Home.
- **Reserved connection slot:** the widget reserves space for a future "connections" peek (what a captured idea linked to). It stays dark until Atlas↔HQ integration is live, then lights up with no redesign (mirrors `00-product-shell` §7.8 reserved-slot posture).
- Provenance: a captured idea later promoted (in Atlas) to a Task/Story/Experience-lead carries a link back to its origin (capture-once-reuse-everywhere).
- Trust boundary: ideas (personal, unverified) and sources (external, to be cited) are distinct types from creation. Never merged into one undifferentiated note (`02` citation/traceability).

---

## 6a. Components used (block → library component)

Explicit traceability (from `implementation/component-inventory.md`); motion from the shared system (`04` §7a). Overview owns nothing — components render read-only projections plus the permitted inline actions (§1).

**Build rule:** every block below is built from the named library component. The visual reference (`mockups/03-overview/overview-bento-control-panel.html`) shows the *target appearance* of these components composed together — match its layout and density, but the implementation is library components + real data, never the mockup's static markup.

| Block / feature | Component(s) |
|---|---|
| Hero — schedule timeline | `HeroDailySchedule` |
| Hero — greeting + live clock | text (polite live update, §10) |
| Hero — countdown chip | **Number Flow** / `Badge` |
| Hero — themed banner | brand image (Ghibli/Doraemon; exempt from actionable rule) |
| Hero — mascot | illustration inside the "Your Plan" card (shell §14.4) |
| Hero — Connect calendar | `Smooth Button` (quiet prompt when none) |
| Needs attention strip | **REMOVED** (§6.2) — urgency lives on task rows (`Badge`), in Smart next actions, and in the shell bell |
| Bento grid shell | CSS grid (12-col, mixed spans per §5) inside the shell container; panels are `Card` (**solid `variant="default"`** — glass only on floating surfaces, `04` §0c) |
| Smart next actions (≤3, explainable) | `Card` + explain-line + `Smooth Button` (act) + `Smooth Button` ghost (dismiss) → suppression (`06`); **`AnimatePresence`** for per-card exit **and whole-widget unmount when the last is dismissed** (§6.3) |
| Tasks — panel | `Card` (tall, 7 col) |
| Tasks — Now/Soon/Done tabs + counts | **`Tabs`** (Animated Tabs; solid segmented per `04` §0c) + `Badge` (count) |
| Tasks — reorder within a tab | **`Reorder`** (Motion) with grip handle; drag never crosses tabs |
| Tasks — check off → Done tab | `Checkbox` + **`AnimatePresence`** (exit/land) + `Sonner` (undo toast) |
| Tasks — star / important + "Important" group | `Toggle` (star icon, lucide) + grouped list; group header + accent left-border on row |
| Tasks — right-click actions | **`Context Menu`** (floating → keeps frosted glass) — Mark important ⌘I · Tag ▸ (submenu) · Set due date (`Calendar`/`DateField`) · Move to Soon · Duplicate · Delete (`Alert Dialog` if destructive-with-deps) |
| Tasks — category tag · due chip | `Badge` (per-pillar `--cat-*`) · `Badge` (severity color) |
| Tasks — create | header `Button` → the standard create form (**revised Aug 2026** — was an inline `Input`) |
| Tasks — "+N more →" | link → Timeline |
| Where I stand — compact rows (grouped) | list rows → links; mobile groups `Accordion`/`Collapsible` |
| Where I stand — value + mini bar | **Number Flow** (exact values) + **Animated Progress Bar** (thin spine) |
| Where I stand — pace chip | `Animated Tags`/`Badge` (success / warning / destructive / neutral) |
| Where I stand — header exception summary | `Badge`/text ("1 behind · 1 at risk") |
| Stat tile — GPA trend | **Chart** (shadcn/Recharts Line+Area, `--chart-*`) + **Number Flow** + `Badge` (delta) |
| Stat tile — MCAT ring | **Chart** (Radial) or ring gauge + **Number Flow** |
| Stat tile — hours bars | **Animated Progress Bar** ×N + **Number Flow** |
| Quick access widgets | `Card` + icon chip (lucide) + `Smooth Button` behavior; **Animated File Upload** for "Drop into Atlas"; live counts from `06` |
| Quarterly goals — list + check off | list + `Checkbox` |
| Quarterly goals — progress | **Animated Progress Bar** |
| Quarterly goals — set/edit target + editor | `CenterPeek` + `ObjectInspector` (§12.3) + form (`Input`) |
| Premed roadmap — horizontal spine + milestone cards | spine line + `Card` per milestone (raised variant for current) + `Badge` (date, detail, branch chip); `whileInView` reveal (`04` §7a) |
| Premed roadmap — complete/schedule milestone | `Checkbox` + link → Timeline; branch depth = Atlas (`AI Branch`, deferred) |
| Recent activity | activity list → links (from `logActivity`) |
| Quick Capture — fused input (thought/link/file) | `Textarea`/`Input` + **Animated File Upload** (file/screenshot) + **Preview Link Card** (URL) |
| Quick Capture — unsorted count → Atlas | `Badge` + link |
| Quick Capture — idea vs source types | `Animated Tags` (trust separation) |
| Quick Capture — reserved connection slot | inert placeholder (`AI Branch`, deferred) |
| Empty / loading / error | `EmptyState` · **Skeleton** (Shimmer) · `CollectionState` · `AppErrorBoundary` |

## 7. Layout & Responsive

**Desktop — 12-column bento (per §5).** Hero full-width → Smart next actions full-width (3 across) → **Tasks (7 col, tall) + Where I stand (5 col, tall)** side by side → stat tiles (3 / 3 / 6) → Quick access (4) + Quarterly goals (4) + Recent activity & Quick Capture (4) → roadmap full-width. Panels have **deliberately different heights and widths** — a uniform grid of same-size rectangles is a defect (§5). Content stays within the shell container.

- Tablet: collapse to 6-col; Tasks and Where I stand become full-width stacked; stat tiles go 2-up.
- Mobile: full single column, ordered by question priority — Hero → Smart actions → Tasks → Where I stand → stat tiles → Quick access → the rest. Quick Capture is reachable without scrolling past everything (consider a sticky capture affordance or keep it high on mobile).
- Domains block on mobile: groups collapse to headers with counts, expandable.

---

## 8. Intelligence Touchpoints (per `02`)

- **Smart next actions** (§6.3) is the visible surface: explainable, ranked, suppressible, capped.
- **Domain pace and quarterly tracking** are deterministic derivations (`01` derived properties) — not probabilistic, shown as fact.
- **Atlas Intelligence** (invisible) may inform which recommendations surface, but the shell/Overview add no "AI" ornamentation (`00-product-shell` §7.8). The user should not feel they are "using Atlas" on Home.

---

## 9. Empty, Loading, Error States

- **New user (no data):** hero shows greeting + connect-calendar prompt; Domains show all "Not started" rows (this is the onboarding surface — the empty domains *are* the to-do list); Smart actions may show one setup nudge; Tasks empty band invites the first task; Quick Capture invites the first idea/source.
- **Loading:** shell-standard skeletons per widget (`01` loading standards); never a full-page spinner.
- **Error in one widget:** that widget shows an inline retry and the rest of the page survives (`AppErrorBoundary`; a widget failure must not blank Home).

---

## 10. Accessibility

- Each block is a labeled `region` with a heading; heading text states the question it answers where natural.
- Domains block is a list; each row is a link with an accessible name combining domain + state ("Clinical, 124 hours, active").
- Smart-action cards: the explain-line is part of the accessible description, not `aria-hidden`.
- Countdown/live clock update politely (do not spam screen readers every second — announce on meaningful change only).
- Full keyboard operability for the three inline actions; visible focus rings (shell pattern).
- Color never the sole signal for pace/urgency — pair with text/shape.

---

## 11. Acceptance Criteria

- [ ] Overview renders the **eight blocks of §5** as a **bento grid of mixed-size panels** (never a stack of equal full-width rectangles), in the §5 order — Smart next actions directly under the hero, **Tasks as the first substantial working surface**. MCAT appears only as a stat tile + domain row; **no QOTD anywhere**.
- [ ] **No "Needs attention" strip exists** (§6.2). Urgency appears as severity chips on task rows, inside Smart next actions, and in the shell bell — never as a separate Home strip.
- [ ] Only the permitted inline actions write data; every other action deep-links to the owning page.
- [ ] **Where I stand** shows honest per-domain state per §6.5 in compact single-line rows that still carry value-against-goal + mini bar + **pace chip**, grouped Foundation/Experiences/Application, with pace chips **only** where a standing goal exists — no invented percentages.
- [ ] Smart next actions shows ≤3 recommendations, each with a visible reason and a primary action; dismissed recommendations enter suppression; **the whole widget unmounts when the last is dismissed** and the grid closes the gap.
- [ ] **Tasks use Now / Soon / Done tabs** (Done = completion archive, not a planning horizon). Drag (`Reorder`) reorders **within a tab only**; checkbox completes → animates to Done with undo; **star/important is the only prioritization concept** (pinned "Important" group — no separate Focus strip); right-click menu per `01` §4c; **a `＋ Add task` button sits in the panel header and no inline quick-add row exists**.
- [ ] **Stat tiles** (§6.5a) render GPA trend, MCAT ring, and hours bars from computed selectors with exact values; **Quick access** (§6.5b) launchers appear only when their target exists.
- [ ] **Roadmap** renders as a horizontal spine of **milestone cards** (label · target date · detail line), current milestone raised with "You are here". Built from existing milestone records + Profile cycle/path; **if no milestones exist, show an empty setup state — never hardcoded dates**.
- [ ] Quarterly goals set standing domain targets; a quarterly goal can reference a standing target; domain pace reflects the target.
- [ ] Quick Capture accepts a thought (→ idea) or a link/file (→ source), both routed to Atlas, with an unsorted count linking into the Atlas tab; triage does **not** happen on Home; a reserved connection slot exists but is inert until Atlas integration.
- [ ] **Pacing/projections** follow `01` §4d — max one per panel, dismissible, collapsing to a "Show projection" pill; **where there is not enough data to compute a rate, show an honest "not enough graded work yet" state — never a fabricated percentage or projection.**
- [ ] Verified in light + dark, desktop + mobile, keyboard-only, reduced-motion.

---

## 12. Open Decisions

1. **Roadmap data source** — RESOLVED (July 2026): derives from Profile fields (`track`, `startTerm`, `matriculationTarget`, `applicationCycle`), which onboarding later populates and personalizes per path. No hardcoded constant. See §6.7.
2. **Roadmap model** — RESOLVED: milestones (not activities), ahead-of-herd timing, linear spine + branching graph on dive-in, milestones can spawn tasks, Atlas-grounded content (phased). See §6.7.
3. **Quarterly goal editor surface** — RESOLVED (July 2026): edit via the shared **center-peek** pattern (`01-shared-interface-patterns` §2.1), not a bespoke inline drawer or a dedicated view. The goal is a record like any other; opening it uses the same peek every entity uses — no one-off editor surface.
4. **Mobile Quick Capture** — RESOLVED (July 2026): placed **high in the normal page flow**, not as a sticky overlay. A persistent floating affordance competes with the shell's own controls and covers content on small screens.
6. **Mascot placement** — RESOLVED (July 2026): the single mascot lives inside a compact **"Your Plan" header within the Roadmap block** (the roadmap *is* the plan). The hero's floating mascot nudge is **removed** — structured, not floating (shell §14.4).
5. **Connection peek + roadmap branching** activation depends on Atlas↔HQ integration timeline (see Atlas spec).

---

## 13. Do Not

- Do not re-add QOTD or a dedicated MCAT hero card.
- Do not add a fourth inline action without justifying it against §1.
- Do not render normalized progress bars for domains without a user-set goal.
- Do not put idea triage, the knowledge graph, or Atlas exploration on Overview — those belong in the Atlas tab.
- Do not manufacture recommendations to fill the Smart actions widget.

---

## ⭐ ADDED Aug 2026 — the capture box (`SB-64`)

**Cross-tab change, originating in `tabs/09-essays-story-bank-feature-catalog.md` Wave 6.** **Recorded here because Overview was already specced and this adds a surface to it.**

> **Andy:** *"I have this thing where it's kind of like **diary entries, but it's kind of a brain dump.** **Any time I have an input in Overview, we can actually put it in, and it should sync to Story Bank.**"*
>
> *"Every time I have a thought, I just open Voice Memos and voice my thoughts. It could be medicine-related, or **it could just be about life.** … **Some things make a thought that's potentially life-changing. If they don't document it, they just forget it the next day, so it's kind of useless.**"*

### What it is

**One text box on Overview. You type or paste a thought. It lands in Story Bank immediately.**

| | |
|---|---|
| **Untyped** | **No theme, no pillar, no title required** (`SB-66`). **A capture that asks questions is a capture nobody uses** |
| **No inbox** | **It lands in the bank, not a triage queue** (`SB-65`). **A triage step is the `sentToStoryBank` gate returning under a new name** |
| **≤5 seconds** | **The strictest instance of the rule in the app.** **The bar is Voice Memos: open, talk, done** (`SB-68`) |
| **Paste, not dictate** | **`SB-67`.** **HQ builds no voice capture and no transcription** (`implementation/integration-map.md` §1). **Andy's real workflow is Voice Memos → paste, which CONFIRMS the dictation ruling rather than breaking it** |

### ⚠️ Guards

- **It is not a to-do box.** **Overview already owns Smart next actions; this is unstructured thought and must not be confused with a task** (`U-7` — not a tracker).
- **No streak, no daily prompt, no *"you haven't journalled today."*** **`U-9`, and `U-12`** — the moment HQ adds a streak it is competing with Day One and losing.
- **⚠️ Most entries will never be used, and that is correct** (`SB-70`). **No "unused thought" nudge.**
- **⚠️ Entries may be deeply personal.** **`SB-73` per-entry *keep local, never send* applies from the capture box onward.** **See `tabs/09-essays-story-bank.md` §6.**
- **⚠️ ONE hero graphic per view** (`CLAUDE.md`). **The capture box is a control, not a hero. It does not displace the bento.**

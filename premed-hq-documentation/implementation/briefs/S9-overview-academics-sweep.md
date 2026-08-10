# S9 — Overview + Academics & GPA conformance sweep

**Type:** read-only audit. Nothing in `src/` was changed.
**Date:** Aug 8 2026.
**Scope:** the 14 `Build? = YES` rows in `implementation/briefs/BUILD-MANIFEST.md`
(Overview + Academics & GPA), **Variant A only**, read from
`specifications/mockups/`. Code audited is `src/` at the repo root;
`premed-hq/` was not opened.

**Read order followed:** `CLAUDE.md` → `AGENT-IMPLEMENTATION-GUIDE.md` →
`04-visual-craft-standards.md` §0/§0a/§0b/§0c → `BUILD-MANIFEST.md` →
`component-inventory.md` → `src/index.css` → `03-overview.md` → `tabs/01-academics.md`.

---

## 0. Two things to record before the findings

**A. Uncommitted WIP is present in the working tree.** `CLAUDE.md` §Standing
MUST-NOT-CHANGE says to stop and flag it. Flagging it here rather than blocking,
because **nothing under `src/` is dirty** — the audit reads only committed code:

| Path | State |
|---|---|
| `CLAUDE.md` | modified — adds the SOURCE OF TRUTH block + research convention |
| `.github/workflows/deploy.yml` | modified — injects `VITE_SUPABASE_*` from repo Secrets at build |
| `premed-hq-documentation/` | untracked (the entire spec folder) |
| `mockup-lab/`, `Atlas/`, `Design-System/pillars/`, `premed-hq/.claude/`, `ziXi8K6N`, `spec/unc_schedule_options_no_8am.png`, `premed-hq-mockup-variant-lab-*.zip` | untracked |
| `.DS_Store`, `spec/.DS_Store` | modified |

The deploy.yml change is the one worth a second look — it is a real behaviour
change to the published site and is not obviously this session's work.

**B. The manifest's own prose is off by two.** The CLEARED note says *"12 rows are
`YES`"*; the table actually carries **14**. Not fixed here (the brief forbids
editing the manifest), but the count should be reconciled so the next reader
does not assume two rows were cleared by mistake.

---

## 1. COVERAGE

Verdicts are per **product view**, not per file. "Variant A" is assumed
throughout per manifest §"When a row flips to `YES`".

### Overview

| Mockup · view | Implementing file(s) | Verdict |
|---|---|---|
| `overview-bento-control-panel` — Overview | `src/pages/Home.tsx`, `components/overview/OverviewHero.tsx`, `OverviewTasks.tsx`, `OverviewStatus.tsx`, `OverviewSupport.tsx`, `OverviewRoadmap.tsx`, `components/common/SmartActionPanel.tsx` | **CONFORMING** |

The bento order, the column spans (7/5 · 3/3/6 · 4/4/4 · 12), glass-on-hero-only,
Now/Soon/Done as tabs, star-as-the-only-prioritisation-concept, and
dismiss-last-card-unmounts-the-widget all match. This is the reference
implementation of §0c in the repo.

### Shared patterns

| Mockup · view | Implementing file(s) | Verdict |
|---|---|---|
| `nav-hierarchy-3-levels` — 3-level nav (Option A) | `pages/Academics.tsx:157–219`, `components/common/ModeSwitch.tsx`, `index.css:416–449`, `academics/ClassCenter.tsx:419–447` | **PARTIAL** |
| `mascot-note-pattern` — MascotNote | `components/common/MascotNote.tsx` | **PARTIAL** |

Both are approved *patterns*. Both are implemented correctly and then bypassed
elsewhere — see §3.

### Academics · Daily

| Mockup · view | Implementing file(s) | Verdict |
|---|---|---|
| `academics-daily-main-page` — Class Center | `academics/ClassCenter.tsx:324–596` (shell) + `758–1214` (bento) | **PARTIAL** |
| `academics-assignments` — Agenda | `common/AssignmentsPanel.tsx:528–549`, `608–797` | **CONFORMING** |
| `academics-assignments` — Weekly | `common/AssignmentsPanel.tsx:551–560`, `798–882` | **CONFORMING** |
| `academics-assignments` — Calendar | `common/AssignmentsPanel.tsx:562–573`, `883–962` | **CONFORMING** |
| `academics-class-hub` — Overview | `academics/ClassHub.tsx:250–351` | **PARTIAL** |
| `academics-class-hub` — Materials | `academics/ClassHub.tsx:449–495` | **DIVERGENT** |
| `academics-class-hub` — Topics | `academics/ClassHub.tsx:496–535` | **PARTIAL** |
| `academics-class-hub` — Assignments | `academics/ClassHub.tsx:536–562` | **CONFORMING** |
| `academics-class-hub` — Notes | `academics/ClassHub.tsx:563–594` | **PARTIAL** |
| `academics-review-session` — Session start | `pages/AcademicRecallSession.tsx:331–357` | **CONFORMING** |
| `academics-review-session` — Recall | `pages/AcademicRecallSession.tsx:359–401` | **CONFORMING** |
| `academics-review-session` — Gap report | `pages/AcademicRecallSession.tsx:403–439` | **CONFORMING** |
| `academics-empty-states-prototype` — variant A | `academics/ClassCenter.tsx:533–539` | **DIVERGENT** |
| `academics-class-types` — Comparison frame | n/a (documentation frame) | — |
| `academics-class-types` — STEM class | `academics/ClassHub.tsx:69–187` | **PARTIAL** |
| `academics-class-types` — Writing class | none | **NOT BUILT** |
| `academics-exam-prep-mode` — Accelerated (default) | none | **NOT BUILT** |
| `academics-exam-prep-mode` — Steady | none | **NOT BUILT** |
| `academics-exam-prep-mode` — Catch-up state | none | **NOT BUILT** |
| `academics-syllabus-import` — Upload | none | **NOT BUILT** |
| `academics-syllabus-import` — Review before apply | none | **NOT BUILT** |
| `academics-syllabus-import` — Re-import diff | none | **NOT BUILT** |

### Academics · Planning

| Mockup · view | Implementing file(s) | Verdict |
|---|---|---|
| `academics-planner-prototype` — variant A | `pages/Academics.tsx:240–280` | **DIVERGENT** |
| `academics-requirements` — Gap & pace | `pages/Academics.tsx:578–922` | **DIVERGENT** |
| `academics-requirements` — All requirements | `pages/Academics.tsx:794–810` (sidebar `<details>` list) | **PARTIAL** |
| `academics-requirements` — Prior credit | `pages/Academics.tsx:1103–1131` (`ApCreditDialog` only) | **NOT BUILT** |
| `academics-grades-archive` — Ledger | `pages/Academics.tsx:292–296` (`ClassCenter archiveOnly` + ResourceGrid + NotesDB) | **DIVERGENT** |
| `academics-grades-archive` — GPA | `pages/Academics.tsx:246–258` (on the *Planner* tab) | **PARTIAL** |
| `academics-grades-archive` — What-if | `pages/Academics.tsx:395–440` (on the *Planner* tab) | **PARTIAL** |

**Tally:** 8 CONFORMING · 10 PARTIAL · 6 DIVERGENT · 7 NOT BUILT (30 scored views).

---

## 2. DIVERGENCES

Ranked: `04` §0c violations → `04` §0b forks that change what the user sees →
missing elements → cosmetic drift. Forks that are purely structural are in §3.

### Tier 1 — `04` §0c (the one visual language)

| # | Mockup shows | Code does | Mockup : Code | Rule broken |
|---|---|---|---|---|
| D1 | Class hub sits under a **themed banner** with the class dot, name, info line, and a **frosted glass stat strip floating over the banner art** (`academics-class-hub.html:83–105`, "GLASS: frosted only on the banner stat strip") | No banner at all. A flat `bg-card` section, and the stat strip carries `backdrop-blur-md` over that **solid card** — blur with nothing behind it | `academics-class-hub.html:83` : `ClassHub.tsx:121` and `ClassHub.tsx:163` | `04` §0c "Every tab gets a banner hero, not just Overview"; and §0c "glass belongs on surfaces that float over content or the banner… glass on everything is a defect". Both halves are wrong at once: no banner, *and* blur where it buys nothing. |
| D2 | Class hub sub-tabs are **underline tabs on the banner's lower edge**, accent underline, glow (`academics-class-hub.html:106–110`) | Underline tabs are re-declared inline with `border-b-2 … data-[state=active]:border-primary`, on a solid card border, no accent glow, no `--cat-gpa` | `_shared/nav-hierarchy-3-levels.html:100–109` : `ClassHub.tsx:776–778` | `04` §0b "one component per job"; `01` §4b-i level 2. The correct treatment already exists as `.academics-banner-tab` (`index.css:416–449`) and is used by `Academics.tsx:335–357`. |
| D3 | Every Planning view carries the banner stat strip with **that view's own variable metrics** — Tracker: Reqs left · Prereqs·MCAT · Credits · Double-counted; Grades: UNC cum · AMCAS cum · AMCAS BCPM · This term; Assignments: Overdue · This week · Grade due | One fixed strip for the whole page — Term GPA · Cumulative · Due today · Day streak — on every tab | `academics-requirements.html:264–270`, `academics-grades-archive.html:230–236`, `academics-assignments.html:~60` : `Academics.tsx:204–217` | `01` §4b-ii "variable-metrics-only stat strip". On the Tracker and Grades tabs the strip shows metrics that belong to a different tab, which is worse than showing none. |
| D4 | Exactly **one hero graphic per view** (`academics-requirements.html` decision 7: the degree-progress stacked bar) | Planner leads with **three 104px progress rings side by side**, and the Tracker sidebar offers a rings/bars toggle producing five more | — : `Academics.tsx:249–251` and `Academics.tsx:933–948` | `CLAUDE.md` "ONE hero graphic per view"; `04` §10 anti-patterns; `component-inventory.md` §4 explicitly flags `Ring`/`StatTile` as the treatment to move *away* from, "keep only for a page's single genuine primary metric". |

### Tier 2 — forks that change what the user sees

| # | Mockup shows | Code does | Mockup : Code | Rule broken |
|---|---|---|---|---|
| D5 | Empty collections get a **MascotNote — dashed, transparent, friendly one-liner + the first action** | Class Center's zero-class state is a hand-rolled `<div>` with a `BookOpen` icon, two lines of copy and **no action button**; the cold start therefore has no "Import a syllabus" primary and no "Add manually" secondary | `academics-empty-states-prototype.html` (variant A, LOCKED list) : `ClassCenter.tsx:533–539` | `mascot-note-pattern.html` "every empty collection gets a mascot line + first action, never a blank void"; `CLAUDE.md` empty-state rule |
| D6 | Class hub → Materials tags each file **Course / Mine / Generated** structurally | `fileOwnership()` **re-infers** ownership at read time from `file.type === 'study-guide'` and whether a note links it, ignoring the `owner` field that exists on the entity for exactly this purpose | `academics-class-hub.html` decision 4 : `ClassHub.tsx:922–926`, consumed at `ClassHub.tsx:481` and `ClassHub.tsx:918` | `types.ts:316–319` states the field is "structurally rather than inferred… Backfilled by the v8 migration". A user-set `owner` is silently overridden — the display can contradict stored data. |
| D7 | Class hub → Materials groups by **week/module**, module header shows unit range **and** study state; each module carries a **Priming block** | Groups by `topic.unit` only, header literally reads "Weeks not mapped"; Priming exists only as a Notes rollup filtered by `title.startsWith('Prime:')` | `academics-class-hub.html` decisions 4 & 6 : `ClassHub.tsx:476` and `ClassHub.tsx:567`, grouping at `ClassHub.tsx:908–920` | Missing element + string-prefix heuristic standing in for a modelled field (see §4 DG-6) |
| D8 | Task rows expose actions through the **right-click context menu** only (`overview-bento-control-panel.html:360–369`) | Every task row renders a `⋯` `DropdownMenu` **and** a `ContextMenu` with a near-identical item list | `overview-bento-control-panel.html:353–370` : `OverviewTasks.tsx:316–334` vs `OverviewTasks.tsx:339–360` | `04` §0b "one component per job… two components doing the same job is a defect"; `04` §0.2 one primary action per row |

### Tier 3 — missing elements

| # | Mockup shows | Code does | Mockup : Code |
|---|---|---|---|
| D9 | Class Center GPA panel: three numbers, a **trend line with a dashed projection to term end**, per-course contribution bars, and a pace line | Three numbers, then an unconditional "Not enough grade history yet" block **rendered even when grades exist**, then contribution bars below it | `academics-daily-main-page.html:255–280` : `ClassCenter.tsx:1080–1097` (`BentoEmpty` at `:1085` is outside every conditional) |
| D10 | Class Center Mastery trend: "42 of 65 ready · +7 this week", area chart + dashed projection, pace line | Always renders "Review events exist, but topic-ready history is not yet sufficient" — the mastery branch has **no chart path at all** | `academics-daily-main-page.html:294–314` : `ClassCenter.tsx:1209–1211` |
| D11 | Class Center Consistency: streak numeral + "19 of last 28 days", S–M–T–W–T–F–S day labels, 28-cell strip | 14 most-recent *active* days as a 7-col grid, no streak numeral, no day labels, no fixed 28-day window | `academics-daily-main-page.html:317–329` : `ClassCenter.tsx:1196` and `ClassCenter.tsx:1199–1208` |
| D12 | Requirements leads with **gap & pace measured against the MCAT date**, then what-to-take-next, then overlap ("boxes cleared for free"), then the full sets; a solid **segmented control** (Gap & pace / All requirements / Prior credit) in the filter bar; one primary action "Export for advisor" | A three-column planner (Degree Progress rail · term-card board · Course Library). No MCAT pacing, no overlap/double-count metric, no segmented control, no export, no prior-credit view | `academics-requirements.html:283–300` : `Academics.tsx:700–922` |
| D13 | Grades & Archive is **one ledger with status as a filter**, dual UNC/AMCAS GPA side by side permanently, AMCAS truncation (3.667 → 3.66), every repeat attempt counted, grade trend by academic year, weight-aware inverse-solving What-if | The `archive` tab renders `ClassCenter archiveOnly` + `ResourceGrid` + `NotesDB` — i.e. archived *class workspaces*, not a course ledger. Dual GPA, AMCAS truncation, repeat handling, year trend, and inverse solve are all absent; What-if is a forward-only GPA projector on the Planner tab | `academics-grades-archive.html` decisions 1–7 : `Academics.tsx:292–296` and `Academics.tsx:395–440` |
| D14 | Planner is horizontally scrolling term columns, every course stating what it clears with mapping confidence, an always-visible unplaced tray, and a live outcome rail (projected cum + BCPM, graduation, prereq-vs-MCAT verdict, gaps, ranked suggestions, watch-outs) | Vertical `Collapsible` term sections each wrapping a `TrackerTable` course grid, plus the GPA rings card and What-if | `academics-planner-prototype.html` (variant A, LOCKED list) : `Academics.tsx:240–280` |
| D15 | Class Center bento is exactly: Heads up · Your classes · Review queue · Where you're weak · Up next · GPA · Upcoming · Mastery trend · Consistency (decision 9 explicitly *removes* extra panels) | Adds a tenth panel, **Contacts**, which the approved mockup does not contain | `academics-daily-main-page.html:104–331` : `ClassCenter.tsx:789` |

### Tier 4 — cosmetic drift

| # | Mockup shows | Code does | Mockup : Code |
|---|---|---|---|
| D16 | Overview hero: greeting on top, the two glass cards side by side beneath it as a `1fr 1fr` row | Greeting + countdown stacked in a left column, schedule in a right column | `overview-bento-control-panel.html:248` : `OverviewHero.tsx:61` |
| D17 | Roadmap milestone cards carry label · date · one sub-line | Cards also carry a "Complete" checkbox and are preceded by a `tip` MascotNote | `overview-bento-control-panel.html:488–495` : `OverviewRoadmap.tsx:52–60` and `OverviewRoadmap.tsx:93–103` |

---

## 3. FORKS

`04` §0b: two components doing one job is a defect. Every row below has a
shared component that already does the job.

### 3a. MascotNote — correct in 3 surfaces, hand-rolled or absent in 4

`MascotNote` (`components/common/MascotNote.tsx`) implements all five approved
variants, priority-based one-per-view arbitration, and persistent dismissal. It
is used correctly in:

- Overview — 9 call sites: `OverviewHero.tsx:76`, `OverviewHero.tsx:179`, `OverviewTasks.tsx:145`, `OverviewStatus.tsx:251`, `OverviewStatus.tsx:297`, `OverviewSupport.tsx:110`, `OverviewSupport.tsx:267`, `OverviewRoadmap.tsx:41`, `OverviewRoadmap.tsx:52`
- Recall session — `AcademicRecallSession.tsx:353`, `AcademicRecallSession.tsx:458`
- Assignments — `AssignmentsPanel.tsx:649`

It is hand-rolled or missing in:

| # | Fork | Location | Shared component it should be |
|---|---|---|---|
| F1 | `EmptyState` **redefined locally**, shadowing the shared one, with a `detail` prop instead of `hint` and **no `action` slot** — so none of its 15 call sites can offer a first action | `ClassHub.tsx:814–816`; call sites `ClassHub.tsx:228, 242, 287, 294, 305, 321, 335, 341, 490, 531, 557, 590, 597, 625, 678` | `components/common/EmptyState.tsx` (which *does* take `action`), or `MascotNote variant="empty-state"` |
| F2 | `BentoEmpty` — a third empty-state implementation, dashed div, no icon, no action | `ClassCenter.tsx:824–830`; 8 call sites at `ClassCenter.tsx:857, 953, 990, 1085, 1130, 1168, 1199, 1210` | same as F1 |
| F3 | Zero-class cold start hand-rolled inline | `ClassCenter.tsx:533–539` | `MascotNote variant="empty-state"` |
| F4 | `SharedPlanNote` — a bespoke tinted explanation banner doing exactly MascotNote's `tip` job (explain a mechanism once, on a solid surface) | `Academics.tsx:442–452`; used at `Academics.tsx:241` and `Academics.tsx:284` | `MascotNote variant="tip"` |
| F5 | `MascotNoteProvider` wraps **only** Overview, so the binding "MAXIMUM ONE PER VIEW" rule is unenforced on every other page | `Home.tsx:11`; provider defined `MascotNote.tsx:32` | wrap each page shell (or `AppShell`) once |

Net effect: Academics — 4,777 lines across `Academics.tsx`, `ClassCenter.tsx`,
`ClassHub.tsx` — contains **zero** MascotNote call sites and **three** competing
empty-state components.

### 3b. The 3-level nav hierarchy — correct in 2 places, hand-rolled in 2

Implemented correctly on the Academics page shell:

- Level 1 glass mode pill — `ModeSwitch.tsx:39–47` (`glass-surface glass-surface--pill`), used at `Academics.tsx:198–203`
- Level 2 underline tabs — `.academics-banner-tab` / `::after` accent underline, `index.css:416–449`, used via `Academics.tsx:335–357`
- Level 3 solid filter bar — Select + search + count + ToggleGroup, `ClassCenter.tsx:419–447`

| # | Fork | Location | Should be |
|---|---|---|---|
| F6 | Class hub re-declares underline tabs inline instead of using `.academics-banner-tab` — different active colour, no accent glow, no `--cat-gpa` | `ClassHub.tsx:776–778` | `.academics-banner-tab` (see D2) |
| F7 | An entire **second per-class page** — `ClassWorkspace`, a left vertical rail with Today / Study Center / Notes / Course kit — is defined and **never rendered**. `/academics/classes/:courseId` routes to `ClassHub` (`ClassCenter.tsx:306`). `noUnusedLocals` does not catch it because the function name collides with the type-only import of `ClassWorkspace` at `ClassCenter.tsx:14` | `ClassCenter.tsx:1229–1354`, plus its exclusive dependents `OverviewTab` `:1398`, `NotesTab` `:1507`, `CourseKitTab` `:1593`, `StudyCenterTab` `:1669` (~900 lines) | delete; `ClassHub.tsx` is the built one. It is also the direction the nav-hierarchy mockup explicitly rejected ("REJECTED alternative: mode as a vertical left sub-rail") |
| F8 | Planning mode has no level-3 filter bar at all, so the Tracker's and Grades' own section switchers have nowhere to live | `Academics.tsx:283–296` | solid segmented control in a filter bar, per `academics-requirements.html` decision 5 |

### 3c. Other forks

| # | Fork | Location | Shared component |
|---|---|---|---|
| F9 | A second toast system — a `position: fixed` div driven by `useState` + `setTimeout` — inside `TarHeelTracker`, in the same file that already imports `useToast` at `Academics.tsx:63` | `Academics.tsx:596`, `:669`, `:689`, `:702` | `useToast` / `ToastProvider` |
| F10 | A second page-title row (icon tile + "Requirements" + subtitle) rendered directly beneath the `PageHeader` that already titles the page | `Academics.tsx:703–710` | `04` §0b "One page & heading system: every page uses `PageHeader`" |
| F11 | Native `window.confirm` for two destructive flows | `Academics.tsx:694`, `ClassCenter.tsx:495` | `AlertDialog` / `DependencyConfirmDialog`; `04` §0b "no native OS widgets" |
| F12 | Native `<details>/<summary>` accordion for requirement groups, in a file that already uses `Collapsible` at `Academics.tsx:266` | `Academics.tsx:798–807` | `components/common/Collapsible.tsx` |
| F13 | Raw `<input>` / `<textarea>` bypassing the styled form controls | `Academics.tsx:419` (number), `:749` (search), `:885` (search), `:891`, `:892` (checkboxes), `:1117`, `:1119`, `:1149` (number), `:1151` (textarea), `:1163` (text) | `Input`, `Textarea`, `Checkbox`; `01` §4a in-app styled controls only |
| F14 | Text glyphs used as, or inside, controls | `Academics.tsx:428` (`✕` as the delete button), `:958` (`◑`), `:1029` (`❄`) | lucide only — `CLAUDE.md` "No emoji as UI icons… No text glyphs as controls" |
| F15 | `Ring` used four ways on one tab where the compact stat row is the standard | `Academics.tsx:249–251`, `:938` | `component-inventory.md` §4 (see D4) |

**Correctly shared, worth protecting:** `SmartActionPanel` is one component
serving both Overview's "Smart next actions" (`Home.tsx:14`) and Academics'
"Heads up" (`ClassCenter.tsx:449`), exactly as
`academics-daily-main-page.html` decision 3 requires. `CenterPeek`,
`ModeSwitch`, `TrackerTable`, `ToggleGroup`, `ContextMenu`, `CollectionState`
and `AnimatedFileUpload` are all reused rather than forked.

---

## 4. DATA GAPS

Every mockup draws a populated screen. These views have **no store shape and no
selector** behind the data they draw. Each is a build blocker, and per
`04` §0.5 and `AGENT-IMPLEMENTATION-GUIDE.md` §0 **none may be solved with
placeholder data** — the screen must not render until the entity exists.

| # | View(s) blocked | Data the mockup draws | What exists today |
|---|---|---|---|
| DG-1 | **Syllabus import** — Upload / Review before apply / Re-import diff | A parse proposal: extracted units, deadlines, exam dates, grade categories with weights validated to 100%, per-item **confidence**, per-item **quoted source text**, an unapplied staging state, and a three-way added/changed/removed diff against confirmed data | Nothing. No parse-result entity, no staging area, no confidence or source-quote fields, no diff. The "Import syllabus" menu item at `AssignmentsPanel.tsx:504–507` navigates to the class page and does nothing else. `ClassWorkspace.syllabusUrl` (`types.ts:198`) stores a URL only. |
| DG-2 | **Exam-plan builder** — Accelerated / Steady / Catch-up | A generated day-by-day plan with per-day **finish times** ("9:00–11:30, free after 11:30"), a clocked-out state, a shell-level shared `WeeklyCapacity` + intensity value read/written by Academics *and* MCAT, and catch-up detection | Nothing. No plan entity, no per-day scheduling, no `weeklyCapacity` anywhere in `src/`. `ClassAssignment.studyPlan` (`types.ts:292`) is a free-text string. |
| DG-3 | **Requirements — Gap & pace** | Pace measured against the **MCAT date**, requirement **overlap** ("boxes cleared for free"), per-requirement `also:` lines, per-set verification date, "I confirmed this" acknowledgement | `RequirementItem` has `sourceType`/`verificationStatus` (`types.ts:94–95`) but no overlap model, no verification *date*, no user acknowledgement, and no link between requirements and `state.mcat.targetDate` |
| DG-4 | **Requirements — Prior credit** | AP / transfer / dual-enrolment rows with exam name, score, awarding institution, and course number + title **exactly as the transcript prints them** | `Course` (`types.ts:73–91`) has no exam, score, institution, or transcript-verbatim fields. `ApCreditDialog` (`Academics.tsx:1103–1131`) flattens all of it into a normal `Course` with `title: "AP Biology score 5"`. |
| DG-5 | **Grades & Archive** — Ledger / GPA / What-if | UNC GPA *and* AMCAS GPA as separate computations, AMCAS truncation, repeat-attempt linkage (every attempt counts), academic-year grouping, syllabus grade policies (drop-lowest), and per-item weight for inverse solving | `gpaStats()` (`lib/selectors.ts`) computes one GPA. No institution field, no `attemptOf` linkage, no academic-year field, no grade-policy entity. `WhatIf` (`Academics.tsx:395–440`) is forward-only and credit-weighted, not syllabus-weight-aware. |
| DG-6 | **Class hub — Materials / Notes** | Modules keyed to **week**, with unit range + study state; a per-module **Priming** block that rolls up as a Notes category; watched-folder note ingest with inferred structure | No week/module entity — grouping falls back to `topic.unit` and renders "Weeks not mapped" (`ClassHub.tsx:476`). Priming is detected by `title.startsWith('Prime:')` (`ClassHub.tsx:567`), not modelled. No ingest. |
| DG-7 | **Class types — Writing** | A class **type** that swaps the third sub-tab (Topics → Readings) and the primary action (Start review → Open current draft), plus a draft entity | No `classType` on `ClassWorkspace` (`types.ts:181–207`); no draft entity. The hub is hard-coded to five STEM tabs (`ClassHub.tsx:171–175`). |
| DG-8 | **Class Center — Mastery trend / GPA projection** | "42 of 65 ready · +7 this week" over time, and a dashed GPA projection to term end | `ReviewEvent` (`types.ts:245–252`) records grade + confidence per review but **not the topic's resulting ready-state**, so historical "topics ready" cannot be reconstructed. This is why `ClassCenter.tsx:1210` can only ever render the empty branch — it is honest, and it is the correct behaviour until the event shape carries the state. |
| DG-9 | **Class Center — Review queue (Anki rows)** | An "Anki" chip and "synced 1h ago" on Anki-owned rows | No Anki sync state. Note the class-hub and review-session mockups both **decouple Anki** (decisions 8), so the daily-page Anki chip is likely stale mockup content — worth a decision before anyone builds to it. |

---

## 5. FIX ORDER

Rationale for the ordering: `04` §0c defines the whole visual language by the
approved Overview hero, so Overview is settled first and everything downstream
conforms to whatever it ends up being. After that: the shared patterns (because
every later fix uses them), then the §0c banner defect, then the surfaces that
are wrong, then the surfaces that are missing. The three NOT-BUILT features come
last not because they matter least — `academics-syllabus-import.html` says
*"Build this first. Without it, most of §6 is decorative"* — but because each is
blocked on a store shape that does not exist, and shipping a half-built importer
would be worse than shipping none.

| # | Work | Why here | Must precede / follow |
|---|---|---|---|
| 1 | **Settle Overview** — D16, D17, D8 | §0c is *defined by* this hero; nothing downstream can be judged conforming until Overview is final. All three are small. | Must precede everything. D8 (drop the duplicate `⋯` menu) also sets the row-action precedent Academics rows will copy. |
| 2 | **Make MascotNote the only empty state** — F1, F2, F3, F4, F5, D5 | It is a pattern, not a screen: every later item in this list renders empty states, and doing this second means each of those is written once, correctly. Deleting two competing components also shrinks the surface of everything after it. | Must precede 5–9. F5 (provider per page) must land before F1–F4, or several notes will show a mascot at once and violate the one-per-view rule. |
| 3 | **Delete the dead second class page** — F7 (~900 lines) | Pure subtraction, zero risk, and it removes the trap where the next agent edits `ClassWorkspace` believing it is live. Doing it before item 4 halves what has to be read to fix the class hub. | Must precede 4. |
| 4 | **Class hub banner + tabs** — D1, D2, F6 | The single largest §0c violation in the pass: the mockup floats glass over banner art, the code has a flat opaque card *and* blur with nothing behind it. Fixing it also reuses `.academics-banner-tab`, closing F6. | Follows 3. Must precede 6 (class types build on this banner) and 7 (exam-prep is entered from it). |
| 5 | **Per-view banner stat strips** — D3 | Small, mechanical, and it stops the Tracker and Grades tabs from displaying another tab's metrics. Cheap once item 4 has established the per-surface banner. | Follows 4. Must precede 8 and 9, whose stats are part of their definition. |
| 6 | **Academics hygiene sweep** — F9–F15, D4 | Seven forks and the Ring overuse are all confined to `Academics.tsx` and `ClassCenter.tsx`, all mechanical, all currently visible to the user (a `window.confirm`, a `✕` glyph button, unstyled native inputs). Best done as one commit before the big Planning rewrites touch the same file. | Must precede 8 and 9 — both rewrite regions of `Academics.tsx` that these forks live in; fixing after would mean fixing twice. |
| 7 | **Class Center panel truth** — D9, D10, D11, D15 | These are honest-empty panels, not broken ones, so they are lower urgency than anything above. D9 is the real bug (the empty block renders unconditionally). D10 is **blocked on DG-8** — the review-event shape must carry resulting ready-state before a mastery trend can exist. D15 is a one-line removal. | D10 follows a DG-8 migration. D9, D11, D15 are independent. |
| 8 | **Requirements rebuild** — D12, F8, and the "All requirements" / "Prior credit" views | The tab currently answers "what does my degree plan look like" when the mockup's whole thesis is that it answers "what's left, and am I on pace *for the MCAT*". That is a rewrite, not a patch. | Blocked on **DG-3** (overlap + MCAT pacing model) and **DG-4** (prior-credit entity with transcript-verbatim fields). Follows 5 and 6. |
| 9 | **Grades & Archive + Planner** — D13, D14 | Two DIVERGENT surfaces that currently swap roles: the ledger lives on Planner, and the Archive tab shows archived *class workspaces* instead of a course ledger. Fixing one without the other leaves the ledger in two places. | Blocked on **DG-5** (dual UNC/AMCAS GPA, AMCAS truncation, repeat linkage, academic-year grouping, grade policies). Do D13 and D14 as one pass; follows 5 and 6. |
| 10 | **Syllabus import** — DG-1 | The spec calls it the keystone, and it is the correct next *feature*. It is last in this list only because it is a full-screen flow over an entity model that does not exist, and because items 1–6 give it the shared components (MascotNote, banner, filter bar, `AnimatedFileUpload`) it is specified to reuse rather than fork. | Blocked on **DG-1**. Follows 2 (empty states) and 4 (banner). Should precede 11 — an exam plan needs parsed exam dates and weights to plan against. |
| 11 | **Exam prep mode** — DG-2 | Full-screen mode replacing the app shell, with a shared `WeeklyCapacity` value that MCAT also reads. The shared-pool decision means this cannot be built as an Academics-local feature. | Blocked on **DG-2**, and the `WeeklyCapacity` shell value must land in `00-product-shell` §11b before either consumer. Follows 10. |
| 12 | **Class types — Writing** — DG-7, D-none | A whole class archetype with its own third tab, primary action, and draft entity. Genuinely last: it is the only YES row with no partial implementation to build on and no downstream dependents. | Blocked on **DG-7**. Follows 4. |

### Open questions for Andy

1. **DG-9** — `academics-daily-main-page.html:189–192` shows an Anki-owned review row with a sync chip, but `academics-class-hub.html` decision 8 and `academics-review-session.html` decision 8 both state Anki is **fully decoupled — no sync chips**. Which wins?
2. **D15** — the Contacts panel exists in code and not in the approved bento. Delete it, or amend the mockup?
3. **DG-8** — extending `ReviewEvent` to carry the resulting topic state is a localStorage schema change and needs a versioned lossless migration (`CLAUDE.md`). Confirm before item 7 starts.

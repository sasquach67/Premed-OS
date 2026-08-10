# Design-session handoff — the VISUAL design track

**Date:** July 2026 · **Scope:** visual design + the global interaction patterns. No app code was written here.

> ## ⚠ Read the right handoff — there are three
>
> | Doc | Track | Read it when |
> |---|---|---|
> | **`SPEC-SESSION-HANDOFF.md`** | **Feature speccing** — the master state doc. Academics complete (77 features), MCAT in progress, remaining gaps. | **Start here.** It's the broader and more current picture. |
> | **`DESIGN-SESSION-HANDOFF.md`** (this file) | **Visual design** — the global UI patterns (`01` §4b-i–§4f), the bento model, and **how to author the HTML mockups**. | You're designing a screen or writing a mockup. |
> | **`HANDOFF.md`** | **Implementation** — for coding agents. | You're writing app code. |
>
> The two spec tracks ran in parallel and **agree** — e.g. `implementation/briefs/D3-assignments.md` and `tabs/01-academics.md` §4.1-H independently landed on the same Assignments design. Where a brief and this doc differ on detail, **the brief is newer** (example: it refines row caps to *"Overdue and Today are never capped"* — hiding something you're late on is the one unacceptable failure).
>
> Also see `specifications/mockups/_shared/_visual-recipes.md` for concrete visual values, and `implementation/briefs/README.md` for build order.

This document covers **the global patterns locked in the visual track, and the mockup authoring convention** — the part not documented elsewhere.

---

## 1. What this session actually was

A **design + spec session**, not an implementation session. The working method:

1. **Design a view conversationally** — I mock it up, Andy critiques, we iterate until it's right.
2. **Save the result as a static HTML mockup** in `specifications/mockups/` with a header comment enumerating the decisions.
3. **Write the decisions into the Markdown specs** — global patterns into `specifications/01-shared-interface-patterns.md`, page specifics into that page's spec.
4. **Hand implementation to Codex** with a paste-ready prompt that points at both the spec and the mockup.

**The docs are the source of truth. The mockups are the visual law. Neither is optional.**

---

## 2. Global patterns locked this session

All in `specifications/01-shared-interface-patterns.md`. These apply to **every tab**, not just the ones designed so far — that's the whole point of putting them there.

| § | Pattern | The rule in one line |
|---|---|---|
| **§4b-i** | **Three-level navigation hierarchy** | Mode = glass pill on banner · Tabs = underline · Filters = solid form controls. Never two adjacent levels in the same form. Period pickers are `Select`s, **never pill rows**. |
| **§4b-ii** | **Banner compaction** | Prefer the banner; compact upward. Title only — no group crumb, no subtitle line. **Only *variable* metrics** in the stat strip (3–5 max); fixed facts like credit count don't earn the space. |
| **§4c** | **Right-click context menu** | A shortcut, **never the only path** to an action. Nine surfaces enumerated. |
| **§4d** | **Pacing & projections** | *"At THIS RATE → THIS OUTCOME by THIS DATE."* Deterministic arithmetic only, never guesses. **Max one per panel**, dismissible, collapses to a "Show projection" pill. Never on streaks or raw counts. If a rate can't be computed, **show nothing**. |
| **§4e** | **Interactive card pattern** | Calm at rest (no accent bar; identity = a small dot). Hover = bar ignites + border/glow + lift + affordance swap. Hovering an inner button leaves the card **unlit**. One primary action + overflow. |
| **§4f** | **`MascotNote`** | The mascot is the app's voice for **explaining and teaching**. Five variants. Cite the source when one exists; omit the label rather than invent one. Never on errors, never a control, **max one per view**, teaching notes fire **once per concept**. |

**Also locked:** the **bento control panel** layout model (`03-overview.md` §5) — a 12-column grid of *mixed-size* panels. A uniform stack of equal full-width rectangles is a defect.

**Standing preference (Andy, verbatim intent):** *"I prefer things in the banner"* — push page chrome and page metrics up into the banner rather than spending vertical panels on them.

---

## 3. What's approved and specced

### Overview (`specifications/03-overview.md`) — APPROVED
Rebuilt as a bento of eight blocks. Order: Hero → **Smart next actions** → **Tasks** → Where I stand → stat tiles → Quick access / Goals / Activity → Roadmap.

Key decisions: **no "Needs attention" strip** (§6.2 — urgency lives on task rows, in smart actions, and the bell); **Tasks = Now/Soon/Done tabs**, drag reorders *within* a tab only, **star/important is the single prioritization concept** (the earlier "Focus" strip was removed as a duplicate); **stat tiles** (§6.5a) and **quick access** (§6.5b) are new; roadmap is a **horizontal spine of milestone cards**; mascot lives in the roadmap's **"Your Plan"** header.
§11 acceptance criteria were rewritten to match (they were stale and had already misled one agent).

### Academics (`tabs/01-academics.md`) — Daily mode APPROVED
- **§4 nav** — the three-level chrome, term picker is a `Select`, only the active mode's tabs render.
- **§4.0–4.0d** — Daily main page panel table; class-card rules; **study tools are per-class, never page-level** (a tool with no class selected has no subject); **"Where you're weak" is exam-scoped by default** (topics filtered to the next exam's unit range, toggle to All topics grouped by class); **"Up next"** is a dynamic biggest-thing-on-your-plate widget.
- **§4.1-H Assignments** — **scope rule: anything tied to a class lives here (`courseId` required); anything else goes to Overview → Tasks.** Agenda default (time buckets) + Weekly + Calendar; **table demoted to the ⋯ overflow** ("Edit as table") because tables answer "compare and edit" not "what's coming"; **Add is the page's primary action** (banner button + ⌘N + a second dashed add-row at the bottom of the list); volume control via collapsible buckets, `+N more` caps, Completed collapsed; **"Projected workload"** panel at the bottom (not a view).

---

## 4. The mockup convention — how to write these HTML files

**Location:** `specifications/mockups/` · **Index:** `mockups/README.md` (keep it updated).

These are **static HTML with fake data**. They are law for **layout, density, hierarchy**; the specs are law for **behavior and data**. Implementations must **rebuild from library components**, never copy the markup — every file says so.

### Required structure

1. **Header comment block** — the most important part. Always includes:
   - `Status:` APPROVED or DRAFT (+ what's open)
   - `Spec:` the Markdown file it pairs with
   - `RELATED` — sibling mockups
   - **`DECISIONS THIS FILE ENCODES`** — a numbered list of every decision, especially the ones easily lost in translation
   - What was **removed / do not reintroduce**, with the reasoning (this prevents re-litigating)
   - The glass rule for that page
   - "Build from library components, not this markup"
2. **`:root` token block** — copied from `src/index.css` (`.dark` warm default), so colors are real: `--bg:#211e1a; --card:#2b2722; --fg:#ece3d4; --mut:#a89c8c; --dim:#7c7264; --pri:#6fb3de; --bd:#3c352d; --muted:#322e28;` plus `--success/--warning/--danger` and the per-pillar `--cat-*` accents.
3. **`.frame{width:1400px}`** — full desktop app width, **to scale**. Mockups are viewed full screen; do not compress to fit a preview pane.
4. **Fonts** — Baloo 2 (display/numbers, weight 800) + Nunito (body) via Google Fonts. Never substitute.
5. **Section comments** (`<!-- ══ PANEL NAME ══ -->`) marking each block, with inline notes on non-obvious behavior (e.g. *"Anki-owned: Anki owns timing; HQ shows a sync chip only"*).
6. **`<h1 class="sr-only">`** describing the page for screen readers.

### Visual conventions to match

- **Glass only where a surface floats:** banner mode-pill, banner stat strip, overlays/menus. Everything else is **solid-with-depth** (`bg-card` + border + soft shadow). No blur on tables, rows, fields, panels, tabs, badges.
- **Bento**: `display:grid; grid-template-columns:repeat(12,1fr)` with `.c3/.c4/.c5/.c7/.c12` span classes. Vary the sizes.
- **Numbers** in Baloo 800 with `font-variant-numeric:tabular-nums`.
- **Severity color language:** success `#6fc0a8` · warning `#e7b06a` · danger `#e8806f` · neutral `#7c7264`.
- **Chips/badges:** `color-mix(in srgb,var(--accent) 18%,transparent)` background + accent text.
- **Hover states** shown explicitly where they carry meaning (e.g. one class card rendered in its hover state to document the pattern).
- Show **anti-patterns beside the fix** when the mockup exists to correct a mistake — see `academics-nav-hierarchy.html`, which shows the three-identical-pill-rows failure marked "✕ avoid" above the approved version.

### Current files

| File | Status |
|---|---|
| `overview-bento-control-panel.html` | APPROVED — the design language |
| `academics-nav-hierarchy.html` | APPROVED — global 3-level nav rule (+ anti-pattern) |
| `academics-daily-main-page.html` | APPROVED — Class Center |
| `academics-assignments.html` | APPROVED — Assignments, all views |
| `mascot-note-pattern.html` | APPROVED — `MascotNote`, all variants + restraint rules |
| `academics-mode-switch` · `class-center-study-hub` · `clinical-pillar` · `mcat-plan` | **older concept mockups** — flow only, visuals superseded |

---

## 5. Implementation hand-off (in flight)

Codex is building from a paste-ready prompt covering **Chunk A = Overview rebuild** and **Chunk B = Academics Daily / Class Center**. It plans first and stops for approval per chunk.

Approvals already given: locked spec body over stale acceptance wording · mascot into the roadmap "Your Plan" header · additive schema changes (task `important` + `now|soon`; capture records; `ClassWorkspace.courseId` migrated from code+term **with a review step for unmatched records**; topic FSRS + single-scheduler fields; assignment points/weight; persisted per-projection dismissal) — **every localStorage change needs a versioned, lossless migration** · honest **"not enough graded work yet"** state instead of fabricated percentages · roadmap from real milestone records with an empty setup state, never hardcoded dates · mobile Quick Capture in normal flow, not sticky.

A `MascotNote` addendum was sent to fold the component into Chunk A.

**Out of scope for Codex right now:** Assignments implementation, Planning mode, the class hub.

---

## 6. What's next — the queue

### Academics — Daily (remaining)
1. **Per-class study hub** (center peek → expand) — **the biggest remaining view in the tab.** Materials (upload / embed / link), topics list with FSRS status + per-topic notes, that class's assignments, class info, and the *full* study-tool set. Reference the old concept file `class-center-study-hub.html` for flow only.
2. **Review session runner** — what happens after "Start": recall prompt → self-grade → FSRS reschedule. Includes confidence-rating-before-reveal and the free-recall/blurting mode.

### Academics — Planning (nothing designed yet)
3. **Planner & GPA** — course ledger (`TrackerTable`), AMCAS cumulative + BCPM, **What-if** scenario calculator.
4. **Requirements** — the requirement audit. **Currently broken in the live app** (modeled on UNC's retired "Making Connections" curriculum instead of **IDEAs in Action**). Design challenge: a requirement audit is usually a dead checklist, but this one must answer three questions at once — *what's left*, *am I on pace for the MCAT/graduation*, and *what should I take next term*. Treat it as a **gap-and-pace view**, not a checklist.
   - **Blocked on research** (open decision #5): needs a sourced dataset from `catalog.unc.edu` — IDEAs in Action gen-eds (First-Year Seminar/Launch, University Writing, Global Language, Triple-I, College Thriving, Focus Capacities, Reflection & Integration, Supplemental Gen Ed for BAs) + med prereqs + per-major requirements. The *interface* can be designed against a modeled structure first.
5. **Archive** — completed/withdrawn/superseded courses, restorable.

### Supporting flows
6. **Exam-plan builder** (what "Build exam plan" opens)
7. **Syllabus import review** (extraction → confirm screen — called out in the spec as the biggest adoption unlock)
8. **Empty states** — new user, zero classes (uses `MascotNote` empty variant)

### After Academics
MCAT · Clinical · Volunteering are spec'd but not visually designed. Shadowing → Settings are still stubs needing specs written.

---

## 7. Working notes worth carrying forward

- **Andy's design instincts that keep recurring:** rich and dimensional, never flat · glass only where it makes sense · **pacing/projection everywhere it's honest** ("you're projected to reach X by Y" — but restrained and dismissible) · put things in the banner · vary panel sizes like a control panel, not stacked rectangles · plain-language labels over abstract ones ("Projected workload", not a chart to decode).
- **When a design is rejected, record *why* in the mockup header** so it isn't retried — e.g. the vertical roadmap, the five-pill switcher, the Anki-style mastery heatmap that measured volume while pretending to measure strength.
- **Ask before assuming on scope questions that touch the data model** (e.g. the class-linked-vs-all-dated-items question for Assignments). Those answers change what gets built.

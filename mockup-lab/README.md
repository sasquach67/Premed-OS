# Visual mockups — index

**Read this before building any page.** These HTML files are the **approved visual references** for Premed OS. They show layout, density, hierarchy, and feel; the specs are law for behavior and data.

---

## Folder structure

**One folder per tab, numbered to match `tabs/`.** Each mockup's **decisions file (`.md`) sits beside its `.html`** — one folder holds everything about that surface.

```
mockups/
├── _shared/              cross-cutting patterns — apply to EVERY tab
├── 00-shell/             app shell, sidebar, topbar, command palette
├── 01-academics/         → tabs/01-academics.md
├── 02-mcat/              → tabs/02-mcat.md
├── 03-overview/          → specifications/03-overview.md
├── 04-clinical/          → tabs/03-clinical.md
├── 05-volunteering/      → tabs/04-volunteering.md
└── …add a folder per tab as it gets designed
```

**Rules**

- **Never leave a mockup in the mockups root.** It goes in its tab folder, or `_shared/` if it's a cross-cutting pattern.
- **New tab = new folder**, numbered to match its spec file.
- **Decisions file beside the mockup**, same base name (`foo.html` + `foo.md`).
- `_shared/` is for things that govern *every* tab — nav hierarchy, the mascot pattern, visual recipes. If it only affects one tab, it isn't shared.

---

## How to use them

1. **Open the file in a browser** (static HTML, no build step) before writing code for that page.
2. **Precedence:** where mockup and spec disagree on *behavior*, the **spec wins**. Where they disagree on *layout/density*, the **mockup wins**.
3. **Do NOT copy the markup.** Every mockup is hand-written static HTML with fake data and inline CSS. Rebuild each block from the real library components named in that page's *Components used* table (`implementation/component-inventory.md`).
4. Each file's header comment lists the decisions it encodes and what is deliberately excluded — **including rejected alternatives and why**, so they don't get retried.

---

## `_shared/` — governs every tab

| File | What it locks |
|---|---|
| `nav-hierarchy-3-levels.html` | **Three-level nav rule**: glass mode pill → underline tabs → solid filter bar. Shows the anti-pattern (three identical pill rows) beside the fix. `01` §4b-i |
| `mascot-note-pattern.html` | **`MascotNote`** — the explanation/teaching pattern, five variants, plus the restraint rules. `01` §4f |
| `_visual-recipes.md` | Concrete visual values to build from **literally** |

## `03-overview/`

| File | Status | Spec |
|---|---|---|
| `overview-bento-control-panel.html` | **APPROVED** — the app's design language: bento grid of mixed-size panels, Now/Soon/Done task tabs, star-only prioritization, stat tiles, quick access, horizontal milestone roadmap | `specifications/03-overview.md` |

## `01-academics/`

| File | Status | Spec |
|---|---|---|
| `academics-daily-main-page.html` | **APPROVED** — Daily → Class Center | §4.0 |
| `academics-assignments.html` | **APPROVED** — Agenda default, Weekly + Calendar, "Projected workload" panel, table in overflow | §4.1-H |
| `academics-class-hub.html` | per-class study hub | §4.1-I |
| `academics-review-session.html` | active-recall runner | §4.1-J |
| `academics-class-types.html` | the three class types | §4.1-N |
| `academics-mode-switch.html` · `class-center-study-hub.html` | **older concept mockups** — flow only; visuals superseded by the approved references | — |

## `02-mcat/`

| File | Status | Spec |
|---|---|---|
| `mcat-bookshelf.html` | Bookshelf | §3.10 |
| `mcat-section-aware-drills.html` | drill scheduling | §3.9-a |
| `mcat-plan.html` | **older concept mockup** — plan generator flow only | §3.3 |

## `04-clinical/`

| File | Status |
|---|---|
| `clinical-pillar.html` | **older concept mockup** — experience-pillar flow only |

---

## Build status — check before designing

**Academics is built and shipped.** Do not mock or re-design these; read the code first and treat the mockups as the visual bar to close gaps against, not as greenfield.

| Surface | Component | Route |
|---|---|---|
| Daily → Class center | `components/academics/ClassCenter.tsx` | `/academics` |
| Daily → Assignments | `components/common/AssignmentsPanel.tsx` | `/academics` |
| Planning → Planner & GPA | inline in `pages/Academics.tsx` (AMCAS rings + `WhatIf`) | `/academics` |
| Planning → Tar Heel tracker | inline in `pages/Academics.tsx` | `/academics` |
| Planning → Grades & archive | inline in `pages/Academics.tsx` | `/academics` |
| Class page | `components/academics/ClassHub.tsx` | `/academics/classes/:courseId` |
| Active-recall runner | `pages/AcademicRecallSession.tsx` | `/academics/review/:courseId` (full-screen) |

Supporting logic already exists in `lib/academics/`: `coverage`, `fsrs`, `chunkAssignment`, `generationPolicy`, `activeRecall` — each with tests. Store migrations run through `academicsV7`.

### Genuinely unbuilt in Academics

- **Exam-plan builder** — no code. `studyPlan` in `types.ts` is a free-text string on a course, not a builder.
- **Syllabus import** — `syllabusUrl` is only a paste-a-URL `Input`. There is no parse/extract/review flow, yet `pages/Academics.tsx` copy tells the user to "Import the syllabus." Either build it or fix the copy.

### Not yet mocked

**MCAT:** Test Day panel (§3.11) · M2M end-to-end flow (§4 + §5h export) · coach states (§5j) · stamina decay chart (§3.12-A)
**Everything else:** Clinical, Volunteering, Shadowing, Research, Extracurriculars, School List, Essays, Letters, Timeline, Profile, Settings, Help

---

## Global rules the approved mockups encode

These apply to **every** page, not just the ones mocked:

- **Bento control panel** — mixed-size panels (tall / wide-short / small). A uniform stack of equal rectangles is a defect. (`03-overview` §5)
- **Banner compaction** — push page chrome and metrics into the banner; title only, no group crumb or subtitle line; **only variable metrics** in the stat strip (3–5 max). (`01` §4b-ii)
- **Three-level nav, three forms** — mode = glass pill, tabs = underline, filters = solid controls. Period pickers are `Select`s, never pill rows. (`01` §4b-i)
- **Glass judgment** — frosted glass only on surfaces that float (overlays, banner-borne chrome, chips over imagery). Tables, rows, fields, panels, tabs, badges are solid-with-depth. (`04` §0c)
- **Interactive cards** — calm at rest (no accent bar), hover lights bar + border + lift + affordance swap, one primary action + overflow, button hover leaves the card unlit. (`01` §4e)
- **Pacing** — "at THIS RATE → THIS OUTCOME by THIS DATE", deterministic, max one per panel, dismissible, collapses to a pill. (`01` §4d)
- **Anki export** — `.apkg` always, everywhere; Basic · Cloze · Image Occlusion only; no custom templates. (`01` §4g)
- **Intelligence surface** — every tab's smart-feature panel uses the **same** component as Overview's Smart next actions (explain-line + act/dismiss + suppression + unmount-when-empty).
- **Context menu** — right-click is a shortcut, never the only path to an action. (`01` §4c)
- **Type** — Baloo 2 (display/numbers, bold) + Nunito (body). Never changed.
# Mockup review

Start with [`variant-lab.html`](variant-lab.html) for visual review.

For continuation or agent handoff, read
[`CLAUDE-HANDOFF.md`](CLAUDE-HANDOFF.md) before changing the lab or adding new
mockups. It defines the required separation between product views and A/B/C
design variants, plus the completion criteria for every tab.

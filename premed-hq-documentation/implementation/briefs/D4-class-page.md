# D4 brief — Class page (five sub-tabs)

**Read ONLY this file plus the references in §7.** Global rules are in the repo's `CLAUDE.md`.
**If something you need isn't here, read the named spec section and tell me the brief was incomplete.**

---

## 1. Goal

The per-class page. Opens from a Class Center card as **center peek → expand** (`01` §2). Replaces the old `CourseDetailDialog` — migrate, don't keep both.

- **Peek** = lean: class identity + grade, due-today count, top 2 due/weak topics with `Recall`, `Start review`, `Open full hub →`.
- **Expand** = the full page below (deep-linkable). **Split** = page + its assignment list.

## 2. Shared banner (identical on all five tabs)

Breadcrumb `‹ Class Center` · class dot + code + full name · **compact info line** (`Dr. Elamin · MWF 10:10a · Kenan B12 · BCPM · office hours, links ⌄`) · **glass stat strip** (grade · ready · due today · exam countdown) · **one primary action `Start review`** · `⋯`.

Class info is a **line, not a panel** — fixed facts don't earn panel space. Glass only on the stat strip.

Tabs (underline): **Overview · Materials · Topics · Assignments · Notes**, with counts.

## 3. Overview — master view of THIS class (not a copy of Class Center)

Status row (12): grade · topics ready · exam countdown · streak · **MCAT-relevant count** · coverage bar + mapped %.
Then: **Due today** (4) with one pace line · **Exam scope** (4, see §4) · **Coming up** (4, with weights) · **Recently covered** (5 — last 3 lectures *and whether you've reviewed them*, plus a warning when a covered unit was never reviewed) · **Grade breakdown** (4, with weight-sum validation) · **Class contacts** (3) · **Mastery over the semester** (12, actual + dashed projection).

## 4. Exam scope (must be explainable)

Segmented bar + **labelled legend** (`Ready 4 · Reviewing 2 · Weak 3`) + an on-screen explainer: *"Scope comes from your syllabus: the exam covers Units 4–7, so every topic in those units counts — 9 in total. The bar is those 9 by review state."* Colours reuse the topic-status vocabulary. **Never an unlabelled stacked bar.**

## 5. The other four tabs — everything is grouped, never a flat pile

- **Materials** — grouped **by week/module**; module header shows unit range **and study state** ("2 weak topics", "3 never reviewed"). **Three-way ownership marker on every file: `Course` / `Mine` / `Generated`.** Filters: All / From the course / **My notes** / Generated / Unassigned. Files open **inline**. Each module carries a **"Prime yourself"** block (questions to hold in mind before reading; purple-tinted; rolls up into Notes). Unassigned-files notice explains positional filing.
- **Topics** — grouped into **unit sections in course order**; unit header carries name, weeks, exam-scope flag, and its own "1 of 3 ready" progress. Rows: name · last-recall recency · retrievability bar · status chip · **MCAT tag** · notes affordance. Filter chips by state. Fast-capture `＋ Covered a topic today` row.
- **Assignments** — grouped by **syllabus category** (Problem sets 15% · Labs 20% · Exams 35+30%), each header showing weight, completion, and **your average in that category**. Footer validates weights sum to 100% and states what share of the grade is in. Holds the **what-if calculator**: states what's locked in, takes assumptions **per category**, answers "you need X% average across everything remaining", shows GPA knock-on, saves nothing.
- **Notes** — notes **about** the class, filed by kind: **Exam intel** · **Questions to ask** (checkboxes) · **Priming** (rolled up from Materials) · **Lecture notes** by unit. Per-topic notes in a side rail.

**Two kinds of notes, never merged:** Notes tab = *about* the class. Materials → My notes = *on* the material (your own pages, tagged `Mine`).

## 6. Study tools

**One primary "Generate study guide" + a quiet overflow** for the rest, **plus contextual entry**: a topic's `⋯` → "Quiz me on this", a file's `⋯` → "Summarize". **No grid of 8 tool buttons.**

## 7. References — these only

- `specifications/mockups/01-academics/academics-class-hub.html` — **this chunk's mockup. Read it for layout and composition** (panel arrangement, proportions, what sits beside what). Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.**
- `specifications/mockups/_shared/_visual-recipes.md` — **exact visual values** (banner gradient, glass recipe, underline glow, card hover, focus rule). Use these literally; do not approximate.
- `specifications/mockups/01-academics/academics-class-hub.md`
- `tabs/01-academics.md` **§4.1-I only** (plus §4.1-A–F if you need the underlying feature definitions)

> **Forward dependency — build this page so D8 can configure it, not fork it.** `tabs/01-academics.md` §4.1-N adds three class types (`stem` · `writing` · `general`) in which **the banner, Overview, Materials, Assignments, and Notes are identical** and only the **third sub-tab** and the **primary action** vary. Structure the page so those two are parameterised. Do **not** implement types in this chunk — just don't hardcode "Topics" and "Start review" in a way that would force a second page component later.

## 8. Components to reuse

`tabs` · `card` · `badge` · `progress` · `collapsible` · `dropdown-menu` · `context-menu` · `dialog`/`sheet` (peek + inline file viewer) · `avatar` (contacts) · `input` · `checkbox` · `separator` · `sonner`.

## 9. Done when

- [ ] Peek → expand works; old `CourseDetailDialog` removed.
- [ ] One banner shared by all five tabs; info is a line; glass only on the stat strip; one primary action.
- [ ] Overview is a master view of this class, not a Class Center copy.
- [ ] Exam scope has a labelled legend **and** an on-screen explanation.
- [ ] Materials grouped by week with `Course`/`Mine`/`Generated` markers + priming blocks; Topics grouped by unit with per-unit progress; Assignments grouped by syllabus category with per-category averages + weight-sum check; Notes filed by kind. **No flat lists.**
- [ ] What-if is category/weight-based and saves nothing.
- [ ] Study tools = primary + overflow + contextual, never an 8-button grid.
- [ ] Empty/loading/error; AA light + dark; keyboard + focus + reduced-motion; `npm run build` passes.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(academics): class page sub-tabs`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 10. Report

Diff summary only. No full-file dumps.

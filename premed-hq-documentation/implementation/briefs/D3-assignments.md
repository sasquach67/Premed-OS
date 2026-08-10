# D3 brief — Assignments (Daily)

**Read ONLY this file plus the references in §6.** Global rules are in the repo's `CLAUDE.md`.
**If something you need isn't here, read the named spec section and tell me the brief was incomplete.**

---

## 1. Goal

Academics → Daily → **Assignments**: the cross-course deadline surface. Extend the existing `AssignmentsPanel`.

## 2. Scope rule (LOCKED)

**Anything tied to a class lives here — `courseId` is required.** Anything not tied to a class goes to Overview → Tasks. Assignments are **excluded** from Home's to-do widget; only their *deadlines* may reach the attention bell.

## 3. Three views in the switcher

- **Agenda (default)** — time buckets (Overdue · Today · This week · Next week · Later · Completed). This is the landing view because the question is "what's coming," not "compare and edit."
- **Weekly** — board of day columns with per-day load.
- **Calendar** — month grid + a side rail for the selected day.

**Table is NOT a view.** It lives in the `⋯` overflow as **"Edit as table"** (with Import syllabus, Show completed, Export) for bulk entry/grade updates. **Never the landing view.**

## 4. Row anatomy

Checkbox · title · class badge (class colour) · type badge · weight/points · due chip whose severity colours by proximity (overdue = danger, today = warning, later = neutral). Starred/important gets a left accent + gradient tint. Right-click = `Context Menu` shortcut (never the only path to an action).

## 5. Rules

- **Add is the page's primary action** — banner button + `⌘N` + a second dashed add-row at the **bottom** of the list.
- **Volume control:** collapsible buckets, `+N more` caps per bucket, Completed collapsed by default.
- **"Projected workload"** is a **panel at the bottom**, not a view: stacked bars per upcoming week + load badge + collapsible, with **one** pace line (`01` §4d).
- Completing a row → optimistic update + `Sonner` undo.
- Empty state uses the **`MascotNote` empty variant**.

## 5a. Resolved details (added after D3 gap flag)

- **`important` field:** add `important?: boolean` — **purely additive**, versioned migration, default absent. No backfill, no reinterpretation of existing data. Star/important is the app's **single** prioritization concept (`03-overview`); do not introduce a second priority scheme.
- **Completion semantics:** `submitted` and `graded` both count as **Completed**. Checking an unfinished item sets `submitted`; **undo restores the previous status exactly** (never a blanket revert to "not started").
- **Row caps — differ by bucket:** **Overdue and Today are never capped** (hiding something you're late on is the one unacceptable failure). This week / Next week / Later cap at **5** with `+N more`. Completed is collapsed entirely.
- **Export = CSV.**
- **"Import syllabus"** — route to the existing class/course path only. **Do not build a parser**; the syllabus-import review screen is a separate, still-undesigned feature.
- **Buckets include `Today`.** Where this brief and `mockups/01-academics/academics-assignments.md` disagree, **this brief wins** — the decisions file is older.

## 6. References — these only

- `specifications/mockups/01-academics/academics-assignments.html` — **this chunk's mockup. Read it for layout and composition** (panel arrangement, proportions, what sits beside what). Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.**
- `specifications/mockups/_shared/_visual-recipes.md` — **exact visual values** (banner gradient, glass recipe, underline glow, card hover, focus rule). Use these literally; do not approximate.
- `specifications/mockups/01-academics/academics-assignments.md`
- `tabs/01-academics.md` **§4.1-H only**

## 7. Components to reuse

`toggle-group` (view switch) · `checkbox` · `badge` · `collapsible`/`accordion` · `calendar` · `dropdown-menu` (overflow) · `context-menu` · `sonner` (undo) · `progress` (workload bars) · `button` · existing `TrackerTable` for the overflow table.

## 8. Done when

- [ ] Only `courseId`-linked items appear; nothing class-less leaks in.
- [ ] Agenda is default; Weekly + Calendar available; table only in overflow.
- [ ] Add present in all three places (banner, `⌘N`, bottom row).
- [ ] Buckets collapse, `+N more` caps work, Completed collapsed.
- [ ] Projected workload panel at the bottom with exactly one pace line, dismissible.
- [ ] Right-click menu duplicates — never replaces — a visible action.
- [ ] Empty/loading/error; AA light + dark; keyboard + focus + reduced-motion.
- [ ] `npm run build` passes.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(academics): assignments views`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 9. Report

Diff summary only — files touched, components reused, checklist pass/fail. No full-file dumps.

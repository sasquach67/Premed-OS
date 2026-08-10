# D8 brief — Class types (STEM · Writing · General)

**Read ONLY this file plus the references in §7.** Global rules are in the repo's `CLAUDE.md`.
**If something you need isn't here, read the named spec section and tell me the brief was incomplete.**

> **Depends on D4** (class page five sub-tabs). This chunk generalises that page into three configurations. **Do not fork the page** — configure it.

---

## 1. Goal

Every class a student takes goes into HQ — including English, gen eds, and electives. What varies is which **study** features that class turns on. Three types, no more.

| Type | Turns on | Typical |
|---|---|---|
| `stem` | The full memory layer, exactly as built today | CHEM, BIOL, PHYS, MATH |
| `writing` | Papers, drafts, readings, feedback | ENGL, HIST, seminars |
| `general` | Grade, deadlines, materials, notes | gen eds, electives, labs, language, studio |

## 2. Non-negotiables

- **Exactly three types.** A five-type taxonomy and a per-feature toggle checklist were both proposed and **REJECTED**. Do not add a fourth type. If a course shape seems unhandled, it is `general` — that is what `general` is for.
- **`ClassWorkspace.type: 'stem' | 'writing' | 'general'`.** Additive, versioned, lossless migration; existing classes default to `stem` (that is what they are today).
- **Type gates study features ONLY.** Never gated: syllabus, materials, notes, contacts, meeting times, assignments, deadlines, grade ledger, what-if, GPA, BCPM, credit load, requirement satisfaction, Tracker, Overview, Planner, Grades & Archive.
- **Type is a view concern, never a data concern.** GPA, BCPM, requirement audit, Planner, and Overview must contain **zero reads of `type`**. Verify by grep and say so in the report. This is the specific bug that would make a humanities semester look like a failure.
- **A paper in a STEM class is just an assignment.** Course-to-course variation lives in the assignment list, never in the type system. Do not build per-course feature configuration.
- **Type changes are non-destructive both ways.** `stem → general` hides topics and recall history; never deletes. Switching back restores intact.
- **Dormant means absent, not empty.** A Writing class renders no greyed-out forgetting curve and no "0 topics ready" — those panels do not exist on that page.

## 3. Choosing the type

One row of **three chips** in the add-class flow, suggestion preselected, **reason shown in one line** beneath. No wizard, no second screen, no sub-options. Whole add ≤5 seconds.

Suggestion order, stopping at the first confident answer:

1. **Parsed syllabus** (strongest) — exams ≥50% + units → `stem`; papers/essays ≥40% with no cumulative exam → `writing`; 1-credit / P/F / `L`-suffix → `general`.
2. **Course code** — small department mapping table. **Hint only**; never outranks the syllabus.
3. **User's own history** — they set ENGL 105 to Writing last term → suggest Writing for ENGL 205.
4. **No confident answer → nothing preselected.** Ask, don't guess (§6.4 rule applies).

Always show the basis: *"Suggested Writing — papers are 55% of your grade, no final."* Changeable any time from class settings.

## 4. The page — one structure, three configurations

Banner identical in all types. `Overview · Materials · Assignments · Notes` identical in `stem` and `writing`. **Only the third sub-tab and the primary action vary** (see decisions file table). `general` has four tabs and no study tab.

Stat strip is the same component with per-type contents.

## 5. Writing surfaces to build

- **`PaperDraft`** — `assignmentId`, `stage` (`outline|draft|revision|submitted`), `selfDeadline?`, `completedAt?`, file link. **The student's self-set target is separate from the professor's deadline** — the draft rail's "late" state refers to the self-set date. Do not collapse them.
- **`AssignedReading`** — `courseId`, `week`, `title`, `source?`, `status` (`not-started|skimmed|read`), `dueForDiscussion?`.
- **`FeedbackNote`** — `assignmentId`, `theme`, `quote?`, `createdAt`. **Themes surface only once they repeat across papers**; a single note is never shown as a theme.
- Features #57 draft stages · #58 reading debt · #59 recurring feedback themes.

**Do not reuse `Topic` or FSRS fields for any of these.** Readings and drafts are not reviewed on a schedule; modelling them as topics silently pulls Writing classes back into the memory machine.

## 6. Degradation (required — the most likely Writing failure)

Readings often aren't parseable (table-as-image, "posted weekly on Sakai", LMS-only).

- Never render an empty Readings tab as though parsing succeeded — **say what happened**.
- Three first-class entry paths: paste a list (split + assign weeks), add inline as assigned, `＋ Add this week's readings`. **Manual entry is the primary path for many courses** and must feel intended, not like a fallback.
- Partial parses keep what worked.
- **Reading debt is suppressed entirely without a complete list** — no denominator, no number. Returns when complete.
- A Writing class with no readings is valid; nothing may imply something is missing.

## 7. References — these only

- `specifications/mockups/01-academics/academics-class-types.html` — **this chunk's mockup. Read it for layout and composition.** Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.**
- `specifications/mockups/01-academics/academics-class-types.md`
- `specifications/mockups/_shared/_visual-recipes.md` — **exact visual values**, used literally.
- `tabs/01-academics.md` **§4.1-N only** (plus §3.3 for the entities and §6 #57–59)

## 8. Components to reuse

`tabs` · `card` · `badge` · `progress` · `collapsible` · `dropdown-menu` · `toggle-group` (type chips) · `input` · `checkbox` · `separator` · `sonner`. The draft rail is `progress`-adjacent — build it from existing primitives, **do not add a stepper dependency**.

## 9. Done when

- [ ] `ClassWorkspace.type` added with a versioned lossless migration; existing classes → `stem`.
- [ ] Exactly three types; no fourth; no per-feature toggle checklist.
- [ ] Add-class flow: three chips, suggestion prefilled **with its reason**, nothing preselected when confidence is low, ≤5 seconds.
- [ ] One page, three configurations — **only the third sub-tab and the primary action vary**. No forked page components.
- [ ] Writing surfaces build: draft rail with **self-target separate from the professor's deadline**, readings with status chips + term strip, feedback themes surfacing only on repeat.
- [ ] Class cards: same shell, one differing signal line, **no type badge**.
- [ ] Daily list ordered by urgency across all classes, **never grouped by type**; verb chips present.
- [ ] **Grep proves zero reads of `type`** in GPA, BCPM, requirement audit, Planner, Overview.
- [ ] Type changes non-destructive both ways, verified by switching and switching back.
- [ ] Readings degradation: honest empty state, three entry paths, **debt suppressed without a complete list**.
- [ ] Per-type empty states; nothing implies a non-STEM class counts less.
- [ ] AA light + dark; keyboard + focus + reduced-motion; `npm run build` passes.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(academics): class types`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 10. Report

Diff summary + the grep result proving no `type` reads in the GPA/BCPM/requirements/Planner/Overview paths.

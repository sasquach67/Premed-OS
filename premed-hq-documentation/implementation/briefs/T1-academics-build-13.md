# T1 · Academics — Planner board

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The Planner term board in the ruled **A + C** composition — the
whole-plan board with the selected-course inspector on demand. Frontend and
backend. It does **not** build the four planning-decision states it unblocks.

---

## 1. Fidelity audit

### a. Spec → paper

Pass. `academics-planner-prototype.html` + `.md`, **A + C ruled Aug 19, 2026**
(`1ba9c7e`), with the six-point inspector handoff and mobile recorded.

### b. Mockup → app

**Missing.** The Planner tab is a GPA ring panel, a What-if card, and per-term
`TrackerTable` collapsibles. There is no term board, no course chip, no MCAT
divider, no unplaced tray, and no outcome rail.

### c. Already built — reuse, do not fork

- **`gpaStats(courses)`** ([selectors.ts:26](../../../src/lib/selectors.ts)) is
  the AMCAS cumulative/BCPM/AO calculation. **Do not write a second GPA maths.**
- **`termToMonths(term)`** ([mcatTiming.ts](../../../src/lib/academics/mcatTiming.ts))
  already parses `"Fall 2026"` into an orderable month index — that is exactly
  the term ordering this board needs, and the MCAT divider needs the same
  scale. Reuse it rather than parsing terms twice.
- `RequirementItem` already carries `satisfiedBy`, `verificationStatus`
  (`verified` | `needs-verification`) and `sourceLabel`. **Mapping confidence is
  a field that exists** — the inspector reads it, never invents it.
- `Course.prereqOf` and `Course.notes` already record prerequisite intent and
  the spring-only warning the demo seed sets.
- The existing per-term `TrackerTable` collapsibles stay: the board is the
  sequencing view, the tables remain the editing surface. **The board never
  becomes a second editor.**

### d. Gate

**Passes.** `BUILD-MANIFEST.md` carries
`01-academics/academics-planner-prototype.html` as **`YES`**, and the lab entry
is now `approved`.

### e. Decisions file

**Passes** as of the Stage-B pass — composition, handoff, and mobile recorded.

### f. Integrations and services

**None.** Courses, requirements, and one MCAT date, all local. **No ANDY
CHECKLIST.**

---

## 2. The work

### Backend — `src/lib/academics/planner.ts` (new)

1. `plannerTerms(courses, { mcatDate })` → ordered columns
   `{ term, months, courses, credits, bcpmCredits, registered }`, sorted by
   `termToMonths`. **Terms it cannot parse (`Unscheduled`) are not dropped** —
   they land in a trailing unplaced column, because a course with no term is
   exactly what the board exists to surface.
2. `mcatDividerAfter(columns, mcatDate)` → the term index the MCAT falls after,
   or `undefined` with no date. **The divider is absent, never guessed.**
3. `unplacedRequirements(requirements, courses)` → open requirements whose
   `satisfiedBy` codes match no recorded course. Each keeps its
   `verificationStatus`, so the tray can distinguish a verified gap from an
   inferred one.
4. `courseEffects(course, requirements, courses)` → the inspector's payload:
   named requirements this course clears **with their confidence**, downstream
   courses whose `prereqOf` names it, and an offering risk when
   `Course.notes` records one. Returns **no score and no ranking**.
5. `outcomeProjection(courses)` → `gpaStats` for graded work plus the credits
   still in progress, stated as inputs. **No "on track" verdict, no composite,
   no badge** (U-9). It reports numbers that exist and names what they exclude.
6. `prereqVsMcat(courses, mcatDate)` → prerequisites placed at or after the
   MCAT, named individually. Empty when there is no date.
7. `planner.test.ts` — term ordering including unparseable terms, the divider
   absent without a date, verified vs inferred preserved end to end, effects
   returning no numeric field, and a registered term never reordered.

### Frontend — `src/components/academics/PlannerBoard.tsx` (new)

8. **A · the board.** Horizontal term columns, each headed with term, credit
   total, and BCPM share. Course chips carry code, title, credits, and a
   BCPM/AO mark. Columns scroll horizontally; the board never wraps a term.
9. **The MCAT divider** is a full-height marker *between* two columns, not a
   chip and not a sidebar item.
10. **The unplaced tray** sits above the board and is always visible.
11. **The outcome rail** occupies the right-hand column by default: projected
    cumulative and BCPM with their inputs named, credits in progress, open
    requirement count **and the named list**, and the prereq-vs-MCAT list.
12. **C · the inspector**, per the ruled handoff: opens from a chip, marks that
    chip, **replaces the outcome rail** rather than rendering beside it,
    replaces its own contents when another chip is selected, and commits
    nothing. Closing restores the rail.
13. Mobile: columns scroll, rail moves beneath the board, inspector becomes a
    full-width panel, tray stays above the fold.
14. Mounted at the top of the Planner tab, above `PlanningDecisions` and the
    existing ledger.

---

## 3. Do not break

- U-9: no readiness score, composite, ranking, or "on track" badge anywhere on
  the board or rail.
- A requirement mapping renders **verified or inferred, and says which**.
- No suggestion is auto-placed into a term; the board proposes nothing.
- A registered term is a factual boundary — never reordered, rebalanced, or
  enrolled/dropped by this surface.
- A spring-only course is never silently shown as a fall placement.
- The board is not an editor: `TrackerTable` keeps that job.
- Do not fork `gpaStats` or re-parse terms.

## 4. Done when

- [ ] Terms render in real chronological order, with unscheduled courses visible.
- [ ] The MCAT divider appears only with a date, and in the right position.
- [ ] Selecting a chip replaces the rail with the inspector; closing restores it.
- [ ] Requirement effects show confidence, and no numeric score is returned.
- [ ] `npm run build` passes; suite green; verified in the running app.

## 5. Commit

`feat(academics): add the Planner term board and course inspector (§4.2)`

## 6. Next stage

The four planning-decision states this unblocks — requirement preview, plan
comparison, substitute choice, registered term — each as its own pass.

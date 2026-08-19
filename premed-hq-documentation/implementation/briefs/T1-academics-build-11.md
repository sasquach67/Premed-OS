# T1 · Academics — Planning decisions

**Stage:** C · DECIDED, NOT BUILT — **built in part, and the part is named.**

**Scope:** Of this surface's six states, **two are buildable on records that
exist and four are not.** This brief builds MCAT timing (#64) and the advisor
export, and names the owner of each state it does not build.

---

## 1. Fidelity audit

### a. Spec → paper

Pass. `academics-planning-decisions.html` draws six states; the `.md` records
behaviour, appearance, component translation, and states, with no variant open.

### b–c. Mockup → app, and what exists

**The Planner tab is a GPA and course ledger, not a term board.**
`Academics.tsx` renders AMCAS GPA rings and a course table. There is no term
board, no course ticket, no saved plan, and no substitution model anywhere in
`src/`.

| State | Needs | Buildable now? |
|---|---|---|
| Requirement preview | A planner **term board** with selectable course tickets | **No** — owned by `academics-planner-prototype.html` |
| Plan comparison | A **saved-plan model** that does not exist | **No** |
| Substitute choice | A **course catalog** with alternatives | **No** |
| Registered term | A per-term **registered flag** | **No** — trivial, but meaningless without the board |
| **MCAT timing (#64)** | `Course.term` + `data/mcat-content.json` — **both exist** | **YES** |
| **Advisor export** | Courses + requirements — **both exist** | **YES** |

**Reuse, do not fork:** `TrackerTable` owns the audit, the Planner owns the
course ledger, `unc-requirements.json` owns requirement text, and
`premed-hq-documentation/data/mcat-content.json` owns MCAT structure — it
carries `sections` (with question counts) and a `prereqMap` of UNC courses per
section, each with a confidence and a source URL.

### d. Gate

Passes — the mockup is **`YES`**.

### e. Decisions file

Passes.

### f. Integrations and services

**None.** Local records plus one checked-in JSON file. **No ANDY CHECKLIST.**

---

## 2. The work

### Backend — `src/lib/academics/mcatTiming.ts` (new)

1. `courseSections(course)` → the MCAT sections a course feeds, from
   `prereqMap`, matched on course **code prefix** (`CHEM 262` → `CHEM 261/262`).
   **Unmatched is the common case and returns nothing** — no course is guessed
   into a section.
2. `monthsBefore(course, target)` → months from the course's term to the MCAT
   date, or to a **planning window** when no date is set. The fallback is named
   in the output, never silently substituted.
3. `relearningOrder(courses, sections, target)` → courses ordered by
   `months elapsed × section weight`, where weight is the section's share of
   total scored questions.
   **⚠️ The ordering is ordinal and the number never surfaces.** §4.1 asks for
   a ranked list; U-9 forbids a readiness score, gauge, or retention
   percentage. The decisions file resolves this precisely: ordinal marks with a
   sentence naming the evidence, and no metric. `relearningOrder` therefore
   returns `{ course, position, evidence }` and **exposes no score field at
   all** — it cannot be rendered because it is not returned.
4. `mcatTiming.test.ts` — matching by code prefix, unmatched courses excluded,
   the planning-window fallback labelled, ordering stable, and **no numeric
   score on the returned shape**.

### Backend — `src/lib/academics/advisorExport.ts` (new)

5. `buildAdvisorSnapshot({ courses, requirements, catalogDate, now })` → plain
   text carrying terms included, catalog source date, open requirements **named
   rather than counted**, substitution state, and the explicit line that this
   is not a degree audit, an enrollment action, or official approval.
6. `advisorExport.test.ts` — every open requirement appears by name, the
   not-official line is present, and the catalog date is never omitted.

### Frontend — `src/components/academics/PlanningDecisions.tsx` (new)

7. **MCAT timing** as a reading path: violet ordinal marks, one sentence of
   named evidence under each, and the "what this does not know" note when
   courses have no tracked topic history. No table, no gauge.
8. **Advisor export** as a paper-like snapshot with a copy action.
9. Mounted in the Planner tab beneath the existing ledger.

---

## 3. Do not break

- No score, gauge, percentage, or retention claim anywhere near MCAT timing.
- A course with no `prereqMap` match is **absent**, never guessed in.
- The planning window is always labelled as a fallback for a missing date.
- The advisor snapshot never claims to be official, and never hides an open
  requirement behind a count.
- Do not build a planner board, a saved-plan model, or a substitution engine
  here — they belong to the planner surface and would be a second owner.

## 4. Done when

- [ ] MCAT timing renders ordinal order with named evidence and no metric.
- [ ] `grep -n "score" src/lib/academics/mcatTiming.ts` shows no returned field.
- [ ] The advisor snapshot names every open requirement and its catalog date.
- [ ] The four unbuilt states are recorded above with their owners.
- [ ] Build passes; suite green; verified in the running app.

## 5. Commit

`feat(academics): add MCAT relearning order and the advisor snapshot (§4.1)`

## 6. Next stage

The four remaining states unblock only when the planner term board is built —
`academics-planner-prototype.html`, manifest `YES`, currently PROTOTYPE. That
is the next real Academics chunk, and it is bigger than any single pass here.

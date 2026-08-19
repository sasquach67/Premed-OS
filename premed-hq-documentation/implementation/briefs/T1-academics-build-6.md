# T1 · Academics — Grade decisions

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The §4.1 grade-decision record layer inside **Planning → Grades &
archive** — its four state views (`regrade`, `policy`, `incomplete`,
`mistakes`) and the records they read. Frontend and backend in this one brief.

---

## 1. Fidelity audit

### a. Spec → paper

**Pass.** `tabs/01-academics.md` §4.1 #44 (regrade window), #47 (mistake-cause
profile), #48 (blanking vs not-knowing), #50 (policy-aware projection) are drawn
by `academics-grade-decisions.html` as four state views of one record treatment.

### b. Mockup → app

**Missing entirely.** `grep -rn "AcademicMistake\|regrade" src/` returns
nothing. Grades & archive currently renders `<ClassCenter archiveOnly />`
([Academics.tsx:298](../../../src/pages/Academics.tsx)) with no record-detail
layer.

### c. Already built — do not rebuild

- `ClassCenter archiveOnly` is the parent surface and **stays as it is**; this
  is a layer inside it, not a replacement gradebook.
- `GradeCategory` already exists with `weight`, `policyNote`, `source`. Extend
  it; do not invent a parallel category model.
- `WhatIf` in `ClassHub` is the scratch projection and is explicitly *not* the
  policy view. Leave it alone.
- `learningSignals.ts`, `topicLinks.ts`, `studyMethod.ts`, `forgettingCurve.ts`
  are untouched by this brief.

### d. Gate

**Passes.** `BUILD-MANIFEST.md` carries `01-academics/academics-grade-decisions.html`
as **`YES`** (Andy, Aug 18 2026).

### e. Decisions file

**Passes.** `academics-grade-decisions.md` records behaviour and appearance and
states plainly that the four views are **states of one treatment, not visual
variants** — so there is no variant left to choose.

### f. Integrations and services

**None.** Everything derives from local records. No Canvas, no instructor API,
no AI. **No ANDY CHECKLIST items.**

⚠️ **Canvas (#61) would populate `returnedAt` automatically and is not built.**
Until then these fields are student-entered, and a surface that has no date
must say so rather than assume one.

---

## 2. The records this needs

Two additions. **Both are additive and optional**, so old data reads correctly
without transformation — but the new collection still ships a versioned
migration per `CLAUDE.md`, following `taskHorizonsV18` as the template.

1. `ClassAssignment.returnedAt?: string` and `regradeDeadline?: string` —
   optional ISO dates. Absent means unknown, never "expired".
2. `GradeCategory.dropLowestCount?: number`, `replacementRule?: boolean`,
   `curvePublished?: boolean` — each **tri-state through optionality**:
   `undefined` = the course policy was never recorded, which is a different
   thing from `false` = recorded as not applying. The policy view must render
   those two differently.
3. `AcademicMistake` — new entity, new `classCenter.mistakes[]` array:
   `{ id, courseId, assignmentId?, topicId?, label, cause?, note?, createdAt,
   updatedAt, order }` where `cause` is `'blanked' | 'didnt-know'` and
   **absent is a first-class state** ("needs a mark").
4. `migrateGradeDecisionsV19` — adds the empty array when missing. Pure,
   idempotent, invents no mistake and no date.

---

## 3. The work

### Backend — `src/lib/academics/gradeDecisions.ts` (new)

1. `regradeWindow(assignment, now)` → `{ state: 'open' | 'closed' | 'unknown',
   closesOn?, daysLeft? }`. **`unknown` when no deadline is recorded** — never
   inferred from the returned date.
2. `appliedPolicies(category)` → one row per rule: `applied | not-applied |
   not-recorded`, each with the source phrase. **`not-recorded` never renders
   as a number and never silently becomes `not-applied`.**
3. `missingInputs(categories, assignments)` → the unresolved course facts that
   block a calculation, most-blocking first. A category with no weight is the
   canonical case.
4. `mistakeRoute(mistake)` → `'recall' | 'material' | 'needs-mark'`;
   `blanked` → retrieval practice, `didnt-know` → source material.
5. `patternIsReportable(mistakes)` → false below the sample floor, so no
   single item becomes a trend, a diagnosis, or a professor model.
6. `gradeDecisions.test.ts` covering every rule above, especially the
   `not-recorded` ≠ `not-applied` distinction and the sample floor.

### Frontend — `src/components/academics/GradeDecisions.tsx` (new)

7. Four states of **one** record treatment, solid-with-depth, sharing one
   hierarchy: eyebrow → statement → evidence → exactly one action.
8. `regrade` — paper-like source record beside a narrow decision note. The
   deadline is factual and calm; the action is **"Open returned work"**, never
   "Appeal". Premed OS never claims a regrade is justified.
9. `policy` — a slim spine of rules with a reading sequence of what the
   calculation used, each carrying its source line. No oversized metric.
10. `incomplete` — one unresolved fact, one recovery path, **no zero and no
    speculative outcome**.
11. `mistakes` — a quiet annotated record, cause labels at left, and the
    evidence-boundary rail at right. No chart.
12. Mounted inside Grades & archive beneath the existing archive content.

---

## 4. Do not break

- **U-9:** no readiness score, composite, rank, or progress bar. A projection
  that cannot name its policy is not shown at all.
- **U-5:** `incomplete` states the missing fact; it is not a styled void.
- Premed OS never asserts a regrade is warranted, never estimates an unpublished
  curve, and never converts one marked mistake into a diagnosis or a forecast.
- `not-recorded` and `not-applied` stay visibly different everywhere.
- Mistake causes are **student-marked only** — nothing infers one.
- The new array ships with its migration; no existing field changes meaning.
- Signed-out mode and both themes identical.

## 5. Done when

- [ ] All four states render from real records, with none simulated.
- [ ] A missing weight blocks the calculation and says which fact is missing.
- [ ] An unrecorded curve is visibly different from a curve recorded as absent.
- [ ] A single mistake never produces a pattern claim.
- [ ] Migration is pure and idempotent, with a test.
- [ ] `npm run build` passes; full suite green.

## 6. Commit

`feat(academics): add the grade-decision record layer (§4.1)`

## 7. Next stage

Materials extensions and lecture capture remain decided-not-built; Planning's
three surfaces follow. Canvas (#61) populating `returnedAt` is a later,
separate pass.

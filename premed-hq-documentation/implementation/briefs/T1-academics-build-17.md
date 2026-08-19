# T1 · Academics — Saved plans and plan comparison

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The `SavedPlan` entity, the comparison state of planning decisions,
and a restore that cannot corrupt a transcript.

---

## 1. The decision this rested on

Plan comparison was blocked not on schema but on **what restore does to a
course that has since been graded**. Save "Plan A" in September with CHEM 262
planned for Fall 2027; by December you have taken it and earned a B+. Restoring
naively would move it back, or discard the grade, or mark it planned again —
each silently corrupting the record every other surface reads.

**Ruled (Andy, Aug 19 2026): never touch a completed or graded course, and show
the rest as a diff to confirm.** That is the same shape as every other ruling
here — propose-then-confirm, nothing auto-written, nothing deleted.

## 2. Audit

- **Drawn:** `academics-planning-decisions.html` state `compare` — two paper
  plan sheets bridged by a neutral `OR`, with **neither coloured as the
  recommended one**, and an advisor-export boundary note.
- **Not built:** nothing in `types.ts` stores a plan version; `courses` is one
  mutable list.
- **Gate:** the mockup is **`YES`**. **Integrations:** none.

## 3. The records

1. `SavedPlan { id, name, note?, createdAt, updatedAt, order, placements:
   SavedPlacement[] }` where `SavedPlacement = { courseId, term, status }`.
   Status is captured so restore can tell what the course *was* when saved.
2. `migrateSavedPlansV23` — adds `savedPlans[]`. Pure, idempotent.

## 4. The work

### `src/lib/academics/savedPlans.ts` (new)

3. `capturePlan(courses, name)` → a snapshot of every course's term and status.
4. `planDiff(plan, courses)` → `{ changes, skipped }`:
   - **`skipped`** — any course now `completed`, or carrying a grade. Each
     keeps a stated reason. **These are never proposed**, not even as an
     unchecked row: an option to corrupt a transcript should not be one click
     away.
   - **`changes`** — a course whose term differs and which is still safe to
     move, as `{ course, from, to }`.
   - A course in the plan but since deleted is skipped with its own reason
     rather than resurrected.
   - A course added since the snapshot is **left alone**, never removed —
     restoring a plan is not the same as reverting the world to it.
5. `applyPlanRestore(courses, changes)` → writes `term` only, on the confirmed
   subset.
6. `savedPlans.test.ts` — graded and completed courses never appear in
   `changes`, a deleted course does not return, a newly added course survives
   restore, and restore writes `term` and nothing else.

### Frontend — extend `PlanningDecisions.tsx`

7. Two saved plans side by side, **neither styled as recommended**, each
   showing its course sequence.
8. `Restore` opens the diff: what would move, and — stated, not hidden — what
   will not be touched and why.
9. Save-current-plan action, named.

## 5. Do not break

- **A completed or graded course is never moved, and never offered as movable.**
- Restore writes `term` only: never status, grade, credits, or BCPM.
- Nothing is deleted by restoring. A course added since the snapshot stays.
- Neither plan is presented as recommended (`.md`: "Neither plan is colored as
  the recommended one").
- U-9: no plan score, no "better plan" verdict.

## 6. Done when

- [ ] A plan can be saved, listed, compared, and restored through a diff.
- [ ] Graded/completed courses are excluded from changes, with a reason shown.
- [ ] Restore writes only `term`, proven by test.
- [ ] Migration pure and idempotent.
- [ ] Build passes; suite green.

## 7. Commit

`feat(academics): add saved plans and a restore that cannot corrupt a transcript`

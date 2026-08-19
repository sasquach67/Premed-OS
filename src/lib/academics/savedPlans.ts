/**
 * Saved plans and restore (§4.1 plan comparison).
 *
 * ⚠️ **`courses` is one shared live list.** The transcript, Tar Heel Tracker,
 * Class Center and the Planner all read it. So restore is the dangerous
 * operation in this file, and every rule below exists to keep it from
 * corrupting a record the student cannot easily rebuild.
 *
 * Ruled by Andy, Aug 19 2026:
 *   1. **A completed or graded course is never moved** — and is never even
 *      offered as movable. An option to corrupt a transcript should not be one
 *      click away, not even unchecked.
 *   2. **The rest is a diff the student confirms**, never an applied change.
 *
 * Two consequences worth stating because they are easy to get backwards:
 *   • A course in the snapshot but since deleted is **not resurrected**.
 *   • A course added since the snapshot is **left alone**. Restoring a plan is
 *     not reverting the world to it.
 */
import { uid } from '@/lib/id'
import type { Course, SavedPlacement, SavedPlan } from '@/lib/types'

/**
 * Grades that record no outcome. `IP` in particular is an in-progress marker
 * wearing a grade's clothes — `selectors.ts` already excludes the same set from
 * GPA, and treating it as a real grade here produced the nonsense line
 * "Graded IP; its record stays exactly as it is."
 */
const PLACEHOLDER_GRADES = new Set(['', 'P', 'NP', 'IP'])

export function hasRealGrade(course: Course): boolean {
  return !PLACEHOLDER_GRADES.has((course.grade ?? '').trim().toUpperCase())
}

/**
 * A course whose record must not be rewritten by a plan restore.
 *
 * Three cases, and they are protected for two different reasons: a completed or
 * graded course carries an outcome that a term change would falsify, and a
 * course in progress is one the student is sitting in right now — moving it to
 * another term would describe a semester they are not having.
 */
export function isProtected(course: Course): boolean {
  return course.status === 'completed' || course.status === 'in-progress' || hasRealGrade(course)
}

export function capturePlan(
  courses: Course[],
  { name, note, now = Date.now(), order = 0 }: { name: string; note?: string; now?: number; order?: number },
): SavedPlan {
  return {
    id: uid(),
    name: name.trim() || 'Untitled plan',
    note,
    placements: courses.map((course): SavedPlacement => ({
      courseId: course.id,
      term: course.term,
      status: course.status,
    })),
    createdAt: now,
    updatedAt: now,
    order,
  }
}

export interface PlanChange {
  course: Course
  from: string
  to: string
}

export interface PlanSkip {
  courseId: string
  label: string
  reason: string
}

export interface PlanDiff {
  changes: PlanChange[]
  skipped: PlanSkip[]
}

/**
 * What restoring this plan would and would not do.
 *
 * `skipped` is not a warning list — it is the set of records this operation
 * refuses to touch, stated so the student knows the restore is partial before
 * they confirm it.
 */
export function planDiff(plan: SavedPlan, courses: Course[]): PlanDiff {
  const byId = new Map(courses.map((course) => [course.id, course]))
  const changes: PlanChange[] = []
  const skipped: PlanSkip[] = []

  for (const placement of plan.placements) {
    const course = byId.get(placement.courseId)
    if (!course) {
      skipped.push({
        courseId: placement.courseId,
        label: placement.courseId,
        reason: 'No longer in your course list; restoring will not bring it back.',
      })
      continue
    }
    if (isProtected(course)) {
      skipped.push({
        courseId: course.id,
        label: course.code,
        reason: hasRealGrade(course)
          ? `Graded ${course.grade}; its record stays exactly as it is.`
          : course.status === 'in-progress'
            ? 'You are taking it this term; a plan restore will not move it.'
            : 'Already completed; its record stays exactly as it is.',
      })
      continue
    }
    if (course.term === placement.term) continue
    changes.push({ course, from: course.term, to: placement.term })
  }
  return { changes, skipped }
}

/**
 * Apply the confirmed subset. Writes `term` and nothing else — a saved plan
 * knows where a course sat, and knows nothing about its grade, credits, or
 * whether it counts as BCPM.
 */
export function applyPlanRestore(
  courses: Course[],
  changes: PlanChange[],
): Course[] {
  const moves = new Map(changes.map((change) => [change.course.id, change.to]))
  return courses.map((course) => {
    const term = moves.get(course.id)
    // Belt and braces: even a hand-built change list cannot move a protected course.
    if (term == null || isProtected(course)) return course
    return { ...course, term }
  })
}

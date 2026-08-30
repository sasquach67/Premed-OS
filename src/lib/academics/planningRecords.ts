import type { Course, PlannerTerm } from '@/lib/types'
import { isProtected } from '@/lib/academics/savedPlans'

export type PlanningRecordResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

export function addPlannerTermRecord(
  terms: readonly PlannerTerm[],
  input: Pick<PlannerTerm, 'id' | 'label' | 'kind'> & Partial<Pick<PlannerTerm, 'note'>>,
  now = Date.now(),
): PlanningRecordResult<PlannerTerm[]> {
  const label = input.label.trim()
  if (!label) return { ok: false, error: 'Term label is required.' }
  if (terms.some((term) => term.id === input.id)) return { ok: false, error: 'Term id already exists.' }
  if (terms.some((term) => term.label.trim().toLowerCase() === label.toLowerCase())) {
    return { ok: false, error: 'A term with this label already exists.' }
  }
  const term: PlannerTerm = {
    id: input.id,
    label,
    kind: input.kind,
    origin: 'student-created',
    note: input.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    order: terms.length,
  }
  return { ok: true, value: [...terms, term] }
}

export function updatePlannerTermRecord(
  terms: readonly PlannerTerm[],
  id: string,
  patch: Partial<Pick<PlannerTerm, 'label' | 'kind' | 'note' | 'lockedAt' | 'lockReason'>>,
  now = Date.now(),
  courses: readonly Course[] = [],
): PlanningRecordResult<PlannerTerm[]> {
  const current = terms.find((term) => term.id === id)
  if (!current) return { ok: false, error: 'Term was not found.' }
  const label = patch.label == null ? current.label : patch.label.trim()
  if (!label) return { ok: false, error: 'Term label is required.' }
  if (terms.some((term) => term.id !== id && term.label.trim().toLowerCase() === label.toLowerCase())) {
    return { ok: false, error: 'A term with this label already exists.' }
  }
  if (patch.kind === 'gap' && courses.some((course) => course.plannerTermId === id)) {
    return { ok: false, error: 'Move linked course records before changing this term into a gap.' }
  }
  const updated: PlannerTerm = {
    ...current,
    ...patch,
    label,
    note: patch.note == null ? current.note : patch.note.trim() || undefined,
    lockReason: patch.lockReason == null ? current.lockReason : patch.lockReason.trim() || undefined,
    updatedAt: now,
  }
  return { ok: true, value: terms.map((term) => term.id === id ? updated : term) }
}

export function removePlannerTermRecord(
  terms: readonly PlannerTerm[],
  courses: readonly Course[],
  id: string,
): PlanningRecordResult<PlannerTerm[]> {
  const current = terms.find((term) => term.id === id)
  if (!current) return { ok: false, error: 'Term was not found.' }
  if (current.lockedAt) return { ok: false, error: 'Unlock the term before removing it.' }
  if (courses.some((course) => course.plannerTermId === id)) {
    return { ok: false, error: 'Move or remove linked course records before removing this term.' }
  }
  return {
    ok: true,
    value: terms.filter((term) => term.id !== id).map((term, order) => ({ ...term, order })),
  }
}

export function placeCourseInPlannerTerm(
  courses: readonly Course[],
  terms: readonly PlannerTerm[],
  courseId: string,
  termId: string,
): PlanningRecordResult<Course[]> {
  const course = courses.find((row) => row.id === courseId)
  if (!course) return { ok: false, error: 'Course was not found.' }
  if (isProtected(course)) return { ok: false, error: 'Completed, graded, or in-progress courses cannot be moved.' }
  const destination = terms.find((term) => term.id === termId)
  if (!destination) return { ok: false, error: 'Destination term was not found.' }
  if (destination.kind === 'gap') return { ok: false, error: 'Courses cannot be placed into a gap term.' }
  if (destination.lockedAt) return { ok: false, error: 'Unlock the destination term before moving a course.' }
  const source = course.plannerTermId ? terms.find((term) => term.id === course.plannerTermId) : undefined
  if (source?.lockedAt) return { ok: false, error: 'Unlock the current term before moving this course.' }
  return {
    ok: true,
    value: courses.map((row) => row.id === courseId
      ? { ...row, plannerTermId: destination.id, term: destination.label }
      : row),
  }
}

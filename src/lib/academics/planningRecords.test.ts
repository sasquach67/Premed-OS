import { describe, expect, it } from 'vitest'
import type { Course, PlannerTerm } from '@/lib/types'
import {
  addPlannerTermRecord,
  placeCourseInPlannerTerm,
  removePlannerTermRecord,
  updatePlannerTermRecord,
} from './planningRecords'

const course = (patch: Partial<Course> = {}): Course => ({
  id: 'chem', term: '', code: 'CHEM 262', title: 'Organic Chemistry II', credits: 3,
  grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0,
  ...patch,
})
const term = (patch: Partial<PlannerTerm> = {}): PlannerTerm => ({
  id: 'fall', label: 'Fall 2027', kind: 'standard', origin: 'student-created',
  createdAt: 1, updatedAt: 1, order: 0, ...patch,
})

describe('Planning term and course records', () => {
  it('adds, edits, and removes an empty term without mutating the input', () => {
    const original: PlannerTerm[] = []
    const added = addPlannerTermRecord(original, { id: 'fall', label: ' Fall 2027 ', kind: 'standard' }, 10)
    expect(added.ok).toBe(true)
    expect(original).toEqual([])
    if (!added.ok) return
    const updated = updatePlannerTermRecord(added.value, 'fall', { note: ' Before MCAT ' }, 20)
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value[0]).toMatchObject({ label: 'Fall 2027', note: 'Before MCAT', updatedAt: 20 })
    expect(removePlannerTermRecord(updated.value, [], 'fall')).toEqual({ ok: true, value: [] })
  })

  it('rejects duplicates, linked deletion, gap placement, and locked moves', () => {
    expect(addPlannerTermRecord([term()], { id: 'other', label: 'fall 2027', kind: 'standard' }).ok).toBe(false)
    expect(removePlannerTermRecord([term()], [course({ plannerTermId: 'fall' })], 'fall').ok).toBe(false)
    expect(updatePlannerTermRecord([term()], 'fall', { kind: 'gap' }, 2, [course({ plannerTermId: 'fall' })]).ok).toBe(false)
    expect(placeCourseInPlannerTerm([course()], [term({ kind: 'gap' })], 'chem', 'fall').ok).toBe(false)
    expect(placeCourseInPlannerTerm([course()], [term({ lockedAt: 2 })], 'chem', 'fall').ok).toBe(false)
  })

  it('places only an editable course and preserves every other course field', () => {
    const original = course({ notes: 'recorded note' })
    const placed = placeCourseInPlannerTerm([original], [term()], 'chem', 'fall')
    expect(placed.ok).toBe(true)
    if (!placed.ok) return
    expect(placed.value[0]).toEqual({ ...original, plannerTermId: 'fall', term: 'Fall 2027' })
    expect(placeCourseInPlannerTerm([course({ status: 'completed' })], [term()], 'chem', 'fall').ok).toBe(false)
  })
})

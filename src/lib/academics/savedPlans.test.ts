import { describe, expect, it } from 'vitest'
import {
  applyPlanRestore, applyPlannerTermRestore, capturePlan, hasRealGrade, isProtected, planDiff, plannerTermDiff,
} from '@/lib/academics/savedPlans'
import type { Course, PlannerTerm } from '@/lib/types'

const now = Date.UTC(2026, 8, 19)
const course = (id: string, patch: Partial<Course> = {}): Course => ({
  id, term: 'Fall 2027', code: id.toUpperCase(), title: id, credits: 3, grade: '',
  bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0, ...patch,
})

describe('capturing a plan', () => {
  it('records each course’s term and what it was at the time', () => {
    const plan = capturePlan([course('chem262', { status: 'planned', plannerTermId: 'fall-2027' })], { name: 'Plan A', now })
    expect(plan.placements).toEqual([{ courseId: 'chem262', term: 'Fall 2027', plannerTermId: 'fall-2027', status: 'planned' }])
    expect(plan.name).toBe('Plan A')
  })

  it('falls back to a real name rather than an empty one', () => {
    expect(capturePlan([], { name: '   ', now }).name).toBe('Untitled plan')
  })
})

describe('saved planner slots', () => {
  const fall: PlannerTerm = { id: 'fall', label: 'Fall 2027', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 }
  const summer: PlannerTerm = { id: 'summer', label: 'Summer 2027', kind: 'summer', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 1, lockedAt: 1 }

  it('restores a reviewed slot without deleting a newer live slot', () => {
    const plan = capturePlan([], { name: 'A', now, plannerTerms: [fall, summer] })
    const live = [{ ...fall, note: 'Moved after advising' }, { id: 'new', label: 'Gap year', kind: 'gap' as const, origin: 'student-created' as const, createdAt: 2, updatedAt: 2, order: 2 }]
    const changes = plannerTermDiff(plan, live)
    const restored = applyPlannerTermRestore(live, changes)
    expect(restored.find((term) => term.id === 'summer')).toMatchObject({ label: 'Summer 2027', lockedAt: 1 })
    expect(restored.find((term) => term.id === 'new')).toMatchObject({ label: 'Gap year' })
  })
})

describe('a restore can never rewrite a transcript', () => {
  const plan = capturePlan([course('chem262', { term: 'Fall 2027' })], { name: 'Plan A', now })

  it('refuses to move a graded course, and says why', () => {
    const graded = [course('chem262', { term: 'Spring 2027', grade: 'B+' })]
    const diff = planDiff(plan, graded)
    expect(diff.changes).toEqual([])
    expect(diff.skipped[0].reason).toContain('Graded B+')
  })

  it('refuses to move a completed course even with no grade recorded', () => {
    const done = [course('chem262', { term: 'Spring 2027', status: 'completed' })]
    expect(planDiff(plan, done).changes).toEqual([])
    expect(planDiff(plan, done).skipped[0].reason).toContain('Already completed')
  })

  it('never offers a protected course as movable, not even as a row to uncheck', () => {
    // An option to corrupt a transcript should not be one click away.
    const graded = [course('chem262', { term: 'Spring 2027', grade: 'A-' })]
    expect(planDiff(plan, graded).changes.map((c) => c.course.id)).not.toContain('chem262')
  })

  it('refuses even when handed a change list that names one', () => {
    const graded = [course('chem262', { term: 'Spring 2027', grade: 'A-' })]
    const forced = [{ course: graded[0], from: 'Spring 2027', to: 'Fall 2027' }]
    expect(applyPlanRestore(graded, forced)[0].term).toBe('Spring 2027')
  })
})

describe('what a restore leaves alone', () => {
  const plan = capturePlan(
    [course('chem262', { term: 'Fall 2027' }), course('gone', { term: 'Spring 2028' })],
    { name: 'Plan A', now },
  )

  it('does not resurrect a course that has since been deleted', () => {
    const current = [course('chem262', { term: 'Spring 2028' })]
    const diff = planDiff(plan, current)
    expect(diff.changes.map((c) => c.course.id)).toEqual(['chem262'])
    expect(diff.skipped.some((s) => s.courseId === 'gone')).toBe(true)
    expect(applyPlanRestore(current, diff.changes)).toHaveLength(1)
  })

  it('leaves a course added since the snapshot exactly where it is', () => {
    // Restoring a plan is not reverting the world to it.
    const current = [course('chem262', { term: 'Spring 2028' }), course('new', { term: 'Fall 2028' })]
    const restored = applyPlanRestore(current, planDiff(plan, current).changes)
    expect(restored.find((c) => c.id === 'new')?.term).toBe('Fall 2028')
    expect(restored).toHaveLength(2)
  })

  it('proposes nothing when the plan already matches', () => {
    expect(planDiff(plan, [course('chem262', { term: 'Fall 2027' })]).changes).toEqual([])
  })
})

describe('restore writes one field', () => {
  it('changes term and nothing else', () => {
    const plan = capturePlan([course('chem262', { term: 'Fall 2027' })], { name: 'A', now })
    const current = [course('chem262', { term: 'Spring 2028', credits: 4, bcpm: false, grade: '' })]
    const [restored] = applyPlanRestore(current, planDiff(plan, current).changes)
    expect(restored.term).toBe('Fall 2027')
    expect(restored.credits).toBe(4)
    expect(restored.bcpm).toBe(false)
    expect(restored.status).toBe('planned')
  })

  it('identifies a protected course consistently', () => {
    expect(isProtected(course('a', { status: 'completed' }))).toBe(true)
    expect(isProtected(course('a', { grade: 'B' }))).toBe(true)
    expect(isProtected(course('a', { status: 'in-progress' }))).toBe(true)
    expect(isProtected(course('a'))).toBe(false)
  })

  it('does not mistake a placeholder grade for a real one', () => {
    // IP is an in-progress marker wearing a grade's clothes; selectors.ts
    // already excludes the same set from GPA.
    for (const grade of ['IP', 'P', 'NP', ''] as const) {
      expect(hasRealGrade(course('a', { grade }))).toBe(false)
    }
    expect(hasRealGrade(course('a', { grade: 'B+' }))).toBe(true)
  })

  it('explains an in-progress course as in progress, not as graded', () => {
    const plan = capturePlan([course('chem262', { term: 'Fall 2027' })], { name: 'A', now })
    const current = [course('chem262', { term: 'Spring 2028', status: 'in-progress', grade: 'IP' })]
    expect(planDiff(plan, current).skipped[0].reason).toContain('taking it this term')
  })
})

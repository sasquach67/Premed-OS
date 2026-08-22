import { describe, expect, it } from 'vitest'
import {
  UNSCHEDULED, courseEffects, mcatDividerAfter, outcomeProjection,
  plannerTerms, prereqVsMcat, unplacedRequirements,
} from '@/lib/academics/planner'
import type { Course, PlannerTerm, RequirementItem } from '@/lib/types'

const course = (code: string, term: string, patch: Partial<Course> = {}): Course => ({
  id: code, term, code, title: `${code} title`, credits: 3, grade: '', bcpm: true,
  status: 'planned', inResidence: true, satisfies: [], order: 0, ...patch,
})
const requirement = (label: string, patch: Partial<RequirementItem> = {}): RequirementItem => ({
  id: label, group: 'Med Prerequisites', label, done: false, order: 0, ...patch,
})

describe('term columns', () => {
  const courses = [
    course('CHEM 430', 'Fall 2028'),
    course('CHEM 262', 'Fall 2026'),
    course('BIOL 252', 'Spring 2027'),
    course('PHYS 118', UNSCHEDULED),
  ]

  it('orders terms chronologically, not alphabetically', () => {
    expect(plannerTerms(courses).map((column) => column.term))
      .toEqual(['Fall 2026', 'Spring 2027', 'Fall 2028', UNSCHEDULED])
  })

  it('surfaces an unparseable term instead of dropping the course', () => {
    // A course with no usable term is exactly what the board exists to show.
    const last = plannerTerms(courses).at(-1)!
    expect(last.term).toBe(UNSCHEDULED)
    expect(last.courses.map((item) => item.code)).toEqual(['PHYS 118'])
  })

  it('totals credits and the BCPM share per term', () => {
    const mixed = [course('CHEM 262', 'Fall 2026'), course('ENGL 105', 'Fall 2026', { bcpm: false })]
    const [column] = plannerTerms(mixed)
    expect(column.credits).toBe(6)
    expect(column.bcpmCredits).toBe(3)
  })

  it('marks a term registered when any course is completed or in progress', () => {
    const done = plannerTerms([course('CHEM 262', 'Fall 2026', { status: 'completed' })])
    const future = plannerTerms([course('CHEM 430', 'Fall 2028')])
    expect(done[0].registered).toBe(true)
    expect(future[0].registered).toBe(false)
  })

  it('keeps an explicitly created empty summer or gap slot visible', () => {
    const slots: PlannerTerm[] = [{
      id: 'summer-2027', label: 'Summer 2027', kind: 'summer', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0,
    }]
    const [column] = plannerTerms([], slots)
    expect(column).toMatchObject({ id: 'summer-2027', term: 'Summer 2027', kind: 'summer', courses: [] })
  })
})

describe('the MCAT divider', () => {
  const columns = plannerTerms([
    course('CHEM 262', 'Fall 2026'),
    course('BIOL 252', 'Spring 2027'),
    course('CHEM 430', 'Fall 2028'),
  ])

  it('falls after the last term that precedes the test date', () => {
    expect(mcatDividerAfter(columns, '2027-09-10')).toBe(1)
  })

  it('is ABSENT without a date, never guessed into position', () => {
    expect(mcatDividerAfter(columns, undefined)).toBeUndefined()
    expect(mcatDividerAfter(columns, 'not a date')).toBeUndefined()
  })
})

describe('unplaced requirements', () => {
  const requirements = [
    requirement('Biochemistry', { satisfiedBy: ['CHEM 430'] }),
    requirement('Organic II', { satisfiedBy: ['CHEM 262'] }),
    requirement('Already met', { satisfiedBy: ['BIOL 101'], done: true }),
    requirement('No mapping recorded'),
  ]

  it('lists only open requirements no recorded course satisfies', () => {
    const open = unplacedRequirements(requirements, [course('CHEM 262', 'Fall 2026')])
    expect(open.map((item) => item.label)).toEqual(['Biochemistry'])
  })

  it('keeps verification status, so a verified gap reads differently', () => {
    const flagged = [requirement('Biochemistry', { satisfiedBy: ['CHEM 430'], verificationStatus: 'needs-verification' })]
    expect(unplacedRequirements(flagged, [])[0].verificationStatus).toBe('needs-verification')
  })

  it('does not call an unscheduled course a satisfied requirement', () => {
    const open = unplacedRequirements([requirement('Biochemistry', { satisfiedBy: ['CHEM 430'] })], [course('CHEM 430', UNSCHEDULED)])
    expect(open.map((item) => item.label)).toEqual(['Biochemistry'])
  })
})

describe('course effects — the inspector payload', () => {
  const requirements = [
    requirement('Organic II', { satisfiedBy: ['CHEM 262'], verificationStatus: 'verified', sourceLabel: 'UNC catalog' }),
    requirement('Power and Society', { satisfiedBy: ['CHEM 262'], verificationStatus: 'needs-verification' }),
  ]
  const courses = [
    course('CHEM 262', 'Fall 2026', { notes: 'Spring-only offering — confirm placement.' }),
    course('CHEM 430', 'Fall 2028', { prereqOf: 'CHEM 262' }),
  ]

  it('names what the course clears and preserves each mapping confidence', () => {
    const effects = courseEffects(courses[0], requirements, courses)
    expect(effects.clears.map((item) => [item.label, item.confidence])).toEqual([
      ['Organic II', 'verified'],
      ['Power and Society', 'inferred'],
    ])
    expect(effects.clears[0].source).toBe('UNC catalog')
  })

  it('names downstream unlocks from the recorded prerequisite', () => {
    expect(courseEffects(courses[0], requirements, courses).unlocks.map((item) => item.code)).toEqual(['CHEM 430'])
  })

  it('surfaces an offering risk only when the record carries one', () => {
    expect(courseEffects(courses[0], requirements, courses).offeringRisk).toMatch(/Spring-only/)
    expect(courseEffects(courses[1], requirements, courses).offeringRisk).toBeUndefined()
  })

  it('returns nothing numeric — no score can be rendered from it', () => {
    const effects = courseEffects(courses[0], requirements, courses)
    expect(Object.keys(effects).sort()).toEqual(['clears', 'offeringRisk', 'unlocks'])
    expect(JSON.stringify(effects)).not.toMatch(/"score"|"rank"|"readiness"/)
  })
})

describe('the outcome projection', () => {
  it('reports graded GPA and states ungraded credits separately', () => {
    const courses = [
      course('BIOL 103', 'Spring 2026', { grade: 'A', status: 'completed' }),
      course('CHEM 262', 'Fall 2026', { status: 'in-progress' }),
      course('CHEM 430', 'Fall 2028', { status: 'planned' }),
    ]
    const projection = outcomeProjection(courses)
    expect(projection.gradedCredits).toBe(3)
    // In-progress credits are named, never folded into the GPA.
    expect(projection.inProgressCredits).toBe(3)
    expect(projection.plannedCredits).toBe(3)
    expect(projection.cumulative).toBeCloseTo(4, 5)
  })
})

describe('prerequisites against the MCAT', () => {
  const courses = [
    course('CHEM 430', 'Fall 2028', { prereqOf: 'Med prereq' }),
    course('CHEM 262', 'Fall 2026', { prereqOf: 'Med prereq' }),
    course('BIOL 103', 'Spring 2026', { status: 'completed', prereqOf: 'Med prereq' }),
  ]

  it('names each prerequisite placed at or after the test date', () => {
    expect(prereqVsMcat(courses, '2028-01-15').map((item) => item.code)).toEqual(['CHEM 430'])
  })

  it('is empty with no MCAT date rather than assuming one', () => {
    expect(prereqVsMcat(courses, undefined)).toEqual([])
  })

  it('never flags a course already completed', () => {
    expect(prereqVsMcat(courses, '2026-01-15').map((item) => item.code)).not.toContain('BIOL 103')
  })
})

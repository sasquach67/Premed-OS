import { describe, expect, it } from 'vitest'
import {
  PATTERN_SAMPLE_FLOOR, appliedPolicies, missingInputs, mistakeRoute,
  patternIsReportable, regradeWindow, reviewableWork, unmarkedMistakes,
} from '@/lib/academics/gradeDecisions'
import type { AcademicMistake, ClassAssignment, GradeCategory } from '@/lib/types'

const now = Date.UTC(2026, 8, 18)
const DAY = 86_400_000
const iso = (at: number) => new Date(at).toISOString().slice(0, 10)

const work = (patch: Partial<ClassAssignment> = {}): ClassAssignment => ({
  id: 'a1', courseId: 'c1', title: 'Midterm 2', type: 'exam', status: 'graded',
  pointsEarned: 78, pointsPossible: 100, linkedTopicIds: [], linkedFileIds: [],
  createdAt: now, updatedAt: now, order: 0, ...patch,
})
const category = (patch: Partial<GradeCategory> = {}): GradeCategory => ({
  id: 'g1', courseId: 'c1', name: 'Problem sets', weight: 20,
  createdAt: now, updatedAt: now, order: 0, ...patch,
})
const mistake = (patch: Partial<AcademicMistake> = {}): AcademicMistake => ({
  id: 'm1', courseId: 'c1', label: 'Acid–base mechanism',
  createdAt: now, updatedAt: now, order: 0, ...patch,
})

describe('#44 the regrade window', () => {
  it('is open while the instructor deadline is ahead', () => {
    const found = regradeWindow(work({ regradeDeadline: iso(now + 5 * DAY) }), now)
    expect(found.state).toBe('open')
    expect(found.daysLeft).toBe(5)
  })

  it('is closed once it has passed', () => {
    expect(regradeWindow(work({ regradeDeadline: iso(now - 3 * DAY) }), now).state).toBe('closed')
  })

  it('is UNKNOWN, never closed, when no deadline was recorded', () => {
    // Telling a student their window expired without an instructor record
    // would be inventing a policy.
    expect(regradeWindow(work({ returnedAt: iso(now - 20 * DAY) }), now).state).toBe('unknown')
  })

  it('lists only still-actionable returned work, soonest first', () => {
    const items = [
      work({ id: 'late', regradeDeadline: iso(now + 9 * DAY) }),
      work({ id: 'soon', regradeDeadline: iso(now + 2 * DAY) }),
      work({ id: 'gone', regradeDeadline: iso(now - 1 * DAY) }),
      work({ id: 'ungraded', status: 'not-started', regradeDeadline: iso(now + 3 * DAY) }),
    ]
    expect(reviewableWork(items, now).map((item) => item.id)).toEqual(['soon', 'late'])
  })
})

describe('#50 policy disclosure', () => {
  it('separates a policy never recorded from one recorded as not applying', () => {
    const silent = appliedPolicies(category())
    const stated = appliedPolicies(category({ dropLowestCount: 0, replacementRule: false, curvePublished: false }))
    expect(silent.map((row) => row.state)).toEqual(['not-recorded', 'not-recorded', 'not-recorded'])
    expect(stated.map((row) => row.state)).toEqual(['not-applied', 'not-applied', 'not-applied'])
  })

  it('reports an applied drop-lowest with its count and its source', () => {
    const [drop] = appliedPolicies(category({ dropLowestCount: 1, source: 'CHEM 262 syllabus §4' }))
    expect(drop.state).toBe('applied')
    expect(drop.detail).toContain('One completed item is excluded')
    expect(drop.source).toContain('CHEM 262 syllabus §4')
  })

  it('never omits a rule, so silence about a policy is always visible', () => {
    expect(appliedPolicies(category())).toHaveLength(3)
    for (const row of appliedPolicies(category())) expect(row.source.length).toBeGreaterThan(0)
  })

  it('never estimates an unpublished curve', () => {
    const [, , curve] = appliedPolicies(category())
    expect(curve.state).toBe('not-recorded')
    expect(curve.detail).not.toMatch(/\d/)
  })
})

describe('missing inputs', () => {
  it('names the unweighted category and how to resolve it', () => {
    const found = missingInputs([category({ weight: 0 })], [])
    expect(found).toHaveLength(1)
    expect(found[0].fact).toContain('no confirmed weight')
    expect(found[0].recovery).toContain('syllabus')
  })

  it('flags graded work with no points possible', () => {
    const found = missingInputs([], [work({ pointsPossible: undefined })])
    expect(found[0].fact).toContain('records no points possible')
  })

  it('is empty when every fact is present', () => {
    expect(missingInputs([category()], [work()])).toEqual([])
  })
})

describe('#47/#48 mistake evidence', () => {
  it('routes blanking to retrieval and not-knowing to the source', () => {
    expect(mistakeRoute(mistake({ cause: 'blanked' }))).toBe('recall')
    expect(mistakeRoute(mistake({ cause: 'didnt-know' }))).toBe('material')
  })

  it('routes an unmarked mistake back to the student, never to a guess', () => {
    expect(mistakeRoute(mistake())).toBe('needs-mark')
    expect(unmarkedMistakes([mistake(), mistake({ id: 'm2', cause: 'blanked' })])).toHaveLength(1)
  })

  it('refuses to call anything a pattern below the sample floor', () => {
    const marked = (count: number) => Array.from({ length: count }, (_, index) =>
      mistake({ id: `m${index}`, cause: 'blanked' }))
    expect(patternIsReportable(marked(1))).toBe(false)
    expect(patternIsReportable(marked(PATTERN_SAMPLE_FLOOR - 1))).toBe(false)
    expect(patternIsReportable(marked(PATTERN_SAMPLE_FLOOR))).toBe(true)
  })

  it('does not count unmarked records toward the sample', () => {
    const mixed = Array.from({ length: 9 }, (_, index) => mistake({ id: `m${index}` }))
    expect(patternIsReportable(mixed)).toBe(false)
  })
})

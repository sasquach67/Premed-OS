import { describe, expect, it } from 'vitest'
import { termReportEvidence } from '@/lib/academics/termReport'
import type { Course } from '@/lib/types'
import type { TermReportEvidenceInput } from '@/lib/academics/termReport'

const course = (overrides: Partial<Course> = {}): Course => ({
  id: 'chem', term: 'Fall 2026', code: 'CHEM 262', title: 'Organic Chemistry II', credits: 3,
  grade: 'B+', bcpm: true, status: 'completed', inResidence: true, satisfies: [], order: 0,
  ...overrides,
})

function input(overrides: Partial<TermReportEvidenceInput> = {}): TermReportEvidenceInput {
  return {
    courses: [course()],
    term: 'Fall 2026',
    center: { assignments: [], feedbackNotes: [], mistakes: [], notes: [], reviewEvents: [], topics: [], files: [], sourceChunks: [] },
    now: 100,
    ...overrides,
  }
}

describe('termReportEvidence', () => {
  it('keeps facts bounded to completed courses in the selected term', () => {
    const result = termReportEvidence(input({
      courses: [course(), course({ id: 'spring', term: 'Spring 2027', code: 'BIOL 252' })],
      center: {
        assignments: [
          { id: 'chem-exam', courseId: 'chem', title: 'Exam 1', type: 'exam', status: 'graded', pointsEarned: 87, pointsPossible: 100, linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0 },
          { id: 'spring-exam', courseId: 'spring', title: 'Exam 1', type: 'exam', status: 'graded', pointsEarned: 99, pointsPossible: 100, linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 1 },
        ], feedbackNotes: [], mistakes: [], notes: [], reviewEvents: [], topics: [], files: [], sourceChunks: [],
      },
    }))

    expect(result.snapshot.courseIds).toEqual(['chem'])
    expect(result.snapshot.facts.map((item) => item.id)).toContain('assignment:chem-exam')
    expect(result.snapshot.facts.map((item) => item.id)).not.toContain('assignment:spring-exam')
  })

  it('does not turn a course upload into evidence of study behaviour', () => {
    const result = termReportEvidence(input())
    expect(result.eligible).toBe(false)
    if (result.eligible) throw new Error('Expected an honest insufficient-evidence result.')
    expect(result.reason).toContain('Final grades alone')
    expect(result.snapshot.facts.map((item) => item.category)).toEqual(['course'])
  })

  it('preserves missing grades and returns an honest insufficient-evidence reason', () => {
    const result = termReportEvidence(input({ courses: [course({ grade: '' })] }))
    expect(result.eligible).toBe(false)
    if (result.eligible) throw new Error('Expected an honest insufficient-evidence result.')
    expect(result.snapshot.facts).toEqual([])
    expect(result.reason).toContain('no final grade')
  })

  it('makes marked returned-work evidence eligible without inferring a cause', () => {
    const result = termReportEvidence(input({
      center: {
        assignments: [], feedbackNotes: [], notes: [], reviewEvents: [], topics: [], files: [], sourceChunks: [],
        mistakes: [{ id: 'mistake', courseId: 'chem', label: 'Mechanism step', createdAt: 1, updatedAt: 1, order: 0 }],
      },
    }))
    expect(result.eligible).toBe(true)
    expect(result.snapshot.facts.find((item) => item.id === 'mistake:chem')?.detail).not.toContain('caused')
  })
})

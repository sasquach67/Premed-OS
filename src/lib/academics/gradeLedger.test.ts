import { describe, expect, it } from 'vitest'
import type { Course, TranscriptCourseRecord } from '@/lib/types'
import { buildGradeLedger, calculateCourseScenario, formatTruncatedGpa } from './gradeLedger'

const course = (id: string, overrides: Partial<Course> = {}): Course => ({
  id, term: 'Fall 2026', code: 'BIOL 101', title: 'Biology', credits: 3, grade: 'A', bcpm: true,
  status: 'completed', inResidence: true, satisfies: [], order: 0, ...overrides,
})
const record = (id: string, courseId: string, overrides: Partial<TranscriptCourseRecord> = {}): TranscriptCourseRecord => ({
  id, courseId, institution: 'UNC Chapel Hill', courseNumberExact: 'BIOL 101', titleExact: 'Biology', creditsExact: '3', gradeExact: 'A', term: 'Fall', year: '2026', courseType: 'regular', classificationSource: 'Syllabus', classificationReason: 'Primary content is biology', createdAt: 1, updatedAt: 1, order: 0, ...overrides,
})

describe('grade ledger', () => {
  it('keeps every eligible repeat and every recorded institution in AMCAS arithmetic', () => {
    const courses = [course('old', { grade: 'C+', inResidence: false }), course('new')]
    const records = [record('old-record', 'old', { institution: 'Community College', gradeExact: 'C+', courseType: 'repeat' }), record('new-record', 'new')]
    const result = buildGradeLedger(courses, records)
    expect(result.rows).toHaveLength(2)
    expect(result.amcas.credits).toBe(6)
    expect(result.amcas.value).toBeCloseTo(3.15)
  })

  it('never rounds an AMCAS display upward', () => {
    expect(formatTruncatedGpa(3.667)).toBe('3.66')
  })

  it('keeps AMCAS dormant until transcript-faithful input exists', () => {
    const result = buildGradeLedger([course('course')], [])
    expect(result.amcas.value).toBeNull()
    expect(result.amcas.reason).toMatch(/transcript-faithful/i)
    expect(result.trend).toEqual([])
  })

  it('names excluded P/F grades and does not guess a BCPM split without evidence', () => {
    const passFail = buildGradeLedger([course('course')], [record('record', 'course', { gradeExact: 'P' })])
    expect(passFail.amcas.value).toBeNull()

    const unsupportedClassification = buildGradeLedger([course('course')], [record('record', 'course', { classificationSource: '', classificationReason: '' })])
    expect(unsupportedClassification.amcas.value).toBe(4)
    expect(unsupportedClassification.amcas.scienceValue).toBeNull()
    expect(unsupportedClassification.amcas.unclassifiedCount).toBe(1)
  })

  it('does not parse free-text policy notes into calculator behavior', () => {
    const assignments = [
      { id: 'a', courseId: 'c', title: 'Quiz', type: 'quiz' as const, status: 'graded' as const, category: 'Quizzes', pointsEarned: 8, pointsPossible: 10, linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'b', courseId: 'c', title: 'Exam', type: 'exam' as const, status: 'graded' as const, category: 'Exams', pointsEarned: 90, pointsPossible: 100, linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 1 },
    ]
    const categories = [
      { id: 'q', courseId: 'c', name: 'Quizzes', weight: 25, policyNote: 'Drop the lowest two quizzes.', createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'e', courseId: 'c', name: 'Exams', weight: 75, createdAt: 1, updatedAt: 1, order: 1 },
    ]
    const before = JSON.stringify({ assignments, categories })
    const result = calculateCourseScenario({
      assignments,
      categories,
      selectedCategoryId: 'q', assumedPercent: 90,
    })
    expect(result.projectedPercent).toBe(90)
    expect(JSON.stringify({ assignments, categories })).toBe(before)
  })
})

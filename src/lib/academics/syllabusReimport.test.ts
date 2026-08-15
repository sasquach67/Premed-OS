import { describe, expect, it } from 'vitest'
import { syllabusReimportDiff } from './syllabusReimport'

const item = (kind: 'units' | 'deadlines', label: string, value?: string) => ({ id: label, kind, label, value, confidence: 'high' as const, evidence: { quote: label, location: 'line 1' } })
describe('syllabusReimportDiff', () => {
  it('matches by identity so an inserted week does not change later weeks', () => {
    const rows = syllabusReimportDiff({ topics: [{ id: 'one', courseId: 'c', title: 'Week 1', unit: 'Week 1', status: 'not-started', confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 0 }, { id: 'three', courseId: 'c', title: 'Week 3', unit: 'Week 3', status: 'not-started', confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 1 }], assignments: [], categories: [] }, [item('units', 'Week 1'), item('units', 'Week 2'), item('units', 'Week 3')])
    expect(rows.filter((row) => row.status === 'unchanged')).toHaveLength(2)
    expect(rows.filter((row) => row.status === 'added')).toHaveLength(1)
  })

  it('defaults new entries to accept while keeping changed and removed records', () => {
    const current = {
      topics: [{ id: 'one', courseId: 'c', title: 'Week 1', unit: 'Week 1', status: 'not-started' as const, confidence: 3 as const, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 0 }],
      assignments: [],
      categories: [{ id: 'quiz', courseId: 'c', name: 'Quizzes', weight: 20, createdAt: 1, updatedAt: 1, order: 0 }, { id: 'exam', courseId: 'c', name: 'Exam', weight: 80, createdAt: 1, updatedAt: 1, order: 1 }],
    }
    const rows = syllabusReimportDiff(current, [item('units', 'Week 1'), item('units', 'Week 2'), { ...item('units', 'unused'), kind: 'weights' as const, label: 'Quizzes', value: '25%' }])
    expect(rows.find((row) => row.status === 'added')?.defaultAction).toBe('accept')
    expect(rows.find((row) => row.status === 'changed')?.defaultAction).toBe('keep')
    expect(rows.find((row) => row.status === 'removed')?.defaultAction).toBe('keep')
  })
})

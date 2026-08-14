import { describe, expect, it } from 'vitest'
import { syllabusReimportDiff } from './syllabusReimport'

const item = (kind: 'units' | 'deadlines', label: string, value?: string) => ({ id: label, kind, label, value, confidence: 'high' as const, evidence: { quote: label, location: 'line 1' } })
describe('syllabusReimportDiff', () => {
  it('matches by identity so an inserted week does not change later weeks', () => {
    const rows = syllabusReimportDiff({ topics: [{ id: 'one', courseId: 'c', title: 'Week 1', unit: 'Week 1', status: 'not-started', confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 0 }, { id: 'three', courseId: 'c', title: 'Week 3', unit: 'Week 3', status: 'not-started', confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 1 }], assignments: [], categories: [] }, [item('units', 'Week 1'), item('units', 'Week 2'), item('units', 'Week 3')])
    expect(rows.filter((row) => row.status === 'unchanged')).toHaveLength(2)
    expect(rows.filter((row) => row.status === 'added')).toHaveLength(1)
  })
})

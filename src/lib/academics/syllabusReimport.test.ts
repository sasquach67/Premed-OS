import { describe, expect, it } from 'vitest'
import { syllabusReimportDiff } from './syllabusReimport'
import type { SyllabusItem } from '@/lib/academics/syllabusParser'

const item = (kind: 'units' | 'deadlines' | 'exams', label: string, value?: string) => ({ id: label, kind, label, value, confidence: 'high' as const, evidence: { quote: label, location: 'line 1' } })
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

// ── Importing twice must not duplicate ─────────────────────────────────────
// Re-import used to be decided by a `reimport=1` URL flag that only the
// "Re-import" file-row action ever set. Coming in through the ordinary
// "Import syllabus" entry appended a second copy of every record: 6
// assignments became 12, with two `Midterm Exam 1` rows carrying different
// dates. Found by importing the same syllabus twice in a browser.
describe('re-importing the same syllabus', () => {
  const proposal: SyllabusItem[] = [
    item('units', 'Unit 1: Structure and Bonding'),
    item('exams', 'Midterm Exam 1', '2026-10-13'),
    item('deadlines', 'Problem Set 1', '2026-09-08'),
  ]
  const current = {
    topics: [{ id: 't1', courseId: 'c1', title: 'Unit 1: Structure and Bonding' }],
    assignments: [
      { id: 'a1', courseId: 'c1', title: 'Midterm Exam 1', dueDate: '2026-10-06' },
      { id: 'a2', courseId: 'c1', title: 'Problem Set 1', dueDate: '2026-09-08' },
    ],
    categories: [],
  } as unknown as Parameters<typeof syllabusReimportDiff>[0]

  it('reports a moved exam as changed, not as a second exam', () => {
    const rows = syllabusReimportDiff(current, proposal)
    const added = rows.filter((row) => row.status === 'added')
    expect(added.map((row) => row.key)).toEqual(['midterm exam 1|2026-10-13'])
    // The old row is surfaced as removed, so accepting both sides is a choice
    // the student makes rather than a duplicate they get handed.
    expect(rows.some((row) => row.status === 'removed' && row.key === 'midterm exam 1|2026-10-06')).toBe(true)
  })

  it('leaves genuinely identical records untouched', () => {
    const rows = syllabusReimportDiff(current, proposal)
    const unchanged = rows.filter((row) => row.status === 'unchanged').map((row) => row.key)
    expect(unchanged).toContain('problem set 1|2026-09-08')
    expect(unchanged).toContain('unit 1: structure and bonding')
  })

  it('defaults to keeping what the student already confirmed', () => {
    for (const row of syllabusReimportDiff(current, proposal)) {
      if (row.status !== 'added') expect(row.defaultAction).toBe('keep')
    }
  })
})

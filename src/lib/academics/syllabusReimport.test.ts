import { describe, expect, it } from 'vitest'
import { syllabusReimportDiff } from './syllabusReimport'
import type { SyllabusItem } from '@/lib/academics/syllabusParser'

const item = (kind: 'standards' | 'deadlines' | 'exams', label: string, value?: string) => ({ id: label, kind, label, value, confidence: 'high' as const, evidence: { quote: label, location: 'line 1' } })
describe('syllabusReimportDiff', () => {
  it('matches by identity so an inserted standard does not change later standards', () => {
    const rows = syllabusReimportDiff({ topics: [{ id: 'one', courseId: 'c', title: 'Explain reactions', unit: '', status: 'not-started', confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 0 }, { id: 'three', courseId: 'c', title: 'Evaluate mechanisms', unit: '', status: 'not-started', confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 1 }], assignments: [], categories: [] }, [item('standards', 'Explain reactions'), item('standards', 'Compare products'), item('standards', 'Evaluate mechanisms')])
    expect(rows.filter((row) => row.status === 'unchanged')).toHaveLength(2)
    expect(rows.filter((row) => row.status === 'added')).toHaveLength(1)
  })

  it('defaults new entries to accept while keeping changed and removed records', () => {
    const current = {
      topics: [{ id: 'one', courseId: 'c', title: 'Explain reactions', unit: '', status: 'not-started' as const, confidence: 3 as const, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 1, order: 0 }],
      assignments: [],
      categories: [{ id: 'quiz', courseId: 'c', name: 'Quizzes', weight: 20, createdAt: 1, updatedAt: 1, order: 0 }, { id: 'exam', courseId: 'c', name: 'Exam', weight: 80, createdAt: 1, updatedAt: 1, order: 1 }],
    }
    const rows = syllabusReimportDiff(current, [item('standards', 'Explain reactions'), item('standards', 'Compare products'), { ...item('standards', 'unused'), kind: 'weights' as const, label: 'Quizzes', value: '25%' }])
    expect(rows.find((row) => row.status === 'added')?.defaultAction).toBe('accept')
    expect(rows.find((row) => row.status === 'changed')?.defaultAction).toBe('keep')
    expect(rows.find((row) => row.status === 'removed')?.defaultAction).toBe('keep')
  })

  it('uses stored syllabus identity after the student renames imported rows', () => {
    const current = {
      topics: [{ id: 'one', courseId: 'c', title: 'Membranes — my wording', syllabusSourceKey: 'explain membrane transport', unit: '', status: 'not-started' as const, confidence: 3 as const, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], fsrs: {} as never, createdAt: 1, updatedAt: 2, order: 0 }],
      assignments: [{ id: 'exam', courseId: 'c', title: 'First big exam', syllabusSourceKey: 'midterm exam|2026-10-14', type: 'exam' as const, dueDate: '2026-10-14', status: 'not-started' as const, linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 2, order: 0 }],
      categories: [{ id: 'quizzes', courseId: 'c', name: 'Quick checks', syllabusSourceKey: 'quizzes', weight: 20, createdAt: 1, updatedAt: 2, order: 0 }],
    }
    const proposal = [
      item('standards', 'Explain membrane transport'),
      item('exams', 'Midterm Exam', '2026-10-14'),
      { ...item('standards', 'unused'), kind: 'weights' as const, label: 'Quizzes', value: '20%' },
    ]
    const rows = syllabusReimportDiff(current, proposal)
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'topic', key: 'explain membrane transport', status: 'changed', defaultAction: 'keep' }),
      expect.objectContaining({ kind: 'assignment', key: 'midterm exam|2026-10-14', status: 'changed', defaultAction: 'keep' }),
      expect.objectContaining({ kind: 'category', key: 'quizzes', status: 'changed', defaultAction: 'keep' }),
    ]))
    expect(rows.some((row) => row.status === 'added' || row.status === 'removed')).toBe(false)
  })

  it('diffs scheduled readings by source identity instead of duplicating them', () => {
    const rows = syllabusReimportDiff({
      topics: [], assignments: [], categories: [],
      readings: [{ id: 'r1', courseId: 'c', week: 'Week 1', title: 'My shorter Rosario title', syllabusSourceKey: 'berry story of rosario|week 1|2026-08-25', status: 'not-started', dueForDiscussion: '2026-08-25', createdAt: 1, updatedAt: 1, order: 0 }],
    }, [{ id: 'reading', kind: 'readings', label: 'Berry Story of Rosario', context: 'Week 1', value: '2026-08-25', confidence: 'high', evidence: { quote: 'Berry', location: 'line 1' } }])
    expect(rows).toEqual([expect.objectContaining({ kind: 'reading', status: 'changed', defaultAction: 'keep' })])
  })

  it('diffs chronological schedule context without turning it into a topic', () => {
    const rows = syllabusReimportDiff({
      topics: [], assignments: [], categories: [],
      schedule: [{ id: 's1', week: 'Week 1', label: 'Culture and symbols', startDate: '2026-08-25', order: 0 }],
    }, [{ id: 'unit', kind: 'units', label: 'Culture, symbols, and the body', context: 'Week 1', value: '2026-08-25', confidence: 'high', evidence: { quote: 'Wk 1', location: 'line 1' } }])
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'schedule', status: 'added' }),
      expect.objectContaining({ kind: 'schedule', status: 'removed' }),
    ]))
    expect(rows.some((row) => row.kind === 'topic')).toBe(false)
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
    item('standards', 'Explain structure and bonding'),
    item('exams', 'Midterm Exam 1', '2026-10-13'),
    item('deadlines', 'Problem Set 1', '2026-09-08'),
  ]
  const current = {
    topics: [{ id: 't1', courseId: 'c1', title: 'Explain structure and bonding' }],
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
    expect(unchanged).toContain('explain structure and bonding')
  })

  it('defaults to keeping what the student already confirmed', () => {
    for (const row of syllabusReimportDiff(current, proposal)) {
      if (row.status !== 'added') expect(row.defaultAction).toBe('keep')
    }
  })
})

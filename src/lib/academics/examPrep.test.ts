import { describe, expect, it } from 'vitest'
import { applyCatchUpProposal, buildExamPrepPlan, closeExamPrepPlan, getCatchUpProposal } from './examPrep'
import type { AcademicFile, ClassAssignment, Topic } from '@/lib/types'

const topic = (id: string): Topic => ({ id, courseId: 'course', title: id, status: 'seen', confidence: 3, fsrs: { due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: 0 }, sourceNoteIds: [], order: 0 })
const exam = (dueDate?: string): ClassAssignment => ({ id: 'exam', courseId: 'course', title: 'Unit exam', type: 'exam', dueDate, status: 'not-started', linkedTopicIds: [], linkedFileIds: ['syllabus'], examStudyFileIds: ['file-1'], coveredTopicIds: ['topic-1'], createdAt: 1, updatedAt: 1, order: 0 })

describe('buildExamPrepPlan', () => {
  it('uses only course-owned records and makes accelerated work earlier than steady work', () => {
    const files: AcademicFile[] = [{ id: 'file-1', courseId: 'course', title: 'Slides', type: 'lecture-slides', sourceType: 'upload', linkedTopicIds: ['topic-1'], owner: 'course', createdAt: 1, updatedAt: 1, order: 0 }]
    files.push({ ...files[0], id: 'file-2' })
    const assignments: ClassAssignment[] = [{ ...exam('2026-09-10') }, { id: 'homework', courseId: 'course', title: 'Problem set', type: 'homework', status: 'not-started', linkedTopicIds: ['topic-1'], linkedFileIds: ['file-1'], createdAt: 1, updatedAt: 1, order: 1 }]
    const base = { id: 'plan', courseId: 'course', exam: { ...assignments[0], examStudyFileIds: ['file-1', 'file-2'] }, topics: [topic('topic-1')], assignments, files, now: Date.parse('2026-09-01T12:00:00') }
    const accelerated = buildExamPrepPlan({ ...base, intensity: 'accelerated' }).plan!
    const steady = buildExamPrepPlan({ ...base, intensity: 'steady' }).plan!

    expect(accelerated.items.map((item) => item.owner)).toEqual(['file', 'file'])
    expect(accelerated.items.every((item) => item.plannedDate < '2026-09-10')).toBe(true)
    expect(accelerated.items[accelerated.items.length - 1]!.plannedDate < steady.items[steady.items.length - 1]!.plannedDate).toBe(true)
  })

  it('ignores legacy topic links and rejects other-course files in assessment scope', () => {
    const selectedExam = { ...exam('2026-09-10'), examStudyFileIds: ['other-file'] }
    const files = [
      { id: 'legacy-file', courseId: 'course', linkedTopicIds: ['topic-1'] } as AcademicFile,
      { id: 'other-file', courseId: 'other-course', linkedTopicIds: [] } as unknown as AcademicFile,
    ]
    const result = buildExamPrepPlan({ id: 'plan', courseId: 'course', exam: selectedExam, topics: [topic('topic-1')], assignments: [], files, intensity: 'steady' })
    expect(result.dormant).toEqual(['study-material'])
    expect(result.plan?.items).toEqual([])
  })

  it('does not treat syllabus provenance or shared-file assignments as exam study scope', () => {
    const importedExam = { ...exam('2026-09-10'), examStudyFileIds: undefined }
    const files = [{ id: 'syllabus', courseId: 'course' } as AcademicFile]
    const assignments = [{ ...importedExam, id: 'later-assignment', type: 'homework' as const, dueDate: '2026-12-01' }]
    const base = { id: 'plan', courseId: 'course', exam: importedExam, topics: [topic('topic-1')], assignments, files, intensity: 'steady' as const }
    expect(buildExamPrepPlan(base).dormant).toEqual(['exam-scope', 'study-material'])
    expect(buildExamPrepPlan(base).plan?.items).toEqual([])
    const deliberate = buildExamPrepPlan({ ...base, exam: { ...importedExam, examStudyFileIds: ['syllabus'] } })
    expect(deliberate.plan?.items.map((item) => item.owner)).toEqual(['file'])
    expect(importedExam.linkedFileIds).toEqual(['syllabus'])
  })

  it('keeps missing input dormant rather than inventing scope, material, or dates', () => {
    expect(buildExamPrepPlan({ id: 'plan', courseId: 'course', exam: exam(), topics: [], assignments: [], files: [], intensity: 'steady' }).dormant).toEqual(['exam-date'])
    const noScope = buildExamPrepPlan({ id: 'plan', courseId: 'course', exam: { ...exam('2026-09-10'), coveredTopicIds: [], examStudyFileIds: [] }, topics: [], assignments: [], files: [], intensity: 'steady', now: Date.parse('2026-09-01') })
    expect(noScope.dormant).toEqual(['exam-scope', 'study-material'])
    expect(noScope.plan?.items).toEqual([])
  })
})

describe('Exam Prep state changes', () => {
  it('requires an explicit catch-up apply before marking any plan row missed', () => {
    const plan = buildExamPrepPlan({ id: 'plan', courseId: 'course', exam: exam('2026-09-10'), topics: [topic('topic-1')], assignments: [exam('2026-09-10')], files: [{ id: 'file-1', courseId: 'course' } as AcademicFile], intensity: 'steady', now: Date.parse('2026-09-01') }).plan!
    const proposal = getCatchUpProposal(plan, '2026-09-03')!
    expect(plan.items[0].state).toBe('planned')
    expect(applyCatchUpProposal(plan, proposal, 10).items[0]).toMatchObject({ state: 'missed', missedAt: 10 })
  })

  it('closes with only factual student-entered feedback', () => {
    const plan = buildExamPrepPlan({ id: 'plan', courseId: 'course', exam: exam('2026-09-10'), topics: [topic('topic-1')], assignments: [exam('2026-09-10')], files: [{ id: 'file-1', courseId: 'course' } as AcademicFile], intensity: 'steady', now: Date.parse('2026-09-01') }).plan!
    expect(closeExamPrepPlan(plan, { returnedGrade: '87/100', feedback: 'Revisit membrane transport.' }, 20)).toMatchObject({ closedAt: 20, returnedGrade: '87/100', feedback: 'Revisit membrane transport.' })
  })
})

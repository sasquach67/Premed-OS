import { describe, expect, it } from 'vitest'
import { createEmptyClassCenterData } from '@/data/personalInitialData'
import {
  acceptGuideProposal, buildLectureGuideProposal, buildSyllabusGuideProposals,
  dismissGuideProposal, editGuideProposal,
  guideProposalsForCourse, isGuideSourceValid, persistConfirmedSyllabusEvidence,
} from './guideContract'

function lectureCenter() {
  const center = createEmptyClassCenterData()
  center.files.push({ id: 'transcript-a', courseId: 'course-a', sourceType: 'paste', title: 'Lecture 1 transcript', type: 'transcript', owner: 'mine', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 })
  center.sourceChunks.push({ id: 'chunk-a', fileId: 'transcript-a', courseId: 'course-a', content: 'The professor said justify the major product.', sourcePosition: { index: 0, label: '14:22' }, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 })
  center.lectures.push({ id: 'lecture-a', courseId: 'course-a', title: 'Lecture 1', inputPath: 'pasted', transcriptFileId: 'transcript-a', processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0 })
  center.lectureFindings.push({ id: 'finding-a', courseId: 'course-a', lectureId: 'lecture-a', sourceChunkId: 'chunk-a', quote: 'justify the major product', timestamp: '14:22', label: 'Worked example', detail: 'Explain the reasoning, not only the answer.', createdAt: 1, updatedAt: 1, order: 0 })
  return center
}

describe('Guide contract', () => {
  it('creates a source-exact lecture proposal and refuses mismatched evidence', () => {
    const center = lectureCenter()
    const proposal = buildLectureGuideProposal({ center, courseId: 'course-a', lectureId: 'lecture-a', finding: center.lectureFindings[0], id: 'proposal-a', now: 10 })
    expect(proposal).toEqual(expect.objectContaining({
      id: 'proposal-a', courseId: 'course-a', status: 'pending', draftText: 'Explain the reasoning, not only the answer.',
      source: expect.objectContaining({ sourceKind: 'lecture', sourceRecordId: 'finding-a', sourcePassage: 'justify the major product', sourceChunkId: 'chunk-a' }),
    }))
    expect(isGuideSourceValid(center, 'course-a', proposal!.source)).toBe(true)
    const fabricated = { ...center.lectureFindings[0], id: 'fabricated', quote: 'This will be on the exam' }
    expect(buildLectureGuideProposal({ center, courseId: 'course-a', lectureId: 'lecture-a', finding: fabricated })).toBeNull()
  })

  it('derives syllabus suggestions only from confirmed source-bearing exam rows', () => {
    const center = createEmptyClassCenterData()
    center.files.push({ id: 'syllabus-a', courseId: 'course-a', sourceType: 'upload', title: 'Syllabus', type: 'syllabus', owner: 'course', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 })
    expect(persistConfirmedSyllabusEvidence(center, 'course-a', 'syllabus-a', [{ id: 'exam-0', kind: 'exams', label: 'Midterm 2', confidence: 'high', evidence: { quote: 'Midterm 2 covers Units 4–7', location: 'page 3' } }], 2)).toBe(1)
    center.assignments.push(
      { id: 'exam-a', courseId: 'course-a', title: 'Midterm 2', type: 'exam', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], notes: 'Source: page 3 — “Midterm 2 covers Units 4–7”', createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'exam-unsourced', courseId: 'course-a', title: 'Final', type: 'exam', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 1 },
      { id: 'exam-b', courseId: 'course-b', title: 'Other exam', type: 'exam', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], notes: 'Source: line 2 — “Other class only”', createdAt: 1, updatedAt: 1, order: 0 },
    )
    const proposals = buildSyllabusGuideProposals(center, 'course-a', 20)
    expect(proposals).toHaveLength(1)
    expect(proposals[0]).toEqual(expect.objectContaining({
      draftTitle: 'Exam intel: Midterm 2', draftText: 'Midterm 2 covers Units 4–7',
      source: expect.objectContaining({ sourceKind: 'syllabus', sourceRecordId: 'exam-a', sourcePassage: 'Midterm 2 covers Units 4–7', sourceChunkId: 'syllabus-evidence-syllabus-a-exams-exam-0' }),
    }))
    expect(isGuideSourceValid(center, 'course-a', proposals[0].source)).toBe(true)
  })

  it('supports edit, accept, dismiss, attribution, and strict class scoping', () => {
    const center = lectureCenter()
    const first = buildLectureGuideProposal({ center, courseId: 'course-a', lectureId: 'lecture-a', finding: center.lectureFindings[0], id: 'proposal-a', now: 10 })!
    center.guideProposals.push(first, { ...structuredClone(first), id: 'proposal-b', status: 'pending', order: 1 })
    expect(editGuideProposal(center, 'course-b', 'proposal-a', { title: 'Wrong', text: 'Wrong' }, 11).ok).toBe(false)
    expect(editGuideProposal(center, 'course-a', 'proposal-a', { title: 'Exam intel: reasoning', text: 'Justify the mechanism.' }, 11).ok).toBe(true)
    expect(acceptGuideProposal(center, 'course-a', 'proposal-a', 12, 'note-a')).toEqual({ ok: true, id: 'note-a' })
    expect(center.notes[0]).toEqual(expect.objectContaining({
      id: 'note-a', courseId: 'course-a', title: 'Exam intel: reasoning', content: 'Justify the mechanism.', guideProposalId: 'proposal-a',
      guideSourceRefs: [expect.objectContaining({ sourceRecordId: 'finding-a', sourcePassage: 'justify the major product' })],
    }))
    expect(center.guideProposals[0]).toEqual(expect.objectContaining({ status: 'accepted', acceptedNoteId: 'note-a' }))
    expect(dismissGuideProposal(center, 'course-a', 'proposal-b', 13).ok).toBe(true)
    expect(guideProposalsForCourse(center, 'course-a', 'pending')).toEqual([])
  })

  it('does not accept malformed legacy evidence or manufacture a note', () => {
    const center = createEmptyClassCenterData()
    center.guideProposals.push({
      id: 'orphan', courseId: 'course-a', source: { courseId: 'course-a', sourceKind: 'lecture', sourceId: 'missing', sourceRecordKind: 'lecture-finding', sourceRecordId: 'missing', sourceLabel: 'Missing lecture', sourcePassage: '' },
      draftTitle: 'A claim', draftText: 'Unsupported', noteType: 'lecture', status: 'pending', createdAt: 1, updatedAt: 1, order: 0,
    })
    const outcome = acceptGuideProposal(center, 'course-a', 'orphan', 2, 'note-never')
    expect(outcome).toEqual(expect.objectContaining({ ok: false }))
    expect(center.notes).toEqual([])
  })

})

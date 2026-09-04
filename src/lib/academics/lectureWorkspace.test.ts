import { describe, expect, it } from 'vitest'
import type { AcademicFile, LectureRecord, SourceChunk, Topic } from '@/lib/types'
import { approximateLectureTitle, buildLectureBrief, buildLectureMasteryMap, fileCoverageLabel } from './lectureWorkspace'

const lecture: LectureRecord = { id: 'lecture', courseId: 'course', title: 'Lecture 1 · Gene expression', inputPath: 'pasted', transcriptFileId: 'transcript', processingState: 'ready', selectedSourceFileIds: ['transcript', 'objectives'], createdAt: 1, updatedAt: 1, order: 0 }
const files: AcademicFile[] = [
  { id: 'transcript', courseId: 'course', lectureId: 'lecture', sourceType: 'paste', title: 'Transcript', type: 'transcript', owner: 'mine', linkedTopicIds: [], processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0 },
  { id: 'objectives', courseId: 'course', sourceType: 'upload', title: 'Objectives', type: 'syllabus', owner: 'course', linkedTopicIds: ['topic'], processingStatus: 'ready', sourceCoverage: { pageCount: 4, readablePages: [1,2,3], ocrRecoveredPages: [3], unreadablePages: [4], readableCharacterCount: 400, figureStatus: 'not-interpreted' }, createdAt: 1, updatedAt: 1, order: 1 },
]
const chunks: SourceChunk[] = [
  { id: 't1', fileId: 'transcript', courseId: 'course', content: 'Remember that transcription produces RNA because RNA polymerase reads a DNA template.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 },
  { id: 'o1', fileId: 'objectives', courseId: 'course', topicId: 'topic', content: 'For this objective, trace gene expression from DNA to a mature transcript. Do not treat DNA to RNA as a direct physical conversion.', sourcePosition: { index: 0, label: 'Page 3' }, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 1 },
]
const topics: Topic[] = [{ id: 'topic', courseId: 'course', title: 'Trace gene expression from DNA to a mature transcript', unit: 'Lesson 2', status: 'not-started', confidence: 1, fsrs: { due: 1, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: 0 }, sourceNoteIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0 }]

describe('lecture workspace source contract', () => {
  it('creates an editable approximate lecture title from source text', () => expect(approximateLectureTitle(1, '00:03 origins of psychology and scientific evidence.')).toBe('Lecture 1 · Origins of psychology and scientific evidence'))
  it('tracks selected, used, and unused sources without adding outside chunks', () => {
    const brief = buildLectureBrief(chunks.slice(0, 1), ['transcript', 'objectives'], files, 2)
    expect(brief.selectedSourceFileIds).toEqual(['transcript', 'objectives'])
    expect(brief.usedSourceFileIds).toEqual(['transcript'])
    expect(brief.unusedSourceFileIds).toEqual(['objectives'])
    expect(brief.summary.every((item) => item.sourceChunkId === 't1')).toBe(true)
  })
  it('builds one lecture-scoped Mastery Map with objective-specific actions, cautions, state, and exact traces', () => {
    const map = buildLectureMasteryMap({ lecture, topics, chunks, files, now: 2 })!
    expect(map.scope).toBe('lecture')
    expect(map.standards[0]).toMatchObject({ title: topics[0].title, masteryState: 'not-started', sourceChunkIds: ['o1'] })
    expect(map.standards[0].freeRecallCues?.[0]).toMatch(/^Without notes, trace gene expression/)
    expect(map.standards[0].beAbleToDo[0]).toMatch(/^For this objective, trace gene expression/)
    expect(map.standards[0].watchFor[0]).toMatch(/Do not treat/)
  })
  it('uses a topic-specific action when the selected source has evidence but no performance verb', () => {
    const comparisonTopic = { ...topics[0], title: 'SN1 and SN2 mechanisms' }
    const evidenceOnly = [{ ...chunks[1], content: 'SN2 reactions proceed through concerted backside attack with inversion of stereochemistry.' }]
    const map = buildLectureMasteryMap({ lecture, topics: [comparisonTopic], chunks: evidenceOnly, files, now: 2 })!
    expect(map.standards[0].beAbleToDo[0]).toBe('Compare SN1 with SN2 mechanisms using the distinctions supported by the selected sources.')
    expect(map.standards[0].freeRecallCues?.[0]).toMatch(/^Without notes, compare/)
  })
  it('reports partial PDF and OCR coverage honestly', () => expect(fileCoverageLabel(files[1], 1)).toBe('3/4 pages readable · 1 recovered with on-device OCR · 1 unreadable'))
})

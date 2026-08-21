import { describe, expect, it } from 'vitest'
import { assembleFullLectureTranscript, searchLectureFindings, searchLectureSourceChunks, validateLectureFinding } from './lectureEvidence'
import type { LectureEvidenceFinding, SourceChunk } from '@/lib/types'

const chunks: SourceChunk[] = [
  { id: 'one', fileId: 'file', courseId: 'course', content: 'First explanation.', sourcePosition: { index: 0, label: '01:02' }, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 },
  { id: 'final', fileId: 'file', courseId: 'course', content: 'Final short statement.', sourcePosition: { index: 1, label: '49:58' }, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 1 },
]

const finding: LectureEvidenceFinding = {
  id: 'finding', courseId: 'course', lectureId: 'lecture', sourceChunkId: 'final',
  quote: 'Final short statement.', timestamp: '49:58', label: 'Professor guidance', detail: 'The professor gave a class-specific reminder.',
  createdAt: 1, updatedAt: 1, order: 0,
}

describe('lecture evidence', () => {
  it('passes every stored segment in source order, including a short final segment', () => {
    expect(assembleFullLectureTranscript(chunks)).toEqual([
      { chunkId: 'one', timestamp: '01:02', content: 'First explanation.' },
      { chunkId: 'final', timestamp: '49:58', content: 'Final short statement.' },
    ])
  })

  it('rejects paraphrases, mismatched timestamps, and unanchored findings', () => {
    expect(validateLectureFinding(finding, chunks)).toBe(true)
    expect(validateLectureFinding({ ...finding, quote: 'A paraphrase' }, chunks)).toBe(false)
    expect(validateLectureFinding({ ...finding, timestamp: '02:00' }, chunks)).toBe(false)
    expect(validateLectureFinding({ ...finding, sourceChunkId: 'missing' }, chunks)).toBe(false)
  })

  it('searches stored evidence without generating a new explanation', () => {
    expect(searchLectureFindings('final', [finding], chunks)).toEqual([finding])
    expect(searchLectureFindings('absent', [finding], chunks)).toEqual([])
    expect(searchLectureSourceChunks('short', chunks)).toEqual([chunks[1]])
  })
})

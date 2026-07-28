import { describe, expect, it } from 'vitest'
import type { ClassCenterData, KeyPoint, SourceChunk } from '@/lib/types'
import { calculateCourseCoverage, prioritizeKeyPoints, proposeChunkAssignment } from './coverage'

const chunk = (id: string, topicId?: string): SourceChunk => ({
  id, fileId: `file-${id}`, courseId: 'course-1', topicId, content: id,
  coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: Number(id.at(-1)) || 0,
})

describe('coverage ledger', () => {
  it('never hides an unassigned or unclaimed chunk', () => {
    const chunks = [chunk('c1', 't1'), chunk('c2'), chunk('c3', 't1')]
    const data = {
      files: chunks.map((item) => ({
        id: item.fileId, courseId: 'course-1', sourceType: 'upload' as const,
        title: item.fileId, type: 'lecture-slides' as const, linkedTopicIds: [],
        createdAt: 1, updatedAt: 1, order: item.order,
      })),
      sourceChunks: chunks,
      topics: [{ id: 't1', courseId: 'course-1' }],
      keyPoints: [{ id: 'k1', topicId: 't1', sourceChunkIds: ['c1'], timesSurfaced: 0 }],
    } as unknown as ClassCenterData
    const result = calculateCourseCoverage('course-1', data)
    expect(result.totalChunks).toBe(3)
    expect(result.unassigned.map((item) => item.chunk.id)).toEqual(['c2'])
    expect(result.uncovered.map((item) => item.chunk.id)).toEqual(['c2', 'c3'])
  })

  it('prioritizes key points never surfaced', () => {
    const point = (id: string, timesSurfaced: number, order: number): KeyPoint => ({
      id, topicId: 't1', text: id, sourceChunkIds: [], timesSurfaced,
      createdAt: 1, updatedAt: 1, order,
    })
    expect(prioritizeKeyPoints([point('seen', 2, 0), point('new', 0, 1)])[0].id).toBe('new')
  })

  it('isolates an unanchored file instead of creating a misc bucket', () => {
    const proposal = proposeChunkAssignment({
      chunk: chunk('c1'),
      file: {
        id: 'f1', courseId: 'course-1', sourceType: 'upload', owner: 'course', title: 'Lecture 14',
        type: 'lecture-slides', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0,
      },
    })
    expect(proposal.newTopicTitle).toBe('Lecture 14')
    expect(proposal.method).toBe('document-topic')
    expect(proposal.requiresConfirmation).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { assignPendingChunks, findPositionalTopic, findSemanticTopic } from './chunkAssignment'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import type { AcademicFile, SourceChunk, Topic } from '@/lib/types'

function topic(id: string, title: string, unit?: string, courseId = 'c1'): Topic {
  return {
    id, courseId, title, unit, status: 'not-started',
    fsrs: createTopicFsrsState(0),
    confidence: 1, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], order: 0,
  }
}

function chunk(id: string, fileId: string, content: string, extra: Partial<SourceChunk> = {}): SourceChunk {
  return {
    id, fileId, courseId: 'c1', content, coveredByKeyPoint: false,
    createdAt: 0, updatedAt: 0, order: 0, ...extra,
  }
}

function file(id: string, title: string, linkedTopicIds: string[] = []): AcademicFile {
  return {
    id, courseId: 'c1', sourceType: 'upload', title, type: 'lecture-slides', owner: 'course',
    linkedTopicIds, createdAt: 0, updatedAt: 0, order: 0,
  }
}

describe('three-tier chunk assignment', () => {
  it('tier 1 — assigns semantically when content clearly matches one topic', () => {
    const topics = [topic('t1', 'Synaptic transmission'), topic('t2', 'Thermodynamics')]
    const found = findSemanticTopic(
      chunk('k1', 'f1', 'Chemical synapses drive synaptic transmission across the cleft.'),
      topics,
    )
    expect(found?.id).toBe('t1')
  })

  it('tier 1 — refuses to guess when two topics score equally', () => {
    const topics = [topic('t1', 'Glycolysis pathway'), topic('t2', 'Glycolysis regulation')]
    const found = findSemanticTopic(chunk('k1', 'f1', 'An overview of glycolysis.'), topics)
    expect(found).toBeUndefined()
  })

  it('tier 2 — falls back to the document, then the syllabus unit', () => {
    const topics = [topic('t1', 'Action potentials', 'Unit 2'), topic('t2', 'Buffers', 'Unit 5')]
    // file → lecture: the document is already known to cover exactly one topic
    expect(findPositionalTopic(chunk('k1', 'f1', 'zzz'), file('f1', 'Lecture 5', ['t1']), topics)?.id).toBe('t1')
    // → syllabus week / unit
    expect(
      findPositionalTopic(chunk('k2', 'f2', 'zzz', { sourcePosition: { index: 0, label: 'Unit 5 review' } }), file('f2', 'Handout'), topics)?.id,
    ).toBe('t2')
  })

  it('does not create topics or assignments for imported source passages', () => {
    const topics = [topic('t1', 'Synaptic transmission')]
    const files = [file('f1', 'Lecture 1', ['t1']), file('f2', 'Reading')]
    const chunks = [chunk('k1', 'f1', 'Synaptic transmission across the cleft.'), chunk('k2', 'f2', 'Unrelated content.')]
    const before = structuredClone({ topics, files, sourceChunks: chunks })
    const out = assignPendingChunks(before)
    expect(out.createdTopicIds).toEqual([])
    expect(out.chunks).toEqual(chunks)
    expect(out.topics).toEqual(topics)
    expect(before).toEqual({ topics, files, sourceChunks: chunks })
  })

  it('leaves already-assigned chunks alone and never writes to input', () => {
    const topics = [topic('t1', 'Synaptic transmission')]
    const files = [file('f1', 'Lecture 1')]
    const chunks = [chunk('k1', 'f1', 'Anything', { topicId: 't1', assignmentMethod: 'manual', assignmentConfirmed: true })]
    Object.freeze(chunks[0])
    Object.freeze(chunks)

    const out = assignPendingChunks({ sourceChunks: chunks, topics, files })
    expect(out.chunks[0]).toBe(chunks[0])
    expect(out.createdTopicIds).toHaveLength(0)
  })
})

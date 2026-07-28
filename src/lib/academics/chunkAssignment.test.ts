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

  it('tier 3 — creates a topic scoped to the document, never a shared bucket', () => {
    const topics = [topic('t1', 'Synaptic transmission')]
    const files = [file('f1', 'Guest lecture — glial modulation'), file('f2', 'Errata sheet')]
    const chunks = [
      chunk('k1', 'f1', 'Nothing here resembles any known topic whatsoever.'),
      chunk('k2', 'f1', 'Also unrelated prose about unrelated matters entirely.'),
      chunk('k3', 'f2', 'Different document, equally unrelated content here.'),
    ]

    const out = assignPendingChunks({ sourceChunks: chunks, topics, files })

    // One new topic per document — two documents, two topics.
    expect(out.createdTopicIds).toHaveLength(2)
    const [k1, k2, k3] = out.chunks
    expect(k1.topicId).toBe(k2.topicId)          // same document, same topic
    expect(k3.topicId).not.toBe(k1.topicId)      // different document, different topic
    expect(k1.assignmentMethod).toBe('document-topic')
    // Provisional, not presented as settled.
    expect(k1.assignmentConfirmed).toBe(false)
    // The topic is named after its document.
    expect(out.topics.find((t) => t.id === k1.topicId)?.title).toBe('Guest lecture — glial modulation')
  })

  it('never creates a semester-wide misc bucket', () => {
    const topics = [topic('t1', 'Synaptic transmission')]
    const files = Array.from({ length: 5 }, (_, i) => file(`f${i}`, `Document ${i}`))
    const chunks = files.flatMap((f, i) => [
      chunk(`a${i}`, f.id, 'Wholly unrelated filler prose number one.'),
      chunk(`b${i}`, f.id, 'Wholly unrelated filler prose number two.'),
    ])

    const out = assignPendingChunks({ sourceChunks: chunks, topics, files })

    // No catch-all naming.
    for (const created of out.createdTopicIds) {
      const title = out.topics.find((t) => t.id === created)?.title ?? ''
      expect(title).not.toMatch(/misc|unsorted|unassigned|other|general/i)
    }
    // The decisive check: no created topic collects chunks from more than one
    // document. A semester bucket would show up here as a topic spanning files.
    for (const created of out.createdTopicIds) {
      const sourceFiles = new Set(out.chunks.filter((c) => c.topicId === created).map((c) => c.fileId))
      expect(sourceFiles.size).toBe(1)
    }
    expect(out.createdTopicIds).toHaveLength(files.length)
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

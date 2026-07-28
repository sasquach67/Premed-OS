/* The coverage assignment pipeline, run over stored chunks.
 *
 * `proposeChunkAssignment` decides ONE chunk's fate (semantic → positional →
 * document-specific). This module resolves the inputs it needs and applies the
 * result across a class centre, which is what the migration was missing: chunks
 * were being parked at `pending` instead of assigned.
 *
 * The invariant that matters: the last tier creates a topic scoped to the
 * DOCUMENT it came from. There is never one shared "misc"/"unsorted" topic
 * collecting leftovers from the whole course — that bucket destroys coverage
 * as a signal, because everything lands in it and nothing is ever reviewed.
 */
import type { AcademicFile, ClassCenterData, SourceChunk, Topic } from '@/lib/types'
import { proposeChunkAssignment } from '@/lib/academics/coverage'
import { createTopicFsrsState } from '@/lib/academics/fsrs'

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'are', 'was', 'were',
  'a', 'an', 'of', 'to', 'in', 'on', 'is', 'it', 'its', 'by', 'as', 'at', 'or',
])

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
}

/** A topic wins semantically when its distinctive title words appear in the
 *  chunk AND no other topic scores as well — ties are not a match. */
export function findSemanticTopic(chunk: SourceChunk, topics: Topic[]): Topic | undefined {
  const haystack = new Set(tokens(chunk.content))
  let best: { topic: Topic; score: number } | undefined
  let tied = false

  for (const topic of topics) {
    const needles = tokens(topic.title)
    if (!needles.length) continue
    const score = needles.filter((word) => haystack.has(word)).length
    if (!score) continue
    if (!best || score > best.score) { best = { topic, score }; tied = false }
    else if (score === best.score) tied = true
  }

  return best && !tied ? best.topic : undefined
}

/** Position resolves through the document first, then the unit it belongs to.
 *  Only an unambiguous single candidate counts. */
export function findPositionalTopic(
  chunk: SourceChunk, file: AcademicFile | undefined, topics: Topic[],
): Topic | undefined {
  // file / lecture → the topics that document is already known to cover
  const linked = file?.linkedTopicIds?.length
    ? topics.filter((topic) => file.linkedTopicIds.includes(topic.id))
    : []
  if (linked.length === 1) return linked[0]

  // → syllabus week / unit
  const label = chunk.sourcePosition?.label?.toLowerCase()
  if (label) {
    const byUnit = topics.filter((topic) => topic.unit && label.includes(topic.unit.toLowerCase()))
    if (byUnit.length === 1) return byUnit[0]
  }

  // → the unit shared by everything else in this document
  if (linked.length > 1) {
    const units = new Set(linked.map((topic) => topic.unit).filter(Boolean))
    if (units.size === 1) {
      const inUnit = topics.filter((topic) => topic.unit === [...units][0])
      if (inUnit.length === 1) return inUnit[0]
    }
  }

  return undefined
}

export interface ChunkAssignmentResult {
  chunks: SourceChunk[]
  topics: Topic[]
  /** Topics invented for a single document by the last tier. */
  createdTopicIds: string[]
}

/** Assign every unassigned chunk. Pure — inputs are never written to. */
export function assignPendingChunks(
  center: Pick<ClassCenterData, 'sourceChunks' | 'topics' | 'files'>,
  now = Date.now(),
): ChunkAssignmentResult {
  const filesById = new Map(center.files.map((file) => [file.id, file]))
  const topics = [...center.topics]
  const createdTopicIds: string[] = []
  // One document-specific topic per FILE — never one per course.
  const documentTopicByFile = new Map<string, Topic>()

  const chunks = center.sourceChunks.map((chunk) => {
    if (chunk.topicId) {
      return chunk.assignmentMethod ? chunk : { ...chunk, assignmentMethod: 'manual' as const, assignmentConfirmed: true }
    }

    const courseTopics = topics.filter((topic) => topic.courseId === chunk.courseId)
    const file = filesById.get(chunk.fileId)
    const proposal = proposeChunkAssignment({
      chunk,
      file,
      semanticTopic: findSemanticTopic(chunk, courseTopics),
      positionalTopic: findPositionalTopic(chunk, file, courseTopics),
    })

    if (proposal.topicId) {
      // Auto-assignment is provisional: the user still confirms it.
      return { ...chunk, topicId: proposal.topicId, assignmentMethod: proposal.method, assignmentConfirmed: false }
    }

    // Last tier — a topic that belongs to this document alone.
    let documentTopic = documentTopicByFile.get(chunk.fileId)
    if (!documentTopic) {
      documentTopic = {
        id: `topic-doc-${chunk.fileId}`,
        courseId: chunk.courseId,
        title: proposal.newTopicTitle || file?.title || 'Untitled document',
        unit: file?.title,
        status: 'not-started',
        fsrs: createTopicFsrsState(now),
        confidence: 1,
        sourceNoteIds: [],
        linkedNoteIds: [],
        linkedAssignmentIds: [],
        linkedFileIds: [chunk.fileId],
        createdAt: now,
        updatedAt: now,
        order: topics.length + documentTopicByFile.size,
      }
      documentTopicByFile.set(chunk.fileId, documentTopic)
      topics.push(documentTopic)
      createdTopicIds.push(documentTopic.id)
    }

    return { ...chunk, topicId: documentTopic.id, assignmentMethod: proposal.method, assignmentConfirmed: false }
  })

  return { chunks, topics, createdTopicIds }
}

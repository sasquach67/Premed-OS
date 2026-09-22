import type { AcademicFile, ClassCenterData, SourceChunk, Topic } from '@/lib/types'

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

/** Compatibility hook: Topics is retired. Preserve every record unchanged. */
export function assignPendingChunks(
  center: Pick<ClassCenterData, 'sourceChunks' | 'topics' | 'files'>,
  _now = Date.now(),
): ChunkAssignmentResult {
  return { chunks: [...center.sourceChunks], topics: [...center.topics], createdTopicIds: [] }
}

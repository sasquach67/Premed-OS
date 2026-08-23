import { Rating } from 'ts-fsrs'
import type {
  AcademicFile, ClassCenterData, KeyPoint, ReviewSessionPreferences, SourceChunk, Topic,
} from '@/lib/types'

export type RecallConfidence = 'no-idea' | 'shaky' | 'pretty-sure' | 'know-it-cold'
export type GapDisposition = 'had' | 'missed' | 'wrong'

export interface RecallScopeItem {
  id: string
  label: string
  keyPointId?: string
  provenance:
    | { kind: 'material'; fileId: string; chunkId: string; start: number; end: number }
    | { kind: 'general' }
}

export const REVIEW_RATINGS = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const

export function buildRecallQueue(
  topics: Topic[],
  now = Date.now(),
  requestedTopicId?: string,
): Topic[] {
  const requested = requestedTopicId ? topics.find((topic) => topic.id === requestedTopicId) : undefined
  const rest = topics
    .filter((topic) => topic.id !== requested?.id)
    .sort((a, b) => a.fsrs.due - b.fsrs.due || a.order - b.order)
  const due = rest.filter((topic) => topic.fsrs.due <= now)
  const fallback = rest.filter((topic) => topic.status === 'weak' || topic.fsrs.reps === 0)
  const selected = due.length ? due : fallback.length ? fallback : rest
  return requested ? [requested, ...selected] : selected
}

/** Applies the student's explicit session settings after the deterministic due
 * selection. Interleave means round-robin by unit; weak-first is a stable
 * ordering preference, never a hidden new scheduling algorithm. */
export function arrangeRecallQueue(
  queue: Topic[],
  preferences: Pick<ReviewSessionPreferences, 'interleave' | 'weakFirst'>,
): Topic[] {
  const weakFirst = preferences.weakFirst
    ? [...queue].sort((a, b) => Number(b.status === 'weak') - Number(a.status === 'weak'))
    : [...queue]
  if (!preferences.interleave) return weakFirst

  const buckets = new Map<string, Topic[]>()
  for (const topic of weakFirst) {
    const key = topic.unit?.trim() || 'Unmapped'
    const bucket = buckets.get(key) ?? []
    bucket.push(topic)
    buckets.set(key, bucket)
  }
  const result: Topic[] = []
  let round = 0
  while (true) {
    let added = false
    for (const bucket of buckets.values()) {
      const item = bucket[round]
      if (item) {
        result.push(item)
        added = true
      }
    }
    if (!added) return result
    round += 1
  }
}

export function buildScopeItems(
  topic: Topic,
  keyPoints: KeyPoint[],
  chunks: SourceChunk[],
  files: AcademicFile[],
): RecallScopeItem[] {
  const topicPoints = keyPoints
    .filter((point) => point.topicId === topic.id)
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)

  if (!topicPoints.length) {
    return [{
      id: `topic-${topic.id}`,
      label: topic.title,
      provenance: { kind: 'general' },
    }]
  }

  return topicPoints.map((point) => {
    const chunk = point.sourceChunkIds
      .map((id) => chunks.find((item) => item.id === id))
      .find((item): item is SourceChunk => Boolean(item && files.some((file) => file.id === item.fileId)))
    if (!chunk) {
      return { id: point.id, label: point.text, keyPointId: point.id, provenance: { kind: 'general' as const } }
    }
    return {
      id: point.id,
      label: point.text,
      keyPointId: point.id,
      // Existing records do not carry a narrower extracted span. Cite the
      // exact whole chunk instead of fabricating an offset with fuzzy text.
      provenance: {
        kind: 'material' as const,
        fileId: chunk.fileId,
        chunkId: chunk.id,
        start: 0,
        end: chunk.content.length,
      },
    }
  })
}

export function confidenceForEvent(confidence: RecallConfidence): 1 | 2 | 3 {
  if (confidence === 'know-it-cold') return 3
  if (confidence === 'pretty-sure') return 2
  return 1
}

export function noKeyLoopAvailable(): true {
  return true
}

export function sourceForScope(
  item: RecallScopeItem,
  data: Pick<ClassCenterData, 'sourceChunks' | 'files'>,
) {
  if (item.provenance.kind !== 'material') return null
  const provenance = item.provenance
  return {
    chunk: data.sourceChunks.find((chunk) => chunk.id === provenance.chunkId),
    file: data.files.find((file) => file.id === provenance.fileId),
  }
}

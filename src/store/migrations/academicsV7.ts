import type { AppData } from '@/lib/types'
import { assignPendingChunks } from '@/lib/academics/chunkAssignment'

/** D6 additive migration. It records honest source ranges and assignment
 * provenance without moving, merging, dropping, or reinterpreting any chunk.
 *
 * Unlabelled chunks are then run through the coverage pipeline
 * (semantic → positional → document-specific) instead of being parked at
 * `pending`, which left the coverage meter permanently understated. Every
 * automatic assignment lands with `assignmentConfirmed: false`, so the user
 * still confirms it — nothing is presented as settled fact. */
export function migrateAcademicsV7(data: AppData): AppData {
  const center = data.academics.classCenter

  for (const chunk of center.sourceChunks ?? []) {
    chunk.characterStart ??= 0
    chunk.characterEnd ??= chunk.content.length
  }

  for (const file of center.files ?? []) {
    if (file.processingStatus) continue
    file.processingStatus = center.sourceChunks.some((chunk) => chunk.fileId === file.id)
      ? 'ready'
      : 'pending'
  }

  const { chunks, topics } = assignPendingChunks({
    sourceChunks: center.sourceChunks ?? [],
    topics: center.topics ?? [],
    files: center.files ?? [],
  })
  center.sourceChunks = chunks
  center.topics = topics

  return data
}

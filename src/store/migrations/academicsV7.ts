import type { AppData } from '@/lib/types'
import { assignPendingChunks } from '@/lib/academics/chunkAssignment'

/** D6 additive migration. It records honest source ranges and assignment
 * provenance without moving, merging, dropping, or reinterpreting any chunk.
 *
 * Unlabelled chunks are then run through the coverage pipeline
 * (semantic → positional → document-specific) instead of being parked at
 * `pending`, which left the coverage meter permanently understated. Every
 * automatic assignment lands with `assignmentConfirmed: false`, so the user
 * still confirms it — nothing is presented as settled fact.
 *
 * Pure — see the note on `migrateAcademicTags`. */
export function migrateAcademicsV7(data: AppData): AppData {
  const center = data.academics.classCenter

  const ranged = (center.sourceChunks ?? []).map((chunk) => {
    const characterStart = chunk.characterStart ?? 0
    const characterEnd = chunk.characterEnd ?? chunk.content.length
    if (characterStart === chunk.characterStart && characterEnd === chunk.characterEnd) return chunk
    return { ...chunk, characterStart, characterEnd }
  })

  const files = (center.files ?? []).map((file) => {
    if (file.processingStatus) return file
    const processingStatus = ranged.some((chunk) => chunk.fileId === file.id) ? 'ready' as const : 'pending' as const
    return { ...file, processingStatus }
  })

  const { chunks, topics } = assignPendingChunks({
    sourceChunks: ranged,
    topics: center.topics ?? [],
    files,
  })

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, sourceChunks: chunks, topics, files },
    },
  }
}

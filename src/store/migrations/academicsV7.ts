import type { AppData } from '@/lib/types'

/** D6 additive migration. It records honest source ranges and assignment
 * provenance without moving, merging, dropping, or reinterpreting any chunk.
 *
 * U-10 (Aug 2026) makes manual filing the default. Unlabelled chunks remain
 * pending until the student explicitly confirms a topic. Existing provisional
 * proposals are preserved losslessly and the coverage ledger treats them as
 * unassigned until confirmation.
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

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, sourceChunks: ranged, topics: center.topics ?? [], files },
    },
  }
}

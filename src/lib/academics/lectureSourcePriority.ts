import type { AcademicFile } from '@/lib/types'

/** Use attached metadata, not filename guesses, to identify instructor evidence. */
export function instructorSourceFileIds(files: readonly AcademicFile[], transcriptFileId?: string): string[] {
  return [...new Set(files.filter((file) => file.id === transcriptFileId || file.type === 'transcript' || file.type === 'lecture-slides').map((file) => file.id))]
}

export function lectureSourcePriorityInstruction(primaryChunkIds: readonly string[]): string {
  if (!primaryChunkIds.length) return ''
  return `Instructor evidence chunk IDs: ${[...new Set(primaryChunkIds)].join(', ')}. Use these lecture transcripts and slides as the primary teaching sequence, scope, terminology, and emphasis. Use textbooks and other readings to confirm, clarify, and fill supported gaps; do not let their volume displace what the professor taught. Preserve supplied professor learning objectives verbatim, and retain instructor warnings, distinctions, and worked examples. Separate supplementary background from instructor emphasis. If sources conflict, flag the disagreement rather than silently overriding either source. Preserve source-supported mechanism steps and worked examples instead of reducing them to topic names. Never invent missing instructor objectives or emphasis.`
}

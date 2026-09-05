import type { AcademicFile } from '@/lib/types'

/** Use attached metadata, not filename guesses, to identify instructor evidence. */
export function instructorSourceFileIds(files: readonly AcademicFile[], transcriptFileId?: string): string[] {
  return [...new Set(files.filter((file) => file.id === transcriptFileId || file.type === 'transcript' || file.type === 'lecture-slides').map((file) => file.id))]
}

export function lectureSourcePriorityInstruction(primaryChunkIds: readonly string[]): string {
  if (!primaryChunkIds.length) return 'No instructor evidence was identified in the selected passages. Do not infer professor emphasis, official objectives, or lecture coverage from filenames or textbook volume. Use the selected evidence with its actual provenance and state the missing instructor-context limitation where relevant.'
  return `Instructor evidence chunk IDs: ${[...new Set(primaryChunkIds)].join(', ')}. Use these lecture transcripts and slides as the primary teaching sequence, scope, terminology, and emphasis. Use textbooks and other readings to confirm, clarify, and fill supported gaps; do not let their volume displace what the professor taught. Preserve only explicitly stated learning objectives verbatim, and retain instructor warnings, distinctions, and worked examples. Dialogue, acknowledgments, slide captions and assessment stems are not official objectives. Connect transcript and slide passages about the same concept when both are supplied; cite each contribution separately rather than pretending one passage supports both. Separate supplementary background from instructor emphasis. If sources conflict, flag the disagreement rather than silently overriding either source. Preserve source-supported mechanism steps and worked examples instead of reducing them to topic names. Do not invent slide numbers, quotations, exam predictions, missing objectives or emphasis. These IDs describe selected evidence, not proof that all instructor material was processed or used; never claim complete lecture coverage without a supporting coverage receipt.`
}

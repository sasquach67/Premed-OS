import type { CourseLens, SourceChunk } from '@/lib/types'

/** The only shape generation may receive. It is a reviewed context layer, not hidden memory. */
export interface CourseLensGenerationContext {
  text: string
  sourceFileIds: string[]
  sourceChunkIds: string[]
  sourceLabels: string[]
}

/**
 * A lens can affect an artifact only when all of its declared source chunks
 * are in the explicit generation set. This keeps course context reviewable
 * and prevents a broader course interpretation from being applied silently.
 */
export function applicableCourseLens(
  lens: CourseLens | undefined,
  chunks: readonly SourceChunk[],
  sourceLabels: Record<string, string> = {},
): CourseLensGenerationContext | undefined {
  const text = lens?.text.trim()
  if (!text || !lens?.sourceChunkIds.length || !lens.sourceFileIds.length) return undefined
  const selected = new Set(chunks.map((chunk) => chunk.id))
  if (!lens.sourceChunkIds.every((id) => selected.has(id))) return undefined
  return {
    text,
    sourceFileIds: [...lens.sourceFileIds],
    sourceChunkIds: [...lens.sourceChunkIds],
    sourceLabels: lens.sourceFileIds.map((id) => sourceLabels[id] ?? 'Course material'),
  }
}

export function courseLensInstruction(lens?: CourseLensGenerationContext): string {
  if (!lens) return ''
  return [
    'Course lens — student-reviewed course context:',
    lens.text,
    `Lens evidence: ${lens.sourceLabels.join(' · ')}.`,
    'Use this only as an analytical frame for the selected course sources. Do not add cultural, historical, disciplinary, or factual context that those sources do not support.',
    'When this lens changes the output, identify it as “Course lens used” and keep its listed source trace reviewable.',
  ].join('\n')
}

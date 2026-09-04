import {
  acceptStudySourceDisclosure,
  hasAcceptedStudySourceDisclosure,
  studySourceFingerprint,
  studySourceSyncKey,
  studyTools,
  type StudySourceInput,
} from '@/lib/intelligence/studyTools'
import type { SourceChunk } from '@/lib/types'

/**
 * A source scope is a retrieval boundary, not a user-facing topic. Imported
 * transcripts and mixed material sets often have no single lesson assignment,
 * but generation still needs one stable server-side bucket.
 */
export const CLASS_MATERIAL_SCOPE = '__class_material__'
export const MAX_GENERATION_SOURCE_CHUNKS = 24

export interface GenerationSourcePreparation {
  ok: boolean
  scopeId?: string
  chunkIds?: string[]
  message?: string
}

export function sourceScopeForGeneration(chunks: readonly SourceChunk[]): string {
  const topicIds = [...new Set(chunks.map((chunk) => chunk.topicId).filter((id): id is string => Boolean(id)))]
  return topicIds.length === 1 && chunks.every((chunk) => chunk.topicId === topicIds[0])
    ? topicIds[0]
    : CLASS_MATERIAL_SCOPE
}

export function generationSourceInputs(chunks: readonly SourceChunk[]): StudySourceInput[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    fileId: chunk.fileId,
    content: chunk.content,
    // Whole-chunk spans are exact. Never invent a narrower range when import
    // metadata is incomplete.
    start: chunk.characterStart ?? 0,
    end: chunk.characterEnd ?? chunk.content.length,
  }))
}

export function generationSourceLimitMessage(chunkCount: number, artifact?: string): string | undefined {
  // A Question Bank deliberately reviews the complete selected corpus. Its
  // larger, Anthropic-only server path enforces its own context-safe ceiling.
  if (artifact === 'unit-question-bank') return undefined
  if (chunkCount <= MAX_GENERATION_SOURCE_CHUNKS) return undefined
  return `Choose fewer source files or add a shorter excerpt. This selection contains ${chunkCount} passages, and AI study tools can use up to ${MAX_GENERATION_SOURCE_CHUNKS} at a time.`
}

/**
 * The local store remains canonical. This creates or refreshes only the
 * selected material's private server mirror, after the same disclosure used
 * by recall gap-checks. No model call receives client text directly.
 */
export async function prepareGenerationSources(
  courseId: string,
  chunks: readonly SourceChunk[],
  options: { artifact?: string } = {},
): Promise<GenerationSourcePreparation> {
  const sources = generationSourceInputs(chunks)
  if (!sources.length) return { ok: false, message: 'Select processed course material first.' }
  const limitMessage = generationSourceLimitMessage(sources.length, options.artifact)
  if (limitMessage) return { ok: false, message: limitMessage }

  if (!hasAcceptedStudySourceDisclosure()) {
    if (typeof window === 'undefined') return { ok: false, message: 'AI study tools must be opened in the app.' }
    const accepted = window.confirm(
      'AI study tools copy only the material selected for this request to your private Premed OS server workspace. '
      + (options.artifact === 'unit-question-bank'
        ? 'For a question bank, temporary compressed copies of selected image pages are also sent directly to Claude for visual inspection; they are not stored in the server source mirror. '
        : '')
      + 'Your local data remains canonical, and you can delete the server copy at any time in Settings. Continue?',
    )
    if (!accepted) return { ok: false, message: 'No material was copied, so nothing was generated.' }
    acceptStudySourceDisclosure()
  }

  const scopeId = sourceScopeForGeneration(chunks)
  const key = studySourceSyncKey(courseId, scopeId)
  const fingerprint = studySourceFingerprint(sources)
  if (typeof localStorage === 'undefined' || localStorage.getItem(key) !== fingerprint) {
    const result = await studyTools.syncSources({
      action: 'sync-sources',
      courseId,
      topicId: scopeId,
      sources,
      ...(options.artifact === 'unit-question-bank' ? { purpose: 'unit-question-bank' as const } : {}),
    })
    if (!result.ok) return { ok: false, message: result.message }
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, fingerprint)
  }

  return { ok: true, scopeId, chunkIds: sources.map((source) => source.chunkId) }
}

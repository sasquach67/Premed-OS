import { assembleGenerationRequest } from '@/lib/generation'
import { validateRevisedNotes } from '@/lib/generation/schemas/revisedNotes.v1'
import { assertGenerationAllowed, GenerationNotAllowedError, generatedTitle } from '@/lib/academics/generationPolicy'
import { prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import { studyTools } from '@/lib/intelligence/studyTools'
import type { GeneratedRevisedNotes, SourceChunk } from '@/lib/types'
import type { GenerateFailure } from './generateStudyGuide'

export interface RevisedNotesGenerationOutcome {
  ok: boolean
  failure?: GenerateFailure
  message?: string
  artifact?: Omit<GeneratedRevisedNotes, 'id' | 'createdAt' | 'updatedAt' | 'order'>
}

function failureFor(code: string): GenerateFailure {
  if (code === 'no-sources') return 'no-sources'
  if (code === 'sign-in-required') return 'sign-in-required'
  if (code === 'citation-not-carried') return 'citation-not-carried'
  if (code === 'invalid-response') return 'invalid-response'
  return 'provider-unavailable'
}

/**
 * A separate caller makes Revised Notes a named, inspectable artifact rather
 * than a study-guide formatter with a different label.
 */
export async function generateRevisedNotes({
  courseId, chunks, baselineFileId, baselineChunks, label,
}: {
  courseId: string
  chunks: SourceChunk[]
  /** Explicit student choice; never inferred from a filename or file type. */
  baselineFileId?: string
  baselineChunks?: SourceChunk[]
  label: string
}): Promise<RevisedNotesGenerationOutcome> {
  if (!chunks.length) {
    return { ok: false, failure: 'no-sources', message: 'Select processed course material first. Premed OS will not fill missing lecture content from general knowledge.' }
  }
  const baseline = baselineChunks ?? []
  const includedBaseline = baselineFileId && baseline.length
    && chunks.some((chunk) => chunk.fileId === baselineFileId)
    && baseline.every((chunk) => chunk.fileId === baselineFileId && chunks.some((candidate) => candidate.id === chunk.id))
  if (!includedBaseline) {
    return { ok: false, failure: 'no-sources', message: 'Choose the student notes that should be the revision baseline before creating revised notes.' }
  }
  try {
    assertGenerationAllowed({ scope: 'academics', artifact: 'revised-notes', courseId, groundedIn: chunks.map((chunk) => chunk.id) })
  } catch (error) {
    return { ok: false, failure: 'not-allowed', message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.' }
  }

  const prepared = await prepareGenerationSources(courseId, chunks)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) {
    return { ok: false, failure: 'provider-unavailable', message: prepared.message ?? 'Selected material could not be prepared.' }
  }

  // SOURCE_ONLY is deliberately explicit: default controls are not a safe
  // substitute for the record-repair boundary.
  const assembled = assembleGenerationRequest({
    specId: 'revised-notes-v1',
    chunkIds: prepared.chunkIds,
    controls: { source_mode: 'SOURCE_ONLY' },
    request: `Lecture: ${label}. Baseline notes file: ${baselineFileId}. Action: revise that student-selected baseline from this selected material only.`,
  })
  const result = await studyTools.generate({
    action: 'generate', courseId, topicId: prepared.scopeId,
    chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash,
    systemPrompt: assembled.systemPrompt, request: `Lecture: ${label}. Baseline notes file: ${baselineFileId}.`,
  })
  if (!result.ok) return { ok: false, failure: failureFor(result.code), message: result.message }

  const closedCitations = new Map((result.data.citations as Array<{ fileId?: unknown; chunkId?: unknown; start?: unknown; end?: unknown }>)
    .filter((citation): citation is { fileId: string; chunkId: string; start: number; end: number } =>
      typeof citation.fileId === 'string' && typeof citation.chunkId === 'string'
      && Number.isFinite(citation.start) && Number.isFinite(citation.end))
    .map((citation) => [`${citation.chunkId}:${citation.start}:${citation.end}`, citation.fileId]))
  const artifact = validateRevisedNotes(result.data.artifact, closedCitations)
  if (!artifact) {
    return { ok: false, failure: 'invalid-response', message: 'The revised notes did not pass their source-trace checks. Nothing was saved.' }
  }

  const refs = [
    ...artifact.sections.flatMap((section) => section.passages.flatMap((passage) => passage.sourceRefs)),
    ...artifact.unresolvedDifferences.flatMap((difference) => difference.sourceRefs),
  ]
  const usedSourceChunkIds = [...new Set(refs.map((ref) => ref.chunkId))]
  const usedFileIds = [...new Set(refs.map((ref) => ref.fileId))]
  const selectedSourceChunkIds = [...new Set(chunks.map((chunk) => chunk.id))]
  const selectedFileIds = [...new Set(chunks.map((chunk) => chunk.fileId))]

  return {
    ok: true,
    artifact: {
      courseId,
      title: generatedTitle(artifact.title),
      specId: 'revised-notes-v1',
      specHash: assembled.specHash,
      sections: artifact.sections,
      unresolvedDifferences: artifact.unresolvedDifferences,
      baselineFileId,
      baselineSourceChunkIds: baseline.map((chunk) => chunk.id),
      selectedSourceChunkIds,
      usedSourceChunkIds,
      unusedSourceChunkIds: selectedSourceChunkIds.filter((id) => !usedSourceChunkIds.includes(id)),
      selectedFileIds,
      usedFileIds,
      unusedFileIds: selectedFileIds.filter((id) => !usedFileIds.includes(id)),
    },
  }
}

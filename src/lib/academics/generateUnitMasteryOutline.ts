import { assembleGenerationRequest } from '@/lib/generation'
import { assertGenerationAllowed, GenerationNotAllowedError, generatedTitle } from '@/lib/academics/generationPolicy'
import { generateWithSourceRecovery, prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import { validateMasteryOutline } from '@/lib/academics/unitQuestionBank'
import type { GeneratedMasteryOutline, SourceChunk } from '@/lib/types'
import type { GenerateFailure } from './generateStudyGuide'

export interface UnitMasteryOutlineOutcome {
  ok: boolean
  failure?: GenerateFailure
  message?: string
  artifact?: Omit<GeneratedMasteryOutline, 'id' | 'createdAt' | 'updatedAt' | 'order'>
}

function failureFor(code: string): GenerateFailure {
  if (code === 'no-sources') return 'no-sources'
  if (code === 'sign-in-required') return 'sign-in-required'
  if (code === 'citation-not-carried') return 'citation-not-carried'
  if (code === 'invalid-response') return 'invalid-response'
  return 'provider-unavailable'
}

export async function generateUnitMasteryOutline({ courseId, chunks, unit, label, scope = 'unit', practiceQuestionChunkIds = [] }: { courseId: string; chunks: SourceChunk[]; unit: string; label: string; scope?: 'lecture' | 'unit' | 'exam'; practiceQuestionChunkIds?: readonly string[] }): Promise<UnitMasteryOutlineOutcome> {
  if (!chunks.length) return { ok: false, failure: 'no-sources', message: 'Select processed course material first. The mastery map stays empty rather than guessing.' }
  try {
    assertGenerationAllowed({ scope: 'academics', artifact: 'unit-mastery-outline', courseId, groundedIn: chunks.map((chunk) => chunk.id) })
  } catch (error) {
    return { ok: false, failure: 'not-allowed', message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.' }
  }
  const prepared = await prepareGenerationSources(courseId, chunks)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) return { ok: false, failure: 'provider-unavailable', message: prepared.message ?? 'Selected material could not be prepared.' }
  const preparedIds = new Set(prepared.chunkIds)
  const questionReferenceIds = [...new Set(practiceQuestionChunkIds.filter((id) => preparedIds.has(id)))]
  const assembled = assembleGenerationRequest({
    specId: 'unit-mastery-outline-v1', chunkIds: prepared.chunkIds, controls: { source_mode: 'SOURCE_ONLY' },
    request: [
      `Scope: ${scope}. Unit: ${unit}. Topic label: ${label}. Build the detailed mastery map from the selected sources. Preserve every explicit objective relevant to this scope and all distinct supported Free-recall cues, Understand, Be able to do, and Watch for points. Each objective needs a concrete blank-page retrieval cue; process or mechanism objectives must ask the student to explain or reconstruct the full process without notes.`,
      questionReferenceIds.length ? `Reference-question chunk IDs: ${questionReferenceIds.join(', ')}. Use their task patterns, representations, distinctions, and traps to make Be able to do and Watch for concrete. Do not copy stems, and never treat distractors as facts.` : '',
    ].filter(Boolean).join('\n'),
  })
  const result = await generateWithSourceRecovery(courseId, chunks, { action: 'generate', courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt, request: `Scope: ${scope}. Unit: ${unit}. Build a detailed source-grounded Mastery Map with objective-specific free-recall cues. Preserve the relevant objective structure and subpoints; do not summarize a detailed outline.${questionReferenceIds.length ? ' Use the marked question passages as task-pattern evidence without copying them.' : ''}` })
  if (!result.ok) return { ok: false, failure: failureFor(result.code), message: result.message }
  const issues: string[] = []
  let artifact = validateMasteryOutline(result.data.artifact, assembled.chunkIds, issues)
  if (!artifact) {
    const repair = await generateWithSourceRecovery(courseId, chunks, {
      action: 'generate', courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds,
      specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt,
      request: `Scope: ${scope}. Unit: ${unit}. Topic label: ${label}. Rebuild the complete Mastery Map from the same selected evidence. A prior attempt failed these deterministic checks: ${issues.join('; ')}. Correct every listed requirement. Keep all required fields, objective-specific cues, at least one cue explicitly saying "without notes" per objective, five distinct Understand points, two distinct Be able to do points, and one Watch for point. Source IDs must come only from the supplied evidence. Do not invent missing facts or repeat points to satisfy counts. Return the full valid artifact, not a patch.`,
    })
    if (!repair.ok) return { ok: false, failure: failureFor(repair.code), message: repair.message }
    issues.length = 0
    artifact = validateMasteryOutline(repair.data.artifact, assembled.chunkIds, issues)
  }
  if (!artifact) return { ok: false, failure: 'invalid-response', message: `The mastery outline did not pass its source-trace and section checks. Nothing was saved. Check: ${issues.join('; ')}` }
  return {
    ok: true,
    artifact: {
      courseId, title: generatedTitle(artifact.title), unit: artifact.unit, scope, specId: 'unit-mastery-outline-v1', specHash: assembled.specHash,
      standards: artifact.standards.map((standard) => ({ ...standard, masteryState: 'not-started' as const })), sourceChunkIds: [...new Set(artifact.standards.flatMap((standard) => standard.sourceChunkIds))],
    },
  }
}

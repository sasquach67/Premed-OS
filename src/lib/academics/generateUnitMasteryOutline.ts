import { assembleGenerationRequest } from '@/lib/generation'
import { assertGenerationAllowed, GenerationNotAllowedError, generatedTitle } from '@/lib/academics/generationPolicy'
import { prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import { studyTools } from '@/lib/intelligence/studyTools'
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

export async function generateUnitMasteryOutline({ courseId, chunks, unit, label }: { courseId: string; chunks: SourceChunk[]; unit: string; label: string }): Promise<UnitMasteryOutlineOutcome> {
  if (!chunks.length) return { ok: false, failure: 'no-sources', message: 'Select processed course material first. The mastery map stays empty rather than guessing.' }
  try {
    assertGenerationAllowed({ scope: 'academics', artifact: 'unit-mastery-outline', courseId, groundedIn: chunks.map((chunk) => chunk.id) })
  } catch (error) {
    return { ok: false, failure: 'not-allowed', message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.' }
  }
  const prepared = await prepareGenerationSources(courseId, chunks)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) return { ok: false, failure: 'provider-unavailable', message: prepared.message ?? 'Selected material could not be prepared.' }
  const assembled = assembleGenerationRequest({
    specId: 'unit-mastery-outline-v1', chunkIds: prepared.chunkIds, controls: { source_mode: 'SOURCE_ONLY' },
    request: `Unit: ${unit}. Topic label: ${label}. Build the mastery map from syllabus standards/objectives in the selected sources.`,
  })
  const result = await studyTools.generate({ action: 'generate', courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt, request: `Unit: ${unit}. Build a source-grounded mastery outline.` })
  if (!result.ok) return { ok: false, failure: failureFor(result.code), message: result.message }
  const artifact = validateMasteryOutline(result.data.artifact, assembled.chunkIds)
  if (!artifact) return { ok: false, failure: 'invalid-response', message: 'The mastery outline did not pass its source-trace and section checks. Nothing was saved.' }
  return {
    ok: true,
    artifact: {
      courseId, title: generatedTitle(artifact.title), unit: artifact.unit, specId: 'unit-mastery-outline-v1', specHash: assembled.specHash,
      standards: artifact.standards, sourceChunkIds: [...new Set(artifact.standards.flatMap((standard) => standard.sourceChunkIds))],
    },
  }
}

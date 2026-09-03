import { assembleGenerationRequest } from '@/lib/generation'
import { assertGenerationAllowed, GenerationNotAllowedError, generatedTitle } from '@/lib/academics/generationPolicy'
import { prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import { studyTools } from '@/lib/intelligence/studyTools'
import { blueprintForCourse, validateUnitQuestionBank } from '@/lib/academics/unitQuestionBank'
import type { GeneratedUnitQuestionBank, SourceChunk } from '@/lib/types'
import type { GenerateFailure } from './generateStudyGuide'

export interface UnitQuestionBankOutcome {
  ok: boolean
  failure?: GenerateFailure
  message?: string
  artifact?: Omit<GeneratedUnitQuestionBank, 'id' | 'createdAt' | 'updatedAt' | 'order'>
}

const QUESTION_LINE = /^(?:(?:q(?:uestion)?\s*)?\d+[.):]|[a-e][.)]|calculate\b|compare\b|determine\b|evaluate\b|explain\b|how\b|identify\b|interpret\b|predict\b|select\b|what\b|which\b|why\b)/i

/** Extract only recognizable question stems for the deterministic copy guard. */
export function referenceQuestionPhrases(chunks: readonly SourceChunk[], chunkIds: readonly string[]): string[] {
  const referenceIds = new Set(chunkIds)
  const phrases = chunks
    .filter((chunk) => referenceIds.has(chunk.id))
    .flatMap((chunk) => {
      const questions = chunk.content.match(/[^?\n]{16,}\?/g) ?? []
      const promptedLines = chunk.content.split(/\n+/).map((line) => line.trim()).filter((line) => line.length >= 16 && QUESTION_LINE.test(line))
      return [...questions, ...promptedLines]
    })
    .map((phrase) => phrase.trim().replace(/\s+/g, ' '))
    .filter((phrase) => phrase.length >= 16)
  return [...new Set(phrases)]
}

function failureFor(code: string): GenerateFailure {
  if (code === 'no-sources') return 'no-sources'
  if (code === 'sign-in-required') return 'sign-in-required'
  if (code === 'citation-not-carried') return 'citation-not-carried'
  if (code === 'invalid-response') return 'invalid-response'
  return 'provider-unavailable'
}

export async function generateUnitQuestionBank({
  courseId, chunks, unit, label, course,
  currentUnitPercent,
  privateAssessmentPhrases = [],
  practiceQuestionChunkIds = [],
  masteryStandardIds = [],
}: {
  courseId: string
  chunks: SourceChunk[]
  unit: string
  label: string
  course: { code?: string; title?: string; type?: string }
  currentUnitPercent?: number
  privateAssessmentPhrases?: string[]
  /** Selected passages whose assessment patterns should shape this bank. */
  practiceQuestionChunkIds?: readonly string[]
  /** When a saved mastery outline exists, its standard IDs become a closed
   *  coverage contract instead of a suggestion in the prompt. */
  masteryStandardIds?: readonly string[]
}): Promise<UnitQuestionBankOutcome> {
  if (!chunks.length) return { ok: false, failure: 'no-sources', message: 'Select processed course material first. The question bank stays empty rather than guessing.' }
  const blueprint = blueprintForCourse(course)
  const current = currentUnitPercent ?? blueprint.defaultCurrentUnitPercent
  const integration = 100 - current
  try {
    assertGenerationAllowed({ scope: 'academics', artifact: 'unit-question-bank', courseId, groundedIn: chunks.map((chunk) => chunk.id) })
  } catch (error) {
    return { ok: false, failure: 'not-allowed', message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.' }
  }
  const prepared = await prepareGenerationSources(courseId, chunks)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) return { ok: false, failure: 'provider-unavailable', message: prepared.message ?? 'Selected material could not be prepared.' }
  const preparedIds = new Set(prepared.chunkIds)
  const questionReferenceIds = [...new Set(practiceQuestionChunkIds.filter((id) => preparedIds.has(id)))]
  const protectedQuestionPhrases = [...new Set([
    ...privateAssessmentPhrases,
    ...referenceQuestionPhrases(chunks, questionReferenceIds),
  ])]
  const assembled = assembleGenerationRequest({
    specId: 'unit-question-bank-v1', chunkIds: prepared.chunkIds, controls: { source_mode: 'SOURCE_ONLY' },
    request: [
      `Unit: ${unit}. Topic label: ${label}. Course style: ${blueprint.courseStyle}.`,
      `Target mix: ${current}% current-unit and ${integration}% prior-unit integration.`,
      `Blueprint: ${blueprint.instruction}`,
      masteryStandardIds.length ? `Mastery standard IDs to cover exactly: ${masteryStandardIds.join(', ')}` : 'No saved mastery outline was supplied; use only standards stated in the selected sources.',
      questionReferenceIds.length ? `Reference-question chunk IDs: ${questionReferenceIds.join(', ')}. Model the full selected set's cognitive moves, difficulty, scenarios, representations, terminology, and distractor logic. Recombine those patterns with the selected course concepts; do not copy stems, answer choices, wording, or source-specific values.` : '',
      protectedQuestionPhrases.length ? 'Use assessment moves only; do not reproduce supplied assessment wording.' : '',
    ].filter(Boolean).join('\n'),
  })
  const result = await studyTools.generate({ action: 'generate', courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt, request: `Unit: ${unit}. Build the source-grounded unit question bank.${questionReferenceIds.length ? ' Use the marked question passages as assessment-pattern evidence without copying them.' : ''}` })
  if (!result.ok) return { ok: false, failure: failureFor(result.code), message: result.message }
  const artifact = validateUnitQuestionBank(result.data.artifact, assembled.chunkIds, protectedQuestionPhrases, masteryStandardIds)
  if (!artifact) return { ok: false, failure: 'invalid-response', message: 'The question bank did not pass source, answer-uniqueness, coverage, integration, or private-assessment similarity checks. Nothing was saved.' }
  return {
    ok: true,
    artifact: {
      courseId, title: generatedTitle(artifact.title), unit: artifact.unit, specId: 'unit-question-bank-v1', specHash: assembled.specHash,
      courseStyle: artifact.courseStyle, currentUnitPercent: artifact.currentUnitPercent, integrationPercent: artifact.integrationPercent,
      questions: artifact.questions, sourceChunkIds: [...new Set(artifact.questions.flatMap((question) => question.sourceChunkIds))],
    },
  }
}

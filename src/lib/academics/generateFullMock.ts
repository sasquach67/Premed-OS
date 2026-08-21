import { assembleGenerationRequest } from '@/lib/generation'
import { assertGenerationAllowed, GenerationNotAllowedError } from '@/lib/academics/generationPolicy'
import { studyTools } from '@/lib/intelligence/studyTools'
import { validateGeneratedMockQuestions } from './fullMock'
import type { GeneratedMockQuestion, SourceChunk } from '@/lib/types'
import type { GenerateFailure } from './generateStudyGuide'

export interface FullMockGenerationOutcome { ok: boolean; failure?: GenerateFailure; message?: string; questions?: GeneratedMockQuestion[]; specHash?: string }

export async function generateFullMock({ courseId, topicId, chunks, label }: { courseId: string; topicId?: string; chunks: SourceChunk[]; label: string }): Promise<FullMockGenerationOutcome> {
  if (!chunks.length) return { ok: false, failure: 'no-sources', message: 'Link processed student material before generating a class mock.' }
  try { assertGenerationAllowed({ scope: 'academics', artifact: 'practice-exam', courseId, groundedIn: chunks.map((chunk) => chunk.id) }) }
  catch (error) { return { ok: false, failure: 'not-allowed', message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.' } }
  const assembled = assembleGenerationRequest({ specId: 'class-full-mock-v1', chunkIds: chunks.map((chunk) => chunk.id), request: `Exam: ${label}. Action: generate a timed class practice mock from these sources only.` })
  const result = await studyTools.generate({ action: 'generate', courseId, topicId: topicId ?? chunks[0].topicId ?? '', chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt, request: `Exam: ${label}.` })
  if (!result.ok) return { ok: false, failure: result.code === 'no-sources' ? 'no-sources' : result.code === 'sign-in-required' ? 'sign-in-required' : result.code === 'citation-not-carried' ? 'citation-not-carried' : result.code === 'invalid-response' ? 'invalid-response' : 'provider-unavailable', message: result.message }
  const questions = validateGeneratedMockQuestions(result.data.artifact, assembled.chunkIds)
  if (!questions) return { ok: false, failure: 'invalid-response', message: 'The generated mock did not pass its source checks. Nothing was saved.' }
  return { ok: true, questions, specHash: assembled.specHash }
}

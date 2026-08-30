import { assembleGenerationRequest } from '@/lib/generation'
import { assertGenerationAllowed, GenerationNotAllowedError } from '@/lib/academics/generationPolicy'
import { prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import { studyTools } from '@/lib/intelligence/studyTools'
import type { GeneratedFlashcard, SourceChunk } from '@/lib/types'
import type { GenerateFailure } from './generateStudyGuide'

export interface FlashcardGenerationOutcome {
  ok: boolean
  failure?: GenerateFailure
  message?: string
  cards?: GeneratedFlashcard[]
  specHash?: string
}

const TYPES = new Set<GeneratedFlashcard['type']>(['basic', 'cloze', 'conceptual', 'process', 'comparison', 'application', 'exemplar', 'free-recall'])

/** Deterministic boundary checks only; pedagogical judgement stays with the model. */
export function validateFlashcards(value: unknown, closedChunkIds: readonly string[]): GeneratedFlashcard[] | null {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { cards?: unknown }).cards)) return null
  const allowed = new Set(closedChunkIds)
  const cards = (value as { cards: unknown[] }).cards
  if (!cards.length) return null
  const out: GeneratedFlashcard[] = []
  for (const raw of cards) {
    if (!raw || typeof raw !== 'object') return null
    const card = raw as Partial<GeneratedFlashcard>
    if (!card.id || !TYPES.has(card.type as GeneratedFlashcard['type']) || !card.conceptId || !card.sourceChunkId || !allowed.has(card.sourceChunkId) || !Array.isArray(card.tags)) return null
    const body = card.type === 'cloze' ? card.cloze : card.front && card.back
    if (!body || (card.type === 'cloze' && !/{{c\d+::.+?}}/.test(card.cloze!))) return null
    if (card.extra != null && (!card.extra.startsWith('Ex:') || card.extra.includes('\nEx:'))) return null
    if ([card.front, card.back, card.cloze, card.extra].some((text) => typeof text === 'string' && /[—–]/.test(text))) return null
    out.push({ ...card, tags: [...card.tags] } as GeneratedFlashcard)
  }
  return out
}

export async function generateFlashcards({ courseId, chunks, label }: { courseId: string; topicId?: string; chunks: SourceChunk[]; label: string }): Promise<FlashcardGenerationOutcome> {
  if (!chunks.length) return { ok: false, failure: 'no-sources', message: 'Select processed course material first. Premed OS will not create cards from general course knowledge.' }
  try { assertGenerationAllowed({ scope: 'academics', artifact: 'flashcards', courseId, groundedIn: chunks.map((chunk) => chunk.id) }) }
  catch (error) { return { ok: false, failure: 'not-allowed', message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.' } }
  const prepared = await prepareGenerationSources(courseId, chunks)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) return { ok: false, failure: 'provider-unavailable', message: prepared.message ?? 'Source material could not be prepared.' }
  const assembled = assembleGenerationRequest({ specId: 'flashcards-v1', chunkIds: prepared.chunkIds, request: `Topic: ${label}. Action: generate Flashcards V1.` })
  const result = await studyTools.generate({ action: 'generate', courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt, request: `Topic: ${label}.` })
  if (!result.ok) return { ok: false, failure: result.code === 'no-sources' ? 'no-sources' : result.code === 'sign-in-required' ? 'sign-in-required' : result.code === 'citation-not-carried' ? 'citation-not-carried' : result.code === 'invalid-response' ? 'invalid-response' : 'provider-unavailable', message: result.message }
  const cards = validateFlashcards(result.data.artifact, assembled.chunkIds)
  if (!cards) return { ok: false, failure: 'invalid-response', message: 'The card set did not pass its source and format checks. Nothing was saved.' }
  return { ok: true, cards, specHash: assembled.specHash }
}

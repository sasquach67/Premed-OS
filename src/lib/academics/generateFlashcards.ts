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
const CLOZE_PATTERNS = new Set<NonNullable<GeneratedFlashcard['clozePattern']>>(['single', 'independent', 'enumerated-list', 'definition'])
const BANNED_PROMPTS = ['what is the primary function of', 'what is the significance of', 'explain the role of', 'describe the process by which', 'what are the key characteristics of']
const UNANCHORED = [/how (has|have|did) .* chang/i, /what replaced/i, /what is the modern view/i, /how does .* differ/i, /what makes .* different/i, /what did (she|the lecture|the professor) say/i, /what was (her|the) point/i, /according to this course/i]
const FINITE_VERBS = new Set('is are was were has have had can cannot could should would will must may might do does did causes cause affects affect argues argue shows show means mean explains explain emphasizes emphasize controls control shapes shape produces produce uses use forms form makes make'.split(' '))

function words(value: string) { return value.match(/[\p{L}\p{N}'’-]+/gu) ?? [] }
function clozeIndices(value: string) { return [...value.matchAll(/\{\{c(\d+)::.+?\}\}/g)].map((match) => Number(match[1])) }
function completeRecallSentence(value: string) {
  const body = value.includes(':') ? value.slice(value.indexOf(':') + 1) : value
  return words(body).length <= 8 || words(body).some((word) => FINITE_VERBS.has(word.toLowerCase()))
}

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
    if (card.salience !== 'load-bearing' && card.salience !== 'attaching') return null
    if (!Number.isInteger(card.difficultyEstimate) || card.difficultyEstimate! < 1 || card.difficultyEstimate! > 5) return null
    const isCloze = Boolean(card.cloze)
    if (isCloze !== Boolean(card.clozePattern) || (isCloze && (card.front || card.back))) return null
    if (!isCloze && card.type !== 'free-recall' && (!card.front || !card.back)) return null
    if (isCloze && (!CLOZE_PATTERNS.has(card.clozePattern!) || !/{{c\d+::.+?}}/.test(card.cloze!))) return null
    const indices = isCloze ? [...new Set(clozeIndices(card.cloze!))].sort((a, b) => a - b) : []
    if (card.clozePattern === 'single' || card.clozePattern === 'definition') { if (indices.length !== 1) return null }
    if (card.clozePattern === 'independent' && indices.length < 2) return null
    if (card.clozePattern === 'enumerated-list' && (indices.length < 2 || indices.length > 6 || indices.some((index, position) => index !== position + 1) || typeof card.listOrdered !== 'boolean')) return null
    if (card.type === 'comparison' && !card.axis?.trim()) return null
    if (card.type === 'exemplar' && card.exemplarDirection !== 'instance-to-concept' && card.exemplarDirection !== 'concept-to-instance') return null
    if (card.type === 'free-recall') {
      if (!card.recallItems || card.recallItems.length < 3 || card.recallItems.length > 7 || !card.front || !new RegExp(`\\b${card.recallItems.length}\\b`).test(card.front) || card.recallItems.some((item) => words(item).length < 3 || !completeRecallSentence(item))) return null
    } else if (card.recallItems?.length) return null
    if (card.extra != null && (!card.extra.startsWith('Ex:') || card.extra.includes('\nEx:'))) return null
    if ([card.front, card.back, card.cloze, card.extra, ...(card.recallItems ?? [])].some((text) => typeof text === 'string' && /[—–]/.test(text))) return null
    if (!isCloze && BANNED_PROMPTS.some((prompt) => card.front!.toLowerCase().includes(prompt))) return null
    if (!isCloze && card.type !== 'free-recall' && UNANCHORED.some((pattern) => pattern.test(card.front!))) return null
    if (!isCloze && card.type !== 'free-recall' && words(card.back!).length > 45) return null
    out.push({ ...card, tags: [...card.tags] } as GeneratedFlashcard)
  }
  const frameworks = new Set(out.filter((card) => card.conceptKind === 'framework').map((card) => card.conceptId))
  for (const conceptId of frameworks) if (out.filter((card) => card.conceptId === conceptId && card.type === 'free-recall').length !== 1) return null
  // Small, intentionally atomic decks are exempt. At normal deck size, a term-list
  // export is invalid even when every individual card looks well-formed.
  if (out.length >= 7) {
    const conceptual = out.filter((card) => card.type === 'conceptual' || card.type === 'application').length
    const relational = out.filter((card) => card.type === 'comparison' || card.type === 'exemplar' || (card.type === 'conceptual' && Boolean(card.relational))).length
    if (conceptual / out.length < 0.15 || relational / out.length < 0.25) return null
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

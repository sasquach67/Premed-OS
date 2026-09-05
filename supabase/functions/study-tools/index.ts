import { createClient } from 'npm:@supabase/supabase-js@2.110.2'
import { OpenAIGenerationResponseError, readOpenAIGenerationResponse } from '../_shared/openAIGenerationResponse.ts'
import { createOpenAICitationWire } from '../_shared/openAICitationWire.ts'
import {
  canonicalizeOpenAIGenerationSourceRefs,
  OPENAI_GENERATION_CITATION_INSTRUCTION,
  openAIGenerationSourceRefRequired,
} from '../_shared/openAIGenerationGrounding.ts'

const MAX_REQUEST_BYTES = 8 * 1024 * 1024
const MAX_CHUNKS = 2_000
const MAX_QUESTION_BANK_CHUNKS = 2_000
const CHUNK_RETRIEVAL_BATCH_SIZE = 100
const SOURCE_SYNC_BATCH_SIZE = 100
const MAX_QUESTION_BANK_VISUALS = 24
const MAX_QUESTION_BANK_VISUAL_BYTES = 4_500_000
const MAX_AUDIO_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Chunk = {
  chunk_id: string
  file_id: string
  content: string
  character_start: number
  character_end: number
}

type ProviderCitation = { fileId: string; chunkId: string; start: number; end: number }
type QuestionBankVisualSource = { fileId: string; title: string; mimeType: string; size: number; dataBase64: string }
type GenerationAuditStatus = 'approved' | 'skipped' | 'unavailable'
type AIQuotaReason = 'allowed' | 'founder' | 'hourly-limit' | 'daily-limit' | 'weekly-budget-limit' | 'invalid-request'
type AIQuotaClaim = {
  allowed: boolean
  reason: AIQuotaReason
  resetAt: string | null
  reservationCents: number
  error: unknown
}

/**
 * `08` §2.5 / decision D-2 — the limit counts ARTIFACTS, not calls, so a
 * two-pass generation costs what it is worth rather than double.
 */
const AI_REQUEST_WEIGHT = {
  'gap-check': 1,
  'transcribe-response': 1,
  generate: 2,
  'term-report': 2,
} as const

// These are reservations, not optimistic estimates: the source/input limits
// below and the two-pass generation ceiling make each amount a safe maximum.
// Keeping the $10 weekly budget server-side means a client cannot bypass it.
const AI_BETA_RESERVATION_CENTS = {
  'sync-sources': 25,
  'gap-check': 50,
  'transcribe-response': 50,
  generate: 300,
  'term-report': 350,
} as const
const MAX_PROVIDER_SOURCE_CHARS = 700_000
// Opus receives the complete selected Question Bank corpus in one grounded
// pass. This keeps the request inside its context window without silently
// dropping passages or weakening source traceability.
const MAX_QUESTION_BANK_SOURCE_CHARS = 700_000

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return failure(405, 'method-not-allowed', 'POST required.')

  const length = Number(request.headers.get('content-length') || 0)
  if (length > MAX_REQUEST_BYTES) return failure(413, 'request-too-large', 'Request exceeds the 8 MB limit.')

  const authorization = request.headers.get('Authorization')
  if (!authorization) return failure(401, 'sign-in-required', 'Authentication required.')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return failure(503, 'server-unconfigured', 'Study tools are not configured.')
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) return failure(401, 'sign-in-required', 'Authentication required.')
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    return failure(413, 'request-too-large', 'Request exceeds the 8 MB limit.')
  }
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return failure(400, 'invalid-request', 'A JSON request is required.')
  }
  if (body.action === 'delete-sources') {
    const { error } = await client
      .from('academic_source_chunks')
      .delete()
      .eq('user_id', userData.user.id)
    if (error) return failure(503, 'delete-failed', 'The server source copy could not be deleted.')
    return json({ deleted: true })
  }

  if (body.action === 'sync-sources') {
    if (!isText(body.courseId) || !isText(body.topicId)) {
      return failure(400, 'invalid-request', 'A typed source-scope sync is required.')
    }
    if (body.purpose != null && body.purpose !== 'unit-question-bank') {
      return failure(400, 'invalid-request', 'An unsupported source-sync purpose was supplied.')
    }
    const isQuestionBankSync = body.purpose === 'unit-question-bank'
    const suppliedSources = validateSources(body.sources, isQuestionBankSync ? MAX_QUESTION_BANK_CHUNKS : MAX_CHUNKS)
    if (!suppliedSources) {
      return failure(400, 'invalid-request', 'Sources must use the typed source-scope contract.')
    }
    const sourceCharacterLimit = isQuestionBankSync
      ? MAX_QUESTION_BANK_SOURCE_CHARS
      : MAX_PROVIDER_SOURCE_CHARS
    if (totalSourceChars(suppliedSources) > sourceCharacterLimit) {
      return failure(413, 'request-too-large', 'Selected source material exceeds the safe full-corpus limit for one AI action.')
    }
    const shouldEmbed = !isQuestionBankSync && suppliedSources.length <= 24 && Boolean(Deno.env.get('OPENAI_EMBEDDING_API_KEY'))
    const quota = await claimAIRequest(
      serviceClient,
      userData.user.id,
      1,
      shouldEmbed ? AI_BETA_RESERVATION_CENTS['sync-sources'] : 0,
    )
    if (quota.error) return failure(503, 'usage-check-failed', 'Usage could not be verified.')
    if (!quota.allowed) return quotaFailure(quota)
    try {
      await mirrorLocalSources(
        client,
        userData.user.id,
        body.courseId,
        body.topicId,
        suppliedSources,
        { embed: shouldEmbed },
      )
      return json({ synced: suppliedSources.length })
    } catch (error) {
      console.error('study-tools source sync failure', error instanceof Error ? error.message : 'unknown')
      return failure(503, 'sync-failed', 'Source material could not be synced.')
    }
  }

  if (body.action === 'transcribe-response') {
    if (!isText(body.courseId) || !isText(body.topicId)) {
      return failure(400, 'invalid-request', 'A typed course and topic are required for transcription.')
    }
    const audio = validateAudioEvidence(body.audio)
    if (!audio) return failure(400, 'invalid-request', 'Use one supported audio recording no larger than 4 MB.')
    if (!Deno.env.get('OPENAI_API_KEY')) {
      return failure(503, 'server-unconfigured', 'Audio transcription is not configured. You can still type your recall.')
    }
    const quota = await claimAIRequest(
      serviceClient,
      userData.user.id,
      AI_REQUEST_WEIGHT['transcribe-response'],
      AI_BETA_RESERVATION_CENTS['transcribe-response'],
    )
    if (quota.error) return failure(503, 'usage-check-failed', 'Usage could not be verified.')
    if (!quota.allowed) return quotaFailure(quota)
    try {
      const transcript = await transcribeAudio(audio)
      return json({ transcript })
    } catch (error) {
      console.error('study-tools transcription failure', error instanceof Error ? error.message : 'unknown')
      if (error instanceof ProviderRejectedError) await releaseAIReservation(serviceClient, userData.user.id, quota.reservationCents)
      return failure(503, 'provider-unavailable', 'Audio transcription is unavailable. You can still type your recall.')
    }
  }

  /**
   * A Term Report deliberately has a separate route from material generation.
   * The user reviews the compact record snapshot before it leaves the device;
   * evidence IDs are passed as titled documents so citations and returned refs
   * can be mechanically closed without pretending local records live in the
   * source-chunk mirror.
   */
  if (body.action === 'term-report') {
    if (!isText(body.term) || !isText(body.systemPrompt)) {
      return failure(400, 'invalid-request', 'A term and assembled report spec are required.')
    }
    const evidence = validateTermEvidence(body.evidence)
    if (!evidence?.length) return failure(422, 'no-sources', 'No reviewed term evidence is available.')

    const chunks: Chunk[] = evidence.map((item) => ({
      chunk_id: item.id,
      file_id: 'local-term-record',
      content: item.content,
      character_start: 0,
      character_end: item.content.length,
    }))
    if (totalChunkChars(chunks) > MAX_PROVIDER_SOURCE_CHARS) {
      return failure(413, 'request-too-large', 'Selected term evidence is too large for one AI action.')
    }
    if (!Deno.env.get('OPENAI_API_KEY')) {
      return failure(503, 'server-unconfigured', 'Term Report generation is not configured. Nothing was saved.')
    }
    const quota = await claimAIRequest(
      serviceClient,
      userData.user.id,
      AI_REQUEST_WEIGHT['term-report'],
      AI_BETA_RESERVATION_CENTS['term-report'],
    )
    if (quota.error) return failure(503, 'usage-check-failed', 'Usage could not be verified.')
    if (!quota.allowed) return quotaFailure(quota)
    try {
      const primary = await callOpenAIGeneration(
        'Create the Term Report from this reviewed evidence snapshot.',
        chunks,
        body.systemPrompt,
      )
      const closed = closeCitationSet(primary.trustedCitations, chunks)
      if (!closed.length) return failure(422, 'no-verified-citations', 'No report claim could be traced to the reviewed evidence.')
      const allowedCitationIds = new Set(closed.map((ref) => ref.chunkId))
      if (!validateTermReportArtifact(primary.value, allowedCitationIds)) {
        return failure(502, 'invalid-response', 'The report included unsupported or invalid wording. Nothing was saved.')
      }

      let auditStatus: GenerationAuditStatus = 'skipped'
      if (Deno.env.get('ANTHROPIC_API_KEY')) {
        try {
          const audit = await callAnthropicAudit(primary.value, chunks, body.systemPrompt)
          if (!audit.approved) {
            return failure(502, 'audit-rejected', 'The secondary review found a source or specification problem. Nothing was saved.')
          }
          auditStatus = 'approved'
        } catch (error) {
          console.error('term report audit unavailable', error instanceof Error ? error.message : 'unknown')
          auditStatus = 'unavailable'
        }
      }
      return json({ artifact: primary.value, citations: closed, auditStatus })
    } catch (error) {
      console.error('term report generation failure', error instanceof Error ? error.message : 'unknown')
      if (error instanceof ProviderRejectedError) await releaseAIReservation(serviceClient, userData.user.id, quota.reservationCents)
      return failure(503, 'provider-unavailable', 'The AI provider is unavailable.')
    }
  }

  const isGapCheck = body.action === 'gap-check'
  const isGeneration = body.action === 'generate'
  const isQuestionBankGeneration = isGeneration && body.specId === 'unit-question-bank-v1'
  const visualSources = isQuestionBankGeneration ? validateQuestionBankVisualSources(body.visualSources) : []
  const evidence = isGapCheck ? validateGapEvidence(body.evidence) : null
  if ((!isGapCheck && !isGeneration) || !isText(body.courseId) || !isText(body.topicId) || (isGapCheck && !evidence)
    || (isQuestionBankGeneration && (!visualSources || body.webPatternResearch !== true))
    || (!isQuestionBankGeneration && (body.visualSources != null || body.webPatternResearch != null))) {
    return failure(400, 'invalid-request', 'A typed study-tool request is required.')
  }
  const chunkIds = validateChunkIds(
    body.chunkIds,
    isQuestionBankGeneration ? MAX_QUESTION_BANK_CHUNKS : MAX_CHUNKS,
  )
  if (!chunkIds?.length) return failure(400, 'invalid-request', 'At least one trusted chunk ID is required.')

  let chunks: Chunk[]
  try {
    chunks = await retrieveChunks(client, userData.user.id, body.courseId, body.topicId, chunkIds)
  } catch (error) {
    console.error('study-tools source retrieval failure', error instanceof Error ? error.message : 'unknown')
    return failure(503, 'source-read-failed', 'Synced source material could not be read. Nothing was generated.')
  }
  if (!chunks.length) return failure(422, 'no-sources', 'No selected source material is available.')
  if (isQuestionBankGeneration && chunks.length !== chunkIds.length) {
    return failure(422, 'source-sync-incomplete', 'The complete selected corpus could not be verified. Nothing was generated.')
  }
  const sourceCharacterLimit = isQuestionBankGeneration
    ? MAX_QUESTION_BANK_SOURCE_CHARS
    : MAX_PROVIDER_SOURCE_CHARS
  if (totalChunkChars(chunks) > sourceCharacterLimit) {
    return failure(413, 'request-too-large', 'Selected source material exceeds the safe full-corpus limit for one AI action.')
  }
  if (isGeneration && isQuestionBankGeneration && !Deno.env.get('ANTHROPIC_API_KEY')) {
    return failure(503, 'anthropic-unconfigured', 'Claude question generation is not configured. Nothing was saved.')
  }
  if (isGeneration && !isQuestionBankGeneration && !Deno.env.get('OPENAI_API_KEY')) {
    return failure(503, 'server-unconfigured', 'OpenAI generation is not configured. Nothing was saved.')
  }
  const gapProvider = (Deno.env.get('AI_PROVIDER') || 'openai').toLowerCase()
  if (isGapCheck && !Deno.env.get(gapProvider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY')) {
    return failure(503, 'server-unconfigured', 'Gap Check generation is not configured. Nothing was saved.')
  }
  const quota = await claimAIRequest(
    serviceClient,
    userData.user.id,
    body.action === 'generate'
      ? AI_REQUEST_WEIGHT.generate
      : AI_REQUEST_WEIGHT['gap-check'],
    body.action === 'generate'
      ? AI_BETA_RESERVATION_CENTS.generate
      : AI_BETA_RESERVATION_CENTS['gap-check'],
  )
  if (quota.error) return failure(503, 'usage-check-failed', 'Usage could not be verified.')
  if (!quota.allowed) return quotaFailure(quota)

  /**
   * `generate` — the two-pass pipeline (`01` §5.1), Phase 2.
   *
   * OpenAI is the default primary generator. Unit Question Bank V1 is a strict
   * Anthropic-only carve-out: Claude authors the structured stimulus sets and
   * the server-side validators close every source reference before anything can
   * be saved. There is no cross-provider audit and no OpenAI fallback for this
   * artifact. If Anthropic is unavailable or out of credit, the bank fails
   * closed and the student receives the provider-specific reason.
   *
   * ⚠️ A citation identity outside the closed set REJECTS the artifact.
   * The server may canonicalize the range of a valid model-selected source to
   * that server-owned chunk's full text; it never chooses or substitutes a
   * source identity on the model's behalf.
   *
   * ⚠️ The same rule is implemented and exhaustively tested client-side in
   * `src/lib/generation/citations.ts`. That module is the readable reference;
   * this is the enforcement. If one changes, change both — the shapes are
   * deliberately identical so a diff is obvious.
   */
  if (body.action === 'generate') {
    const specPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : ''
    if (!specPrompt.trim()) {
      return failure(400, 'invalid-request', 'An assembled spec prompt is required.')
    }
    try {
      const requestText = typeof body.request === 'string' ? body.request : 'Generate the artifact.'
      const isQuestionBank = isQuestionBankGeneration
      const primaryProvider: 'anthropic' | 'openai' = isQuestionBank ? 'anthropic' : 'openai'
      const primary = isQuestionBank
        ? await callAnthropicGeneration(requestText, chunks, specPrompt, visualSources ?? [])
        : await callOpenAIGeneration(requestText, chunks, specPrompt)
      if (isQuestionBank && primary.webSearchRequests < 1) {
        return failure(502, 'web-search-not-used', 'Claude did not complete the required official assessment-pattern search. Nothing was saved.')
      }
      const closed = closeCitationSet(primary.trustedCitations, chunks)
      if (!closed.length) {
        return failure(422, 'no-verified-citations', 'No citation from the generated artifact could be verified against your material.')
      }
      const citationIssues: string[] = []
      if (!validateArtifactReferences(primary.value, closed, citationIssues)) {
        return failure(502, 'citation-not-carried', 'The generated artifact referenced material outside the verified citation set. Nothing was saved.', { issues: citationIssues.slice(0, 5) })
      }

      let auditStatus: GenerationAuditStatus = 'skipped'
      if (!isQuestionBank && Deno.env.get('ANTHROPIC_API_KEY')) {
        try {
          const audit = await callAnthropicAudit(primary.value, chunks, specPrompt)
          if (!audit.approved) {
            return failure(
              502,
              'audit-rejected',
              'The secondary review found a source or specification problem. Nothing was saved.',
              { issues: safeAuditIssues(audit.issues) },
            )
          }
          auditStatus = 'approved'
        } catch (error) {
          console.error('study-tools audit unavailable', error instanceof Error ? error.message : 'unknown')
          auditStatus = 'unavailable'
        }
      }
      return json({
        artifact: primary.value,
        citations: closed,
        auditStatus,
        primaryProvider,
        visualSourceFileIds: isQuestionBank ? (visualSources ?? []).map((source) => source.fileId) : [],
        webSearchRequests: primary.webSearchRequests,
      })
    } catch (error) {
      console.error('study-tools generate failure', error instanceof Error ? error.message : 'unknown')
      if (error instanceof OpenAIGenerationResponseError) {
        if (error.rejected) await releaseAIReservation(serviceClient, userData.user.id, quota.reservationCents)
        return failure(503, error.code, `${error.message} Nothing was saved.`)
      }
      if (error instanceof AnthropicGenerationError && error.reason === 'credit-exhausted') {
        await releaseAIReservation(serviceClient, userData.user.id, quota.reservationCents)
        return failure(402, 'anthropic-credit-exhausted', 'Anthropic credits are exhausted. Add credits before generating another question bank. Nothing was saved.')
      }
      if (error instanceof ProviderRejectedError) await releaseAIReservation(serviceClient, userData.user.id, quota.reservationCents)
      return failure(503, 'provider-unavailable', 'The AI provider is unavailable.')
    }
  }

  try {
    const provider = (Deno.env.get('AI_PROVIDER') || 'openai').toLowerCase()
    const response = responseForGapEvidence(evidence!)
    const output = provider === 'openai'
      ? await callOpenAI(response, chunks, evidence!.image)
      : await callAnthropic(response, chunks, typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined, resultSchema, evidence!.image)
    const validated = validateResult(output.value, chunks, output.trustedCitations)
    if (!validated) return failure(502, 'invalid-response', 'The provider returned invalid structured data.')
    return json(validated)
  } catch (error) {
    console.error('study-tools provider failure', error instanceof Error ? error.message : 'unknown')
    if (error instanceof ProviderRejectedError) await releaseAIReservation(serviceClient, userData.user.id, quota.reservationCents)
    return failure(503, 'provider-unavailable', 'The AI provider is unavailable.')
  }
})

/**
 * Keep a citation only if its chunk exists, its file matches, and its offsets
 * fall inside that chunk's real content.
 *
 * An offset past the end is DROPPED, never clamped: clamping would invent a
 * quotation the source does not contain, which is worse than losing a citation.
 */
function closeCitationSet(
  attested: ProviderCitation[],
  chunks: Chunk[],
) {
  const byId = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]))
  return attested.filter((ref) => {
    const chunk = byId.get(ref.chunkId)
    if (!chunk) return false
    if (chunk.file_id !== ref.fileId) return false
    if (!Number.isFinite(ref.start) || !Number.isFinite(ref.end)) return false
    return ref.start >= 0 && ref.end > ref.start && ref.end <= chunk.content.length
  })
}

/** Enforce the citation IDs written inside generated artifacts, not only the
 * provider citation metadata returned beside them. This covers Study Guide
 * `sourceRef`, Revised Notes `sourceRefs`, and Flashcards `sourceChunkId`.
 */
function validateArtifactReferences(
  value: unknown,
  closed: ProviderCitation[],
  issues: string[] = [],
) {
  const exact = new Set(closed.map((ref) => `${ref.fileId}:${ref.chunkId}:${ref.start}:${ref.end}`))
  const chunks = new Set(closed.map((ref) => ref.chunkId))
  let valid = true

  function exactRef(candidate: unknown) {
    if (!candidate || typeof candidate !== 'object') return false
    const ref = candidate as Record<string, unknown>
    return typeof ref.fileId === 'string'
      && typeof ref.chunkId === 'string'
      && typeof ref.start === 'number'
      && typeof ref.end === 'number'
      && exact.has(`${ref.fileId}:${ref.chunkId}:${ref.start}:${ref.end}`)
  }

  function visit(candidate: unknown, path = 'artifact') {
    if (issues.length >= 5 || candidate == null) return
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (typeof candidate !== 'object') return
    const record = candidate as Record<string, unknown>
    const fail = (reason: string) => { valid = false; issues.push(`${path}: ${reason}`) }
    if (openAIGenerationSourceRefRequired(record) && !exactRef(record.sourceRef)) fail(record.sourceRef == null ? 'required sourceRef missing' : 'required sourceRef unverified')
    else if (record.sourceRef != null && !exactRef(record.sourceRef)) fail('sourceRef unverified')
    if (record.sourceRefs != null) {
      if (!Array.isArray(record.sourceRefs) || !record.sourceRefs.length || !record.sourceRefs.every(exactRef)) fail('sourceRefs empty or unverified')
    }
    if (record.sourceChunkId != null && (typeof record.sourceChunkId !== 'string' || !chunks.has(record.sourceChunkId))) fail('sourceChunkId unverified')
    if (record.sourceChunkIds != null && (
      !Array.isArray(record.sourceChunkIds)
      || record.sourceChunkIds.some((id) => typeof id !== 'string' || !chunks.has(id))
    )) fail('sourceChunkIds unverified')
    Object.entries(record).forEach(([key, item]) => visit(item, `${path}.${/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key) ? key : 'field'}`))
  }

  visit(value)
  return valid
}

/**
 * OpenAI returns the artifact itself as the attestation. Collect only source
 * references the artifact explicitly wrote, then let `closeCitationSet` check
 * them against the server-owned chunks. Chunk-only artifact formats (cards,
 * banks, mastery outlines, and term reports) intentionally close to the full
 * cited chunk; the model still chooses the chunk ID, while the server derives
 * the only safe range without inventing a narrower quotation.
 */
function collectArtifactCitations(value: unknown, chunks: Chunk[]): ProviderCitation[] {
  const byId = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]))
  const collected = new Map<string, ProviderCitation>()

  function addExact(candidate: unknown) {
    if (!candidate || typeof candidate !== 'object') return
    const ref = candidate as Record<string, unknown>
    if (!isText(ref.fileId) || !isText(ref.chunkId) || !Number.isInteger(ref.start) || !Number.isInteger(ref.end)) return
    const citation = { fileId: ref.fileId, chunkId: ref.chunkId, start: Number(ref.start), end: Number(ref.end) }
    collected.set(`${citation.fileId}:${citation.chunkId}:${citation.start}:${citation.end}`, citation)
  }

  function addChunkId(candidate: unknown) {
    if (!isText(candidate)) return
    const chunk = byId.get(candidate)
    if (!chunk || !chunk.content.length) return
    const citation = { fileId: chunk.file_id, chunkId: chunk.chunk_id, start: 0, end: chunk.content.length }
    collected.set(`${citation.fileId}:${citation.chunkId}:${citation.start}:${citation.end}`, citation)
  }

  function visit(candidate: unknown) {
    if (candidate == null) return
    if (Array.isArray(candidate)) {
      candidate.forEach(visit)
      return
    }
    if (typeof candidate !== 'object') return
    const record = candidate as Record<string, unknown>
    if (record.sourceRef != null) addExact(record.sourceRef)
    if (Array.isArray(record.sourceRefs)) record.sourceRefs.forEach(addExact)
    if (record.sourceChunkId != null) addChunkId(record.sourceChunkId)
    if (Array.isArray(record.sourceChunkIds)) record.sourceChunkIds.forEach(addChunkId)
    if (record.evidenceId != null) addChunkId(record.evidenceId)
    if (Array.isArray(record.evidenceIds)) record.evidenceIds.forEach(addChunkId)
    Object.values(record).forEach(visit)
  }

  visit(value)
  return [...collected.values()]
}

async function claimAIRequest(
  serviceClient: unknown,
  userId: string,
  weight: number,
  reservedCents: number,
): Promise<AIQuotaClaim> {
  const rpcClient = serviceClient as {
    rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>
  }
  const { data, error } = await rpcClient.rpc('claim_ai_request_v2', {
    p_user_id: userId,
    p_weight: weight,
    p_reserved_cents: reservedCents,
  })
  if (error || !isRecord(data)) {
    return { allowed: false, reason: 'invalid-request', resetAt: null, reservationCents: 0, error: error ?? new Error('Invalid quota response') }
  }
  const reason = isAIQuotaReason(data.reason) ? data.reason : 'invalid-request'
  return {
    allowed: data.allowed === true,
    reason,
    resetAt: typeof data.reset_at === 'string' ? data.reset_at : null,
    reservationCents: Number.isInteger(data.reservation_cents) ? Number(data.reservation_cents) : 0,
    error: null,
  }
}

async function releaseAIReservation(
  serviceClient: unknown,
  userId: string,
  reservedCents: number,
) {
  if (reservedCents < 1) return
  const rpcClient = serviceClient as {
    rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>
  }
  const { error } = await rpcClient.rpc('release_ai_reservation', {
    p_user_id: userId,
    p_reserved_cents: reservedCents,
  })
  if (error) console.error('study-tools quota release failure', error.message)
}

function isAIQuotaReason(value: unknown): value is AIQuotaReason {
  return value === 'allowed' || value === 'founder' || value === 'hourly-limit'
    || value === 'daily-limit' || value === 'weekly-budget-limit' || value === 'invalid-request'
}

function quotaFailure(quota: AIQuotaClaim) {
  const message = quota.reason === 'hourly-limit'
    ? 'Your hourly AI limit has been reached.'
    : quota.reason === 'daily-limit'
      ? 'Your daily AI limit has been reached.'
      : quota.reason === 'weekly-budget-limit'
        ? 'The shared beta AI budget has been used for this week.'
        : 'AI usage could not be allowed for this request.'
  return failure(429, quota.reason, message, { resetAt: quota.resetAt })
}

function totalSourceChars(sources: Array<{ content: string }>) {
  return sources.reduce((total, source) => total + source.content.length, 0)
}

function totalChunkChars(chunks: Chunk[]) {
  return chunks.reduce((total, chunk) => total + chunk.content.length, 0)
}

async function mirrorLocalSources(
  client: ReturnType<typeof createClient>,
  userId: string,
  courseId: string,
  topicId: string,
  sources: Array<{ chunkId: string; fileId: string; content: string; start: number; end: number }>,
  options: { embed?: boolean } = {},
) {
  const embeddings = options.embed === false
    ? null
    : await embedTexts(sources.map((source) => source.content))
  const rows = sources.map((source, index) => ({
    user_id: userId,
    chunk_id: source.chunkId,
    file_id: source.fileId,
    course_id: courseId,
    topic_id: topicId,
    content: source.content,
    character_start: source.start,
    character_end: source.end,
    embedding: embeddings?.[index] ?? null,
    updated_at: new Date().toISOString(),
  }))
  for (let index = 0; index < rows.length; index += SOURCE_SYNC_BATCH_SIZE) {
    const { error } = await client.from('academic_source_chunks').upsert(rows.slice(index, index + SOURCE_SYNC_BATCH_SIZE), { onConflict: 'user_id,chunk_id' })
    if (error) throw error
  }
}

async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const key = Deno.env.get('OPENAI_EMBEDDING_API_KEY')
  if (!key || !texts.length) return null
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  })
  if (!response.ok) return null
  const payload = await response.json()
  return Array.isArray(payload?.data) ? payload.data.map((item: { embedding: number[] }) => item.embedding) : null
}

async function retrieveChunks(
  client: ReturnType<typeof createClient>,
  userId: string,
  courseId: string,
  topicId: string,
  chunkIds: string[],
): Promise<Chunk[]> {
  const batches = Array.from(
    { length: Math.ceil(chunkIds.length / CHUNK_RETRIEVAL_BATCH_SIZE) },
    (_, index) => chunkIds.slice(index * CHUNK_RETRIEVAL_BATCH_SIZE, (index + 1) * CHUNK_RETRIEVAL_BATCH_SIZE),
  )
  const rows: Chunk[] = []
  // A full lecture can span more than a thousand passages. Reading every
  // batch concurrently caused intermittent gateway 500s before quota or model
  // work began. Keep the requests bounded and retry one transient read.
  for (const batch of batches) {
    let result: Awaited<ReturnType<typeof readChunkBatch>> | undefined
    for (let attempt = 0; attempt < 2; attempt += 1) {
      result = await readChunkBatch(client, userId, courseId, topicId, batch)
      if (!result.error) break
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 75))
    }
    if (!result || result.error) throw result?.error ?? new Error('Source batch was not returned')
    rows.push(...((result.data || []) as Chunk[]))
  }
  const byId = new Map(rows.map((chunk) => [chunk.chunk_id, chunk]))
  return chunkIds.flatMap((chunkId) => {
    const chunk = byId.get(chunkId)
    return chunk ? [chunk] : []
  })
}

function readChunkBatch(
  client: ReturnType<typeof createClient>,
  userId: string,
  courseId: string,
  topicId: string,
  batch: string[],
) {
  return client
    .from('academic_source_chunks')
    .select('chunk_id,file_id,content,character_start,character_end')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('topic_id', topicId)
    .in('chunk_id', batch)
    .limit(batch.length)
}

/**
 * `specPrompt` is the client-assembled system prompt (generation Phase 1).
 * Pedagogy ships with the client build, versioned in git and reviewable in a
 * diff — `01` §2.1: this function is transport and enforcement only.
 *
 * The local fallback below stays so a function that has NOT been redeployed
 * behaves exactly as it does today. Delete it once every client sends a spec.
 */
async function callAnthropic(
  response: string,
  chunks: Chunk[],
  specPrompt?: string,
  schema?: object,
  image?: ImageEvidence,
) {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) throw new Error('Anthropic is not configured')
  const result = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-5',
      // Thinking is on by default on Opus 5 and counts against max_tokens, so
      // this budget covers reasoning + the report, not the report alone.
      max_tokens: 8000,
      output_config: { effort: 'medium' },
      // Structured outputs (`output_config.format`) cannot be combined with
      // document citations — the pair returns a 400. Citations are the
      // load-bearing half here: they are what makes a "from your materials"
      // chip verifiable rather than an unchecked model claim, so the schema
      // moves into the prompt and `validateResult` stays the enforcement.
      system: [
        specPrompt?.trim()
          // The pre-Phase-1 prompt, kept only as the un-redeployed fallback.
          || 'Compare recall only against the supplied topic sources. Never invent a source or offset.',
        // The transport half is always the server's: the response contract is
        // enforcement, not pedagogy, so a client may never weaken it.
        'Reply with a single JSON object and nothing else — no prose, no markdown fences.',
        schema
          ? `It must match this JSON Schema: ${JSON.stringify(schema)}`
          : 'It must use the exact artifact structure and rules in the specification above.',
      ].join('\n'),
      messages: [{
        role: 'user',
        content: [
          ...chunks.map((chunk) => ({
            type: 'document',
            source: { type: 'text', media_type: 'text/plain', data: chunk.content },
            title: `${chunk.file_id}:${chunk.chunk_id}`,
            citations: { enabled: true },
          })),
          { type: 'text', text: `Student recall:\n${response}` },
          ...(image ? [{
            type: 'image',
            source: { type: 'base64', media_type: image.mimeType, data: image.dataBase64 },
          }] : []),
        ],
      }],
    }),
  })
  if (!result.ok) throw new ProviderRejectedError(`Anthropic ${result.status}`)
  const payload = await result.json()
  const textBlocks = Array.isArray(payload?.content)
    ? payload.content.filter((block: { type?: string }) => block.type === 'text')
    : []
  const text = textBlocks.map((block: { text?: string }) => block.text || '').join('')
  const trustedCitations = textBlocks.flatMap((block: { citations?: unknown[] }) => block.citations || [])
    .flatMap((citation: Record<string, unknown>) => {
      if (citation.type !== 'char_location') return []
      const title = String(citation.document_title || '')
      const separator = title.lastIndexOf(':')
      if (separator < 1) return []
      return [{
        fileId: title.slice(0, separator),
        chunkId: title.slice(separator + 1),
        start: Number(citation.start_char_index),
        end: Number(citation.end_char_index),
      }]
    })
  return { value: parseJsonObject(text), trustedCitations }
}

/** Without a schema constraint the reply is *asked* for bare JSON but is not
 *  *guaranteed* to be, so recover the object rather than throwing on a stray
 *  fence or preamble. A malformed body still fails, and `validateResult`
 *  remains the gate on shape — this only widens what reaches it. */
function parseJsonObject(text: string): unknown {
  const withoutFences = text.replace(/```(?:json)?/gi, '').trim()
  try {
    return JSON.parse(withoutFences)
  } catch {
    const start = withoutFences.indexOf('{')
    const end = withoutFences.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('No JSON object in provider response')
    return JSON.parse(withoutFences.slice(start, end + 1))
  }
}

function openAIOutputText(payload: Record<string, unknown>): string {
  if (isText(payload.output_text)) return payload.output_text
  if (!Array.isArray(payload.output)) throw new Error('No OpenAI output returned')
  const text = payload.output.flatMap((item) => {
    if (!item || typeof item !== 'object' || !Array.isArray((item as Record<string, unknown>).content)) return []
    return ((item as Record<string, unknown>).content as unknown[]).flatMap((block) => {
      if (!block || typeof block !== 'object') return []
      const record = block as Record<string, unknown>
      return (record.type === 'output_text' || record.type === 'text') && typeof record.text === 'string'
        ? [record.text]
        : []
    })
  }).join('')
  if (!text.trim()) throw new Error('No OpenAI output text returned')
  return text
}

async function callOpenAIGeneration(response: string, chunks: Chunk[], specPrompt: string) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OpenAI is not configured')
  const wire = createOpenAICitationWire(chunks)
  const sources = wire.sources
  const result = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Keep artifact generation independent of the cheaper recall-check model.
      model: 'gpt-6-astra',
      reasoning: { effort: 'low' },
      store: false,
      max_output_tokens: 10_000,
      input: [
        {
          role: 'system',
          content: [{
            type: 'input_text',
            text: [
              wire.encodePrompt(specPrompt),
              'Reply with one JSON object only. Follow the required artifact shape in the specification.',
              OPENAI_GENERATION_CITATION_INSTRUCTION,
              'Transport-only citation format override: wherever the artifact schema asks for sourceRef, output only {"citationId":"S123"}, using the exact S identifier of the chosen supplied passage. For sourceRefs output an array of these single-key objects. Do not output fileId, chunkId, start or end inside these objects. The server expands the exact passage identity into the schema-required file/chunk/range before validation. This overrides only the sourceRef wire shape, not grounding or any other artifact requirement. sourceChunkId/sourceChunkIds/evidenceIds still use the supplied S passage IDs directly.',
            ].join('\n'),
          }],
        },
        {
          role: 'user',
          content: [{
            type: 'input_text',
            text: `Request:\n${wire.encodePrompt(response)}\n\nSource documents:\n${JSON.stringify(sources)}`,
          }],
        },
      ],
      text: { format: { type: 'json_object' } },
    }),
  })
  const value = canonicalizeOpenAIGenerationSourceRefs(
    wire.decode(await readOpenAIGenerationResponse(result)),
    chunks,
  )
  return { value, trustedCitations: collectArtifactCitations(value, chunks), webSearchRequests: 0 }
}

/**
 * Question Bank V1's Anthropic author returns semantic stimulus structures,
 * never unverified image bytes. Premed OS renders the validated tables, graphs,
 * and diagrams itself. Each run can inspect selected local image derivatives
 * and current official assessment patterns; neither becomes an unchecked fact
 * source for the saved artifact.
 */
async function callAnthropicGeneration(
  response: string,
  chunks: Chunk[],
  specPrompt: string,
  visualSources: QuestionBankVisualSource[],
) {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) throw new Error('Anthropic is not configured')
  const result = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-5',
      max_tokens: 24_000,
      output_config: { effort: 'medium' },
      tools: [{
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,
        allowed_domains: ['apcentral.collegeboard.org', 'ocw.mit.edu'],
      }],
      system: [
        specPrompt,
        'Reply with one JSON object only, with no prose or markdown fences.',
        'Use only the supplied source IDs. For sourceChunkIds, copy exact chunk IDs; never invent an ID.',
        'Inspect every supplied image page. Use the lesson objectives, transcript, and assigned questions to decide which textbook or course figures actually clarify the requested scope; ignore decorative, tangential, and redundant figures.',
        'Use web search at least once before authoring, limited to official public assessment sources, to inspect cognitive patterns, experiment structures, graph use, and distractor logic. Never copy a web question, image, wording, numeric value, or biological claim into the bank.',
        'All question facts, answers, rationales, and source-derived visuals must remain grounded in the supplied course chunks. Web results are assessment-pattern evidence only.',
        'Do not claim to retrieve bitmap images for the output. Author only the structured stimuli allowed by the specification.',
      ].join('\n'),
      messages: [{
        role: 'user',
        content: [
          ...visualSources.flatMap((source, index) => ([
            {
              type: 'text',
              text: `Selected visual source ${index + 1}: ${source.title} (fileId ${source.fileId}). Inspect the visible page, then use it only if it directly clarifies the closed lesson scope.`,
            },
            {
              type: 'image',
              source: { type: 'base64', media_type: source.mimeType, data: source.dataBase64 },
            },
          ])),
          ...chunks.map((chunk) => ({
            type: 'document',
            source: { type: 'text', media_type: 'text/plain', data: chunk.content },
            title: `${chunk.file_id}:${chunk.chunk_id}`,
            citations: { enabled: true },
          })),
          { type: 'text', text: `Generation request:\n${response}` },
        ],
      }],
    }),
  })
  const payload = await result.json()
  if (!result.ok) {
    const providerMessage = typeof payload?.error?.message === 'string' ? payload.error.message : ''
    throw new AnthropicGenerationError(
      /credit balance|purchase credits|plans & billing/i.test(providerMessage) ? 'credit-exhausted' : 'unavailable',
      result.status,
    )
  }
  const text = Array.isArray(payload?.content)
    ? payload.content.filter((block: { type?: string }) => block.type === 'text')
      .map((block: { text?: string }) => block.text || '').join('')
    : ''
  const value = parseJsonObject(text)
  const webSearchRequests = Number(payload?.usage?.server_tool_use?.web_search_requests ?? 0)
  return { value, trustedCitations: collectArtifactCitations(value, chunks), webSearchRequests }
}

class ProviderRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProviderRejectedError'
  }
}

class AnthropicGenerationError extends ProviderRejectedError {
  constructor(public readonly reason: 'credit-exhausted' | 'unavailable', status: number) {
    super(`Anthropic generation failed (${status}): ${reason}`)
    this.name = 'AnthropicGenerationError'
  }
}

const generationAuditSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['approved', 'issues'],
  properties: {
    approved: { type: 'boolean' },
    issues: { type: 'array', items: { type: 'string' } },
  },
}

async function callAnthropicAudit(value: unknown, chunks: Chunk[], specPrompt: string) {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) throw new Error('Anthropic is not configured')
  const result = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-5',
      max_tokens: 2500,
      output_config: { effort: 'medium' },
      system: [
        'You are the independent secondary reviewer. OpenAI already authored the artifact.',
        'Check every grounded claim and source reference against the supplied documents and the quoted specification.',
        'Each sourceRef intentionally spans the full server-owned chunk. Verify that the claim is supported somewhere in the document identified by fileId and chunkId; do not reject a correct identity merely because its range is broader than one sentence.',
        'Set approved=false only for a blocking unsupported claim, invented source identity, invalid required structure, or violated invariant. Do not reject for style preferences or other non-blocking improvements.',
        'Do not rewrite the artifact. Reply with one JSON object only, with no markdown.',
        `The audit result must match this JSON Schema: ${JSON.stringify(generationAuditSchema)}`,
      ].join('\n'),
      messages: [{
        role: 'user',
        content: [
          ...chunks.map((chunk) => ({
            type: 'document',
            source: { type: 'text', media_type: 'text/plain', data: chunk.content },
            title: `${chunk.file_id}:${chunk.chunk_id}`,
            citations: { enabled: true },
          })),
          {
            type: 'text',
            text: `Original generation specification:\n${specPrompt}\n\nArtifact to audit:\n${JSON.stringify(value)}`,
          },
        ],
      }],
    }),
  })
  if (!result.ok) throw new Error(`Anthropic audit ${result.status}`)
  const payload = await result.json()
  const text = Array.isArray(payload?.content)
    ? payload.content.filter((block: { type?: string }) => block.type === 'text')
      .map((block: { text?: string }) => block.text || '').join('')
    : ''
  const parsed = parseJsonObject(text)
  if (!parsed || typeof parsed !== 'object') throw new Error('Anthropic returned an invalid audit')
  const audit = parsed as Record<string, unknown>
  if (typeof audit.approved !== 'boolean' || !Array.isArray(audit.issues) || audit.issues.some((issue) => !isText(issue))) {
    throw new Error('Anthropic returned an invalid audit')
  }
  if (!audit.approved && audit.issues.length === 0) throw new Error('Anthropic rejected without an audit reason')
  return { approved: audit.approved, issues: audit.issues as string[] }
}

function safeAuditIssues(issues: string[]) {
  return issues.slice(0, 3).map((issue) => issue.replace(/\s+/g, ' ').trim().slice(0, 240))
}

async function callOpenAI(response: string, chunks: Chunk[], image?: ImageEvidence) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OpenAI is not configured')
  const sources = chunks.map((chunk) => ({
    fileId: chunk.file_id,
    chunkId: chunk.chunk_id,
    start: chunk.character_start,
    end: chunk.character_end,
    content: chunk.content,
  }))
  const result = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-5.4-mini',
      store: false,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: `Compare the student's recall only to these sources.\nSources:${JSON.stringify(sources)}\nRecall:${response}` },
          ...(image ? [{ type: 'input_image', image_url: `data:${image.mimeType};base64,${image.dataBase64}` }] : []),
        ],
      }],
      text: { format: { type: 'json_schema', name: 'gap_check', strict: true, schema: resultSchema } },
    }),
  })
  if (!result.ok) throw new ProviderRejectedError(`OpenAI ${result.status}`)
  const payload = await result.json() as Record<string, unknown>
  return { value: JSON.parse(openAIOutputText(payload)), trustedCitations: undefined }
}

const citationSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'fileId', 'chunkId', 'start', 'end'],
      properties: {
        kind: { const: 'material' },
        fileId: { type: 'string' },
        chunkId: { type: 'string' },
        start: { type: 'integer', minimum: 0 },
        end: { type: 'integer', minimum: 1 },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind'],
      properties: { kind: { const: 'general' } },
    },
  ],
}
const itemSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'citation'],
  properties: { text: { type: 'string', minLength: 1 }, citation: citationSchema },
}
const resultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['covered', 'missed', 'wrong', 'suggestedGrade'],
  properties: {
    covered: { type: 'array', items: itemSchema },
    missed: { type: 'array', items: itemSchema },
    wrong: { type: 'array', items: itemSchema },
    suggestedGrade: { enum: ['again', 'hard', 'good', 'easy'] },
  },
}

function validateResult(
  value: unknown,
  chunks: Chunk[],
  trustedCitations?: Array<{ fileId: string; chunkId: string; start: number; end: number }>,
) {
  if (!value || typeof value !== 'object') return null
  const result = value as Record<string, unknown>
  if (!['again', 'hard', 'good', 'easy'].includes(String(result.suggestedGrade))) return null
  const byId = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]))
  for (const group of ['covered', 'missed', 'wrong']) {
    if (!Array.isArray(result[group])) return null
    for (const rawItem of result[group] as unknown[]) {
      if (!rawItem || typeof rawItem !== 'object') return null
      const item = rawItem as Record<string, unknown>
      if (!isText(item.text) || !item.citation || typeof item.citation !== 'object') return null
      const citation = item.citation as Record<string, unknown>
      if (citation.kind === 'general') continue
      const chunk = byId.get(String(citation.chunkId))
      if (!chunk || citation.fileId !== chunk.file_id) return null
      if (!Number.isInteger(citation.start) || !Number.isInteger(citation.end)) return null
      if (Number(citation.start) < chunk.character_start || Number(citation.end) > chunk.character_end || Number(citation.end) <= Number(citation.start)) return null
      if (trustedCitations && !trustedCitations.some((trusted) =>
        trusted.fileId === citation.fileId
        && trusted.chunkId === citation.chunkId
        && trusted.start === citation.start
        && trusted.end === citation.end
      )) return null
    }
  }
  return result
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

type AudioEvidence = { name: string; mimeType: string; size: number; dataBase64: string }
type ImageEvidence = { name: string; mimeType: string; size: number; dataBase64: string }
type GapEvidence = { text?: string; audioTranscript?: string; image?: ImageEvidence }

function validateAudioEvidence(value: unknown): AudioEvidence | null {
  if (!value || typeof value !== 'object') return null
  const audio = value as Record<string, unknown>
  if (!isText(audio.name) || !isText(audio.mimeType) || !isText(audio.dataBase64) || !Number.isInteger(audio.size)) return null
  if (!/^audio\/(webm|mpeg|mp4|wav|ogg)$/i.test(audio.mimeType) || Number(audio.size) < 1 || Number(audio.size) > MAX_AUDIO_BYTES) return null
  return base64MatchesSize(audio.dataBase64, Number(audio.size))
    ? { name: audio.name.slice(0, 160), mimeType: audio.mimeType, size: Number(audio.size), dataBase64: audio.dataBase64 }
    : null
}

function validateImageEvidence(value: unknown): ImageEvidence | null {
  if (!value || typeof value !== 'object') return null
  const image = value as Record<string, unknown>
  if (!isText(image.name) || !isText(image.mimeType) || !isText(image.dataBase64) || !Number.isInteger(image.size)) return null
  if (!/^image\/(png|jpe?g|webp)$/i.test(image.mimeType) || Number(image.size) < 1 || Number(image.size) > MAX_IMAGE_BYTES) return null
  return base64MatchesSize(image.dataBase64, Number(image.size))
    ? { name: image.name.slice(0, 160), mimeType: image.mimeType, size: Number(image.size), dataBase64: image.dataBase64 }
    : null
}

function validateGapEvidence(value: unknown): GapEvidence | null {
  if (!value || typeof value !== 'object') return null
  const evidence = value as Record<string, unknown>
  const text = typeof evidence.text === 'string' && evidence.text.trim() ? evidence.text.trim() : undefined
  const audioTranscript = typeof evidence.audioTranscript === 'string' && evidence.audioTranscript.trim()
    ? evidence.audioTranscript.trim()
    : undefined
  const image = evidence.image === undefined ? undefined : validateImageEvidence(evidence.image)
  if (evidence.image !== undefined && !image) return null
  if (!text && !audioTranscript && !image) return null
  if ((text?.length ?? 0) > 24_000 || (audioTranscript?.length ?? 0) > 24_000) return null
  return { text, audioTranscript, image }
}

function responseForGapEvidence(evidence: GapEvidence) {
  return [
    evidence.text ? `Typed recall:\n${evidence.text}` : '',
    evidence.audioTranscript ? `Reviewed audio transcript:\n${evidence.audioTranscript}` : '',
    evidence.image ? `A single student-supplied response image is attached. Inspect only what is visible in it.` : '',
  ].filter(Boolean).join('\n\n')
}

function base64MatchesSize(value: string, size: number) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false
  const decodedEstimate = Math.floor(value.length * 3 / 4) - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0)
  return decodedEstimate === size
}

async function transcribeAudio(audio: AudioEvidence) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OpenAI transcription is not configured')
  const bytes = Uint8Array.from(atob(audio.dataBase64), (character) => character.charCodeAt(0))
  const form = new FormData()
  form.append('model', Deno.env.get('OPENAI_TRANSCRIPTION_MODEL') || 'gpt-4o-mini-transcribe')
  form.append('response_format', 'json')
  form.append('file', new File([bytes], audio.name, { type: audio.mimeType }))
  const result = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form,
  })
  if (!result.ok) throw new ProviderRejectedError(`OpenAI transcription ${result.status}`)
  const payload = await result.json()
  if (!isText(payload?.text)) throw new Error('No transcript returned')
  return payload.text.trim()
}

function validateSources(value: unknown, maxChunks = MAX_CHUNKS) {
  if (!Array.isArray(value) || value.length > maxChunks) return null
  const sources: Array<{ chunkId: string; fileId: string; content: string; start: number; end: number }> = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null
    const source = raw as Record<string, unknown>
    if (!isText(source.chunkId) || !isText(source.fileId) || !isText(source.content)) return null
    if (!Number.isInteger(source.start) || !Number.isInteger(source.end) || Number(source.start) < 0 || Number(source.end) <= Number(source.start)) return null
    sources.push({
      chunkId: source.chunkId,
      fileId: source.fileId,
      content: source.content,
      start: Number(source.start),
      end: Number(source.end),
    })
  }
  return sources
}

function validateQuestionBankVisualSources(value: unknown): QuestionBankVisualSource[] | null {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > MAX_QUESTION_BANK_VISUALS) return null
  const sources: QuestionBankVisualSource[] = []
  let totalBytes = 0
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null
    const source = raw as Record<string, unknown>
    if (!isText(source.fileId) || !isText(source.title) || !isText(source.mimeType) || !isText(source.dataBase64)
      || !Number.isInteger(source.size) || Number(source.size) < 1
      || !/^image\/(png|jpe?g|webp)$/i.test(source.mimeType)
      || source.title.length > 500 || !base64MatchesSize(source.dataBase64, Number(source.size))) return null
    totalBytes += Number(source.size)
    if (totalBytes > MAX_QUESTION_BANK_VISUAL_BYTES) return null
    sources.push({
      fileId: source.fileId,
      title: source.title,
      mimeType: source.mimeType,
      size: Number(source.size),
      dataBase64: source.dataBase64,
    })
  }
  return new Set(sources.map((source) => source.fileId)).size === sources.length ? sources : null
}

function validateChunkIds(value: unknown, maxChunks = MAX_CHUNKS) {
  if (!Array.isArray(value) || value.length > maxChunks) return null
  const ids = value.filter(isText)
  if (ids.length !== value.length || new Set(ids).size !== ids.length) return null
  return ids
}

function validateTermEvidence(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 80) return null
  const rows: Array<{ id: string; label: string; content: string }> = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null
    const item = raw as Record<string, unknown>
    if (!isText(item.id) || !isText(item.label) || !isText(item.content)) return null
    if (item.id.length > 180 || item.label.length > 500 || item.content.length > 12_000) return null
    rows.push({ id: item.id, label: item.label, content: item.content })
  }
  return new Set(rows.map((row) => row.id)).size === rows.length ? rows : null
}

const TERM_REPORT_CAUSAL_LANGUAGE = /\b(caus(?:e|ed|es|ing)|improv(?:e|ed|es|ing)|because you|therefore|led to|resulted in|determined|predict(?:s|ed|ing)?|visual learner|auditory learner|learning style|spent too little time)\b/i

function validateTermReportArtifact(value: unknown, allowedEvidenceIds: Set<string>) {
  if (!value || typeof value !== 'object') return false
  const artifact = value as Record<string, unknown>
  if (!Array.isArray(artifact.takeaways) || artifact.takeaways.length < 2 || artifact.takeaways.length > 4) return false
  if (!Array.isArray(artifact.experiments) || artifact.experiments.length < 1 || artifact.experiments.length > 2) return false
  if (!isText(artifact.limit)) return false
  return [...artifact.takeaways, ...artifact.experiments].every((raw) => {
    if (!raw || typeof raw !== 'object') return false
    const item = raw as Record<string, unknown>
    return isText(item.title) && isText(item.text)
      && !TERM_REPORT_CAUSAL_LANGUAGE.test(`${item.title} ${item.text}`)
      && Array.isArray(item.evidenceIds) && item.evidenceIds.length > 0
      && item.evidenceIds.every((id) => isText(id) && allowedEvidenceIds.has(id))
  })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function failure(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
  return json({ error: { code, message, ...details } }, status)
}

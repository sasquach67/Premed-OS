import {
  AstraRouteError,
  getAstraResponse,
  isBackgroundParameterRejection,
  postAstraResponse,
  postAstraResponseWithRoute,
  providerRequestId,
  settleAstraBackground,
  submitAstraBackgroundResponse,
  type AstraRoute,
  type AstraRouteConfig,
} from '../_shared/astraWalletRoute.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.110.2'
import { OpenAIGenerationResponseError, readOpenAIGenerationResponse } from '../_shared/openAIGenerationResponse.ts'
import { createOpenAICitationWire } from '../_shared/openAICitationWire.ts'
import {
  canonicalizeOpenAIGenerationSourceRefs,
  OPENAI_GENERATION_CITATION_INSTRUCTION,
  openAIGenerationSourceRefRequired,
} from '../_shared/openAIGenerationGrounding.ts'
import {
  assertSourceReadiness,
  buildSourceInventory,
  coverageBriefing,
  deduplicatedSources,
  repetitionNotice,
  SourceReadinessError,
  type SourceInventory,
} from '../_shared/sourceInventory.ts'
import {
  estimateMs,
  fitsBudget,
  orderedSpans,
  singlePassCorpusChars,
  type StageObservation,
} from '../_shared/stageBudget.ts'
import {
  firstStage,
  nextStage,
  pipelineProgress,
  stageSpec,
  type StageId,
  type StageSpec,
} from '../_shared/generationStages.ts'
import {
  canRunStep,
  leaseJob,
  publicJob,
  remainingWorkerMs,
  startJob,
  stepDeadlineMs,
  StepTimeoutError,
  updateJob,
  withDeadline,
  workerBudget,
  type GenerationJob,
  type JobErrorDetail,
  type WorkerBudget,
} from '../_shared/generationJobs.ts'

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
  // pg_cron dispatches under a service-role JWT, which carries a role and no
  // `sub`, so auth.getUser() cannot resolve a user for it. Checking the session
  // gate first therefore 401s every scheduled dispatch and leaves the queue
  // unable to advance unless a browser is open — the one thing this design
  // exists to prevent. The runner secret is the scheduler's credential: it is
  // compared in constant time, and on its own it admits nothing but 'run-task'.
  const runnerSecret = Deno.env.get('GENERATION_RUNNER_SECRET')
  const presentedRunner = request.headers.get('x-generation-runner')
  const scheduled = Boolean(runnerSecret && presentedRunner && timingSafeEqual(runnerSecret, presentedRunner))
  if (scheduled) {
    let scheduledBody: Record<string, unknown>
    try {
      scheduledBody = JSON.parse(await request.text())
    } catch {
      return failure(400, 'invalid-request', 'A JSON request is required.')
    }
    if (scheduledBody.action !== 'run-task') {
      return failure(403, 'runner-forbidden', 'The scheduler may only advance the queue.')
    }
    // The scheduler runs across every owner's builds, so it reads with the
    // function's own service-role key rather than a JWT sent over the wire.
    // pg_net records request headers in the `net` tables, so dispatching under
    // a service-role bearer would persist that key in the database; the
    // dispatcher now carries only the public anon key plus the runner secret.
    const scheduledService = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
    return runOneTask(scheduledService, scheduledService, workerBudget((key) => Deno.env.get(key)), null)
  }

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

  const budget = workerBudget((key) => Deno.env.get(key))

  /**
   * Read one build. Owner-scoped through RLS, and it exposes stage counts so
   * the composer can show one continuous reading rather than a spinner.
   */
  if (body.action === 'generate-status') {
    if (!isText(body.jobId) || !UUID.test(body.jobId)) return failure(400, 'invalid-request', 'A build id is required.')
    const { data, error } = await client.rpc('generation_job_view', { p_job_id: body.jobId })
    if (error) return failure(503, 'job-read-failed', 'This build’s status could not be read. Nothing saved was changed.')
    if (!isRecord(data) || !isRecord(data.job)) return failure(404, 'job-not-found', 'This build is no longer available. Nothing saved was changed.')
    return json(jobView(data))
  }

  /**
   * Advance the queue by one task.
   *
   * pg_cron calls this on a schedule, which is what makes a build independent
   * of the browser. The signed-in owner may also call it to start their own
   * build immediately instead of waiting for the next tick; the lease means an
   * eager nudge and a scheduled tick can never run the same task twice.
   */
  if (body.action === 'run-task') {
    // A scheduled dispatch returned above. Reaching here means a signed-in
    // owner nudging their own build, which is always scoped to that build.
    if (!isText(body.jobId)) {
      return failure(403, 'runner-forbidden', 'This endpoint is driven by the scheduler.')
    }
    return runOneTask(client, serviceClient, budget, { jobId: body.jobId as string, userId: userData.user.id })
  }

  /**
   * Prove background submission AND retrieval against the live route. Owner
   * initiated, and the only thing that may switch the engine into background
   * mode — documentation and tests do not qualify.
   */
  if (body.action === 'probe-background') {
    return probeBackgroundCapability(serviceClient, budget)
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
  // `generate-start` shares every validation, limit, and quota rule with the
  // synchronous `generate`; it differs only in returning a job to resume.
  const isDurableStart = body.action === 'generate-start'
  const isGeneration = body.action === 'generate' || isDurableStart
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
  if (chunks.length !== chunkIds.length) {
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
  const specPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : ''
  if (isGeneration && !specPrompt.trim()) {
    return failure(400, 'invalid-request', 'An assembled spec prompt is required.')
  }
  const gapProvider = (Deno.env.get('AI_PROVIDER') || 'openai').toLowerCase()
  if (isGapCheck && !Deno.env.get(gapProvider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY')) {
    return failure(503, 'server-unconfigured', 'Gap Check generation is not configured. Nothing was saved.')
  }
  /**
   * Start a durable build: record the job, then return its id.
   *
   * Quota is claimed only for a job this call actually created. A second press,
   * a retry after a dropped connection, or a second tab rejoins the same job
   * and is charged nothing — which is also what stops duplicate paid provider
   * work and duplicate saved results.
   */
  if (isDurableStart) {
    if (isQuestionBankGeneration) {
      return failure(400, 'invalid-request', 'Question banks use the Claude generation route, not the durable Astra build.')
    }
    const payload: JobPayload = {
      courseId: body.courseId,
      topicId: body.topicId,
      chunkIds,
      specId: isText(body.specId) ? body.specId : '',
      specHash: isText(body.specHash) ? body.specHash : '',
      systemPrompt: specPrompt,
      request: typeof body.request === 'string' ? body.request : 'Generate the artifact.',
      ...(isText(body.repairGuidance) ? { repairGuidance: body.repairGuidance.slice(0, 4_000) } : {}),
    }
    const started = await startJob(
      serviceClient,
      userData.user.id,
      await generationDedupeKey(userData.user.id, payload),
      payload as unknown as Record<string, unknown>,
      AI_BETA_RESERVATION_CENTS.generate,
    )
    if (!started) return failure(503, 'job-start-failed', 'This build could not be queued. Nothing was saved.')
    if (!started.created) return json({ ...publicJob(started.job), rejoined: true })

    const startQuota = await claimAIRequest(serviceClient, userData.user.id, AI_REQUEST_WEIGHT.generate, AI_BETA_RESERVATION_CENTS.generate)
    if (startQuota.error || !startQuota.allowed) {
      const lease = await leaseJob(serviceClient, userData.user.id, started.job.id, 30)
      if (lease?.lease_token) {
        await updateJob(serviceClient, lease.id, lease.lease_token, {
          status: 'failed', step: 'done', phase: 'Stopped',
          error: jobError(startQuota.error ? 'usage-check-failed' : startQuota.reason, startQuota.error ? 'Usage could not be verified.' : quotaMessage(startQuota)),
        })
      }
      if (startQuota.error) return failure(503, 'usage-check-failed', 'Usage could not be verified.')
      return quotaFailure(startQuota)
    }
    // Seed stage one, then let the scheduler take it from here.
    const opening = firstStage(payload.specId)
    await serviceClient.rpc('add_generation_tasks', {
      p_job_id: started.job.id,
      p_stage: opening,
      p_tasks: tasksForStage(payload.specId, opening, { ...started.job, outline: null } as unknown as JobRow, null),
    })
    await serviceClient.from('study_generation_jobs')
      .update({ spec_id: payload.specId, stage: opening, phase: stageSpec(payload.specId, opening)?.label ?? 'Preparing' })
      .eq('id', started.job.id)
    return json({ ...publicJob(started.job), stage: opening, phase: stageSpec(payload.specId, opening)?.label ?? 'Preparing' })
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
      if (error instanceof AstraRouteError) return failure(503, error.code, error.message)
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
    if (error instanceof AstraRouteError) return failure(503, error.code, error.message)
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

function quotaMessage(quota: AIQuotaClaim) {
  return quota.reason === 'hourly-limit'
    ? 'Your hourly AI limit has been reached.'
    : quota.reason === 'daily-limit'
      ? 'Your daily AI limit has been reached.'
      : quota.reason === 'weekly-budget-limit'
        ? 'The shared $10 weekly beta AI allowance cannot cover another request under its conservative reservations. Attempts that reached a provider can count even when no result was saved. Try again after the reset.'
        : 'AI usage could not be allowed for this request.'
}

function quotaFailure(quota: AIQuotaClaim) {
  return failure(429, quota.reason, quotaMessage(quota), { resetAt: quota.resetAt })
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
  _topicId: string,
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
      result = await readChunkBatch(client, userId, courseId, batch)
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
  batch: string[],
) {
  // A chunk has one owner-scoped mirror row. Another selection can update its
  // topic metadata while this request is running; topic is not an ownership
  // boundary. Explicit requested IDs plus owner and course define this corpus.
  return client
    .from('academic_source_chunks')
    .select('chunk_id,file_id,content,character_start,character_end')
    .eq('user_id', userId)
    .eq('course_id', courseId)
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

/**
 * Routing config for every Astra call. The wallet stays primary and the capped
 * direct-OpenAI backup still activates only on an explicit insufficient-balance
 * 402 — the durable path reuses this policy rather than restating it.
 */
function astraRouteConfig(openAIKey: string, signal?: AbortSignal, idempotencyKey?: string): AstraRouteConfig {
  return {
    openAIKey,
    walletKey: Deno.env.get('CHEAPER_INFERENCE_API_KEY'),
    signal,
    idempotencyKey,
    ledger: {
      async reserve(cents) {
        const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
        const { data, error } = await admin.rpc('reserve_astra_backup', { p_cents: cents })
        if (error) throw new AstraRouteError('backup-budget-limit', 'The OpenAI backup allowance could not be verified. No backup request was sent.')
        return typeof data === 'string' ? data : null
      },
      async settle(id, cents) {
        const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
        const { error } = await admin.rpc('settle_astra_backup', { p_id: id, p_cents: cents })
        if (error) throw new Error('Backup settlement unavailable')
      },
    },
  }
}

async function routeAstraResponse(payload: Record<string, unknown>, openAIKey: string, signal?: AbortSignal, idempotencyKey?: string) {
  return postAstraResponse(payload, astraRouteConfig(openAIKey, signal, idempotencyKey), fetch)
}

/**
 * The Astra request body, built once and reused by every route that sends it:
 * the synchronous call, the durable background submit, and the bounded
 * synchronous fallback. Keeping one builder means the durable path cannot drift
 * into a different prompt, a different model, or a different citation contract
 * from the path it replaces.
 */
function astraGenerationPayload(
  response: string,
  chunks: Chunk[],
  specPrompt: string,
  options: { background?: boolean } = {},
) {
  const wire = createOpenAICitationWire(chunks)
  const payload: Record<string, unknown> = {
      // Pin the user-selected model; legacy OPENAI_MODEL must not override it.
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
            text: `Request:\n${wire.encodePrompt(response)}\n\nSource documents:\n${JSON.stringify(wire.sources)}`,
          }],
        },
      ],
      text: { format: { type: 'json_object' } },
  }
  // `background: true` keeps `store: false`: the provider retains a background
  // response only long enough to be polled, which is the whole retention this
  // needs and no more.
  if (options.background) payload.background = true
  return { payload, wire }
}

/** Decode one completed Astra response into the validated artifact. */
function decodeAstraGeneration(raw: unknown, chunks: Chunk[], wire: ReturnType<typeof createOpenAICitationWire>) {
  const value = canonicalizeOpenAIGenerationSourceRefs(wire.decode(raw), chunks)
  return { value, trustedCitations: collectArtifactCitations(value, chunks), webSearchRequests: 0 }
}

async function callOpenAIGeneration(response: string, chunks: Chunk[], specPrompt: string) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OpenAI is not configured')
  const { payload, wire } = astraGenerationPayload(response, chunks, specPrompt)
  const result = await routeAstraResponse(payload, key)
  return decodeAstraGeneration(await readOpenAIGenerationResponse(result), chunks, wire)
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

async function callAnthropicAudit(value: unknown, chunks: Chunk[], specPrompt: string, signal?: AbortSignal) {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) throw new Error('Anthropic is not configured')
  const result = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    ...(signal ? { signal } : {}),
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
  if (!result.ok) {
    // Carry the provider's own reason. A bare status told us an audit failed
    // and nothing about why, which is not enough to fix it.
    const detail = await result.text().catch(() => '')
    const parsedError = ((): string => {
      try {
        const body = JSON.parse(detail)
        const message = body?.error?.message
        return isText(message) ? message : detail.slice(0, 300)
      } catch { return detail.slice(0, 300) }
    })()
    throw new Error(`Anthropic audit ${result.status}: ${parsedError}`)
  }
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
  const result = await routeAstraResponse({
      model: 'gpt-6-astra',
      reasoning: { effort: 'low' },
      store: false,
      max_output_tokens: 10_000,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: `Compare the student's recall only to these sources.\nSources:${JSON.stringify(sources)}\nRecall:${response}` },
          ...(image ? [{ type: 'input_image', image_url: `data:${image.mimeType};base64,${image.dataBase64}` }] : []),
        ],
      }],
      text: { format: { type: 'json_schema', name: 'gap_check', strict: true, schema: resultSchema } },
  }, key)
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


/* ------------------------------------------------------------------------- *
 * Task-based generation engine
 *
 * One Edge invocation runs exactly ONE task. pg_cron dispatches the next one
 * through pg_net, so a build advances whether or not a browser is open, and a
 * worker's lifetime is never asked to cover more than a single piece of work.
 *
 * Tasks are pieces of the ARTIFACT — a plan, one section, the audit — chosen so
 * that no request is oversized in the first place. Nothing here divides the
 * student's material into batches, and nothing shortens it to fit a clock.
 * ------------------------------------------------------------------------- */

type JobPayload = {
  courseId: string
  topicId: string
  chunkIds: string[]
  specId: string
  specHash: string
  systemPrompt: string
  request: string
  repairGuidance?: string
}

type TaskRow = {
  id: string
  job_id: string
  stage: StageId
  ordinal: number
  task_key: string
  status: string
  label: string
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  attempts: number
  max_attempts: number
  provider_route: string | null
  provider_request_id: string | null
  provider_response_id: string | null
  backup_reservation_id: string | null
  idempotency_key: string
  ambiguous: boolean
  oversized: boolean
  parent_task_key: string | null
  part: number
  estimated_ms: number | null
  input_chars: number | null
  output_tokens: number | null
  lease_token: string
  duration_ms: number | null
}

type JobRow = GenerationJob & {
  spec_id: string | null
  stage: StageId
  inventory: Record<string, unknown> | null
  outline: Record<string, unknown> | null
  verification: Record<string, unknown> | null
  progress: number
}

/** A stage result: what to persist, and whether the task is finished. */
type TaskOutcome =
  | { kind: 'done'; output?: Record<string, unknown>; providerResponseId?: string; providerRoute?: string; providerRequestId?: string; backupReservationId?: string; clearBackupReservation?: boolean }
  | { kind: 'pending'; output?: Record<string, unknown>; providerResponseId?: string; providerRoute?: string; providerRequestId?: string; backupReservationId?: string }
  | { kind: 'failed'; error: JobErrorDetail; ambiguous?: boolean; providerRequestId?: string; oversized?: boolean }
  /**
   * This task cannot fit one request. It is replaced by coherent parts before
   * anything is sent — never sent and hoped for, never retried unchanged.
   */
  | { kind: 'subdivide'; parts: Array<{ taskKey: string; ordinal?: number; part?: number; label?: string; input: Record<string, unknown> }>; reason: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Constant-time compare so the runner secret cannot be probed a byte at a time. */
function timingSafeEqual(expected: string, presented: string) {
  const left = new TextEncoder().encode(expected)
  const right = new TextEncoder().encode(presented)
  let diff = left.length ^ right.length
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0)
  }
  return diff === 0
}

/**
 * One build, as the composer sees it: a single continuous progress reading, the
 * current stage's label, and per-task state so "writing section 4 of 9" is
 * honest rather than a guess. Never the payload, the lease, or an unaudited
 * artifact — a result is released only once the job has succeeded.
 */
function jobView(view: Record<string, unknown>) {
  const job = view.job as JobRow
  const done = Number(view.stageDone ?? 0)
  const total = Number(view.stageTotal ?? 0)
  const specId = job.spec_id ?? (isRecord(job.payload) && isText(job.payload.specId) ? job.payload.specId : 'study-guide-v1')
  return {
    jobId: job.id,
    status: job.status,
    stage: job.stage,
    phase: job.phase,
    stageDone: done,
    stageTotal: total,
    progress: job.status === 'succeeded' ? 1 : Math.max(job.progress ?? 0, pipelineProgress(specId, job.stage, done, total)),
    updatedAt: job.updated_at,
    tasks: Array.isArray(view.tasks) ? view.tasks : [],
    ...(job.status === 'succeeded' && job.result ? { result: job.result } : {}),
    ...(job.status === 'failed' && job.error ? { error: job.error } : {}),
  }
}

function jobError(code: string, message: string, detail: { providerStatus?: number; requestId?: string; issues?: string[] } = {}): JobErrorDetail {
  return {
    code,
    message,
    ...(Number.isInteger(detail.providerStatus) ? { providerStatus: detail.providerStatus } : {}),
    ...(detail.requestId ? { requestId: detail.requestId } : {}),
    ...(detail.issues?.length ? { issues: detail.issues } : {}),
  }
}

function taskPayload(value: unknown): JobPayload | null {
  if (!isRecord(value)) return null
  const ids = Array.isArray(value.chunkIds) && value.chunkIds.every(isText) ? value.chunkIds as string[] : null
  if (!ids?.length || !isText(value.courseId) || !isText(value.topicId) || !isText(value.specId)
    || !isText(value.systemPrompt) || !isText(value.request)) return null
  return {
    courseId: value.courseId,
    topicId: value.topicId,
    chunkIds: ids,
    specId: value.specId,
    specHash: isText(value.specHash) ? value.specHash : '',
    systemPrompt: value.systemPrompt,
    request: value.request,
    repairGuidance: isText(value.repairGuidance) ? value.repairGuidance : undefined,
  }
}

async function generationDedupeKey(userId: string, payload: JobPayload) {
  const canonical = JSON.stringify([
    userId, payload.courseId, payload.topicId, payload.specId, payload.specHash,
    [...payload.chunkIds].sort(), payload.request,
  ])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

type Rpc = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> }

async function rpc(client: unknown, name: string, args: Record<string, unknown>) {
  const { data, error } = await (client as Rpc).rpc(name, args)
  if (error) {
    console.error(`generation rpc ${name} failed`, error.message)
    return null
  }
  return data
}

/**
 * What the provider route can actually do, as PROVED against this deployment by
 * `probe-background` — never assumed from documentation. Background mode is
 * used only when a real request was submitted AND its result was read back.
 */
async function backgroundCapability(service: unknown, route: 'wallet' | 'openai-backup') {
  const { data } = await (service as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { maybeSingle: () => PromiseLike<{ data: unknown }> } } } })
    .from('generation_provider_capabilities').select('*').eq('route', route).maybeSingle()
  return isRecord(data) && data.background_submit === true && data.background_retrieve === true
}

function activeRoute(): 'wallet' | 'openai-backup' {
  return Deno.env.get('CHEAPER_INFERENCE_API_KEY') ? 'wallet' : 'openai-backup'
}

/** What this stage has actually cost on this deployment, or null for the prior. */
async function stageObservation(service: unknown, specId: string, stage: StageId): Promise<StageObservation | null> {
  const { data } = await (service as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { eq: (column: string, value: string) => { maybeSingle: () => PromiseLike<{ data: unknown }> } } } } })
    .from('generation_stage_stats').select('*').eq('spec_id', specId).eq('stage', stage).maybeSingle()
  if (!isRecord(data)) return null
  return {
    samples: Number(data.samples) || 0,
    msPerOutputToken: Number(data.ms_per_output_token) || 14,
    msPerKiloInputChar: Number(data.ms_per_kilo_input_char) || 40,
    maxMs: Number(data.max_ms) || 0,
  }
}

/**
 * The time this task may spend at the provider.
 *
 * Conservative by construction: the smaller of the stage's declared ceiling,
 * any operator cap, and what THIS worker actually has left after its safety
 * margin. A stage never gets to plan against the full 150s.
 */
function operatorStageCapMs() {
  const configured = Number(Deno.env.get('GENERATION_STAGE_DEADLINE_MS'))
  return Number.isFinite(configured) && configured > 0 ? configured : Number.POSITIVE_INFINITY
}

function providerBudgetMs(spec: StageSpec, budget: WorkerBudget) {
  return Math.max(0, Math.min(spec.maxProviderMs, operatorStageCapMs(), remainingWorkerMs(budget)))
}

/**
 * The budget this stage gets on a FRESH worker: everything providerBudgetMs
 * considers except how much of this particular worker's life is already gone.
 *
 * Comparing the two separates "this work does not fit" from "this worker was
 * nearly used up". Only the second is worth another attempt unchanged.
 */
function fullStageBudgetMs(spec: StageSpec, budget: WorkerBudget) {
  return Math.max(0, Math.min(spec.maxProviderMs, operatorStageCapMs(), budget.lifetimeMs - budget.safetyMs))
}

const serialisedChars = (payload: Record<string, unknown>) => JSON.stringify(payload).length

/**
 * Run one bounded provider request for a stage.
 *
 * Two shapes, chosen by proven capability rather than hope:
 *
 *  - **Background** — submit, persist the response id, poll. If the result is
 *    not ready inside this worker's slice, the task returns `pending` with the
 *    id recorded, and the next dispatch resumes polling. No work is repeated
 *    and nothing is charged twice.
 *  - **Synchronous** — one request under a deadline. The stage shapes make each
 *    request small, so this is a real bounded call, not a long one in disguise.
 *    A deadline hit here is AMBIGUOUS: the provider may have accepted and
 *    billed it. That is recorded on the task, counted against its attempts, and
 *    surfaced — never assumed to have not happened.
 */
async function runProviderStage(
  service: unknown,
  task: TaskRow,
  spec: StageSpec,
  budget: WorkerBudget,
  specId: string,
  build: (outputTokens: number) => { payload: Record<string, unknown>; wire: ReturnType<typeof createOpenAICitationWire> },
  settle: (raw: unknown, wire: ReturnType<typeof createOpenAICitationWire>) => TaskOutcome | Promise<TaskOutcome>,
  /** How to split this task if it does not fit. Absent means it cannot be split. */
  subdivide?: (verdict: { affordableInputChars: number; affordableOutputTokens: number }) => TaskOutcome | null,
  /** Receives what sizing settled on, so the completion record is accurate. */
  sized?: { inputChars?: number; outputTokens?: number },
): Promise<TaskOutcome> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return { kind: 'failed', error: jobError('server-unconfigured', 'OpenAI generation is not configured. Nothing was saved.') }
  const route = activeRoute()
  const ceiling = providerBudgetMs(spec, budget)
  const deadline = stepDeadlineMs(budget, ceiling)

  // Resume: this task already has a submitted response waiting to be read.
  if (task.provider_response_id) {
    try {
      const response = await withDeadline('retrieve', Math.min(deadline, 25_000), (signal) =>
        getAstraResponse(task.provider_response_id!, (task.provider_route as AstraRoute) || route, astraRouteConfig(key, signal), fetch))
      const text = await response.text()
      const parsed = ((): unknown => { try { return JSON.parse(text) } catch { return null } })()
      const requestId = providerRequestId(response)
      if (response.status === 404) {
        return { kind: 'failed', error: jobError('provider-response-lost', 'The generator no longer holds this piece of the build. Nothing was saved.', { providerStatus: 404, requestId }) }
      }
      if (!response.ok) {
        return { kind: 'pending', providerRequestId: requestId }
      }
      const status = isRecord(parsed) ? parsed.status : null
      if (status === 'queued' || status === 'in_progress') return { kind: 'pending', providerRequestId: requestId }
      // Terminal. If the capped backup carried this request, settle its
      // reservation against real usage before anything else can retry.
      if (task.backup_reservation_id) {
        await settleAstraBackground(task.backup_reservation_id, response.status, isRecord(parsed) ? parsed.usage : null, astraRouteConfig(key).ledger)
      }
      const { wire } = build(task.output_tokens ?? spec.outputTokens ?? 8_000)
      const outcome = await settle(await readOpenAIGenerationResponse(new Response(text, { status: 200 })), wire)
      return outcome.kind === 'done' ? { ...outcome, clearBackupReservation: true } : outcome
    } catch (error) {
      if (error instanceof StepTimeoutError) return { kind: 'pending' }
      return { kind: 'failed', error: astraFailure(error) }
    }
  }

  // ---- Size before sending. -------------------------------------------------
  // A request that cannot finish is not sent. It is subdivided along the
  // artifact's own structure, or the task fails with a reason — because no
  // amount of queueing, aborting or retrying makes an oversized call finish.
  const observed = await stageObservation(service, specId, task.stage)
  const floor = spec.minOutputTokens ?? 1_000
  // A subdivided part writes a fraction of what its parent would have, so it
  // asks for a fraction of the output. Subdividing that only shrank the INPUT
  // would leave the expensive half of the request untouched.
  const declared = Number(task.input?.outputTokens)
  const wanted = Number.isFinite(declared) && declared > 0
    ? Math.max(floor, Math.min(declared, spec.outputTokens ?? 8_000))
    : spec.outputTokens ?? 8_000
  const probe = build(wanted)
  const inputChars = serialisedChars(probe.payload)
  const verdict = fitsBudget({ inputChars, outputTokens: wanted }, ceiling, floor, observed)

  // A task the provider already timed out on is oversized by MEASUREMENT, not
  // by prediction. The estimate said it would fit and it did not, so on the
  // next attempt the estimate is not evidence: this must get smaller or not run
  // at all. Without this the flag was write-only — recorded on the timeout and
  // never read again — and the "next attempt must be a subdivision" guarantee
  // did not exist. A live build proved it: one section timed out at 75.8s, was
  // flagged oversized, and its second attempt re-sent the same request for
  // 75.4s and failed the job.
  const provenOversized = task.oversized === true
  if (!verdict.fits || provenOversized) {
    // Halve what already failed, so the split is genuinely smaller than the
    // request that timed out rather than whatever the stale estimate allows.
    const affordableInputChars = provenOversized
      ? Math.max(1_000, Math.floor(Math.min(verdict.affordableInputChars, inputChars) / 2))
      : verdict.affordableInputChars
    const affordableOutputTokens = provenOversized
      ? Math.max(floor, Math.floor(Math.min(verdict.affordableOutputTokens, wanted) / 2))
      : verdict.affordableOutputTokens
    const split = subdivide?.({ affordableInputChars, affordableOutputTokens })
    if (split) return split
    // Nothing left to split. Background execution is the only honest way to
    // run this, and it is used only where it has been proved to work.
    if (!await backgroundCapability(service, route)) {
      return {
        kind: 'failed',
        oversized: true,
        error: jobError('stage-too-large', provenOversized
          ? `This piece of the build already timed out at the provider and cannot be divided any further. Nothing was saved. Background submission on this route has not been proved, so it was not attempted.`
          : `This piece of the build needs about ${Math.round(verdict.estimateMs / 1000)}s at the provider, beyond the ${Math.round(ceiling / 1000)}s a single worker can safely spend, and it cannot be divided further. Nothing was saved. Background submission on this route has not been proved, so it was not attempted.`),
      }
    }
  }

  // Past this point the request is either affordable, or it is going to the
  // proved background route where the worker's clock does not bind. Either way
  // it asks for the whole answer; nothing is trimmed to beat a deadline.
  const outputTokens = wanted
  const { payload, wire } = build(outputTokens)
  const sentChars = serialisedChars(payload)
  const estimatedMs = estimateMs({ inputChars: sentChars, outputTokens }, observed)
  if (sized) { sized.inputChars = sentChars; sized.outputTokens = outputTokens }
  await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
    .from('study_generation_tasks')
    .update({ estimated_ms: estimatedMs, input_chars: sentChars, output_tokens: outputTokens })
    .eq('id', task.id)

  const useBackground = await backgroundCapability(service, route)

  try {
    if (useBackground) {
      const submitted = await withDeadline('submit', Math.min(deadline, 30_000), (signal) =>
        submitAstraBackgroundResponse({ ...payload, background: true }, astraRouteConfig(key, signal), fetch))
      const text = await submitted.response.text()
      const parsed = ((): unknown => { try { return JSON.parse(text) } catch { return null } })()
      const requestId = providerRequestId(submitted.response)
      if (!submitted.response.ok) {
        await readOpenAIGenerationResponse(new Response(text, { status: submitted.response.status }))
        return { kind: 'failed', error: jobError('provider-unavailable', 'The generator rejected this piece of the build. Nothing was saved.', { providerStatus: submitted.response.status, requestId }) }
      }
      const responseId = isRecord(parsed) && isText(parsed.id) ? parsed.id : null
      const status = isRecord(parsed) ? parsed.status : null
      if (responseId && (status === 'queued' || status === 'in_progress')) {
        return {
          kind: 'pending', providerResponseId: responseId, providerRoute: submitted.route, providerRequestId: requestId,
          ...(submitted.reservationId ? { backupReservationId: submitted.reservationId } : {}),
        }
      }
      // Completed inside the submit call: settle here instead of on retrieval.
      if (submitted.reservationId) {
        await settleAstraBackground(submitted.reservationId, submitted.response.status, isRecord(parsed) ? parsed.usage : null, astraRouteConfig(key).ledger)
      }
      return await settle(await readOpenAIGenerationResponse(new Response(text, { status: 200 })), wire)
    }

    const sent = await withDeadline('generation', deadline, (signal) =>
      postAstraResponseWithRoute(payload, astraRouteConfig(key, signal, task.idempotency_key), fetch))
    const response = sent.response
    const text = await response.text()
    const requestId = providerRequestId(response)
    if (!response.ok) {
      await readOpenAIGenerationResponse(new Response(text, { status: response.status }))
      return { kind: 'failed', error: jobError('provider-unavailable', 'The generator rejected this piece of the build. Nothing was saved.', { providerStatus: response.status, requestId }) }
    }
    const settled = await settle(await readOpenAIGenerationResponse(new Response(text, { status: 200 })), wire)
    // Record which upstream actually carried it, so a finished build can be
    // audited for its provider path instead of leaving provider_route null.
    return settled.kind === 'done' || settled.kind === 'pending'
      ? { ...settled, providerRoute: settled.providerRoute ?? sent.route, providerRequestId: settled.providerRequestId ?? requestId }
      : settled
  } catch (error) {
    if (error instanceof StepTimeoutError) {
      // The request may have been accepted and billed. Say so.
      // The provider may have accepted and billed this. It is counted, and the
      // task is marked oversized so its next attempt must be a subdivision
      // rather than the identical request again.
      // Distinguish "too big for any worker" from "unlucky". `providerBudgetMs`
      // shrinks to whatever this worker has left, so a task can time out purely
      // because it landed on a worker most of the way through its life. Marking
      // that oversized would force a permanent subdivision — a needlessly
      // fragmented artifact — when a retry on a fresh worker would have
      // finished it. Only a timeout against a near-full stage budget is
      // evidence the work itself does not fit.
      const budgetWasFull = ceiling >= fullStageBudgetMs(spec, budget) * 0.8
      return {
        kind: 'failed',
        ambiguous: true,
        oversized: budgetWasFull,
        error: jobError('provider-timeout-ambiguous', `${error.message}${budgetWasFull ? '' : ' This worker was already part-way through its life, so the next attempt gets a full budget before anything is divided.'} The request may have been accepted by the provider, so this attempt is counted and will not be repeated unchanged. Nothing was saved and your material is unchanged.`),
      }
    }
    return { kind: 'failed', error: astraFailure(error) }
  }
}

function astraFailure(error: unknown): JobErrorDetail {
  if (error instanceof StepTimeoutError) {
    return jobError('provider-timeout', `${error.message} Nothing was saved.`)
  }
  if (error instanceof AstraRouteError) {
    return jobError(error.code, error.message, { providerStatus: error.status, requestId: error.requestId })
  }
  if (error instanceof OpenAIGenerationResponseError) {
    return jobError(error.code, `${error.message} Nothing was saved.`)
  }
  if (error instanceof SourceReadinessError) {
    return jobError(error.code, error.message)
  }
  if (error instanceof AnthropicGenerationError) {
    return jobError('anthropic-credit-exhausted', 'Anthropic credits are exhausted. Nothing was saved.')
  }
  return jobError('provider-unavailable', 'The AI provider could not complete this piece of the build. Nothing was saved.')
}

/** Passages this build may cite, loaded once per invocation. */
async function loadCorpus(client: ReturnType<typeof createClient>, userId: string, payload: JobPayload) {
  const chunks = await retrieveChunks(client, userId, payload.courseId, payload.topicId, payload.chunkIds)
  assertSourceReadiness(payload.chunkIds, chunks)
  return chunks
}

/**
 * The wire for a stage.
 *
 * Identical passage text crosses the wire once, and every passage ID that
 * carries it stays citable and is reported to the model with its occurrence
 * count. That is a transfer saving; the corpus the model reasons over is
 * unchanged, and repetition — which is how an instructor signals emphasis —
 * survives as information rather than being silently collapsed.
 */
function stageWire(chunks: Chunk[], inventory: SourceInventory) {
  const { canonical, aliasesFor } = deduplicatedSources(chunks, inventory)
  // Aliases are assigned over the FULL corpus so every original ID decodes.
  const wire = createOpenAICitationWire(chunks)
  const aliasOf = (chunkId: string) => {
    const index = chunks.findIndex((chunk) => chunk.chunk_id === chunkId)
    return index >= 0 ? `S${index + 1}` : chunkId
  }
  const canonicalIds = new Set(canonical.map((chunk) => chunk.chunk_id))
  const sources = wire.sources.filter((_source, index) => canonicalIds.has(chunks[index].chunk_id))
  return { wire, sources, aliasOf, aliasesFor }
}

function fileAliasOf(chunks: Chunk[]) {
  const aliases = new Map<string, string>()
  for (const chunk of chunks) if (!aliases.has(chunk.file_id)) aliases.set(chunk.file_id, `F${aliases.size + 1}`)
  return (fileId: string) => aliases.get(fileId) ?? fileId
}

const STAGE_JSON_RULE = 'Reply with one JSON object only, with no markdown fence and no preamble.'

function astraStagePayload(system: string[], user: string, maxOutputTokens: number) {
  return {
    // Pinned. The user-selected model is not a per-stage decision.
    model: 'gpt-6-astra',
    reasoning: { effort: 'low' },
    store: false,
    max_output_tokens: maxOutputTokens,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: system.filter(Boolean).join('\n') }] },
      { role: 'user', content: [{ type: 'input_text', text: user }] },
    ],
    text: { format: { type: 'json_object' } },
  }
}

/** Stage 1 — source readiness and the coverage inventory. No provider call. */
async function execInventory(
  service: unknown, client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload, budget: WorkerBudget,
): Promise<TaskOutcome> {
  const chunks = await loadCorpus(client, job.user_id, payload)
  const inventory = buildSourceInventory(chunks)
  const usable = chunks.filter((chunk) => chunk.content.trim())
  if (!usable.length) {
    return { kind: 'failed', error: jobError('no-sources', 'None of the selected material has readable text, so there is nothing to build from.') }
  }
  /**
   * Decide here, with the real corpus in hand, whether the whole thing can be
   * planned in one request. This is the point at which the shape of the rest of
   * the job is fixed — not discovered later by a request that fails.
   */
  const outlineSpec = stageSpec(payload.specId, 'outline')
  const observed = await stageObservation(service, payload.specId, 'outline')
  const planningBudget = providerBudgetMs(outlineSpec ?? { maxProviderMs: 80_000 } as StageSpec, budget)
  const canPlanInOne = singlePassCorpusChars(planningBudget, outlineSpec?.minOutputTokens ?? 1_200, observed)
  // The wire carries more than the raw text: identifiers, framing, the spec.
  const wireOverhead = 1.6
  const planningMode = inventory.totalCharacters * wireOverhead <= canPlanInOne ? 'single' : 'hierarchical'

  await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
    .from('study_generation_jobs').update({ inventory: { ...inventory, planningMode, planningBudgetChars: canPlanInOne } }).eq('id', job.id)
  return {
    kind: 'done',
    output: {
      files: inventory.files.length,
      passages: inventory.totalChunks,
      characters: inventory.totalCharacters,
      uniqueTexts: inventory.uniqueTexts,
      transferSavedCharacters: inventory.transferSavedCharacters,
      emptyPassages: inventory.emptyChunkIds.length,
      planningMode,
      planningBudgetChars: canPlanInOne,
    },
  }
}

type PlannedSubpoint = { id: string; title: string; sourceChunkIds: string[] }
type PlannedSection = { id: string; title: string; purpose: string; passageIds: string[]; subpoints?: PlannedSubpoint[] }

/**
 * Read the plan AFTER the citation wire has decoded it.
 *
 * The plan names its passages with `sourceChunkIds` — the wire's own vocabulary
 * — so the request-local aliases the model was given decode back to real
 * passage identities here. A plan that references anything else simply fails to
 * resolve, which is the behaviour we want: no guessing a source on its behalf.
 */
function readPlan(value: unknown, resolves: (id: string) => boolean) {
  if (!isRecord(value) || !Array.isArray(value.sections)) return null
  const sections: PlannedSection[] = []
  for (const entry of value.sections) {
    if (!isRecord(entry) || !isText(entry.id) || !isText(entry.title)) return null
    const ids = Array.isArray(entry.sourceChunkIds) ? entry.sourceChunkIds.filter(isText).filter(resolves) : []
    if (!ids.length) return null
    const subpoints = Array.isArray(entry.subpoints)
      ? entry.subpoints.filter(isRecord).map((point) => ({
          id: isText(point.id) ? point.id : '',
          title: isText(point.title) ? point.title : '',
          sourceChunkIds: Array.isArray(point.sourceChunkIds) ? point.sourceChunkIds.filter(isText).filter(resolves) : [],
        })).filter((point) => point.id && point.title && point.sourceChunkIds.length)
      : []
    sections.push({ id: entry.id, title: entry.title, purpose: isText(entry.purpose) ? entry.purpose : '', passageIds: ids, subpoints })
  }
  if (!sections.length) return null
  const ids = new Set(sections.map((section) => section.id))
  if (ids.size !== sections.length) return null
  const unusedSources = Array.isArray(value.unusedSources)
    ? value.unusedSources.filter(isRecord).map((entry) => ({
        fileId: isText(entry.fileId) ? entry.fileId : '',
        reason: isText(entry.reason) ? entry.reason : '',
      })).filter((entry) => entry.fileId)
    : []
  return { sections, unusedSources }
}

/**
 * Stage 2 — the plan.
 *
 * This is the only stage that sees the whole corpus at once, and it stays fast
 * because its OUTPUT is small: a section list and, per section, the exact
 * passages that support it, chosen from everything. Nothing is summarised here;
 * the passages are carried forward at full length into the writing stage.
 */
async function execOutline(
  service: unknown, client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload,
  task: TaskRow, spec: StageSpec, budget: WorkerBudget, sized?: { inputChars?: number; outputTokens?: number },
): Promise<TaskOutcome> {
  const chunks = await loadCorpus(client, job.user_id, payload)
  const inventory = buildSourceInventory(chunks)
  const objectives = payload.specId === 'unit-mastery-outline-v1'
  const unit = objectives ? 'objective' : 'section'

  const outcome = await runProviderStage(service, task, spec, budget, payload.specId, (outputTokens) => {
    const { wire, sources, aliasOf } = stageWire(chunks, inventory)
    const payloadBody = astraStagePayload([
      wire.encodePrompt(payload.systemPrompt),
      STAGE_JSON_RULE,
      `Plan only. Do not write the ${unit}s yet.`,
      `Return {"sections":[{"id","title","purpose","sourceChunkIds":[...],"subpoints":[{"id","title","sourceChunkIds":[...]}]}],"unusedSources":[{"fileId","reason"}]}.`,
      'Give every section subpoints covering its material. They are the section\'s own internal divisions and are used if the section has to be written in parts.',
      `Each ${unit} must list the exact supplied passage IDs that support it, drawn from anywhere in the corpus — a ${unit} may and should draw on several sources when they bear on it.`,
      'A passage may support more than one section. Every source must appear in at least one section unless you name it in unusedSources with a specific reason.',
      'Do not shorten, merge away, or drop material to make a smaller plan: plan as many sections as the material genuinely supports.',
      repetitionNotice(inventory, aliasOf),
      coverageBriefing(inventory, fileAliasOf(chunks)),
      isText(task.input?.problem)
        ? `A prior attempt at this plan was rejected: ${task.input.problem}. Correct exactly that.${payload.repairGuidance ?? ''}`
        : '',
    ], `Request:\n${wire.encodePrompt(payload.request)}\n\nSource passages:\n${JSON.stringify(sources)}`, outputTokens)
    return { payload: payloadBody, wire }
  }, (raw, wire) => settlePlan(wire.decode(raw), chunks, inventory, service, job, unit), undefined, sized)

  return outcome
}


/**
 * Survey one source (or one ordered span of an oversized source).
 *
 * Reads that source in full and returns a topic list with exact passage IDs and
 * any qualification the instructor attaches. Small output by shape; nothing is
 * summarised away, because the passages themselves travel on to the writing
 * stage untouched — this stage only decides what is IN the source.
 */
async function execSurvey(
  service: unknown, client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload,
  task: TaskRow, spec: StageSpec, budget: WorkerBudget, sized?: { inputChars?: number; outputTokens?: number },
): Promise<TaskOutcome> {
  const chunks = await loadCorpus(client, job.user_id, payload)
  const inventory = buildSourceInventory(chunks)
  const scope = new Set((task.input.passageIds as string[]) ?? [])
  const mine = chunks.filter((chunk) => scope.has(chunk.chunk_id))
  if (!mine.length) return { kind: 'failed', error: jobError('invalid-response', 'This source survey lost its passages. Nothing was saved.') }

  return runProviderStage(service, task, spec, budget, payload.specId, (outputTokens) => {
    const { wire } = stageWire(chunks, inventory)
    const sources = createOpenAICitationWire(chunks).sources.filter((_source, index) => scope.has(chunks[index].chunk_id))
    const body = astraStagePayload([
      wire.encodePrompt(payload.systemPrompt),
      STAGE_JSON_RULE,
      'Survey only. Do not write the artifact.',
      'Return {"topics":[{"id","title","summary","sourceChunkIds":[...],"qualifications":[...]}]}.',
      'List every distinct topic this source covers, with the exact supplied passage IDs that support it. Every supplied passage must appear under at least one topic.',
      'Record in qualifications any limit, exception, caveat, or emphasis the source itself attaches — "only in adults", "not on the exam", "the instructor stressed this". These must not be lost when sources are later combined.',
      'Do not merge distinct topics to shorten the list, and do not omit a topic because it seems minor.',
    ], `Request:\n${wire.encodePrompt(payload.request)}\n\nSource passages:\n${JSON.stringify(sources)}`, outputTokens)
    return { payload: body, wire }
  }, (raw, wire) => {
    const decoded = wire.decode(raw)
    const known = new Set(mine.map((chunk) => chunk.chunk_id))
    const topics = isRecord(decoded) && Array.isArray(decoded.topics)
      ? decoded.topics.filter(isRecord).map((topic) => ({
          id: isText(topic.id) ? topic.id : '',
          title: isText(topic.title) ? topic.title : '',
          summary: isText(topic.summary) ? topic.summary : '',
          sourceChunkIds: Array.isArray(topic.sourceChunkIds) ? topic.sourceChunkIds.filter(isText).filter((id) => known.has(id)) : [],
          qualifications: Array.isArray(topic.qualifications) ? topic.qualifications.filter(isText).slice(0, 12) : [],
        })).filter((topic) => topic.title && topic.sourceChunkIds.length)
      : []
    if (!topics.length) {
      return { kind: 'failed', error: jobError('invalid-response', 'The survey of this source returned no usable topics. Nothing was saved.') }
    }
    // Coverage is checked here, not deferred: a survey that silently skipped
    // passages would hand the planner an incomplete picture of the source.
    const covered = new Set(topics.flatMap((topic) => topic.sourceChunkIds))
    const missed = mine.filter((chunk) => chunk.content.trim() && !covered.has(chunk.chunk_id)).map((chunk) => chunk.chunk_id)
    return { kind: 'done', output: { topics, missedChunkIds: missed, fileId: task.input.fileId ?? null } as unknown as Record<string, unknown> }
  }, (verdict) => {
    // An oversized source is surveyed as ordered spans of its own passages.
    const perPart = Math.max(1_000, Math.floor(verdict.affordableInputChars * 0.6))
    const spans = orderedSpans(mine, (chunk) => chunk.content.length, perPart)
    if (spans.length < 2) return null
    const parentKey = task.parent_task_key ?? task.task_key
    return {
      kind: 'subdivide',
      reason: `${spans.length} ordered spans of one source`,
      parts: spans.map((span, index) => ({
        taskKey: `${parentKey}::span-${index + 1}`,
        ordinal: task.ordinal,
        part: index,
        label: `${task.label} (${index + 1} of ${spans.length})`,
        input: {
        ...task.input,
        passageIds: span.map((chunk) => chunk.chunk_id),
        span: index + 1,
        spans: spans.length,
        outputTokens: Math.max(spec.minOutputTokens ?? 800, Math.ceil((spec.outputTokens ?? 3_000) / spans.length)),
      },
      })),
    }
  }, sized)
}

/**
 * Reconcile every survey into one plan.
 *
 * Reads topic lists, never the corpus, so it is small by shape rather than by
 * trimming. This is where cross-source structure is established: a section may
 * draw topics from several sources, and a qualification one source attaches to
 * a claim travels with it so a later section cannot state the claim flatly.
 */
async function execMerge(
  service: unknown, client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload,
  task: TaskRow, spec: StageSpec, budget: WorkerBudget, tasks: TaskRow[], sized?: { inputChars?: number; outputTokens?: number },
): Promise<TaskOutcome> {
  const chunks = await loadCorpus(client, job.user_id, payload)
  const inventory = buildSourceInventory(chunks)
  const surveys = tasks.filter((entry) => entry.stage === 'survey' && entry.status === 'done')
    .sort((left, right) => left.ordinal - right.ordinal || left.part - right.part)
  if (!surveys.length) return { kind: 'failed', error: jobError('invalid-response', 'No source survey survived to be reconciled. Nothing was saved.') }

  const wireIndex = new Map(chunks.map((chunk, index) => [chunk.chunk_id, `S${index + 1}`]))
  const fileAlias = fileAliasOf(chunks)
  const topics = surveys.flatMap((entry) => {
    const output = isRecord(entry.output) && Array.isArray(entry.output.topics) ? entry.output.topics : []
    const fileId = isRecord(entry.output) && isText(entry.output.fileId) ? entry.output.fileId : ''
    return output.filter(isRecord).map((topic) => ({
      source: fileId ? fileAlias(fileId) : entry.task_key,
      title: topic.title,
      summary: topic.summary,
      qualifications: topic.qualifications,
      sourceChunkIds: Array.isArray(topic.sourceChunkIds) ? topic.sourceChunkIds.map((id) => wireIndex.get(String(id)) ?? String(id)) : [],
    }))
  })

  return runProviderStage(service, task, spec, budget, payload.specId, (outputTokens) => {
    const { wire } = stageWire(chunks, inventory)
    const body = astraStagePayload([
      wire.encodePrompt(payload.systemPrompt),
      STAGE_JSON_RULE,
      'Plan only. You are given every source\'s surveyed topics, not the passages themselves.',
      'Return {"sections":[{"id","title","purpose","sourceChunkIds":[...],"subpoints":[{"id","title","sourceChunkIds":[...]}]}],"unusedSources":[{"fileId","reason"}]}.',
      'Group topics into sections by what they teach, so a section may and should draw on several sources when they bear on the same idea. Do not organise the artifact by source.',
      'Where sources qualify or disagree with each other, keep both and say so in that section\'s purpose; never silently drop the qualified version.',
      'Give every section subpoints covering its material. They are the section\'s own internal divisions and are used if the section has to be written in parts.',
      'Every surveyed topic must be placed in a section, or its source named in unusedSources with a specific reason.',
      coverageBriefing(inventory, fileAlias),
      isText(task.input?.problem) ? `A prior attempt at this plan was rejected: ${task.input.problem}. Correct exactly that.${payload.repairGuidance ?? ''}` : '',
    ], `Request:\n${wire.encodePrompt(payload.request)}\n\nSurveyed topics by source:\n${JSON.stringify(topics)}`, outputTokens)
    return { payload: body, wire }
  }, (raw, wire) => settlePlan(wire.decode(raw), chunks, inventory, service, job, 'section'), undefined, sized)
}

/**
 * Accept a plan only if it resolves and accounts for the material.
 *
 * Shared by the one-pass planner and the merge, so both are held to the same
 * completion criterion: every section resolves to real passages, and every
 * source is used or explicitly explained.
 */
async function settlePlan(
  decoded: unknown, chunks: Chunk[], inventory: SourceInventory, service: unknown, job: JobRow, unit: string,
): Promise<TaskOutcome> {
  const known = new Set(chunks.map((chunk) => chunk.chunk_id))
  const plan = readPlan(decoded, (id) => known.has(id))
  if (!plan) {
    return { kind: 'failed', error: jobError('invalid-response', `The plan did not name usable ${unit}s with resolvable passages. Nothing was saved.`) }
  }
  const used = new Set(plan.sections.flatMap((section) => section.passageIds))
  const fileOf = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk.file_id]))
  const usedFiles = new Set([...used].map((id) => fileOf.get(id)!))
  const explained = new Set(plan.unusedSources.map((entry) => entry.fileId))
  const uncovered = inventory.files
    .filter((file) => file.chunkIds.length > file.emptyChunkIds.length)
    .filter((file) => !usedFiles.has(file.fileId) && !explained.has(file.fileId))
  if (uncovered.length) {
    return { kind: 'failed', error: jobError('coverage-incomplete', `The plan left ${uncovered.length} selected source(s) neither used nor explained. Nothing was saved.`) }
  }
  await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
    .from('study_generation_jobs').update({ outline: plan }).eq('id', job.id)
  return { kind: 'done', output: { plan } as unknown as Record<string, unknown> }
}

/**
 * Stage 3 — write one section (or develop one objective).
 *
 * The task carries its own mapped passages at FULL length plus the whole plan,
 * so the section is grounded in all the evidence that bears on it and knows
 * what its neighbours cover. That is what makes the document cohere without
 * ever asking one request to write the whole thing.
 */
async function execSection(
  service: unknown, client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload,
  task: TaskRow, spec: StageSpec, budget: WorkerBudget, sized?: { inputChars?: number; outputTokens?: number },
): Promise<TaskOutcome> {
  const chunks = await loadCorpus(client, job.user_id, payload)
  const inventory = buildSourceInventory(chunks)
  const section = task.input as unknown as PlannedSection & { plan?: PlannedSection[]; problem?: string }
  const objectives = payload.specId === 'unit-mastery-outline-v1'
  // A coverage repair carries the passages no planned piece accounted for.
  const isCoverageRepair = task.stage === 'repair' && task.task_key.startsWith('coverage::')
  const mapped = new Set(section.passageIds ?? [])
  const supporting = chunks.filter((chunk) => mapped.has(chunk.chunk_id))
  if (!supporting.length) {
    return { kind: 'failed', error: jobError('invalid-response', 'This section lost its supporting passages. Nothing was saved.') }
  }

  return runProviderStage(service, task, spec, budget, payload.specId, (outputTokens) => {
    const { wire, aliasOf } = stageWire(chunks, inventory)
    const supportingSources = createOpenAICitationWire(chunks).sources
      .filter((_source, index) => mapped.has(chunks[index].chunk_id))
    const outline = (section.plan ?? []).map((entry) => `${entry.id}: ${entry.title}`).join(' | ')
    const body = astraStagePayload([
      wire.encodePrompt(payload.systemPrompt),
      STAGE_JSON_RULE,
      objectives
        ? (isCoverageRepair
          // Leftover passages need not belong to one objective. Asking for
          // exactly one made the honest answer unrepresentable.
          ? 'Return {"standards":[ { ... } ]} — one entry per objective these passages support, each matching the artifact specification for a single standards entry. Return a single-entry list if one objective genuinely covers them.'
          : 'Return {"standard": { ... }} for exactly this one objective, matching the artifact specification for a single standards entry.')
        : 'Return {"section": {"id","title","blocks":[...]}} for exactly this one section, matching the artifact specification for a single section.',
      `Write only this ${objectives ? 'objective' : 'section'}: ${section.id} — ${section.title}. ${section.purpose ?? ''}`,
      outline ? `The full plan, so this piece fits the whole and does not repeat its neighbours: ${outline}.` : '',
      'Use the supplied passages in full. Do not compress or omit supported detail to be brief.',
      OPENAI_GENERATION_CITATION_INSTRUCTION,
      'Transport-only citation format override: wherever the artifact schema asks for sourceRef, output only {"citationId":"S123"} using the exact supplied passage ID. For sourceRefs output an array of these single-key objects. sourceChunkId/sourceChunkIds/evidenceIds still use the supplied passage IDs directly.',
      repetitionNotice(inventory, aliasOf),
      section.problem ? `A prior attempt at this piece was rejected: ${section.problem}. Correct exactly that.${payload.repairGuidance ?? ''}` : '',
    ], `Request:\n${wire.encodePrompt(payload.request)}\n\nSupporting passages:\n${JSON.stringify(supportingSources)}`, outputTokens)
    return { payload: body, wire }
  }, (raw, wire) => {
    const decoded = canonicalizeOpenAIGenerationSourceRefs(wire.decode(raw), chunks)
    const single = isRecord(decoded) ? (objectives ? decoded.standard : decoded.section) : null
    // A coverage repair carries whatever no planned piece accounted for, which
    // for a mastery map can legitimately span several objectives. Demanding
    // exactly one `standard` made that unsatisfiable: the leftover passages
    // cannot honestly be one objective, so the reply never matched and the
    // build failed on shape rather than on content. A list is accepted and
    // flattened at assembly.
    const many = objectives && isRecord(decoded) && Array.isArray(decoded.standards)
      ? decoded.standards.filter(isRecord)
      : []
    const piece: Record<string, unknown> | null = isRecord(single)
      ? single
      : many.length ? { standards: many } : null
    if (!piece) {
      // Say what came back, so the next failure is diagnosable from the row
      // instead of needing a rerun. Keys only — never the generated content.
      const shape = isRecord(decoded) ? Object.keys(decoded).slice(0, 12).join(',') : typeof decoded
      return {
        kind: 'failed',
        error: jobError('invalid-response', 'The generator returned nothing usable for this piece. Nothing was saved.', { issues: [`expected ${objectives ? 'standard | standards[]' : 'section'}; received: ${shape}`] }),
      }
    }
    return { kind: 'done', output: { piece } as Record<string, unknown> }
  }, (verdict) => subdivideSection(section, supporting, task, verdict, spec), sized)
}

/**
 * Split one oversized section along ITS OWN structure.
 *
 * First choice is the plan's subpoints: those are the section's real internal
 * divisions, so each part is a coherent piece of writing that the assembler can
 * put back together in order. Only when the plan offered none does it fall back
 * to ordered spans of the section's own passage sequence — still that section's
 * material, in its own order, never a fixed fraction of the corpus.
 *
 * Returns null when the section is a single passage that cannot be divided; the
 * caller then reports the size honestly rather than sending it anyway.
 */
function subdivideSection(
  section: PlannedSection & { plan?: Array<{ id: string; title: string }>; subpoints?: Array<{ id: string; title: string; sourceChunkIds?: string[] }>; problem?: string; outputTokens?: number },
  supporting: Chunk[],
  task: TaskRow,
  verdict: { affordableInputChars: number; affordableOutputTokens: number },
  spec: StageSpec,
): TaskOutcome | null {
  const parentKey = task.parent_task_key ?? task.task_key
  const known = new Set(supporting.map((chunk) => chunk.chunk_id))
  const floor = spec.minOutputTokens ?? 1_000
  const parentWant = Number(section.outputTokens) || spec.outputTokens || 5_000
  // Each part's share of the writing, never below what a real piece needs.
  const shareFor = (count: number) => Math.max(floor, Math.ceil(parentWant / count))

  const subpoints = (section.subpoints ?? []).filter((point) => point.id && (point.sourceChunkIds ?? []).some((id) => known.has(id)))
  if (subpoints.length > 1) {
    return {
      kind: 'subdivide',
      reason: `${subpoints.length} subpoints`,
      parts: subpoints.map((point, index) => ({
        taskKey: `${parentKey}::${point.id}`,
        ordinal: task.ordinal,
        part: index,
        label: `${section.title} — ${point.title}`,
        input: {
          ...section,
          id: `${section.id}::${point.id}`,
          title: point.title,
          purpose: `${section.purpose ?? ''} This part covers: ${point.title}.`,
          passageIds: (point.sourceChunkIds ?? []).filter((id) => known.has(id)),
          subpoints: undefined,
          outputTokens: shareFor(subpoints.length),
        },
      })),
    }
  }

  // No declared subpoints: divide this section's own passages in their document
  // order, sized to what one request can carry.
  const perPart = Math.max(1_000, Math.floor(verdict.affordableInputChars * 0.6))
  let spans = orderedSpans(supporting, (chunk) => chunk.content.length, perPart)
  if (spans.length < 2 && supporting.length > 1) {
    // `affordableInputChars` measures the SERIALISED REQUEST — prompt, rules,
    // citation wire and all — while orderedSpans measures raw passage content,
    // which is a fraction of it. A budget expressed in the larger unit and
    // applied to the smaller one can exceed the whole corpus and return a
    // single span, so a task that must get smaller cannot. A live coverage
    // repair hit exactly this: 109 passages, ~17k chars of content against a
    // 56k-char request, one span, no split, job failed. When the passages
    // themselves are divisible, halve by passage count rather than give up.
    const half = Math.ceil(supporting.length / 2)
    spans = [supporting.slice(0, half), supporting.slice(half)]
  }
  if (spans.length < 2) return null
  return {
    kind: 'subdivide',
    reason: `${spans.length} ordered passage spans`,
    parts: spans.map((span, index) => ({
      taskKey: `${parentKey}::part-${index + 1}`,
      ordinal: task.ordinal,
      part: index,
      label: `${section.title} (${index + 1} of ${spans.length})`,
      input: {
        ...section,
        id: `${section.id}::part-${index + 1}`,
        title: index === 0 ? section.title : `${section.title} (continued)`,
        purpose: `${section.purpose ?? ''} This is part ${index + 1} of ${spans.length} of this section, covering its passages in order. Continue the same explanation; do not restate earlier parts.`,
        passageIds: span.map((chunk) => chunk.chunk_id),
        outputTokens: shareFor(spans.length),
      },
    })),
  }
}

/** Single-pass artifacts keep one drafting task; the durability is around it. */
async function execDraft(
  service: unknown, client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload,
  task: TaskRow, spec: StageSpec, budget: WorkerBudget, sized?: { inputChars?: number; outputTokens?: number },
): Promise<TaskOutcome> {
  const chunks = await loadCorpus(client, job.user_id, payload)
  const inventory = buildSourceInventory(chunks)
  const problem = isText(task.input?.problem) ? task.input.problem : ''
  return runProviderStage(service, task, spec, budget, payload.specId, (outputTokens) => {
    const { wire, sources, aliasOf } = stageWire(chunks, inventory)
    const body = astraStagePayload([
      wire.encodePrompt(payload.systemPrompt),
      STAGE_JSON_RULE,
      'Follow the required artifact shape in the specification.',
      OPENAI_GENERATION_CITATION_INSTRUCTION,
      'Transport-only citation format override: wherever the artifact schema asks for sourceRef, output only {"citationId":"S123"} using the exact supplied passage ID. For sourceRefs output an array of these single-key objects. sourceChunkId/sourceChunkIds/evidenceIds still use the supplied passage IDs directly.',
      repetitionNotice(inventory, aliasOf),
      problem ? `A prior attempt was rejected: ${problem}. Rebuild the complete artifact and correct exactly that.${payload.repairGuidance ?? ''}` : '',
    ], `Request:\n${wire.encodePrompt(payload.request)}\n\nSource passages:\n${JSON.stringify(sources)}`, outputTokens)
    return { payload: body, wire }
  }, (raw, wire) => {
    const value = canonicalizeOpenAIGenerationSourceRefs(wire.decode(raw), chunks)
    return { kind: 'done', output: { piece: value } as Record<string, unknown> }
  }, undefined, sized)
}

/**
 * Stage 4 — verification. Deterministic, no provider call.
 *
 * Three questions the student would ask: is every claim traceable, did the
 * build actually use what I selected, and do the pieces hold together? A
 * failure here names the specific pieces, so stage 5 rebuilds only those.
 */
async function execVerify(
  service: unknown, client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload, tasks: TaskRow[],
): Promise<TaskOutcome> {
  const chunks = await loadCorpus(client, job.user_id, payload)
  const inventory = buildSourceInventory(chunks)
  const produced = tasks
    .filter((entry) => (entry.stage === 'sections' || entry.stage === 'draft' || entry.stage === 'repair') && entry.status === 'done')
    .sort((left, right) => left.ordinal - right.ordinal)

  // Group by parent, so a section written in parts is verified as the one
  // section it will be, and a later repair supersedes what it repaired.
  const grouped = new Map<string, Array<{ part: number; ordinal: number; piece: unknown }>>()
  for (const entry of produced) {
    const key = entry.parent_task_key ?? entry.task_key
    const piece = isRecord(entry.output) ? entry.output.piece : null
    const list = grouped.get(key) ?? []
    const index = list.findIndex((candidate) => candidate.part === entry.part)
    if (index >= 0) list[index] = { part: entry.part, ordinal: entry.ordinal, piece }
    else list.push({ part: entry.part, ordinal: entry.ordinal, piece })
    grouped.set(key, list)
  }
  const entries = [...grouped.entries()]
    .sort(([, left], [, right]) => (left[0]?.ordinal ?? 0) - (right[0]?.ordinal ?? 0))
    .map(([key, parts]) => {
      const usable = parts.filter((entry) => isRecord(entry.piece)) as Array<{ part: number; piece: Record<string, unknown> }>
      return { key, piece: usable.length ? mergeParts(usable) : null }
    })
  const pieces = entries.map((entry) => entry.piece).filter((piece): piece is Record<string, unknown> => isRecord(piece))

  const closed = closeCitationSet(collectArtifactCitations(pieces, chunks), chunks)
  const problems: Array<{ key: string; problem: string }> = []

  // Each piece is checked on its own, so a repair rebuilds only what failed.
  for (const entry of entries) {
    if (!isRecord(entry.piece)) { problems.push({ key: entry.key, problem: 'the piece is missing' }); continue }
    const issues: string[] = []
    if (!validateArtifactReferences(entry.piece, closed, issues)) {
      problems.push({ key: entry.key, problem: `unverified source references — ${issues.slice(0, 3).join('; ')}` })
    }
  }

  /**
   * Coverage is checked against the ORIGINAL inventory, never against the plan.
   *
   * A plan that quietly forgot part of the material would otherwise become the
   * authority for what "complete" means. Every usable passage must end up
   * cited, or planned into a section, or explicitly set aside with a reason —
   * anything else is unaccounted for and gets its own repair.
   */
  const citedChunks = new Set(closed.map((ref) => ref.chunkId))
  const citedFiles = new Set(closed.map((ref) => ref.fileId))
  const plan = isRecord(job.outline) && Array.isArray(job.outline.sections) ? job.outline.sections as PlannedSection[] : []
  const plannedChunks = new Set(plan.flatMap((section) => section.passageIds ?? []))
  const excusedFiles = new Set(
    isRecord(job.outline) && Array.isArray(job.outline.unusedSources)
      ? job.outline.unusedSources.filter(isRecord).map((entry) => String(entry.fileId))
      : [],
  )
  // Duplicate text is transferred once but every id stays accountable: a
  // passage counts as covered when the text it carries was cited.
  const canonicalCovered = new Set<string>()
  for (const group of inventory.duplicateGroups) {
    if (group.chunkIds.some((id) => citedChunks.has(id) || plannedChunks.has(id))) {
      for (const id of group.chunkIds) canonicalCovered.add(id)
    }
  }
  const unaccountedChunkIds = chunks
    .filter((chunk) => chunk.content.trim())
    .filter((chunk) => !excusedFiles.has(chunk.file_id))
    .filter((chunk) => !citedChunks.has(chunk.chunk_id) && !plannedChunks.has(chunk.chunk_id) && !canonicalCovered.has(chunk.chunk_id))
    .map((chunk) => chunk.chunk_id)
  const uncovered = inventory.files
    .filter((file) => file.chunkIds.length > file.emptyChunkIds.length && !citedFiles.has(file.fileId))
    .map((file) => file.fileId)

  // Cross-piece consistency: no duplicate identities in the assembled artifact.
  const identities = pieces.map((piece) => (isText(piece.id) ? piece.id : '')).filter(Boolean)
  const duplicateIdentities = identities.length !== new Set(identities).size

  const verification = {
    pieces: pieces.length,
    verifiedCitations: closed.length,
    // The closed set is carried forward so assembly does not recompute it from
    // a corpus it no longer holds.
    closed,
    problems,
    uncoveredFileIds: uncovered,
    unaccountedChunkIds,
    unaccountedPassages: unaccountedChunkIds.length,
    duplicateIdentities,
    clean: problems.length === 0 && closed.length > 0 && !duplicateIdentities && unaccountedChunkIds.length === 0,
  }
  await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
    .from('study_generation_jobs').update({ verification }).eq('id', job.id)

  if (!closed.length) {
    return { kind: 'failed', error: jobError('citation-not-carried', 'No claim in the generated work could be traced to your material, so it was refused rather than corrected. Nothing was saved.') }
  }
  return { kind: 'done', output: verification as unknown as Record<string, unknown> }
}

/** Stage 6 — the independent review, unchanged in authority. */
async function execAudit(
  client: ReturnType<typeof createClient>, job: JobRow, payload: JobPayload, tasks: TaskRow[],
  spec: StageSpec, budget: WorkerBudget, task: TaskRow,
): Promise<TaskOutcome> {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return { kind: 'done', output: { auditStatus: 'skipped' } }
  if (!canRunStep(budget, 20_000)) return { kind: 'pending' }
  const chunks = await loadCorpus(client, job.user_id, payload)
  const artifact = assembleArtifact(payload, job, tasks)

  // Scope this review. A per-piece task carries only that piece and only the
  // passages it cites; the consistency pass carries the assembled claims and no
  // documents at all, so neither grows with the size of the corpus.
  const consistency = task.input?.consistency === true
  const pieceKey = isText(task.input?.pieceKey) ? task.input.pieceKey : null
  const scopedIds = new Set((task.input?.passageIds as string[]) ?? [])
  const evidence = consistency ? [] : scopedIds.size ? chunks.filter((chunk) => scopedIds.has(chunk.chunk_id)) : chunks
  const sections = isRecord(artifact) && Array.isArray(artifact.sections) ? artifact.sections : []
  const subject = consistency
    ? artifact
    : pieceKey
      ? sections.find((section) => isRecord(section) && section.id === pieceKey) ?? artifact
      : artifact
  const instruction = consistency
    ? `${payload.systemPrompt}\n\nReview only for internal consistency: sections that contradict each other, a claim stated flatly in one section that another section qualifies, duplicated identities, or a required section missing. No documents are supplied; judge the artifact against itself.`
    : payload.systemPrompt

  try {
    const audit = await withDeadline('review', stepDeadlineMs(budget, providerBudgetMs(spec, budget)), (signal) =>
      callAnthropicAudit(subject, evidence, instruction, signal))
    if (!audit.approved) {
      return { kind: 'failed', error: jobError('audit-rejected', 'The independent provider review found a source or specification problem. Nothing was saved.', { issues: safeAuditIssues(audit.issues) }) }
    }
    return { kind: 'done', output: { auditStatus: 'approved' } }
  } catch (error) {
    // The gate holds or it is not a gate. An audit that could not run has not
    // approved anything, and returning 'done' shipped the artifact unreviewed —
    // a live build saved a study guide with auditStatus 'unavailable' and no
    // record anywhere of why the reviewer failed. `skipped` (no key configured)
    // stays a deliberate deployment choice and still passes; a configured
    // reviewer that errors is a failure, and it carries its own reason.
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error('study-tools audit unavailable', reason)
    return {
      kind: 'failed',
      error: jobError('audit-unavailable', 'The independent review could not be completed, so this build was not saved unreviewed.', { issues: [reason.slice(0, 300)] }),
    }
  }
}

/**
 * Stage 7 — assembly. The artifact is the verified pieces in plan order, so a
 * section that was repaired takes its original place rather than being appended.
 */
/**
 * Put a subdivided section back together.
 *
 * A section written in parts is still ONE section in the artifact: its parts
 * are concatenated in order under the parent's own title. The reader never sees
 * the seam, which is the point of dividing along the section's own subpoints
 * rather than along the material.
 */
function mergeParts(parts: Array<{ part: number; piece: Record<string, unknown> }>): Record<string, unknown> {
  const ordered = [...parts].sort((left, right) => left.part - right.part)
  const first = ordered[0].piece
  if (ordered.length === 1) return first
  const blocks = ordered.flatMap((entry) => (Array.isArray(entry.piece.blocks) ? entry.piece.blocks : []))
  if (blocks.length) return { ...first, blocks }
  // Objectives and other shapes: merge their array fields in order.
  const merged: Record<string, unknown> = { ...first }
  for (const key of Object.keys(first)) {
    if (!Array.isArray(first[key])) continue
    merged[key] = ordered.flatMap((entry) => (Array.isArray(entry.piece[key]) ? entry.piece[key] as unknown[] : []))
  }
  return merged
}

function assembleArtifact(payload: JobPayload, job: JobRow, tasks: TaskRow[]): unknown {
  const produced = tasks
    .filter((entry) => ['sections', 'draft', 'repair'].includes(entry.stage) && entry.status === 'done')
    .sort((left, right) => left.ordinal - right.ordinal || left.part - right.part)
  // Group by parent so a section written in parts reassembles into one section,
  // and a repair replaces the piece it repaired rather than being appended.
  const grouped = new Map<string, Array<{ part: number; piece: Record<string, unknown> }>>()
  for (const entry of produced) {
    const piece = isRecord(entry.output) ? entry.output.piece : null
    if (!isRecord(piece)) continue
    const key = entry.parent_task_key ?? entry.task_key
    const existing = grouped.get(key)
    if (existing) {
      // A later attempt at the same part supersedes the earlier one.
      const index = existing.findIndex((candidate) => candidate.part === entry.part)
      if (index >= 0) existing[index] = { part: entry.part, piece }
      else existing.push({ part: entry.part, piece })
    } else {
      grouped.set(key, [{ part: entry.part, piece }])
    }
  }
  const byKey = new Map<string, Record<string, unknown>>()
  for (const [key, parts] of grouped) byKey.set(key, mergeParts(parts))
  const plan = isRecord(job.outline) && Array.isArray(job.outline.sections)
    ? job.outline.sections as PlannedSection[]
    : []
  // Planned pieces first, in plan order. Then anything produced that the plan
  // never named — which is what a coverage repair is: material no planned piece
  // accounted for. Keeping only planned ids silently dropped those pieces after
  // the build had already generated and paid for them, so the artifact was
  // missing exactly the passages the coverage check went and recovered.
  const plannedIds = new Set(plan.map((section) => section.id))
  const ordered = plan.length
    ? [
      ...plan.map((section) => byKey.get(section.id)).filter((piece): piece is Record<string, unknown> => isRecord(piece)),
      ...[...byKey.entries()]
        .filter(([key]) => !plannedIds.has(key))
        .map(([, piece]) => piece)
        .filter((piece): piece is Record<string, unknown> => isRecord(piece)),
    ]
    : [...byKey.values()]

  if (payload.specId === 'unit-mastery-outline-v1') {
    const first = ordered[0] as Record<string, unknown> | undefined
    // One task usually yields one objective, but a coverage repair may return a
    // list of them; flatten so the map carries each as its own standard.
    const standards = ordered.flatMap((piece) =>
      Array.isArray((piece as { standards?: unknown }).standards)
        ? ((piece as { standards: unknown[] }).standards.filter(isRecord))
        : [piece])
    return {
      title: isText(job.outline?.title) ? job.outline.title : (isText(first?.unit) ? first!.unit : 'Mastery Map'),
      unit: isText(job.outline?.unit) ? job.outline.unit : 'Unit',
      standards,
    }
  }
  if (!plan.length && ordered.length === 1) return ordered[0]
  return { sections: ordered }
}

/**
 * Which stage comes next, skipping a repair stage with nothing to repair.
 * Repair is scheduled only for the pieces verification actually named.
 */
function nextStageWithWork(
  specId: string,
  stage: StageId,
  verification: Record<string, unknown> | null,
  planningMode: 'single' | 'hierarchical',
): StageId | undefined {
  let candidate = nextStage(specId, stage)
  for (let guard = 0; candidate && guard < 12; guard += 1) {
    // Exactly one planning branch runs. A corpus that fits is planned in one
    // pass; one that does not is surveyed per source and then merged.
    if ((candidate === 'survey' || candidate === 'merge') && planningMode === 'single') {
      candidate = nextStage(specId, candidate)
      continue
    }
    if (candidate === 'outline' && planningMode === 'hierarchical') {
      candidate = nextStage(specId, candidate)
      continue
    }
    if (candidate === 'repair') {
      const problems = isRecord(verification) && Array.isArray(verification.problems) ? verification.problems : []
      const unaccounted = isRecord(verification) && Array.isArray(verification.unaccountedChunkIds) ? verification.unaccountedChunkIds : []
      if (problems.length || unaccounted.length) return candidate
      candidate = nextStage(specId, candidate)
      continue
    }
    return candidate
  }
  return candidate
}

/** The tasks a stage begins with. Fan-out stages read the previous stage's output. */
function tasksForStage(specId: string, stage: StageId, job: JobRow, verification: Record<string, unknown> | null) {
  if (stage === 'survey') {
    // One task per SOURCE — a coherent unit of the student's material, not a
    // fraction of the corpus. An oversized source subdivides at execution.
    const inventory = isRecord(job.inventory) && Array.isArray(job.inventory.files) ? job.inventory.files : []
    return inventory.filter(isRecord).map((file, index) => ({
      taskKey: `source-${index + 1}`,
      ordinal: index,
      label: `Source ${index + 1} of ${inventory.length}`,
      input: { fileId: file.fileId, passageIds: Array.isArray(file.chunkIds) ? file.chunkIds : [] },
    })).filter((entry) => (entry.input.passageIds as string[]).length)
  }
  if (stage === 'audit') {
    // One review per piece, over that piece's own evidence, plus one pass over
    // the assembled claims for cross-section contradictions. A single review of
    // the whole artifact against the whole corpus is the one call that would
    // grow without bound as the material grows.
    const plan = isRecord(job.outline) && Array.isArray(job.outline.sections) ? job.outline.sections as PlannedSection[] : []
    const pieces = plan.length
      ? plan.map((section, index) => ({
          taskKey: `audit::${section.id}`,
          ordinal: index,
          label: `Reviewing ${section.title}`,
          input: { pieceKey: section.id, passageIds: section.passageIds },
        }))
      : [{ taskKey: 'audit::artifact', ordinal: 0, label: 'Independent source review', input: {} }]
    return [...pieces, {
      taskKey: 'audit::consistency',
      ordinal: 9_999,
      label: 'Checking the sections agree',
      input: { consistency: true },
    }]
  }
  if (stage === 'sections') {
    const plan = isRecord(job.outline) && Array.isArray(job.outline.sections) ? job.outline.sections as PlannedSection[] : []
    return plan.map((section, index) => ({
      taskKey: section.id,
      ordinal: index,
      label: section.title,
      input: { ...section, plan: plan.map(({ id, title }) => ({ id, title })) },
    }))
  }
  if (stage === 'repair') {
    const problems = isRecord(verification) && Array.isArray(verification.problems) ? verification.problems : []
    const plan = isRecord(job.outline) && Array.isArray(job.outline.sections) ? job.outline.sections as PlannedSection[] : []
    const unaccounted = isRecord(verification) && Array.isArray(verification.unaccountedChunkIds)
      ? verification.unaccountedChunkIds.filter(isText)
      : []
    // Material the plan never accounted for gets its own repair, grouped by the
    // source it came from so each task is a coherent piece of that source.
    const bySource = new Map<string, string[]>()
    if (unaccounted.length && isRecord(job.inventory) && Array.isArray(job.inventory.files)) {
      for (const file of job.inventory.files.filter(isRecord)) {
        const ids = (Array.isArray(file.chunkIds) ? file.chunkIds.filter(isText) : []).filter((id) => unaccounted.includes(id))
        if (ids.length) bySource.set(String(file.fileId), ids)
      }
    }
    const coverage = [...bySource.entries()].map(([fileId, ids], index) => ({
      taskKey: `coverage::${fileId}`,
      ordinal: 1_000 + index,
      label: 'Covering missed material',
      input: {
        id: `coverage-${index + 1}`,
        title: 'Material not yet covered',
        purpose: 'These passages from the selected material were not represented anywhere in the artifact. Integrate what they teach, or state specifically why they cannot support any part of it.',
        passageIds: ids,
        plan: plan.map(({ id, title }) => ({ id, title })),
        problem: 'no section accounted for these passages',
      },
    }))
    return [...coverage, ...problems.filter(isRecord).map((problem, index) => {
      const key = isText(problem.key) ? problem.key : `piece-${index}`
      const section = plan.find((entry) => entry.id === key)
      return {
        taskKey: key,
        ordinal: plan.findIndex((entry) => entry.id === key),
        label: section?.title ?? 'Flagged piece',
        input: { ...(section ?? { id: key, title: key, purpose: '', passageIds: [] }), plan: plan.map(({ id, title }) => ({ id, title })), problem: isText(problem.problem) ? problem.problem : 'validation failed' },
      }
    })]
  }
  const spec = stageSpec(specId, stage)
  return [{ taskKey: stage, ordinal: 0, label: spec?.label ?? stage, input: {} }]
}

/**
 * Run exactly ONE task, then return.
 *
 * This is the whole contract with the platform: an invocation does a single
 * piece of work well inside its worker's remaining lifetime, persists it, and
 * lets the scheduler bring the next one. Chaining a second task in here would
 * be pretending the worker's clock restarts — it does not.
 */
async function runOneTask(
  client: ReturnType<typeof createClient>,
  service: unknown,
  budget: WorkerBudget,
  scope: { jobId: string; userId: string } | null = null,
): Promise<Response> {
  // The lease never outlives this worker, so a task orphaned by a retirement
  // becomes claimable again instead of wedging the job.
  const leaseSeconds = Math.max(30, Math.ceil(remainingWorkerMs(budget) / 1000) + 15)
  const claimed = await rpc(service, 'claim_generation_task', {
    p_lease_seconds: leaseSeconds,
    p_job_id: scope?.jobId ?? null,
    p_user_id: scope?.userId ?? null,
  })
  if (!isRecord(claimed)) return json({ ran: false, reason: 'no-runnable-task' })

  const task = claimed.task as TaskRow
  // Filled in by sizing, so the completion record measures the request that was
  // actually sent rather than the row as it looked when the task was claimed.
  const sized: { inputChars?: number; outputTokens?: number } = {}
  const job = claimed.job as JobRow
  const payload = taskPayload(job.payload)
  const specId = payload?.specId ?? job.spec_id ?? 'study-guide-v1'
  const started = Date.now()

  const finish = async (outcome: TaskOutcome) => {
    const durationMs = Date.now() - started

    /**
     * A task proven too large is replaced by its parts in one transaction. The
     * oversized task is marked skipped rather than retried, which is what makes
     * "never retry the same oversized task unchanged" structural rather than a
     * convention someone has to remember.
     */
    if (outcome.kind === 'subdivide') {
      const added = await rpc(service, 'subdivide_generation_task', {
        p_task_id: task.id,
        p_lease_token: task.lease_token,
        p_parts: outcome.parts,
      })
      console.error(`generation task subdivided stage=${task.stage} parts=${outcome.parts.length} reason=${outcome.reason} children=${String(added)}`)
      // 0 means the split produced no child task — every proposed key collided
      // with a sibling, because child keys hang off the flattened root. Treating
      // that as success is how a section's material used to leave the build with
      // no error recorded anywhere. It is a failure, and it is loud.
      if (added === null || added === 0) {
        await rpc(service, 'complete_generation_task', {
          p_task_id: task.id,
          p_lease_token: task.lease_token,
          p_status: 'failed',
          p_output: null,
          p_error: jobError('subdivision-made-no-progress', 'This part of the guide could not be divided any further.'),
          p_duration_ms: durationMs,
          p_provider_route: null,
          p_provider_request_id: null,
          p_provider_response_id: null,
          p_backup_reservation_id: null,
          p_clear_backup_reservation: false,
          p_ambiguous: null,
        })
        return { status: 'failed', durationMs }
      }
      return { status: 'subdivided', durationMs }
    }

    // Measured cost of a real provider round trip, folded into this stage's
    // rates so the next sizing decision is made against evidence.
    //
    // A timeout is the most informative measurement a stage produces: it is
    // precisely the case the estimate got wrong. Excluding it left the rates
    // learning only from requests that fit, so they stayed optimistic exactly
    // where they had already failed — a live section estimated at 58.3s ran
    // 75.4s, timed out, and taught the model nothing. An ambiguous timeout did
    // spend that wall clock at the provider, so it counts. Other failures — a
    // rejection, unusable output — measured no generation and still do not.
    const inputChars = sized.inputChars ?? task.input_chars
    const outputTokens = sized.outputTokens ?? task.output_tokens
    const measuredRealWork = outcome.kind !== 'failed' || outcome.ambiguous === true
    if (measuredRealWork && inputChars && outputTokens) {
      await rpc(service, 'record_stage_duration', {
        p_spec_id: specId,
        p_stage: task.stage,
        p_duration_ms: durationMs,
        p_input_chars: inputChars,
        p_output_tokens: outputTokens,
      })
    }

    const status = outcome.kind === 'done' ? 'done' : outcome.kind === 'pending' ? 'pending' : 'failed'
    if (outcome.kind === 'failed' && outcome.oversized) {
      // Mark it, so the next attempt is forced down the subdivision path.
      await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
        .from('study_generation_tasks').update({ oversized: true }).eq('id', task.id)
    }
    if (outcome.kind === 'failed' && task.attempts < task.max_attempts) {
      // A bounded retry should not repeat the same mistake blind. Carry the
      // rejection into the next attempt's input, alongside the artifact's own
      // repair guidance, so the rebuild is told what specifically was wrong.
      await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
        .from('study_generation_tasks')
        .update({ input: { ...task.input, problem: outcome.error.message } })
        .eq('id', task.id)
    }
    await rpc(service, 'complete_generation_task', {
      p_task_id: task.id,
      p_lease_token: task.lease_token,
      p_status: status,
      p_output: outcome.kind === 'failed' ? null : outcome.output ?? null,
      p_error: outcome.kind === 'failed' ? outcome.error : null,
      p_duration_ms: durationMs,
      p_provider_route: outcome.kind === 'failed' ? null : outcome.providerRoute ?? null,
      p_provider_request_id: outcome.providerRequestId ?? null,
      p_provider_response_id: outcome.kind === 'failed' ? null : outcome.providerResponseId ?? null,
      p_backup_reservation_id: outcome.kind === 'failed' ? null : outcome.backupReservationId ?? null,
      p_clear_backup_reservation: outcome.kind === 'done' && outcome.clearBackupReservation === true,
      p_ambiguous: outcome.kind === 'failed' ? outcome.ambiguous === true : null,
    })
    return { status, durationMs }
  }

  if (!payload) {
    await finish({ kind: 'failed', error: jobError('invalid-request', 'This build’s request could not be read. Nothing was saved.') })
    return json({ ran: true, task: task.stage, status: 'failed' })
  }

  const spec = stageSpec(payload.specId, task.stage)
  if (!spec) {
    await finish({ kind: 'failed', error: jobError('invalid-request', 'This build named a stage that does not exist for its artifact.') })
    return json({ ran: true, task: task.stage, status: 'failed' })
  }

  // A provider stage that cannot finish inside this worker's remaining budget is
  // handed back untouched rather than started and lost.
  if (spec.provider !== 'none' && !canRunStep(budget, Math.min(spec.maxProviderMs, 30_000))) {
    await rpc(service, 'complete_generation_task', {
      p_task_id: task.id, p_lease_token: task.lease_token, p_status: 'pending',
    })
    return json({ ran: false, reason: 'insufficient-worker-budget' })
  }

  const allTasks = await readJobTasks(service, job.id)
  let outcome: TaskOutcome
  try {
    switch (task.stage) {
      case 'inventory': outcome = await execInventory(service, client, job, payload, budget); break
      case 'survey': outcome = await execSurvey(service, client, job, payload, task, spec, budget, sized); break
      case 'merge': outcome = await execMerge(service, client, job, payload, task, spec, budget, allTasks, sized); break
      case 'outline': outcome = await execOutline(service, client, job, payload, task, spec, budget, sized); break
      case 'sections':
      case 'repair': outcome = await execSection(service, client, job, payload, task, spec, budget, sized); break
      case 'draft': outcome = payload.specId === 'unit-question-bank-v1'
        ? { kind: 'failed', error: jobError('invalid-request', 'Question banks are generated through their own Claude route.') }
        : await execDraft(service, client, job, payload, task, spec, budget, sized); break
      case 'verify': outcome = await execVerify(service, client, job, payload, allTasks); break
      case 'audit': outcome = await execAudit(client, job, payload, allTasks, spec, budget, task); break
      case 'assemble': outcome = { kind: 'done' }; break
      default: outcome = { kind: 'failed', error: jobError('invalid-request', 'Unknown generation stage.') }
    }
  } catch (error) {
    console.error('generation task failed', task.stage, error instanceof Error ? error.message : 'unknown')
    outcome = { kind: 'failed', error: astraFailure(error) }
  }

  const finished = await finish(outcome)
  if (finished.status === 'done') await advanceStage(service, job, payload, task)
  return json({ ran: true, task: task.stage, status: finished.status, durationMs: finished.durationMs })
}

async function readJobTasks(service: unknown, jobId: string): Promise<TaskRow[]> {
  const { data } = await (service as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { order: (column: string, options: Record<string, unknown>) => PromiseLike<{ data: unknown }> } } } })
    .from('study_generation_tasks').select('*').eq('job_id', jobId).order('ordinal', { ascending: true })
  return Array.isArray(data) ? data as TaskRow[] : []
}

/**
 * Persist the completed stage, seed the successor, THEN move the pointer.
 *
 * That order is what makes a crash between stages recoverable: a job restarts
 * at the last completed stage with its successor's work already described, and
 * never resumes in the middle of a stage it only half-scheduled.
 */
async function advanceStage(service: unknown, job: JobRow, payload: JobPayload, task: TaskRow) {
  const tasks = await readJobTasks(service, job.id)
  const open = tasks.filter((entry) => entry.stage === task.stage && !['done', 'skipped'].includes(entry.status))
  if (open.length) return

  const { data: fresh } = await (service as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { maybeSingle: () => PromiseLike<{ data: unknown }> } } } })
    .from('study_generation_jobs').select('*').eq('id', job.id).maybeSingle()
  const current = (isRecord(fresh) ? fresh : job) as JobRow
  const verification = isRecord(current.verification) ? current.verification : null

  const planningMode = isRecord(current.inventory) && current.inventory.planningMode === 'hierarchical' ? 'hierarchical' as const : 'single' as const
  const upcoming = nextStageWithWork(payload.specId, task.stage, verification, planningMode)
  if (!upcoming) {
    const artifact = assembleArtifact(payload, current, tasks)
    const auditTasks = tasks.filter((entry) => entry.stage === 'audit' && entry.status === 'done')
    const statuses = auditTasks.map((entry) => (isRecord(entry.output) && isText(entry.output.auditStatus) ? entry.output.auditStatus : 'skipped'))
    // The weakest review wins: one unreachable reviewer means the artifact was
    // not fully reviewed, and saying "approved" would overstate it.
    const auditStatus = !statuses.length ? 'skipped'
      : statuses.includes('unavailable') ? 'unavailable'
      : statuses.every((status) => status === 'approved') ? 'approved'
      : 'skipped'
    // The citation set verification already closed against the real corpus.
    const citations = isRecord(verification) && Array.isArray(verification.closed) ? verification.closed : []
    if (!citations.length) {
      await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
        .from('study_generation_jobs').update({
          status: 'failed', stage: 'done', phase: 'Stopped',
          error: jobError('citation-not-carried', 'No claim in the finished work could be traced to your material. Nothing was saved, and any entry you already had is unchanged.'),
        }).eq('id', job.id)
      return
    }
    await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
      .from('study_generation_jobs').update({
        status: 'succeeded', stage: 'done', phase: 'Finished', progress: 1,
        result: { artifact, citations, auditStatus, primaryProvider: 'openai' },
      }).eq('id', job.id)
    return
  }

  const seed = tasksForStage(payload.specId, upcoming, current, verification)
  if (seed.length) await rpc(service, 'add_generation_tasks', { p_job_id: job.id, p_stage: upcoming, p_tasks: seed })
  const spec = stageSpec(payload.specId, upcoming)
  await (service as { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => PromiseLike<unknown> } } })
    .from('study_generation_jobs').update({ phase: spec?.label ?? upcoming }).eq('id', job.id)
  await rpc(service, 'advance_generation_stage', {
    p_job_id: job.id,
    p_next_stage: upcoming,
    p_progress: pipelineProgress(payload.specId, upcoming, 0, seed.length),
  })
}

/**
 * Prove what the provider route can actually do, against this deployment.
 *
 * Background mode is only useful if a submitted response can be READ BACK, so
 * both halves are exercised for real: a tiny request is submitted with
 * `background: true`, and the recorded capability is set only when its result
 * is subsequently retrieved. Documentation and test doubles do not qualify;
 * until this probe passes, the engine runs every stage synchronously, which its
 * task shapes already keep small enough.
 */
async function probeBackgroundCapability(service: unknown, budget: WorkerBudget): Promise<Response> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return failure(503, 'server-unconfigured', 'No provider credential is configured.')
  const route = activeRoute()
  const detail: Record<string, unknown> = { route }
  let submit = false
  let retrieve = false
  let responseId: string | null = null

  const probe = {
    model: 'gpt-6-astra', store: false, background: true, max_output_tokens: 16,
    reasoning: { effort: 'low' },
    input: [{ role: 'user', content: [{ type: 'input_text', text: 'Reply with the single word OK.' }] }],
  }

  try {
    const submitted = await withDeadline('probe-submit', stepDeadlineMs(budget, 30_000), (signal) =>
      submitAstraBackgroundResponse(probe, astraRouteConfig(key, signal), fetch))
    const text = await submitted.response.text()
    const parsed = ((): unknown => { try { return JSON.parse(text) } catch { return null } })()
    detail.submitStatus = submitted.response.status
    detail.requestId = providerRequestId(submitted.response) ?? null
    if (submitted.response.ok && isRecord(parsed) && isText(parsed.id)) {
      submit = true
      responseId = parsed.id
      detail.status = parsed.status ?? null
    } else {
      detail.reason = await isBackgroundParameterRejection(new Response(text, { status: submitted.response.status }))
        ? 'route-does-not-implement-background'
        : 'submit-rejected'
    }
  } catch (error) {
    detail.reason = error instanceof StepTimeoutError ? 'submit-timeout' : 'submit-failed'
  }

  if (submit && responseId) {
    const until = Date.now() + Math.min(45_000, remainingWorkerMs(budget) - 5_000)
    while (Date.now() < until) {
      try {
        const read = await withDeadline('probe-retrieve', 15_000, (signal) =>
          getAstraResponse(responseId!, route, astraRouteConfig(key, signal), fetch))
        const body = await read.json().catch(() => null)
        detail.retrieveStatus = read.status
        if (read.ok && isRecord(body)) {
          // Retrieval is proven by reading the record back at all; a terminal
          // status additionally proves the work completed asynchronously.
          retrieve = true
          detail.retrievedStatus = body.status ?? null
          if (body.status !== 'queued' && body.status !== 'in_progress') break
        } else {
          detail.reason = 'retrieve-rejected'
          break
        }
      } catch {
        detail.reason = 'retrieve-failed'
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
  }

  await (service as { from: (table: string) => { upsert: (values: Record<string, unknown>, options: Record<string, unknown>) => PromiseLike<unknown> } })
    .from('generation_provider_capabilities').upsert({
      route, background_submit: submit, background_retrieve: retrieve,
      checked_at: new Date().toISOString(), detail,
    }, { onConflict: 'route' })

  return json({ route, backgroundSubmit: submit, backgroundRetrieve: retrieve, usable: submit && retrieve, detail })
}

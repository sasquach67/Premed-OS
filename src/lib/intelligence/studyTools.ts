import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { workspaceScopedKey } from '@/lib/demoMode'

export type StudyCitation =
  | {
      kind: 'material'
      fileId: string
      chunkId: string
      start: number
      end: number
      title?: string
    }
  | { kind: 'general' }

export interface GapCheckItem {
  text: string
  citation: StudyCitation
}

export interface GapCheckResult {
  covered: GapCheckItem[]
  missed: GapCheckItem[]
  wrong: GapCheckItem[]
  suggestedGrade: 'again' | 'hard' | 'good' | 'easy'
}

export interface GapCheckRequest {
  action: 'gap-check'
  courseId: string
  topicId: string
  /** Kept for older deployed functions. New callers use `evidence` so the
   * server can distinguish typed recall from a reviewed transcript. */
  response?: string
  evidence: {
    text?: string
    audioTranscript?: string
    image?: StudyImageEvidence
  }
  /** The edge function resolves these IDs from the signed-in user's private
   * server mirror. Source content is never trusted from a generation call. */
  chunkIds: string[]
  /** Generation Phase 1 — the client-assembled spec. Optional so a function
   *  that has not been redeployed keeps working on its own fallback prompt.
   *  `specHash` is stamped so "did this change because the prompt changed, or
   *  because the model moved" stays answerable. */
  specId?: string
  specHash?: string
  systemPrompt?: string
}

export interface StudyImageEvidence {
  name: string
  mimeType: string
  size: number
  dataBase64: string
}

export interface TranscribeResponseRequest {
  action: 'transcribe-response'
  courseId: string
  topicId: string
  audio: {
    name: string
    mimeType: string
    size: number
    dataBase64: string
  }
}

export interface StudySourceInput {
  chunkId: string
  fileId: string
  content: string
  start: number
  end: number
}

/** A temporary, student-selected image derivative sent only to Claude during
 * Question Bank generation. It is not persisted in the server source mirror. */
export interface StudySourceImageInput {
  fileId: string
  title: string
  mimeType: string
  size: number
  dataBase64: string
}

/**
 * Generation Phase 2 — the primary-plus-audit request. The client assembles
 * the spec; the function routes the named artifact to its configured author,
 * verifies cited chunks and ranges against the source mirror it owns, and has
 * the other provider audit the closed result without rewriting it.
 *
 * ⚠️ There is no `sources` field. The function retrieves chunk text itself, so
 * source content is never uploaded on a generation call.
 */
export interface GenerateRequest {
  action: 'generate'
  courseId: string
  topicId: string
  chunkIds: string[]
  specId: string
  specHash: string
  systemPrompt: string
  /** L6 — this topic, this scope, this action. */
  request: string
  /** Artifact-specific correction guidance for the server's one bounded
   *  rebuild after a citation rejection. Assembled by the caller because only
   *  it knows the artifact's own shape requirements. */
  repairGuidance?: string
  /** Question Bank only: bounded selected image pages for Claude vision. */
  visualSources?: StudySourceImageInput[]
  /** Question Bank only: require official public assessment-pattern research. */
  webPatternResearch?: boolean
}

/** A compact, student-reviewed term snapshot. Unlike material generation, its
 * local record evidence is intentionally sent only after the disclosure step. */
export interface TermReportRequest {
  action: 'term-report'
  term: string
  evidence: Array<{ id: string; label: string; content: string }>
  specId: string
  specHash: string
  systemPrompt: string
}

export interface SyncStudySourcesRequest {
  action: 'sync-sources'
  courseId: string
  topicId: string
  sources: StudySourceInput[]
  /** Question banks use a larger exact-ID corpus and skip OpenAI embeddings. */
  purpose?: 'unit-question-bank'
}

export interface DeleteStudySourcesRequest {
  action: 'delete-sources'
}

/** Durable generation — start, advance, and read one persisted build. */
export interface StartGenerationRequest extends Omit<GenerateRequest, 'action'> {
  action: 'generate-start'
}
export interface GenerationStepRequest {
  action: 'generate-step' | 'generate-status'
  jobId: string
}

export type GenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface GenerationJobError {
  code: string
  message: string
  /** Upstream HTTP status, when the failure had one. Never a response body. */
  providerStatus?: number
  /** Provider correlation id, safe to quote in a support note. */
  requestId?: string
  issues?: string[]
}

export interface GenerationJobView {
  jobId: string
  status: GenerationJobStatus
  step: string
  phase: string
  providerAttempts: number
  pollCount: number
  updatedAt: string
  /** How long to wait before advancing the job again. */
  retryAfterMs?: number
  /** Another runner already holds this job's step. */
  busy?: boolean
  /** This start joined an existing build instead of creating a second one. */
  rejoined?: boolean
  result?: GeneratedStudyToolArtifact
  error?: GenerationJobError
}

export type StudyToolFailureCode =
  | 'unconfigured'
  | 'sign-in-required'
  | 'rate-limited'
  | 'hourly-limit'
  | 'daily-limit'
  | 'weekly-budget-limit'
  | 'request-too-large'
  | 'anthropic-credit-exhausted'
  | 'no-sources'
  | 'invalid-response'
  /** The generated artifact introduced a citation that was never verified, so
   *  the server refused it. This is a real outcome, not an outage, and it
   *  is kept distinct so the student is not told to try again later when
  *  trying again is exactly right. */
  | 'citation-not-carried'
  | 'audit-rejected'
  | 'unavailable'

export type GenerationAuditStatus = 'approved' | 'skipped' | 'unavailable'

export interface GeneratedStudyToolArtifact {
  artifact: unknown
  citations: unknown[]
  auditStatus: GenerationAuditStatus
  primaryProvider?: 'anthropic' | 'openai'
  visualSourceFileIds?: string[]
  webSearchRequests?: number
}

export type StudyToolResponse<T> =
  | { ok: true; data: T }
  | { ok: false; code: StudyToolFailureCode; message: string }

interface FunctionClient {
  auth: SupabaseClient['auth']
  functions: SupabaseClient['functions']
}

export function isGapCheckResult(value: unknown): value is GapCheckResult {
  if (!isRecord(value) || !isGrade(value.suggestedGrade)) return false
  return ['covered', 'missed', 'wrong'].every((key) => {
    const items = value[key]
    return Array.isArray(items) && items.every(isGapCheckItem)
  })
}

async function readFunctionErrorBody(context: (Response & { body?: unknown }) | undefined) {
  let responseBody = context?.body
  if (typeof context?.clone === 'function') {
    try { responseBody = await context.clone().json() } catch { /* keep the client fallback */ }
  }
  return responseBody
}

function formatQuotaReset(resetAt: unknown) {
  if (typeof resetAt !== 'string') return ''
  const date = new Date(resetAt)
  if (Number.isNaN(date.getTime())) return ''
  return ` It resets ${date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.`
}

/** How long the driver keeps advancing one build before handing it back as
 *  still-running. The job itself is not cancelled by this. */
const DEFAULT_DURABLE_WAIT_MS = 12 * 60 * 1000
/** A second bound, on calls rather than time. A step that keeps handing the job
 *  back without advancing it — a worker with nothing left to give, over and
 *  over — must not become a tight request loop. */
const MAX_DURABLE_STEPS = 400
const GENERATION_JOB_PREFIX = 'premed-os:ai-generation-job:v1'

export interface DurableGenerationOptions {
  /** Stable per-build key. Its stored job id is what a refreshed page resumes. */
  resumeKey?: string
  onProgress?: (job: GenerationJobView) => void
  signal?: AbortSignal
  maxWaitMs?: number
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

/** Where a build's id is remembered between page loads. */
export function generationJobStore(resumeKey: string) {
  const key = `${workspaceScopedKey(GENERATION_JOB_PREFIX)}:${resumeKey}`
  return {
    read(): string | null {
      if (typeof localStorage === 'undefined') return null
      const value = localStorage.getItem(key)
      return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null
    },
    write(jobId: string) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, jobId)
    },
    clear() {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
    },
  }
}

export function isGenerationJobView(value: unknown): value is GenerationJobView {
  return isRecord(value)
    && typeof value.jobId === 'string'
    && ['queued', 'running', 'succeeded', 'failed'].includes(String(value.status))
    && typeof value.step === 'string'
    && typeof value.phase === 'string'
}

function isGeneratedArtifact(value: unknown): value is GeneratedStudyToolArtifact {
  return isRecord(value) && 'artifact' in value && Array.isArray(value.citations)
    && ['approved', 'skipped', 'unavailable'].includes(String(value.auditStatus))
}

/**
 * A failed job carries the server's own reason. Mapping it back to a specific
 * code is the point of the whole change: "AI study tools are unavailable" hid
 * a timeout, a refused artifact, and a spent allowance behind one sentence.
 */
export function generationJobFailure(error: GenerationJobError | undefined): StudyToolResponse<never> {
  const code = String(error?.code ?? '')
  const detail = [
    error?.providerStatus ? `Provider status ${error.providerStatus}.` : '',
    error?.requestId ? `Request ${error.requestId}.` : '',
  ].filter(Boolean).join(' ')
  const withDetail = (message: string) => (detail ? `${message} ${detail}` : message)
  const message = error?.message?.trim()

  if (code === 'citation-not-carried' || code === 'no-verified-citations' || code === 'provider-attempts-exhausted') {
    return { ok: false, code: 'citation-not-carried', message: withDetail(message || 'The generated guide cited something that could not be traced back to your material, so it was refused rather than corrected. Nothing was saved.') }
  }
  if (code === 'audit-rejected') {
    const issues = (error?.issues ?? []).filter((issue): issue is string => typeof issue === 'string' && Boolean(issue.trim())).slice(0, 3)
    return { ok: false, code: 'audit-rejected', message: `${message || 'The independent provider review found a source or format problem. Nothing was saved.'}${issues.length ? ` Review note: ${issues.join('; ')}` : ''}` }
  }
  if (code === 'no-sources' || code === 'source-sync-incomplete' || code === 'source-read-failed') {
    return { ok: false, code: 'no-sources', message: message || 'Some selected material is missing from the server copy. Restore the complete selection before generating.' }
  }
  if (code === 'invalid-response' || code === 'openai-invalid-json' || code === 'openai-empty-output') {
    return { ok: false, code: 'invalid-response', message: withDetail(message || 'The generator returned an invalid result. Nothing was saved.') }
  }
  if (['hourly-limit', 'daily-limit', 'weekly-budget-limit'].includes(code)) {
    return { ok: false, code: code as StudyToolFailureCode, message: message || 'AI usage limit reached. Try again later.' }
  }
  return { ok: false, code: 'unavailable', message: withDetail(message || 'The AI provider could not complete this build. Your local data was not changed.') }
}

export function createStudyToolsClient(
  client: FunctionClient | null = supabase,
  /** Pacing seam. Production uses real timers; tests pass an instant sleep so a
   *  multi-step build does not spend its polling interval in the suite. */
  defaults: Pick<DurableGenerationOptions, 'sleep' | 'now'> = {},
) {
  async function invoke<T>(request: GapCheckRequest | TranscribeResponseRequest | GenerateRequest | StartGenerationRequest | GenerationStepRequest | TermReportRequest | SyncStudySourcesRequest | DeleteStudySourcesRequest): Promise<StudyToolResponse<T>> {
    if (!client) {
      return { ok: false, code: 'unconfigured', message: 'AI study tools are not configured. Local study workflows remain available.' }
    }
    const { data: sessionData } = await client.auth.getSession()
    if (!sessionData.session) {
      return { ok: false, code: 'sign-in-required', message: 'Sign in to use server-side AI study tools.' }
    }
    const { data, error } = await client.functions.invoke('study-tools', { body: request })
    if (error) {
      const context = (error as { context?: Response & { body?: unknown } }).context
      const status = context?.status
      if (status === 429) {
        const responseBody = await readFunctionErrorBody(context)
        const serverError = isRecord(responseBody) && isRecord(responseBody.error) ? responseBody.error : undefined
        const serverCode = serverError?.code
        const reset = formatQuotaReset(serverError?.resetAt)
        if (serverCode === 'hourly-limit') {
          return { ok: false, code: 'hourly-limit', message: `Your hourly AI limit has been reached.${reset}` }
        }
        if (serverCode === 'daily-limit') {
          return { ok: false, code: 'daily-limit', message: `Your daily AI limit has been reached.${reset}` }
        }
        if (serverCode === 'weekly-budget-limit') {
          return { ok: false, code: 'weekly-budget-limit', message: `The shared beta AI budget has been used for this week.${reset}` }
        }
        return { ok: false, code: 'rate-limited', message: 'AI usage limit reached. Try again later.' }
      }
      if (status === 402) return { ok: false, code: 'anthropic-credit-exhausted', message: 'Anthropic credits are exhausted. Add credits before generating another question bank.' }
      if (status === 413) return { ok: false, code: 'request-too-large', message: 'This request is too large for one study-tool action.' }
      if (status === 422) {
        const responseBody = await readFunctionErrorBody(context)
        const serverError = isRecord(responseBody) && isRecord(responseBody.error) ? responseBody.error : undefined
        if (serverError?.code === 'no-sources' || serverError?.code === 'source-sync-incomplete') {
          return { ok: false, code: 'no-sources', message: serverError.code === 'source-sync-incomplete'
            ? 'Some selected material is missing from the server copy. Restore the complete selection before generating.'
            : 'No synced source material is available for this topic.' }
        }
        if (serverError?.code === 'no-verified-citations') {
          return { ok: false, code: 'citation-not-carried', message: 'The generated artifact did not include any verifiable source citations. Rebuild it with source references from the supplied material. Nothing was saved.' }
        }
        return { ok: false, code: 'invalid-response', message: 'The server could not validate this study-tool result. Nothing was saved.' }
      }
      // A 502 carries the server's own reason. Collapsing it into "unavailable"
      // would tell the student the service is down when in fact it refused a
      // specific artifact and would accept another attempt immediately.
      if (status === 502) {
        const responseBody = await readFunctionErrorBody(context)
        const serverCode = isRecord(responseBody)
          ? (isRecord(responseBody.error) ? responseBody.error.code : responseBody.code)
          : undefined
        if (serverCode === 'citation-not-carried') {
          const issues = isRecord(responseBody) && isRecord(responseBody.error) && Array.isArray(responseBody.error.issues)
            ? responseBody.error.issues.filter((issue): issue is string => typeof issue === 'string').slice(0, 5)
            : []
          return {
            ok: false,
            code: 'citation-not-carried',
            message: 'The generated guide cited something that could not be traced back to your material, '
              + 'so it was refused rather than corrected. Nothing was saved.'
              + (issues.length ? ` Reference check: ${issues.join('; ')}` : ''),
          }
        }
        if (serverCode === 'audit-rejected') {
          const rawIssues = isRecord(responseBody) && isRecord(responseBody.error)
            ? responseBody.error.issues
            : undefined
          const reviewIssues = Array.isArray(rawIssues)
            ? rawIssues.filter((issue): issue is string => typeof issue === 'string' && Boolean(issue.trim())).slice(0, 3).map(issue => issue.slice(0, 500))
            : []
          return {
            ok: false,
            code: 'audit-rejected',
            message: 'The independent provider review found a source or format problem. Nothing was saved.'
              + (reviewIssues.length ? ` Review note: ${reviewIssues.join('; ')}` : ''),
          }
        }
        if (serverCode === 'web-search-not-used') {
          return {
            ok: false,
            code: 'invalid-response',
            message: 'Claude did not complete the required official assessment-pattern search. Nothing was saved.',
          }
        }
        return { ok: false, code: 'invalid-response', message: 'The generator returned an invalid result. Nothing was saved.' }
      }
      if (status === 503) {
        const responseBody = await readFunctionErrorBody(context)
        const errorDetail = isRecord(responseBody) && isRecord(responseBody.error) ? responseBody.error : undefined
        const knownCodes = new Set([
          'wallet-unavailable', 'backup-budget-limit',
          'openai-invalid-response', 'openai-quota-exhausted', 'openai-rate-limited',
          'openai-access-denied', 'openai-context-limit', 'openai-request-rejected',
          'openai-output-limit', 'openai-incomplete', 'openai-response-failed',
          'openai-refused', 'openai-empty-output', 'openai-invalid-json',
        ])
        if (knownCodes.has(String(errorDetail?.code)) && typeof errorDetail?.message === 'string') {
          return { ok: false, code: 'unavailable', message: errorDetail.message }
        }
      }
      return { ok: false, code: 'unavailable', message: 'AI study tools are unavailable. Your local data was not changed.' }
    }
    return { ok: true, data: data as T }
  }

  return {
    async syncSources(request: SyncStudySourcesRequest): Promise<StudyToolResponse<{ synced: number }>> {
      const result = await invoke<{ synced: number }>(request)
      if (!result.ok) return result
      if (!isRecord(result.data) || !Number.isInteger(result.data.synced) || Number(result.data.synced) < 0) {
        return { ok: false, code: 'invalid-response', message: 'The source sync returned an invalid response.' }
      }
      return { ok: true, data: { synced: Number(result.data.synced) } }
    },

    async gapCheck(request: GapCheckRequest): Promise<StudyToolResponse<GapCheckResult>> {
      const result = await invoke<unknown>(request)
      if (!result.ok) return result
      if (!isGapCheckResult(result.data)) {
        return { ok: false, code: 'invalid-response', message: 'The gap-check returned an invalid result. Nothing was saved.' }
      }
      return { ok: true, data: result.data }
    },

    async transcribeResponse(request: TranscribeResponseRequest): Promise<StudyToolResponse<{ transcript: string }>> {
      const result = await invoke<{ transcript: string }>(request)
      if (!result.ok) return result
      if (!isRecord(result.data) || typeof result.data.transcript !== 'string' || !result.data.transcript.trim()) {
        return { ok: false, code: 'invalid-response', message: 'The transcription returned an invalid response. Nothing was saved.' }
      }
      return { ok: true, data: { transcript: result.data.transcript } }
    },

    /**
     * Returns the structured artifact and the citation set it was allowed to
     * use. A rejection here is a real outcome, not a transport error: the
     * function refuses an artifact that minted a citation,
     * and nothing is saved.
     */
    async generate(request: GenerateRequest): Promise<StudyToolResponse<GeneratedStudyToolArtifact>> {
      const result = await invoke<GeneratedStudyToolArtifact>(request)
      if (!result.ok) return result
      if (!isRecord(result.data) || !('artifact' in result.data)
        || !Array.isArray(result.data.citations)
        || !['approved', 'skipped', 'unavailable'].includes(String(result.data.auditStatus))
        || (result.data.primaryProvider != null && !['anthropic', 'openai'].includes(String(result.data.primaryProvider)))
        || (result.data.visualSourceFileIds != null && (!Array.isArray(result.data.visualSourceFileIds) || !result.data.visualSourceFileIds.every((id) => typeof id === 'string')))
        || (result.data.webSearchRequests != null && (!Number.isInteger(result.data.webSearchRequests) || Number(result.data.webSearchRequests) < 0))) {
        return { ok: false, code: 'invalid-response', message: 'The generator returned an invalid result. Nothing was saved.' }
      }
      return { ok: true, data: result.data as unknown as GeneratedStudyToolArtifact }
    },

    /**
     * Durable generation — the transport that survives the platform.
     *
     * A Supabase Edge worker has a wall-clock lifetime it will be killed at,
     * and that clock belongs to the worker rather than to your request. A
     * multi-minute build held open on one invocation is therefore lost with
     * nothing recorded, which is the failure this replaces. Instead the server
     * records the job and returns its id in about a second, and this driver
     * advances it one short, bounded step at a time.
     *
     * Nothing here lengthens a browser timeout: every HTTP call it makes is
     * short. The waiting happens between calls, against a job that is already
     * saved, so closing or refreshing the page pauses the build rather than
     * destroying it.
     */
    async startGeneration(request: GenerateRequest): Promise<StudyToolResponse<GenerationJobView>> {
      const { action: _action, visualSources: _visuals, webPatternResearch: _research, ...rest } = request
      const result = await invoke<GenerationJobView>({ action: 'generate-start', ...rest })
      if (!result.ok) return result
      return isGenerationJobView(result.data)
        ? { ok: true, data: result.data }
        : { ok: false, code: 'invalid-response', message: 'The server did not return a build to track. Nothing was saved.' }
    },

    async stepGeneration(jobId: string): Promise<StudyToolResponse<GenerationJobView>> {
      const result = await invoke<GenerationJobView>({ action: 'generate-step', jobId })
      if (!result.ok) return result
      return isGenerationJobView(result.data)
        ? { ok: true, data: result.data }
        : { ok: false, code: 'invalid-response', message: 'The server returned an unreadable build status.' }
    },

    async generationStatus(jobId: string): Promise<StudyToolResponse<GenerationJobView>> {
      const result = await invoke<GenerationJobView>({ action: 'generate-status', jobId })
      if (!result.ok) return result
      return isGenerationJobView(result.data)
        ? { ok: true, data: result.data }
        : { ok: false, code: 'invalid-response', message: 'The server returned an unreadable build status.' }
    },

    /**
     * Run one build to completion across as many bounded steps as it needs.
     *
     * `resumeKey` is what makes a refresh survivable: the job id is written
     * before the first step and cleared only on a terminal outcome, so a
     * reopened page rejoins the same build instead of paying for a second one.
     */
    async generateDurable(
      request: GenerateRequest,
      options: DurableGenerationOptions = {},
    ): Promise<StudyToolResponse<GeneratedStudyToolArtifact>> {
      const sleep = options.sleep ?? defaults.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
      const now = options.now ?? defaults.now ?? (() => Date.now())
      const deadline = now() + (options.maxWaitMs ?? DEFAULT_DURABLE_WAIT_MS)
      const store = options.resumeKey ? generationJobStore(options.resumeKey) : null

      let steps = 0
      let job: GenerationJobView | null = null
      const resumed = store?.read()
      if (resumed) {
        const status = await this.generationStatus(resumed)
        if (status.ok) job = status.data
        else if (status.code !== 'unavailable') store?.clear()
      }
      if (!job) {
        const started = await this.startGeneration(request)
        if (!started.ok) return started
        job = started.data
        store?.write(job.jobId)
      }
      options.onProgress?.(job)

      while (now() < deadline && steps < MAX_DURABLE_STEPS) {
        if (options.signal?.aborted) {
          // The job stays saved and resumable; only this driver stops.
          return { ok: false, code: 'unavailable', message: 'This build was left running. Reopen the entry to pick it up.' }
        }
        if (job.status === 'succeeded') {
          store?.clear()
          return isGeneratedArtifact(job.result)
            ? { ok: true, data: job.result }
            : { ok: false, code: 'invalid-response', message: 'The generator returned an invalid result. Nothing was saved.' }
        }
        if (job.status === 'failed') {
          store?.clear()
          return generationJobFailure(job.error)
        }
        const wait = Math.max(500, Math.min(job.retryAfterMs ?? 1_500, 15_000))
        await sleep(wait)
        steps += 1
        const stepped = await this.stepGeneration(job.jobId)
        if (!stepped.ok) {
          // A transport hiccup must not discard a job the server is still
          // running. Re-read it; a genuinely missing job ends the build.
          const status = await this.generationStatus(job.jobId)
          if (!status.ok) { store?.clear(); return stepped }
          job = status.data
        } else {
          job = stepped.data
        }
        options.onProgress?.(job)
      }
      // Out of client patience, not out of job: the build stays resumable.
      return { ok: false, code: 'unavailable', message: 'This build is taking longer than expected and is still running. Reopen the entry to pick it up; nothing saved was changed.' }
    },

    async termReport(request: TermReportRequest): Promise<StudyToolResponse<GeneratedStudyToolArtifact>> {
      const result = await invoke<GeneratedStudyToolArtifact>(request)
      if (!result.ok) return result
      if (!isRecord(result.data) || !('artifact' in result.data)
        || !Array.isArray(result.data.citations)
        || !['approved', 'skipped', 'unavailable'].includes(String(result.data.auditStatus))) {
        return { ok: false, code: 'invalid-response', message: 'The Term Report generator returned an invalid result. Nothing was saved.' }
      }
      return { ok: true, data: result.data as unknown as GeneratedStudyToolArtifact }
    },

    async deleteSources(): Promise<StudyToolResponse<{ deleted: true }>> {
      const result = await invoke<{ deleted: true }>({ action: 'delete-sources' })
      if (!result.ok) return result
      if (!isRecord(result.data) || result.data.deleted !== true) {
        return { ok: false, code: 'invalid-response', message: 'The source deletion returned an invalid response.' }
      }
      return { ok: true, data: { deleted: true } }
    },
  }
}

export const studyTools = createStudyToolsClient()

const DISCLOSURE_KEY = 'premed-os:ai-study-source-disclosure:v1'
const SOURCE_SYNC_PREFIX = 'premed-os:ai-study-source-sync:v1:'

export function hasAcceptedStudySourceDisclosure() {
  return typeof localStorage !== 'undefined' && localStorage.getItem(workspaceScopedKey(DISCLOSURE_KEY)) === 'accepted'
}

export function acceptStudySourceDisclosure() {
  if (typeof localStorage !== 'undefined') localStorage.setItem(workspaceScopedKey(DISCLOSURE_KEY), 'accepted')
}

export function studySourceSyncKey(courseId: string, topicId: string) {
  return `${workspaceScopedKey(SOURCE_SYNC_PREFIX)}:${encodeURIComponent(courseId)}:${encodeURIComponent(topicId)}`
}

export function studySourceFingerprint(sources: StudySourceInput[]) {
  let hash = 0x811c9dc5
  for (const source of sources) {
    const value = `${source.chunkId}\u0000${source.fileId}\u0000${source.start}\u0000${source.end}\u0000${source.content}`
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 0x01000193)
    }
  }
  return `${sources.length}:${(hash >>> 0).toString(16)}`
}

export function clearStudySourceSyncCache() {
  if (typeof localStorage === 'undefined') return
  const prefix = workspaceScopedKey(SOURCE_SYNC_PREFIX)
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(prefix)) localStorage.removeItem(key)
  }
}

function isGapCheckItem(value: unknown): value is GapCheckItem {
  if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim()) return false
  const citation = value.citation
  if (!isRecord(citation) || (citation.kind !== 'material' && citation.kind !== 'general')) return false
  if (citation.kind === 'general') return true
  return typeof citation.fileId === 'string'
    && typeof citation.chunkId === 'string'
    && Number.isInteger(citation.start)
    && Number.isInteger(citation.end)
    && Number(citation.start) >= 0
    && Number(citation.end) > Number(citation.start)
}

function isGrade(value: unknown): value is GapCheckResult['suggestedGrade'] {
  return value === 'again' || value === 'hard' || value === 'good' || value === 'easy'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

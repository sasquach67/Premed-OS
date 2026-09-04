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
}

export interface DeleteStudySourcesRequest {
  action: 'delete-sources'
}

export type StudyToolFailureCode =
  | 'unconfigured'
  | 'sign-in-required'
  | 'rate-limited'
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

export function createStudyToolsClient(client: FunctionClient | null = supabase) {
  async function invoke<T>(request: GapCheckRequest | TranscribeResponseRequest | GenerateRequest | TermReportRequest | SyncStudySourcesRequest | DeleteStudySourcesRequest): Promise<StudyToolResponse<T>> {
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
      if (status === 429) return { ok: false, code: 'rate-limited', message: 'AI usage limit reached. Try again later.' }
      if (status === 402) return { ok: false, code: 'anthropic-credit-exhausted', message: 'Anthropic credits are exhausted. Add credits before generating another question bank.' }
      if (status === 413) return { ok: false, code: 'request-too-large', message: 'This request is too large for one study-tool action.' }
      if (status === 422) return { ok: false, code: 'no-sources', message: 'No synced source material is available for this topic.' }
      // A 502 carries the server's own reason. Collapsing it into "unavailable"
      // would tell the student the service is down when in fact it refused a
      // specific artifact and would accept another attempt immediately.
      if (status === 502) {
        let responseBody = context?.body
        if (typeof context?.clone === 'function') {
          try { responseBody = await context.clone().json() } catch { /* keep the client fallback */ }
        }
        const serverCode = isRecord(responseBody)
          ? (isRecord(responseBody.error) ? responseBody.error.code : responseBody.code)
          : undefined
        if (serverCode === 'citation-not-carried') {
          return {
            ok: false,
            code: 'citation-not-carried',
            message: 'The generated guide cited something that could not be traced back to your material, '
              + 'so it was refused rather than corrected. Nothing was saved — generating again usually works.',
          }
        }
        if (serverCode === 'audit-rejected') {
          return {
            ok: false,
            code: 'audit-rejected',
            message: 'The independent provider review found a source or format problem. Nothing was saved.',
          }
        }
        return { ok: false, code: 'invalid-response', message: 'The generator returned an invalid result. Nothing was saved.' }
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
        || (result.data.primaryProvider != null && !['anthropic', 'openai'].includes(String(result.data.primaryProvider)))) {
        return { ok: false, code: 'invalid-response', message: 'The generator returned an invalid result. Nothing was saved.' }
      }
      return { ok: true, data: result.data as unknown as GeneratedStudyToolArtifact }
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

/**
 * Test harness: run the real `study-tools` Edge function in-process.
 *
 * The durable generation engine is a state machine spread across Postgres RPCs,
 * a worker budget, and a provider that answers over several calls. Verifying it
 * by reading it is not verification, and a live Supabase project cannot be part
 * of a unit run. So this compiles the actual function source and gives it
 * faithful in-memory implementations of the RPCs the migration defines —
 * including the parts that matter for correctness: the active-job dedupe index,
 * the single-runner lease, and the lease-token check on every write.
 *
 * Not a test file: `vite.config.ts` collects only `*.test.ts` / `*.spec.ts`.
 */
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import * as astraWalletRoute from '../../../supabase/functions/_shared/astraWalletRoute'
import * as generationJobs from '../../../supabase/functions/_shared/generationJobs'
import * as responseBoundary from '../../../supabase/functions/_shared/openAIGenerationResponse'
import * as citationWire from '../../../supabase/functions/_shared/openAICitationWire'
import * as grounding from '../../../supabase/functions/_shared/openAIGenerationGrounding'

export type JobRow = {
  id: string
  user_id: string
  dedupe_key: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  step: string
  phase: string
  payload: Record<string, unknown>
  provider_route: string | null
  provider_response_id: string | null
  backup_reservation_id: string | null
  provider_attempts: number
  poll_count: number
  lease_token: string | null
  lease_expires_at: number | null
  quota_reservation_cents: number
  result: Record<string, unknown> | null
  error: Record<string, unknown> | null
  updated_at: string
  expires_at: number
}

const coalesce = <T>(next: T | null | undefined, current: T): T => (next === null || next === undefined ? current : next)

/** In-memory stand-ins for the migration's job RPCs, with its exact rules. */
export function createJobStore(now: () => number = Date.now) {
  const rows = new Map<string, JobRow>()
  let sequence = 0
  const uuid = (prefix: string) => {
    sequence += 1
    const tail = String(sequence).padStart(12, '0')
    return `${prefix.padEnd(8, '0').slice(0, 8)}-0000-4000-8000-${tail}`
  }

  return {
    rows,
    start(args: Record<string, unknown>) {
      const userId = String(args.p_user_id)
      const key = String(args.p_dedupe_key)
      for (const row of rows.values()) {
        if (row.user_id === userId && ['queued', 'running'].includes(row.status) && row.expires_at < now()) {
          Object.assign(row, { status: 'failed', step: 'done', phase: 'Stopped', error: { code: 'job-expired', message: 'This build stopped before it finished and was not saved.' } })
        }
      }
      const active = [...rows.values()].find((row) => row.user_id === userId && row.dedupe_key === key && ['queued', 'running'].includes(row.status))
      if (active) return { created: false, job: active }
      const row: JobRow = {
        id: uuid('a1b2c3d4'), user_id: userId, dedupe_key: key, status: 'queued', step: 'submit',
        phase: 'Preparing', payload: args.p_payload as Record<string, unknown>, provider_route: null,
        provider_response_id: null, backup_reservation_id: null, provider_attempts: 0, poll_count: 0,
        lease_token: null, lease_expires_at: null,
        quota_reservation_cents: Number(args.p_reservation_cents ?? 0), result: null, error: null,
        updated_at: new Date(now()).toISOString(), expires_at: now() + 24 * 60 * 60 * 1000,
      }
      rows.set(row.id, row)
      return { created: true, job: row }
    },
    lease(args: Record<string, unknown>) {
      const row = rows.get(String(args.p_job_id))
      if (!row || row.user_id !== String(args.p_user_id)) return null
      if (!['queued', 'running'].includes(row.status)) return null
      if (row.lease_expires_at !== null && row.lease_expires_at >= now()) return null
      row.lease_token = uuid('1ea5e000')
      row.lease_expires_at = now() + Number(args.p_lease_seconds) * 1000
      row.status = 'running'
      row.updated_at = new Date(now()).toISOString()
      return { ...row }
    },
    update(args: Record<string, unknown>) {
      const row = rows.get(String(args.p_job_id))
      if (!row || row.lease_token !== String(args.p_lease_token)) return null
      row.status = coalesce(args.p_status as JobRow['status'], row.status)
      row.step = coalesce(args.p_step as string, row.step)
      row.payload = coalesce(args.p_payload as Record<string, unknown>, row.payload)
      row.phase = coalesce(args.p_phase as string, row.phase)
      row.provider_route = coalesce(args.p_provider_route as string, row.provider_route)
      row.provider_response_id = coalesce(args.p_provider_response_id as string, row.provider_response_id)
      row.backup_reservation_id = args.p_clear_backup_reservation === true
        ? null
        : coalesce(args.p_backup_reservation_id as string, row.backup_reservation_id)
      row.provider_attempts += Math.max(Number(args.p_provider_attempts_delta ?? 0), 0)
      row.poll_count += Math.max(Number(args.p_poll_delta ?? 0), 0)
      row.result = coalesce(args.p_result as Record<string, unknown>, row.result)
      row.error = args.p_error != null ? args.p_error as Record<string, unknown> : row.status === 'succeeded' ? null : row.error
      if (args.p_release_lease !== false) { row.lease_token = null; row.lease_expires_at = null }
      row.updated_at = new Date(now()).toISOString()
      return { ...row }
    },
  }
}

export interface EdgeHarnessOptions {
  chunks: Array<{ chunk_id: string; file_id: string; content: string; character_start?: number; character_end?: number }>
  fetch: typeof fetch
  env?: Record<string, string | undefined>
  now?: () => number
  quota?: { allowed: boolean; reason: string; reservation_cents: number }
}

/**
 * Compile and boot the real Edge handler against fakes. Returns the handler
 * plus the job store, so a test can assert on what was actually persisted
 * rather than on what the response happened to say.
 */
export function bootStudyToolsEdge(options: EdgeHarnessOptions) {
  const now = options.now ?? Date.now
  const jobs = createJobStore(now)
  const chunkRows = options.chunks.map((chunk) => ({
    chunk_id: chunk.chunk_id, file_id: chunk.file_id, content: chunk.content,
    character_start: chunk.character_start ?? 0, character_end: chunk.character_end ?? chunk.content.length,
  }))

  const sourceReads = { count: 0 }
  const jobQuery = (table: string) => {
    let id = ''
    const builder = {
      select() { return builder },
      in() { return builder },
      eq(column: string, value: string) { if (column === 'id') id = value; return builder },
      async limit() { sourceReads.count += 1; return { data: chunkRows, error: null } },
      async maybeSingle() {
        const row = table === 'study_generation_jobs' ? jobs.rows.get(id) : null
        return { data: row ? { ...row } : null, error: null }
      },
      async upsert() { return { error: null } },
      async delete() { return { error: null } },
    }
    return builder
  }

  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'user' } }, error: null }) },
    from: (table: string) => jobQuery(table),
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name === 'start_generation_job') return { data: jobs.start(args), error: null }
      if (name === 'lease_generation_job') return { data: jobs.lease(args), error: null }
      if (name === 'update_generation_job') return { data: jobs.update(args), error: null }
      if (name === 'reserve_astra_backup') return { data: 'reservation-1', error: null }
      if (name === 'settle_astra_backup') return { data: null, error: null }
      if (name === 'release_ai_reservation') return { data: null, error: null }
      return { data: options.quota ?? { allowed: true, reason: 'allowed', reservation_cents: 300 }, error: null }
    },
  }

  const env: Record<string, string | undefined> = {
    SUPABASE_URL: 'https://local.invalid', SUPABASE_ANON_KEY: 'test-only',
    SUPABASE_SERVICE_ROLE_KEY: 'test-only', OPENAI_API_KEY: 'test-only',
    // Production shape: Cheaper Inference is the primary route, and the direct
    // OpenAI credential exists only for the capped empty-wallet backup.
    CHEAPER_INFERENCE_API_KEY: 'wallet-test-only',
    ...options.env,
  }

  const compiled = ts.transpileModule(readFileSync('supabase/functions/study-tools/index.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const requireStub = (id: string) => id.startsWith('npm:') ? { createClient: () => client }
    : id.includes('generationJobs') ? generationJobs
    : id.includes('astraWalletRoute') ? astraWalletRoute
    : id.includes('openAIGenerationResponse') ? responseBoundary
    : id.includes('openAICitationWire') ? citationWire
    : grounding

  let handler!: (request: Request) => Promise<Response>
  const deno = { env: { get: (key: string) => env[key] }, serve: (fn: typeof handler) => { handler = fn } }
  new Function('require', 'exports', 'Deno', 'fetch', compiled)(requireStub, {}, deno, options.fetch)

  return {
    jobs,
    /** How many times the caller's source mirror was actually read. */
    sourceReads,
    async call(body: unknown) {
      return handler(new Request('https://local.invalid/study-tools', {
        method: 'POST', headers: { Authorization: 'Bearer test-only' }, body: JSON.stringify(body),
      }))
    },
  }
}

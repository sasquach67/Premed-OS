import * as generationUsage from '../../../supabase/functions/_shared/generationUsage'
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
import * as generationStages from '../../../supabase/functions/_shared/generationStages'
import * as stageBudget from '../../../supabase/functions/_shared/stageBudget'
import * as sourceInventory from '../../../supabase/functions/_shared/sourceInventory'
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
  spec_id: string | null
  stage: string
  inventory: Record<string, unknown> | null
  outline: Record<string, unknown> | null
  verification: Record<string, unknown> | null
  progress: number
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
        spec_id: null, stage: 'inventory', inventory: null, outline: null, verification: null, progress: 0,
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

export type TaskRow = {
  id: string
  job_id: string
  stage: string
  ordinal: number
  task_key: string
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
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
  lease_token: string | null
  lease_expires_at: number | null
  duration_ms: number | null
  error: Record<string, unknown> | null
  created_at: number
}

/**
 * The task queue, with the migration's actual rules: a task is claimable only
 * when its stage is the job's current stage, its attempts are not spent, and no
 * unexpired lease is held; writes require the lease token; fan-out is idempotent
 * by (job, stage, task_key).
 */
export function createTaskStore(jobs: ReturnType<typeof createJobStore>, now: () => number = Date.now) {
  const rows: TaskRow[] = []
  let sequence = 0
  const uuid = (prefix: string) => {
    sequence += 1
    return `${prefix}-0000-4000-8000-${String(sequence).padStart(12, '0')}`
  }

  return {
    rows,
    add(args: Record<string, unknown>) {
      const incoming = (args.p_tasks as Array<Record<string, unknown>>) ?? []
      let added = 0
      for (const entry of incoming) {
        const key = String(entry.taskKey)
        const stage = String(args.p_stage)
        const jobId = String(args.p_job_id)
        if (rows.some((row) => row.job_id === jobId && row.stage === stage && row.task_key === key)) continue
        rows.push({
          id: uuid('7a5c0000'), job_id: jobId, stage, ordinal: Number(entry.ordinal ?? 0), task_key: key,
          status: 'pending', label: String(entry.label ?? ''), input: (entry.input as Record<string, unknown>) ?? {},
          output: null, attempts: 0, max_attempts: Number(entry.maxAttempts ?? 2), provider_route: null,
          provider_request_id: null, provider_response_id: null, backup_reservation_id: null, idempotency_key: uuid('1de00000'),
          ambiguous: false, oversized: false, parent_task_key: null, part: 0,
          estimated_ms: null, input_chars: null, output_tokens: null,
          lease_token: null, lease_expires_at: null, duration_ms: null, error: null,
          created_at: now(),
        })
        added += 1
      }
      return added
    },
    claim(args: Record<string, unknown>) {
      const candidates = rows.filter((row) => {
        const job = jobs.rows.get(row.job_id)
        if (!job || !['queued', 'running'].includes(job.status)) return false
        if (args.p_job_id != null && row.job_id !== String(args.p_job_id)) return false
        if (args.p_user_id != null && job.user_id !== String(args.p_user_id)) return false
        if (job.expires_at <= now()) return false
        if (row.stage !== job.stage) return false
        if (!['pending', 'running'].includes(row.status)) return false
        if (row.attempts >= row.max_attempts) return false
        return row.lease_expires_at === null || row.lease_expires_at < now()
      }).sort((left, right) => left.ordinal - right.ordinal || left.created_at - right.created_at)
      const task = candidates[0]
      if (!task) return null
      task.status = 'running'
      task.lease_token = uuid('1ea50000')
      task.lease_expires_at = now() + Number(args.p_lease_seconds ?? 100) * 1000
      task.attempts += 1
      const job = jobs.rows.get(task.job_id)!
      if (job.status === 'queued') job.status = 'running'
      return { task: { ...task }, job: { ...job } }
    },
    complete(args: Record<string, unknown>) {
      const task = rows.find((row) => row.id === String(args.p_task_id))
      if (!task || task.lease_token !== String(args.p_lease_token)) return null
      const status = String(args.p_status) as TaskRow['status']
      task.status = status
      if (args.p_output != null) task.output = args.p_output as Record<string, unknown>
      if (args.p_error != null) task.error = args.p_error as Record<string, unknown>
      if (args.p_duration_ms != null) task.duration_ms = Number(args.p_duration_ms)
      if (args.p_provider_route != null) task.provider_route = String(args.p_provider_route)
      if (args.p_provider_request_id != null) task.provider_request_id = String(args.p_provider_request_id)
      if (args.p_provider_response_id != null) task.provider_response_id = String(args.p_provider_response_id)
      if (args.p_clear_backup_reservation === true) task.backup_reservation_id = null
      else if (args.p_backup_reservation_id != null) task.backup_reservation_id = String(args.p_backup_reservation_id)
      if (args.p_ambiguous != null) task.ambiguous = args.p_ambiguous === true
      task.lease_token = null
      task.lease_expires_at = null
      if (status === 'failed') {
        if (task.attempts < task.max_attempts) task.status = 'pending'
        else {
          const job = jobs.rows.get(task.job_id)
          if (job) {
            job.status = 'failed'
            job.stage = 'done'
            job.phase = 'Stopped'
            job.error = task.error ?? { code: 'stage-failed', message: 'A generation stage could not be completed. Nothing was saved.' }
          }
        }
      }
      return { ...task }
    },
    advance(args: Record<string, unknown>) {
      const jobId = String(args.p_job_id)
      const job = jobs.rows.get(jobId)
      if (!job) return null
      const open = rows.filter((row) => row.job_id === jobId && row.stage === job.stage && !['done', 'skipped'].includes(row.status))
      if (open.length) return null
      if (!['queued', 'running'].includes(job.status)) return null
      job.stage = String(args.p_next_stage)
      if (args.p_progress != null) job.progress = Number(args.p_progress)
      return { ...job }
    },
    subdivide(args: Record<string, unknown>) {
      const task = rows.find((row) => row.id === String(args.p_task_id))
      if (!task || task.lease_token !== String(args.p_lease_token)) return null
      const parts = (args.p_parts as Array<Record<string, unknown>>) ?? []
      if (!parts.length) return 0
      // Mirrors 20260907070000: subdivision is all-or-nothing. A part whose key
      // already exists means the split is proposing keys in a sibling's
      // namespace, and inserting only the rest silently drops the parent's
      // material. The parent is left exactly as it was for the runner to fail.
      const collides = parts.some((entry) =>
        rows.some((row) => row.job_id === task.job_id && row.stage === task.stage
          && row.task_key === String(entry.taskKey)))
      if (collides) return 0
      let added = 0
      for (const entry of parts) {
        const key = String(entry.taskKey)
        rows.push({
          ...task,
          id: uuid('7a5c1111'), task_key: key, status: 'pending', attempts: 0,
          ordinal: Number(entry.ordinal ?? task.ordinal), part: Number(entry.part ?? 0),
          label: String(entry.label ?? task.label), input: (entry.input as Record<string, unknown>) ?? {},
          output: null, error: null, duration_ms: null, lease_token: null, lease_expires_at: null,
          parent_task_key: task.parent_task_key ?? task.task_key,
          provider_response_id: null, provider_request_id: null, backup_reservation_id: null,
          estimated_ms: null, input_chars: null, output_tokens: null, oversized: false,
          created_at: now(),
        })
        added += 1
      }
      task.status = 'skipped'
      task.oversized = true
      task.lease_token = null
      task.lease_expires_at = null
      return added
    },
    view(args: Record<string, unknown>) {
      const job = jobs.rows.get(String(args.p_job_id))
      if (!job) return null
      const mine = rows.filter((row) => row.job_id === job.id)
      const stageTasks = mine.filter((row) => row.stage === job.stage)
      return {
        job: { ...job },
        stageDone: stageTasks.filter((row) => ['done', 'skipped'].includes(row.status)).length,
        stageTotal: stageTasks.length,
        tasks: mine.map((row) => ({
          stage: row.stage, ordinal: row.ordinal, label: row.label, status: row.status,
          attempts: row.attempts, durationMs: row.duration_ms, ambiguous: row.ambiguous,
        })),
      }
    },
  }
}

/** Mirrors `record_stage_duration`: per-stage rates learned from real runs. */
export function createStatsStore() {
  const rows = new Map<string, Record<string, unknown>>()
  return {
    rows,
    record(args: Record<string, unknown>) {
      const key = `${args.p_spec_id}:${args.p_stage}`
      const previous = rows.get(key)
      const sample = {
        durationMs: Number(args.p_duration_ms) || 1,
        inputChars: Number(args.p_input_chars) || 0,
        outputTokens: Number(args.p_output_tokens) || 1,
      }
      const next = stageBudget.recordObservation(previous ? {
        samples: Number(previous.samples) || 0,
        msPerOutputToken: Number(previous.ms_per_output_token) || 14,
        msPerKiloInputChar: Number(previous.ms_per_kilo_input_char) || 40,
        maxMs: Number(previous.max_ms) || 0,
      } : null, sample)
      rows.set(key, {
        spec_id: args.p_spec_id, stage: args.p_stage, samples: next.samples,
        ms_per_output_token: next.msPerOutputToken, ms_per_kilo_input_char: next.msPerKiloInputChar,
        max_ms: next.maxMs,
      })
    },
    get(specId: string, stage: string) { return rows.get(`${specId}:${stage}`) ?? null },
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
  const tasks = createTaskStore(jobs, now)
  const capabilities = new Map<string, Record<string, unknown>>()
  const stats = createStatsStore()
  const chunkRows = options.chunks.map((chunk) => ({
    chunk_id: chunk.chunk_id, file_id: chunk.file_id, content: chunk.content,
    character_start: chunk.character_start ?? 0, character_end: chunk.character_end ?? chunk.content.length,
  }))

  const sourceReads = { count: 0 }
  const usageRows: Record<string, unknown>[] = []
  const jobQuery = (table: string) => {
    let id = ''
    let jobId = ''
    let route = ''
    const usageFilters: [string, string][] = []
    let specFilter = ''
    let stageFilter = ''
    let pendingUpdate: Record<string, unknown> | null = null
    const builder = {
      select() { return builder },
      in() { return builder },
      order() { return builder },
      eq(column: string, value: string) {
        usageFilters.push([column, value])
        if (pendingUpdate && table === 'study_generation_usage' && column === 'id') {
          const row = usageRows.find(row => row.id === value); if (row) Object.assign(row, pendingUpdate); pendingUpdate = null
        }
        if (column === 'id') id = value
        if (column === 'job_id') jobId = value
        if (column === 'route') route = value
        if (column === 'spec_id') specFilter = value
        if (column === 'stage') stageFilter = value
        if (pendingUpdate && table === 'study_generation_jobs') {
          const row = jobs.rows.get(value)
          if (row) Object.assign(row, pendingUpdate)
          pendingUpdate = null
        }
        if (pendingUpdate && table === 'study_generation_tasks' && column === 'id') {
          const row = tasks.rows.find((entry) => entry.id === value)
          if (row) Object.assign(row, pendingUpdate)
          pendingUpdate = null
        }
        return builder
      },
      insert(values: Record<string, unknown>) { if (table === 'study_generation_usage') usageRows.push(values); return builder },
      update(values: Record<string, unknown>) { pendingUpdate = values; return builder },
      async limit() { if (table === 'study_generation_usage') return { data: usageRows.filter(row => usageFilters.every(([k,v]) => row[k] === v)), error: null }; sourceReads.count += 1; return { data: chunkRows, error: null } },
      async maybeSingle() {
        if (table === 'study_generation_jobs') {
          const row = jobs.rows.get(id)
          return { data: row ? { ...row } : null, error: null }
        }
        if (table === 'generation_provider_capabilities') {
          return { data: capabilities.get(route) ?? null, error: null }
        }
        if (table === 'generation_stage_stats') {
          return { data: stats.get(specFilter, stageFilter), error: null }
        }
        return { data: null, error: null }
      },
      async upsert(values: Record<string, unknown>) {
        if (table === 'generation_provider_capabilities') capabilities.set(String(values.route), values)
        return { error: null }
      },
      async delete() { return { error: null } },
      then(resolve: (value: { data: unknown; error: null }) => unknown) {
        const data = table === 'study_generation_tasks'
          ? tasks.rows.filter((row) => row.job_id === jobId).map((row) => ({ ...row }))
          : []
        return Promise.resolve({ data, error: null }).then(resolve)
      },
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
      if (name === 'add_generation_tasks') return { data: tasks.add(args), error: null }
      if (name === 'claim_generation_task') return { data: tasks.claim(args), error: null }
      if (name === 'complete_generation_task') return { data: tasks.complete(args), error: null }
      if (name === 'advance_generation_stage') return { data: tasks.advance(args), error: null }
      if (name === 'generation_job_view') return { data: tasks.view(args), error: null }
      if (name === 'record_stage_duration') { stats.record(args); return { data: null, error: null } }
      if (name === 'subdivide_generation_task') return { data: tasks.subdivide(args), error: null }
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
    GENERATION_RUNNER_SECRET: 'runner-test-only',
    ...options.env,
  }

  const compiled = ts.transpileModule(readFileSync('supabase/functions/study-tools/index.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const requireStub = (id: string) => id.startsWith('npm:') ? { createClient: () => client }
    : id.includes('generationUsage') ? generationUsage
    : id.includes('generationStages') ? generationStages
    : id.includes('stageBudget') ? stageBudget
    : id.includes('sourceInventory') ? sourceInventory
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
    tasks,
    capabilities,
    stats,
    /** How many times the caller's source mirror was actually read. */
    sourceReads,
    async call(body: unknown, headers: Record<string, string> = {}) {
      return handler(new Request('https://local.invalid/study-tools', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-only', ...headers },
        body: JSON.stringify(body),
      }))
    },
    /**
     * Stand in for pg_cron: keep dispatching `run-task` until the build settles.
     * The browser is deliberately not involved, exactly as in production.
     */
    async drainQueue(limit = 60) {
      for (let tick = 0; tick < limit; tick += 1) {
        const response = await this.call({ action: 'run-task' }, { 'x-generation-runner': 'runner-test-only' })
        const body = await response.json().catch(() => null)
        if (!body?.ran) return tick
      }
      return limit
    },
  }
}

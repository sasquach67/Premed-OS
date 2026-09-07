/**
 * Durable generation jobs — the worker-lifetime-safe half of study generation.
 *
 * Supabase gives an Edge Function worker a wall-clock lifetime (150s free,
 * 400s paid) and a 150s request idle timeout, and that wall clock belongs to
 * the WORKER, not to your request: a worker may already be part-way through its
 * life when it serves you, and it can also be retired early (EarlyDrop) while
 * it merely looks idle awaiting a socket. `EdgeRuntime.waitUntil` does not
 * extend it either. So a multi-minute model call held open inside one
 * invocation is not slow — it is unsurvivable, and it takes the work with it.
 *
 * The rule this module enforces: every step must finish, and must persist what
 * it learned, strictly inside the budget the CURRENT worker has left.
 *
 * Nothing here holds study material or credentials.
 */

export type JobStep = 'submit' | 'sync' | 'poll' | 'audit' | 'done'
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type GenerationJob = {
  id: string
  user_id: string
  status: JobStatus
  step: JobStep
  phase: string
  payload: Record<string, unknown>
  provider_route: 'wallet' | 'openai-backup' | null
  provider_response_id: string | null
  backup_reservation_id: string | null
  provider_attempts: number
  poll_count: number
  lease_token: string | null
  quota_reservation_cents: number
  result: Record<string, unknown> | null
  error: Record<string, unknown> | null
  updated_at: string
}

/** Diagnostics that may be persisted and shown. Status codes and provider
 *  request ids only — never a key, a prompt, or any source text. */
export type JobErrorDetail = {
  code: string
  message: string
  providerStatus?: number
  requestId?: string
  /** Review notes from the independent audit, already truncated by the caller. */
  issues?: string[]
}

/** Paid work per job is capped here, not by client good behaviour: one initial
 *  authoring pass plus at most one validation-repair rebuild. */
export const MAX_PROVIDER_ATTEMPTS = 2
/** A background response that never settles must stop costing poll requests. */
export const MAX_POLLS = 120

// A worker's clock starts at boot, so read it at module scope — the top of this
// file runs once per worker, which is exactly the moment the budget begins.
const WORKER_BOOT_MS = Date.now()

export type WorkerBudget = {
  /** Total wall clock this worker gets. Set EDGE_WALL_CLOCK_MS to 400000 when
   *  the project moves to a paid plan; the default is the free-plan 150s. */
  lifetimeMs: number
  /** Held back so a step can always persist progress and answer before the kill. */
  safetyMs: number
}

export function workerBudget(env: (key: string) => string | undefined): WorkerBudget {
  const configured = Number(env('EDGE_WALL_CLOCK_MS'))
  return {
    lifetimeMs: Number.isFinite(configured) && configured >= 30_000 ? configured : 150_000,
    safetyMs: 20_000,
  }
}

/** Milliseconds this worker can still safely spend. */
export function remainingWorkerMs(budget: WorkerBudget, now = Date.now()) {
  return Math.max(0, budget.lifetimeMs - (now - WORKER_BOOT_MS) - budget.safetyMs)
}

/**
 * A step that cannot finish inside what is left should not be started: starting
 * it burns a paid provider call that the worker will not live to record.
 */
export function canRunStep(budget: WorkerBudget, needMs: number, now = Date.now()) {
  return remainingWorkerMs(budget, now) >= needMs
}

/** An abort deadline that is the smaller of what the step wants and what the
 *  worker actually has left. */
export function stepDeadlineMs(budget: WorkerBudget, wantMs: number, now = Date.now()) {
  return Math.max(1_000, Math.min(wantMs, remainingWorkerMs(budget, now)))
}

export class StepTimeoutError extends Error {
  readonly stage: string
  readonly elapsedMs: number
  constructor(stage: string, elapsedMs: number) {
    super(`The ${stage} step ran out of this worker's safe time budget after ${Math.round(elapsedMs / 1000)}s.`)
    this.name = 'StepTimeoutError'
    this.stage = stage
    this.elapsedMs = elapsedMs
  }
}

/** Run one provider call under a hard deadline, so no await can outlive the worker. */
export async function withDeadline<T>(
  stage: string,
  deadlineMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController()
  const started = Date.now()
  const timer = setTimeout(() => controller.abort(), deadlineMs)
  try {
    return await run(controller.signal)
  } catch (error) {
    if (controller.signal.aborted) throw new StepTimeoutError(stage, Date.now() - started)
    throw error
  } finally {
    clearTimeout(timer)
  }
}

type Rpc = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

const asJob = (value: unknown): GenerationJob | null =>
  value && typeof value === 'object' && typeof (value as GenerationJob).id === 'string'
    ? value as GenerationJob
    : null

export async function startJob(
  service: unknown,
  userId: string,
  dedupeKey: string,
  payload: Record<string, unknown>,
  reservationCents: number,
): Promise<{ created: boolean; job: GenerationJob } | null> {
  const { data, error } = await (service as Rpc).rpc('start_generation_job', {
    p_user_id: userId,
    p_dedupe_key: dedupeKey,
    p_payload: payload,
    p_reservation_cents: reservationCents,
  })
  if (error || !data || typeof data !== 'object') return null
  const job = asJob((data as Record<string, unknown>).job)
  return job ? { created: (data as Record<string, unknown>).created === true, job } : null
}

/**
 * Take the single-runner lease. A null result means someone else is already
 * running this job — the caller must then report "still working", never start a
 * second paid provider call.
 */
export async function leaseJob(
  service: unknown,
  userId: string,
  jobId: string,
  leaseSeconds: number,
): Promise<GenerationJob | null> {
  const { data, error } = await (service as Rpc).rpc('lease_generation_job', {
    p_user_id: userId,
    p_job_id: jobId,
    p_lease_seconds: leaseSeconds,
  })
  if (error) return null
  return asJob(data)
}

export async function updateJob(
  service: unknown,
  jobId: string,
  leaseToken: string,
  patch: {
    status?: JobStatus
    step?: JobStep
    phase?: string
    payload?: Record<string, unknown>
    providerRoute?: 'wallet' | 'openai-backup'
    providerResponseId?: string
    backupReservationId?: string
    clearBackupReservation?: boolean
    providerAttemptsDelta?: number
    pollDelta?: number
    result?: Record<string, unknown>
    error?: JobErrorDetail
    releaseLease?: boolean
  },
): Promise<GenerationJob | null> {
  const { data, error } = await (service as Rpc).rpc('update_generation_job', {
    p_job_id: jobId,
    p_lease_token: leaseToken,
    p_status: patch.status ?? null,
    p_step: patch.step ?? null,
    p_payload: patch.payload ?? null,
    p_phase: patch.phase ?? null,
    p_provider_route: patch.providerRoute ?? null,
    p_provider_response_id: patch.providerResponseId ?? null,
    p_backup_reservation_id: patch.backupReservationId ?? null,
    p_clear_backup_reservation: patch.clearBackupReservation ?? false,
    p_provider_attempts_delta: patch.providerAttemptsDelta ?? 0,
    p_poll_delta: patch.pollDelta ?? 0,
    p_result: patch.result ?? null,
    p_error: patch.error ?? null,
    p_release_lease: patch.releaseLease ?? true,
  })
  if (error) {
    console.error('generation job update failed', error.message)
    return null
  }
  return asJob(data)
}

/** The client-facing shape of a job. Deliberately omits payload and lease. */
export function publicJob(job: GenerationJob) {
  return {
    jobId: job.id,
    status: job.status,
    step: job.step,
    phase: job.phase,
    providerAttempts: job.provider_attempts,
    pollCount: job.poll_count,
    updatedAt: job.updated_at,
    ...(job.status === 'succeeded' && job.result ? { result: job.result } : {}),
    ...(job.status === 'failed' && job.error ? { error: job.error } : {}),
  }
}

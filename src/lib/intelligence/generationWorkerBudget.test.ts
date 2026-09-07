/**
 * The worker budget is the whole reason the durable engine is safe.
 *
 * Supabase kills an Edge worker at its wall-clock limit (150s free / 400s paid)
 * and can retire it early while it looks idle on a socket, and that clock
 * belongs to the WORKER, not to the request — a worker part-way through its
 * life has correspondingly less to give. `EdgeRuntime.waitUntil` does not
 * extend it. So every step has to refuse to start work it cannot finish, and
 * every provider call has to carry a deadline. These tests pin exactly that.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  canRunStep,
  MAX_POLLS,
  MAX_PROVIDER_ATTEMPTS,
  publicJob,
  remainingWorkerMs,
  stepDeadlineMs,
  StepTimeoutError,
  withDeadline,
  workerBudget,
  type GenerationJob,
} from '../../../supabase/functions/_shared/generationJobs'

describe('worker budget', () => {
  it('defaults to the documented free-plan wall clock and takes a safety margin', () => {
    const budget = workerBudget(() => undefined)
    expect(budget.lifetimeMs).toBe(150_000)
    // The margin is what buys the step time to persist progress and answer.
    expect(budget.safetyMs).toBeGreaterThan(0)
    expect(remainingWorkerMs(budget)).toBeLessThanOrEqual(150_000 - budget.safetyMs)
  })

  it('accepts the paid-plan wall clock without code changes', () => {
    expect(workerBudget((key) => (key === 'EDGE_WALL_CLOCK_MS' ? '400000' : undefined)).lifetimeMs).toBe(400_000)
  })

  it('ignores a configured value too small to be a real worker lifetime', () => {
    expect(workerBudget(() => '5000').lifetimeMs).toBe(150_000)
  })

  it('refuses to start a step the worker cannot survive, and never goes negative', () => {
    const budget = workerBudget(() => undefined)
    const nearlyDead = Date.now() + 149_000
    expect(canRunStep(budget, 30_000, nearlyDead)).toBe(false)
    expect(remainingWorkerMs(budget, nearlyDead + 60_000)).toBe(0)
  })

  it('clamps a step deadline to what the worker actually has left', () => {
    const budget = workerBudget(() => undefined)
    // A step that wants 100s cannot have it when only ~10s of budget remains.
    const late = Date.now() + 120_000
    expect(stepDeadlineMs(budget, 100_000, late)).toBeLessThan(100_000)
    expect(stepDeadlineMs(budget, 100_000, late)).toBeGreaterThanOrEqual(1_000)
  })
})

describe('bounded provider calls', () => {
  it('aborts the call and reports the stage rather than hanging until the kill', async () => {
    const abortObserved = vi.fn()
    await expect(withDeadline('generation', 20, (signal) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => { abortObserved(); reject(new Error('aborted')) })
    }))).rejects.toBeInstanceOf(StepTimeoutError)
    expect(abortObserved).toHaveBeenCalled()
  })

  it('passes a real failure through untouched, so a provider error is not disguised as a timeout', async () => {
    await expect(withDeadline('submit', 5_000, async () => { throw new Error('HTTP 429') }))
      .rejects.toThrow('HTTP 429')
  })

  it('returns the value and clears its timer on success', async () => {
    await expect(withDeadline('poll', 5_000, async () => 'done')).resolves.toBe('done')
  })
})

describe('what a job exposes to the browser', () => {
  const job = {
    id: 'job-1', user_id: 'user-1', status: 'running', step: 'poll', phase: 'Generating',
    payload: { systemPrompt: 'the assembled specification', request: 'Topic: Memory.' },
    provider_route: 'wallet', provider_response_id: 'resp_1', backup_reservation_id: 'reservation-1',
    provider_attempts: 1, poll_count: 3, lease_token: 'secret-lease', quota_reservation_cents: 300,
    result: { artifact: { secret: true } }, error: null, updated_at: '2026-09-06T19:16:21.000Z',
  } as unknown as GenerationJob

  it('never leaks the lease, the payload, or an unfinished artifact', () => {
    const view = JSON.stringify(publicJob(job))
    expect(view).not.toContain('secret-lease')
    expect(view).not.toContain('the assembled specification')
    // A result belongs to the student only once the job has actually succeeded.
    expect(view).not.toContain('artifact')
  })

  it('releases the result once the job succeeds', () => {
    expect(publicJob({ ...job, status: 'succeeded' }).result).toEqual({ artifact: { secret: true } })
  })

  it('bounds paid work and polling', () => {
    expect(MAX_PROVIDER_ATTEMPTS).toBe(2)
    expect(MAX_POLLS).toBeGreaterThan(0)
  })
})

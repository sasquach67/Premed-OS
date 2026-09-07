/**
 * The failure this suite exists for.
 *
 * A study-guide build spent its whole life inside one Edge invocation. Supabase
 * gives an Edge worker a wall-clock lifetime it is killed at (150s free / 400s
 * paid) and can also retire it early while it looks idle on a socket, and that
 * clock belongs to the worker rather than to the request. So a build that took
 * several minutes was not slow — it was destroyed, with nothing recorded, and
 * the student saw one catch-all sentence.
 *
 * These tests run the REAL compiled Edge handler against a faithful in-memory
 * job store and a scripted provider, and assert the properties that make the
 * replacement durable: progress is persisted, a refresh rejoins the same build,
 * a double press does not pay twice, paid attempts are capped, a timeout is
 * reported as a timeout, and a failure never disturbs a saved result.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bootStudyToolsEdge } from './edgeStudyToolsHarness.testing'
import { createStudyToolsClient, generationJobStore, type GenerationJobView } from '@/lib/intelligence/studyTools'

const chunk = { chunk_id: 'chunk-1', file_id: 'file-1', content: 'Encoding transforms incoming information into a form memory can store.' }

const guide = (sourceRef: unknown = { citationId: 'S1' }) => ({
  sections: [{
    id: 'at-a-glance',
    title: 'AT A GLANCE',
    blocks: [{ id: 'block-1', type: 'prose', provenance: 'source', text: { content: 'Encoding converts experience into a storable form.' }, sourceRef }],
  }],
})

const startBody = {
  action: 'generate-start', courseId: 'course-1', topicId: 'topic-1', chunkIds: ['chunk-1'],
  specId: 'study-guide-v1', specHash: 'hash', systemPrompt: 'spec', request: 'Topic: Memory.',
}

/** A provider that answers a background submit with an id, then a scripted
 *  sequence of poll bodies — the shape the durable engine is built around. */
function backgroundProvider(script: Array<Record<string, unknown>>) {
  const calls: Array<{ method: string; url: string }> = []
  const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    calls.push({ method, url: String(url) })
    if (method === 'POST') return new Response(JSON.stringify({ id: 'resp_1', status: 'queued' }), { status: 200 })
    return new Response(JSON.stringify(script.shift() ?? { id: 'resp_1', status: 'in_progress' }), { status: 200 })
  })
  return { fetcher: fetcher as unknown as typeof fetch, calls }
}

const completed = (artifact: unknown) => ({ id: 'resp_1', status: 'completed', output_text: JSON.stringify(artifact) })

async function readJson(response: Response) {
  return await response.json() as GenerationJobView & { error?: { code: string; message: string } }
}

beforeEach(() => { localStorage.clear() })

describe('durable study generation across bounded Edge steps', () => {
  it('records the job and answers immediately, before any provider work', async () => {
    const { fetcher, calls } = backgroundProvider([])
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher })

    const started = await readJson(await edge.call(startBody))

    expect(started.status).toBe('queued')
    expect(started.jobId).toBeTruthy()
    // The whole point: returning the id costs no provider call at all.
    expect(calls).toHaveLength(0)
    expect(edge.jobs.rows.get(started.jobId)?.step).toBe('submit')
  })

  it('advances submit → poll → audit and persists the artifact only once it succeeds', async () => {
    const { fetcher } = backgroundProvider([{ id: 'resp_1', status: 'in_progress' }, completed(guide())])
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })

    const started = await readJson(await edge.call(startBody))
    const submitted = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
    expect(submitted.step).toBe('poll')
    expect(edge.jobs.rows.get(started.jobId)?.provider_response_id).toBe('resp_1')

    const stillWorking = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
    expect(stillWorking.status).toBe('running')
    expect(stillWorking.result).toBeUndefined()

    const settled = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
    expect(settled.step).toBe('audit')
    // An unaudited artifact must never reach the student.
    expect(settled.result).toBeUndefined()

    const done = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
    expect(done.status).toBe('succeeded')
    expect(done.result?.auditStatus).toBe('skipped')
    expect(done.result?.citations).toHaveLength(1)
  })

  it('does not re-read the whole source mirror on every poll', async () => {
    const { fetcher } = backgroundProvider([
      { id: 'resp_1', status: 'in_progress' }, { id: 'resp_1', status: 'in_progress' }, completed(guide()),
    ])
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))
    await edge.call({ action: 'generate-step', jobId: started.jobId })
    const afterSubmit = edge.sourceReads.count

    await edge.call({ action: 'generate-step', jobId: started.jobId })
    await edge.call({ action: 'generate-step', jobId: started.jobId })
    // A build polled for minutes must not spend its worker budget re-reading
    // several hundred passages that have not changed.
    expect(edge.sourceReads.count).toBe(afterSubmit)

    const settled = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
    expect(settled.step).toBe('audit')
    // Verifying a completed artifact does need them again.
    expect(edge.sourceReads.count).toBeGreaterThan(afterSubmit)
  })

  it('widens the polling interval instead of asking every three seconds forever', async () => {
    const { fetcher } = backgroundProvider(Array.from({ length: 6 }, () => ({ id: 'resp_1', status: 'in_progress' })))
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher })
    const started = await readJson(await edge.call(startBody))
    await edge.call({ action: 'generate-step', jobId: started.jobId })

    const waits: number[] = []
    for (let poll = 0; poll < 5; poll += 1) {
      const view = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId })) as { retryAfterMs?: number }
      waits.push(view.retryAfterMs ?? 0)
    }
    expect(waits[0]).toBeLessThan(waits.at(-1)!)
    expect(Math.max(...waits)).toBeLessThanOrEqual(15_000)
  })

  it('records nothing as a result when a build fails, so a saved entry is untouched', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) =>
      (init?.method ?? 'GET') === 'POST'
        ? new Response(JSON.stringify({ error: { code: 'insufficient_quota', message: 'quota' } }), { status: 429 })
        : new Response('{}', { status: 200 })) as unknown as typeof fetch
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher })
    const started = await readJson(await edge.call(startBody))
    const failed = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))

    expect(failed.status).toBe('failed')
    expect(failed.result).toBeUndefined()
    expect(edge.jobs.rows.get(started.jobId)?.result).toBeNull()
    // A rate-limited wallet never silently reaches for the capped OpenAI
    // backup: that route activates only on an explicit insufficient balance.
    expect(failed.error?.code).toBe('wallet-unavailable')
    expect(failed.error?.providerStatus).toBe(429)
  })

  it('rejoins one build instead of starting a second when the same request arrives twice', async () => {
    const { fetcher, calls } = backgroundProvider([])
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher })

    const first = await readJson(await edge.call(startBody))
    const second = await readJson(await edge.call(startBody)) as GenerationJobView & { rejoined?: boolean }

    expect(second.jobId).toBe(first.jobId)
    expect(second.rejoined).toBe(true)
    expect(edge.jobs.rows.size).toBe(1)
    expect(calls).toHaveLength(0)
  })

  it('reports the running job rather than paying twice when a second runner steps it', async () => {
    const { fetcher } = backgroundProvider([{ id: 'resp_1', status: 'in_progress' }])
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher })
    const started = await readJson(await edge.call(startBody))
    await edge.call({ action: 'generate-step', jobId: started.jobId })

    // Hold the lease, as a still-running worker would.
    const row = edge.jobs.rows.get(started.jobId)!
    row.lease_token = 'held'
    row.lease_expires_at = Date.now() + 60_000

    const blocked = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId })) as GenerationJobView & { busy?: boolean }
    expect(blocked.busy).toBe(true)
    expect(row.provider_attempts).toBe(1)
  })

  it('caps paid attempts: one rebuild after an unverifiable citation, then a real refusal', async () => {
    const unverifiable = guide({ citationId: 'S9' })
    const { fetcher } = backgroundProvider([completed(unverifiable), completed(unverifiable)])
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher })
    const started = await readJson(await edge.call(startBody))

    let latest: Awaited<ReturnType<typeof readJson>> | undefined
    for (let step = 0; step < 8; step += 1) {
      latest = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
      if (latest.status === 'failed' || latest.status === 'succeeded') break
    }

    expect(latest?.status).toBe('failed')
    const row = edge.jobs.rows.get(started.jobId)!
    expect(row.provider_attempts).toBe(2)
    expect(String(row.error?.code)).toMatch(/citation-not-carried|provider-attempts-exhausted/)
    // The rebuild carried the reason forward rather than repeating the request.
    expect(String((row.payload as { repairRequest?: string }).repairRequest ?? '')).toContain('rejected by validation')
  })

  it('names a provider timeout as a timeout, with a status and request id and no credentials', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'POST') return new Response(JSON.stringify({ id: 'resp_1', status: 'queued' }), { status: 200 })
      return new Response(JSON.stringify({ error: { code: 'not_found', message: 'No such response' } }), {
        status: 404, headers: { 'x-request-id': 'req_abc123' },
      })
    }) as unknown as typeof fetch
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher })
    const started = await readJson(await edge.call(startBody))
    await edge.call({ action: 'generate-step', jobId: started.jobId })
    const lost = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))

    expect(lost.status).toBe('failed')
    expect(lost.error?.code).toBe('provider-response-lost')
    expect(JSON.stringify(lost)).toContain('req_abc123')
    expect(JSON.stringify(lost)).not.toContain('test-only')
    expect(JSON.stringify(lost)).not.toContain(chunk.content)
  })

  it('falls back to one bounded synchronous call when the route has no background mode', async () => {
    let posts = 0
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if ((init?.method ?? 'GET') !== 'POST') throw new Error('unexpected poll')
      posts += 1
      return posts === 1
        ? new Response(JSON.stringify({ error: { code: 'unknown_parameter', param: 'background', message: 'Unrecognized request argument supplied: background' } }), { status: 400 })
        : new Response(JSON.stringify(completed(guide())), { status: 200 })
    }) as unknown as typeof fetch
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))

    const fellBack = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
    expect(fellBack.step).toBe('sync')
    // A capability answer must not be charged as a generation attempt.
    expect(edge.jobs.rows.get(started.jobId)?.provider_attempts).toBe(0)

    await edge.call({ action: 'generate-step', jobId: started.jobId })
    const done = await readJson(await edge.call({ action: 'generate-step', jobId: started.jobId }))
    expect(done.status).toBe('succeeded')
  })

  it('keeps a build readable after the page reloads, and the driver resumes it', async () => {
    const { fetcher } = backgroundProvider([completed(guide())])
    const edge = bootStudyToolsEdge({ chunks: [chunk], fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const invoke = vi.fn(async (_name: string, options: { body: unknown }) => {
      const response = await edge.call(options.body)
      const body = await response.clone().json()
      return response.ok ? { data: body, error: null } : { data: null, error: { context: response } }
    })
    const tools = createStudyToolsClient({ auth: { getSession: async () => ({ data: { session: {} } }) }, functions: { invoke } } as never)

    // First page: start the build, then "close the tab" mid-flight.
    const started = await tools.startGeneration({ ...startBody, action: 'generate' })
    expect(started.ok).toBe(true)
    if (!started.ok) return
    await tools.stepGeneration(started.data.jobId)

    // Second page load: the same resume key finds the same job and finishes it.
    const store = generationJobStore('study-guide-v1:reload')
    store.write(started.data.jobId)
    const resumed = await tools.generateDurable({ ...startBody, action: 'generate' }, {
      resumeKey: 'study-guide-v1:reload', sleep: async () => {},
    })

    expect(resumed.ok).toBe(true)
    expect(edge.jobs.rows.size).toBe(1)
    expect(store.read()).toBeNull()
  })
})

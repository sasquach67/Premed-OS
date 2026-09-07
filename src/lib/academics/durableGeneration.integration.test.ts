/**
 * The generation engine, exercised as the real compiled Edge handler.
 *
 * What these pin is the shape of the work. A build is a sequence of stages, and
 * a stage's tasks are pieces of the ARTIFACT — a plan, one section, the audit —
 * never slices of the student's material. Each task runs in its own invocation,
 * is persisted before its successor is scheduled, and is driven by a scheduler
 * rather than by the browser.
 *
 * The queue here stands in for pg_cron. It is deliberately never given a
 * browser: `drainQueue` is the only thing that advances a build, so a test that
 * passes proves the build does not need a page open.
 *
 * These do NOT establish that the provider supports background responses. That
 * is unprovable from a test double and is settled at runtime by `probe-background`
 * against the live route; until it passes, every stage runs synchronously.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bootStudyToolsEdge } from './edgeStudyToolsHarness.testing'

const passages = [
  { chunk_id: 'c1', file_id: 'lecture', content: 'Encoding transforms incoming information into a form memory can store.' },
  { chunk_id: 'c2', file_id: 'lecture', content: 'Retrieval reconstructs a stored trace rather than replaying a recording.' },
  { chunk_id: 'c3', file_id: 'reading', content: 'Consolidation stabilises a labile trace over hours to days, largely during sleep.' },
]

const startBody = {
  action: 'generate-start', courseId: 'course-1', topicId: 'topic-1',
  chunkIds: passages.map((passage) => passage.chunk_id),
  specId: 'study-guide-v1', specHash: 'hash', systemPrompt: 'spec', request: 'Topic: Memory.',
}

const plan = {
  sections: [
    { id: 'at-a-glance', title: 'AT A GLANCE', purpose: 'Orient', sourceChunkIds: ['S1', 'S2'] },
    { id: 'consolidation', title: 'Consolidation', purpose: 'Explain', sourceChunkIds: ['S2', 'S3'] },
  ],
  unusedSources: [],
}

const section = (id: string, citationId: string) => ({
  section: {
    id, title: id, blocks: [{
      id: `${id}-b1`, type: 'prose', provenance: 'source',
      text: { content: 'A source-supported explanation.' }, sourceRef: { citationId },
    }],
  },
})

/** A provider scripted per request, so each stage's own call is observable. */
function scriptedProvider(script: Array<unknown | ((body: string) => unknown)>) {
  const requests: string[] = []
  const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = String(init?.body ?? '')
    requests.push(body)
    const next = script.shift()
    const value = typeof next === 'function' ? (next as (input: string) => unknown)(body) : next
    return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(value ?? {}) }), { status: 200 })
  })
  return { fetcher: fetcher as unknown as typeof fetch, requests }
}

function guideRun() {
  return scriptedProvider([plan, section('at-a-glance', 'S1'), section('consolidation', 'S3')])
}

async function readJson(response: Response) {
  return await response.json() as Record<string, unknown>
}

beforeEach(() => { localStorage.clear() })

describe('stages are shaped by the artifact, not by the material', () => {
  it('plans first, then writes one task per section — never a slice of the corpus', async () => {
    const { fetcher, requests } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    await edge.call(startBody)
    await edge.drainQueue()

    const stages = edge.tasks.rows.map((task) => `${task.stage}:${task.task_key}`)
    expect(stages).toContain('inventory:inventory')
    expect(stages).toContain('outline:outline')
    // One task per planned section, keyed by the section, not by a text batch.
    expect(stages).toContain('sections:at-a-glance')
    expect(stages).toContain('sections:consolidation')
    expect(stages).toContain('verify:verify')
    expect(stages).toContain('assemble:assemble')

    // The planning call sees the whole corpus; each section call sees only the
    // passages its plan mapped to it — at full length, never summarised.
    expect(requests[0]).toContain('Encoding transforms')
    expect(requests[0]).toContain('Consolidation stabilises')
    expect(requests[1]).toContain('Encoding transforms')
    expect(requests[1]).not.toContain('Consolidation stabilises')
    expect(requests[2]).toContain('Consolidation stabilises')
  })

  it('produces a coherent artifact in plan order, with verified citations', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))
    await edge.drainQueue()

    const view = await readJson(await edge.call({ action: 'generate-status', jobId: started.jobId }))
    expect(view.status).toBe('succeeded')
    const result = view.result as { artifact: { sections: Array<{ id: string }> }; citations: unknown[] }
    expect(result.artifact.sections.map((entry) => entry.id)).toEqual(['at-a-glance', 'consolidation'])
    expect(result.citations.length).toBeGreaterThan(0)
  })

  it('does not force a question bank through the section pipeline', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher })
    const rejected = await readJson(await edge.call({ ...startBody, specId: 'unit-question-bank-v1' }))
    expect((rejected.error as { code?: string })?.code).toBe('invalid-request')
  })
})

describe('the scheduler owns the build, not the browser', () => {
  it('advances to completion with no client call after the start', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))
    // Nothing between these two lines is a browser. This is the whole point.
    await edge.drainQueue()
    expect(edge.jobs.rows.get(String(started.jobId))?.status).toBe('succeeded')
  })

  it('persists each stage before the next is scheduled', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))

    // One dispatch = one task. After inventory only, no section task exists yet.
    await edge.call({ action: 'run-task' }, { 'x-generation-runner': 'runner-test-only' })
    const job = edge.jobs.rows.get(String(started.jobId))!
    expect(job.inventory).toBeTruthy()
    expect(edge.tasks.rows.some((task) => task.stage === 'sections')).toBe(false)

    await edge.call({ action: 'run-task' }, { 'x-generation-runner': 'runner-test-only' })
    // The plan is persisted, and only now do its section tasks exist.
    expect(edge.jobs.rows.get(String(started.jobId))?.outline).toBeTruthy()
    expect(edge.tasks.rows.filter((task) => task.stage === 'sections')).toHaveLength(2)
  })

  it('resumes from the last completed stage after a worker dies mid-task', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))
    await edge.call({ action: 'run-task' }, { 'x-generation-runner': 'runner-test-only' })
    await edge.call({ action: 'run-task' }, { 'x-generation-runner': 'runner-test-only' })

    // A worker is retired holding a section task: its lease expires unreleased.
    const claimed = edge.tasks.claim({ p_lease_seconds: 100 })!
    expect(claimed.task.stage).toBe('sections')
    const stalled = edge.tasks.rows.find((task) => task.id === claimed.task.id)!
    stalled.lease_expires_at = Date.now() - 1

    await edge.drainQueue()
    // The finished stages were not redone, and the build still completed.
    expect(edge.jobs.rows.get(String(started.jobId))?.status).toBe('succeeded')
    expect(edge.tasks.rows.filter((task) => task.stage === 'inventory')[0].attempts).toBe(1)
    expect(edge.tasks.rows.filter((task) => task.stage === 'outline')[0].attempts).toBe(1)
  })

  it('refuses an unauthenticated runner call', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher })
    const refused = await edge.call({ action: 'run-task' })
    expect(refused.status).toBe(403)
  })
})

describe('quality is preserved across the stage boundary', () => {
  it('sends identical passage text once, but keeps every id citable and reports the repeat', async () => {
    const repeated = [
      ...passages,
      { chunk_id: 'c4', file_id: 'slides', content: 'Encoding transforms incoming information into a form memory can store.' },
    ]
    const { fetcher, requests } = scriptedProvider([
      { sections: [{ id: 'only', title: 'Only', purpose: '', sourceChunkIds: ['S1', 'S4'] }], unusedSources: [{ fileId: 'reading', reason: 'no distinct content' }] },
      section('only', 'S4'),
    ])
    const edge = bootStudyToolsEdge({ chunks: repeated, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    await edge.call(startBody.chunkIds ? { ...startBody, chunkIds: repeated.map((entry) => entry.chunk_id) } : startBody)
    await edge.drainQueue()

    const planning = requests[0]
    const occurrences = planning.split('Encoding transforms incoming information').length - 1
    // Once in the passage payload; the repetition notice names the ids instead.
    expect(occurrences).toBe(1)
    expect(planning).toContain('Repeated passages')
    // The duplicate is still a citable identity: the artifact cited S4.
    const jobs = [...edge.jobs.rows.values()]
    const citations = (jobs[0].result as { citations?: Array<{ chunkId: string }> })?.citations ?? []
    expect(citations.some((citation) => citation.chunkId === 'c4')).toBe(true)
  })

  it('refuses a plan that leaves a selected source neither used nor explained', async () => {
    const { fetcher } = scriptedProvider([
      { sections: [{ id: 'only', title: 'Only', purpose: '', sourceChunkIds: ['S1'] }], unusedSources: [] },
      { sections: [{ id: 'only', title: 'Only', purpose: '', sourceChunkIds: ['S1'] }], unusedSources: [] },
    ])
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher })
    const started = await readJson(await edge.call(startBody))
    await edge.drainQueue()

    const job = edge.jobs.rows.get(String(started.jobId))!
    expect(job.status).toBe('failed')
    expect(String(job.error?.code)).toBe('coverage-incomplete')
    // Nothing was saved, so an entry the student already had is untouched.
    expect(job.result).toBeNull()
  })

  it('refuses a build whose material went missing rather than generating less', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: [passages[0]], fetch: fetcher })
    const refused = await readJson(await edge.call({ ...startBody, chunkIds: ['c1', 'c2', 'c3'] }))
    // Refused before a job is queued, so no quota and no provider call is spent.
    expect((refused.error as { code?: string })?.code).toBe('source-sync-incomplete')
    expect(edge.jobs.rows.size).toBe(0)
  })
})

describe('repair is targeted, and paid work is bounded', () => {
  it('rebuilds only the section verification flagged', async () => {
    const { fetcher, requests } = scriptedProvider([
      plan,
      section('at-a-glance', 'S1'),
      // A forged citation identity: this section alone must be rebuilt.
      { section: { id: 'consolidation', title: 'Consolidation', blocks: [{ id: 'x', type: 'prose', provenance: 'source', text: { content: 'Unsupported.' }, sourceRef: { fileId: 'nope', chunkId: 'nope', start: 0, end: 1 } }] } },
      section('consolidation', 'S3'),
    ])
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))
    await edge.drainQueue()

    const repairs = edge.tasks.rows.filter((task) => task.stage === 'repair')
    expect(repairs).toHaveLength(1)
    expect(repairs[0].task_key).toBe('consolidation')
    // The clean section was not regenerated: four provider calls, not five.
    expect(requests).toHaveLength(4)
    expect(edge.jobs.rows.get(String(started.jobId))?.status).toBe('succeeded')
  })

  it('stops after the attempt budget instead of paying indefinitely', async () => {
    const bad = { section: { id: 'at-a-glance', title: 'x', blocks: [{ id: 'x', type: 'prose', provenance: 'source', text: { content: 'Unsupported.' }, sourceRef: { fileId: 'nope', chunkId: 'nope', start: 0, end: 1 } }] } }
    const { fetcher, requests } = scriptedProvider([plan, bad, bad, bad, bad, bad, bad, bad, bad])
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(startBody))
    await edge.drainQueue()

    expect(edge.jobs.rows.get(String(started.jobId))?.status).toBe('failed')
    for (const task of edge.tasks.rows) expect(task.attempts).toBeLessThanOrEqual(task.max_attempts)
    expect(requests.length).toBeLessThanOrEqual(9)
  })

  it('records an ambiguous timeout as possibly billed rather than assuming it never landed', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const signal = init?.signal
      return await new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    }) as unknown as typeof fetch
    const edge = bootStudyToolsEdge({
      chunks: passages, fetch: fetcher,
      // Tighten every stage's provider ceiling so the deadline fires in-suite.
      env: { GENERATION_STAGE_DEADLINE_MS: '60' },
    })
    const started = await readJson(await edge.call(startBody))
    await edge.drainQueue(6)

    const outline = edge.tasks.rows.find((task) => task.stage === 'outline')
    expect(outline?.ambiguous).toBe(true)
    const job = edge.jobs.rows.get(String(started.jobId))!
    expect(String(job.error?.code)).toBe('provider-timeout-ambiguous')
    expect(String(job.error?.message)).toContain('may have been accepted')
  })
})

describe('provider background capability is proved, never assumed', () => {
  it('stays synchronous until a probe records both submit and retrieve', async () => {
    const { fetcher, requests } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    await edge.call(startBody)
    await edge.drainQueue()
    // No capability row exists, so nothing asked for background mode.
    for (const request of requests) expect(request).not.toContain('"background":true')
  })

  it('records a route that cannot retrieve as unusable, even when submit succeeds', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => (init?.method ?? 'GET') === 'POST'
      ? new Response(JSON.stringify({ id: 'resp_1', status: 'queued' }), { status: 200 })
      : new Response(JSON.stringify({ error: { message: 'not found' } }), { status: 404 })) as unknown as typeof fetch
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher })
    const probe = await readJson(await edge.call({ action: 'probe-background' }))
    expect(probe.backgroundSubmit).toBe(true)
    expect(probe.backgroundRetrieve).toBe(false)
    expect(probe.usable).toBe(false)
    expect(edge.capabilities.get('wallet')?.background_retrieve).toBe(false)
  })

  it('records a route that does both as usable', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => (init?.method ?? 'GET') === 'POST'
      ? new Response(JSON.stringify({ id: 'resp_1', status: 'queued' }), { status: 200 })
      : new Response(JSON.stringify({ id: 'resp_1', status: 'completed', output_text: 'OK' }), { status: 200 })) as unknown as typeof fetch
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher })
    const probe = await readJson(await edge.call({ action: 'probe-background' }))
    expect(probe.usable).toBe(true)
  })
})

describe('measured headroom', () => {
  it('records every task duration, and none approaches the worker lifetime', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    await edge.call(startBody)
    await edge.drainQueue()
    for (const task of edge.tasks.rows) {
      expect(task.duration_ms).not.toBeNull()
      expect(task.duration_ms!).toBeLessThan(130_000)
    }
  })
})

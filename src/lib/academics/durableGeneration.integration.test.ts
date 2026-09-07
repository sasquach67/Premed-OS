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
      {
        sections: [
          { id: 'encoding', title: 'Encoding', purpose: '', sourceChunkIds: ['S1', 'S2', 'S4'] },
          { id: 'consolidation', title: 'Consolidation', purpose: '', sourceChunkIds: ['S3'] },
        ],
        unusedSources: [],
      },
      section('encoding', 'S4'),
      section('consolidation', 'S3'),
    ])
    const edge = bootStudyToolsEdge({ chunks: repeated, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    await edge.call({ ...startBody, chunkIds: repeated.map((entry) => entry.chunk_id) })
    await edge.drainQueue()

    const planning = requests[0]
    const occurrences = planning.split('Encoding transforms incoming information').length - 1
    // Once in the passage payload; the repetition notice names the ids instead.
    expect(occurrences).toBe(1)
    expect(planning).toContain('Repeated passages')

    // The duplicate is still a citable identity: the artifact cited S4.
    const [job] = [...edge.jobs.rows.values()]
    expect(job.status).toBe('succeeded')
    const citations = (job.result as { citations?: Array<{ chunkId: string }> })?.citations ?? []
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

  it('refuses to send a request that sizing says cannot finish, rather than timing out', async () => {
    const { fetcher, requests } = guideRun()
    const edge = bootStudyToolsEdge({
      chunks: passages, fetch: fetcher,
      // A ceiling too small for any real reply. Nothing should be sent.
      env: { GENERATION_STAGE_DEADLINE_MS: '4000' },
    })
    const started = await readJson(await edge.call(startBody))
    await edge.drainQueue(8)

    const job = edge.jobs.rows.get(String(started.jobId))!
    expect(job.status).toBe('failed')
    expect(String(job.error?.code)).toBe('stage-too-large')
    // The point: no provider call was made at all. A queue, an AbortSignal or a
    // retry would not have made it finish, so it was never sent.
    expect(requests).toHaveLength(0)
    // A ceiling this small also forces hierarchical planning, so the survey is
    // what proves unsendable — and it is marked, not retried unchanged.
    expect(job.inventory?.planningMode).toBe('hierarchical')
    expect(edge.tasks.rows.some((task) => task.oversized)).toBe(true)
  })

  it('records an ambiguous timeout as possibly billed, and never repeats it unchanged', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const signal = init?.signal
      return await new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    }) as unknown as typeof fetch
    const edge = bootStudyToolsEdge({
      chunks: passages, fetch: fetcher,
      env: { GENERATION_STAGE_DEADLINE_MS: '3300', ANTHROPIC_API_KEY: undefined },
    })
    // Measured rates from earlier runs say this request is affordable, so it is
    // sent — and then the provider does not answer.
    for (const stage of ['outline', 'survey']) {
      edge.stats.rows.set(`study-guide-v1:${stage}`, {
        spec_id: 'study-guide-v1', stage, samples: 12,
        ms_per_output_token: 0.001, ms_per_kilo_input_char: 0.001, max_ms: 3200,
      })
    }
    const started = await readJson(await edge.call(startBody))
    // Two ticks: inventory, then the first provider stage, which hangs.
    await edge.drainQueue(2)

    const spent = edge.tasks.rows.find((task) => task.ambiguous)
    expect(spent).toBeTruthy()
    expect(spent!.oversized).toBe(true)
    expect(String(spent!.error?.code)).toBe('provider-timeout-ambiguous')
    expect(String(spent!.error?.message)).toContain('may have been accepted')
    expect(started.jobId).toBeTruthy()
    // Every attempt stayed inside its budget; nothing was repeated unchanged.
    for (const task of edge.tasks.rows) expect(task.attempts).toBeLessThanOrEqual(task.max_attempts)
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

/**
 * The parts of the design that only matter when the material is big.
 *
 * A small corpus never exercises them, which is exactly why they are the parts
 * most likely to be wrong. Each test below builds a corpus large enough to
 * force the behaviour rather than asserting it in the abstract.
 */
describe('a corpus too large to plan in one request', () => {
  // Three sources, each far beyond what one planning request can carry.
  const bulk = (fileId: string, count: number, seed: string) =>
    Array.from({ length: count }, (_, index) => ({
      chunk_id: `${fileId}-${index + 1}`,
      file_id: fileId,
      content: `${seed} passage ${index + 1}. ${'Detailed lecture content that must not be summarised away. '.repeat(40)}`,
    }))
  const large = [...bulk('lecture', 30, 'Encoding'), ...bulk('reading', 30, 'Consolidation'), ...bulk('slides', 30, 'Retrieval')]
  const largeStart = { ...startBody, chunkIds: large.map((entry) => entry.chunk_id) }

  const topicsFor = (ids: string[]) => ({
    topics: [{ id: 't1', title: 'Topic', summary: 'A surveyed topic.', sourceChunkIds: ids, qualifications: ['Only in adults'] }],
  })

  it('surveys each source, merges the surveys, and never plans the whole corpus at once', async () => {
    const requests: string[] = []
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      requests.push(body)
      // Detect the stage from what it asked for, not from call order.
      const ids = [...body.matchAll(/\\"chunkId\\":\\"(S\d+)\\"/g)].map((match) => match[1])
      const planned = [...body.matchAll(/\\"sourceChunkIds\\":\[\\"(S\d+)\\"/g)].map((match) => match[1])
      const value = body.includes('Survey only')
        ? topicsFor(ids)
        : { sections: [{ id: 'only', title: 'Only', purpose: '', sourceChunkIds: (ids.length ? ids : planned).slice(0, 40), subpoints: [] }], unusedSources: [] }
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(value) }), { status: 200 })
    }) as unknown as typeof fetch

    const edge = bootStudyToolsEdge({ chunks: large, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(largeStart))
    await edge.drainQueue(30)

    const job = edge.jobs.rows.get(String(started.jobId))!
    expect(job.inventory?.planningMode).toBe('hierarchical')

    // One survey per SOURCE — a coherent unit of the student's material.
    const surveys = edge.tasks.rows.filter((task) => task.stage === 'survey')
    expect(surveys.length).toBeGreaterThanOrEqual(3)
    expect(new Set(surveys.map((task) => String(task.input.fileId))).size).toBe(3)

    // The merge reads topic lists, not the corpus: it is far smaller than any
    // survey, which is what makes hierarchical planning bounded rather than
    // just rearranged.
    const mergeRequest = requests.find((request) => request.includes('Surveyed topics by source'))!
    const surveyRequest = requests.find((request) => request.includes('Survey only'))!
    expect(mergeRequest.length).toBeLessThan(surveyRequest.length)
    expect(mergeRequest).toContain('Surveyed topics by source')
    // Instructor qualifications survive the survey→merge boundary.
    expect(mergeRequest).toContain('Only in adults')

    // The one-pass planner never ran.
    expect(edge.tasks.rows.some((task) => task.stage === 'outline')).toBe(false)
  })

  it('surveys an oversized single source as ordered spans, covering every passage once', async () => {
    const oneHugeSource = bulk('transcript', 60, 'Lecture')
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      const ids = [...body.matchAll(/\\"chunkId\\":\\"(S\d+)\\"/g)].map((match) => match[1])
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(topicsFor(ids)) }), { status: 200 })
    }) as unknown as typeof fetch

    const edge = bootStudyToolsEdge({
      chunks: oneHugeSource, fetch: fetcher,
      // Narrow enough that one source cannot be surveyed in a single request.
      env: { ANTHROPIC_API_KEY: undefined, GENERATION_STAGE_DEADLINE_MS: '20000' },
    })
    await edge.call({ ...startBody, chunkIds: oneHugeSource.map((entry) => entry.chunk_id) })
    await edge.drainQueue(40)

    const spans = edge.tasks.rows.filter((task) => task.stage === 'survey' && task.parent_task_key)
    expect(spans.length).toBeGreaterThan(1)
    // Every passage is surveyed exactly once: nothing dropped, nothing doubled.
    const covered = spans.flatMap((task) => (task.input.passageIds as string[]) ?? [])
    expect(new Set(covered).size).toBe(oneHugeSource.length)
    expect(covered.length).toBe(oneHugeSource.length)
    // The oversized parent was replaced, not retried unchanged.
    const parent = edge.tasks.rows.find((task) => task.stage === 'survey' && !task.parent_task_key)
    expect(parent?.status).toBe('skipped')
    expect(parent?.oversized).toBe(true)
  })
})

describe('a section too large for one request', () => {
  const heavy = Array.from({ length: 18 }, (_, index) => ({
    chunk_id: `c${index + 1}`,
    file_id: 'lecture',
    content: `Passage ${index + 1}. ${'Substantial explanatory content the guide must not lose. '.repeat(60)}`,
  }))

  it('splits along the section’s own subpoints, not into equal slices', async () => {
    const planWithSubpoints = {
      sections: [{
        id: 'memory', title: 'Memory', purpose: 'Explain memory',
        sourceChunkIds: heavy.map((_, index) => `S${index + 1}`),
        subpoints: [
          { id: 'encoding', title: 'Encoding', sourceChunkIds: heavy.slice(0, 6).map((_, index) => `S${index + 1}`) },
          { id: 'storage', title: 'Storage', sourceChunkIds: heavy.slice(6, 12).map((_, index) => `S${index + 7}`) },
          { id: 'retrieval', title: 'Retrieval', sourceChunkIds: heavy.slice(12).map((_, index) => `S${index + 13}`) },
        ],
      }],
      unusedSources: [],
    }
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      const first = [...body.matchAll(/\\"chunkId\\":\\"(S\d+)\\"/g)].map((match) => match[1])[0] ?? 'S1'
      const value = body.includes('Plan only')
        ? planWithSubpoints
        : { section: { id: 'part', title: 'Part', blocks: [{ id: `b-${first}`, type: 'prose', provenance: 'source', text: { content: 'Explained.' }, sourceRef: { citationId: first } }] } }
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(value) }), { status: 200 })
    }) as unknown as typeof fetch

    const edge = bootStudyToolsEdge({
      chunks: heavy, fetch: fetcher,
      // Wide enough to plan (short reply), too narrow to write a whole section.
      env: { ANTHROPIC_API_KEY: undefined, GENERATION_STAGE_DEADLINE_MS: '65000' },
    })
    const started = await readJson(await edge.call({ ...startBody, chunkIds: heavy.map((entry) => entry.chunk_id) }))
    await edge.drainQueue(40)

    const parts = edge.tasks.rows.filter((task) => task.stage === 'sections' && task.parent_task_key)
    expect(parts.length).toBe(3)
    // Named for the section's own divisions, which is what makes the split
    // coherent rather than arbitrary.
    expect(parts.map((task) => task.task_key).sort()).toEqual(['memory::encoding', 'memory::retrieval', 'memory::storage'])

    // The parts reassemble into ONE section: the reader sees no seam.
    const job = edge.jobs.rows.get(String(started.jobId))!
    expect(job.status).toBe('succeeded')
    const artifact = (job.result as { artifact: { sections: Array<{ blocks: unknown[] }> } }).artifact
    expect(artifact.sections).toHaveLength(1)
    expect(artifact.sections[0].blocks.length).toBe(3)
  })
})

describe('a section with no subpoints and many small passages', () => {
  // Content chars are a small fraction of the SERIALISED request: 40 short
  // passages carry ~1.6k of content inside a request many times that size.
  // A per-part budget taken from the request size and applied to content can
  // exceed the whole corpus, yield one span, and leave a task that must get
  // smaller unable to. A live coverage repair failed exactly this way: 109
  // passages, ~17k of content in a 56k-char request, no split, job dead.
  const many = Array.from({ length: 40 }, (_, index) => ({
    chunk_id: `c${index + 1}`,
    file_id: 'lecture',
    content: `Passage ${index + 1}. Short but load-bearing detail.`,
  }))

  it('halves by passage count rather than refusing to divide', async () => {
    const flatPlan = {
      sections: [{
        id: 'coverage', title: 'Coverage', purpose: 'Cover the material',
        sourceChunkIds: many.map((_, index) => `S${index + 1}`),
      }],
      unusedSources: [],
    }
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      const first = [...body.matchAll(/\\"chunkId\\":\\"(S\d+)\\"/g)].map((match) => match[1])[0] ?? 'S1'
      const value = body.includes('Plan only')
        ? flatPlan
        : { section: { id: 'part', title: 'Part', blocks: [{ id: `b-${first}`, type: 'prose', provenance: 'source', text: { content: 'Explained.' }, sourceRef: { citationId: first } }] } }
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(value) }), { status: 200 })
    }) as unknown as typeof fetch

    const edge = bootStudyToolsEdge({
      chunks: many, fetch: fetcher,
      env: { ANTHROPIC_API_KEY: undefined, GENERATION_STAGE_DEADLINE_MS: '65000' },
    })
    await edge.call({ ...startBody, chunkIds: many.map((entry) => entry.chunk_id) })
    await edge.drainQueue(60)

    const parts = edge.tasks.rows.filter((task) => task.stage === 'sections' && task.parent_task_key)
    expect(parts.length).toBeGreaterThan(1)
    // Nothing is dropped by the fallback: the halves partition the passages.
    const covered = parts.flatMap((task) => (task.input.passageIds as string[]) ?? [])
    expect(new Set(covered).size).toBe(many.length)
    expect(covered.length).toBe(many.length)
  })
})

describe('coverage is judged against the original inventory', () => {
  it('repairs passages the plan never accounted for, rather than trusting the plan', async () => {
    const corpus = [
      { chunk_id: 'c1', file_id: 'lecture', content: 'Encoding transforms information.' },
      { chunk_id: 'c2', file_id: 'lecture', content: 'Retrieval reconstructs a trace.' },
      { chunk_id: 'c3', file_id: 'lecture', content: 'Consolidation stabilises a trace during sleep.' },
    ]
    let planned = false
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      let value: unknown
      if (body.includes('Plan only')) {
        // A plan that silently forgets c3 — the file is used, so a file-level
        // check would have called this complete.
        value = { sections: [{ id: 'only', title: 'Only', purpose: '', sourceChunkIds: ['S1', 'S2'], subpoints: [] }], unusedSources: [] }
        planned = true
      } else {
        const first = [...body.matchAll(/\\"chunkId\\":\\"(S\d+)\\"/g)].map((match) => match[1])[0] ?? 'S1'
        value = { section: { id: 'only', title: 'Only', blocks: [{ id: `b-${first}`, type: 'prose', provenance: 'source', text: { content: 'Explained.' }, sourceRef: { citationId: first } }] } }
      }
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(value) }), { status: 200 })
    }) as unknown as typeof fetch

    const edge = bootStudyToolsEdge({ chunks: corpus, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call({ ...startBody, chunkIds: ['c1', 'c2', 'c3'] }))
    await edge.drainQueue(40)

    expect(planned).toBe(true)
    const job = edge.jobs.rows.get(String(started.jobId))!
    // Verification counted the forgotten passage against the inventory.
    expect((job.verification as { unaccountedPassages?: number })?.unaccountedPassages).toBeGreaterThan(0)
    // And scheduled a repair carrying exactly that passage.
    const coverage = edge.tasks.rows.filter((task) => task.stage === 'repair' && task.task_key.startsWith('coverage::'))
    expect(coverage).toHaveLength(1)
    expect(coverage[0].input.passageIds).toEqual(['c3'])
  })
})

describe('a mastery coverage repair spans more than one objective', () => {
  // The repair carries whatever no planned objective accounted for. Demanding
  // exactly one `standard` back made the honest answer unrepresentable: a live
  // Mastery Map build sent 108 forgotten passages into one repair, got a reply
  // that was not a single objective, and failed twice on shape — never on time
  // (78.1s then 79.5s, both well inside budget).
  const corpus = [
    { chunk_id: 'c1', file_id: 'lecture', content: 'Encoding transforms information.' },
    { chunk_id: 'c2', file_id: 'lecture', content: 'Retrieval reconstructs a trace.' },
    { chunk_id: 'c3', file_id: 'lecture', content: 'Random assignment supports causal inference.' },
    { chunk_id: 'c4', file_id: 'lecture', content: 'Operational definitions make constructs measurable.' },
  ]
  const masteryStart = {
    ...startBody, specId: 'unit-mastery-outline-v1', chunkIds: corpus.map((c) => c.chunk_id),
  }

  it('accepts a list of objectives and carries every one into the map', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      let value: unknown
      if (body.includes('Plan only')) {
        // Forgets c3 and c4, so a coverage repair carries both.
        value = { sections: [{ id: 'encoding', title: 'Encoding', purpose: '', sourceChunkIds: ['S1', 'S2'], subpoints: [] }], unusedSources: [] }
      } else if (body.includes('one entry per objective')) {
        // The repair: the leftover passages support two distinct objectives.
        value = { standards: [
          { id: 'causal', unit: 'Unit 1', title: 'Causal inference', objective: 'Explain random assignment', sourceChunkIds: ['S3'] },
          { id: 'operational', unit: 'Unit 1', title: 'Operational definitions', objective: 'Define constructs measurably', sourceChunkIds: ['S4'] },
        ] }
      } else {
        value = { standard: { id: 'encoding', unit: 'Unit 1', title: 'Encoding', objective: 'Explain encoding', sourceChunkIds: ['S1'] } }
      }
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(value) }), { status: 200 })
    }) as unknown as typeof fetch

    const edge = bootStudyToolsEdge({ chunks: corpus, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    const started = await readJson(await edge.call(masteryStart))
    await edge.drainQueue(60)

    const coverage = edge.tasks.rows.filter((task) => task.stage === 'repair' && task.task_key.startsWith('coverage::'))
    expect(coverage).toHaveLength(1)
    // The repair is asked for a list, and the list is accepted.
    expect(coverage[0].status).toBe('done')
    expect(coverage[0].error).toBeNull()

    const job = edge.jobs.rows.get(String(started.jobId))!
    expect(job.status).toBe('succeeded')
    const artifact = (job.result as { artifact: { standards: Array<{ id?: string }> } }).artifact
    // Flattened: the planned objective plus BOTH recovered ones, not a nested list.
    expect(artifact.standards.map((entry) => entry.id).sort()).toEqual(['causal', 'encoding', 'operational'])
  })

  it('says what shape came back when a piece is unusable', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = String(init?.body ?? '')
      const value = body.includes('Plan only')
        ? { sections: [{ id: 'encoding', title: 'Encoding', purpose: '', sourceChunkIds: ['S1'], subpoints: [] }], unusedSources: [] }
        : { paragraphs: ['neither a standard nor a standards list'] }
      return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(value) }), { status: 200 })
    }) as unknown as typeof fetch

    const edge = bootStudyToolsEdge({ chunks: corpus, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    await edge.call(masteryStart)
    await edge.drainQueue(60)

    const failed = edge.tasks.rows.find((task) => task.status === 'failed' && (task.error as { code?: string })?.code === 'invalid-response')
    expect(failed, 'an unusable reply must fail loudly').toBeTruthy()
    // Diagnosable from the row alone — no rerun needed to learn what arrived.
    const issues = (failed!.error as { issues?: string[] }).issues ?? []
    expect(issues.join(' ')).toContain('received: paragraphs')
  })
})

describe('measurement replaces guessing', () => {
  it('records what each stage actually cost, per stage', async () => {
    const { fetcher } = guideRun()
    const edge = bootStudyToolsEdge({ chunks: passages, fetch: fetcher, env: { ANTHROPIC_API_KEY: undefined } })
    await edge.call(startBody)
    await edge.drainQueue()

    // Planning and writing have opposite shapes, so their rates are kept apart.
    expect(edge.stats.get('study-guide-v1', 'outline')).toBeTruthy()
    expect(edge.stats.get('study-guide-v1', 'sections')).toBeTruthy()
    for (const task of edge.tasks.rows.filter((entry) => entry.input_chars)) {
      expect(task.estimated_ms).toBeGreaterThan(0)
      expect(task.output_tokens).toBeGreaterThan(0)
    }
  })
})

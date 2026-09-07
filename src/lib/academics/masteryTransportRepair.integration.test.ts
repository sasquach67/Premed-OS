/**
 * Mastery Map repair, against the real Edge handler and the real scheduler.
 *
 * A Mastery Map's unit of work is an objective, so its pipeline plans the
 * objectives first and develops each one in its own task. A plan that names no
 * objectives is refused — and the retry has to carry Mastery-specific guidance,
 * or the model is told only "that was invalid" and returns the same empty map.
 *
 * The queue below stands in for pg_cron. The client never advances the build:
 * it starts it, then watches, exactly as in production.
 */
import { beforeEach, expect, it, vi } from 'vitest'
import { bootStudyToolsEdge } from './edgeStudyToolsHarness.testing'
import { generateUnitMasteryOutline } from './generateUnitMasteryOutline'
import type { SourceChunk } from '../types'

const proxy = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('../intelligence/studyTools', async (importOriginal) => {
  const original = await importOriginal<typeof import('../intelligence/studyTools')>()
  return { ...original, studyTools: original.createStudyToolsClient({
    auth: { getSession: async () => ({ data: { session: {} } }) },
    functions: { invoke: proxy.invoke },
  } as never, { sleep: async () => {} }) }
})

const source = { id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', topicId: 'topic-1', content: 'Encoding transforms incoming information into a form memory can store.' } as SourceChunk

const emptyPlan = { sections: [], unusedSources: [] }
const objectivePlan = {
  sections: [{ id: 'objective-1', title: 'Study objective: Explain encoding', purpose: 'Explain encoding', sourceChunkIds: ['S1'] }],
  unusedSources: [],
}
const objective = {
  standard: {
    id: 'objective-1', title: 'Study objective: Explain encoding',
    freeRecallCues: ['Explain how encoding transforms information without notes.'],
    understand: [source.content], beAbleToDo: [], watchFor: [], examPractice: [],
    sourceChunkIds: ['S1'],
    evidenceLimit: 'The selected passage defines encoding but provides no worked examples or further mechanisms.',
  },
}

function routeThroughEdge(outputs: unknown[]) {
  const requests: string[] = []
  const provider = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push(String(init?.body ?? ''))
    return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(outputs.shift() ?? emptyPlan) }), { status: 200 })
  })
  const edge = bootStudyToolsEdge({
    chunks: [{ chunk_id: source.id, file_id: source.fileId, content: source.content }],
    fetch: provider as unknown as typeof fetch,
    env: { ANTHROPIC_API_KEY: undefined },
  })
  // Every client call is also a moment at which the scheduler has been running.
  proxy.invoke.mockImplementation(async (_name: string, options: { body: { action?: string } }) => {
    if (options.body.action === 'generate-status') await edge.drainQueue(12)
    const response = await edge.call(options.body)
    const body = await response.clone().json()
    return response.ok ? { data: body, error: null } : { data: null, error: { context: response } }
  })
  return { provider, requests, edge }
}

beforeEach(() => { proxy.invoke.mockReset(); localStorage.clear(); vi.spyOn(window, 'confirm').mockReturnValue(true) })

it('repairs a rejected empty objective plan with Mastery-specific guidance', async () => {
  const { requests, edge } = routeThroughEdge([emptyPlan, objectivePlan, objective])
  const result = await generateUnitMasteryOutline({ courseId: source.courseId, chunks: [source], unit: 'Psychology', label: 'Memory' })

  expect(result.ok).toBe(true)
  expect(result.artifact?.standards[0].sourceChunkIds).toEqual(['chunk-1'])

  // The planning retry carried the artifact's own requirements, not just
  // "that was invalid" — which is what makes an empty map recoverable.
  expect(requests[1]).toContain('Return a nonempty standards array')
  expect(requests[1]).toContain('evidenceLimit')
  // One plan retry, then one objective task. Paid work stayed bounded.
  expect(requests).toHaveLength(3)
  const outline = edge.tasks.rows.filter((task) => task.stage === 'outline')
  expect(outline[0].attempts).toBe(2)
})

it('stops after the attempt budget when the plan is still empty', async () => {
  const { requests, edge } = routeThroughEdge([emptyPlan, emptyPlan, emptyPlan])
  const result = await generateUnitMasteryOutline({ courseId: source.courseId, chunks: [source], unit: 'Psychology', label: 'Memory' })

  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(requests).toHaveLength(2)
  const [job] = [...edge.jobs.rows.values()]
  expect(job.status).toBe('failed')
  // Nothing partial was persisted, so a previously saved map is untouched.
  expect(job.result).toBeNull()
})

/**
 * Mastery Map repair, against the real Edge handler.
 *
 * An empty objectives array has no citations, so the Edge refuses it before the
 * caller can inspect its shape. The rebuild therefore has to carry Mastery-
 * specific guidance, or the model is told only "cite correctly" and returns the
 * same empty map. That repair now happens server-side inside one durable job,
 * where the attempt budget is enforced — so this also pins the bound: one
 * rebuild, then a real refusal, never an open-ended paid retry loop.
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
const empty = { title: 'Memory', unit: 'Psychology', standards: [] }
const valid = { ...empty, standards: [{ id: 'objective-1', title: 'Study objective: Explain encoding',
  freeRecallCues: ['Explain how encoding transforms information without notes.'], understand: [source.content],
  beAbleToDo: [], watchFor: [], examPractice: [], sourceChunkIds: ['S1'],
  evidenceLimit: 'The selected passage defines encoding but provides no worked examples or further mechanisms.',
}] }

function routeThroughEdge(outputs: unknown[]) {
  const requests: string[] = []
  const provider = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'POST') {
      requests.push(String(init?.body ?? ''))
      return new Response(JSON.stringify({ id: `resp_${requests.length}`, status: 'queued' }), { status: 200 })
    }
    return new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(outputs.shift() ?? empty) }), { status: 200 })
  })
  const edge = bootStudyToolsEdge({
    chunks: [{ chunk_id: source.id, file_id: source.fileId, content: source.content }],
    fetch: provider as unknown as typeof fetch,
  })
  proxy.invoke.mockImplementation(async (_name: string, options: { body: unknown }) => {
    const response = await edge.call(options.body)
    const body = await response.clone().json()
    return response.ok ? { data: body, error: null } : { data: null, error: { context: response } }
  })
  return { provider, requests, edge }
}

beforeEach(() => { proxy.invoke.mockReset(); localStorage.clear(); vi.spyOn(window, 'confirm').mockReturnValue(true) })

it('repairs a real Edge rejection of empty objectives with Mastery-specific guidance', async () => {
  const { requests, edge } = routeThroughEdge([empty, valid])
  const result = await generateUnitMasteryOutline({ courseId: source.courseId, chunks: [source], unit: 'Psychology', label: 'Memory' })

  expect(result.ok).toBe(true)
  expect(result.artifact?.standards[0].sourceChunkIds).toEqual(['chunk-1'])
  // Exactly one rebuild, inside one job, with the artifact's own requirements.
  expect(requests).toHaveLength(2)
  expect(edge.jobs.rows.size).toBe(1)
  expect(requests[1]).toContain('Return a nonempty standards array')
  expect(requests[1]).toContain('evidenceLimit')

  // The rebuild reuses the same evidence and the same assembled specification.
  const bodies = requests.map(request => JSON.parse(request) as { input: Array<{ content: Array<{ text: string }> }> })
  expect(bodies[1].input[0].content[0].text).toBe(bodies[0].input[0].content[0].text)
})

it('stops after one repair when the Edge still rejects empty objectives', async () => {
  const { requests, edge } = routeThroughEdge([empty, empty])
  const result = await generateUnitMasteryOutline({ courseId: source.courseId, chunks: [source], unit: 'Psychology', label: 'Memory' })

  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(requests).toHaveLength(2)
  const [job] = [...edge.jobs.rows.values()]
  expect(job.provider_attempts).toBe(2)
  expect(job.status).toBe('failed')
})

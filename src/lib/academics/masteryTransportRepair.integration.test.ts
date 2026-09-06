import * as astraWalletRoute from '../../../supabase/functions/_shared/astraWalletRoute'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { beforeEach, expect, it, vi } from 'vitest'
import * as responseBoundary from '../../../supabase/functions/_shared/openAIGenerationResponse'
import * as citationWire from '../../../supabase/functions/_shared/openAICitationWire'
import * as grounding from '../../../supabase/functions/_shared/openAIGenerationGrounding'
import { generateUnitMasteryOutline } from './generateUnitMasteryOutline'
import type { SourceChunk } from '../types'

const proxy = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('../intelligence/studyTools', async (importOriginal) => {
  const original = await importOriginal<typeof import('../intelligence/studyTools')>()
  return { ...original, studyTools: original.createStudyToolsClient({
    auth: { getSession: async () => ({ data: { session: {} } }) },
    functions: { invoke: proxy.invoke },
  } as never) }
})

const source = { id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', topicId: 'topic-1', content: 'Encoding transforms incoming information into a form memory can store.' } as SourceChunk
const empty = { title: 'Memory', unit: 'Psychology', standards: [] }
const valid = { ...empty, standards: [{ id: 'objective-1', title: 'Study objective: Explain encoding',
  freeRecallCues: ['Explain how encoding transforms information without notes.'], understand: [source.content],
  beAbleToDo: [], watchFor: [], examPractice: [], sourceChunkIds: ['S1'],
  evidenceLimit: 'The selected passage defines encoding but provides no worked examples or further mechanisms.',
}] }

function routeThroughEdge(outputs: unknown[]) {
  let handler!: (request: Request) => Promise<Response>
  const query = { select() { return this }, eq() { return this }, in() { return this },
    limit: async () => ({ data: [{ chunk_id: source.id, file_id: source.fileId, content: source.content }], error: null }),
    upsert: vi.fn(async () => ({ error: null })),
  }
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'user' } }, error: null }) },
    from: () => query, rpc: async () => ({ data: { allowed: true, reason: 'allowed', reservation_cents: 0 }, error: null }),
  }
  const provider = vi.fn(async () => new Response(JSON.stringify({ status: 'completed', output_text: JSON.stringify(outputs.shift() ?? empty) })))
  const compiled = ts.transpileModule(readFileSync('supabase/functions/study-tools/index.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const requireStub = (id: string) => id.startsWith('npm:') ? { createClient: () => client }
    : id.includes('astraWalletRoute') ? astraWalletRoute : id.includes('openAIGenerationResponse') ? responseBoundary : id.includes('openAICitationWire') ? citationWire : grounding
  const deno = { env: { get: (key: string) => ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'].includes(key) ? 'test-only' : undefined },
    serve: (fn: typeof handler) => { handler = fn },
  }
  new Function('require', 'exports', 'Deno', 'fetch', compiled)(requireStub, {}, deno, provider)
  const responses: Array<{ status: number; code?: string }> = []
  proxy.invoke.mockImplementation(async (_name: string, options: { body: unknown }) => {
    const response = await handler(new Request('https://local.invalid/study-tools', {
      method: 'POST', headers: { Authorization: 'Bearer test-only' }, body: JSON.stringify(options.body),
    }))
    const body = await response.clone().json()
    responses.push({ status: response.status, code: body.error?.code })
    return response.ok ? { data: body, error: null } : { data: null, error: { context: response } }
  })
  return { provider, responses, query }
}

beforeEach(() => { proxy.invoke.mockReset(); localStorage.clear(); vi.spyOn(window, 'confirm').mockReturnValue(true) })

it('repairs a real Edge rejection of empty objectives with Mastery-specific guidance', async () => {
  const { provider, responses, query } = routeThroughEdge([empty, valid])
  const result = await generateUnitMasteryOutline({ courseId: source.courseId, chunks: [source], unit: 'Psychology', label: 'Memory' })
  expect(responses).toContainEqual({ status: 422, code: 'no-verified-citations' })
  expect(result.ok).toBe(true)
  expect(provider).toHaveBeenCalledTimes(2)
  expect(query.upsert).toHaveBeenCalledTimes(1)
  const calls = proxy.invoke.mock.calls.map(call => call[1].body).filter(body => body.action === 'generate')
  expect(calls[1].request).toContain('Return a nonempty standards array')
  expect(calls[1].request).toContain('evidenceLimit')
  expect(calls[1].chunkIds).toEqual(calls[0].chunkIds)
  expect(calls[1].systemPrompt).toBe(calls[0].systemPrompt)
  expect(result.artifact?.standards[0].sourceChunkIds).toEqual(['chunk-1'])
})

it('stops after one repair when the Edge still rejects empty objectives', async () => {
  const { provider, query } = routeThroughEdge([empty, empty])
  const result = await generateUnitMasteryOutline({ courseId: source.courseId, chunks: [source], unit: 'Psychology', label: 'Memory' })
  expect(result.ok).toBe(false)
  expect(result.artifact).toBeUndefined()
  expect(provider).toHaveBeenCalledTimes(2)
  expect(query.upsert).toHaveBeenCalledTimes(1)
})

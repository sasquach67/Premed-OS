import * as generationJobs from '../../../supabase/functions/_shared/generationJobs'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, it, vi } from 'vitest'

function edgeWithQuota(allowed = true) {
  let handler!: (request: Request) => Promise<Response>
  const rpc = vi.fn(async () => ({ data: {
    allowed, reason: allowed ? 'allowed' : 'weekly-budget-limit',
    reservation_cents: allowed ? 300 : 0, reset_at: allowed ? null : '2026-09-07T00:00:00Z',
  }, error: null }))
  const query = {
    select() { return this }, eq() { return this }, in() { return this },
    limit: async () => ({ data: [{ chunk_id: 'chunk', file_id: 'file', content: 'Source text.' }], error: null }),
  }
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'user' } }, error: null }) }, from: () => query, rpc }
  const source = readFileSync('supabase/functions/study-tools/index.ts', 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const requireStub = (id: string) => id.startsWith('npm:') ? { createClient: () => client }
    : id.includes('generationJobs') ? generationJobs : {}
  const deno = { env: { get: () => 'test-only' }, serve: (fn: typeof handler) => { handler = fn } }
  const providerFetch = vi.fn(() => { throw new Error('Provider must not be called') })
  new Function('require', 'exports', 'Deno', 'fetch', compiled)(requireStub, {}, deno, providerFetch)
  const request = (systemPrompt: unknown) => handler(new Request('https://local.invalid/study-tools', {
    method: 'POST', headers: { Authorization: 'Bearer test-only' },
    body: JSON.stringify({ action: 'generate', courseId: 'course', topicId: 'topic', chunkIds: ['chunk'], specId: 'study-guide-v1', systemPrompt }),
  }))
  return { request, rpc, providerFetch }
}

describe('Study generation budget preflight', () => {
  it.each(['', '   ', undefined])('does not reserve budget for an absent assembled prompt: %s', async prompt => {
    const { request, rpc, providerFetch } = edgeWithQuota()
    const response = await request(prompt)
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'invalid-request' } })
    expect(rpc).not.toHaveBeenCalled()
    expect(providerFetch).not.toHaveBeenCalled()
  })

  it('explains the shared reservation cap without calling it measured provider spend', async () => {
    const { request, rpc, providerFetch } = edgeWithQuota(false)
    const response = await request('Assembled generation instructions')
    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({ error: {
      code: 'weekly-budget-limit',
      message: expect.stringContaining('conservative reservations'),
      resetAt: '2026-09-07T00:00:00Z',
    } })
    expect(rpc).toHaveBeenCalledWith('claim_ai_request_v2', expect.objectContaining({ p_reserved_cents: 300 }))
    expect(providerFetch).not.toHaveBeenCalled()
  })
})

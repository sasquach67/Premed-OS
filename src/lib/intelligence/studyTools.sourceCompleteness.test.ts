import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, it, vi } from 'vitest'

// Execute the actual Edge handler with only its external dependencies replaced.
// No Supabase instance, credentials, quota reservation, or model call is used.
function handlerWithRows(rows: Array<{ chunk_id: string; file_id: string; content: string }>) {
  let handler!: (request: Request) => Promise<Response>
  const rpc = vi.fn(async () => ({ data: null, error: { message: 'quota must not run for missing sources' } }))
  const query = {
    select() { return this }, eq() { return this }, in() { return this },
    limit: vi.fn(async () => ({ data: rows, error: null })),
  }
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'user' } }, error: null }) }, from: () => query, rpc }
  const source = readFileSync('supabase/functions/study-tools/index.ts', 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const requireStub = (id: string) => id.startsWith('npm:') ? { createClient: () => client } : {}
  const deno = { env: { get: () => 'test-only' }, serve: (fn: typeof handler) => { handler = fn } }
  new Function('require', 'exports', 'Deno', compiled)(requireStub, {}, deno)
  return { handler, rpc }
}

describe('Notebook source completeness at the Edge handler', () => {
  it.each(['study-guide-v1', 'unit-mastery-outline-v1', 'notebook-assignment-v1'])('rejects a partial source mirror before quota/provider work for %s', async (specId) => {
    const { handler, rpc } = handlerWithRows([{ chunk_id: 'first', file_id: 'file', content: 'Available text.' }])
    const response = await handler(new Request('https://local.invalid/study-tools', {
      method: 'POST', headers: { Authorization: 'Bearer test-only' },
      body: JSON.stringify({ action: 'generate', courseId: 'course', topicId: 'topic', chunkIds: ['first', 'missing'], specId, systemPrompt: 'test' }),
    }))
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ error: { code: 'source-sync-incomplete' } })
    expect(rpc).not.toHaveBeenCalled()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { createStudyToolsClient } from './studyTools'
import { generateWithSourceRecovery } from '../academics/syncGenerationSources'
import type { SourceChunk } from '../types'

const request = { action: 'generate' as const, courseId: 'course-1', topicId: 'topic-1', chunkIds: ['chunk-1'], specId: 'study-guide-v1', specHash: 'hash', systemPrompt: 'spec', request: 'Generate a guide.' }

describe('Notebook generation reliability: source versus output failure', () => {
  it('does not recopy valid source material when the model returns no verified citations', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const invoke = vi.fn(async (_name: string, options: { body: { action: string } }) => options.body.action === 'sync-sources'
      ? { data: { synced: 1 }, error: null }
      : { data: null, error: { context: new Response(JSON.stringify({ error: { code: 'no-verified-citations', message: 'No citation from the generated artifact could be verified against your material.' } }), { status: 422 }) } })
    const client = createStudyToolsClient({ auth: { getSession: async () => ({ data: { session: {} } }) }, functions: { invoke } } as never)
    const result = await generateWithSourceRecovery('course-1', [{ id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', topicId: 'topic-1', content: 'A readable psychology source.' } as SourceChunk], request, {}, client)
    expect(result).toMatchObject({ ok: false, code: 'citation-not-carried' })
    expect(invoke.mock.calls.filter(([, options]) => options.body.action === 'sync-sources')).toHaveLength(0)
  })
})

it('restores an incomplete server mirror once, then uses the exact selected source boundary', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  let attempts = 0
  const invoke = vi.fn(async (_name: string, options: { body: { action: string } }) => {
    if (options.body.action === 'sync-sources') return { data: { synced: 1 }, error: null }
    attempts++
    return attempts === 1
      ? { data: null, error: { context: new Response(JSON.stringify({ error: { code: 'source-sync-incomplete' } }), { status: 422 }) } }
      : { data: { artifact: {}, citations: [], auditStatus: 'skipped' }, error: null }
  })
  const client = createStudyToolsClient({ auth: { getSession: async () => ({ data: { session: {} } }) }, functions: { invoke } } as never)
  const result = await generateWithSourceRecovery('course-1', [{ id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', topicId: 'topic-1', content: 'A readable psychology source.' } as SourceChunk], request, {}, client)
  expect(result.ok).toBe(true)
  expect(attempts).toBe(2)
  expect(invoke.mock.calls.filter(([, options]) => options.body.action === 'sync-sources')).toHaveLength(1)
  expect(invoke.mock.lastCall?.[1].body).toMatchObject({ chunkIds: ['chunk-1'], topicId: 'topic-1' })
})

it('does not retry an unknown 422 as though source material were missing', async () => {
  const invoke = vi.fn(async () => ({ data: null, error: { context: new Response(JSON.stringify({ error: { code: 'future-validation-error' } }), { status: 422 }) } }))
  const client = createStudyToolsClient({ auth: { getSession: async () => ({ data: { session: {} } }) }, functions: { invoke } } as never)
  const result = await generateWithSourceRecovery('course-1', [], request, {}, client)
  expect(result).toMatchObject({ ok: false, code: 'invalid-response' })
  expect(invoke).toHaveBeenCalledTimes(1)
})


it('carries every bounded reviewer issue into the repair request', async () => {
  const issues = ['Unsupported claim one', 'Missing source two', 'Invalid structure three']
  const invoke = vi.fn(async () => ({ data: null, error: { context: new Response(JSON.stringify({ error: { code: 'audit-rejected', issues } }), { status: 502 }) } }))
  const client = createStudyToolsClient({ auth: { getSession: async () => ({ data: { session: {} } }) }, functions: { invoke } } as never)
  const result = await generateWithSourceRecovery('course-1', [], request, {}, client)
  expect(result.ok).toBe(false)
  const body = (invoke.mock.calls as unknown as Array<[string, { body: { request: string } }]>)[1][1].body
  for (const issue of issues) expect(body.request).toContain(issue)
  expect(invoke).toHaveBeenCalledTimes(2)
})

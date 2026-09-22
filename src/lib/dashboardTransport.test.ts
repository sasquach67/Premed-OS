// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createDashboardFetch } from './dashboardTransport'

const url = 'https://example.supabase.co'
const invalid = (v: unknown): boolean => typeof v === 'string' ? v.includes('\u0000') || /[\uD800-\uDFFF]/u.test(v)
  : !!v && typeof v === 'object' && Object.entries(v).some(([k, x]) => invalid(k) || invalid(x))

describe('dashboard JSONB transport', () => {
  it('round-trips imported nulls and lone surrogates through actual SDK writes and reads without modifying source text', async () => {
    const data = { courses: [], profile: {}, settings: {}, source: 'first\u0000floor', history: ['\ud800', '\udfff', '🧬', String.raw`\u0000`], '\u0000key': 'kept' }
    const before = JSON.stringify(data)
    let stored: unknown
    const transport = vi.fn<typeof fetch>(async (input, init) => {
      const req = new Request(input, init)
      if (req.method === 'PATCH') {
        stored = (await req.json()).data
        if (invalid(stored)) return Response.json({ message: 'unsupported Unicode escape sequence', code: '22P05' }, { status: 400 })
      }
      return Response.json([{ user_id: 'synthetic', data: stored, updated_at: 'same-revision' }])
    })
    const client = createClient(url, 'synthetic-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: createDashboardFetch(url, transport) } })
    const write = await client.from('dashboards').update({ data }).eq('user_id', 'synthetic').select()
    expect(write.error).toBeNull()
    expect(write.data?.[0].data).toEqual(data)
    const read = await client.from('dashboards').select('*')
    expect(read.data?.[0].data).toEqual(data)
    expect(JSON.stringify(data)).toBe(before)
    expect(invalid(stored)).toBe(false)
  })

  it('leaves ordinary dashboard data and other endpoints unchanged', async () => {
    const data = { courses: [], source: 'normal 🧬 text', literal: String.raw`\u0000` }
    const transport = vi.fn<typeof fetch>(async (input, init) => {
      const req = new Request(input, init)
      const body = await req.json()
      expect(body).toEqual({ data })
      return Response.json({ data, updated_at: 'version' })
    })
    const fetcher = createDashboardFetch(url, transport)
    const res = await fetcher(`${url}/rest/v1/dashboards?user_id=eq.synthetic`, { method: 'PATCH', body: JSON.stringify({ data }) })
    expect(await res.json()).toEqual({ data, updated_at: 'version' })
    const outside = vi.fn<typeof fetch>().mockResolvedValue(new Response('unchanged'))
    const request = new Request(`${url}/storage/v1/object/file`, { method: 'POST', body: 'raw bytes' })
    await createDashboardFetch(url, outside)(request)
    expect(outside).toHaveBeenCalledWith(request, undefined)
  })

  it('does not alter errors or empty write acknowledgements', async () => {
    for (const response of [Response.json({ message: 'conflict' }, { status: 409 }), new Response(null, { status: 204 })]) {
      const fetcher = createDashboardFetch(url, vi.fn<typeof fetch>().mockResolvedValue(response))
      expect(await fetcher(`${url}/rest/v1/dashboards`)).toBe(response)
    }
  })
})

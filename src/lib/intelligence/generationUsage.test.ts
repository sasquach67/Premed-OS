import { describe, expect, it, vi } from 'vitest'
import { trackedGenerationFetch, usageFields, type UsageService } from '../../../supabase/functions/_shared/generationUsage'
function database(failInsert = false) {
  const rows: Record<string, unknown>[] = []
  return { rows, service: { from: () => {
    const query = (op: 'insert' | 'select' | 'update', value: Record<string, unknown> = {}) => {
      const filters: [string, unknown][] = []
      const q = { eq(k: string, v: unknown) { filters.push([k,v]); return q }, select() { return q }, limit() { return q }, then(resolve: (v: unknown) => unknown) {
        if (op === 'insert') { if (failInsert) return Promise.resolve(resolve({ error: 'offline' })); rows.push(value) }
        const matching = rows.filter(row => filters.every(([k,v]) => row[k] === v))
        if (op === 'update') matching.forEach(row => Object.assign(row, value))
        return Promise.resolve(resolve({ data: matching, error: null }))
      } }
      return q
    }
    return { insert: (v: Record<string, unknown>) => query('insert',v), update: (v: Record<string, unknown>) => query('update',v), select: () => query('select') }
  } } as unknown as UsageService }
}
const task = { id: 'task', job_id: 'job', stage: 'section' }
const usage = { input_tokens: 1000, output_tokens: 100, input_tokens_details: { cached_tokens: 600, cache_write_tokens: 100 }, output_tokens_details: { reasoning_tokens: 20 } }
describe('generation usage', () => {
  it('prices actual token buckets without the conservative budget multiplier or double-counting reasoning', () => {
    expect(usageFields('openai','gpt-6-astra',usage)).toMatchObject({ input_tokens:1000, output_tokens:100, cached_input_tokens:600, cache_write_tokens:100, reasoning_tokens:20, estimated_usd:0.00985 })
    expect(usageFields('openai','gpt-6-astra',{ ...usage, input_tokens_details:{} }).estimated_usd).toBeNull()
    expect(usageFields('cheaper-inference','gpt-6-astra',usage).estimated_usd).toBeNull()
    expect(usageFields('anthropic','claude-opus-5',{input_tokens:10,output_tokens:20}).estimated_usd).toBeNull()
  })
  it('does not send paid work if the pending record cannot be written', async () => {
    const db = database(true), fetcher = vi.fn<typeof fetch>()
    await expect(trackedGenerationFetch(db.service,task,fetcher)('https://api.openai.com/v1/responses',{method:'POST'})).rejects.toThrow('No provider request')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('updates the submitted response on polling without counting it twice or retaining study text', async () => {
    const db = database(); const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify({id:'resp_1',status:'queued'}))).mockResolvedValueOnce(new Response(JSON.stringify({id:'resp_1',status:'completed',usage,output:'private answer'})))
    const send=trackedGenerationFetch(db.service,task,fetcher)
    await send('https://api.openai.com/v1/responses',{method:'POST',body:JSON.stringify({model:'gpt-6-astra',input:'private source'})})
    await send('https://api.openai.com/v1/responses/resp_1',{method:'GET'})
    expect(db.rows).toHaveLength(1); expect(db.rows[0]).toMatchObject({status:'completed',output_tokens:100,estimated_usd:0.00985})
    expect(JSON.stringify(db.rows)).not.toContain('private')
  })
  it('retains an unknown record after transport failure and records usage before downstream validation', async () => {
    const db=database(); const fail=trackedGenerationFetch(db.service,task,vi.fn<typeof fetch>().mockRejectedValue(new Error('timeout')))
    await expect(fail('https://api.cheaperinference.com/v1/responses',{method:'POST'})).rejects.toThrow('timeout')
    expect(db.rows[0].status).toBe('unknown')
    const send=trackedGenerationFetch(db.service,task,vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({status:'incomplete',usage}))))
    await send('https://api.openai.com/v1/responses',{method:'POST',body:JSON.stringify({model:'gpt-6-astra'})})
    expect(db.rows[1]).toMatchObject({status:'incomplete',output_tokens:100})
  })
})

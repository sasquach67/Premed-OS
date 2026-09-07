/** Recorded provider token counts, never inferred from prompt characters or budget reservations. */
type Row = Record<string, unknown>
const object = (v: unknown): Row => v && typeof v === 'object' && !Array.isArray(v) ? v as Row : {}
const count = (v: unknown): number | null => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null
export function usageFields(provider: string, model: string | null, value: unknown) {
  const u = object(value); const details = object(u.input_tokens_details); const output = object(u.output_tokens_details)
  const input = count(u.input_tokens), completion = count(u.output_tokens)
  const cached = count(provider === 'anthropic' ? u.cache_read_input_tokens : details.cached_tokens)
  const writes = count(provider === 'anthropic' ? u.cache_creation_input_tokens : details.cache_write_tokens)
  // A missing breakdown stays unknown. Cached tokens are never treated as ordinary input.
  const complete = input !== null && completion !== null && cached !== null && writes !== null && cached + writes <= input
  const priced = provider === 'openai' && model === 'gpt-6-astra' && complete
  const long = input !== null && input > 272_000
  const estimated = priced ? ((input! - cached! - writes!) * (long ? 20 : 10) + cached! * (long ? 2 : 1) + writes! * (long ? 25 : 12.5) + completion! * (long ? 75 : 50)) / 1_000_000 : null
  return { input_tokens: input, output_tokens: completion, cached_input_tokens: cached, cache_write_tokens: writes, reasoning_tokens: count(output.reasoning_tokens), estimated_usd: estimated, pricing_basis: priced ? 'openai-astra-standard-2026-09-07-estimate' : 'unknown' }
}
// Supabase's query builder is deliberately injected, avoiding a runtime SDK dependency here.
type Result = { error: unknown; data?: unknown }
type Query = PromiseLike<Result> & { eq(key: string, value: unknown): Query; select(columns: string): Query; limit(n: number): Query }
export type UsageService = { from(table: string): { insert(row: Row): Query; update(row: Row): Query; select(columns: string): Query } }
export function trackedGenerationFetch(service: UsageService, task: { id?: string; job_id?: string; stage: string; user_id?: string; request_group_id?: string }, fetcher: typeof fetch): typeof fetch {
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    const provider = url.hostname === 'api.openai.com' ? 'openai' : url.hostname === 'api.cheaperinference.com' ? 'cheaper-inference' : url.hostname === 'api.anthropic.com' ? 'anthropic' : null
    if (!provider) return fetcher(input, init)
    const get = (init?.method ?? 'GET') === 'GET'
    let payload: Row = {}
    if (typeof init?.body === 'string') { try { payload = object(JSON.parse(init.body)) } catch { /* no request body is retained */ } }
    let model = typeof payload.model === 'string' ? payload.model : null
    let id = crypto.randomUUID() as string
    if (get) {
      const responseId = decodeURIComponent(url.pathname.split('/').at(-1) ?? '')
      const found = await service.from('study_generation_usage').select('id,model').eq('provider', provider).eq('response_id', responseId).eq('task_id', task.id).limit(1)
      const row = Array.isArray(found.data) ? object(found.data[0]) : {}
      if (typeof row.id !== 'string') return fetcher(input, init) // Historical submissions have no reliable usage row.
      id = row.id; model = typeof row.model === 'string' ? row.model : null
    } else {
      const started = await service.from('study_generation_usage').insert({ id, job_id: task.job_id ?? null, task_id: task.id ?? null, user_id: task.user_id ?? null, request_group_id: task.request_group_id ?? null, stage: task.stage, provider, model, status: 'pending' })
      if (started.error) throw new Error('Usage tracking is unavailable. No provider request was sent.')
    }
    const save = async (fields: Row) => {
      try { const result = await service.from('study_generation_usage').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id); if (result.error) console.error('Generation usage update failed; pending record retained') }
      catch { console.error('Generation usage update failed; pending record retained') }
    }
    let response: Response
    try { response = await fetcher(input, init) } catch (error) { await save({ status: 'unknown' }); throw error }
    const parsed = object(await response.clone().json().catch(() => null))
    const status = typeof parsed.status === 'string' ? parsed.status : response.ok ? 'completed' : 'rejected'
    // Transient polling errors must not overwrite terminal usage or the submitted response identity.
    if (get && !response.ok) return response
    await save({ status, http_status: response.status, request_id: response.headers.get('x-request-id') ?? response.headers.get('request-id'),
      ...(typeof parsed.id === 'string' ? { response_id: parsed.id } : {}),
      ...(parsed.usage ? usageFields(provider, model, parsed.usage) : {}) })
    return response
  }
}

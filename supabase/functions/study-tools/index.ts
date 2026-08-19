import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_REQUEST_BYTES = 64 * 1024
const MAX_CHUNKS = 24
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Chunk = {
  chunk_id: string
  file_id: string
  content: string
  character_start: number
  character_end: number
}

const AI_REQUEST_WEIGHT = {
  'gap-check': 1,
} as const

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return failure(405, 'method-not-allowed', 'POST required.')

  const length = Number(request.headers.get('content-length') || 0)
  if (length > MAX_REQUEST_BYTES) return failure(413, 'request-too-large', 'Request exceeds the 64 KB limit.')

  const authorization = request.headers.get('Authorization')
  if (!authorization) return failure(401, 'sign-in-required', 'Authentication required.')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) return failure(503, 'server-unconfigured', 'Study tools are not configured.')

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) return failure(401, 'sign-in-required', 'Authentication required.')

  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    return failure(413, 'request-too-large', 'Request exceeds the 64 KB limit.')
  }
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return failure(400, 'invalid-request', 'A JSON request is required.')
  }
  if (body.action === 'delete-sources') {
    const { error } = await client
      .from('academic_source_chunks')
      .delete()
      .eq('user_id', userData.user.id)
    if (error) return failure(503, 'delete-failed', 'The server source copy could not be deleted.')
    return json({ deleted: true })
  }

  if (body.action === 'sync-sources') {
    if (!isText(body.courseId) || !isText(body.topicId)) {
      return failure(400, 'invalid-request', 'A typed topic-scoped source sync is required.')
    }
    const suppliedSources = validateSources(body.sources)
    if (!suppliedSources) {
      return failure(400, 'invalid-request', 'Sources must use the typed topic-scoped contract.')
    }
    try {
      await mirrorLocalSources(client, userData.user.id, body.courseId, body.topicId, suppliedSources)
      return json({ synced: suppliedSources.length })
    } catch (error) {
      console.error('study-tools source sync failure', error instanceof Error ? error.message : 'unknown')
      return failure(503, 'sync-failed', 'Source material could not be synced.')
    }
  }

  if (body.action !== 'gap-check' || !isText(body.courseId) || !isText(body.topicId) || !isText(body.response)) {
    return failure(400, 'invalid-request', 'A typed study-tool request is required.')
  }
  const chunkIds = validateChunkIds(body.chunkIds)
  if (!chunkIds?.length) return failure(400, 'invalid-request', 'At least one trusted chunk ID is required.')

  const { data: allowed, error: limitError } = await client.rpc('claim_ai_request', {
    p_hour_limit: 20,
    p_day_limit: 100,
    p_weight: AI_REQUEST_WEIGHT['gap-check'],
  })
  if (limitError) return failure(503, 'usage-check-failed', 'Usage could not be verified.')
  if (!allowed) return failure(429, 'rate-limited', 'Hourly or daily AI usage limit reached.')

  const chunks = await retrieveChunks(client, body.courseId, body.topicId, chunkIds)
  if (!chunks.length) return failure(422, 'no-sources', 'No topic-scoped source material is available.')

  try {
    const provider = (Deno.env.get('AI_PROVIDER') || 'anthropic').toLowerCase()
    const output = provider === 'openai'
      ? await callOpenAI(body.response, chunks)
      : await callAnthropic(body.response, chunks, typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined)
    const validated = validateResult(output.value, chunks, output.trustedCitations)
    if (!validated) return failure(502, 'invalid-response', 'The provider returned invalid structured data.')
    return json(validated)
  } catch (error) {
    console.error('study-tools provider failure', error instanceof Error ? error.message : 'unknown')
    return failure(503, 'provider-unavailable', 'The AI provider is unavailable.')
  }
})

async function mirrorLocalSources(
  client: ReturnType<typeof createClient>,
  userId: string,
  courseId: string,
  topicId: string,
  sources: Array<{ chunkId: string; fileId: string; content: string; start: number; end: number }>,
) {
  const embeddings = await embedTexts(sources.map((source) => source.content))
  const rows = sources.map((source, index) => ({
    user_id: userId,
    chunk_id: source.chunkId,
    file_id: source.fileId,
    course_id: courseId,
    topic_id: topicId,
    content: source.content,
    character_start: source.start,
    character_end: source.end,
    embedding: embeddings?.[index] ?? null,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await client.from('academic_source_chunks').upsert(rows, { onConflict: 'user_id,chunk_id' })
  if (error) throw error
}

async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const key = Deno.env.get('OPENAI_EMBEDDING_API_KEY')
  if (!key || !texts.length) return null
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  })
  if (!response.ok) return null
  const payload = await response.json()
  return Array.isArray(payload?.data) ? payload.data.map((item: { embedding: number[] }) => item.embedding) : null
}

async function retrieveChunks(
  client: ReturnType<typeof createClient>,
  courseId: string,
  topicId: string,
  chunkIds: string[],
): Promise<Chunk[]> {
  const { data, error } = await client
    .from('academic_source_chunks')
    .select('chunk_id,file_id,content,character_start,character_end')
    .eq('course_id', courseId)
    .eq('topic_id', topicId)
    .in('chunk_id', chunkIds)
    .order('created_at', { ascending: true })
    .limit(MAX_CHUNKS)
  if (error) throw error
  return (data || []) as Chunk[]
}

/**
 * `specPrompt` is the client-assembled system prompt (generation Phase 1).
 * Pedagogy ships with the client build, versioned in git and reviewable in a
 * diff — `01` §2.1: this function is transport and enforcement only.
 *
 * The local fallback below stays so a function that has NOT been redeployed
 * behaves exactly as it does today. Delete it once every client sends a spec.
 */
async function callAnthropic(response: string, chunks: Chunk[], specPrompt?: string) {
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) throw new Error('Anthropic is not configured')
  const result = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-5',
      // Thinking is on by default on Opus 5 and counts against max_tokens, so
      // this budget covers reasoning + the report, not the report alone.
      max_tokens: 8000,
      output_config: { effort: 'medium' },
      // Structured outputs (`output_config.format`) cannot be combined with
      // document citations — the pair returns a 400. Citations are the
      // load-bearing half here: they are what makes a "from your materials"
      // chip verifiable rather than an unchecked model claim, so the schema
      // moves into the prompt and `validateResult` stays the enforcement.
      system: [
        specPrompt?.trim()
          // The pre-Phase-1 prompt, kept only as the un-redeployed fallback.
          || 'Compare recall only against the supplied topic sources. Never invent a source or offset.',
        // The transport half is always the server's: the response contract is
        // enforcement, not pedagogy, so a client may never weaken it.
        'Reply with a single JSON object and nothing else — no prose, no markdown fences.',
        `It must match this JSON Schema: ${JSON.stringify(resultSchema)}`,
      ].join('\n'),
      messages: [{
        role: 'user',
        content: [
          ...chunks.map((chunk) => ({
            type: 'document',
            source: { type: 'text', media_type: 'text/plain', data: chunk.content },
            title: `${chunk.file_id}:${chunk.chunk_id}`,
            citations: { enabled: true },
          })),
          { type: 'text', text: `Student recall:\n${response}` },
        ],
      }],
    }),
  })
  if (!result.ok) throw new Error(`Anthropic ${result.status}`)
  const payload = await result.json()
  const textBlocks = Array.isArray(payload?.content)
    ? payload.content.filter((block: { type?: string }) => block.type === 'text')
    : []
  const text = textBlocks.map((block: { text?: string }) => block.text || '').join('')
  const trustedCitations = textBlocks.flatMap((block: { citations?: unknown[] }) => block.citations || [])
    .flatMap((citation: Record<string, unknown>) => {
      if (citation.type !== 'char_location') return []
      const title = String(citation.document_title || '')
      const separator = title.lastIndexOf(':')
      if (separator < 1) return []
      return [{
        fileId: title.slice(0, separator),
        chunkId: title.slice(separator + 1),
        start: Number(citation.start_char_index),
        end: Number(citation.end_char_index),
      }]
    })
  return { value: parseJsonObject(text), trustedCitations }
}

/** Without a schema constraint the reply is *asked* for bare JSON but is not
 *  *guaranteed* to be, so recover the object rather than throwing on a stray
 *  fence or preamble. A malformed body still fails, and `validateResult`
 *  remains the gate on shape — this only widens what reaches it. */
function parseJsonObject(text: string): unknown {
  const withoutFences = text.replace(/```(?:json)?/gi, '').trim()
  try {
    return JSON.parse(withoutFences)
  } catch {
    const start = withoutFences.indexOf('{')
    const end = withoutFences.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('No JSON object in provider response')
    return JSON.parse(withoutFences.slice(start, end + 1))
  }
}

async function callOpenAI(response: string, chunks: Chunk[]) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OpenAI is not configured')
  const sources = chunks.map((chunk) => ({
    fileId: chunk.file_id,
    chunkId: chunk.chunk_id,
    start: chunk.character_start,
    end: chunk.character_end,
    content: chunk.content,
  }))
  const result = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini',
      input: `Compare the student's recall only to these sources.\nSources:${JSON.stringify(sources)}\nRecall:${response}`,
      text: { format: { type: 'json_schema', name: 'gap_check', strict: true, schema: resultSchema } },
    }),
  })
  if (!result.ok) throw new Error(`OpenAI ${result.status}`)
  const payload = await result.json()
  return { value: JSON.parse(payload.output_text), trustedCitations: undefined }
}

const citationSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'fileId', 'chunkId', 'start', 'end'],
      properties: {
        kind: { const: 'material' },
        fileId: { type: 'string' },
        chunkId: { type: 'string' },
        start: { type: 'integer', minimum: 0 },
        end: { type: 'integer', minimum: 1 },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind'],
      properties: { kind: { const: 'general' } },
    },
  ],
}
const itemSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'citation'],
  properties: { text: { type: 'string', minLength: 1 }, citation: citationSchema },
}
const resultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['covered', 'missed', 'wrong', 'suggestedGrade'],
  properties: {
    covered: { type: 'array', items: itemSchema },
    missed: { type: 'array', items: itemSchema },
    wrong: { type: 'array', items: itemSchema },
    suggestedGrade: { enum: ['again', 'hard', 'good', 'easy'] },
  },
}

function validateResult(
  value: unknown,
  chunks: Chunk[],
  trustedCitations?: Array<{ fileId: string; chunkId: string; start: number; end: number }>,
) {
  if (!value || typeof value !== 'object') return null
  const result = value as Record<string, unknown>
  if (!['again', 'hard', 'good', 'easy'].includes(String(result.suggestedGrade))) return null
  const byId = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]))
  for (const group of ['covered', 'missed', 'wrong']) {
    if (!Array.isArray(result[group])) return null
    for (const rawItem of result[group] as unknown[]) {
      if (!rawItem || typeof rawItem !== 'object') return null
      const item = rawItem as Record<string, unknown>
      if (!isText(item.text) || !item.citation || typeof item.citation !== 'object') return null
      const citation = item.citation as Record<string, unknown>
      if (citation.kind === 'general') continue
      const chunk = byId.get(String(citation.chunkId))
      if (!chunk || citation.fileId !== chunk.file_id) return null
      if (!Number.isInteger(citation.start) || !Number.isInteger(citation.end)) return null
      if (Number(citation.start) < chunk.character_start || Number(citation.end) > chunk.character_end || Number(citation.end) <= Number(citation.start)) return null
      if (trustedCitations && !trustedCitations.some((trusted) =>
        trusted.fileId === citation.fileId
        && trusted.chunkId === citation.chunkId
        && trusted.start === citation.start
        && trusted.end === citation.end
      )) return null
    }
  }
  return result
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function validateSources(value: unknown) {
  if (!Array.isArray(value) || value.length > MAX_CHUNKS) return null
  const sources: Array<{ chunkId: string; fileId: string; content: string; start: number; end: number }> = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null
    const source = raw as Record<string, unknown>
    if (!isText(source.chunkId) || !isText(source.fileId) || !isText(source.content)) return null
    if (!Number.isInteger(source.start) || !Number.isInteger(source.end) || Number(source.start) < 0 || Number(source.end) <= Number(source.start)) return null
    sources.push({
      chunkId: source.chunkId,
      fileId: source.fileId,
      content: source.content,
      start: Number(source.start),
      end: Number(source.end),
    })
  }
  return sources
}

function validateChunkIds(value: unknown) {
  if (!Array.isArray(value) || value.length > MAX_CHUNKS) return null
  const ids = value.filter(isText)
  if (ids.length !== value.length || new Set(ids).size !== ids.length) return null
  return ids
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function failure(status: number, code: string, message: string) {
  return json({ error: { code, message } }, status)
}

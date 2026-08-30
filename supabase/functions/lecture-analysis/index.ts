import { createClient } from 'npm:@supabase/supabase-js@2.110.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const MAX_REQUEST_BYTES = 64 * 1024

type Segment = { chunkId: string; timestamp?: string; content: string }

/** Product ruling approved by Andy Aug 21, 2026. */
const SYSTEM_PROMPT = `Read the complete student-supplied lecture transcript in source order. Do not filter, rank, or omit segments before analysis.
Find only professor remarks that would help the student navigate this specific class: assessment context, explicit or implicit emphasis, deliberate distinctions or warnings, study or reading guidance, office-hour guidance, logistics, deadlines, or assignment expectations. Do not turn ordinary lecture content, definitions, or generic explanations into class-note proposals.
For every proposal, return an exact contiguous quote from the transcript, its existing timestamp, a short neutral label, and a concise description of what the professor said. Do not paraphrase a quote, invent a timestamp, infer a deadline, predict exam content, or use labels such as high yield, likely, important, confidence, priority, score, or rank.
Each result is a pending proposal for the class Notes tab. It never edits a note, creates a task, links material, or changes coverage by itself. If there is no well-supported class-specific remark, return no proposals.
Return JSON only: {"findings":[{"sourceChunkId":"exact supplied id","timestamp":"exact supplied timestamp","quote":"exact contiguous transcript text","label":"short neutral label","detail":"brief descriptive note"}]}.`

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return fail(405, 'POST required.')
  if (Number(request.headers.get('content-length') || 0) > MAX_REQUEST_BYTES) return fail(413, 'Transcript is too large for one analysis request.')

  const authorization = request.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!authorization) return fail(401, 'Authentication required.')
  if (!url || !anonKey || !serviceKey || !openaiKey) return fail(503, 'Lecture analysis is not configured.')

  const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) return fail(401, 'Authentication required.')

  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) return fail(413, 'Transcript is too large for one analysis request.')
  let body: { courseId?: unknown; segments?: unknown }
  try { body = JSON.parse(raw) } catch { return fail(400, 'A JSON request is required.') }
  const segments = validSegments(body.segments)
  if (typeof body.courseId !== 'string' || !segments?.length) return fail(400, 'A complete typed transcript is required.')

  const serviceClient = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data: allowed, error: usageError } = await serviceClient.rpc('claim_ai_request', {
    p_user_id: userData.user.id,
    p_weight: 1,
  })
  if (usageError) return fail(503, 'Lecture-analysis usage could not be verified.')
  if (allowed !== true) return fail(429, 'Hourly or daily AI usage limit reached.')

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify({ courseId: body.courseId, segments }) },
        ],
      }),
    })
  } catch {
    return fail(503, 'Lecture analysis timed out. Try again without changing the saved transcript.')
  }
  if (!response.ok) return fail(503, 'Lecture analysis is unavailable.')
  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  let result: unknown
  try { result = JSON.parse(content) } catch { return fail(502, 'Lecture analysis returned invalid data.') }
  if (!validFindings(result, segments)) return fail(502, 'Lecture analysis returned ungrounded evidence.')
  return json(result)
})

function validSegments(value: unknown): Segment[] | undefined {
  if (!Array.isArray(value) || !value.length) return undefined
  const segments = value.filter((item): item is Segment => Boolean(
    item && typeof item === 'object'
    && typeof (item as Segment).chunkId === 'string'
    && typeof (item as Segment).content === 'string'
    && (typeof (item as Segment).timestamp === 'string' || typeof (item as Segment).timestamp === 'undefined'),
  ))
  return segments.length === value.length ? segments : undefined
}

function validFindings(value: unknown, segments: Segment[]) {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { findings?: unknown }).findings)) return false
  const byId = new Map(segments.map((segment) => [segment.chunkId, segment]))
  return (value as { findings: unknown[] }).findings.every((item) => {
    if (!item || typeof item !== 'object') return false
    const finding = item as Record<string, unknown>
    const segment = typeof finding.sourceChunkId === 'string' ? byId.get(finding.sourceChunkId) : undefined
    return Boolean(segment && segment.timestamp
      && typeof finding.timestamp === 'string' && finding.timestamp === segment.timestamp
      && typeof finding.quote === 'string' && segment.content.includes(finding.quote)
      && typeof finding.label === 'string' && finding.label.trim()
      && typeof finding.detail === 'string' && finding.detail.trim())
  })
}

function json(value: unknown) {
  return new Response(JSON.stringify(value), { headers: { ...cors, 'Content-Type': 'application/json' } })
}

function fail(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const failure = (status: number, code: string, message: string) => json({ error: { code, message } }, status)

type Scope = { institution: string; courseCode: string; term: string; section: string }
type Structure = {
  units: Array<{ title: string; order: number }>
  dates: Array<{ kind: 'exam' | 'deadline'; title: string; date: string | null; order: number }>
  gradeCategories: Array<{ name: string; weight: number; order: number }>
  policyFlags: string[]
  publicLogistics: Array<{ kind: 'instructor' | 'office-hours'; value: string }>
}

const text = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
const scopeOf = (value: unknown): Scope | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const institution = text(raw.institution, 160).toLowerCase()
  const courseCode = text(raw.courseCode, 32).toUpperCase()
  const term = text(raw.term, 64).toLowerCase()
  const section = text(raw.section, 32).toLowerCase()
  return institution && courseCode && term && section ? { institution, courseCode, term, section } : undefined
}
const row = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const integer = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 999 ? value : undefined
const safeDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null

/** Allow-list serializer. Unknown root keys and unknown fields are discarded;
 * prose policies/logistics are deliberately rejected until separately modeled. */
function structureOf(value: unknown): Structure | undefined {
  const raw = row(value)
  const array = (input: unknown) => Array.isArray(input) && input.length <= 200 ? input : undefined
  const units = array(raw.units)?.map((entry) => { const data = row(entry); const title = text(data.title, 160); const order = integer(data.order); return title && order !== undefined ? { title, order } : undefined }).filter(Boolean) as Structure['units'] | undefined
  const dates = array(raw.dates)?.map((entry) => { const data = row(entry); const kind = data.kind === 'exam' || data.kind === 'deadline' ? data.kind : undefined; const title = text(data.title, 160); const order = integer(data.order); return kind && title && order !== undefined ? { kind, title, date: safeDate(data.date), order } : undefined }).filter(Boolean) as Structure['dates'] | undefined
  const gradeCategories = array(raw.gradeCategories)?.map((entry) => { const data = row(entry); const name = text(data.name, 100); const weight = typeof data.weight === 'number' && data.weight >= 0 && data.weight <= 100 ? data.weight : undefined; const order = integer(data.order); return name && weight !== undefined && order !== undefined ? { name, weight, order } : undefined }).filter(Boolean) as Structure['gradeCategories'] | undefined
  if (!units || !dates || !gradeCategories || !Array.isArray(raw.policyFlags) || !Array.isArray(raw.publicLogistics)) return undefined
  // No generic prose crosses the boundary. Explicit flag/logistics support is
  // reserved for a later modeled schema rather than silently accepting text.
  if (raw.policyFlags.length || raw.publicLogistics.length) return undefined
  return { units, dates, gradeCategories, policyFlags: [], publicLogistics: [] }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
function capability() { return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '') }
function expiryFor(term: string) {
  const year = Number(term.match(/20\d{2}/)?.[0])
  const normalized = term.toLowerCase()
  if (!year) return undefined
  if (normalized.includes('spring')) return new Date(Date.UTC(year, 5, 15)).toISOString()
  if (normalized.includes('summer')) return new Date(Date.UTC(year, 7, 15)).toISOString()
  if (normalized.includes('fall') || normalized.includes('autumn')) return new Date(Date.UTC(year, 11, 31)).toISOString()
  return undefined
}
function publicCandidate(record: any) {
  return {
    id: record.id,
    scope: { institution: record.institution, courseCode: record.course_code, term: record.term_label, section: record.section_label },
    structure: { units: record.units, dates: record.date_facts, gradeCategories: record.grade_categories, policyFlags: record.policy_flags, publicLogistics: record.public_logistics },
    parsedAt: record.parsed_at, revisedAt: record.revised_at,
    independentParseCount: record.independent_parse_count ?? 1,
    importCount: record.import_count, correctionCount: record.correction_count, conflicts: record.conflicts,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return failure(405, 'method-not-allowed', 'POST required.')
  const authorization = request.headers.get('authorization')
  const url = Deno.env.get('SUPABASE_URL'); const anonKey = Deno.env.get('SUPABASE_ANON_KEY'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !url || !anonKey || !serviceKey) return failure(503, 'server-unconfigured', 'Shared structure is not configured.')
  const auth = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const { data: userData, error: authError } = await auth.auth.getUser()
  if (authError || !userData.user) return failure(401, 'sign-in-required', 'Sign in to use optional shared structures.')
  const body = await request.json().catch(() => undefined) as Record<string, unknown> | undefined
  if (!body || typeof body.action !== 'string') return failure(400, 'invalid-request', 'A typed action is required.')
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  if (body.action === 'publish' || body.action === 'correct') {
    const scope = scopeOf(body.scope); const structure = structureOf(body.structure); const expiresAt = scope && expiryFor(scope.term)
    if (!scope || !structure || !expiresAt) return failure(400, 'invalid-structure', 'Use an exact institution, course, recognized term, section, and structure-only payload.')
    const rawCapability = capability(); const fingerprint = await sha256(JSON.stringify({ scope, structure }))
    const parentCandidateId = body.action === 'correct' ? text(body.parentCandidateId, 64) : ''
    if (body.action === 'correct' && !parentCandidateId) return failure(400, 'invalid-correction', 'A candidate revision must name the structure it corrects.')
    if (parentCandidateId) {
      const { data: parent } = await admin.from('shared_syllabus_structures').select('id,correction_count').eq('id', parentCandidateId).is('revoked_at', null).maybeSingle()
      if (!parent) return failure(404, 'candidate-not-found', 'That shared structure is no longer available for correction.')
      await admin.from('shared_syllabus_structures').update({ correction_count: (parent.correction_count ?? 0) + 1, updated_at: new Date().toISOString() }).eq('id', parentCandidateId)
    }
    const fields = { institution: scope.institution, course_code: scope.courseCode, term_label: scope.term, section_label: scope.section, units: structure.units, date_facts: structure.dates, grade_categories: structure.gradeCategories, policy_flags: [], public_logistics: [], structure_fingerprint: fingerprint, publish_capability_hash: await sha256(rawCapability), expires_at: expiresAt, revised_at: body.action === 'correct' ? new Date().toISOString() : null, parent_candidate_id: parentCandidateId || null }
    const { data, error } = await admin.from('shared_syllabus_structures').insert(fields).select('*').single()
    if (error || !data) return failure(503, 'publish-failed', 'The parsed structure could not be shared.')
    return json({ candidate: publicCandidate(data), capability: rawCapability })
  }
  if (body.action === 'lookup') {
    const scope = scopeOf(body.scope); if (!scope) return failure(400, 'invalid-scope', 'An exact institution, course, term, and section are required.')
    const { data, error } = await admin.from('shared_syllabus_structures').select('*').eq('institution', scope.institution).eq('course_code', scope.courseCode).eq('term_label', scope.term).eq('section_label', scope.section).is('revoked_at', null).gte('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(3)
    if (error) return failure(503, 'lookup-failed', 'Shared structures could not be checked.')
    const grouped = new Map<string, any>()
    for (const candidate of data ?? []) {
      const present = grouped.get(candidate.structure_fingerprint)
      if (present) present.independent_parse_count += 1
      else grouped.set(candidate.structure_fingerprint, { ...candidate, independent_parse_count: 1 })
    }
    return json({ candidates: [...grouped.values()].slice(0, 3).map(publicCandidate) })
  }
  if (body.action === 'revoke') {
    const candidateId = text(body.candidateId, 64); const rawCapability = text(body.capability, 256)
    if (!candidateId || !rawCapability) return failure(400, 'invalid-revoke', 'A valid local revoke capability is required.')
    const { data, error } = await admin.from('shared_syllabus_structures').update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', candidateId).eq('publish_capability_hash', await sha256(rawCapability)).is('revoked_at', null).select('id').maybeSingle()
    if (error) return failure(503, 'revoke-failed', 'The shared structure could not be revoked.')
    if (!data) return failure(404, 'capability-not-found', 'That browser cannot revoke this shared structure.')
    return json({ revoked: true })
  }
  return failure(400, 'invalid-action', 'Unknown shared-structure action.')
})

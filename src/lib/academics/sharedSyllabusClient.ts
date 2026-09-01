import { supabase } from '@/lib/supabase'
import {
  normalizeSharedSyllabusScope, serializeSharedSyllabusStructure, type SharedSyllabusCandidate,
  type SharedSyllabusScope,
} from '@/lib/academics/sharedSyllabusStructure'
import type { SyllabusProposal } from '@/lib/academics/syllabusParser'
import { workspaceScopedKey } from '@/lib/demoMode'

const CAPABILITY_STORAGE_KEY = 'premedos.shared-syllabus.capabilities.v1'
type CapabilityRecord = { candidateId: string; capability: string }

function loadCapabilities(): CapabilityRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(workspaceScopedKey(CAPABILITY_STORAGE_KEY)) ?? '{"version":1,"records":[]}')
    return parsed?.version === 1 && Array.isArray(parsed.records) ? parsed.records.filter((item: unknown): item is CapabilityRecord => (
      Boolean(item) && typeof (item as CapabilityRecord).candidateId === 'string' && typeof (item as CapabilityRecord).capability === 'string'
    )) : []
  } catch { return [] }
}
function saveCapabilities(records: CapabilityRecord[]) {
  localStorage.setItem(workspaceScopedKey(CAPABILITY_STORAGE_KEY), JSON.stringify({ version: 1, records }))
}
async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Cloud sharing is not configured. Your private import is still available.')
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) throw new Error('Sign in to use the optional shared-structure route. Your private import remains available.')
  const { data, error } = await supabase.functions.invoke('shared-syllabus', { body })
  if (error) throw new Error(error.message || 'Shared structure is unavailable right now.')
  if (!data || typeof data !== 'object' || 'error' in data) throw new Error('Shared structure is unavailable right now.')
  return data as T
}

export async function publishSharedSyllabus(scope: SharedSyllabusScope, proposal: SyllabusProposal) {
  const result = await invoke<{ candidate: SharedSyllabusCandidate; capability: string }>({
    action: 'publish', scope: normalizeSharedSyllabusScope(scope), structure: serializeSharedSyllabusStructure(proposal.items),
  })
  const records = loadCapabilities().filter((record) => record.candidateId !== result.candidate.id)
  saveCapabilities([...records, { candidateId: result.candidate.id, capability: result.capability }])
  return result.candidate
}

export async function lookupSharedSyllabi(scope: SharedSyllabusScope) {
  return invoke<{ candidates: SharedSyllabusCandidate[] }>({ action: 'lookup', scope: normalizeSharedSyllabusScope(scope) })
}

/** A correction is a new anonymous parse revision; it never changes a
 * recipient's private class records or mutates the candidate they reviewed. */
export async function correctSharedSyllabus(candidateId: string, scope: SharedSyllabusScope, proposal: SyllabusProposal) {
  const result = await invoke<{ candidate: SharedSyllabusCandidate; capability: string }>({
    action: 'correct', parentCandidateId: candidateId, scope: normalizeSharedSyllabusScope(scope), structure: serializeSharedSyllabusStructure(proposal.items),
  })
  const records = loadCapabilities().filter((record) => record.candidateId !== result.candidate.id)
  saveCapabilities([...records, { candidateId: result.candidate.id, capability: result.capability }])
  return result.candidate
}

export async function revokeSharedSyllabus(candidateId: string) {
  const record = loadCapabilities().find((item) => item.candidateId === candidateId)
  if (!record) throw new Error('This browser no longer has the private revoke capability for that shared structure.')
  await invoke({ action: 'revoke', candidateId, capability: record.capability })
  saveCapabilities(loadCapabilities().filter((item) => item.candidateId !== candidateId))
}

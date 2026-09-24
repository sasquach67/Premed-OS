/* S1 revision 3 client contract for `public.dashboards`.
 *
 * Every read carries the row's `cloud_schema`/`write_rev` and passes the version
 * gates before anything hydrates, migrates or edits it. Every write is
 * conditional, so ordinary concurrency is a zero-row miss that goes back to
 * reconciliation, never a blind overwrite:
 *   - no row:      INSERT a first claim (write_rev 1), never an upsert
 *   - legacy row:  conditional first claim (updated_at matches, both columns NULL)
 *   - claimed row: compare-and-set on write_rev and updated_at, sending write_rev + 1
 * There is no fallback writer without the columns. */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppData } from '@/lib/types'
import { assertSupportedRemote, cloudClaim, CURRENT_CLOUD_SCHEMA, isMissingCloudColumnsError, logicalSchema, MAX_WRITE_REV, WorkspaceSchemaError, type CloudClaim } from '@/lib/workspaceSchema'
import { assertSyncSession, pauseAccountForSchema, preserveAccountConflict, recordCloudProtection, syncContent, validateRemoteWorkspace, type captureSyncSession } from './accountSyncSafety'
import { cloudRequest } from './cloudRequest'

export const DASHBOARD_SELECT = 'data, updated_at, cloud_schema, write_rev'

/** A reviewed server revision: the exact decoded document plus its row metadata. */
export type RemoteDashboard = { data: AppData; updatedAt: string; claim: CloudClaim | null }
export type DashboardRevision = Pick<RemoteDashboard, 'updatedAt' | 'claim'>

/** A zero-row conditional write: someone else saved first. Reconcile, don't pause. */
export class DashboardWriteMiss extends Error {
  constructor() { super('The cloud copy changed before this save. It was checked again; nothing was overwritten.'); this.name = 'DashboardWriteMiss' }
}

/** Metadata first, then the version gates, then structure. Throws before any hydration. */
export function parseDashboardRow(row: Record<string, unknown>): RemoteDashboard {
  const claim = cloudClaim(row)
  if (typeof row.updated_at !== 'string' || !row.updated_at) throw new Error('The cloud copy has no usable revision. Nothing was replaced.')
  assertSupportedRemote(row.data, claim)
  validateRemoteWorkspace(row.data)
  return { data: row.data, updatedAt: row.updated_at, claim }
}

/** Where an unsupported cloud copy is preserved before the account is blocked. */
export type RemoteRecovery = { localRaw: string | null; token: ReturnType<typeof captureSyncSession> }

/** Read the account row with its metadata. An unsupported or contradictory
 *  version blocks the account (uploads, backups, edits) and keeps the raw cloud
 *  document downloadable; nothing is hydrated. Missing columns fail closed. */
export async function readDashboard(client: SupabaseClient, userId: string, assertFresh: () => void | Promise<void>, recovery?: RemoteRecovery): Promise<RemoteDashboard | null> {
  const { data: row, error } = await cloudRequest(() => client.from('dashboards').select(DASHBOARD_SELECT).eq('user_id', userId).maybeSingle(), assertFresh)
    .catch(failure => { throw noteMissingColumns(userId, failure) })
  if (error) throw noteMissingColumns(userId, error)
  if (!row?.data) return null
  return checkDashboardRow(userId, row as Record<string, unknown>, recovery)
}

/** Public-page readers (routing, first-login setup, merge review) get the same
 *  metadata and gates before any decision. They never write. */
export async function readDashboardForReview(client: SupabaseClient, userId: string): Promise<RemoteDashboard | null> {
  const { data: row, error } = await client.from('dashboards').select(DASHBOARD_SELECT).eq('user_id', userId).maybeSingle()
  if (error) throw noteMissingColumns(userId, error)
  return row?.data ? checkDashboardRow(userId, row as Record<string, unknown>) : null
}

export async function checkDashboardRow(userId: string, row: Record<string, unknown>, recovery?: RemoteRecovery): Promise<RemoteDashboard> {
  let remote: RemoteDashboard
  try { remote = parseDashboardRow(row) }
  catch (error) {
    noteMissingColumns(userId, error)
    if (error instanceof WorkspaceSchemaError && recovery) {
      assertSyncSession(recovery.token)
      pauseAccountForSchema(userId, error.message, true)
      await preserveAccountConflict(userId, recovery.localRaw, row.data as AppData, recovery.token, error.message)
    }
    throw error
  }
  recordCloudProtection(userId, remote.claim ? 'on' : 'off')
  return remote
}

function noteMissingColumns(userId: string, error: unknown) {
  if (isMissingCloudColumnsError(error)) recordCloudProtection(userId, 'unavailable')
  return error
}

const sameInstant = (a: unknown, b: string) => typeof a === 'string' && Date.parse(a) === Date.parse(b)
const sameClaim = (a: CloudClaim | null, b: CloudClaim) => !!a && a.cloudSchema === b.cloudSchema && a.writeRev === b.writeRev

/** `expected` is the reviewed revision this write replaces, or `null` when no row exists.
 *  `data` is already remote-shaped (privacy-filtered) and carries this app's marker. */
export async function writeDashboard(client: SupabaseClient, userId: string, data: AppData, expected: DashboardRevision | null, assertFresh: () => void | Promise<void>): Promise<RemoteDashboard> {
  if (logicalSchema(data) !== CURRENT_CLOUD_SCHEMA) throw new Error('This save is missing its version marker. Nothing was sent.')
  const previous = expected?.claim ?? null
  if (previous && previous.writeRev >= MAX_WRITE_REV) throw new WorkspaceSchemaError('This account’s cloud copy reached its save limit. Nothing was sent. Export your work and contact support.')
  if (previous && previous.cloudSchema > CURRENT_CLOUD_SCHEMA) throw new WorkspaceSchemaError('This workspace needs a newer version of Premed OS. Nothing was sent.')
  const next: CloudClaim = { cloudSchema: CURRENT_CLOUD_SCHEMA, writeRev: previous ? previous.writeRev + 1 : 1 }
  // Fixed once: a retry after a lost response resends the same counter and predicate.
  const updatedAt = new Date().toISOString()
  const values = { data, updated_at: updatedAt, cloud_schema: next.cloudSchema, write_rev: next.writeRev }
  const request = () => {
    const table = client.from('dashboards')
    if (!expected) return table.insert({ user_id: userId, ...values }).select(DASHBOARD_SELECT).maybeSingle()
    const update = table.update(values).eq('user_id', userId).eq('updated_at', expected.updatedAt)
    return (previous
      ? update.eq('cloud_schema', previous.cloudSchema).eq('write_rev', previous.writeRev)
      : update.is('cloud_schema', null).is('write_rev', null)
    ).select(DASHBOARD_SELECT).maybeSingle()
  }
  let result
  try { result = await cloudRequest(request, assertFresh) }
  catch (error) {
    // A competing insert, or our own insert retried after its response was lost.
    if (!expected && isUniqueViolation(error)) return confirmLostWrite()
    throw noteMissingColumns(userId, error)
  }
  if (result.error) throw noteMissingColumns(userId, result.error)
  if (!result.data) return confirmLostWrite()
  // Success is what the server returned, not what was sent.
  const saved = await checkDashboardRow(userId, result.data as Record<string, unknown>)
  if (!sameClaim(saved.claim, next) || !sameInstant(saved.updatedAt, updatedAt)) throw new Error('The cloud did not confirm this save’s version. Sync is paused; check the cloud copy again.')
  return saved

  // Zero rows: either another writer won, or our committed write lost its response
  // and the retry no longer matched. Only an exact match of what we sent is ours.
  async function confirmLostWrite(): Promise<RemoteDashboard> {
    const latest = await readDashboard(client, userId, assertFresh)
    if (latest && sameClaim(latest.claim, next) && sameInstant(latest.updatedAt, updatedAt) && syncContent(latest.data) === syncContent(data)) return latest
    throw new DashboardWriteMiss()
  }
}

function isUniqueViolation(error: unknown): boolean {
  for (let value = error, depth = 0; value && typeof value === 'object' && depth < 4; value = (value as { cause?: unknown }).cause, depth++) {
    if ((value as { code?: unknown }).code === '23505') return true
  }
  return false
}

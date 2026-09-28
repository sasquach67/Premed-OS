import { blockAccountSchema, getAccountSchemaBlock } from './accountSchemaBlock'
export { getAccountSchemaBlock } from './accountSchemaBlock'
import { assertSupportedWorkspace, isCloudSchema, isWriteRev, prepareWorkspaceData, type CloudClaim } from '@/lib/workspaceSchema'
import { clearDriveSession } from '@/lib/googleDrive'
import type { AppData } from '@/lib/types'
import { accountStorageKey } from '@/lib/demoMode'
import { dataForRemote } from '@/lib/storyPrivacy'
import { validateAppData } from '@/lib/validateAppData'
import { assertDurableWorkspace, captureWorkspaceIdentity, snapshotData } from './store'
import { workspaceRecoveryRepository } from './workspaceRecoveryRepository'

let sessionId: string | null | undefined
let generation = 0
let pauseRevision = 0
let verifiedGeneration: number | undefined
export function pauseAccountForSchema(id: string, message: string, mutation = false) { blockAccountSchema(id, message, mutation); clearDriveSession(); pauseAccountSync(id) }
const conflicts = new Map<string, AccountConflict>()
const listeners = new Set<() => void>()
type OpenWorkspaceCopy = { data: AppData; key: string; raw: string | null }
export type AccountConflict = { schemaBlocked?: boolean; open?: OpenWorkspaceCopy; localRaw: string | null; remote: AppData | null; saved: boolean; message: string }
export function observeSyncSession(id: string | null) {
  if (sessionId !== id) { clearDriveSession(); sessionId = id; generation++; verifiedGeneration = undefined; listeners.forEach(fn => fn()) }
  return { id, generation, pauseRevision }
}
export function captureSyncSession() { return { id: sessionId, generation, pauseRevision } }
export function assertSyncSession(token: ReturnType<typeof captureSyncSession>) {
  if (!token.id || token.id !== sessionId || token.generation !== generation) throw new Error('Your sign-in session changed. Sync was stopped.')
}
export function pauseAccountSync(id: string) { if (id === sessionId) { pauseRevision++; verifiedGeneration = undefined; listeners.forEach(fn => fn()) }; return captureSyncSession() }
export function assertSyncLease(token: ReturnType<typeof captureSyncSession>) {
  assertSyncSession(token)
  if (token.pauseRevision !== pauseRevision) throw new Error('A newer operation paused sync. Check the saved copies again before continuing.')
}
export function isAccountSyncReady(id?: string) { return Boolean(id && id === sessionId && verifiedGeneration === generation && !conflicts.has(id) && !getAccountSchemaBlock(id)) }
export function allowAccountSync(token: ReturnType<typeof captureSyncSession>) {
  assertSyncLease(token)
  if (getAccountSchemaBlock(token.id)) throw new Error(getAccountSchemaBlock(token.id))
  if (conflicts.has(token.id!)) throw new Error('Review the saved account copies before syncing.')
  verifiedGeneration = generation
  listeners.forEach(fn => fn())
}
export function assertAccountUpload(snapshot = snapshotData(), owner = captureWorkspaceIdentity()) {
  const token = captureSyncSession()
  assertSyncSession(token)
  if (verifiedGeneration !== generation || conflicts.has(token.id!) || getAccountSchemaBlock(token.id)) throw new Error('Account sync and backups are paused until the saved copies have been checked.')
  if (owner.key !== accountStorageKey(token.id!)) throw new Error('This saved workspace does not belong to the signed-in account.')
  assertDurableWorkspace(snapshot, owner)
  return token
}
export function subscribeAccountConflicts(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function getAccountConflict(id: string | null | undefined) { return id ? conflicts.get(id) : undefined }
function publish(id: string, value: AccountConflict) { conflicts.set(id, value); pauseAccountSync(id); listeners.forEach(fn => fn()) }

// Stable JSON order is needed because JSONB may reorder object keys.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]))
  return value
}
/** Content identity for sync comparisons. The portable `_schema` marker is version
 *  metadata (the server's `cloud_schema` is authoritative), so it is left out: the
 *  same content hashes exactly as it did before S1 (d60f682), and baselines those
 *  apps recorded stay valid. The version gate still runs first. */
export function syncContent(data: AppData) {
  const { _schema: _marker, ...remote } = dataForRemote(prepareWorkspaceData(data)) as AppData & { _schema?: unknown }
  const settings = { ...remote.settings, backup: undefined }
  return JSON.stringify(canonical({ ...remote, settings }))
}
export async function syncDigest(text: string) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(b => b.toString(16).padStart(2, '0')).join('')
}
/** `claim` is the server row metadata this digest was confirmed at. A baseline
 *  recorded before S1 has none (`undefined`): the next write needs a fresh read,
 *  never an invented revision. */
export type SyncBaseline = { digest: string; updatedAt: string; claim?: CloudClaim | null }
const baselineKey = (id: string) => `premed-os:sync-baseline:v2:${id}`
// Still written so an older open tab keeps its own content comparison.
const legacyBaselineKey = (id: string) => `premed-os:sync-baseline:v1:${id}`
function storedClaim(value: unknown): CloudClaim | null | undefined {
  if (value === null) return null
  const claim = value as Partial<CloudClaim> | undefined
  return claim && isCloudSchema(claim.cloudSchema) && isWriteRev(claim.writeRev) ? { cloudSchema: claim.cloudSchema, writeRev: claim.writeRev } : undefined
}
export function readSyncBaseline(id: string): SyncBaseline | null {
  const read = (key: string) => { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return typeof v?.digest === 'string' && typeof v?.updatedAt === 'string' ? v : null } catch { return null } }
  const current = read(baselineKey(id))
  if (current) {
    const claim = storedClaim(current.claim)
    return claim === undefined ? { digest: current.digest, updatedAt: current.updatedAt } : { digest: current.digest, updatedAt: current.updatedAt, claim }
  }
  const legacy = read(legacyBaselineKey(id))
  return legacy && { digest: legacy.digest, updatedAt: legacy.updatedAt }
}
type BaselineRevision = { updatedAt: string; claim: CloudClaim | null }
/** Records the synced workspace (always hashed here) at a server revision. */
export async function recordSyncBaseline(id: string, data: AppData, revision: BaselineRevision, token: ReturnType<typeof captureSyncSession>) {
  await writeSyncBaseline(id, () => syncDigest(syncContent(data)), revision, token)
}
/** Moves an existing baseline to a new server revision of unchanged content (a
 *  claim, or metadata read for dirty local edits). The digest must come from a
 *  baseline already on record: it is a separate input, never read from workspace data. */
export async function rebaseSyncBaseline(id: string, baseline: SyncBaseline, revision: BaselineRevision, token: ReturnType<typeof captureSyncSession>) {
  if (!/^[0-9a-f]{64}$/.test(baseline.digest)) throw new Error('The recorded sync baseline is unreadable. Check the cloud copy again.')
  await writeSyncBaseline(id, async () => baseline.digest, revision, token)
}
async function writeSyncBaseline(id: string, digestOf: () => Promise<string>, revision: BaselineRevision, token: ReturnType<typeof captureSyncSession>) {
  if (token.id !== id) throw new Error('This sync result belongs to a different account.')
  const owner = captureWorkspaceIdentity()
  const digest = await digestOf()
  assertSyncLease(token)
  const current = captureWorkspaceIdentity()
  if (owner.key !== current.key || owner.epoch !== current.epoch) throw new Error('The workspace changed while sync completed. Its metadata was kept.')
  localStorage.setItem(baselineKey(id), JSON.stringify({ digest, updatedAt: revision.updatedAt, claim: revision.claim }))
  localStorage.setItem(legacyBaselineKey(id), JSON.stringify({ digest, updatedAt: revision.updatedAt }))
}

/** Server-confirmed protection per account. 'on' only after the server returned
 *  claimed metadata; opening the app or a local save proves nothing. */
export type CloudProtection = 'unknown' | 'off' | 'on' | 'unavailable'
const protection = new Map<string, CloudProtection>()
export function recordCloudProtection(id: string, value: CloudProtection) {
  if (protection.get(id) === value) return
  protection.set(id, value)
  listeners.forEach(fn => fn())
}
export function getCloudProtection(id: string | null | undefined): CloudProtection { return id ? protection.get(id) ?? 'unknown' : 'unknown' }

/** Immutable copies before review. Failure to archive never permits a replacement. */
export async function preserveAccountConflict(id: string, localRaw: string | null, remote: AppData | null, token: ReturnType<typeof captureSyncSession>, reason?: string, open?: OpenWorkspaceCopy) {
  if (token.id !== id) throw new Error('These recovery copies belong to a different account.')
  const pending: AccountConflict = { schemaBlocked: !!getAccountSchemaBlock(id), open, localRaw, remote, saved: false, message: reason ?? 'This device and the cloud contain different account data. Automatic sync and backups are paused. Download both copies before choosing what to restore.' }
  assertSyncSession(token)
  publish(id, pending)
  try {
    await archiveAccountCopies(id, localRaw, remote, token, open)
    publish(id, { ...pending, saved: true })
  } catch {
    assertSyncSession(token)
    publish(id, { ...pending, message: 'The browser could not verify recovery copies. Sync and backups remain paused. Download the available device and cloud copies now; neither has been selected to replace the other.' })
  }
}
async function archiveAccountCopies(id: string, localRaw: string | null, remote: AppData | null, token: ReturnType<typeof captureSyncSession>, open?: OpenWorkspaceCopy) {
    if (token.id !== id) throw new Error('These recovery copies belong to a different account.')
    const repository = workspaceRecoveryRepository()
    for (const [side, stored] of [['local', localRaw], ['cloud', remote ? JSON.stringify({ state: remote }) : null], ['open', open ? JSON.stringify({ workspaceKey: open.key, state: open.data }) : null], ['open-cache', open?.raw ?? null]] as const) {
      if (stored === null) continue
      const workspaceKey = `${accountStorageKey(id)}:sync-conflict:${side}`
      const sha256 = await syncDigest(JSON.stringify(stored))
      assertSyncSession(token)
      const snapshot = { format: 'premed-os-workspace-recovery' as const, version: 1 as const, workspaceKey, id: crypto.randomUUID(), createdAt: Date.now(), stored, sha256 }
      await repository.save(snapshot)
      const read = await repository.read(workspaceKey, snapshot.id)
      if (!read || read.workspaceKey !== workspaceKey || read.id !== snapshot.id || read.stored !== stored || read.sha256 !== sha256) throw new Error('Recovery copy verification failed.')
      assertSyncSession(token)
    }
}
/** Even an unambiguous baseline update keeps the prior device copy first. */
export async function preserveAccountReplacement(id: string, localRaw: string, remote: AppData, token: ReturnType<typeof captureSyncSession>) {
  try { await archiveAccountCopies(id, localRaw, remote, token); return true }
  catch { await preserveAccountConflict(id, localRaw, remote, token); return false }
}
export function validateRemoteWorkspace(data: unknown): asserts data is AppData {
  assertSupportedWorkspace(data)
  if (validateAppData(data).length) throw new Error('The cloud copy has an invalid structure. Nothing was replaced and sync is paused.')
}

/** Complete only the exact, explicitly reviewed conflict after durable application and cloud verification. */
export async function finishAccountConflictReview(id: string, reviewed: AccountConflict, token: ReturnType<typeof captureSyncSession>, remote: AppData, revision: { updatedAt: string; claim: CloudClaim | null }, applied: AppData) {
  assertSyncLease(token)
  if (token.id !== id || getAccountConflict(id) !== reviewed) throw new Error('The account review changed. Sync remains paused.')
  const owner = captureWorkspaceIdentity(), snapshot = snapshotData(), text = JSON.stringify(applied)
  if (JSON.stringify(snapshot) !== text) throw new Error('The workspace changed after your choice.')
  if (owner.key !== accountStorageKey(id)) throw new Error('The active account changed.')
  assertDurableWorkspace(snapshot, owner)
  await recordSyncBaseline(id, remote, revision, token)
  assertSyncLease(token)
  if (getAccountConflict(id) !== reviewed || JSON.stringify(snapshotData()) !== text) throw new Error('The workspace changed while completing review.')
  assertDurableWorkspace(snapshotData(), owner)
  conflicts.delete(id)
  allowAccountSync(token)
}

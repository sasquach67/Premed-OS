import { captureWorkspaceIdentity } from './store'
import { readStoredWorkspace, WorkspaceChangedError, writeStoredWorkspace } from './storageHealth'
import { decodeWorkspaceStorage, encodeWorkspaceStorage, WORKSPACE_CHUNKS_PREFIX } from './workspaceStorageCodec'
import { workspaceRecoveryRepository, type WorkspaceRecoveryRepository, type WorkspaceRecoverySnapshot } from './workspaceRecoveryRepository'
import { validateAppData } from '@/lib/dataIo'

type WorkspaceIdentity = ReturnType<typeof captureWorkspaceIdentity>
export type WorkspaceOptimizationPlan = Readonly<{ owner: WorkspaceIdentity; before: string; after: string; bytesBefore: number; bytesAfter: number }>
const issuedPlans = new WeakSet<WorkspaceOptimizationPlan>()

function assertOwner(owner: WorkspaceIdentity) {
  const current = captureWorkspaceIdentity()
  if (owner.key !== current.key || owner.epoch !== current.epoch) throw new WorkspaceChangedError('The active workspace changed. Return to the intended account and open storage recovery again.')
}

/** Exact string digest, including literal unpaired UTF-16 surrogates. */
async function digest(stored: string): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(stored))
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function verifySnapshot(snapshot: WorkspaceRecoverySnapshot | null, workspaceKey: string) {
  if (!snapshot || snapshot.format !== 'premed-os-workspace-recovery' || snapshot.version !== 1 || snapshot.workspaceKey !== workspaceKey
    || typeof snapshot.stored !== 'string' || typeof snapshot.id !== 'string' || !snapshot.id || !Number.isSafeInteger(snapshot.createdAt)
    || snapshot.createdAt < 0 || await digest(snapshot.stored) !== snapshot.sha256) throw new Error('The recovery copy could not be verified. Existing saved data was kept.')
  const decoded = decodeWorkspaceStorage(snapshot.stored)
  const data = JSON.parse(decoded) as { state?: unknown }
  if (!data || typeof data !== 'object' || validateAppData(data.state).length) throw new Error('The recovery copy does not contain a readable workspace. Existing saved data was kept.')
  return decoded
}

/** Read-only estimate. Consent and the durable backup happen in commit below. */
export function prepareWorkspaceOptimization(storage: Storage = localStorage): WorkspaceOptimizationPlan {
  const owner = captureWorkspaceIdentity()
  if (!owner.key) throw new Error('Open an existing class workspace before making room.')
  const before = storage.getItem(owner.key), decoded = readStoredWorkspace(storage, owner.key)
  if (!before || !decoded) throw new Error('There is no saved workspace to optimize. Keep the notebook folder or ZIP and retry saving.')
  if (before.startsWith(WORKSPACE_CHUNKS_PREFIX)) throw new Error('This workspace already uses compact storage. This notebook still exceeds the available browser space. Keep its folder or ZIP; your saved notebooks were kept.')
  const after = encodeWorkspaceStorage(decoded, { requireChunks: true })
  if (decodeWorkspaceStorage(after) !== decoded) throw new Error('The storage conversion did not preserve the complete workspace. Nothing was changed.')
  const plan = Object.freeze({ owner: Object.freeze(owner), before, after, bytesBefore: before.length * 2, bytesAfter: after.length * 2 })
  issuedPlans.add(plan)
  return plan
}

export async function commitWorkspaceOptimization(plan: WorkspaceOptimizationPlan, options: {
  otherTabsClosed: boolean
  storage?: Storage
  repository?: WorkspaceRecoveryRepository
}): Promise<{ snapshotId: string; bytesBefore: number; bytesAfter: number }> {
  if (!issuedPlans.has(plan) || !options.otherTabsClosed) throw new Error('Save unfinished work and close every other Premed OS tab before making room. Keep this tab open.')
  const storage = options.storage ?? localStorage, repository = options.repository ?? workspaceRecoveryRepository(), key = plan.owner.key!
  const assertFresh = () => {
    assertOwner(plan.owner)
    if (storage.getItem(key) !== plan.before) throw new WorkspaceChangedError('Saved work changed while the recovery copy was being prepared. Nothing was replaced. Open storage recovery again to use the latest version.')
  }
  assertFresh()
  const snapshot: WorkspaceRecoverySnapshot = { format: 'premed-os-workspace-recovery', version: 1, workspaceKey: key, id: crypto.randomUUID(), createdAt: Date.now(), stored: plan.before, sha256: await digest(plan.before) }
  assertFresh()
  await repository.save(snapshot)
  const verified = await repository.read(key, snapshot.id)
  const decoded = await verifySnapshot(verified, key)
  if (verified!.id !== snapshot.id || verified!.stored !== plan.before || decoded !== decodeWorkspaceStorage(plan.before)) throw new Error('The recovery copy differs from the saved workspace. Nothing was changed.')
  // All awaited work is complete. There is no optimistic state mutation to roll
  // back. Closing the other tabs is essential: localStorage has no cross-tab CAS.
  assertFresh()
  try { writeStoredWorkspace(storage, key, plan.after) }
  catch (cause) { throw new Error('The browser could not make room. Your saved workspace and verified recovery copy were kept. Keep your notebook folder or ZIP and try again later.', { cause }) }
  if (storage.getItem(key) !== plan.after) throw new Error('Browser storage did not retain the optimized workspace. The recovery copy is available; keep your notebook folder or ZIP.')
  issuedPlans.delete(plan)
  return { snapshotId: snapshot.id, bytesBefore: plan.bytesBefore, bytesAfter: plan.bytesAfter }
}

export async function workspaceRecoveryExport(repository: WorkspaceRecoveryRepository = workspaceRecoveryRepository()): Promise<{ text: string; filename: string }> {
  const owner = captureWorkspaceIdentity()
  if (!owner.key) throw new Error('Open the intended workspace first.')
  const snapshot = await repository.latest(owner.key)
  if (!snapshot) throw new Error('No storage recovery copy exists for this workspace yet.')
  const decoded = await verifySnapshot(snapshot, owner.key)
  assertOwner(owner)
  // The standard Settings backup importer accepts AppData, not Zustand's wrapper.
  return { text: JSON.stringify(JSON.parse(decoded).state, null, 2), filename: `premedos-workspace-recovery-${new Date(snapshot.createdAt).toISOString().slice(0, 10)}.json` }
}

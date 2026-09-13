import type { AppData } from '@/lib/types'
import { validateAppData } from '@/lib/validateAppData'
import { notifyAccountWorkspaceReady } from '@/lib/accountWorkspace'
import { ACCOUNT_STORAGE_PREFIX, accountStorageKey } from '@/lib/demoMode'
import { supabase, type DashboardRow } from '@/lib/supabase'
import { dataForRemote, mergeRemotePreservingLocal } from '@/lib/storyPrivacy'
import { activateAccountWorkspace, assertDurableWorkspace, captureWorkspaceIdentity, readWorkspaceData, snapshotData, useStore } from './store'
import { storageFailure, WorkspaceChangedError } from './storageHealth'
import { assertSyncSession, captureSyncSession, getAccountConflict, observeSyncSession, pauseAccountSync, preserveAccountConflict, syncContent, syncDigest, validateRemoteWorkspace } from './accountSyncSafety'
import { workspaceRecoveryRepository } from './workspaceRecoveryRepository'

const changed = () => new WorkspaceChangedError('The account or saved workspace changed. Nothing else was replaced. Reopen this review before continuing.')
const conflictMessage = 'Account copies need review. Sync is paused; download the preserved copies before choosing what to restore.'

/** Own an auth observer even on public pages without a mounted sync hook. */
async function beginMutation(expectedUserId?: string) {
  const captured = captureWorkspaceIdentity()
  if (!captured.key) throw new Error('Open the intended workspace before changing its saved data.')
  const owner = { ...captured, key: captured.key }, before = structuredClone(snapshotData())
  const beforeRaw = localStorage.getItem(owner.key), beforeJson = JSON.stringify(before)
  if (beforeRaw !== null) assertDurableWorkspace(before, owner)
  else if (owner.key.startsWith(ACCOUNT_STORAGE_PREFIX) || !useStore.persist.hasHydrated() || storageFailure()) {
    throw new Error('This workspace has no verified saved copy. Import and account changes are paused.')
  }
  const client = supabase
  let observedId: string | null | undefined, transitions = 0, closed = false
  const subscription = client?.auth.onAuthStateChange((_event, session) => {
    const next = session?.user.id ?? null
    if (observedId !== undefined && observedId !== next) transitions++
    observedId = next
    observeSyncSession(next)
  }).data.subscription
  const dispose = () => { closed = true; subscription?.unsubscribe() }
  try {
    const auth = client ? await client.auth.getSession() : null
    if (auth?.error) throw auth.error
    const userId = auth?.data.session?.user.id ?? null
    if (transitions || (observedId !== undefined && observedId !== userId)
      || (expectedUserId !== undefined && userId !== expectedUserId)
      || (owner.key.startsWith(ACCOUNT_STORAGE_PREFIX) && owner.key !== accountStorageKey(userId ?? ''))) throw changed()
    observedId = userId
    const token = observeSyncSession(userId)
    const assertFresh = () => {
      const current = captureWorkspaceIdentity(), session = captureSyncSession()
      if (closed || transitions || owner.key !== current.key || owner.epoch !== current.epoch
        || session.id !== token.id || session.generation !== token.generation
        || localStorage.getItem(owner.key) !== beforeRaw || JSON.stringify(snapshotData()) !== beforeJson) throw changed()
      if (userId) assertSyncSession(token)
      if (getAccountConflict(userId)) throw new Error(conflictMessage)
    }
    const check = async () => {
      assertFresh()
      if (client) {
        const latest = await client.auth.getSession()
        if (latest.error) throw latest.error
        if ((latest.data.session?.user.id ?? null) !== userId) throw changed()
      }
      assertFresh()
    }
    const archive = async (workspaceKey: string, stored: string) => {
      assertFresh()
      const sha256 = await syncDigest(JSON.stringify(stored))
      assertFresh()
      const repository = workspaceRecoveryRepository()
      const snapshot = { format: 'premed-os-workspace-recovery' as const, version: 1 as const, workspaceKey, id: crypto.randomUUID(), createdAt: Date.now(), stored, sha256 }
      await repository.save(snapshot)
      assertFresh()
      const copy = await repository.read(workspaceKey, snapshot.id)
      assertFresh()
      if (!copy || copy.workspaceKey !== workspaceKey || copy.id !== snapshot.id || copy.stored !== stored || copy.sha256 !== sha256) {
        throw new Error('The recovery copy could not be verified. No replacement was started.')
      }
    }
    assertFresh()
    return { owner, before, beforeRaw, token, userId, assertFresh, check, archive, dispose }
  } catch (error) { dispose(); throw error }
}

// Imported/remote data has no proven local cache schema version. Do not invent one.
const wrapped = (data: AppData) => JSON.stringify({ state: data })

/** Preserve the actual target-account copies before any direct setup/merge write. */
export async function prepareAccountMutation(userId: string, reviewedRemote: AppData | null, reviewedLocal?: AppData) {
  const client = supabase
  if (!client) throw new Error('Account access is unavailable. Nothing was replaced.')
  const mutation = await beginMutation(userId)
  try {
    if (reviewedLocal && JSON.stringify(reviewedLocal) !== JSON.stringify(mutation.before)) throw changed()
    const key = accountStorageKey(userId), targetRaw = localStorage.getItem(key), cached = readWorkspaceData(key)
    const assertTarget = () => { if (localStorage.getItem(key) !== targetRaw) throw changed() }
    const { data: row, error } = await client.from('dashboards').select('data, updated_at').eq('user_id', userId).maybeSingle()
    if (error) throw error
    await mutation.check(); assertTarget()
    const remote = row ? row.data : null
    if (remote !== null) validateRemoteWorkspace(remote)
    if (cached && (!remote || syncContent(cached) !== syncContent(remote))) {
      await preserveAccountConflict(userId, targetRaw, remote, mutation.token)
      throw new Error(conflictMessage)
    }
    if ((remote === null) !== (reviewedRemote === null)
      || (remote && reviewedRemote && syncContent(remote) !== syncContent(reviewedRemote))) {
      throw new Error('The cloud copy changed after this review opened. Reopen the review; no replacement was started.')
    }
    const remoteAt = row?.updated_at
    if (remote && (typeof remoteAt !== 'string' || !remoteAt)) throw new Error('The cloud copy has no usable revision. No replacement was started.')
    await mutation.archive(mutation.owner.key, mutation.beforeRaw ?? wrapped(mutation.before))
    if (targetRaw !== null && key !== mutation.owner.key) await mutation.archive(key, targetRaw)
    if (remote) await mutation.archive(`${key}:before-explicit-cloud-write`, wrapped(remote))
    await mutation.check(); assertTarget()
    let serverSaved = false
    return {
      get serverSaved() { return serverSaved },
      pause() { pauseAccountSync(userId) },
      async check() { await mutation.check(); assertTarget() },
      async write(data: AppData) {
        validateRemoteWorkspace(data)
        await mutation.check(); assertTarget()
        pauseAccountSync(userId)
        const next: DashboardRow = { user_id: userId, data: dataForRemote(data), updated_at: new Date().toISOString() }
        if (remote) {
          // Compare the reviewed revision at the server write boundary.
          const result = await client.from('dashboards').update(next).eq('user_id', userId).eq('updated_at', remoteAt!).select('user_id').maybeSingle()
          if (result.error) throw result.error
          if (!result.data) throw new Error('The cloud copy changed before saving. Reopen the review; no replacement was accepted.')
        } else {
          const result = await client.from('dashboards').insert(next)
          if (result.error) throw result.error
        }
        serverSaved = true
        await mutation.check(); assertTarget()
      },
      activate(data: AppData) {
        mutation.assertFresh(); assertTarget()
        pauseAccountSync(userId)
        try {
          activateAccountWorkspace(userId, data)
          assertDurableWorkspace(snapshotData(), captureWorkspaceIdentity())
        } catch (error) { pauseAccountSync(userId); throw error }
      },
      dispose: mutation.dispose,
    }
  } catch (error) { mutation.dispose(); throw error }
}

export type AccountMutation = Awaited<ReturnType<typeof prepareAccountMutation>>
export function accountMutationFailure(error: unknown, mutation?: AccountMutation) {
  const detail = error instanceof Error ? error.message : 'The operation could not finish.'
  if (mutation?.serverSaved) mutation.pause()
  return mutation?.serverSaved
    ? `The cloud accepted the change, but local completion was not confirmed. Recovery copies were kept. Do not submit again until the saved copies are reviewed. ${detail}`
    : detail
}

/** Capture Settings' owner before its file/Drive loader yields. */
export async function restoreWorkspaceFromSource(load: () => Promise<AppData>, keepPrivateStories = false): Promise<void> {
  const mutation = await beginMutation()
  try {
    const input = await load()
    await mutation.check()
    if (validateAppData(input).length) throw new Error('That backup has an invalid structure. Nothing was replaced.')
    const data = structuredClone(keepPrivateStories ? mergeRemotePreservingLocal(input, mutation.before) : input)
    await mutation.archive(mutation.owner.key, mutation.beforeRaw ?? wrapped(mutation.before))
    await mutation.archive(`${mutation.owner.key}:explicit-restore-input`, wrapped(data))
    await mutation.check()
    mutation.assertFresh()
    if (mutation.userId) pauseAccountSync(mutation.userId)
    useStore.getState().replaceAll(data)
    try { assertDurableWorkspace(snapshotData(), mutation.owner) }
    catch (error) {
      if (mutation.userId) pauseAccountSync(mutation.userId)
      // Do not overwrite a different disk snapshot while reporting a failed save.
      const owner = captureWorkspaceIdentity()
      if (owner.key === mutation.owner.key && owner.epoch === mutation.owner.epoch && localStorage.getItem(owner.key) === mutation.beforeRaw) {
        useStore.getState().adoptPreparedWorkspace(mutation.before)
      }
      throw new Error('The restore could not be confirmed as saved. The prior workspace recovery copy was kept. Automatic sync must remain paused until storage is healthy.', { cause: error })
    }
    if (mutation.userId && mutation.owner.key === accountStorageKey(mutation.userId)) {
      assertSyncSession(mutation.token)
      // Request reconciliation, not unconditional permission to upload the restore.
      notifyAccountWorkspaceReady(mutation.userId)
    }
  } finally { mutation.dispose() }
}

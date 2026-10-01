import { isSchemaGuardError, prepareWorkspaceData, mergeRestoredWorkspace, WorkspaceSchemaError } from '@/lib/workspaceSchema'
import type { AppData } from '@/lib/types'
import { validateAppData } from '@/lib/validateAppData'
import { notifyAccountWorkspaceReady } from '@/lib/accountWorkspace'
import { ACCOUNT_STORAGE_PREFIX, accountStorageKey } from '@/lib/demoMode'
import { supabase } from '@/lib/supabase'
import { dataForRemote, mergeRemotePreservingLocal } from '@/lib/storyPrivacy'
import { activateAccountWorkspace, assertDurableWorkspace, captureWorkspaceIdentity, readWorkspaceData, snapshotData, useStore } from './store'
import { loadDurableWorkspace } from './workspaceBootstrap'
import { workspacePersistence } from './workspacePersistence'
import { savedWorkspaceRaw, flushWorkspaceStorage, storageFailure, WorkspaceChangedError } from './storageHealth'
import { getAccountSchemaBlock, pauseAccountForSchema, assertSyncSession, captureSyncSession, getAccountConflict, observeSyncSession, assertSyncLease, finishAccountConflictReview, type AccountConflict, pauseAccountSync, preserveAccountConflict, recordAccountRecoveryNotice, syncContent, syncDigest, validateRemoteWorkspace } from './accountSyncSafety'
import { workspaceRecoveryRepository } from './workspaceRecoveryRepository'
import { syncNotebookImages } from '@/lib/academics/notebook/sharedNotebookAssets'
import { notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { DashboardWriteMiss, readDashboard, writeDashboard, type RemoteDashboard } from './dashboardRows'

const changed = () => new WorkspaceChangedError('The account or saved workspace changed. Nothing else was replaced. Reopen this review before continuing.')
const conflictMessage = 'Account copies need review. Sync is paused; download the preserved copies before choosing what to restore.'

/** This refusal happens before a reviewed mutation can archive or write. */
export class StaleAccountReviewError extends Error {
  constructor() {
    super('The cloud copy changed after this review opened. Reopen the review; no replacement was started.')
    this.name = 'StaleAccountReviewError'
  }
}

/** Own an auth observer even on public pages without a mounted sync hook. */
async function beginMutation(expectedUserId?: string, reviewedConflict?: AccountConflict) {
  const captured = captureWorkspaceIdentity()
  if (!captured.key) throw new Error('Open the intended workspace before changing its saved data.')
  const owner = { ...captured, key: captured.key }, before = structuredClone(snapshotData())
  await flushWorkspaceStorage(owner.key)
  const beforeRaw = savedWorkspaceRaw(owner.key), beforeJson = JSON.stringify(before)
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
    if (getAccountSchemaBlock(userId)) throw new Error(getAccountSchemaBlock(userId))
    observedId = userId
    const token = observeSyncSession(userId)
    const assertFresh = () => {
      if (getAccountSchemaBlock(userId)) throw new Error(getAccountSchemaBlock(userId))
      const current = captureWorkspaceIdentity(), session = captureSyncSession()
      if (closed || transitions || owner.key !== current.key || owner.epoch !== current.epoch
        || session.id !== token.id || session.generation !== token.generation
        || savedWorkspaceRaw(owner.key) !== beforeRaw || JSON.stringify(snapshotData()) !== beforeJson) throw changed()
      if (userId) assertSyncSession(token)
      if (reviewedConflict) {
        assertSyncLease(token)
        if (getAccountConflict(userId) !== reviewedConflict) throw changed()
      } else if (getAccountConflict(userId)) throw new Error(conflictMessage)
    }
    const check = async () => {
      await flushWorkspaceStorage(owner.key)
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
    const key = accountStorageKey(userId)
    await loadDurableWorkspace(key)
    const targetRaw = savedWorkspaceRaw(key), cached = readWorkspaceData(key)
    const assertTarget = () => { if (savedWorkspaceRaw(key) !== targetRaw) throw changed() }
    // Row metadata and version gates run before any comparison or replacement.
    const row = await readDashboard(client, userId, () => { mutation.assertFresh(); assertTarget() }, { localRaw: targetRaw, token: mutation.token })
    await mutation.check(); assertTarget()
    const remote = row ? row.data : null
    if (cached && (!remote || syncContent(cached) !== syncContent(remote))) {
      await preserveAccountConflict(userId, targetRaw, remote, mutation.token)
      throw new Error(conflictMessage)
    }
    if ((remote === null) !== (reviewedRemote === null)
      || (remote && reviewedRemote && syncContent(remote) !== syncContent(reviewedRemote))) {
      throw new StaleAccountReviewError()
    }
    await mutation.archive(mutation.owner.key, mutation.beforeRaw ?? wrapped(mutation.before))
    if (targetRaw !== null && key !== mutation.owner.key) await mutation.archive(key, targetRaw)
    if (remote) await mutation.archive(`${key}:before-explicit-cloud-write`, wrapped(remote))
    await mutation.check(); assertTarget()
    let serverSaved = false
    return {
      get serverSaved() { return serverSaved },
      pause() { pauseAccountSync(userId) },
      async check() { await mutation.check(); await flushWorkspaceStorage(key); assertTarget() },
      async write(data: AppData) {
        data = mergeRestoredWorkspace(remote ?? mutation.before, data)
        validateRemoteWorkspace(data)
        await mutation.check(); await flushWorkspaceStorage(key); assertTarget()
        pauseAccountSync(userId)
        await syncNotebookImages(dataForRemote(prepareWorkspaceData(data)), userId, notebookAssetRepository(), async () => { await mutation.check(); assertTarget() })
        // Conditional on the reviewed revision: a first claim of a legacy row, a
        // compare-and-set on write_rev, or an insert when no row existed.
        try {
          await writeDashboard(client, userId, dataForRemote(prepareWorkspaceData(data)), row, () => { mutation.assertFresh(); assertTarget() })
        } catch (error) {
          if (error instanceof DashboardWriteMiss) throw new Error('The cloud copy changed before saving. Reopen the review; no replacement was accepted.', { cause: error })
          if (isSchemaGuardError(error) || error instanceof WorkspaceSchemaError) pauseAccountForSchema(userId, error instanceof Error ? error.message : 'This tab is out of date.')
          throw error
        }
        serverSaved = true
        await mutation.check(); assertTarget()
      },
      activate(data: AppData) {
        mutation.assertFresh(); assertTarget()
        pauseAccountSync(userId)
        try {
          activateAccountWorkspace(userId, mergeRestoredWorkspace(remote ?? data, data))
          const activatedOwner = captureWorkspaceIdentity()
          if (workspacePersistence()) return flushWorkspaceStorage(accountStorageKey(userId)).then(() => { assertSyncSession(mutation.token); assertDurableWorkspace(snapshotData(), activatedOwner) }).catch(error => { pauseAccountSync(userId); throw error })
          assertDurableWorkspace(snapshotData(), captureWorkspaceIdentity())
        } catch (error) { pauseAccountSync(userId); throw error }
      },
      dispose: mutation.dispose,
    }
  } catch (error) { mutation.dispose(); throw error }
}

export type AccountMutation = Awaited<ReturnType<typeof prepareAccountMutation>>
export function accountMutationFailure(error: unknown, mutation?: AccountMutation) {
  const detail = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'The operation could not finish.'
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
    const data = structuredClone(mergeRestoredWorkspace(mutation.before, keepPrivateStories ? mergeRemotePreservingLocal(input, mutation.before) : input))
    await mutation.archive(mutation.owner.key, mutation.beforeRaw ?? wrapped(mutation.before))
    await mutation.archive(`${mutation.owner.key}:explicit-restore-input`, wrapped(data))
    await mutation.check()
    mutation.assertFresh()
    if (mutation.userId) pauseAccountSync(mutation.userId)
    useStore.getState().replaceAll(data)
    try { await flushWorkspaceStorage(mutation.owner.key); assertDurableWorkspace(snapshotData(), mutation.owner) }
    catch (error) {
      if (mutation.userId) pauseAccountSync(mutation.userId)
      // Do not overwrite a different disk snapshot while reporting a failed save.
      const owner = captureWorkspaceIdentity()
      if (owner.key === mutation.owner.key && owner.epoch === mutation.owner.epoch && savedWorkspaceRaw(owner.key) === mutation.beforeRaw) {
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

/** Explicit review only: ordinary import, sign-in and background sync cannot use this path. */
export async function prepareAccountConflictResolution(userId: string, conflict: AccountConflict) {
  const client = supabase
  if (!client || getAccountConflict(userId) !== conflict) throw changed()
  if (conflict.schemaBlocked || getAccountSchemaBlock(userId)) throw new Error(getAccountSchemaBlock(userId) ?? conflict.message)
  if (conflict.open || !conflict.localRaw || !conflict.remote) {
    throw new Error('This recovery includes unsaved or unreadable work. Keep its downloads before choosing a replacement; a two-copy review is unavailable.')
  }
  const mutation = await beginMutation(userId, conflict)
  try {
    if (mutation.owner.key !== accountStorageKey(userId)) throw changed()
    const readRemote = async (): Promise<RemoteDashboard> => {
      const result = await readDashboard(client, userId, mutation.check, { localRaw: mutation.beforeRaw, token: mutation.token })
      await mutation.check()
      if (!result) throw new Error('The cloud copy changed. Reopen the comparison.')
      return result
    }
    const sameRevision = (a: RemoteDashboard, b: RemoteDashboard) => a.updatedAt === b.updatedAt && a.claim?.writeRev === b.claim?.writeRev && a.claim?.cloudSchema === b.claim?.cloudSchema
    const remote = await readRemote()
    await mutation.archive(mutation.owner.key, mutation.beforeRaw!)
    await mutation.archive(`${mutation.owner.key}:before-reviewed-resolution`, wrapped(remote.data))
    const device = structuredClone(mutation.before), cloud = structuredClone(remote.data)
    const stored = await workspacePersistence()?.repository.read(mutation.owner.key)
    await mutation.check()
    const deviceSavedAt = stored?.raw === mutation.beforeRaw ? stored.updatedAt : null
    const cloudSavedAt = conflict.cloudSavedAt && conflict.remote && syncContent(remote.data) === syncContent(conflict.remote) ? conflict.cloudSavedAt : remote.updatedAt
    let applying = false
    return {
      device: structuredClone(device), cloud: structuredClone(cloud), updatedAt: cloudSavedAt, deviceSavedAt,
      dispose: mutation.dispose,
      async apply(choice: 'device' | 'cloud', onProgress?: (message: string) => void) {
        if (applying || (choice !== 'device' && choice !== 'cloud')) throw new Error('Reopen the comparison before trying again.')
        applying = true
        let serverSaved = false
        try {
          await mutation.check()
          const latest = await readRemote()
          if (!sameRevision(latest, remote) || syncContent(latest.data) !== syncContent(cloud)) throw new Error('The cloud copy changed after review. Reopen the comparison.')
          const chosen = choice === 'device' ? mergeRestoredWorkspace(cloud, device) : mergeRestoredWorkspace(device, mergeRemotePreservingLocal(cloud, device))
          let confirmed = remote
          // Only the image stage gets this idle timeout: no workspace write has
          // started yet. Disposing fences every continuation of a late upload.
          let idleTimer: ReturnType<typeof setTimeout> | undefined
          let stalled = false
          let rejectIdle!: (error: Error) => void
          const idle = new Promise<never>((_resolve, reject) => { rejectIdle = reject })
          const progress = (verified: number, total: number) => {
            if (stalled) return
            if (idleTimer) clearTimeout(idleTimer)
            idleTimer = setTimeout(() => {
              stalled = true
              mutation.dispose()
              rejectIdle(new Error('Notebook image transfer stopped making progress. Your recovery copies are safe and no workspace was replaced. Check your connection, then retry checking copies.'))
            }, 120_000)
            onProgress?.(total ? `Uploading notebook images: ${verified} of ${total}` : 'Saving your choice…')
          }
          progress(0, 0)
          try { await Promise.race([syncNotebookImages(dataForRemote(prepareWorkspaceData(chosen)), userId, notebookAssetRepository(), mutation.check, undefined, progress), idle]) }
          finally { if (idleTimer) clearTimeout(idleTimer) }
          await mutation.check()
          onProgress?.('Saving your choice…')
          if (choice === 'device') {
            let saved: RemoteDashboard
            try { saved = await writeDashboard(client, userId, dataForRemote(prepareWorkspaceData(chosen)), remote, mutation.check) }
            catch (error) {
              if (error instanceof DashboardWriteMiss) throw new Error('The cloud copy changed before saving. Reopen the comparison.', { cause: error })
              throw error
            }
            serverSaved = true
            await mutation.check()
            confirmed = await readRemote()
            if (!sameRevision(confirmed, saved) || syncContent(confirmed.data) !== syncContent(chosen)) throw new Error('The cloud result could not be verified.')
          }
          await mutation.check()
          if (choice === 'cloud') {
            const finalCloud = await readRemote()
            if (!sameRevision(finalCloud, remote) || syncContent(finalCloud.data) !== syncContent(cloud)) throw new Error('The cloud copy changed before restoring. Reopen the comparison.')
          }
          let applied = mutation.before
          if (choice === 'cloud' || syncContent(chosen) !== syncContent(device)) {
            useStore.getState().replaceAll(structuredClone(chosen))
            applied = structuredClone(snapshotData())
            await flushWorkspaceStorage(mutation.owner.key)
            if (JSON.stringify(snapshotData()) !== JSON.stringify(applied)) throw changed()
            assertSyncSession(mutation.token)
            assertSyncLease(mutation.token)
            assertDurableWorkspace(snapshotData(), mutation.owner)
          }
          await finishAccountConflictReview(userId, conflict, mutation.token, confirmed.data, confirmed, applied)
          recordAccountRecoveryNotice(userId)
          notifyAccountWorkspaceReady(userId)
        } catch (error) {
          if (isSchemaGuardError(error) || error instanceof WorkspaceSchemaError) pauseAccountForSchema(userId, error instanceof Error ? error.message : 'This tab is out of date. Export your changes, then reopen Premed OS.')
          if (serverSaved) throw new Error('The cloud accepted your choice, but completion was not confirmed. Recovery copies are kept and sync remains paused. Reopen the comparison before trying again.', { cause: error })
          throw error
        } finally { mutation.dispose() }
      },
    }
  } catch (error) { mutation.dispose(); throw error }
}

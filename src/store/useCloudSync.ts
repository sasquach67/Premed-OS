import { CloudColumnsMissingError, isMissingCloudColumnsError, isSchemaGuardError, prepareWorkspaceData, WorkspaceSchemaError } from '@/lib/workspaceSchema'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { sameJson } from '@/lib/logicalJson'
import type { User } from '@supabase/supabase-js'
import { activateAccountWorkspace, activateGuestWorkspace, activeAccountWorkspaceId, assertDurableWorkspace, captureDurableWorkspaceCheck, captureWorkspaceIdentity, readWorkspaceData, useStore, snapshotData } from './store'
import { supabase, isSupabaseConfigured, authRedirectTo } from '@/lib/supabase'
import { dataForRemote } from '@/lib/storyPrivacy'
import { accountStorageKey } from '@/lib/demoMode'
import { hasLocalWork, hasSeenMerge } from '@/lib/publicLayer'
import { readOutgoingWorkspace } from './workspaceTransitionRecovery'
import { loadDurableWorkspace } from './workspaceBootstrap'
import { savedWorkspaceRaw, flushWorkspaceStorage, storageFailure } from './storageHealth'
import { ACCOUNT_WORKSPACE_READY_EVENT } from '@/lib/accountWorkspace'
import { syncAcademicOriginals } from '@/lib/academics/sharedMaterialFiles'
import { syncNotebookImages } from '@/lib/academics/notebook/sharedNotebookAssets'
import { notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { getAccountSchemaBlock, getCloudProtection, pauseAccountForSchema, allowAccountSync, assertAccountUpload, assertSyncLease, assertSyncSession, captureSyncSession, getAccountConflict, isAccountSyncReady, observeSyncSession, pauseAccountSync, preserveAccountConflict, preserveAccountReplacement, readSyncBaseline, rebaseSyncBaseline, recordSyncBaseline, subscribeAccountConflicts, syncContent, syncDigest } from './accountSyncSafety'
import { DashboardWriteMiss, readDashboard, writeDashboard, type RemoteDashboard } from './dashboardRows'
import { CloudRequestError } from './cloudRequest'

const DEBOUNCE_MS = 4000
const reconciliationJobs = new Map<string, Promise<void>>()
export type CloudStatus = 'idle' | 'signing-in' | 'syncing' | 'synced' | 'error' | 'offline'

export function useCloudSync() {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<CloudStatus>(isSupabaseConfigured ? 'idle' : 'offline')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState<number>()
  const lastSig = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushing = useRef(false)
  const retryAfterReconnect = useRef(false)
  const conflict = useSyncExternalStore(subscribeAccountConflicts, () => getAccountConflict(user?.id))
  const accountReady = useSyncExternalStore(subscribeAccountConflicts, () => isAccountSyncReady(user?.id))
  const protection = useSyncExternalStore(subscribeAccountConflicts, () => getCloudProtection(user?.id))

  const reconcile = useCallback(async (u: User) => {
    if (!supabase) return
    const schemaBlock = getAccountSchemaBlock(u.id)
    if (schemaBlock) { setError(schemaBlock); setStatus('error'); return }
    // An existing two-copy review owns recovery. Another hook or pull must not
    // replace it mid-comparison; the review itself rechecks the latest cloud copy.
    const pendingReview = getAccountConflict(u.id)
    if (pendingReview?.saved && pendingReview.localRaw && pendingReview.remote && !pendingReview.open) {
      retryAfterReconnect.current = false
      setStatus('error')
      return
    }
    const token = captureSyncSession()
    const jobKey = `${u.id}:${token.generation}`
    const existing = reconciliationJobs.get(jobKey)
    if (existing) {
      setStatus('syncing')
      await existing
      try {
        assertSyncSession(token)
        if (isAccountSyncReady(u.id)) lastSig.current = syncContent(snapshotData())
        setStatus(isAccountSyncReady(u.id) ? 'synced' : getAccountConflict(u.id) ? 'error' : 'idle')
      } catch { /* A later session owns the UI. */ }
      return
    }
    const work = async () => {
      const owner = captureWorkspaceIdentity()
      const key = accountStorageKey(u.id)
      let before: string | null = null
      const lease = pauseAccountSync(u.id)
      const open = structuredClone(snapshotData()), openJson = JSON.stringify(open)
      const openRaw = owner.key ? savedWorkspaceRaw(owner.key) : null
      const durableOpen = () => {
        if (openRaw !== null) assertDurableWorkspace(snapshotData(), owner)
        else if (!useStore.persist.hasHydrated() || storageFailure() || activeAccountWorkspaceId() || hasLocalWork(snapshotData())) throw new Error('The open workspace has unsaved work. Save or export it before changing workspaces.')
      }
      setStatus('syncing'); setError(''); setProgress('Checking your saved account…'); retryAfterReconnect.current = false
      const fresh = () => {
        assertSyncSession(token)
        if (token.id !== u.id || captureWorkspaceIdentity().epoch !== owner.epoch || captureWorkspaceIdentity().key !== owner.key || savedWorkspaceRaw(key) !== before || JSON.stringify(snapshotData()) !== openJson) throw new Error('Saved work or the active workspace changed during sync. Nothing was replaced; check sync again.')
        durableOpen()
      }
      try {
        await loadDurableWorkspace(key)
        await flushWorkspaceStorage(owner.key)
        assertSyncSession(token)
        before = savedWorkspaceRaw(key)
        try { durableOpen() }
        catch (cause) {
          await preserveAccountConflict(u.id, before, null, token, 'The open workspace has changes that are not confirmed saved. It was kept open. Download its open-workspace copy before leaving this tab.', { data: open, key: owner.key ?? 'unknown', raw: openRaw })
          throw cause
        }
        let local
        try { local = readWorkspaceData(key) }
        catch (cause) {
          await preserveAccountConflict(u.id, before, null, token, 'The saved device copy could not be loaded safely. Sync and backups are paused. Download its exact cache for recovery.')
          throw cause
        }
        const detached = await readOutgoingWorkspace(key)
        fresh(); assertSyncLease(lease)
        if (detached && (!local || !sameJson(detached.data, local))) {
          await preserveAccountConflict(u.id, before, null, token, 'Unsaved work was kept when this account closed. Download the open-workspace copy to review those edits. Automatic sync and backups remain paused.', detached)
          fresh()
          if (local) activateAccountWorkspace(u.id)
          setStatus('error'); return
        }
        // Preserve the existing first-login review of Guest/legacy device work.
        // A returning account's own cache must still be checked after sign-out.
        if (!local && !hasSeenMerge(u.id) && hasLocalWork(snapshotData())) { setStatus('idle'); return }
        const checked = () => { fresh(); assertSyncLease(lease) }
        // Metadata and version gates run inside the read, before anything hydrates.
        let remote: RemoteDashboard | null = await readDashboard(supabase!, u.id, checked, { localRaw: before, token })
        fresh()
        if (!remote) {
          if (local) { await preserveAccountConflict(u.id, before, null, token); fresh(); activateAccountWorkspace(u.id) }
          setStatus('idle')
          return
        }
        let baseline = readSyncBaseline(u.id)
        // Protection is proven, not assumed (S1 item 14). An unclaimed row is claimed
        // with exactly the reviewed cloud document, only its portable marker added:
        // no local edits, defaults, migration or privacy rewrite ride along. Local
        // edits stay dirty and reconcile below as usual.
        for (let attempt = 0; !remote.claim; attempt++) {
          const reviewed: RemoteDashboard = remote
          setProgress('Turning on cloud protection…')
          try {
            remote = await writeDashboard(supabase!, u.id, prepareWorkspaceData(reviewed.data), reviewed, checked)
          } catch (cause) {
            if (!(cause instanceof DashboardWriteMiss) || attempt === 2) throw cause
            remote = await readDashboard(supabase!, u.id, checked, { localRaw: before, token })
            if (!remote) throw new Error('The cloud copy was removed during the account check. Nothing was replaced; check sync again.', { cause })
            fresh()
            continue
          }
          fresh()
          // The claim moved only the server revision. Rebase a baseline that matched it.
          if (baseline && baseline.updatedAt === reviewed.updatedAt) {
            await rebaseSyncBaseline(u.id, baseline, remote, lease)
            baseline = readSyncBaseline(u.id)
          }
        }
        setProgress('Checking your saved account…')
        const localText = local && syncContent(local)
        const remoteText = syncContent(remote.data)
        const localDigest = localText && await syncDigest(localText)
        const remoteDigest = await syncDigest(remoteText)
        fresh()
        const equal = localText === remoteText
        const cleanLocal = baseline && localDigest === baseline.digest
        const remoteUnchanged = baseline && remote.updatedAt === baseline.updatedAt && remoteDigest === baseline.digest
        if (local && !equal && !cleanLocal && !remoteUnchanged) {
          await preserveAccountConflict(u.id, before, remote.data, token)
          fresh()
          // Reopen only the saved local account. This does not choose a sync winner.
          activateAccountWorkspace(u.id)
          setStatus('error')
          return
        }
        if (local && !equal && cleanLocal && !remoteUnchanged) {
          if (!await preserveAccountReplacement(u.id, before!, remote.data, token)) { setStatus('error'); return }
        }
        fresh(); assertSyncLease(lease)
        if (local && (equal || remoteUnchanged)) activateAccountWorkspace(u.id)
        else activateAccountWorkspace(u.id, remote.data)
        await flushWorkspaceStorage(key)
        assertDurableWorkspace()
        assertSyncSession(token)
        const hydrated = snapshotData(), hydratedOwner = captureWorkspaceIdentity()
        const checkImages = captureDurableWorkspaceCheck(hydrated, hydratedOwner)
        await syncNotebookImages(hydrated, u.id, notebookAssetRepository(), () => { assertSyncLease(lease); checkImages() }, undefined, (verified, total) => {
          setProgress(total ? `Checking notebook images (${verified} of ${total})…` : 'Finishing account check…')
        })
        if (!local || equal || cleanLocal) await recordSyncBaseline(u.id, remote.data, remote, lease)
        // Dirty local edits over an unchanged cloud keep their baseline digest, but
        // the next save needs this revision's server metadata, read just now.
        else if (baseline && remoteUnchanged && (baseline.claim?.writeRev !== remote.claim?.writeRev || baseline.claim?.cloudSchema !== remote.claim?.cloudSchema)) await rebaseSyncBaseline(u.id, baseline, remote, lease)
        assertSyncLease(lease)
        assertDurableWorkspace()
        allowAccountSync(lease)
        lastSig.current = remoteText
        setStatus('synced'); setProgress(''); setLastSyncAt(Date.parse(remote.updatedAt))
      } catch (cause) {
        try { assertSyncSession(token) } catch { return }
        pauseAccountSync(u.id)
        // A failed cloud read must not hide a readable returning-account cache
        // behind Guest. Reopen only the unchanged device copy, never a fallback.
        const current = captureWorkspaceIdentity()
        try {
          if (owner.key === current.key && owner.epoch === current.epoch && savedWorkspaceRaw(key) === before && activeAccountWorkspaceId() !== u.id) {
            fresh(); if (readWorkspaceData(key)) activateAccountWorkspace(u.id)
          }
        } catch { /* A target that failed to load stays protected; report the original failure below. */ }
        // Missing columns: no fallback writer. Edits stay on the device; re-read later.
        const missing = isMissingCloudColumnsError(cause)
        retryAfterReconnect.current = missing || (cause instanceof CloudRequestError && cause.retryable)
        setError(missing ? new CloudColumnsMissingError().message : cause instanceof Error ? cause.message : 'Sync stopped before replacing saved data.'); setStatus('error')
      }
    }
    const job = work()
    reconciliationJobs.set(jobKey, job)
    try { await job } finally { if (reconciliationJobs.get(jobKey) === job) reconciliationJobs.delete(jobKey) }
  }, [])

  const pushNow = useCallback(async () => {
    if (!supabase || !user || pushing.current) return false
    const schemaBlock = getAccountSchemaBlock(user.id)
    if (schemaBlock) { setError(schemaBlock); setStatus('error'); return false }
    pushing.current = true
    const owner = captureWorkspaceIdentity(), snapshot = snapshotData()
    let token = captureSyncSession()
    try {
      await flushWorkspaceStorage(owner.key)
      token = assertAccountUpload(snapshot, owner)
      const baseline = readSyncBaseline(user.id)
      if (!baseline) throw new Error('Check the saved cloud copy before uploading changes.')
      // A baseline without confirmed claim metadata (recorded before S1, or never
      // claimed) needs a fresh read and claim first. Never invent a revision.
      if (!baseline.claim) { pauseAccountSync(user.id); await reconcile(user); return false }
      const expected = { updatedAt: baseline.updatedAt, claim: baseline.claim }
      setStatus('syncing'); setError(''); retryAfterReconnect.current = false
      await syncAcademicOriginals(snapshot.academics.classCenter.files, user.id)
      // Verify the saved snapshot once for the batch. Every image await still
      // checks account ownership, sync pause/conflict state, and durable data.
      const checkImages = captureDurableWorkspaceCheck(snapshot, owner)
      const imageFence = () => {
        assertSyncLease(token)
        if (!isAccountSyncReady(user.id)) throw new Error('Account sync and backups are paused until the saved copies have been checked.')
        checkImages()
      }
      await syncNotebookImages(snapshot, user.id, notebookAssetRepository(), imageFence)
      await flushWorkspaceStorage(owner.key)
      assertSyncSession(token); assertAccountUpload(snapshot, owner)
      // Compare-and-set on write_rev: a newer cloud version cannot be overwritten.
      let saved: RemoteDashboard
      try {
        saved = await writeDashboard(supabase!, user.id, dataForRemote(prepareWorkspaceData(snapshot)), expected, () => { assertSyncLease(token); assertAccountUpload(snapshot, owner) })
      } catch (cause) {
        if (!(cause instanceof DashboardWriteMiss)) throw cause
        // Ordinary concurrency: check the cloud again, never a permanent pause.
        assertSyncSession(token); pauseAccountSync(user.id); await reconcile(user); return false
      }
      assertSyncSession(token)
      const current = captureWorkspaceIdentity()
      if (current.key !== owner.key || current.epoch !== owner.epoch) throw new Error('The workspace changed while sync completed. Its metadata was kept.')
      await recordSyncBaseline(user.id, snapshot, saved, token)
      assertSyncSession(token)
      lastSig.current = syncContent(snapshot)
      setLastSyncAt(Date.parse(saved.updatedAt)); setStatus('synced')
      return true
    } catch (cause) {
      try { assertSyncSession(token) } catch { return false }
      if (isSchemaGuardError(cause) || cause instanceof WorkspaceSchemaError) pauseAccountForSchema(user.id, cause instanceof Error ? cause.message : 'This tab is out of date. Export your changes, then reopen Premed OS.')
      const missing = isMissingCloudColumnsError(cause)
      if (missing) pauseAccountSync(user.id)
      retryAfterReconnect.current = missing || (cause instanceof CloudRequestError && cause.retryable)
      setError(missing ? new CloudColumnsMissingError().message : cause instanceof Error ? cause.message : 'Sync failed'); setStatus('error'); return false
    } finally { pushing.current = false }
  }, [user, reconcile])

  const pullNow = useCallback(async () => { if (user) await reconcile(user) }, [user, reconcile])

  useEffect(() => {
    if (!supabase) return
    let stopped = false, observed = false, lastSession: string | null | undefined
    function apply(u: User | null) {
      if (stopped) return
      const nextId = u?.id ?? null
      const changed = lastSession !== nextId
      lastSession = nextId
      observeSyncSession(u?.id ?? null)
      setUser(u)
      if (changed) { retryAfterReconnect.current = false; setLastSyncAt(undefined); setError(''); lastSig.current = '' }
      if (!u) {
        setStatus('idle')
        if (activeAccountWorkspaceId()) activateGuestWorkspace()
      } else if (changed) {
        if (activeAccountWorkspaceId() && activeAccountWorkspaceId() !== u.id) activateGuestWorkspace()
        void reconcile(u)
      }
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { observed = true; apply(session?.user ?? null) })
    void supabase.auth.getSession().then(({ data }) => { if (!observed) apply(data.session?.user ?? null) })
    return () => { stopped = true; sub.subscription.unsubscribe() }
  }, [reconcile])

  useEffect(() => {
    const ready = (event: Event) => {
      if (user && (event as CustomEvent<{ userId?: string }>).detail?.userId === user.id) void reconcile(user)
    }
    window.addEventListener(ACCOUNT_WORKSPACE_READY_EVENT, ready)
    return () => window.removeEventListener(ACCOUNT_WORKSPACE_READY_EVENT, ready)
  }, [user, reconcile])

  useEffect(() => {
    if (!user || !accountReady || conflict) return
    const schedule = () => {
      if (syncContent(snapshotData()) === lastSig.current) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => { void pushNow() }, DEBOUNCE_MS)
    }
    const unsub = useStore.subscribe(schedule)
    schedule()
    return () => { unsub(); if (timer.current) clearTimeout(timer.current) }
  }, [user, accountReady, conflict, pushNow])

  useEffect(() => {
    if (!user || conflict || status !== 'error' || !retryAfterReconnect.current) return
    const token = captureSyncSession()
    const resume = () => {
      try { assertSyncSession(token); assertSyncLease(token) } catch { return }
      if (getAccountConflict(user.id) || !retryAfterReconnect.current || navigator.onLine === false) return
      retryAfterReconnect.current = false
      // Re-read the cloud after an uncertain response before trying another write.
      void reconcile(user)
    }
    const retry = setTimeout(resume, 60_000)
    window.addEventListener('online', resume)
    return () => { clearTimeout(retry); window.removeEventListener('online', resume) }
  }, [user, conflict, status, reconcile])

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return
    setStatus('signing-in'); setError('')
    try {
      const { error: e } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: authRedirectTo },
      })
      if (e) throw e
      setStatus('idle')
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send link'); setStatus('error')
      return false
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const owner = captureWorkspaceIdentity(), token = captureSyncSession(), before = snapshotData()
    await flushWorkspaceStorage(owner.key)
    assertDurableWorkspace(before, owner)
    const { error: failure } = await supabase.auth.signOut({ scope: 'local' })
    if (failure) throw failure
    const current = captureWorkspaceIdentity(), session = captureSyncSession()
    if ((session.id && session.generation !== token.generation) || (activeAccountWorkspaceId() && (owner.key !== current.key || owner.epoch !== current.epoch))) throw new Error('A different session opened while signing out. Its workspace was kept.')
    observeSyncSession(null)
    activateGuestWorkspace()
    setUser(null); setStatus('idle')
  }, [])

  return { configured: isSupabaseConfigured, user, status, error, progress: status === 'syncing' ? progress : '', lastSyncAt, accountReady: accountReady && !conflict, conflict, protection, signIn, signOut, pushNow, pullNow }
}

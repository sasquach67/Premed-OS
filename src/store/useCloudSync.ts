import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { User } from '@supabase/supabase-js'
import { activateAccountWorkspace, activateGuestWorkspace, activeAccountWorkspaceId, assertDurableWorkspace, captureWorkspaceIdentity, readWorkspaceData, useStore, snapshotData } from './store'
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
import { allowAccountSync, assertAccountUpload, assertSyncLease, assertSyncSession, captureSyncSession, getAccountConflict, isAccountSyncReady, observeSyncSession, pauseAccountSync, preserveAccountConflict, preserveAccountReplacement, readSyncBaseline, recordSyncBaseline, subscribeAccountConflicts, syncContent, syncDigest, validateRemoteWorkspace } from './accountSyncSafety'

const DEBOUNCE_MS = 4000
const reconciliationJobs = new Map<string, Promise<void>>()
export type CloudStatus = 'idle' | 'signing-in' | 'syncing' | 'synced' | 'error' | 'offline'

export function useCloudSync() {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<CloudStatus>(isSupabaseConfigured ? 'idle' : 'offline')
  const [error, setError] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState<number>()
  const lastSig = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushing = useRef(false)
  const conflict = useSyncExternalStore(subscribeAccountConflicts, () => getAccountConflict(user?.id))
  const accountReady = useSyncExternalStore(subscribeAccountConflicts, () => isAccountSyncReady(user?.id))

  const reconcile = useCallback(async (u: User) => {
    if (!supabase) return
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
      setStatus('syncing'); setError('')
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
        if (detached && (!local || JSON.stringify(detached.data) !== JSON.stringify(local))) {
          await preserveAccountConflict(u.id, before, null, token, 'Unsaved work was kept when this account closed. Download the open-workspace copy to review those edits. Automatic sync and backups remain paused.', detached)
          fresh()
          if (local) activateAccountWorkspace(u.id)
          setStatus('error'); return
        }
        // Preserve the existing first-login review of Guest/legacy device work.
        // A returning account's own cache must still be checked after sign-out.
        if (!local && !hasSeenMerge(u.id) && hasLocalWork(snapshotData())) { setStatus('idle'); return }
        const { data: row, error: failure } = await supabase!.from('dashboards').select('data, updated_at').eq('user_id', u.id).maybeSingle()
        fresh()
        if (failure) throw failure
        if (!row?.data) {
          if (local) { await preserveAccountConflict(u.id, before, null, token); fresh(); activateAccountWorkspace(u.id) }
          setStatus('idle')
          return
        }
        validateRemoteWorkspace(row.data)
        const remote = row.data
        const baseline = readSyncBaseline(u.id)
        const localText = local && syncContent(local)
        const remoteText = syncContent(remote)
        const localDigest = localText && await syncDigest(localText)
        const remoteDigest = await syncDigest(remoteText)
        fresh()
        const equal = localText === remoteText
        const cleanLocal = baseline && localDigest === baseline.digest
        const remoteUnchanged = baseline && row.updated_at === baseline.updatedAt && remoteDigest === baseline.digest
        if (local && !equal && !cleanLocal && !remoteUnchanged) {
          await preserveAccountConflict(u.id, before, remote, token)
          fresh()
          // Reopen only the saved local account. This does not choose a sync winner.
          activateAccountWorkspace(u.id)
          setStatus('error')
          return
        }
        if (local && !equal && cleanLocal && !remoteUnchanged) {
          if (!await preserveAccountReplacement(u.id, before!, remote, token)) { setStatus('error'); return }
        }
        fresh(); assertSyncLease(lease)
        if (local && (equal || remoteUnchanged)) activateAccountWorkspace(u.id)
        else activateAccountWorkspace(u.id, remote)
        await flushWorkspaceStorage(key)
        assertDurableWorkspace()
        assertSyncSession(token)
        const hydrated = snapshotData(), hydratedOwner = captureWorkspaceIdentity()
        await syncNotebookImages(hydrated, u.id, notebookAssetRepository(), () => { assertSyncLease(lease); assertDurableWorkspace(hydrated, hydratedOwner) })
        if (!local || equal || cleanLocal) await recordSyncBaseline(u.id, remote, row.updated_at, lease)
        assertSyncLease(lease)
        assertDurableWorkspace()
        allowAccountSync(lease)
        lastSig.current = remoteText
        setStatus('synced'); setLastSyncAt(Date.parse(row.updated_at))
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
        setError(cause instanceof Error ? cause.message : 'Sync stopped before replacing saved data.'); setStatus('error')
      }
    }
    const job = work()
    reconciliationJobs.set(jobKey, job)
    try { await job } finally { if (reconciliationJobs.get(jobKey) === job) reconciliationJobs.delete(jobKey) }
  }, [])

  const pushNow = useCallback(async () => {
    if (!supabase || !user || pushing.current) return false
    pushing.current = true
    const owner = captureWorkspaceIdentity(), snapshot = snapshotData()
    let token = captureSyncSession()
    try {
      await flushWorkspaceStorage(owner.key)
      token = assertAccountUpload(snapshot, owner)
      const baseline = readSyncBaseline(user.id)
      if (!baseline) throw new Error('Check the saved cloud copy before uploading changes.')
      setStatus('syncing'); setError('')
      await syncAcademicOriginals(snapshot.academics.classCenter.files, user.id)
      await syncNotebookImages(snapshot, user.id, notebookAssetRepository(), () => { assertSyncSession(token); assertAccountUpload(snapshot, owner) })
      await flushWorkspaceStorage(owner.key)
      assertSyncSession(token); assertAccountUpload(snapshot, owner)
      const updatedAt = new Date().toISOString()
      // Compare-and-set: a newer cloud version cannot be overwritten by this upload.
      const { data, error: failure } = await supabase.from('dashboards').update({ data: dataForRemote(snapshot), updated_at: updatedAt }).eq('user_id', user.id).eq('updated_at', baseline.updatedAt).select('updated_at').maybeSingle()
      assertSyncSession(token)
      const current = captureWorkspaceIdentity()
      if (current.key !== owner.key || current.epoch !== owner.epoch) throw new Error('The workspace changed while sync completed. Its metadata was kept.')
      if (failure) throw failure
      if (!data) { pauseAccountSync(user.id); await reconcile(user); return false }
      await recordSyncBaseline(user.id, snapshot, data.updated_at, token)
      assertSyncSession(token)
      lastSig.current = syncContent(snapshot)
      setLastSyncAt(Date.parse(data.updated_at)); setStatus('synced')
      return true
    } catch (cause) {
      try { assertSyncSession(token) } catch { return false }
      setError(cause instanceof Error ? cause.message : 'Sync failed'); setStatus('error'); return false
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
      if (changed) { setLastSyncAt(undefined); setError(''); lastSig.current = '' }
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

  return { configured: isSupabaseConfigured, user, status, error, lastSyncAt, accountReady: accountReady && !conflict, conflict, signIn, signOut, pushNow, pullNow }
}

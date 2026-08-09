/* ============================================================
   useCloudSync — Supabase login + whole-dashboard cloud sync.
     • magic-link (passwordless email) auth
     • on sign-in: reconcile local <-> cloud (new browser pulls the
       cloud; otherwise newest-wins), then keep pushing on edits
     • debounced auto-push while signed in (mirrors useBackup)
   localStorage stays the primary store; Supabase is the synced copy
   that follows you across devices. Sync metadata lives OUTSIDE the
   persisted data tree so writing it never triggers another sync.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { useStore, snapshotData } from '@/store/store'
import { supabase, isSupabaseConfigured, authRedirectTo, type DashboardRow } from '@/lib/supabase'
import { hasLocalWork, hasSeenMerge } from '@/lib/publicLayer'
import type { AppData } from '@/lib/types'

const DEBOUNCE_MS = 4000
const META_KEY = 'premed_hq_cloud_meta'

export type CloudStatus = 'idle' | 'signing-in' | 'syncing' | 'synced' | 'error' | 'offline'

type CloudMeta = { userId?: string; lastSyncAt?: number }

function readMeta(): CloudMeta {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') } catch { return {} }
}
function writeMeta(m: CloudMeta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)) } catch { /* ignore quota */ }
}

/** Snapshot minus Drive-backup metadata, so a Drive timestamp write
 *  doesn't look like a data change and cause a redundant cloud push. */
function contentSignature(): string {
  const d = snapshotData() as unknown as Record<string, unknown>
  const settings = { ...(d.settings as Record<string, unknown>) }
  delete settings.backup
  return JSON.stringify({ ...d, settings })
}

export function useCloudSync() {
  const replaceAll = useStore((s) => s.replaceAll)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<CloudStatus>(isSupabaseConfigured ? 'idle' : 'offline')
  const [error, setError] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState<number | undefined>(readMeta().lastSyncAt)
  const lastSig = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconciledFor = useRef<string | null>(null)

  const markSynced = useCallback((userId: string) => {
    lastSig.current = contentSignature()
    const at = Date.now()
    writeMeta({ userId, lastSyncAt: at })
    setLastSyncAt(at)
  }, [])

  const pushNow = useCallback(async () => {
    if (!supabase || !user) return
    setStatus('syncing'); setError('')
    try {
      const row: DashboardRow = { user_id: user.id, data: snapshotData(), updated_at: new Date().toISOString() }
      const { error: e } = await supabase.from('dashboards').upsert(row, { onConflict: 'user_id' })
      if (e) throw e
      markSynced(user.id)
      setStatus('synced')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed'); setStatus('error')
    }
  }, [user, markSynced])

  const pullNow = useCallback(async () => {
    if (!supabase || !user) return
    setStatus('syncing'); setError('')
    try {
      const { data, error: e } = await supabase
        .from('dashboards').select('data, updated_at').eq('user_id', user.id).maybeSingle()
      if (e) throw e
      if (data?.data) { replaceAll(data.data as AppData); markSynced(user.id) }
      setStatus('synced')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pull failed'); setStatus('error')
    }
  }, [user, replaceAll, markSynced])

  // ---- reconcile once per sign-in: new browser pulls; else newest-wins ----
  const reconcile = useCallback(async (u: User) => {
    if (!supabase) return
    setStatus('syncing'); setError('')
    try {
      const { data, error: e } = await supabase
        .from('dashboards').select('data, updated_at').eq('user_id', u.id).maybeSingle()
      if (e) throw e
      const meta = readMeta()
      const remoteAt = data?.updated_at ? Date.parse(data.updated_at) : 0
      const knownAt = meta.userId === u.id ? (meta.lastSyncAt ?? 0) : 0

      if (!data) {
        // No cloud row yet — seed the cloud from this device.
        await pushNowFor(u)
      } else if (knownAt === 0 || remoteAt > knownAt) {
        // Fresh browser, or cloud has edits we haven't seen -> take the cloud.
        replaceAll(data.data as AppData)
        markSynced(u.id)
        setStatus('synced')
      } else {
        // Local is same-or-newer -> push it up.
        await pushNowFor(u)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed'); setStatus('error')
    }
    // local helper that pushes for a specific user (avoids stale `user` closure)
    async function pushNowFor(u2: User) {
      const row: DashboardRow = { user_id: u2.id, data: snapshotData(), updated_at: new Date().toISOString() }
      const { error: e2 } = await supabase!.from('dashboards').upsert(row, { onConflict: 'user_id' })
      if (e2) throw e2
      markSynced(u2.id)
      setStatus('synced')
    }
  }, [replaceAll, markSynced])

  // ---- auth session tracking ----
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => applySession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => applySession(session))
    function applySession(session: Session | null) {
      const u = session?.user ?? null
      setUser(u)
      if (u && reconciledFor.current !== u.id) {
        // 05 §0.2: a signed-out user with work on this device decides what
        // happens to it BEFORE any reconciliation runs. Reconcile is
        // newest-wins, which is exactly the "last write wins" the merge
        // rules forbid — so it waits for the merge screen's answer.
        if (!hasSeenMerge(u.id) && hasLocalWork(snapshotData())) {
          setStatus('idle')
          return
        }
        reconciledFor.current = u.id
        void reconcile(u)
      }
      if (!u) { reconciledFor.current = null; setStatus('idle') }
    }
    return () => sub.subscription.unsubscribe()
  }, [reconcile])

  // ---- debounced auto-push while signed in ----
  useEffect(() => {
    if (!supabase || !user) return
    const unsub = useStore.subscribe(() => {
      if (contentSignature() === lastSig.current) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => { void pushNow() }, DEBOUNCE_MS)
    })
    return () => { unsub(); if (timer.current) clearTimeout(timer.current) }
  }, [user, pushNow])

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
    await supabase.auth.signOut()
    setUser(null); setStatus('idle')
  }, [])

  return {
    configured: isSupabaseConfigured,
    user,
    status,
    error,
    lastSyncAt,
    signIn,
    signOut,
    pushNow,
    pullNow,
  }
}

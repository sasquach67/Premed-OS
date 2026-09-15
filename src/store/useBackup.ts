import { flushWorkspaceStorage } from './storageHealth'
/* ============================================================
   useBackup — orchestrates the Google Drive safety layer:
     • daily auto-backup while open (debounced after data changes)
     • daily-on-open check (>=24h since last backup -> push)
     • exposes status + actions to the UI
   The acknowledged workspace repository is primary; Drive is redundancy.
   ============================================================ */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useStore, snapshotData, captureWorkspaceIdentity, activeAccountWorkspaceId } from '@/store/store'
import { assertAccountUpload, assertSyncSession, isAccountSyncReady, subscribeAccountConflicts } from '@/store/accountSyncSafety'
import * as drive from '@/lib/googleDrive'
import { dataForRemote } from '@/lib/storyPrivacy'
import { createWorkspaceBackup } from '@/lib/workspaceBackup'

const DEBOUNCE_MS = 5000
const DAY_MS = 24 * 60 * 60 * 1000

export type BackupStatus = 'idle' | 'connecting' | 'saving' | 'saved' | 'error' | 'offline'

/** Snapshot stripped of backup-metadata so writing the timestamp
 *  doesn't itself look like a data change (avoids backup loops). */
function contentSignature(snapshot = snapshotData()): string {
  const d = dataForRemote(snapshot) as unknown as Record<string, unknown>
  const settings = { ...(d.settings as Record<string, unknown>) }
  delete settings.backup
  return JSON.stringify({ ...d, settings })
}

export function useBackup() {
  const backup = useStore((s) => s.settings.backup)
  const update = useStore((s) => s.update)
  const envClientId = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '').trim()
  const clientId = backup.googleClientId || envClientId
  const [status, setStatus] = useState<BackupStatus>('idle')
  const [error, setError] = useState<string>('')
  const lastSig = useRef<string>('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dailyChecked = useRef<string | undefined>(undefined)
  const renderedOwner = captureWorkspaceIdentity()
  const syncReady = useSyncExternalStore(subscribeAccountConflicts, () => isAccountSyncReady(activeAccountWorkspaceId() ?? undefined))

  const push = useCallback(async () => {
    setStatus('saving')
    setError('')
    try {
      const owner = captureWorkspaceIdentity(), snapshot = snapshotData()
      if (owner.key !== renderedOwner.key || owner.epoch !== renderedOwner.epoch) throw new Error('The workspace changed. Backup was stopped.')
      await flushWorkspaceStorage(owner.key)
      const session = assertAccountUpload(snapshot, owner)
      const complete = await createWorkspaceBackup(dataForRemote(snapshot))
      assertSyncSession(session); assertAccountUpload(snapshot, owner)
      const id = await drive.uploadCompleteBackup(complete, async () => { await flushWorkspaceStorage(owner.key); assertSyncSession(session); assertAccountUpload(snapshot, owner) }, owner.key!)
      assertSyncSession(session)
      const current = captureWorkspaceIdentity()
      if (current.key !== owner.key || current.epoch !== owner.epoch) throw new Error('The workspace changed while backup completed. No workspace metadata was changed.')
      lastSig.current = contentSignature(snapshot)
      update((d) => {
        d.settings.backup.lastBackupAt = Date.now()
        d.settings.backup.completeDriveFileId = id
        d.settings.backup.lastBackupFormat = 'workspace-v1'
        d.settings.backup.lastError = undefined
      })
      await flushWorkspaceStorage(owner.key)
      assertSyncSession(session)
      const savedOwner = captureWorkspaceIdentity()
      if (savedOwner.key !== owner.key || savedOwner.epoch !== owner.epoch) throw new Error('The workspace changed while saving backup metadata.')
      setStatus('saved')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Backup failed'
      setError(msg)
      setStatus('error')
    }
  }, [update, renderedOwner.key, renderedOwner.epoch])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError('')
    try {
      const owner = captureWorkspaceIdentity(), snapshot = snapshotData()
      await flushWorkspaceStorage(owner.key)
      const session = assertAccountUpload(snapshot, owner)
      await drive.connect(clientId)
      assertSyncSession(session); assertAccountUpload(snapshot, owner)
      update((d) => { d.settings.backup.enabled = true })
      await push()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not connect'
      setError(msg)
      setStatus('error')
    }
  }, [clientId, push, update])

  const disconnect = useCallback(() => {
    drive.disconnect()
    update((d) => { d.settings.backup.enabled = false })
    setStatus('idle')
  }, [update])

  const backupNow = useCallback(async () => {
    try {
      const owner = captureWorkspaceIdentity(), snapshot = snapshotData()
      await flushWorkspaceStorage(owner.key)
      const session = assertAccountUpload(snapshot, owner)
      if (!drive.isConnected()) await drive.connect(clientId)
      assertSyncSession(session); assertAccountUpload(snapshot, owner)
      await push()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Backup stopped.'); setStatus('error') }
  }, [clientId, push])

  const restore = useCallback(async (selectedId?: string) => {
    const owner = captureWorkspaceIdentity()
    if (!drive.isConnected()) await drive.connect(clientId)
    const data = await drive.downloadLatestBackup(owner.key!, selectedId)
    const current = captureWorkspaceIdentity()
    if (current.key !== owner.key || current.epoch !== owner.epoch) throw new Error('The account changed while downloading its backup.')
    return data // caller decides whether to replaceAll
  }, [clientId])
  const restorePoints = useCallback(async () => {
    const owner = captureWorkspaceIdentity()
    if (!drive.isConnected()) await drive.connect(clientId)
    const points = await drive.listCompleteBackups(owner.key!)
    const current = captureWorkspaceIdentity()
    if (current.key !== owner.key || current.epoch !== owner.epoch) throw new Error('The account changed while loading restore points.')
    return points
  }, [clientId])

  // ---- daily-on-open check: silently re-auth + push if >=24h stale ----
  useEffect(() => {
    if (!syncReady) return
    const ownerKey = `${renderedOwner.key}:${renderedOwner.epoch}`
    if (dailyChecked.current === ownerKey) return
    dailyChecked.current = ownerKey
    if (!backup.enabled || !clientId) return
    const stale = !backup.lastBackupAt || Date.now() - backup.lastBackupAt >= DAY_MS
    if (!stale) return
    ;(async () => {
      try {
        const owner = captureWorkspaceIdentity(), snapshot = snapshotData()
        await flushWorkspaceStorage(owner.key)
        const session = assertAccountUpload(snapshot, owner)
        await drive.connectSilent(clientId)
        assertSyncSession(session); assertAccountUpload(snapshot, owner)
        await push()
      } catch {
        setStatus('offline') // needs a manual reconnect
      }
    })()
  }, [backup.enabled, backup.lastBackupAt, clientId, push, syncReady, renderedOwner.key, renderedOwner.epoch])

  // Complete immutable archives include binary originals. Keep automatic
  // snapshots daily; the manual action can capture additional restore points.
  useEffect(() => {
    if (!backup.enabled) return
    const unsub = useStore.subscribe(() => {
      if (!drive.isConnected()) return
      const savedAt = useStore.getState().settings.backup.lastBackupAt
      if (savedAt && Date.now() - savedAt < DAY_MS) return
      if (contentSignature() === lastSig.current) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => { void push() }, DEBOUNCE_MS)
    })
    return () => {
      unsub()
      if (timer.current) clearTimeout(timer.current)
    }
  }, [backup.enabled, push])

  return {
    status,
    error,
    enabled: backup.enabled,
    connected: drive.isConnected(),
    lastBackupAt: backup.lastBackupAt,
    clientId,
    clientIdSource: backup.googleClientId ? 'settings' : envClientId ? 'env' : 'missing',
    configured: Boolean(clientId),
    connect,
    disconnect,
    backupNow,
    restore,
    restorePoints,
  }
}

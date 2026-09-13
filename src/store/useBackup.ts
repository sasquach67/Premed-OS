/* ============================================================
   useBackup — orchestrates the Google Drive safety layer:
     • debounced auto-backup while open (on data change)
     • daily-on-open check (>=24h since last backup -> push)
     • exposes status + actions to the UI
   localStorage is always the primary store; Drive is redundancy.
   ============================================================ */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useStore, snapshotData, captureWorkspaceIdentity, activeAccountWorkspaceId } from '@/store/store'
import { assertAccountUpload, assertSyncSession, isAccountSyncReady, subscribeAccountConflicts } from '@/store/accountSyncSafety'
import * as drive from '@/lib/googleDrive'
import { dataForRemote } from '@/lib/storyPrivacy'

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
      const session = assertAccountUpload(snapshot, owner)
      const id = await drive.uploadBackup(dataForRemote(snapshot), backup.driveFileId, () => { assertSyncSession(session); assertAccountUpload(snapshot, owner) })
      assertSyncSession(session)
      const current = captureWorkspaceIdentity()
      if (current.key !== owner.key || current.epoch !== owner.epoch) throw new Error('The workspace changed while backup completed. No workspace metadata was changed.')
      lastSig.current = contentSignature(snapshot)
      update((d) => {
        d.settings.backup.lastBackupAt = Date.now()
        d.settings.backup.driveFileId = id
        d.settings.backup.lastError = undefined
      })
      setStatus('saved')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Backup failed'
      setError(msg)
      setStatus('error')
    }
  }, [backup.driveFileId, update, renderedOwner.key, renderedOwner.epoch])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError('')
    try {
      const owner = captureWorkspaceIdentity(), snapshot = snapshotData()
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
      const session = assertAccountUpload(snapshot, owner)
      if (!drive.isConnected()) await drive.connect(clientId)
      assertSyncSession(session); assertAccountUpload(snapshot, owner)
      await push()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Backup stopped.'); setStatus('error') }
  }, [clientId, push])

  const restore = useCallback(async () => {
    if (!drive.isConnected()) await drive.connect(clientId)
    const data = await drive.downloadBackup()
    return data // caller decides whether to replaceAll
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
        const session = assertAccountUpload(snapshot, owner)
        await drive.connectSilent(clientId)
        assertSyncSession(session); assertAccountUpload(snapshot, owner)
        await push()
      } catch {
        setStatus('offline') // needs a manual reconnect
      }
    })()
  }, [backup.enabled, backup.lastBackupAt, clientId, push, syncReady, renderedOwner.key, renderedOwner.epoch])

  // ---- debounced auto-backup while open ----
  useEffect(() => {
    if (!backup.enabled) return
    const unsub = useStore.subscribe(() => {
      if (!drive.isConnected()) return
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
  }
}

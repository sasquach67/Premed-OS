/* ============================================================
   useBackup — orchestrates the Google Drive safety layer:
     • debounced auto-backup while open (on data change)
     • daily-on-open check (>=24h since last backup -> push)
     • exposes status + actions to the UI
   localStorage is always the primary store; Drive is redundancy.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore, snapshotData } from '@/store/store'
import * as drive from '@/lib/googleDrive'
import { dataForRemote } from '@/lib/storyPrivacy'

const DEBOUNCE_MS = 5000
const DAY_MS = 24 * 60 * 60 * 1000

export type BackupStatus = 'idle' | 'connecting' | 'saving' | 'saved' | 'error' | 'offline'

/** Snapshot stripped of backup-metadata so writing the timestamp
 *  doesn't itself look like a data change (avoids backup loops). */
function contentSignature(): string {
  const d = dataForRemote(snapshotData()) as unknown as Record<string, unknown>
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
  const dailyChecked = useRef(false)

  const push = useCallback(async () => {
    setStatus('saving')
    setError('')
    try {
      const id = await drive.uploadBackup(dataForRemote(snapshotData()), backup.driveFileId)
      lastSig.current = contentSignature()
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
      update((d) => { d.settings.backup.lastError = msg })
    }
  }, [backup.driveFileId, update])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError('')
    try {
      await drive.connect(clientId)
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
    if (!drive.isConnected()) await drive.connect(clientId)
    await push()
  }, [clientId, push])

  const restore = useCallback(async () => {
    if (!drive.isConnected()) await drive.connect(clientId)
    const data = await drive.downloadBackup()
    return data // caller decides whether to replaceAll
  }, [clientId])

  // ---- daily-on-open check: silently re-auth + push if >=24h stale ----
  useEffect(() => {
    if (dailyChecked.current) return
    dailyChecked.current = true
    if (!backup.enabled || !clientId) return
    const stale = !backup.lastBackupAt || Date.now() - backup.lastBackupAt >= DAY_MS
    if (!stale) return
    ;(async () => {
      try {
        await drive.connectSilent(clientId)
        await push()
      } catch {
        setStatus('offline') // needs a manual reconnect
      }
    })()
  }, [backup.enabled, backup.lastBackupAt, clientId, push])

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

import { useRef, useState } from 'react'
import type { AppData } from '@/lib/types'
import { captureWorkspaceIdentity } from '@/store/store'
import { commitWorkspaceMutation } from '@/store/workspaceTransaction'
import { useAccountCloud } from '@/store/AccountCloudContext'

export function useResearchSave() {
  const cloud = useAccountCloud()
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState(0)
  async function save(mutator: (draft: AppData) => void) {
    if (busy.current) return false
    const owner = captureWorkspaceIdentity()
    busy.current = true; setPending(true); setError(''); setSavedAt(0)
    try {
      await commitWorkspaceMutation(mutator)
      const current = captureWorkspaceIdentity()
      if (owner.key !== current.key || owner.epoch !== current.epoch) return false
      setSavedAt(Date.now())
      return true
    } catch (failure) {
      const current = captureWorkspaceIdentity()
      if (owner.key !== current.key || owner.epoch !== current.epoch) return false
      setError(failure instanceof Error && failure.name === 'WorkspaceChangedError'
        ? 'Your workspace changed during the save. Check the original workspace before trying again.'
        : 'Could not save on this device. Your draft is kept. Try again; keep this page open until it saves.')
      return false
    } finally { busy.current = false; setPending(false) }
  }
  const sync = !cloud.user ? 'Device only · signed out' : cloud.conflict || cloud.status === 'error' ? 'Sync needs attention' : cloud.status === 'offline' ? 'Sync offline' : savedAt && (cloud.lastSyncAt ?? 0) >= savedAt ? 'Synced to your account' : 'Sync pending'
  return { save, pending, error, savedAt, sync }
}
export type ResearchSave = ReturnType<typeof useResearchSave>

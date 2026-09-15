import { activeStorageKey } from '@/lib/demoMode'
import { workspacePersistence } from './workspacePersistence'

/** Recovery remains usable even when hydration, pointer checks or the database fail. */
export async function workspaceRecoveryEnvelope(key = activeStorageKey()) {
  const repository = workspacePersistence()?.repository
  const [workspace, originals] = await Promise.allSettled([repository?.read(key), repository?.originals(key)])
  let legacy: string | null = null, legacyError: string | undefined
  try { legacy = localStorage.getItem(key) } catch (error) { legacyError = String(error) }
  return {
    format: 'premed-os-storage-recovery', version: 1, workspaceKey: key, legacy, legacyError,
    workspace: workspace.status === 'fulfilled' ? workspace.value ?? null : null,
    workspaceError: workspace.status === 'rejected' ? String(workspace.reason) : undefined,
    originals: originals.status === 'fulfilled' ? originals.value ?? [] : [],
    originalsError: originals.status === 'rejected' ? String(originals.reason) : undefined,
  }
}
export async function downloadWorkspaceRecovery(key = activeStorageKey()) {
  const data = await workspaceRecoveryEnvelope(key)
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = 'premedos-storage-recovery.json'; link.click(); URL.revokeObjectURL(url)
}

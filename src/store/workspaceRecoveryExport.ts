import { activeStorageKey } from '@/lib/demoMode'
import { workspacePersistence } from './workspacePersistence'
import { createWorkspaceBackup } from '@/lib/workspaceBackup'
import { verifyWorkspaceRecord } from './workspaceRepository'

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
  if (!data.workspace && (data.workspaceError || data.originalsError || data.legacyError)) throw new Error('The local copies could not be read. Download diagnostics; no verified backup was downloaded.')
  if (!data.workspace) throw new Error(data.originals.length || data.legacy && !data.legacy.startsWith('premed-os:workspace:idb:v1:')
    ? 'No verified workspace backup is available. Download diagnostics to preserve the remaining local copies.'
    : 'This copy is empty. Your data is not in this browser. No backup was downloaded.')
  await verifyWorkspaceRecord(data.workspace)
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = 'premedos-storage-recovery.json'; link.click(); URL.revokeObjectURL(url)
}

/** Diagnostics preserve even corrupt/partial originals; they are never called a backup. */
export async function downloadWorkspaceDiagnostics(key = activeStorageKey()) {
  const data = await workspaceRecoveryEnvelope(key)
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'premedos-storage-diagnostics.json')
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a'); link.href = url; link.download = name; link.click()
  } finally { URL.revokeObjectURL(url) }
}
export async function downloadRecoveredWorkspaceBackup(key: string) {
  const repository = workspacePersistence()?.repository
  const record = await repository?.read(key)
  if (!record) throw new Error('The restored workspace is unavailable. Keep this tab open.')
  await verifyWorkspaceRecord(record)
  const blob = await createWorkspaceBackup(JSON.parse(record.raw).state)
  const latest = await repository!.read(key)
  if (JSON.stringify(latest) !== JSON.stringify(record)) throw new Error('This browser copy changed. Download the current copy after reviewing it.')
  download(blob, 'premedos-full-workspace-backup.zip')
}

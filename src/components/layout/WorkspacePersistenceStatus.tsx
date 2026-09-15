import { downloadWorkspaceRecovery } from '@/store/workspaceRecoveryExport'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { activeStorageKey } from '@/lib/demoMode'
import { snapshotData, useStore } from '@/store/store'
import { workspacePersistence } from '@/store/workspacePersistence'

export function WorkspacePersistenceStatus({ children }: { children: ReactNode }) {
  useStore(s => s.profile)
  const persistence = workspacePersistence()!
  const [exportError, setExportError] = useState('')
  const state = useSyncExternalStore(persistence.subscribe, () => persistence.status(activeStorageKey()))
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (state.phase !== 'ready') { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [state.phase])
  function exportOpen() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshotData(), null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'premedos-open-workspace.json'; link.click(); URL.revokeObjectURL(url)
  }
  return <>
    {state.phase !== 'ready' && <aside role={state.phase === 'error' ? 'alert' : 'status'} className="border-b border-border bg-card p-3 text-sm">
      {state.phase === 'saving' ? 'Saving your changes… Keep this tab open until saving finishes.' : state.error || 'Loading your saved workspace…'}
      {state.phase === 'error' && <><p>Saving and editing are paused. Keep this tab open and download your open work and recovery copies before retrying.</p><button type="button" className="ml-3 underline" onClick={() => { try { exportOpen() } catch { setExportError('Download failed. Keep this tab open and do not clear browser data.') } }}>Download open workspace</button><button type="button" className="ml-3 underline" onClick={() => { void downloadWorkspaceRecovery().catch(() => setExportError('Recovery download failed. Keep this tab open and do not clear browser data.')) }}>Download saved recovery copies</button>{exportError && <p role="alert">{exportError}</p>}</>}
    </aside>}
    <div inert={state.phase === 'error' || state.phase === 'loading'}>{children}</div>
  </>
}

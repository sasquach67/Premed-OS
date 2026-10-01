import { downloadWorkspaceRecovery } from '@/store/workspaceRecoveryExport'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { activeStorageKey } from '@/lib/demoMode'
import { snapshotData, useStore } from '@/store/store'
import { workspacePersistence } from '@/store/workspacePersistence'

function SavingNotice() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    // Brief startup checks need no banner. Keep one timer for the entire save,
    // even when more writes join its queue; unmounting cancels the notice.
    const timer = window.setTimeout(() => setVisible(true), 1_000)
    return () => window.clearTimeout(timer)
  }, [])
  return visible ? <aside role="status" className="border-b border-border bg-card p-3 text-sm">Saving your changes… Keep this tab open until saving finishes.</aside> : null
}

export function WorkspacePersistenceStatus({ children }: { children: ReactNode }) {
  useStore(s => s.profile)
  const persistence = workspacePersistence()!
  const workspaceKey = activeStorageKey()
  const [exportError, setExportError] = useState('')
  const state = useSyncExternalStore(persistence.subscribe, () => persistence.status(workspaceKey))
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
    {state.phase === 'saving' && <SavingNotice key={workspaceKey} />}
    {(state.phase === 'loading' || state.phase === 'error') && <aside role={state.phase === 'error' ? 'alert' : 'status'} className="border-b border-border bg-card p-3 text-sm">
      {state.error || 'Loading your saved workspace…'}
      {state.phase === 'error' && <><p>Saving and editing are paused. Keep this tab open and download your open work and recovery copies before retrying.</p><button type="button" className="ml-3 underline" onClick={() => { try { exportOpen() } catch { setExportError('Download failed. Keep this tab open and do not clear browser data.') } }}>Download open workspace</button><button type="button" className="ml-3 underline" onClick={() => { void downloadWorkspaceRecovery().catch(() => setExportError('Recovery download failed. Keep this tab open and do not clear browser data.')) }}>Download saved recovery copies</button>{exportError && <p role="alert">{exportError}</p>}</>}
    </aside>}
    <div inert={state.phase === 'error' || state.phase === 'loading'}>{children}</div>
  </>
}

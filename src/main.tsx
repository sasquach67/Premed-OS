// FIRST: sample first-visit state before any storage migration or seeding.
import '@/lib/publicLayer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initializeDurableWorkspaces } from '@/store/workspaceBootstrap'
import { workspacePersistence } from '@/store/workspacePersistence'
import { downloadWorkspaceRecovery } from '@/store/workspaceRecoveryExport'
import { activeStorageKey } from '@/lib/demoMode'

const root = createRoot(document.getElementById('root')!)
root.render(<p role="status" className="p-6">Loading your saved workspace…</p>)
async function start() {
  try {
    await initializeDurableWorkspaces()
    const { useStore, snapshotData } = await import('@/store/store')
    if (!useStore.persist.hasHydrated()) throw new Error('The saved workspace could not finish loading. Editing and sync remain paused.')
    useStore.getState().adoptPreparedWorkspace(snapshotData())
    await workspacePersistence()!.flush(activeStorageKey())
    const [{ default: App }, { AppErrorBoundary }, { AppMotionProvider }, { WorkspacePersistenceStatus }, { migrateLegacyWorkspaceKeys }] = await Promise.all([
      import('./App'), import('@/components/layout/AppErrorBoundary'), import('@/components/providers/MotionProvider'),
      import('@/components/layout/WorkspacePersistenceStatus'), import('@/lib/workspaceKeyMigration'),
    ])
    migrateLegacyWorkspaceKeys()
    root.render(<StrictMode><AppMotionProvider><AppErrorBoundary><WorkspacePersistenceStatus><App /></WorkspacePersistenceStatus></AppErrorBoundary></AppMotionProvider></StrictMode>)
  } catch (error) {

    root.render(<main className="mx-auto max-w-xl space-y-4 p-6" role="alert"><h1>Saved workspace needs attention</h1><p>{error instanceof Error ? error.message : 'Workspace storage could not be opened.'}</p><p>Your earlier data was kept. Keep this tab open and download a recovery copy before retrying. Editing and sync have not started.</p><button type="button" className="underline" onClick={() => { void downloadWorkspaceRecovery().catch(() => { root.render(<p role="alert" className="p-6">Recovery storage is unavailable. Keep this tab open and do not clear browser data.</p>) }) }}>Download recovery copy</button></main>)
  }
}
void start()

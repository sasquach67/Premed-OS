// FIRST: sample first-visit state before any storage migration or seeding.
import '@/lib/publicLayer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initializeDurableWorkspaces, WorkspaceBootError } from '@/store/workspaceBootstrap'
import { workspacePersistence } from '@/store/workspacePersistence'
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
    const { WorkspaceBootRecovery } = await import('@/components/layout/WorkspaceBootRecovery')
    root.render(<WorkspaceBootRecovery error={error} workspaceKey={error instanceof WorkspaceBootError ? error.workspaceKey : activeStorageKey()} />)
  }
}
void start()

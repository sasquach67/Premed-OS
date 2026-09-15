import { produce } from 'immer'
import type { AppData } from '@/lib/types'
import { captureWorkspaceIdentity, CURRENT_STORE_VERSION, snapshotData, useStore } from './store'
import { WorkspaceChangedError, WorkspaceSaveError } from './storageHealth'
import { adoptDurableWorkspace, beginWorkspaceTransaction, workspacePersistence } from './workspacePersistence'

/** Compute synchronously (including scoped asset checks), then acknowledge the
 * durable commit before publishing the new notebook into the visible store. */
export function commitWorkspaceMutation(mutator: (state: AppData) => void): Promise<void> {
  const persistence = workspacePersistence()!, owner = captureWorkspaceIdentity()
  if (!owner.key) throw new Error('Workspace storage is not ready.')
  const release = beginWorkspaceTransaction(), before = snapshotData(), beforeJson = JSON.stringify(before)
  let next: AppData
  try { next = produce(before, mutator) }
  catch (error) { release(); throw error }
  const fresh = () => {
    const current = captureWorkspaceIdentity()
    if (current.key !== owner.key || current.epoch !== owner.epoch || JSON.stringify(snapshotData()) !== beforeJson) throw new WorkspaceChangedError('The open workspace changed while saving. Its current contents were kept. Reopen the original class to check the saved notebook.')
  }
  return (async () => {
    try {
      await persistence.flush(owner.key!)
      fresh()
      const persisted = persistence.read(owner.key!)
      if (persisted && JSON.stringify(JSON.parse(persisted).state) !== beforeJson) throw new WorkspaceChangedError('The open workspace differs from its saved copy. Export your open work and reload before saving a notebook.')
      await persistence.write(owner.key!, JSON.stringify({ state: next, version: CURRENT_STORE_VERSION }))
      fresh()
      adoptDurableWorkspace(() => useStore.getState().adoptPreparedWorkspace(next))
      await persistence.flush(owner.key!)
    } catch (error) {
      if (error instanceof WorkspaceChangedError) throw error
      throw new WorkspaceSaveError(error)
    } finally { release() }
  })()
}

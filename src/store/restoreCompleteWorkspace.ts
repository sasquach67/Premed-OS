import { restoreWorkspaceFromSource } from './accountMutationSafety'
import { captureWorkspaceIdentity, snapshotData } from './store'
import { stageWorkspaceBackup, type PreparedWorkspaceBackup } from '@/lib/workspaceBackup'

export async function restoreCompleteWorkspace(load: () => Promise<PreparedWorkspaceBackup>, keepPrivateStories = false) {
  const owner = captureWorkspaceIdentity(), before = JSON.stringify(snapshotData())
  const fresh = () => {
    const current = captureWorkspaceIdentity()
    if (owner.key !== current.key || owner.epoch !== current.epoch || JSON.stringify(snapshotData()) !== before) throw new Error('The workspace changed during backup validation. Nothing was replaced; reopen the backup in its intended workspace.')
  }
  let staged: Awaited<ReturnType<typeof stageWorkspaceBackup>> | undefined
  await restoreWorkspaceFromSource(async () => {
    const prepared = await load(); fresh()
    staged = await stageWorkspaceBackup(prepared, fresh)
    return staged.data
  }, keepPrivateStories)
  // A failed metadata commit leaves its staged-byte journal intact. Failure to
  // prune a journal after success cannot undo acknowledged workspace storage.
  try { await staged?.finish() } catch { /* Retained recovery journal is safe. */ }
}

import { captureWorkspaceIdentity, useStore } from '@/store/store'
import { captureSyncSession, assertSyncLease, isAccountSyncReady, getAccountConflict } from '@/store/accountSyncSafety'
import { activeStorageKey, activeWorkspaceOwner } from '@/lib/demoMode'
import { commitWorkspaceMutation } from '@/store/workspaceTransaction'
import { type FolderLibrary } from './model'
import { type Fence } from './filesystem'

export function captureFolderFence(write = false): Fence {
  const owner = captureWorkspaceIdentity(), key = activeStorageKey(), session = captureSyncSession()
  const account = activeWorkspaceOwner()
  const check = () => {
    const current = captureWorkspaceIdentity()
    if (key !== activeStorageKey() || owner.key !== current.key || owner.epoch !== current.epoch) throw new Error('Your workspace changed. Folder work stopped.')
    if (account.kind === 'account') {
      assertSyncLease(session)
      if (write && !isAccountSyncReady(account.userId)) throw new Error(getAccountConflict(account.userId)
        ? 'Resolve the account sync notice before changing files. Originals have been kept.'
        : 'Account sync has not finished checking. Open Settings to check its progress or retry, then connect the folder again. Originals have been kept.')
    }
  }
  check()
  return check
}
export function readFolderLibrary(courseId: string) {
  return useStore.getState().academics.classCenter.workspaces.find(w => w.courseId === courseId)?.materialFolder
}
export async function saveFolderLibrary(courseId: string, library: FolderLibrary, fence: Fence) {
  fence()
  await commitWorkspaceMutation(draft => {
    fence()
    const workspace = draft.academics.classCenter.workspaces.find(w => w.courseId === courseId)
    if (!workspace) throw new Error('The class workspace is no longer available.')
    workspace.materialFolder = library
  })
  fence()
}
/** Cross-tab lock serializes folder and catalog writes on this device. */
export async function withFolderLock<T>(id: string, work: () => Promise<T>) {
  if (!navigator.locks) throw new Error('This browser cannot safely coordinate folder changes. Use desktop Chrome or Edge.')
  return navigator.locks.request(`premed-folder:${activeStorageKey()}:${id}`, { ifAvailable: true }, async lock => {
    if (!lock) throw new Error('Another tab is working with this folder. Try again when it finishes.')
    return work()
  })
}

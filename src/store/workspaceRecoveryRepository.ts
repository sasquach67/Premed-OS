export type WorkspaceRecoverySnapshot = {
  format: 'premed-os-workspace-recovery'
  version: 1
  workspaceKey: string
  id: string
  createdAt: number
  stored: string
  sha256: string
}

export interface WorkspaceRecoveryRepository {
  save(snapshot: WorkspaceRecoverySnapshot): Promise<void>
  read(workspaceKey: string, id: string): Promise<WorkspaceRecoverySnapshot | null>
  latest(workspaceKey: string): Promise<WorkspaceRecoverySnapshot | null>
}

/** Recovery copies only. This database never becomes the active workspace store. */
export function createWorkspaceRecoveryRepository(factory: IDBFactory = indexedDB): WorkspaceRecoveryRepository {
  let opening: Promise<IDBDatabase> | undefined
  function open() {
    if (!opening) opening = new Promise<IDBDatabase>((resolve, reject) => {
      let abandoned = false
      const request = factory.open('premed-os-workspace-recovery-v1', 1)
      request.onupgradeneeded = () => {
        const snapshots = request.result.createObjectStore('snapshots', { keyPath: ['workspaceKey', 'id'] })
        snapshots.createIndex('workspaceTime', ['workspaceKey', 'createdAt'])
      }
      request.onerror = () => { opening = undefined; reject(request.error ?? new Error('Recovery storage could not be opened.')) }
      request.onblocked = () => { abandoned = true; opening = undefined; reject(new Error('Another tab is blocking the recovery copy. Close other Premed OS tabs and retry.')) }
      request.onsuccess = () => {
        const db = request.result
        if (abandoned) { db.close(); return }
        db.onversionchange = () => { db.close(); opening = undefined }
        resolve(db)
      }
    })
    return opening
  }
  async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
    const db = await open()
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction('snapshots', mode, mode === 'readwrite' ? { durability: 'strict' } : undefined)
      let value: T
      tx.oncomplete = () => resolve(value)
      tx.onabort = () => reject(tx.error?.name === 'QuotaExceededError'
        ? new Error('There is not enough browser space for a recovery copy. Existing saved data was kept.')
        : tx.error ?? new Error('The recovery copy could not be saved. Existing saved data was kept.'))
      tx.onerror = () => { /* Report the transaction abort once. */ }
      try { run(tx.objectStore('snapshots'), result => { value = result }) }
      catch (error) { tx.abort(); reject(error) }
    })
  }
  return {
    async save(snapshot) {
      // Immutable copy; even an interrupted previous attempt is never replaced.
      await transaction<void>('readwrite', (store, result) => { store.add(snapshot); result(undefined) })
    },
    async read(workspaceKey, id) {
      return transaction<WorkspaceRecoverySnapshot | null>('readonly', (store, result) => {
        const request = store.get([workspaceKey, id]); request.onsuccess = () => result(request.result ?? null)
      })
    },
    async latest(workspaceKey) {
      return transaction<WorkspaceRecoverySnapshot | null>('readonly', (store, result) => {
        const request = store.index('workspaceTime').openCursor(IDBKeyRange.bound([workspaceKey, 0], [workspaceKey, Number.MAX_SAFE_INTEGER]), 'prev')
        request.onsuccess = () => result(request.result?.value ?? null)
      })
    },
  }
}

let repository: WorkspaceRecoveryRepository | undefined
export function workspaceRecoveryRepository(): WorkspaceRecoveryRepository { return repository ??= createWorkspaceRecoveryRepository() }

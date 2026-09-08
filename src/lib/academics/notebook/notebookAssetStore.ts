import { canonical } from './package'
import { getPreparedAssetBytes, mergeNotebookAssetBindings, type NotebookAssetReader, type PreparedNotebookAssets } from './visualAssets'
import type { NotebookAssetBinding } from './visualTypes'

export type NotebookAssetLease = {
  id: string; lineageId: string; createdAt: number
  bindings: NotebookAssetBinding[]; hashes: string[]
}
export interface NotebookAssetRepository extends NotebookAssetReader {
  stage: (lease: NotebookAssetLease, bytes: ReadonlyMap<string, Blob>) => Promise<void>
  finish: (leaseId: string) => Promise<void>
  journals: () => Promise<NotebookAssetLease[]>
}
const DB_NAME = 'premed-os-notebook-assets-v1'
/** Dedicated local-only database. No academics/cloud fallback, URL or blob-key resolution. */
export function createNotebookAssetRepository(factory: IDBFactory = indexedDB): NotebookAssetRepository {
  let opening: Promise<IDBDatabase> | undefined
  function open() {
    if (!opening) opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(DB_NAME, 1)
      request.onupgradeneeded = () => { for (const name of ['blobs', 'bindings', 'journal']) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name) }
      request.onerror = () => { opening = undefined; reject(request.error ?? new Error('Local image storage could not be opened.')) }
      request.onblocked = () => { opening = undefined; reject(new Error('Another tab is blocking local image storage. Close that tab and retry; your notebook has not changed.')) }
      request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); opening = undefined }; resolve(request.result) }
    })
    return opening
  }
  async function transaction<T>(stores: string[], mode: IDBTransactionMode, run: (tx: IDBTransaction, setResult: (value: T) => void, fail: (error: Error) => void) => void): Promise<T> {
    const db = await open()
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(stores, mode); let value: T, failure: Error | undefined
      tx.oncomplete = () => resolve(value)
      tx.onabort = () => reject(failure ?? (tx.error?.name === 'QuotaExceededError' ? new Error('Local image storage is full. Your previous notebook was kept. Export a complete backup before freeing browser storage, or choose smaller source images.') : tx.error ?? new Error('Image storage transaction aborted. Your previous notebook was kept.')))
      tx.onerror = () => { /* The abort handler reports one transaction-level result. */ }
      try { run(tx, result => { value = result }, error => { failure = error; tx.abort() }) } catch (error) { failure = error as Error; tx.abort() }
    })
  }
  return {
    async read(hash) {
      if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid local image digest.')
      return transaction<Blob | undefined>(['blobs'], 'readonly', (tx, result) => { const request = tx.objectStore('blobs').get(hash); request.onsuccess = () => result(request.result instanceof Blob ? request.result : undefined) })
    },
    async stage(lease, bytes) {
      if (!lease.lineageId || !lease.id) throw new Error('A local image stage needs its notebook lineage and lease identity.')
      await transaction<void>(['blobs', 'bindings', 'journal'], 'readwrite', (tx, result, fail) => {
        const bindings = tx.objectStore('bindings')
        for (const binding of lease.bindings) {
          const key = [lease.lineageId, binding.assetId], request = bindings.get(key)
          request.onsuccess = () => {
            if (request.result && canonical(request.result) !== canonical(binding)) { fail(new Error(`Image ID ${binding.assetId} is immutably bound to different bytes in this notebook lineage. Use a new image ID.`)); return }
            bindings.put(binding, key)
          }
        }
        for (const [hash, blob] of bytes) tx.objectStore('blobs').put(blob, hash)
        tx.objectStore('journal').put(lease, lease.id); result(undefined)
      })
    },
    async finish(leaseId) { await transaction<void>(['journal'], 'readwrite', (tx, result) => { tx.objectStore('journal').delete(leaseId); result(undefined) }) },
    async journals() { return transaction<NotebookAssetLease[]>(['journal'], 'readonly', (tx, result) => { const request = tx.objectStore('journal').getAll(); request.onsuccess = () => result(request.result) }) },
  }
}
let defaultRepository: NotebookAssetRepository | undefined
export function notebookAssetRepository(): NotebookAssetRepository { return defaultRepository ??= createNotebookAssetRepository() }

/** Stage first, recheck freshness, then make one synchronous app-owned JSON transaction.
 * Failed or interrupted leases are retained, never guessed safe to delete. Thus an
 * original, revision, another notebook or unfinished proposal cannot lose shared bytes.
 */
export async function commitNotebookAssets(options: {
  prepared: PreparedNotebookAssets
  lineageId?: string
  retainedBindings?: readonly NotebookAssetBinding[]
  repository?: NotebookAssetRepository
  assertFresh: () => void
  commit: (state: { assetLineageId: string; assetBindings: NotebookAssetBinding[] }) => { committed: true }
}): Promise<{ committed: true; journalPending: boolean; leaseId: string }> {
  const repo = options.repository ?? notebookAssetRepository(), bytes = getPreparedAssetBytes(options.prepared)
  const bindings = mergeNotebookAssetBindings(options.retainedBindings ?? [], options.prepared.bindings), lineageId = options.lineageId ?? crypto.randomUUID()
  const lease: NotebookAssetLease = { id: crypto.randomUUID(), lineageId, createdAt: Date.now(), bindings, hashes: [...new Set(bindings.map(b => b.sha256))] }
  options.assertFresh()
  for (const b of bindings) if (!bytes.has(b.sha256)) {
    const existing = await repo.read(b.sha256)
    if (!existing || existing.size !== b.byteLength) throw new Error(`Historical image ${b.assetId} is missing on this device. Restore its complete bundle before accepting an update; existing content and records were kept.`)
  }
  await repo.stage(lease, bytes)
  options.assertFresh()
  // This callback must enforce the complete prospective JSON/asset backup closure,
  // and call notebookTransaction. It must never return a promise.
  const returned = options.commit({ assetLineageId: lineageId, assetBindings: bindings.map(b => ({ ...b })) })
  if (returned?.committed !== true) throw new Error('Notebook JSON commit must return a synchronous commit receipt; keep the stage journal for recovery.')
  try { await repo.finish(lease.id); return { committed: true, journalPending: false, leaseId: lease.id } }
  catch { return { committed: true, journalPending: true, leaseId: lease.id } }
}

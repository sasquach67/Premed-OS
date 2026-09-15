/** Authoritative workspace metadata. Original-file and notebook-asset DBs are independent. */
export type WorkspaceRecord = {
  key: string
  revision: string
  migrationId: string
  phase: 'staged' | 'active'
  raw: string
  hasData: boolean
  digest: string
  legacyRaw: string | null
  migrationSource?: { key: string; raw: string }
  updatedAt: number
}
export type WorkspaceCopy = { key: string; id: string; reason: 'migration' | 'legacy-conflict'; raw: string | null; sourceKey?: string; createdAt: number }
export class WorkspaceConflictError extends Error {
  constructor(message = 'Another tab changed this workspace. Your open changes were kept; reload or export them before continuing.') { super(message); this.name = 'WorkspaceConflictError' }
}
export interface WorkspaceRepository {
  read(key: string): Promise<WorkspaceRecord | null>
  stage(key: string, legacyRaw: string | null, raw: string, source?: { key: string; raw: string }): Promise<WorkspaceRecord>
  activate(key: string, revision: string): Promise<WorkspaceRecord>
  commit(key: string, revision: string, raw: string): Promise<WorkspaceRecord>
  quarantine(key: string, raw: string | null): Promise<void>
  originals(key: string): Promise<WorkspaceCopy[]>
  close(): void
}
export async function workspaceDigest(raw: string) {
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(raw)))
  return [...new Uint8Array(result)].map(b => b.toString(16).padStart(2, '0')).join('')
}
export async function verifyWorkspaceRecord(record: WorkspaceRecord) {
  if (!record || typeof record.key !== 'string' || typeof record.raw !== 'string' || typeof record.hasData !== 'boolean'
    || (record.legacyRaw !== null && typeof record.legacyRaw !== 'string') || (!record.hasData && record.legacyRaw !== null)
    || (record.migrationSource !== undefined && (!record.hasData || typeof record.migrationSource?.key !== 'string' || !record.migrationSource.key || typeof record.migrationSource.raw !== 'string'))
    || typeof record.revision !== 'string' || !record.revision || typeof record.migrationId !== 'string' || !record.migrationId
    || !Number.isSafeInteger(record.updatedAt) || record.updatedAt < 0
    || !['active', 'staged'].includes(record.phase) || await workspaceDigest(record.raw) !== record.digest) throw new Error('The saved workspace could not be verified. Its recovery copies were kept.')
  return record
}

export function createWorkspaceRepository(factory: IDBFactory = indexedDB, databaseName = 'premed-os-workspaces-v1'): WorkspaceRepository {
  let opening: Promise<IDBDatabase> | undefined
  function open() {
    if (!opening) opening = new Promise((resolve, reject) => {
      const request = factory.open(databaseName, 1)
      let abandoned = false
      request.onupgradeneeded = () => {
        request.result.createObjectStore('workspaces', { keyPath: 'key' })
        const originals = request.result.createObjectStore('originals', { keyPath: ['key', 'id'] })
        originals.createIndex('owner', 'key')
      }
      request.onblocked = () => { abandoned = true; opening = undefined; reject(new Error('Another tab is blocking workspace storage. Close other Premed OS tabs and retry.')) }
      request.onerror = () => { opening = undefined; reject(request.error ?? new Error('Workspace storage is unavailable.')) }
      request.onsuccess = () => {
        const db = request.result
        if (abandoned) { db.close(); return }
        db.onversionchange = () => { db.close(); opening = undefined }
        resolve(db)
      }
    })
    return opening
  }
  async function transaction<T>(stores: string[], mode: IDBTransactionMode, run: (tx: IDBTransaction, result: (value: T) => void, fail: (error: Error) => void) => void): Promise<T> {
    const db = await open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, mode, mode === 'readwrite' ? { durability: 'strict' } : undefined)
      let value: T, failure: Error | undefined
      tx.oncomplete = () => resolve(value)
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('Workspace storage did not commit the change. Your earlier saved work was kept.'))
      tx.onerror = () => { /* Abort provides the transaction's final failure. */ }
      const fail = (error: Error) => { failure = error; tx.abort() }
      try { run(tx, result => { value = result }, fail) } catch (error) { fail(error instanceof Error ? error : new Error('Workspace operation failed.')) }
    })
  }
  async function replace(key: string, revision: string, transform: (current: WorkspaceRecord) => WorkspaceRecord) {
    return transaction<WorkspaceRecord>(['workspaces'], 'readwrite', (tx, result, fail) => {
      const store = tx.objectStore('workspaces'), request = store.get(key)
      request.onsuccess = () => {
        const current = request.result as WorkspaceRecord | undefined
        if (!current || current.revision !== revision) { fail(new WorkspaceConflictError()); return }
        try { const next = transform(current); store.put(next); result(next) }
        catch (error) { fail(error instanceof Error ? error : new Error('Workspace change failed.')) }
      }
    })
  }
  return {
    async read(key) {
      return transaction<WorkspaceRecord | null>(['workspaces'], 'readonly', (tx, result) => {
        const request = tx.objectStore('workspaces').get(key)
        request.onsuccess = () => result(request.result ?? null)
      })
    },
    async stage(key, legacyRaw, raw, source) {
      const migrationId = crypto.randomUUID(), digest = await workspaceDigest(raw)
      const record: WorkspaceRecord = { key, revision: crypto.randomUUID(), migrationId, raw, hasData: legacyRaw !== null || source !== undefined, digest, legacyRaw, ...(source ? { migrationSource: source } : {}), phase: 'staged', updatedAt: Date.now() }
      return transaction<WorkspaceRecord>(['workspaces', 'originals'], 'readwrite', (tx, result, fail) => {
        const store = tx.objectStore('workspaces'), request = store.get(key)
        request.onsuccess = () => {
          if (request.result) { fail(new WorkspaceConflictError('A workspace migration already exists. Reopen it before continuing.')); return }
          tx.objectStore('originals').add({ key, id: migrationId, raw: source?.raw ?? legacyRaw, ...(source ? { sourceKey: source.key } : {}), reason: 'migration', createdAt: record.updatedAt } satisfies WorkspaceCopy)
          store.add(record); result(record)
        }
      })
    },
    async activate(key, revision) {
      return replace(key, revision, current => ({ ...current, phase: 'active' }))
    },
    async commit(key, revision, raw) {
      const digest = await workspaceDigest(raw), nextRevision = crypto.randomUUID()
      return replace(key, revision, current => {
        if (current.phase !== 'active') throw new Error('Finish workspace migration before saving edits.')
        return { ...current, raw, hasData: true, digest, revision: nextRevision, updatedAt: Date.now() }
      })
    },
    async quarantine(key, raw) {
      const copy: WorkspaceCopy = { key, raw, reason: 'legacy-conflict', id: crypto.randomUUID(), createdAt: Date.now() }
      return transaction<void>(['originals'], 'readwrite', (tx, result) => { tx.objectStore('originals').add(copy); result(undefined) })
    },
    async originals(key) {
      return transaction<WorkspaceCopy[]>(['originals'], 'readonly', (tx, result) => {
        const request = tx.objectStore('originals').index('owner').getAll(key)
        request.onsuccess = () => result(request.result)
      })
    },
    close() { const pending = opening; opening = undefined; void pending?.then(db => db.close()).catch(() => undefined) },
  }
}

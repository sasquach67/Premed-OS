import { decodeWorkspaceStorage } from './workspaceStorageCodec'
import { validateAppData } from '@/lib/validateAppData'
import { CURRENT_STORE_VERSION, OLDEST_SUPPORTED_STORE_VERSION } from './workspaceVersion'
import { createWorkspaceRepository, verifyWorkspaceRecord, WorkspaceConflictError, type WorkspaceRecord, type WorkspaceRepository } from './workspaceRepository'

export const WORKSPACE_IDB_PREFIX = 'premed-os:workspace:idb:v1:'
export type PersistenceStatus = { phase: 'loading' | 'ready' | 'saving' | 'error'; pending: number; error: string }
const unloaded: PersistenceStatus = { phase: 'loading', pending: 0, error: '' }
const ready: PersistenceStatus = { phase: 'ready', pending: 0, error: '' }
function validate(raw: string) {
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('The saved workspace is not readable JSON. Its original bytes were kept.') }
  const version = (parsed as { version?: unknown })?.version
  if (version !== undefined && (!Number.isSafeInteger(version) || (version as number) < OLDEST_SUPPORTED_STORE_VERSION || (version as number) > CURRENT_STORE_VERSION)) throw new Error('This workspace uses an unsupported or newer app version. Update Premed OS before opening it; the saved data was kept.')
  if (validateAppData((parsed as { state?: unknown })?.state).length) throw new Error('The saved workspace has an invalid structure. Its original bytes were kept.')
}
export function workspacePointer(record: WorkspaceRecord) { return WORKSPACE_IDB_PREFIX + record.migrationId }

/** Synchronous reads are available only after load; commits and verification are acknowledged async operations. */
export function createWorkspacePersistence(repository: WorkspaceRepository, legacy: Storage) {
  const records = new Map<string, WorkspaceRecord>(), states = new Map<string, PersistenceStatus>()
  const queues = new Map<string, Promise<void>>(), loading = new Map<string, Promise<void>>()
  const listeners = new Set<() => void>()
  function status(key: string) { return states.get(key) ?? unloaded }
  function publish(key: string, value: PersistenceStatus) { states.set(key, value); listeners.forEach(fn => fn()) }
  function failed(key: string, error: unknown) { publish(key, { phase: 'error', pending: 0, error: error instanceof Error ? error.message : 'Workspace storage failed. Keep this tab open and export your work.' }) }
  function pointer(record: WorkspaceRecord) {
    if (legacy.getItem(record.key) !== workspacePointer(record)) throw new WorkspaceConflictError('An older tab changed the saved workspace. Both copies were kept. Close other Premed OS tabs and review recovery before continuing.')
  }
  async function conflict(record: WorkspaceRecord) {
    await sourceUnchanged(record)
    try { pointer(record) }
    catch (error) { await repository.quarantine(record.key, legacy.getItem(record.key)); throw error }
  }
  async function sourceUnchanged(record: WorkspaceRecord) {
    if (record.migrationSource && legacy.getItem(record.migrationSource.key) !== record.migrationSource.raw) {
      await repository.quarantine(record.key, legacy.getItem(record.migrationSource.key))
      throw new WorkspaceConflictError('The original workspace changed in an older tab. Both copies were kept; review recovery before continuing.')
    }
  }
  async function load(key: string, seed: () => string) {
    if (records.has(key)) return
    const existing = loading.get(key); if (existing) return existing
    const run = async () => {
      publish(key, { phase: 'loading', pending: 0, error: '' })
      try {
        let record = await repository.read(key)
        if (!record) {
          const before = legacy.getItem(key)
          if (before?.startsWith(WORKSPACE_IDB_PREFIX)) throw new Error('This workspace points to missing IndexedDB data. Do not clear browser storage; restore a verified recovery copy.')
          const raw = before === null ? seed() : decodeWorkspaceStorage(before)
          validate(raw)
          try { record = await repository.stage(key, before, raw) }
          catch (error) { record = await repository.read(key); if (!record) throw error }
        }
        await verifyWorkspaceRecord(record); validate(record.raw)
        await sourceUnchanged(record)
        if (record.phase === 'staged') {
          const current = legacy.getItem(key), marker = workspacePointer(record)
          if (current !== marker) {
            if (current !== record.legacyRaw) { await repository.quarantine(key, current); throw new WorkspaceConflictError('Saved work changed during migration. Both copies were kept; no version was selected.') }
            // Only a small pointer replaces the old value, after the original
            // and decoded data are in one committed and verified transaction.
            legacy.setItem(key, marker)
          }
          pointer(record)
          record = await repository.activate(key, record.revision)
        }
        await conflict(record)
        const verified = await repository.read(key)
        if (!verified || verified.revision !== record.revision) throw new WorkspaceConflictError()
        await verifyWorkspaceRecord(verified)
        pointer(verified)
        records.set(key, verified); publish(key, ready)
      } catch (error) { failed(key, error); throw error }
    }
    const work = run(); loading.set(key, work)
    try { await work } finally { loading.delete(key) }
  }
  function read(key: string) {
    const record = records.get(key)
    if (!record) throw new Error('This workspace has not finished loading. Editing and sync are paused.')
    pointer(record)
    return record.hasData ? record.raw : null
  }
  function write(key: string, raw: string): Promise<void> {
    validate(raw)
    if (!records.has(key)) return Promise.reject(new Error('Load this workspace before saving.'))
    if (status(key).phase === 'error') return Promise.reject(new Error(status(key).error))
    const pending = status(key).pending + 1
    publish(key, { phase: 'saving', pending, error: '' })
    const run = async () => {
      const current = records.get(key)!
      await conflict(current)
      const next = current.hasData && current.raw === raw ? await repository.read(key) : await repository.commit(key, current.revision, raw)
      if (!next || (current.hasData && current.raw === raw && next.revision !== current.revision)) throw new WorkspaceConflictError()
      await conflict(next)
      await verifyWorkspaceRecord(next)
      records.set(key, next)
      const remaining = Math.max(0, status(key).pending - 1)
      publish(key, { phase: remaining ? 'saving' : 'ready', pending: remaining, error: '' })
    }
    // Rejected queues remain rejected: never skip over a failed snapshot and
    // acknowledge a later write against uncertain state.
    const work = (queues.get(key) ?? Promise.resolve()).then(run).catch(error => { failed(key, error); throw error })
    queues.set(key, work)
    void work.catch(() => undefined)
    return work
  }
  async function flush(key: string) {
    for (;;) {
      const observed = queues.get(key)
      await observed
      if (queues.get(key) !== observed) continue
      if (status(key).phase === 'error') throw new Error(status(key).error)
      const current = records.get(key)
      if (!current) throw new Error('Workspace is still loading.')
      try {
        await conflict(current)
        const saved = await repository.read(key)
        if (queues.get(key) !== observed) continue
        if (!saved || saved.revision !== current.revision || saved.digest !== current.digest) throw new WorkspaceConflictError()
        await verifyWorkspaceRecord(saved); pointer(current)
        if (queues.get(key) !== observed) continue
        return
      } catch (error) { failed(key, error); throw error }
    }
  }

  return { load, read, write, flush, status, repository, block: failed, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } } }
}
export type WorkspacePersistence = ReturnType<typeof createWorkspacePersistence>
let current: WorkspacePersistence | undefined
export function workspacePersistence() { return current }
export function enableWorkspacePersistence(repository = createWorkspaceRepository(), legacy = localStorage) {
  if (current) throw new Error('Workspace persistence is already initialized.')
  return current = createWorkspacePersistence(repository, legacy)
}

let transactionOwner: symbol | undefined
let internalMutation = false
export function assertWorkspaceEditable() {
  if (transactionOwner && !internalMutation) throw new Error('A notebook save is finishing. Wait for its saved confirmation before making another change.')
}
export function beginWorkspaceTransaction() {
  assertWorkspaceEditable()
  const token = Symbol('workspace-transaction'); transactionOwner = token
  return () => { if (transactionOwner === token) transactionOwner = undefined }
}
export function adoptDurableWorkspace<T>(action: () => T): T {
  internalMutation = true
  try { return action() } finally { internalMutation = false }
}

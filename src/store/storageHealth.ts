import type { StateStorage } from 'zustand/middleware'
import { decodeWorkspaceStorage, encodeWorkspaceStorage, WORKSPACE_CHUNKS_PREFIX } from './workspaceStorageCodec'

const FAILURE_KEY = 'premed_hq_storage_failure'
let volatileFailure = ''
const unreadableValues = new WeakMap<Storage, Map<string, string>>()
const readableValues = new WeakMap<Storage, Map<string, string>>()

function rememberReadable(storage: Storage, name: string, raw: string | null) {
  const values = readableValues.get(storage) ?? new Map<string, string>()
  if (raw === null) values.delete(name)
  else values.set(name, raw)
  readableValues.set(storage, values)
  unreadableValues.get(storage)?.delete(name)
}

/** Distinguish a valid notebook that could not be persisted from invalid input. */
export class WorkspaceSaveError extends Error {
  constructor(cause: unknown) {
    super('Browser storage could not save this notebook. Your previously saved notebooks were kept. Keep your original folder or ZIP, including its images. Export complete backups of saved notebooks before changing browser storage, then retry.', { cause })
    this.name = 'WorkspaceSaveError'
  }
}

export class WorkspaceChangedError extends Error {
  constructor(message: string) { super(message); this.name = 'WorkspaceChangedError' }
}

function message(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message) return error.message
  return 'Browser storage rejected the save.'
}

function rememberFailure(error: unknown) {
  volatileFailure = message(error)
  try { sessionStorage.setItem(FAILURE_KEY, volatileFailure) } catch { /* volatile state still survives this session */ }
}

function clearFailure() {
  volatileFailure = ''
  try { sessionStorage.removeItem(FAILURE_KEY) } catch { /* no-op */ }
}

export function storageFailure(): string {
  if (volatileFailure) return volatileFailure
  try { return sessionStorage.getItem(FAILURE_KEY) ?? '' } catch { return '' }
}

/** Share the same lossless decode across hydration, workspace switches and guards. */
export function readStoredWorkspace(storage: Storage, name: string): string | null {
  let raw: string | null = null
  try {
    raw = storage.getItem(name)
    const decoded = raw === null ? null : decodeWorkspaceStorage(raw)
    if (decoded !== null) JSON.parse(decoded)
    rememberReadable(storage, name, raw)
    return decoded
  } catch (error) {
    if (raw !== null) {
      const blocked = unreadableValues.get(storage) ?? new Map<string, string>()
      blocked.set(name, raw)
      unreadableValues.set(storage, blocked)
    }
    rememberFailure(error)
    throw error
  }
}

/** A throwing, synchronous durable boundary for the explicit storage cutover. */
export function writeStoredWorkspace(storage: Storage, name: string, value: string) {
  try {
    const blocked = unreadableValues.get(storage)?.get(name)
    if (blocked !== undefined) {
      if (storage.getItem(name) === blocked) throw new Error('Unreadable saved workspace was kept unchanged. Export it before attempting recovery.')
      readStoredWorkspace(storage, name)
    }
    // Validate changed disk bytes even when the in-memory adapter is warm.
    const current = storage.getItem(name)
    if (current !== null && readableValues.get(storage)?.get(name) !== current) readStoredWorkspace(storage, name)
    // The persisted prefix is the account-scoped opt-in. No separate flag write
    // can succeed or fail independently of the actual durable conversion.
    const encoded = encodeWorkspaceStorage(value, { requireChunks: current?.startsWith(WORKSPACE_CHUNKS_PREFIX) })
    storage.setItem(name, encoded)
    rememberReadable(storage, name, encoded)
    clearFailure()
  } catch (error) { rememberFailure(error); throw error }
}

/** Keep the in-memory app alive when persistence fails, and expose the failure
 * to Attention instead of letting a quota exception silently discard work. */
export function guardedStorage(storage: Storage): StateStorage {
  return {
    getItem: (name) => readStoredWorkspace(storage, name),
    removeItem: (name) => {
      storage.removeItem(name)
      unreadableValues.get(storage)?.delete(name)
      readableValues.get(storage)?.delete(name)
    },
    setItem: (name, value) => {
      try { writeStoredWorkspace(storage, name, value) } catch { /* Failure is recorded; notebook transactions additionally roll back. */ }
    },
  }
}

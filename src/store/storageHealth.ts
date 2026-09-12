import type { StateStorage } from 'zustand/middleware'
import { decodeWorkspaceStorage, encodeWorkspaceStorage } from './workspaceStorageCodec'

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
      try {
        const blocked = unreadableValues.get(storage)?.get(name)
        if (blocked !== undefined) {
          if (storage.getItem(name) === blocked) throw new Error('Unreadable saved workspace was kept unchanged. Export it before attempting recovery.')
          readStoredWorkspace(storage, name)
        }
        // A different tab may publish an unsupported or corrupt encoding after
        // our last read. Never overwrite it merely because memory is still warm.
        const current = storage.getItem(name)
        if (current !== null && readableValues.get(storage)?.get(name) !== current) readStoredWorkspace(storage, name)
        const encoded = encodeWorkspaceStorage(value)
        storage.setItem(name, encoded)
        rememberReadable(storage, name, encoded)
        clearFailure()
      } catch (error) {
        rememberFailure(error)
      }
    },
  }
}

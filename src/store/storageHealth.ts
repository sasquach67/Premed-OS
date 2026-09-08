import type { StateStorage } from 'zustand/middleware'
import { decodeWorkspaceStorage, encodeWorkspaceStorage } from './workspaceStorageCodec'

const FAILURE_KEY = 'premed_hq_storage_failure'
let volatileFailure = ''
const unreadableValues = new WeakMap<Storage, Map<string, string>>()

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
    unreadableValues.get(storage)?.delete(name)
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
    },
    setItem: (name, value) => {
      try {
        const blocked = unreadableValues.get(storage)?.get(name)
        if (blocked !== undefined) {
          if (storage.getItem(name) === blocked) throw new Error('Unreadable saved workspace was kept unchanged. Export it before attempting recovery.')
          readStoredWorkspace(storage, name)
        }
        storage.setItem(name, encodeWorkspaceStorage(value))
        clearFailure()
      } catch (error) {
        rememberFailure(error)
      }
    },
  }
}

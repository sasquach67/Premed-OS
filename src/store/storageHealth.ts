import type { StateStorage } from 'zustand/middleware'

const FAILURE_KEY = 'premed_hq_storage_failure'
let volatileFailure = ''

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

/** Keep the in-memory app alive when persistence fails, and expose the failure
 * to Attention instead of letting a quota exception silently discard work. */
export function guardedStorage(storage: Storage): StateStorage {
  return {
    getItem: (name) => storage.getItem(name),
    removeItem: (name) => storage.removeItem(name),
    setItem: (name, value) => {
      try {
        storage.setItem(name, value)
        clearFailure()
      } catch (error) {
        rememberFailure(error)
      }
    },
  }
}

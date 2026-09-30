export type PersistentStorageStatus = 'checking' | 'granted' | 'not-granted' | 'denied' | 'unsupported' | 'error'
type StorageAccess = Partial<Pick<StorageManager, 'persist' | 'persisted'>>

/** Permission belongs to this origin, not a workspace. Never store a claimed grant. */
export function createPersistentStorage(getStorage: () => StorageAccess | undefined) {
  let status: PersistentStorageStatus = 'checking'
  let requested = false
  let request: Promise<void> | undefined
  let queue = Promise.resolve()
  const listeners = new Set<() => void>()
  function publish(next: PersistentStorageStatus) {
    status = next
    listeners.forEach(listener => listener())
  }
  function check(ask: boolean) {
    const work = queue.then(async () => {
      publish('checking')
      try {
        const storage = getStorage()
        if (!storage?.persisted) { publish('unsupported'); return }
        if (await storage.persisted()) { publish('granted'); return }
        if (!storage.persist) { publish('unsupported'); return }
        if (ask) await storage.persist()
        // Recheck the actual grant even when persist() reports success.
        const granted = ask ? await storage.persisted() : false
        publish(granted ? 'granted' : requested ? 'denied' : 'not-granted')
      } catch { publish('error') }
    })
    queue = work
    return work
  }
  return {
    getSnapshot: () => status,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    recheck: () => check(false),
    requestAfterSave() {
      // At most one request per page session. A denial must not prompt on every autosave.
      if (!request) { requested = true; request = check(true) }
      return request
    },
  }
}

export const persistentStorage = createPersistentStorage(() => typeof navigator === 'undefined' ? undefined : navigator.storage)

import { expect, it, vi } from 'vitest'
import { createPersistentStorage } from './persistentStorage'

it('checks existing protection without requesting permission', async () => {
  const persist = vi.fn().mockResolvedValue(true)
  const storage = createPersistentStorage(() => ({ persisted: async () => false, persist }))
  await storage.recheck()
  expect(storage.getSnapshot()).toBe('not-granted')
  expect(persist).not.toHaveBeenCalled()
})

it('does not request permission when already granted', async () => {
  const persist = vi.fn()
  const storage = createPersistentStorage(() => ({ persisted: async () => true, persist }))
  await storage.requestAfterSave()
  expect(storage.getSnapshot()).toBe('granted')
  expect(persist).not.toHaveBeenCalled()
})

it('verifies the grant after a successful request and notifies subscribers', async () => {
  const persisted = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
  const persist = vi.fn().mockResolvedValue(true)
  const storage = createPersistentStorage(() => ({ persisted, persist }))
  const listener = vi.fn(), unsubscribe = storage.subscribe(listener)
  await storage.requestAfterSave()
  expect(storage.getSnapshot()).toBe('granted')
  expect(persisted).toHaveBeenCalledTimes(2)
  expect(persist).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledTimes(2)
  unsubscribe()
})

it('uses the verified state even when the request reports a grant', async () => {
  const storage = createPersistentStorage(() => ({ persisted: async () => false, persist: async () => true }))
  await storage.requestAfterSave()
  expect(storage.getSnapshot()).toBe('denied')
})

it('does not repeat a denied request on later saves, and can recheck a later grant', async () => {
  let granted = false
  const persist = vi.fn().mockResolvedValue(false)
  const storage = createPersistentStorage(() => ({ persisted: async () => granted, persist }))
  await Promise.all([storage.requestAfterSave(), storage.requestAfterSave()])
  expect(storage.getSnapshot()).toBe('denied')
  await storage.requestAfterSave()
  expect(persist).toHaveBeenCalledTimes(1)
  granted = true
  await storage.recheck()
  expect(storage.getSnapshot()).toBe('granted')
  granted = false
  await storage.recheck()
  expect(storage.getSnapshot()).toBe('denied')
})

it.each([undefined, {}, { persisted: async () => false }, { persist: async () => true }])('reports unsupported controls without throwing (%j)', async controls => {
  const storage = createPersistentStorage(() => controls)
  await expect(storage.requestAfterSave()).resolves.toBeUndefined()
  expect(storage.getSnapshot()).toBe('unsupported')
})

it.each(['access', 'check', 'request', 'verify'])('contains a browser %s failure and allows a later recheck', async failure => {
  let fail = true
  const persisted = vi.fn(async () => {
    if (fail && (failure === 'check' || (failure === 'verify' && persisted.mock.calls.length === 2))) throw new Error('Synthetic browser error')
    return !fail
  })
  const storage = createPersistentStorage(() => {
    if (fail && failure === 'access') throw new Error('Synthetic storage getter error')
    return { persisted, persist: async () => { if (failure === 'request') throw new Error('Synthetic permission error'); return true } }
  })
  await expect(storage.requestAfterSave()).resolves.toBeUndefined()
  expect(storage.getSnapshot()).toBe('error')
  fail = false
  await storage.recheck()
  expect(storage.getSnapshot()).toBe('granted')
})

it('serializes a recheck with a pending permission request', async () => {
  let resolve!: (value: boolean) => void
  let granted = false
  const storage = createPersistentStorage(() => ({
    persisted: async () => granted,
    persist: () => new Promise<boolean>(done => { resolve = done }),
  }))
  const requesting = storage.requestAfterSave()
  await vi.waitFor(() => expect(resolve).toBeDefined())
  const checking = storage.recheck()
  expect(storage.getSnapshot()).toBe('checking')
  granted = true
  resolve(true)
  await Promise.all([requesting, checking])
  expect(storage.getSnapshot()).toBe('granted')
})


it('trusts persisted() even when persist() returns a different result', async () => {
  const persisted = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
  const storage = createPersistentStorage(() => ({ persisted, persist: async () => false }))
  await storage.requestAfterSave()
  expect(storage.getSnapshot()).toBe('granted')
  expect(persisted).toHaveBeenCalledTimes(2)
})

it('reports an existing verified grant even when the browser cannot request permission', async () => {
  const storage = createPersistentStorage(() => ({ persisted: async () => true }))
  await storage.recheck()
  expect(storage.getSnapshot()).toBe('granted')
})

it('does not retry a failed permission request on subsequent saves', async () => {
  const persist = vi.fn().mockRejectedValue(new Error('Synthetic permission failure'))
  const storage = createPersistentStorage(() => ({ persisted: async () => false, persist }))
  await storage.requestAfterSave()
  expect(storage.getSnapshot()).toBe('error')
  await storage.requestAfterSave()
  expect(persist).toHaveBeenCalledTimes(1)
  await storage.recheck()
  expect(storage.getSnapshot()).toBe('denied')
  expect(persist).toHaveBeenCalledTimes(1)
})

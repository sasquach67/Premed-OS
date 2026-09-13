import { beforeEach, expect, it, vi } from 'vitest'
const migration = vi.hoisted(() => ({ fail: false }))
vi.mock('./migrations/notebookV50', async importOriginal => {
  const actual = await importOriginal<typeof import('./migrations/notebookV50')>()
  return { ...actual, migrateNotebookV50: (...args: Parameters<typeof actual.migrateNotebookV50>) => {
    if (migration.fail) throw new Error('Synthetic migration failure')
    return actual.migrateNotebookV50(...args)
  } }
})
import { createPersonalInitialData } from '@/data/personalInitialData'
import { accountStorageKey } from '@/lib/demoMode'
import { activateAccountWorkspace, activateGuestWorkspace, CURRENT_STORE_VERSION, readWorkspaceData, useStore } from './store'
import { guardedStorage } from './storageHealth'

beforeEach(() => { migration.fail = false; localStorage.clear(); useStore.persist.setOptions({ name: 'hq:app-data:guest' }); activateGuestWorkspace() })
it.each([
  ['missing state', JSON.stringify({ version: 50 })],
  ['wrong courses shape', JSON.stringify({ state: { ...createPersonalInitialData(), courses: {} }, version: 50 })],
])('keeps %s bytes and blocks fallback account seeding', (_label, raw) => {
  const key = accountStorageKey('synthetic-unreadable')
  localStorage.setItem(key, raw)
  expect(() => readWorkspaceData(key)).toThrow()
  expect(() => activateAccountWorkspace('synthetic-unreadable')).toThrow()
  guardedStorage(localStorage).setItem(key, JSON.stringify({ state: createPersonalInitialData(), version: CURRENT_STORE_VERSION }))
  expect(localStorage.getItem(key)).toBe(raw)
})
it('keeps existing bytes when the migration chain throws instead of writing defaults', () => {
  const key = accountStorageKey('synthetic-migration')
  const raw = JSON.stringify({ state: createPersonalInitialData(), version: 0 })
  localStorage.setItem(key, raw)
  migration.fail = true
  expect(() => activateAccountWorkspace('synthetic-migration')).toThrow('Synthetic migration failure')
  migration.fail = false
  guardedStorage(localStorage).setItem(key, JSON.stringify({ state: createPersonalInitialData(), version: CURRENT_STORE_VERSION }))
  expect(localStorage.getItem(key)).toBe(raw)
})

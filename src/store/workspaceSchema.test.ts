import { CURRENT_CLOUD_SCHEMA } from '@/lib/workspaceSchema'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { assertSupportedWorkspace, mergeRestoredWorkspace, prepareWorkspaceData } from '@/lib/workspaceSchema'
import { CURRENT_STORE_VERSION } from './workspaceVersion'
import { dataForRemote } from '@/lib/storyPrivacy'

beforeEach(() => { vi.resetModules(); localStorage.clear(); sessionStorage.clear() })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
const opaque = { syntheticFutureCollection: [{ id: 'future-1', nested: { source: 'opaque-only' } }], update: { never: 'an action' }, workspaceOpaque: 'ordinary unknown key', __proto__: null }
function fixture() { return Object.assign(createPersonalInitialData(), opaque, { _schema: CURRENT_CLOUD_SCHEMA }) }

it('keeps opaque keys separate from actions through edits, reset, account switches and reload', async () => {
  const s = await import('./store')
  s.activateAccountWorkspace('a', fixture())
  expect(typeof s.useStore.getState().update).toBe('function')
  expect(s.useStore.getState()).not.toHaveProperty('syntheticFutureCollection')
  s.useStore.getState().setNote('edit', 'saved')
  expect(s.snapshotData()).toMatchObject({ ...opaque, _schema: CURRENT_CLOUD_SCHEMA, notes: { edit: 'saved' } })
  s.assertDurableWorkspace()
  s.useStore.getState().resetToSeed()
  expect(s.snapshotData()).toMatchObject(opaque)
  s.activateAccountWorkspace('b', createPersonalInitialData())
  expect(s.snapshotData()).not.toHaveProperty('syntheticFutureCollection')
  s.activateGuestWorkspace()
  expect(s.snapshotData()).not.toHaveProperty('syntheticFutureCollection')
  s.activateAccountWorkspace('a')
  expect(s.snapshotData()).toMatchObject(opaque)
  vi.resetModules()
  const reloaded = await import('./store')
  expect(reloaded.snapshotData()).toMatchObject(opaque)
  expect(typeof reloaded.useStore.getState().update).toBe('function')
  reloaded.assertDurableWorkspace()
})

it('preserves opaque sections in IndexedDB across a cold reload and validates durable changes', async () => {
  const factory = new IDBFactory()
  vi.stubGlobal('indexedDB', factory); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  const key = 'hq:app-data:account:a'
  localStorage.setItem('hq:workspace-owner', 'account:a')
  localStorage.setItem(key, JSON.stringify({ state: fixture(), version: 50 }))
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const s = await import('./store')
  const p = (await import('./workspacePersistence')).workspacePersistence()!
  await p.flush(key)
  s.useStore.getState().setNote('edit', 'survives')
  await p.flush(key)
  s.assertDurableWorkspace()
  expect(JSON.parse((await p.repository.read(key))!.raw).state).toMatchObject(opaque)
  p.repository.close(); vi.resetModules()
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const reloaded = await import('./store')
  expect(reloaded.snapshotData()).toMatchObject({ ...opaque, notes: { edit: 'survives' } })
})

it('blocks future-schema local hydration and edits while retaining exact recovery bytes', async () => {
  const key = 'hq:app-data:account:a'
  localStorage.setItem('hq:workspace-owner', 'account:a')
  const raw = JSON.stringify({ state: { ...fixture(), _schema: CURRENT_CLOUD_SCHEMA + 1 }, version: 51 })
  localStorage.setItem(key, raw)
  const s = await import('./store')
  expect(s.useStore.persist.hasHydrated()).toBe(false)
  expect(() => s.useStore.getState().setNote('edit', 'must fail')).toThrow('newer version')
  expect(localStorage.getItem(key)).toBe(raw)
  expect(() => s.readWorkspaceData(key)).toThrow()
  s.activateGuestWorkspace()
  expect(() => s.useStore.getState().setNote('guest', 'allowed')).not.toThrow()
})

it('keeps unknown sections during legacy restore and filters only known private Story Bank data', () => {
  const current = fixture(), incoming = createPersonalInitialData()
  const restored = mergeRestoredWorkspace(current, incoming)
  expect(restored).toMatchObject({ ...opaque, _schema: CURRENT_CLOUD_SCHEMA })
  expect(restored.stories).toEqual([])
  const remote = dataForRemote(restored)
  expect(remote).toMatchObject(opaque)
  expect(() => mergeRestoredWorkspace(current, { ...incoming, _schema: CURRENT_CLOUD_SCHEMA + 1 } as typeof incoming)).toThrow('newer version')
})

it.each([null, '1', 1.2, -1, 0, 2147483648, [], {}])('rejects malformed marker %j without stamping', marker => {
  const raw = { ...fixture(), _schema: marker }
  expect(() => assertSupportedWorkspace(raw)).toThrow('invalid schema')
  expect(() => prepareWorkspaceData(raw as ReturnType<typeof fixture>)).toThrow()
  expect(raw._schema).toEqual(marker)
})

it('protects future local envelopes even when their cloud marker is supported', async () => {
  const key = 'hq:app-data:account:future-envelope'
  localStorage.setItem('hq:workspace-owner', 'account:future-envelope')
  const raw = JSON.stringify({ state: fixture(), version: CURRENT_STORE_VERSION + 1 })
  localStorage.setItem(key, raw)
  const s = await import('./store')
  expect(s.useStore.persist.hasHydrated()).toBe(false)
  expect(() => s.useStore.getState().setNote('edit', 'blocked')).toThrow('unsupported local version')
  expect(localStorage.getItem(key)).toBe(raw)
})

it('schema 2 hydrates an unmarked T4 v51 snapshot without dropping its nested fields', async () => {
  const key = 'hq:app-data:account:t4-local'
  localStorage.setItem('hq:workspace-owner', 'account:t4-local')
  const data = { ...createPersonalInitialData(), persons: [{ id: 'p', name: 'Synthetic', bio: 'T4 field' }] }
  localStorage.setItem(key, JSON.stringify({ state: data, version: 51 }))
  const s = await import('./store')
  expect(s.useStore.persist.hasHydrated()).toBe(true)
  expect(s.snapshotData().persons).toEqual(data.persons)
  expect(s.snapshotData()).toMatchObject({ _schema: CURRENT_CLOUD_SCHEMA, researchMemberships: [] })
  s.useStore.getState().setNote('edit', 'allowed')
  expect(JSON.parse(localStorage.getItem(key)!).version).toBe(CURRENT_STORE_VERSION)
})

it('migrates the schema-1 v51 line to v52 with opaque data and known Research containers', async () => {
  const key = 'hq:app-data:account:s1-v51'
  const data = fixture() as unknown as Record<string, unknown>
  data._schema = 1
  for (const name of ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships']) delete data[name]
  localStorage.setItem('hq:workspace-owner', 'account:s1-v51')
  localStorage.setItem(key, JSON.stringify({ state: data, version: 51 }))
  const s = await import('./store')
  expect(s.useStore.persist.hasHydrated()).toBe(true)
  expect(s.snapshotData()).toMatchObject({ ...opaque, _schema: CURRENT_CLOUD_SCHEMA, researchMemberships: [], researchReminders: [] })
  s.useStore.getState().setNote('migrated', 'yes')
  expect(JSON.parse(localStorage.getItem(key)!).version).toBe(CURRENT_STORE_VERSION)
})

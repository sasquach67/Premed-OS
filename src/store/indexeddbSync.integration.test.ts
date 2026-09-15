import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
const wire = vi.hoisted(() => ({ row: null as unknown, writes: vi.fn(), drive: vi.fn(async (_data: unknown, check: () => Promise<void>) => { await check(); return 'synthetic-backup' }) }))
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, authRedirectTo: 'http://localhost/', supabase: {
  auth: { getSession: async () => ({ data: { session: { user: { id: 'synthetic-sync', email: 'synthetic@example.invalid' } } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: wire.row, error: null }) }) }), update: (value: unknown) => ({ eq: () => ({ eq: () => ({ select: () => ({ maybeSingle: async () => { wire.writes(value); return { data: { updated_at: '2026-09-14T00:00:00Z' }, error: null } } }) }) }) }) }),
} }))
vi.mock('@/lib/academics/sharedMaterialFiles', () => ({ syncAcademicOriginals: async () => ({ uploaded: 0, available: 0, missing: 0 }) }))
vi.mock('@/lib/googleDrive', () => ({ uploadCompleteBackup: wire.drive, isConnected: () => true, clearDriveSession() {}, connect: async () => undefined, connectSilent: async () => undefined, disconnect() {} }))
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const key = 'hq:app-data:account:synthetic-sync'
let root: Root, cloud: ReturnType<typeof import('./useCloudSync').useCloudSync>, backup: ReturnType<typeof import('./useBackup').useBackup>
beforeEach(async () => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear(); wire.writes.mockClear(); wire.drive.mockClear()
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  const state = createPersonalInitialData(); state.notes.example = 'Original'
  localStorage.setItem('hq:workspace-owner', 'account:synthetic-sync')
  localStorage.setItem(key, JSON.stringify({ state, version: 50 }))
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const store = await import('./store')
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  await (await import('./workspacePersistence')).workspacePersistence()!.flush(key)
  wire.row = { data: store.snapshotData(), updated_at: '2026-09-13T00:00:00Z' }
  const { useCloudSync } = await import('./useCloudSync'), { useBackup } = await import('./useBackup')
  function Probe() { cloud = useCloudSync(); backup = useBackup(); return null }
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(createElement(Probe)))
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.accountReady).toBe(true) })
})
afterEach(async () => { await act(async () => root.unmount()); (await import('./workspacePersistence')).workspacePersistence()!.repository.close(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
it('waits for an actual queued IDB commit before uploading the matching cloud snapshot', async () => {
  const { useStore } = await import('./store'), disk = (await import('./workspacePersistence')).workspacePersistence()!
  const original = disk.repository.commit.bind(disk.repository)
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  vi.spyOn(disk.repository, 'commit').mockImplementation(async (...args) => { await gate; return original(...args) })
  let pushed!: Promise<boolean>
  await act(async () => { useStore.getState().update(d => { d.notes.example = 'Queued edit' }); pushed = cloud.pushNow() })
  expect(wire.writes).not.toHaveBeenCalled()
  await act(async () => { release(); expect(await pushed).toBe(true) })
  expect(wire.writes).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ notes: expect.objectContaining({ example: 'Queued edit' }) }) }))
  expect(JSON.parse((await disk.repository.read(key))!.raw).state.notes.example).toBe('Queued edit')
})
it('blocks both dashboard sync and Drive when a queued local commit fails', async () => {
  const { useStore } = await import('./store'), disk = (await import('./workspacePersistence')).workspacePersistence()!
  vi.spyOn(disk.repository, 'commit').mockRejectedValue(new Error('Synthetic IDB failure'))
  await act(async () => { useStore.getState().update(d => { d.notes.example = 'Unsaved edit' }); expect(await cloud.pushNow()).toBe(false); await backup.backupNow() })
  expect(wire.writes).not.toHaveBeenCalled(); expect(wire.drive).not.toHaveBeenCalled()
  expect(backup.status).toBe('error')
  expect(JSON.parse((await disk.repository.read(key))!.raw).state.notes.example).toBe('Original')
})
it('acknowledges Drive only after its local backup receipt is durable', async () => {
  await act(async () => { await backup.backupNow() })
  expect(backup.status).toBe('saved')
  const disk = (await import('./workspacePersistence')).workspacePersistence()!
  const saved = JSON.parse((await disk.repository.read(key))!.raw).state
  expect(saved.settings.backup.completeDriveFileId).toBe('synthetic-backup')
  expect(saved.settings.backup.lastBackupAt).toBeGreaterThan(0)
  expect(disk.status(key).phase).toBe('ready')
})

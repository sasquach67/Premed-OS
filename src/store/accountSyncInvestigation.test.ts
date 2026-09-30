import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { claimedRow } from '@/test/fakeDashboards'

const wire = vi.hoisted(() => ({ rows: new Map<string, unknown>(), fullPending: new Map<string, Promise<unknown>>(), selects: vi.fn(), writes: vi.fn() }))
const id = 'synthetic-investigation', key = `hq:app-data:account:${id}`
vi.mock('@/lib/supabase', async () => {
  const { fakeDashboardsTable } = await import('@/test/fakeDashboards')
  return { isSupabaseConfigured: true, authRedirectTo: 'http://localhost/', supabase: {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'synthetic-investigation' } } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    from: () => {
      const table = fakeDashboardsTable(wire)
      return { ...table, select: (columns: string) => {
        wire.selects(columns)
        return fakeDashboardsTable({ ...wire, pending: columns.startsWith('data,') ? wire.fullPending : undefined }).select(columns)
      } }
    },
  } }
})
vi.mock('@/lib/academics/sharedMaterialFiles', () => ({ syncAcademicOriginals: async () => undefined }))
vi.mock('@/lib/googleDrive', () => ({ clearDriveSession() {} }))
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined, cloud: ReturnType<typeof import('./useCloudSync').useCloudSync>
beforeEach(() => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear(); wire.rows.clear(); wire.fullPending.clear(); wire.selects.mockClear(); wire.writes.mockClear()
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  localStorage.setItem('hq:workspace-owner', `account:${id}`)
})
afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = undefined
  ;(await import('./workspacePersistence')).workspacePersistence()?.repository.close()
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals()
})
async function mount() {
  const { useCloudSync } = await import('./useCloudSync')
  function Probe() { cloud = useCloudSync(); return null }
  root = createRoot(document.createElement('div'))
  await act(async () => root!.render(createElement(Probe)))
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).not.toBe('syncing') })
}
async function bootSynced() {
  const state = createPersonalInitialData(); state.notes.synthetic = 'Baseline'
  localStorage.setItem(key, JSON.stringify({ state, version: 0 }))
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const store = await import('./store')
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  await (await import('./storageHealth')).flushWorkspaceStorage(key)
  wire.rows.set(id, claimedRow(store.snapshotData() as unknown as Record<string, unknown>, '2026-09-29T00:00:00Z'))
  await mount(); expect(cloud.accountReady).toBe(true)
  return store
}
it('restores a current cloud copy through missing-IDB recovery and resumes without a review or upload', async () => {
  // Build current-format synthetic content before the store is imported.
  const data = createPersonalInitialData(); data.notes.synthetic = 'Restored cloud'
  const { createWorkspaceRepository } = await import('./workspaceRepository')
  const repo = createWorkspaceRepository()
  const { createBootRecovery } = await import('./workspaceBootRecovery')
  localStorage.setItem(key, 'premed-os:workspace:idb:v1:missing')
  const row = claimedRow(data as unknown as Record<string, unknown>, '2026-09-29T00:00:00Z')
  const remote = { data, updatedAt: row.updated_at, claim: { cloudSchema: row.cloud_schema!, writeRev: row.write_rev! } }
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  await recovery.confirm(await recovery.fromAccount(id, async () => remote)); repo.close()
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const store = await import('./store')
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  await (await import('./storageHealth')).flushWorkspaceStorage(key)
  wire.rows.set(id, row)
  await mount()
  expect(Boolean(cloud.conflict)).toBe(false)
  expect(cloud.accountReady).toBe(true)
  expect(store.snapshotData().notes.synthetic).toBe('Restored cloud')
  expect(wire.writes).not.toHaveBeenCalled()
})
it('does not mistake route-only local changes for authored divergence when another browser saves', async () => {
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  await act(async () => store.useStore.getState().touchRoute('/research'))
  await (await import('./storageHealth')).flushWorkspaceStorage(key)
  remote.notes.synthetic = 'Other browser edit'
  wire.rows.set(id, claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2))
  await act(async () => cloud.pullNow())
  expect(Boolean(cloud.conflict)).toBe(false)
  expect(cloud.accountReady).toBe(true)
  expect(store.snapshotData().notes.synthetic).toBe('Other browser edit')
  expect(wire.writes).not.toHaveBeenCalled()
})
it.each(['focus', 'visibilitychange'])('refreshes an unchanged visible browser on %s', async event => {
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  remote.notes.synthetic = 'Other browser edit'
  wire.rows.set(id, claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2))
  await act(async () => (event === 'focus' ? window : document).dispatchEvent(new Event(event)))
  await vi.waitFor(async () => { await act(async () => {}); expect(store.snapshotData().notes.synthetic).toBe('Other browser edit') }, { timeout: 500 })
  expect(wire.writes).not.toHaveBeenCalled()
})

it('checks a clean visible browser every minute and removes the timer on unmount', async () => {
  const interval = vi.spyOn(globalThis, 'setInterval'), clear = vi.spyOn(globalThis, 'clearInterval')
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  remote.notes.synthetic = 'Periodic update'
  wire.rows.set(id, claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2))
  const call = interval.mock.calls.findIndex(([, delay]) => delay === 60_000)
  expect(call).toBeGreaterThanOrEqual(0)
  await act(async () => (interval.mock.calls[call][0] as () => void)())
  await vi.waitFor(async () => { await act(async () => {}); expect(store.snapshotData().notes.synthetic).toBe('Periodic update') })
  await act(async () => root!.unmount()); root = undefined
  expect(clear).toHaveBeenCalledWith(interval.mock.results[call].value)
  expect(wire.writes).not.toHaveBeenCalled()
})

it('uses only revision metadata and skips an image sweep when a passive check finds no changes', async () => {
  await bootSynced()
  const images = vi.spyOn(await import('@/lib/academics/notebook/sharedNotebookAssets'), 'syncNotebookImages')
  wire.selects.mockClear()
  await act(async () => { window.dispatchEvent(new Event('focus')); await new Promise(resolve => setTimeout(resolve, 30)) })
  expect(wire.selects.mock.calls).toEqual([['updated_at, cloud_schema, write_rev']])
  expect(images).not.toHaveBeenCalled()
  expect(cloud.accountReady).toBe(true)
})

it('automatically rechecks a refresh cancelled by navigation without overwriting either copy', async () => {
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  remote.notes.synthetic = 'Other browser edit'
  const row = claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2)
  wire.rows.set(id, row)
  let release!: (row: unknown) => void
  wire.fullPending.set(id, new Promise(resolve => { release = resolve }))
  const timers = vi.spyOn(globalThis, 'setTimeout')
  await act(async () => window.dispatchEvent(new Event('focus')))
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).toBe('syncing') })
  await act(async () => store.useStore.getState().touchRoute('/research'))
  await (await import('./storageHealth')).flushWorkspaceStorage(key)
  await act(async () => release(row))
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).toBe('error') })
  expect(store.snapshotData().notes.synthetic).toBe('Baseline')
  expect(wire.writes).not.toHaveBeenCalled()
  const retry = timers.mock.calls.find(([, delay]) => delay === 60_000)
  expect(retry).toBeDefined()
  wire.fullPending.clear()
  await act(async () => (retry![0] as () => void)())
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.accountReady).toBe(true) })
  expect(store.snapshotData().notes.synthetic).toBe('Other browser edit')
  expect(wire.writes).not.toHaveBeenCalled()
})

it('retries safely when an edit is still saving as baseline recording finishes', async () => {
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  remote.notes.synthetic = 'Other browser edit'
  wire.rows.set(id, claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2))
  const safety = await import('./accountSyncSafety'), record = safety.recordSyncBaseline
  let releaseHash!: () => void, releaseSave!: () => void
  const hashGate = new Promise<void>(resolve => { releaseHash = resolve })
  const saveGate = new Promise<void>(resolve => { releaseSave = resolve })
  const recording = vi.spyOn(safety, 'recordSyncBaseline').mockImplementation(async (...args) => { await hashGate; return record(...args) })
  const timers = vi.spyOn(globalThis, 'setTimeout')
  await act(async () => window.dispatchEvent(new Event('focus')))
  await vi.waitFor(() => expect(recording).toHaveBeenCalled())
  const disk = (await import('./workspacePersistence')).workspacePersistence()!, commit = disk.repository.commit.bind(disk.repository)
  vi.spyOn(disk.repository, 'commit').mockImplementation(async (...args) => { await saveGate; return commit(...args) })
  try {
    await act(async () => store.useStore.getState().update(d => { d.notes.synthetic = 'Edit after remote adoption' }))
    await act(async () => releaseHash())
    await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).toBe('error') })
    expect(store.snapshotData().notes.synthetic).toBe('Edit after remote adoption')
    const retry = timers.mock.calls.find(([, delay]) => delay === 60_000)
    expect(retry).toBeDefined()
    await act(async () => { releaseSave(); await disk.flush(key) })
    await act(async () => (retry![0] as () => void)())
    await vi.waitFor(async () => { await act(async () => {}); expect(cloud.accountReady).toBe(true) })
    expect(store.snapshotData().notes.synthetic).toBe('Edit after remote adoption')
    expect(wire.writes).not.toHaveBeenCalled()
  } finally { releaseHash(); releaseSave(); await disk.flush(key) }
})

it.each(['hidden', 'offline', 'authored edit', 'paused'] as const)('leaves a %s browser alone during passive refresh', async state => {
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  remote.notes.synthetic = 'Other browser edit'
  wire.rows.set(id, claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2))
  if (state === 'hidden') vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  if (state === 'offline') vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  if (state === 'authored edit') await act(async () => store.useStore.getState().update(d => { d.notes.synthetic = 'Local unsent edit' }))
  if (state === 'paused') await act(async () => { (await import('./accountSyncSafety')).pauseAccountSync(id) })
  await (await import('./storageHealth')).flushWorkspaceStorage(key)
  await act(async () => { window.dispatchEvent(new Event('focus')); await new Promise(resolve => setTimeout(resolve, 30)) })
  expect(store.snapshotData().notes.synthetic).toBe(state === 'authored edit' ? 'Local unsent edit' : 'Baseline')
  expect(Boolean(cloud.conflict)).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled()
})

it.each(['absent', 'malformed'])('keeps a legacy baseline with %s comparable digest conservative', async kind => {
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  const baselineKey = `premed-os:sync-baseline:v2:${id}`, saved = JSON.parse(localStorage.getItem(baselineKey)!)
  if (kind === 'absent') delete saved.comparableDigestV1
  else saved.comparableDigestV1 = 'not-a-sha256'
  localStorage.setItem(baselineKey, JSON.stringify(saved))
  await act(async () => store.useStore.getState().touchRoute('/research'))
  await (await import('./storageHealth')).flushWorkspaceStorage(key)
  remote.notes.synthetic = 'Other browser edit'
  wire.rows.set(id, claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2))
  await act(async () => cloud.pullNow())
  expect(Boolean(cloud.conflict)).toBe(true)
  expect(cloud.accountReady).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled()
})

it.each(['notes', 'settings', 'history', 'unknown'] as const)('retains review for authored %s changes on both sides', async kind => {
  const store = await bootSynced(), remote = structuredClone(store.snapshotData())
  const local = structuredClone(store.snapshotData())
  if (kind === 'notes') local.notes.synthetic = 'Authored local edit'
  if (kind === 'settings') local.settings.theme = 'dark'
  if (kind === 'history') local.meta.activity.push({ id: 'synthetic-event', at: 1, pillar: 'Overview', label: 'Authored action' })
  if (kind === 'unknown') Object.assign(local, { futureSection: { authored: 'Keep this' } })
  await act(async () => store.useStore.getState().adoptPreparedWorkspace(local))
  await (await import('./storageHealth')).flushWorkspaceStorage(key)
  remote.notes.synthetic = 'Other browser edit'
  wire.rows.set(id, claimedRow(remote as unknown as Record<string, unknown>, '2026-09-30T00:00:00Z', 2))
  await act(async () => cloud.pullNow())
  expect(Boolean(cloud.conflict)).toBe(true)
  expect(cloud.accountReady).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled()
})

it('keeps raw/legacy digests unchanged and preserves the original comparable hash while rebasing dirty work', async () => {
  const store = await bootSynced(), safety = await import('./accountSyncSafety')
  const baseline = safety.readSyncBaseline(id)!
  expect(baseline.digest).toBe(await safety.syncDigest(safety.syncContent(store.snapshotData())))
  expect(JSON.parse(localStorage.getItem(`premed-os:sync-baseline:v1:${id}`)!)).toEqual({ digest: baseline.digest, updatedAt: baseline.updatedAt })
  expect(baseline.comparableDigestV1).toMatch(/^[a-f0-9]{64}$/)
  await act(async () => store.useStore.getState().update(d => { d.notes.synthetic = 'Unsent edit' }))
  await safety.rebaseSyncBaseline(id, baseline, { updatedAt: '2026-09-30T00:00:00Z', claim: { cloudSchema: 2, writeRev: 2 } }, safety.captureSyncSession())
  const rebased = safety.readSyncBaseline(id)!
  expect(rebased.comparableDigestV1).toBe(baseline.comparableDigestV1)
  expect(await safety.matchesSyncBaseline(store.snapshotData(), rebased.digest, rebased.comparableDigestV1)).toBe(false)
})

it('does not publish either baseline if a new pause arrives during the comparable digest', async () => {
  const store = await bootSynced(), safety = await import('./accountSyncSafety')
  const original = crypto.subtle.digest.bind(crypto.subtle), before = localStorage.getItem(`premed-os:sync-baseline:v2:${id}`)
  let release!: () => void, calls = 0
  const gate = new Promise<void>(resolve => { release = resolve })
  vi.spyOn(crypto.subtle, 'digest').mockImplementation(async (...args) => { if (++calls === 2) await gate; return original(...args) })
  const writing = safety.recordSyncBaseline(id, store.snapshotData(), { updatedAt: '2026-09-30T00:00:00Z', claim: { cloudSchema: 2, writeRev: 2 } }, safety.captureSyncSession())
  const rejected = expect(writing).rejects.toThrow('newer operation paused')
  await vi.waitFor(() => expect(calls).toBe(2))
  await act(async () => { safety.pauseAccountSync(id); release(); await rejected })
  expect(localStorage.getItem(`premed-os:sync-baseline:v2:${id}`)).toBe(before)
})

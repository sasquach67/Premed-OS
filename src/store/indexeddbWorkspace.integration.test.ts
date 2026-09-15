import { Blob as NodeBlob } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
const key = 'hq:app-data:account:synthetic-workspace'
let factory: IDBFactory
beforeEach(() => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear()
  factory = new IDBFactory(); vi.stubGlobal('Blob', NodeBlob); vi.stubGlobal('indexedDB', factory); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  localStorage.setItem('hq:workspace-owner', 'account:synthetic-workspace')
  const data = createPersonalInitialData()
  data.courses.push({ id: 'synthetic-class', code: 'TEST101', title: 'Synthetic class', term: 'Fall 2026', credits: 3, grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0 })
  data.notes.example = 'Existing note'
  localStorage.setItem(key, JSON.stringify({ state: data, version: 50 }))
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
async function boot() {
  const { initializeDurableWorkspaces } = await import('./workspaceBootstrap')
  await initializeDurableWorkspaces()
  const store = await import('./store')
  expect(store.useStore.persist.hasHydrated()).toBe(true)
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  const persistence = (await import('./workspacePersistence')).workspacePersistence()!
  await persistence.flush(key)
  return { ...store, persistence, commit: (await import('./workspaceTransaction')).commitWorkspaceMutation }
}
it('recovers the oldest namespace after interruption immediately after pointer activation', async () => {
  const legacy = localStorage.getItem(key)!
  localStorage.clear(); localStorage.setItem('premed_hq_v1', legacy)
  const { createWorkspaceRepository } = await import('./workspaceRepository')
  const { createWorkspacePersistence } = await import('./workspacePersistence')
  const repository = createWorkspaceRepository(factory)
  await repository.stage('hq:app-data', null, legacy, { key: 'premed_hq_v1', raw: legacy })
  const disk = createWorkspacePersistence(repository, localStorage)
  await disk.load('hq:app-data', () => { throw new Error('Must not seed') })
  expect((await repository.read('hq:app-data'))!.hasData).toBe(true)
  repository.close(); vi.resetModules()
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const store = await import('./store')
  expect(store.useStore.persist.hasHydrated()).toBe(true)
  expect(store.snapshotData().notes.example).toBe('Existing note')
  expect(store.snapshotData().courses[0].id).toBe('synthetic-class')
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  const saved = (await import('./workspacePersistence')).workspacePersistence()!
  await saved.flush('hq:app-data')
  expect(JSON.parse((await saved.repository.read('hq:app-data'))!.raw).state.notes.example).toBe('Existing note')
  expect((await saved.repository.originals('hq:app-data'))[0]).toMatchObject({ raw: legacy, sourceKey: 'premed_hq_v1' })
})
it('keeps a newly published demo pointer through store initialization before the seed stamp exists', async () => {
  localStorage.clear(); localStorage.setItem('hq:demo-mode', 'on')
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const marker = localStorage.getItem('hq-demo:app-data')
  expect(marker).toContain('premed-os:workspace:idb:v1:')
  expect(localStorage.getItem('hq-demo:seed-stamp')).toBeNull()
  const store = await import('./store')
  expect(store.useStore.persist.hasHydrated()).toBe(true)
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  await (await import('./workspacePersistence')).workspacePersistence()!.flush('hq-demo:app-data')
  expect(localStorage.getItem('hq-demo:app-data')).toBe(marker)
})
it('keeps large acknowledged edits and account ownership through a cold reload', async () => {
  const s = await boot(), marker = localStorage.getItem(key)
  const set = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(this: Storage, k, v) { if (v.length > 1024) throw new DOMException('LS quota', 'QuotaExceededError'); set.call(this, k, v) })
  await s.commit(d => { d.notes.example = 'Large notebook-like content '.repeat(250_000) })
  expect(s.snapshotData().notes.example.length).toBeGreaterThan(5 * 1024 * 1024)
  expect(localStorage.getItem(key)).toBe(marker)
  s.persistence.repository.close(); vi.resetModules()
  const reloaded = await boot()
  expect(reloaded.snapshotData().notes.example).toBe(s.snapshotData().notes.example)
  expect(reloaded.activeAccountWorkspaceId()).toBe('synthetic-workspace')
})
it('does not publish a notebook edit or acknowledge success when IndexedDB rejects the commit', async () => {
  const s = await boot(), before = JSON.stringify(s.snapshotData())
  vi.spyOn(s.persistence.repository, 'commit').mockRejectedValueOnce(new DOMException('Synthetic quota', 'QuotaExceededError'))
  await expect(s.commit(d => { d.notes.example = 'Must not appear saved' })).rejects.toThrow('could not save')
  expect(JSON.stringify(s.snapshotData())).toBe(before)
  expect(s.persistence.status(key).phase).toBe('error')
  expect(JSON.parse((await s.persistence.repository.read(key))!.raw).state.notes.example).toBe('Existing note')
})
it('does not adopt an acknowledged account-A notebook into Guest after a signout', async () => {
  const s = await boot(), original = s.persistence.repository.commit.bind(s.persistence.repository)
  let finish!: () => void
  const pending = new Promise<void>(r => { finish = r })
  vi.spyOn(s.persistence.repository, 'commit').mockImplementation(async (...args) => { await pending; return original(...args) })
  const save = s.commit(d => { d.notes.example = 'Saved for A only' })
  const rejected = expect(save).rejects.toThrow('open workspace changed')
  await vi.waitFor(() => expect(s.persistence.status(key).phase).toBe('saving'))
  s.activateGuestWorkspace()
  finish(); await rejected
  expect(s.activeAccountWorkspaceId()).toBeNull()
  expect(s.snapshotData().notes.example).not.toBe('Saved for A only')
  expect(JSON.parse((await s.persistence.repository.read(key))!.raw).state.notes.example).toBe('Saved for A only')
})
it('retains notebooks, sources, notes, progress, history and actual staged images after reload', async () => {
  const s = await boot()
  const { visualFixture, headerDecoder } = await import('@/lib/academics/notebook/visual.test-fixtures')
  const { prepareNotebook } = await import('@/lib/academics/notebook/package')
  const { prepareNotebookAssets } = await import('@/lib/academics/notebook/visualAssets')
  const { importNotebook, saveNotebookEdits } = await import('@/lib/academics/notebook/import')
  const { commitNotebookAssets, createNotebookAssetRepository } = await import('@/lib/academics/notebook/notebookAssetStore')
  const pkg = visualFixture(), prepared = await prepareNotebook(JSON.stringify(pkg))
  const assets = await prepareNotebookAssets(pkg, [{ name: pkg.assets[0].fileName, blob: new Blob([new Uint8Array(readFileSync('src/lib/academics/notebook/visual-fixtures/question.png'))], { type: 'image/png' }) }], { decode: headerDecoder })
  const repository = createNotebookAssetRepository(factory)
  let ids: string[] = []
  await commitNotebookAssets({ prepared: assets, repository, assertFresh() {}, commit: () => ({ committed: true, durable: s.commit(d => { ids = importNotebook(d.academics.classCenter, d.courses[0], prepared, { confirmDestination: true }) }) }) })
  expect(await repository.journals()).toEqual([])
  const edited = structuredClone(s.snapshotData().academics.classCenter.lectures[0].importedNotebook!.current)
  edited.entries[0].title = 'Manual edit'
  await s.commit(d => {
    const entry = d.academics.classCenter.lectures.find(l => l.id === ids[0])!
    entry.importedNotebook!.progress.practice = { response: 'Student answer', complete: true }
    saveNotebookEdits(entry, edited, 'Student notes')
  })
  const before = s.snapshotData().academics.classCenter.lectures[0].importedNotebook!
  const hash = before.assetBindings![0].sha256
  const image = await repository.read(hash)
  expect(image).toBeTruthy()
  s.persistence.repository.close(); vi.resetModules()
  const reloaded = await boot()
  const saved = reloaded.snapshotData().academics.classCenter.lectures[0].importedNotebook!
  expect(saved).toEqual(before)
  expect(saved.history!.length).toBeGreaterThan(0)
  const freshAssets = (await import('@/lib/academics/notebook/notebookAssetStore')).createNotebookAssetRepository(factory)
  const bytes = await freshAssets.read(hash)
  expect(bytes?.size).toBe(image?.size)
  expect(await bytes?.arrayBuffer()).toEqual(await image?.arrayBuffer())
})

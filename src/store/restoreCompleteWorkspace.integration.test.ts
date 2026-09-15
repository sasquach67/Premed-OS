import { Blob as NodeBlob } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb'
import { afterEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
vi.mock('@/lib/supabase', () => ({ supabase: null, isSupabaseConfigured: false }))
afterEach(async () => { (await import('./workspacePersistence')).workspacePersistence()?.repository.close(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('retains the prior real-store snapshot and staged image journal when the restore metadata transaction aborts', async () => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear()
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange); vi.stubGlobal('Blob', NodeBlob)
  const key = 'hq:app-data:guest', original = createPersonalInitialData()
  original.notes.example = 'Prior saved workspace'
  localStorage.setItem('hq:workspace-owner', 'guest')
  localStorage.setItem(key, JSON.stringify({ state: original, version: 50 }))
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  const store = await import('./store'), disk = (await import('./workspacePersistence')).workspacePersistence()!
  expect(store.useStore.persist.hasHydrated()).toBe(true)
  await disk.flush(key)
  const beforeRaw = (await disk.repository.read(key))!.raw, before = store.snapshotData()
  const { visualFixture, headerDecoder, MemoryNotebookAssets } = await import('@/lib/academics/notebook/visual.test-fixtures')
  const { prepareNotebook } = await import('@/lib/academics/notebook/package')
  const { prepareNotebookAssets } = await import('@/lib/academics/notebook/visualAssets')
  const { commitNotebookAssets, notebookAssetRepository } = await import('@/lib/academics/notebook/notebookAssetStore')
  const { importNotebook } = await import('@/lib/academics/notebook/import')
  const { createWorkspaceBackup, prepareWorkspaceBackup } = await import('@/lib/workspaceBackup')
  const pngBlob = () => new Blob([readFileSync('src/lib/academics/notebook/visual-fixtures/question.png')], { type: 'image/png' })
  const data = createPersonalInitialData(), pkg = visualFixture(), images = new MemoryNotebookAssets()
  data.notes.example = 'Incoming restore'
  const parsed = await prepareNotebook(JSON.stringify(pkg))
  const assets = await prepareNotebookAssets(pkg, [{ name: pkg.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  await commitNotebookAssets({ prepared: assets, repository: images, assertFresh() {}, commit: () => { importNotebook(data.academics.classCenter, { id: 'synthetic-class', code: pkg.course.code }, parsed, { confirmDestination: true }); return { committed: true } } })
  const prepared = await prepareWorkspaceBackup(await createWorkspaceBackup(data, { images, file: async () => undefined }), headerDecoder)
  const put = IDBObjectStore.prototype.put
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function(this: IDBObjectStore, value, k) {
    const request = put.call(this, value, k)
    if (this.name === 'workspaces' && value.raw?.includes('Incoming restore')) request.addEventListener('success', () => this.transaction.abort())
    return request
  })
  await expect((await import('./restoreCompleteWorkspace')).restoreCompleteWorkspace(async () => prepared)).rejects.toThrow('could not be confirmed as saved')
  expect((await disk.repository.read(key))!.raw).toBe(beforeRaw)
  expect(store.snapshotData()).toEqual(before)
  expect(disk.status(key).phase).toBe('error')
  expect(await notebookAssetRepository().journals()).toHaveLength(1)
  const hash = prepared.data.academics.classCenter.lectures[0].importedNotebook!.assetBindings![0].sha256
  expect((await notebookAssetRepository().read(hash))?.size).toBe(pngBlob().size)
})

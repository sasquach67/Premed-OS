import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'
import { webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { dataForRemote, mergeRemotePreservingLocal } from '@/lib/storyPrivacy'
import { mergeRestoredWorkspace } from '@/lib/workspaceSchema'
import { createWorkspaceBackup, prepareWorkspaceBackup, stageWorkspaceBackup } from '@/lib/workspaceBackup'
import { CURRENT_STORE_VERSION } from '@/store/workspaceVersion'
import { prepareNotebook, parseNotebookPackage } from './package'
import { importNotebook, exportNotebook, saveNotebookEdits, acceptNotebookUpdate, restoreCompleteNotebookBackup } from './import'
import { createNotebookUpdateSession } from './revision'
import { prepareNotebookAssets } from './visualAssets'
import { commitNotebookAssets } from './notebookAssetStore'
import { exportNotebookPackageBundle, exportNotebookBackupBundle, prepareNotebookBundle, portableNotebookPackages } from './notebookBundle'
import { visualFixture, headerDecoder, MemoryNotebookAssets } from './visual.test-fixtures'
import type { ImportedNotebook, NotebookPackage } from './types'

const pngBlob = () => new Blob([readFileSync('src/lib/academics/notebook/visual-fixtures/question.png')], { type: 'image/png' })

vi.mock('@/lib/supabase', () => ({ supabase: null, isSupabaseConfigured: false }))
beforeEach(() => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear()
  vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('Blob', NodeBlob)
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
})
afterEach(async () => {
  ;(await import('@/store/workspacePersistence')).workspacePersistence()?.repository.close()
  vi.restoreAllMocks(); vi.unstubAllGlobals()
})

function setDetail(pkg: NotebookPackage, suffix: string) {
  for (const block of pkg.entries[0].sections.flatMap(s => s.blocks)) {
    if (block.id === 'detail-paragraph' && block.type === 'paragraph') block.more = `  Paragraph ${suffix}: a fictional triangle means left by an assigned rule.\nKeep the distinction.  `
    if (block.id === 'detail-bullets' && block.type === 'bullets') block.more = `  Bullets ${suffix}: the fictional exposure lasts 100 milliseconds, not indefinitely.\nKeep the condition.  `
  }
}
function assertBoth(pkg: NotebookPackage) {
  const blocks = pkg.entries[0].sections.flatMap(s => s.blocks)
  for (const type of ['paragraph', 'bullets']) {
    const b = blocks.find(b => b.id === `detail-${type}`)
    expect(b?.type).toBe(type)
    expect(b && 'more' in b && b.more).toMatch(/^ {2}(Paragraph|Bullets) /)
  }
}
function retained(n: ImportedNotebook) {
  // Restore deliberately changes local lineage/session destination IDs only.
  const { assetLineageId: _lineage, ...copy } = structuredClone(n)
  if (copy.updateSession) copy.updateSession.localId = 'destination-independent'
  return copy
}
async function fixture() {
  const data = createPersonalInitialData(), images = new MemoryNotebookAssets()
  const pkg = { ...visualFixture(), version: 4 as const, instructionsVersion: 'notebook-workflows-draft-4' as const }
  const exemplar = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'paragraph')!
  const provenance = { provenance: exemplar.provenance, sourceIds: exemplar.sourceIds, excerptIds: exemplar.excerptIds, assetIds: [] }
  pkg.entries[0].sections[0].blocks.push(
    { ...provenance, id: 'detail-paragraph', type: 'paragraph', text: 'The triangle is an assigned cue.' },
    { ...provenance, id: 'detail-bullets', type: 'bullets', items: ['Exposure is brief.'] },
  )
  setDetail(pkg, 'original')
  const course = { id: 'synthetic-detail-class', code: pkg.course.code }
  const center = data.academics.classCenter
  const prepared = await prepareNotebook(JSON.stringify(pkg, null, 2))
  const assets = await prepareNotebookAssets(pkg, [{ name: pkg.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  await commitNotebookAssets({ prepared: assets, repository: images, assertFresh() {}, commit() { importNotebook(center, course, prepared); return { committed: true } } })
  let lecture = center.lectures[0]
  lecture.importedNotebook!.progress.example = { response: 'Fictional saved response', complete: true }
  const session = lecture.importedNotebook!.updateSession = createNotebookUpdateSession(lecture.importedNotebook!, lecture.id)
  const next = structuredClone(pkg)
  setDetail(next, 'accepted revision'); next.entries[0].revision = 2; next.entries[0].baseRevision = 1
  const update = await prepareNotebook(JSON.stringify(next, null, 3))
  const updateAssets = await prepareNotebookAssets(next, [], { previousBindings: assets.bindings, reader: images, decode: headerDecoder })
  await commitNotebookAssets({ prepared: updateAssets, repository: images, lineageId: lecture.importedNotebook!.assetLineageId, retainedBindings: assets.bindings, assertFresh() {}, commit() { acceptNotebookUpdate(center, course, update, session, true); return { committed: true } } })
  lecture = center.lectures[0]
  const edit = structuredClone(lecture.importedNotebook!.current)
  setDetail(edit, 'edited current')
  saveNotebookEdits(lecture, edit, 'Independent fictional notes')
  const n = lecture.importedNotebook!
  n.progress.example = { response: 'Current fictional response', complete: false }
  n.updateSession = createNotebookUpdateSession(n, lecture.id)
  expect(n.history).toHaveLength(2)
  expect(n.history!.some(h => h.acceptedRaw)).toBe(true)
  expect(n.assetBindings).toHaveLength(1)
  for (const version of portableNotebookPackages(n)) assertBoth(version)
  return { data, images, course, lecture, n }
}

it('preserves both details through current/original JSON, portable package ZIP, complete notebook backup and explicit restore with actual PNG bytes', async () => {
  const f = await fixture()
  for (const mode of ['current', 'original'] as const) {
    const raw = exportNotebook(f.lecture, mode)
    expect(parseNotebookPackage(raw)).toEqual(f.n[mode])
    const bundle = await prepareNotebookBundle(await exportNotebookPackageBundle(raw, f.n.assetBindings!, f.images, headerDecoder), headerDecoder)
    if (bundle.kind !== 'package') throw new Error('Expected package')
    expect(bundle.package).toEqual(f.n[mode]); expect(bundle.raw).toBe(raw)
  }
  const backup = await prepareNotebookBundle(await exportNotebookBackupBundle(f.n, f.course.id, f.images, headerDecoder), headerDecoder)
  if (backup.kind !== 'backup') throw new Error('Expected complete backup')
  expect(retained(backup.notebook)).toEqual(retained(f.n))
  const fresh = createPersonalInitialData(), images = new MemoryNotebookAssets()
  const original = await prepareNotebook(backup.notebook.originalRaw)
  await commitNotebookAssets({ prepared: backup.assets, repository: images, assertFresh() {}, commit() { restoreCompleteNotebookBackup(fresh.academics.classCenter, f.course, backup.notebook, original, true); return { committed: true } } })
  const restored = fresh.academics.classCenter.lectures[0].importedNotebook!
  expect(retained(restored)).toEqual(retained(f.n))
  expect(await (await images.read(restored.assetBindings![0].sha256))!.arrayBuffer()).toEqual(await pngBlob().arrayBuffer())
})

it('preserves every saved/raw version, notes, progress and bindings through complete workspace ZIP staging with original PNG bytes', async () => {
  const f = await fixture()
  const backup = await prepareWorkspaceBackup(await createWorkspaceBackup(f.data, { images: f.images, file: async () => undefined }), headerDecoder)
  expect(backup.data).toEqual(f.data); expect(backup.imageCount).toBe(1)
  const images = new MemoryNotebookAssets()
  const staged = await stageWorkspaceBackup(backup, () => {}, { images, file: async () => { throw new Error('No original file in fixture') } })
  const restored = staged.data.academics.classCenter.lectures[0].importedNotebook!
  expect(retained(restored)).toEqual(retained(f.n))
  expect(await (await images.read(restored.assetBindings![0].sha256))!.arrayBuffer()).toEqual(await pngBlob().arrayBuffer())
  await staged.finish(); expect(await images.journals()).toEqual([])
})

it('preserves details through actual JSON export/import, cloud projection/merge, account activation, durable commit and cold hydration', async () => {
  const f = await fixture(), account = 'synthetic-detail-roundtrip'
  f.data.stories = [{ id: 'private-detail-test', prompt: '', title: '', commentary: 'Device only fictional note', tags: [], localOnly: true, order: 0 }]
  const key = `hq:app-data:account:${account}`
  localStorage.setItem('hq:workspace-owner', `account:${account}`)
  localStorage.setItem(key, JSON.stringify({ state: f.data, version: CURRENT_STORE_VERSION }))
  await (await import('@/store/workspaceBootstrap')).initializeDurableWorkspaces()
  const store = await import('@/store/store')
  expect(store.useStore.persist.hasHydrated()).toBe(true)
  let persistence = (await import('@/store/workspacePersistence')).workspacePersistence()!
  await persistence.flush(key)
  expect(store.snapshotData().academics.classCenter.lectures[0].importedNotebook).toEqual(f.n)
  let exported: Blob | undefined
  vi.stubGlobal('URL', class extends URL { static createObjectURL(blob: Blob) { exported = blob; return 'blob:fictional-export' } static revokeObjectURL() {} })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const { exportJson, readJsonFile } = await import('@/lib/dataIo')
  exportJson(); expect(exported).toBeDefined()
  const read = await readJsonFile(new NodeFile([new Uint8Array(await exported!.arrayBuffer())], 'fixture.json') as unknown as File)
  expect(read.academics.classCenter.lectures[0].importedNotebook).toEqual(f.n)
  // Real projection/merge/validator, simulated transport bytes; no network/account writes.
  const wire = JSON.parse(JSON.stringify(dataForRemote(read)))
  expect(wire.stories).toEqual([])
  const syncSafety: typeof import('@/store/accountSyncSafety') = await import('@/store/accountSyncSafety')
  syncSafety.validateRemoteWorkspace(wire)
  expect(JSON.parse(syncSafety.syncContent(wire)).academics.classCenter.lectures[0].importedNotebook).toEqual(f.n)
  const merged = mergeRestoredWorkspace(store.snapshotData(), mergeRemotePreservingLocal(wire, store.snapshotData()))
  expect(merged.stories).toEqual(f.data.stories)
  expect(merged.academics.classCenter.lectures[0].importedNotebook).toEqual(f.n)
  store.activateAccountWorkspace(account, merged)
  await (await import('@/store/workspaceTransaction')).commitWorkspaceMutation(draft => { draft.notes.detailProbe = 'Unrelated ordinary saved edit' })
  await persistence.flush(key)
  expect(JSON.parse((await persistence.repository.read(key))!.raw).state.academics.classCenter.lectures[0].importedNotebook).toEqual(f.n)
  persistence.repository.close(); vi.resetModules()
  await (await import('@/store/workspaceBootstrap')).initializeDurableWorkspaces()
  const reloaded = await import('@/store/store')
  persistence = (await import('@/store/workspacePersistence')).workspacePersistence()!
  expect(reloaded.useStore.persist.hasHydrated()).toBe(true)
  expect(reloaded.snapshotData().academics.classCenter.lectures[0].importedNotebook).toEqual(f.n)
  expect(reloaded.snapshotData().notes.detailProbe).toBe('Unrelated ordinary saved edit')
  await persistence.flush(key)
})

it('commits a complete workspace ZIP restore through the real restore coordinator and cold reload with PNG bytes in IndexedDB', async () => {
  const f = await fixture(), key = 'hq:app-data:guest'
  localStorage.setItem('hq:workspace-owner', 'guest')
  localStorage.setItem(key, JSON.stringify({ state: createPersonalInitialData(), version: CURRENT_STORE_VERSION }))
  await (await import('@/store/workspaceBootstrap')).initializeDurableWorkspaces()
  const store = await import('@/store/store')
  const persistence = (await import('@/store/workspacePersistence')).workspacePersistence()!
  await persistence.flush(key)
  const liveBackup = await import('@/lib/workspaceBackup')
  const prepared = await liveBackup.prepareWorkspaceBackup(await liveBackup.createWorkspaceBackup(f.data, { images: f.images, file: async () => undefined }), headerDecoder)
  await (await import('@/store/restoreCompleteWorkspace')).restoreCompleteWorkspace(async () => prepared)
  const restored = store.snapshotData().academics.classCenter.lectures[0].importedNotebook!
  expect(retained(restored)).toEqual(retained(f.n))
  const assets = (await import('./notebookAssetStore')).notebookAssetRepository()
  expect(await (await assets.read(restored.assetBindings![0].sha256))!.arrayBuffer()).toEqual(await pngBlob().arrayBuffer())
  expect(await assets.journals()).toEqual([])
  expect(retained(JSON.parse((await persistence.repository.read(key))!.raw).state.academics.classCenter.lectures[0].importedNotebook)).toEqual(retained(f.n))
  persistence.repository.close(); vi.resetModules()
  await (await import('@/store/workspaceBootstrap')).initializeDurableWorkspaces()
  const reloaded = await import('@/store/store')
  expect(reloaded.useStore.persist.hasHydrated()).toBe(true)
  expect(retained(reloaded.snapshotData().academics.classCenter.lectures[0].importedNotebook!)).toEqual(retained(f.n))
  const retainedAssets = (await import('./notebookAssetStore')).notebookAssetRepository()
  expect(await (await retainedAssets.read(restored.assetBindings![0].sha256))!.arrayBuffer()).toEqual(await pngBlob().arrayBuffer())
})

it.each([
  ['paragraph', 'malformed'], ['paragraph', 'unknown'],
  ['bullets', 'malformed'], ['bullets', 'unknown'],
] as const)('rejects %s %s detail at prepare/import and edit boundaries without changing any workspace or image bytes', async (type, failure) => {
  const f = await fixture()
  // Snapshot the whole workspace, not only current teaching content: original,
  // current, all history/raw copies, update baseline, notes, progress and bindings.
  const beforeWorkspaceBytes = JSON.stringify(f.data)
  const beforeNotebookBytes = JSON.stringify(f.n)
  async function imageSnapshot() {
    return {
      bytes: await Promise.all([...f.images.bytes].map(async ([hash, blob]) => ({ hash, type: blob.type, bytes: [...new Uint8Array(await blob.arrayBuffer())] }))),
      bindings: JSON.stringify([...f.images.bindings]),
      leases: JSON.stringify(await f.images.journals()),
    }
  }
  const beforeImages = await imageSnapshot()
  expect(beforeImages.bytes).toHaveLength(1)
  const invalid = structuredClone(f.n.current)
  const block = invalid.entries[0].sections.flatMap(s => s.blocks).find(b => b.id === `detail-${type}`)!
  if (failure === 'malformed') Object.assign(block, { more: { nested: 'Unsupported nested detail' } })
  else Object.assign(block, { moreDetails: 'Unknown detail field must not be discarded' })
  const imported = vi.fn()
  async function prepareAndImport() {
    // Same production ordering: strict prepare precedes image preparation and
    // the authorized commit/import. Rejection must never reach either write.
    const parsed = await prepareNotebook(JSON.stringify(invalid))
    const assets = await prepareNotebookAssets(parsed.package, [], { previousBindings: f.n.assetBindings, reader: f.images, decode: headerDecoder })
    await commitNotebookAssets({ prepared: assets, repository: f.images, lineageId: f.n.assetLineageId, retainedBindings: f.n.assetBindings, assertFresh() {}, commit() {
      imported()
      importNotebook(f.data.academics.classCenter, f.course, parsed)
      return { committed: true }
    } })
  }
  await expect(prepareAndImport()).rejects.toThrow(/more/)
  expect(imported).not.toHaveBeenCalled()
  expect(JSON.stringify(f.data)).toBe(beforeWorkspaceBytes)
  expect(JSON.stringify(f.lecture.importedNotebook)).toBe(beforeNotebookBytes)
  expect(await imageSnapshot()).toEqual(beforeImages)
  expect(() => saveNotebookEdits(f.lecture, invalid, 'This note must not replace saved notes')).toThrow(/more/)
  expect(JSON.stringify(f.data)).toBe(beforeWorkspaceBytes)
  expect(JSON.stringify(f.lecture.importedNotebook)).toBe(beforeNotebookBytes)
  expect(await imageSnapshot()).toEqual(beforeImages)
})

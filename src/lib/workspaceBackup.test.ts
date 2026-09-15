// @vitest-environment node
import { unzipSync, zipSync } from 'fflate'
import { expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { createWorkspaceBackup, prepareWorkspaceBackup, stageWorkspaceBackup } from './workspaceBackup'
import { prepareNotebook } from './academics/notebook/package'
import { prepareNotebookAssets } from './academics/notebook/visualAssets'
import { commitNotebookAssets } from './academics/notebook/notebookAssetStore'
import { importNotebook, saveNotebookEdits } from './academics/notebook/import'
import { visualFixture, headerDecoder, MemoryNotebookAssets, pngBlob } from './academics/notebook/visual.test-fixtures'

async function fixture() {
  const data = createPersonalInitialData(), images = new MemoryNotebookAssets(), pkg = visualFixture()
  const parsed = await prepareNotebook(JSON.stringify(pkg))
  const assets = await prepareNotebookAssets(pkg, [{ name: pkg.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  const course = { id: 'synthetic-class', code: pkg.course.code }
  await commitNotebookAssets({ prepared: assets, repository: images, assertFresh() {}, commit: () => { importNotebook(data.academics.classCenter, course, parsed, { confirmDestination: true }); return { committed: true } } })
  const entry = data.academics.classCenter.lectures[0], edited = structuredClone(entry.importedNotebook!.current)
  edited.entries[0].title = 'Saved edit'; saveNotebookEdits(entry, edited, 'Private study notes')
  entry.importedNotebook!.progress.example = { response: 'Practice answer', complete: true }
  data.notes.large = 'Large metadata '.repeat(400000)
  data.academics.classCenter.files.push({ id: 'source', sourceType: 'upload', owner: 'course', createdAt: 1, updatedAt: 1, order: 0, title: 'Synthetic original', type: 'reading', blobRef: 'idb://academics/source/one', linkedTopicIds: [] })
  const original = new Blob(['Synthetic original file'], { type: 'application/pdf' })
  return { data, images, original, readers: { images, file: async () => original } }
}
it('preserves large metadata, sources, history, progress, notes and all original bytes in a complete backup', async () => {
  const f = await fixture(), blob = await createWorkspaceBackup(f.data, f.readers)
  const prepared = await prepareWorkspaceBackup(blob, headerDecoder)
  expect(prepared.data).toEqual(f.data)
  expect(prepared.imageCount).toBe(1); expect(prepared.fileCount).toBe(1)
  const restoredImages = new MemoryNotebookAssets(), restoredFiles = new Map<string, Blob>()
  const stage = await stageWorkspaceBackup(prepared, () => {}, { images: restoredImages, file: async (ref, bytes) => { restoredFiles.set(ref, bytes); return ref } })
  const entry = stage.data.academics.classCenter.lectures[0].importedNotebook!
  expect(entry.current.entries[0].title).toBe('Saved edit'); expect(entry.history).toHaveLength(1)
  expect(entry.progress.example.response).toBe('Practice answer'); expect(entry.notes).toBe('Private study notes')
  expect(entry.assetLineageId).not.toBe(f.data.academics.classCenter.lectures[0].importedNotebook!.assetLineageId)
  const ref = stage.data.academics.classCenter.files[0].blobRef!
  expect(ref).not.toBe(f.data.academics.classCenter.files[0].blobRef)
  expect(await restoredFiles.get(ref)!.text()).toBe(await f.original.text())
  expect(new Uint8Array(await (await restoredImages.read(entry.assetBindings![0].sha256))!.arrayBuffer())).toEqual(new Uint8Array(await pngBlob().arrayBuffer()))
  expect(await restoredImages.journals()).toHaveLength(1)
  await stage.finish(); expect(await restoredImages.journals()).toEqual([])
})
it('refuses a complete backup when an original file is missing', async () => {
  const f = await fixture()
  await expect(createWorkspaceBackup(f.data, { images: f.images, file: async () => undefined })).rejects.toThrow('unavailable')
})
it('rejects corrupt bytes and unsupported ZIP paths before any restore is staged', async () => {
  const f = await fixture(), zip = await createWorkspaceBackup(f.data, f.readers)
  const members = unzipSync(new Uint8Array(await zip.arrayBuffer()))
  const image = Object.keys(members).find(key => key.startsWith('assets/'))!
  members[image][0] ^= 1
  await expect(prepareWorkspaceBackup(new Blob([zipSync(members).slice().buffer]), headerDecoder)).rejects.toThrow('integrity')
  await expect(prepareWorkspaceBackup(new Blob([zipSync({ '../outside': new Uint8Array([1]) }).slice().buffer]))).rejects.toThrow('unsupported paths')
})
it('keeps prior file identities and staged image recovery when metadata cannot commit', async () => {
  const f = await fixture(), before = JSON.stringify(f.data)
  const prepared = await prepareWorkspaceBackup(await createWorkspaceBackup(f.data, f.readers), headerDecoder)
  const images = new MemoryNotebookAssets(), files = new Map<string, Blob>([['idb://academics/source/one', f.original]])
  await stageWorkspaceBackup(prepared, () => {}, { images, file: async (ref, bytes) => { files.set(ref, bytes); return ref } })
  // No metadata acknowledgement: finish must not run. The earlier addresses and
  // source snapshot remain intact even though the new originals have staged.
  expect(JSON.stringify(f.data)).toBe(before)
  expect(files.get('idb://academics/source/one')).toBe(f.original)
  expect(await images.journals()).toHaveLength(1)
})

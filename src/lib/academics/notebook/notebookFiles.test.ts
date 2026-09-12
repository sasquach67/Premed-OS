// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import { collectNotebookFiles, collectNotebookFolder, matchNotebookImages } from './notebookFiles'
import { classifyNotebookJsonFiles, notebookBundleFromFolder, readNotebookImportZip } from './notebookImportFiles'
import { plainNotebookZip } from './notebookFiles.test-fixtures'
import { exportNotebookPackageBundle } from './notebookBundle'
import { getPreparedAssetBytes, prepareNotebookAssets, reviewNotebookImages } from './visualAssets'
import { changedPngBlob, headerDecoder, pngBlob, pngBytes, visualFixture } from './visual.test-fixtures'
import { readNotebookZip } from './notebookZip'
const encode = (s: string) => new TextEncoder().encode(s)
beforeAll(() => vi.stubGlobal('crypto', webcrypto))
function folderFile(path: string, content: Blob | string) { const file = new File([content], path.split('/').at(-1)!); Object.defineProperty(file, 'webkitRelativePath', { value: path }); return file }
it('recursively keeps exact paths and file bytes, classifies auxiliary JSON, and never merges multiple notebooks', async () => {
  const original = ' \n' + JSON.stringify(visualFixture()) + '\n', image = folderFile('Folder/deep/images/question.png', pngBlob())
  const collection = await classifyNotebookJsonFiles(collectNotebookFolder([image, folderFile('Folder/b.json', original), folderFile('Folder/a.json', original), folderFile('Folder/Checks.json', '{"pass":true}'), folderFile('Folder/Image mapping.json', '{}'), folderFile('Folder/readme.pdf', 'unused')]))
  expect(collection.json.map(f => f.name)).toEqual(['a.json', 'b.json']); expect(collection.auxiliary).toHaveLength(2); expect(collection.other).toHaveLength(1)
  expect(await collection.json[0].blob.text()).toBe(original); expect(collection.images[0]).toEqual({ name: 'deep/images/question.png', blob: image })
})
it('does not call metadata reports or a folder of raw materials a notebook', async () => {
  const files = collectNotebookFolder([folderFile('Folder/Checks.json', '{}'), folderFile('Folder/lecture.pdf', 'raw'), folderFile('Folder/question.png', pngBlob())])
  expect((await classifyNotebookJsonFiles(files)).json).toHaveLength(0)
})
it('matches only unambiguous exact filenames, preserving duplicate basenames for explicit choice', () => {
  const p = visualFixture(), asset = p.assets[0], a = { name: 'originals/' + asset.fileName, blob: pngBlob() }, b = { name: 'rendered/' + asset.fileName, blob: changedPngBlob() }
  expect(matchNotebookImages(p.assets, [a])[0].file).toBe(a)
  expect(matchNotebookImages(p.assets, [a, b])[0].file).toBeUndefined()
  expect(matchNotebookImages(p.assets, [a, b], new Map([[asset.id, b.blob]]))[0].file).toBe(b)
  expect(matchNotebookImages([{ ...asset, fileName: a.name }], [a, b])[0].file).toBe(a)
  expect(matchNotebookImages([asset, { ...asset, id: 'other' }], [a]).every(m => !m.file)).toBe(true)
  expect(matchNotebookImages(p.assets, [{ name: asset.fileName.toUpperCase(), blob: a.blob }])[0].file).toBeUndefined()
})
it('reports partial byte validation without creating a committable partial package', async () => {
  const p = visualFixture(), asset = p.assets[0]; p.assets.push({ ...asset, id: 'missing-image', fileName: 'missing.png' }, { ...asset, id: 'bad-image', fileName: 'bad.png' })
  const figure = p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'figure')!
  for (const id of ['missing-image', 'bad-image']) p.entries[0].sections[0].blocks.push({ ...figure, id: 'figure-' + id, assetId: id })
  p.visualReview.candidates.push(...['missing-image', 'bad-image'].map(id => ({ ...p.visualReview.candidates[0], id: 'candidate-' + id, assetId: id })))
  const result = await reviewNotebookImages(p, new Map([[asset.id, pngBlob()], ['bad-image', new Blob(['not PNG'])]]), { decode: headerDecoder })
  expect(result.ready).toEqual([asset.id]); expect(result.prepared).toBeNull(); expect([...result.problems.keys()]).toEqual(['missing-image', 'bad-image'])
})
it('retains immutable bindings and never substitutes an original for its rendered derivative', async () => {
  const p = visualFixture(), asset = p.assets[0], before = await prepareNotebookAssets(p, [{ name: asset.fileName, blob: pngBlob() }], { decode: headerDecoder })
  const result = await reviewNotebookImages(p, new Map([[asset.id, changedPngBlob()]]), { previousBindings: before.bindings, decode: headerDecoder })
  expect(result.prepared).toBeNull(); expect(result.problems.get(asset.id)).toContain('already bound')
  const blocked = await reviewNotebookImages(p, new Map(), { previousBindings: before.bindings, reader: { read: async () => pngBlob() }, blocked: new Map([[asset.id, 'Ambiguous']]), decode: headerDecoder })
  expect(blocked.prepared).toBeNull(); expect(blocked.problems.get(asset.id)).toBe('Ambiguous')
})
it.each([false, true])('accepts a generator-shaped plain ZIP, nested directories and untouched JSON (compressed=%s)', async compressed => {
  const p = visualFixture(), raw = JSON.stringify(p, null, 2) + '\n', zip = plainNotebookZip([['Notebook/', new Uint8Array()], ['Notebook/Title.json', encode(raw)], ['Notebook/images/' + p.assets[0].fileName, pngBytes()], ['Notebook/Checks.json', encode('{}')], ['Notebook/readme.txt', encode('Not imported')]], compressed)
  const input = await readNotebookImportZip(zip, headerDecoder); expect(input.kind).toBe('files'); if (input.kind !== 'files') throw Error('Expected files')
  const collection = await classifyNotebookJsonFiles(input.collection); expect(collection.json).toHaveLength(1); expect(await collection.json[0].blob.text()).toBe(raw)
  const selected = new Map(matchNotebookImages(p.assets, collection.images).map(m => [m.asset.id, m.file!.blob])), result = await reviewNotebookImages(p, selected, { decode: headerDecoder })
  expect(result.prepared).not.toBeNull(); expect([...getPreparedAssetBytes(result.prepared!).values()][0].size).toBe(pngBytes().length)
})
it('accepts protected app ZIPs and their extracted folders through the binding index', async () => {
  const p = visualFixture(), raw = JSON.stringify(p), images = await prepareNotebookAssets(p, [{ name: p.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder }), bytes = getPreparedAssetBytes(images)
  const zip = await exportNotebookPackageBundle(raw, images.bindings, { read: async hash => bytes.get(hash) }, headerDecoder)
  expect((await readNotebookImportZip(zip, headerDecoder)).kind).toBe('bundle')
  const members = await readNotebookZip(zip), folder = await classifyNotebookJsonFiles(collectNotebookFiles([...members].map(([name, data]) => ({ name: 'nested/' + name, blob: new Blob([data.slice().buffer]) }))))
  expect(folder.json.map(f => f.name)).toEqual(['nested/notebook.json'])
  const indexed = await notebookBundleFromFolder(folder, folder.json[0].name, headerDecoder)
  expect(indexed?.bundle.kind).toBe('package'); expect(indexed?.bundle.assets.bindings).toEqual(images.bindings)
  const missing = { ...folder, files: folder.files.filter(f => !f.name.includes('/assets/')) }
  await expect(notebookBundleFromFolder(missing, folder.json[0].name, headerDecoder)).rejects.toThrow('Missing package file')
})
it.each(['../escape.png', '/absolute.png', 'a/../escape.png', 'a\\evil.png', 'https://bad/image.png', 'a//x.png'])('rejects unsafe collection path %s before parsing files', async name => {
  expect(() => collectNotebookFiles([{ name, blob: pngBlob() }])).toThrow('Unsafe')
  await expect(readNotebookImportZip(plainNotebookZip([[name, pngBytes()]]))).rejects.toThrow('Unsafe')
})
it('rejects duplicate paths, symlinks, truncated ZIPs and excessive member counts', async () => {
  await expect(readNotebookImportZip(plainNotebookZip([['x.json', encode('{}')], ['x.json', encode('{}')]]))).rejects.toThrow('duplicate')
  const good = plainNotebookZip([['x.json', encode('{}')]]), linked = new Uint8Array(await good.arrayBuffer()), view = new DataView(linked.buffer)
  const central = view.getUint32(linked.length - 6, true); view.setUint32(central + 38, 0xa0000000, true)
  await expect(readNotebookImportZip(new Blob([linked]))).rejects.toThrow('linked')
  await expect(readNotebookImportZip(good.slice(0, good.size - 4))).rejects.toThrow('end record')
  await expect(readNotebookImportZip(plainNotebookZip(Array.from({ length: 141 }, (_, i) => [i + '.txt', encode('x')])))).rejects.toThrow('member count')
})

it('checks per-member and combined bounds before decoding collection archives', async () => {
  const zip = plainNotebookZip([['oversized.png', new Uint8Array(8 * 1024 * 1024 + 1)]])
  await expect(readNotebookImportZip(zip)).rejects.toThrow('declared decoded bytes')
  expect(() => collectNotebookFiles([{ name: 'same.png', blob: pngBlob() }, { name: 'same.png', blob: pngBlob() }])).toThrow('Duplicate file path')
})

// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { MemoryDirectory } from '../materialFolder/testing/memoryFilesystem'
import { getFile } from '../materialFolder/filesystem'
import { saveNotebookBundleFolder } from './notebookFolderExport'
import { writeNotebookZip } from './notebookZip'

const hash = 'a'.repeat(64), image = Uint8Array.from([1, 2, 3, 4])
const bundle = () => writeNotebookZip(new Map([
  ['notebook.json', new TextEncoder().encode('{"saved":"baseline"}')],
  ['bindings.json', new TextEncoder().encode('{"bindings":[]}')],
  [`assets/${hash}.png`, image],
]))
it('saves every verified member with exact bytes, and preserves existing destination folders and files', async () => {
  const root = new MemoryDirectory()
  root.dir('Notebook').file('private.txt', 'keep me'); root.file('Notebook (2)', 'also keep me')
  expect(await saveNotebookBundleFolder(bundle(), root, 'Notebook')).toBe('Notebook (3)')
  expect(await (await getFile(root, 'Notebook/private.txt')).text()).toBe('keep me')
  expect(await (await getFile(root, 'Notebook (2)')).text()).toBe('also keep me')
  expect(await (await getFile(root, 'Notebook (3)/notebook.json')).text()).toBe('{"saved":"baseline"}')
  expect(new Uint8Array(await (await getFile(root, `Notebook (3)/assets/${hash}.png`)).arrayBuffer())).toEqual(image)
  expect(await (await getFile(root, 'Notebook (3)/bindings.json')).text()).toBe('{"bindings":[]}')
})
it('refuses invalid archives and a stale fence before creating a folder', async () => {
  const root = new MemoryDirectory()
  await expect(saveNotebookBundleFolder(new Blob(['not a bundle']), root, 'Notebook')).rejects.toThrow()
  await expect(saveNotebookBundleFolder(bundle(), root, 'Notebook', () => { throw new Error('Changed') })).rejects.toThrow('Changed')
  expect(root.children.size).toBe(0)
})
it('reports an incomplete folder on write failure, never success or deletion', async () => {
  const root = new MemoryDirectory(), get = root.getDirectoryHandle.bind(root)
  root.getDirectoryHandle = async (name, options) => {
    const dir = await get(name, options)
    vi.spyOn(dir, 'getFileHandle').mockImplementation(async (filename, opts) => {
      const file = await MemoryDirectory.prototype.getFileHandle.call(dir, filename, opts)
      file.failClose = true; return file
    })
    return dir
  }
  await expect(saveNotebookBundleFolder(bundle(), root, 'Notebook')).rejects.toThrow('incomplete')
  expect(root.children.has('Notebook')).toBe(true)
})

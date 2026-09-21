// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { MemoryDirectory } from './testing/memoryFilesystem'
import { cancelMove, createFolder, finishMove, getFile, moveEntries, operations, scanFolder, sha256 } from './filesystem'
import { detectCategory, immediateItems, packageRoot, validatePath } from './model'

const fence = () => {}
describe('connected folder pilot', () => {
  it('lists mixed materials without reading bytes and excludes working folders', async () => {
    const root = new MemoryDirectory()
    const pdf = root.file('Lecture slides.pdf')
    const bytes = vi.spyOn(pdf.file, 'arrayBuffer')
    root.file('Homework 2.docx'); root.file('Lesson outline.pdf')
    root.dir('tmp').file('huge-cache.bin'); root.dir('Archive').file('old.pdf')
    const items = await scanFolder(root)
    expect(items).toHaveLength(3); expect(bytes).not.toHaveBeenCalled()
    expect(items.map(i => i.category)).toEqual(['Slides', 'Homework', 'Outline'])
  })
  it('retains user classification and missing originals instead of deleting catalog records', async () => {
    const root = new MemoryDirectory(); root.file('scan.pdf')
    const old = await scanFolder(root); old[0].category = 'My custom type'; old[0].categoryConfirmed = true
    expect((await scanFolder(root, old))[0].category).toBe('My custom type')
    root.children.clear()
    expect((await scanFolder(root, old))[0]).toMatchObject({ id: old[0].id, missing: true })
  })
  it('renames a file with exact byte verification and a durable recovery record', async () => {
    const root = new MemoryDirectory(); root.file('Transcript.txt', 'actual transcript')
    const op = await moveEntries(root, [{ from: 'Transcript.txt', to: 'Lecture captions.txt' }], 'move', fence)
    expect(op.phase).toBe('done'); expect(root.children.has('Transcript.txt')).toBe(false)
    expect(await (await getFile(root, 'Lecture captions.txt')).text()).toBe('actual transcript')
    expect((await operations(root))[0].phase).toBe('done')
  })
  it('moves a notebook as a whole with internal references unchanged', async () => {
    const root = new MemoryDirectory(), notebook = root.dir('Notebook')
    notebook.file('notebook.json', '{"image":"assets/image.png"}')
    notebook.dir('assets').file('image.png', 'image content')
    const items = await scanFolder(root)
    expect(packageRoot(items, 'Notebook/assets/image.png')).toBe('Notebook')
    await moveEntries(root, [{ from: 'Notebook', to: 'Lesson 1/Notebook' }], 'move', fence)
    expect(await (await getFile(root, 'Lesson 1/Notebook/notebook.json')).text()).toBe('{"image":"assets/image.png"}')
    expect(await (await getFile(root, 'Lesson 1/Notebook/assets/image.png')).text()).toBe('image content')
  })
  it('refuses a collision without touching either file', async () => {
    const root = new MemoryDirectory(); root.file('a.txt', 'a'); root.file('b.txt', 'b')
    await expect(moveEntries(root, [{ from: 'a.txt', to: 'b.txt' }], 'move', fence)).rejects.toThrow('already exists')
    expect(await (await getFile(root, 'a.txt')).text()).toBe('a')
    expect(await (await getFile(root, 'b.txt')).text()).toBe('b')
  })
  it('refuses a case-only rename on a case-insensitive filesystem', async () => {
    const root = new MemoryDirectory(); root.file('Transcript.txt', 'keep me')
    const get = root.getFileHandle.bind(root)
    root.getFileHandle = (name, options) => get(name.toLowerCase() === 'transcript.txt' ? 'Transcript.txt' : name, options)
    await expect(moveEntries(root, [{ from: 'Transcript.txt', to: 'transcript.txt' }], 'move', fence)).rejects.toThrow('already exists')
    expect(await (await getFile(root, 'Transcript.txt')).text()).toBe('keep me')
  })
  it('preserves originals on an interrupted copy and can cancel without deleting partial copies', async () => {
    const root = new MemoryDirectory(); root.file('a.txt', 'original')
    const originalGet = root.getFileHandle.bind(root)
    root.getFileHandle = async (name, options) => { const f = await originalGet(name, options); if (name === 'b.txt') f.failClose = true; return f }
    await expect(moveEntries(root, [{ from: 'a.txt', to: 'b.txt' }], 'move', fence)).rejects.toThrow('Disk full')
    expect(await (await getFile(root, 'a.txt')).text()).toBe('original')
    const [op] = await operations(root); expect(op.phase).toBe('prepared')
    await cancelMove(root, op, fence)
    expect((await operations(root))[0].phase).toBe('cancelled')
    expect(root.children.has('b.txt')).toBe(true)
  })
  it('recovers after all copies were checked but the browser stopped before removal', async () => {
    const root = new MemoryDirectory(); root.file('a.txt', 'original')
    const remove = root.removeEntry.bind(root); let first = true
    root.removeEntry = async name => { if (name === 'a.txt' && first) { first = false; throw new Error('Interrupted') }; await remove(name) }
    await expect(moveEntries(root, [{ from: 'a.txt', to: 'b.txt' }], 'move', fence)).rejects.toThrow('Interrupted')
    const [op] = await operations(root); expect(op.phase).toBe('copied')
    await finishMove(root, op, fence)
    expect(root.children.has('a.txt')).toBe(false)
    expect(await (await getFile(root, 'b.txt')).text()).toBe('original')
  })
  it('will not remove a source that changed while copies were written', async () => {
    const root = new MemoryDirectory(); const a = root.file('a.txt', 'original')
    const originalGet = root.getFileHandle.bind(root)
    root.getFileHandle = async (name, options) => { const f = await originalGet(name, options); if (name === 'b.txt') f.onWrite = () => { a.file = new File(['new edit'], 'a.txt') }; return f }
    await expect(moveEntries(root, [{ from: 'a.txt', to: 'b.txt' }], 'move', fence)).rejects.toThrow('source folder changed')
    expect(await (await getFile(root, 'a.txt')).text()).toBe('new edit')
  })
  it('moves to recoverable trash and restores bytes', async () => {
    const root = new MemoryDirectory(); root.file('a.txt', 'keep me')
    const path = '.premedos/Trash/one/a.txt'
    await moveEntries(root, [{ from: 'a.txt', to: path }], 'trash', fence)
    expect((await scanFolder(root)).length).toBe(0)
    await moveEntries(root, [{ from: path, to: 'a.txt' }], 'restore', fence)
    expect(await (await getFile(root, 'a.txt')).text()).toBe('keep me')
  })
  it('stops writes after an ownership fence changes', async () => {
    const root = new MemoryDirectory(); root.file('a.txt')
    await expect(moveEntries(root, [{ from: 'a.txt', to: 'b.txt' }], 'move', () => { throw new Error('Account changed') })).rejects.toThrow('Account changed')
    expect(root.children.has('a.txt')).toBe(true); expect(root.children.has('b.txt')).toBe(false)
  })
  it('rejects traversal, internal destinations for regular moves, and recursive moves', async () => {
    for (const path of ['../a', '/root/a', 'a/../b', '.premedos/operations/a.json']) expect(() => validatePath(path)).toThrow()
    const root = new MemoryDirectory(); root.dir('a')
    await expect(moveEntries(root, [{ from: 'a', to: 'a/child' }], 'move', fence)).rejects.toThrow('different destination')
    await expect(createFolder(root, '../outside', fence)).rejects.toThrow()
  })
  it('rejects large-file operations before creating a destination', async () => {
    const huge = new Blob([]); Object.defineProperty(huge, 'size', { value: 51 * 1024 ** 2 })
    await expect(sha256(huge)).rejects.toThrow('50 MiB')
  })
  it('shows natural lesson order and accepts unknown material types', async () => {
    const root = new MemoryDirectory(); root.dir('Lesson 10'); root.dir('Lesson 2'); root.dir('Lesson 1')
    expect(immediateItems(await scanFolder(root), '').map(i => i.path)).toEqual(['Lesson 1', 'Lesson 2', 'Lesson 10'])
    expect(detectCategory('unusual.format')).toBe('Other')
  })
})

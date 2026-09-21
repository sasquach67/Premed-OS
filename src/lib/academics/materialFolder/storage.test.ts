// @vitest-environment node
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryDirectory } from './testing/memoryFilesystem'
import { scanFolder } from './filesystem'
import { CACHE_BYTES, PILOT_CLOUD_BYTES, type FolderLibrary } from './model'

const mock = vi.hoisted(() => ({ exists: vi.fn(), upload: vi.fn(), download: vi.fn(), getSession: vi.fn(), owner: 'owner-a' }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: mock.getSession }, storage: { from: () => ({ exists: mock.exists, upload: mock.upload, download: mock.download }) } } }))
vi.mock('@/lib/demoMode', () => ({ activeWorkspaceOwner: () => ({ kind: 'account', userId: mock.owner }), isDemoMode: () => false, workspaceScopedKey: (s: string) => `${s}:${mock.owner}` }))
import { cachePreview, cacheUsage, clearPreviewCache, cloudObjectPath, downloadFolderFile, readCachedPreview, syncFolderFile } from './storage'

beforeEach(async () => {
  mock.owner = 'owner-a'; vi.clearAllMocks()
  mock.getSession.mockResolvedValue({ data: { session: { user: { id: 'owner-a' } } } })
  mock.exists.mockResolvedValue({ data: false, error: { status: 404 } })
  mock.upload.mockResolvedValue({ error: null })
  await clearPreviewCache()
})
async function fixture() {
  const root = new MemoryDirectory(); root.file('Transcript.txt', 'real transcript')
  const items = await scanFolder(root)
  const library: FolderLibrary = { id: 'library', label: root.name, writerDevice: 'device', items, updatedAt: 1, cloudObjects: {} }
  return { root, items, library }
}
describe('folder account copies and bounded previews', () => {
  it('does not upload identical content twice, even under a different file name', async () => {
    const { root, items, library } = await fixture()
    const first = await syncFolderFile(root, items[0], library, () => {})
    mock.exists.mockResolvedValue({ data: true, error: null })
    root.file('Captions.txt', 'real transcript')
    const renamed = (await scanFolder(root)).find(i => i.path === 'Captions.txt')!
    const second = await syncFolderFile(root, renamed, library, () => {})
    expect(first.hash).toBe(second.hash); expect(mock.upload).toHaveBeenCalledTimes(1)
    expect(mock.upload.mock.calls[0][2]).toMatchObject({ upsert: false })
  })
  it('does not upload beyond the cumulative pilot allowance', async () => {
    const { root, items, library } = await fixture()
    library.cloudObjects.old = PILOT_CLOUD_BYTES
    await expect(syncFolderFile(root, items[0], library, () => {})).rejects.toThrow('64 MiB')
    expect(mock.upload).not.toHaveBeenCalled(); expect(root.children.has('Transcript.txt')).toBe(true)
  })
  it('requires the upload reservation to be durable before sending file bytes', async () => {
    const { root, items, library } = await fixture()
    await expect(syncFolderFile(root, items[0], library, () => {}, async () => { throw new Error('Catalog could not save') })).rejects.toThrow('Catalog could not save')
    expect(mock.upload).not.toHaveBeenCalled()
  })
  it('does not report an unsuccessful upload as saved', async () => {
    const { root, items, library } = await fixture()
    mock.upload.mockResolvedValue({ error: { message: 'Storage full' } })
    await expect(syncFolderFile(root, items[0], library, () => {})).rejects.toThrow('not confirmed uploaded')
    expect(items[0].cloudHash).toBeUndefined()
  })
  it('rejects ownership changes before storage access', async () => {
    const { root, items, library } = await fixture()
    mock.owner = 'owner-b'
    await expect(syncFolderFile(root, items[0], library, () => {})).rejects.toThrow('sign-in changed')
    expect(mock.upload).not.toHaveBeenCalled()
  })
  it('stops after an account changes during the existence check', async () => {
    const { root, items, library } = await fixture(); let active = true
    mock.exists.mockImplementation(async () => { active = false; return { data: false, error: null } })
    await expect(syncFolderFile(root, items[0], library, () => { if (!active) throw new Error('Account changed') })).rejects.toThrow('Account changed')
    expect(mock.upload).not.toHaveBeenCalled()
  })
  it('bounds disposable previews without retaining oversized downloads', async () => {
    const half = new Blob([new Uint8Array(CACHE_BYTES / 2)])
    await cachePreview('a', half); await cachePreview('b', half)
    expect(await cacheUsage()).toBe(CACHE_BYTES)
    await cachePreview('c', half)
    expect(await cacheUsage()).toBe(CACHE_BYTES)
    expect(await readCachedPreview('a')).toBeUndefined()
    expect(await readCachedPreview('c')).toBeInstanceOf(Blob)
    await cachePreview('too-large', new Blob([new Uint8Array(CACHE_BYTES + 1)]))
    expect(await readCachedPreview('too-large')).toBeUndefined()
    expect(await cacheUsage()).toBeLessThanOrEqual(CACHE_BYTES)
  })
  it('never returns a wrong-account preview or corrupt cloud revision', async () => {
    const { root, items, library } = await fixture()
    const { hash } = await syncFolderFile(root, items[0], library, () => {})
    await cachePreview(cloudObjectPath('someone-else', hash), new Blob(['private']))
    mock.download.mockResolvedValue({ data: new Blob(['wrong bytes']), error: null })
    await expect(downloadFolderFile(hash, () => {})).rejects.toThrow('did not match')
    expect(mock.download).toHaveBeenCalledWith(cloudObjectPath('owner-a', hash))
  })
})

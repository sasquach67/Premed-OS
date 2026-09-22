import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { FolderMaterials } from './FolderMaterials'
import { scanFolder } from '@/lib/academics/materialFolder/filesystem'
import { MemoryDirectory } from '@/lib/academics/materialFolder/testing/memoryFilesystem'
import type { FolderLibrary } from '@/lib/academics/materialFolder/model'
const mocks = vi.hoisted(() => ({ cloud: { user: null as null | { id: string }, accountReady: false, status: 'idle', conflict: undefined, error: '', pullNow: vi.fn() }, library: undefined as FolderLibrary | undefined, download: vi.fn(), sync: vi.fn(), loadHandle: vi.fn(), fence: vi.fn(), lock: vi.fn(), save: vi.fn() }))
vi.mock('@/store/AccountCloudContext', () => ({ useAccountCloud: () => mocks.cloud }))
vi.mock('@/store/store', () => ({ useStore: (select: (s: unknown) => unknown) => select({ academics: { classCenter: { workspaces: [{ courseId: 'test', materialFolder: mocks.library }] } } }) }))
vi.mock('@/lib/academics/materialFolder/controller', () => ({ captureFolderFence: mocks.fence, readFolderLibrary: () => mocks.library, saveFolderLibrary: mocks.save, withFolderLock: mocks.lock }))
vi.mock('@/lib/academics/materialFolder/storage', () => ({ deviceId: () => 'other-device', loadFolderHandle: mocks.loadHandle, saveFolderHandle: vi.fn(), cacheUsage: async () => 0, clearPreviewCache: vi.fn(), cloudBudgetUsed: () => 0, downloadFolderFile: mocks.download, syncFolderFile: mocks.sync }))
vi.mock('./FolderPdfPreview', () => ({ FolderPdfPreview: ({ name }: { name: string }) => <div data-testid="pdf-preview">{name}</div> }))
let root: Root, container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  mocks.cloud = { user: null, accountReady: false, status: 'idle', conflict: undefined, error: '', pullNow: vi.fn() }
  mocks.download.mockReset(); mocks.sync.mockReset(); mocks.loadHandle.mockReset(); mocks.lock.mockReset(); mocks.save.mockReset()
  mocks.fence.mockReset().mockImplementation((write = false) => {
    const check = () => { if (write && mocks.cloud.user && !mocks.cloud.accountReady) throw new Error('Account sync has not finished checking. Open Settings to check its progress or retry, then connect the folder again. Originals have been kept.') }
    check(); return check
  })
  mocks.library = { id: 'library', label: 'Lesson 1', writerDevice: 'source-device', updatedAt: 0, cloudObjects: {}, items: Array.from({ length: 120 }, (_, n) => ({ id: String(n), path: `Reading ${n + 1}.pdf`, kind: 'file', category: 'Reading', size: 1, modified: 0, cloudHash: 'a'.repeat(64) })) }
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function render() { await act(async () => root.render(<MemoryRouter><FolderMaterials courseId="test" courseLabel="BIOL 103" onBack={() => {}} /></MemoryRouter>)) }
function button(name: string) { return [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === name)! }
it('renders only 50 rows at once and never downloads file contents while browsing', async () => {
  await render()
  expect(container.querySelectorAll('.mf-row')).toHaveLength(50)
  expect(mocks.download).not.toHaveBeenCalled(); expect(mocks.sync).not.toHaveBeenCalled()
  await act(async () => button('Next').click())
  expect(container.textContent).toContain('Reading 51.pdf'); expect(container.textContent).not.toContain('Reading 1.pdf')
  expect(mocks.download).not.toHaveBeenCalled()
  expect(button('Rename')).toBeUndefined()
  expect(button('New folder').disabled).toBe(true)
})
it('downloads only the opened account file and releases its preview URL when closed', async () => {
  mocks.download.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))
  await render(); await act(async () => button('Reading 1.pdf').click())
  expect(mocks.download).toHaveBeenCalledTimes(1)
  expect(document.querySelector('[data-testid="pdf-preview"]')).not.toBeNull()
  await act(async () => button('Close').click())
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  expect(document.querySelector('[data-testid="pdf-preview"]')).toBeNull()
})
it('shows an actionable fallback when linking is unsupported without hiding legacy materials', async () => {
  mocks.library = undefined; await render()
  await act(async () => button('Connect trial folder').click())
  expect(container.textContent).toContain('desktop Chrome or Edge')
  expect(button('Previously added materials')).toBeTruthy()
})

it('waits visibly for shared account readiness and enables folder connection when it finishes', async () => {
  mocks.library = undefined
  mocks.cloud = { user: { id: 'account' }, accountReady: false, status: 'syncing', conflict: undefined, error: '', pullNow: vi.fn() }
  await render()
  expect(button('Checking account sync…').disabled).toBe(true)
  expect(container.querySelector('[role="status"]')?.textContent).toContain('available automatically')
  mocks.cloud = { ...mocks.cloud, accountReady: true, status: 'synced' }
  await render()
  expect(button('Connect trial folder').disabled).toBe(false)
  expect(container.querySelector('[role="status"]')).toBeNull()
})

it('defers a connected folder refresh until account checking finishes, including window focus', async () => {
  mocks.library!.writerDevice = 'other-device'
  mocks.loadHandle.mockResolvedValue({ queryPermission: async () => 'granted', getDirectoryHandle: async () => { throw new DOMException('', 'NotFoundError') } })
  mocks.cloud = { user: { id: 'account' }, accountReady: false, status: 'syncing', conflict: undefined, error: '', pullNow: vi.fn() }
  await render()
  await act(async () => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')) })
  expect(container.querySelector('[role="alert"]')).toBeNull()
  expect(mocks.fence.mock.calls.filter(([write]) => write)).toHaveLength(0)
  expect(button('Refresh').disabled).toBe(true)
  expect(button('Save account copies').disabled).toBe(true)
  expect(button('New folder').disabled).toBe(true)
  mocks.cloud = { ...mocks.cloud, accountReady: true, status: 'synced' }
  await render()
  expect(button('Refresh').disabled).toBe(false)
  expect(button('Save account copies').disabled).toBe(false)
  expect(mocks.lock).toHaveBeenCalledTimes(1)
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

it('shows the actual account failure and retries checking without touching folder files', async () => {
  mocks.library!.writerDevice = 'other-device'
  mocks.loadHandle.mockResolvedValue({ queryPermission: async () => 'granted' })
  mocks.cloud = { user: { id: 'account' }, accountReady: false, status: 'error', conflict: undefined, error: 'The cloud request timed out.', pullNow: vi.fn() }
  await render()
  expect(container.textContent).toContain('The cloud request timed out.')
  expect(button('Save account copies').disabled).toBe(true)
  await act(async () => button('Retry account check').click())
  expect(mocks.cloud.pullNow).toHaveBeenCalledTimes(1)
  expect(mocks.lock).not.toHaveBeenCalled()
  expect(mocks.sync).not.toHaveBeenCalled()
})

it('releases a stalled refresh and keeps the saved catalog without accepting late scan results', async () => {
  vi.useFakeTimers()
  const disk = new MemoryDirectory('Trial'), course = disk.dir('BIOL 103')
  const delayed = course.file('Reading.pdf')
  let release!: (file: File) => void
  vi.spyOn(delayed, 'getFile').mockImplementation(() => new Promise(resolve => { release = resolve }))
  mocks.library!.writerDevice = 'other-device'
  mocks.library!.items = [{ id: 'course', path: 'BIOL 103', kind: 'directory', category: 'Other', size: 0, modified: 0 }]
  mocks.loadHandle.mockResolvedValue(disk)
  mocks.lock.mockImplementation(async (_id, work) => work())
  await render()
  expect(container.textContent).toContain('BIOL 103/Reading.pdf')
  expect(button('BIOL 103').disabled).toBe(false)
  await act(async () => { await vi.advanceTimersByTimeAsync(30_001) })
  expect(button('Refresh').disabled).toBe(false)
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Folder scan stopped')
  expect(mocks.save).not.toHaveBeenCalled()
  await act(async () => release(delayed.file))
  expect(mocks.save).not.toHaveBeenCalled()
  expect(mocks.library!.items).toHaveLength(1)
})

it('does not save an unchanged file list merely because cloud JSON keys or enumeration order differ', async () => {
  const disk = new MemoryDirectory('Trial')
  disk.file('Slides.pdf'); disk.file('Notes.txt')
  const items = await scanFolder(disk)
  mocks.library!.writerDevice = 'other-device'
  mocks.library!.items = items.reverse().map(item => Object.fromEntries(Object.entries(item).reverse()) as typeof item)
  mocks.loadHandle.mockResolvedValue(disk)
  mocks.lock.mockImplementation(async (_id, work) => work())
  await render()
  expect(button('Refresh').disabled).toBe(false)
  expect(mocks.save).not.toHaveBeenCalled()
  await act(async () => { window.dispatchEvent(new Event('focus')) })
  expect(mocks.save).not.toHaveBeenCalled()
})

it('can stop a read-only scan, browse saved folders, and retry without a late catalog save', async () => {
  const disk = new MemoryDirectory('Trial'), course = disk.dir('BIOL 103')
  const file = course.file('Slides.pdf')
  let release!: (file: File) => void
  const read = vi.spyOn(file, 'getFile').mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
  mocks.library!.writerDevice = 'other-device'
  mocks.library!.items = [{ id: 'course', path: 'BIOL 103', kind: 'directory', category: 'Other', size: 0, modified: 0 }]
  mocks.loadHandle.mockResolvedValue(disk)
  mocks.lock.mockImplementation(async (_id, work) => work())
  await render()
  await act(async () => button('BIOL 103').click())
  expect(button('Up one folder')).toBeTruthy()
  await act(async () => button('Stop scan').click())
  expect(button('Refresh').disabled).toBe(false)
  expect(mocks.save).not.toHaveBeenCalled()
  await act(async () => release(file.file))
  expect(mocks.save).not.toHaveBeenCalled()
  read.mockRestore()
  await act(async () => button('Refresh').click())
  expect(mocks.save).toHaveBeenCalledTimes(1)
})

it('only permits stopping read-only scanning, not an in-flight catalog commit', async () => {
  const disk = new MemoryDirectory('Trial'); disk.file('New file.txt')
  mocks.library!.writerDevice = 'other-device'; mocks.library!.items = []
  mocks.loadHandle.mockResolvedValue(disk)
  mocks.lock.mockImplementation(async (_id, work) => work())
  let finish!: () => void
  mocks.save.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
  await render()
  expect(container.textContent).toContain('Saving file list…')
  expect(button('Stop scan')).toBeUndefined()
  expect(button('Refresh').disabled).toBe(true)
  await act(async () => finish())
  expect(button('Refresh').disabled).toBe(false)
})

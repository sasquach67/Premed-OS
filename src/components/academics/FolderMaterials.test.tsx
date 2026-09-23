import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { FolderMaterials } from './FolderMaterials'
import { scanFolder } from '@/lib/academics/materialFolder/filesystem'
import * as folderFilesystem from '@/lib/academics/materialFolder/filesystem'
import { MemoryDirectory } from '@/lib/academics/materialFolder/testing/memoryFilesystem'
import type { FolderLibrary } from '@/lib/academics/materialFolder/model'
const mocks = vi.hoisted(() => ({ cloud: { user: null as null | { id: string }, accountReady: false, status: 'idle', conflict: undefined, error: '', pullNow: vi.fn() }, library: undefined as FolderLibrary | undefined, download: vi.fn(), sync: vi.fn(), loadHandle: vi.fn(), fence: vi.fn(), lock: vi.fn(), save: vi.fn(), back: vi.fn() }))
vi.mock('@/store/AccountCloudContext', () => ({ useAccountCloud: () => mocks.cloud }))
vi.mock('@/store/store', () => ({ useStore: (select: (s: unknown) => unknown) => select({ academics: { classCenter: { workspaces: [{ courseId: 'test', materialFolder: mocks.library }] } } }) }))
vi.mock('@/lib/academics/materialFolder/controller', () => ({ captureFolderFence: mocks.fence, readFolderLibrary: () => mocks.library, saveFolderLibrary: mocks.save, withFolderLock: mocks.lock }))
vi.mock('@/lib/academics/materialFolder/storage', () => ({ deviceId: () => 'other-device', loadFolderHandle: mocks.loadHandle, saveFolderHandle: vi.fn(), cacheUsage: async () => 0, clearPreviewCache: vi.fn(), cloudBudgetUsed: () => 0, downloadFolderFile: mocks.download, syncFolderFile: mocks.sync }))
vi.mock('./FolderPdfPreview', () => ({ FolderPdfPreview: ({ name }: { name: string }) => <div data-testid="pdf-preview">{name}</div> }))
let root: Root, container: HTMLDivElement
// Radix Select scrolls the focused option; JSDOM does not implement scrolling.
const nativeScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
beforeAll(() => {
  if (!nativeScrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: () => {} })
})
afterAll(() => { if (!nativeScrollIntoView) Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView') })
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  mocks.cloud = { user: null, accountReady: false, status: 'idle', conflict: undefined, error: '', pullNow: vi.fn() }
  mocks.download.mockReset(); mocks.sync.mockReset(); mocks.loadHandle.mockReset(); mocks.lock.mockReset(); mocks.save.mockReset(); mocks.back.mockReset()
  mocks.fence.mockReset().mockImplementation((write = false) => {
    const check = () => { if (write && mocks.cloud.user && !mocks.cloud.accountReady) throw new Error('Account sync has not finished checking. Open Settings to check its progress or retry, then connect the folder again. Originals have been kept.') }
    check(); return check
  })
  mocks.library = { id: 'library', label: 'Lesson 1', writerDevice: 'source-device', updatedAt: 0, cloudObjects: {}, items: Array.from({ length: 120 }, (_, n) => ({ id: String(n), path: `Reading ${n + 1}.pdf`, kind: 'file', category: 'Reading', size: 1, modified: 0, cloudHash: 'a'.repeat(64) })) }
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function render() { await act(async () => root.render(<MemoryRouter><FolderMaterials courseId="test" courseLabel="BIOL 103" onBack={mocks.back} /></MemoryRouter>)) }
function button(name: string) { return [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === name)! }
function labeledButton(name: string) { return document.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)! }
function menuItem(name: string) { return [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent?.trim() === name)! }
async function openMenu(trigger: HTMLButtonElement) {
  await act(async () => { trigger.focus(); trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
}
async function connectedFiles() {
  const disk = new MemoryDirectory('Trial')
  disk.file('First.pdf'); disk.file('Second.pdf')
  mocks.library!.writerDevice = 'other-device'; mocks.library!.items = await scanFolder(disk)
  mocks.loadHandle.mockResolvedValue(disk)
  mocks.lock.mockImplementation(async (_id, work) => work())
  return disk
}
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
  expect(menuItem('Previously added materials')).toBeUndefined()
  await openMenu(button('More options'))
  expect(menuItem('Previously added materials')).toBeTruthy()
  await act(async () => menuItem('Previously added materials').click())
  expect(mocks.back).toHaveBeenCalledTimes(1)
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


it('opens a row action menu and targets that file without replacing the existing selection', async () => {
  await connectedFiles(); await render()
  const first = container.querySelector<HTMLInputElement>('input[aria-label="Select First.pdf"]')!
  const second = container.querySelector<HTMLInputElement>('input[aria-label="Select Second.pdf"]')!
  await act(async () => first.click())
  await openMenu(labeledButton('Actions for Second.pdf'))
  expect(menuItem('Rename')).toBeTruthy()
  await act(async () => menuItem('Rename').click())
  const nameInput = document.querySelector<HTMLInputElement>('input[aria-label="Name"]')!
  expect(nameInput.value).toBe('Second.pdf')
  expect(document.activeElement).toBe(nameInput)
  expect(first.checked).toBe(true)
  expect(second.checked).toBe(false)
  expect(container.textContent).toContain('1 selected')
  expect(mocks.save).not.toHaveBeenCalled()
})

it('replaces normal file controls with selection actions and restores them when cleared', async () => {
  await connectedFiles(); await render()
  expect(container.querySelector('input[placeholder="Search files…"]')).not.toBeNull()
  expect(button('New folder')).toBeTruthy()
  await act(async () => container.querySelector<HTMLInputElement>('input[aria-label="Select First.pdf"]')!.click())
  expect(container.querySelector('input[placeholder="Search files…"]')).toBeNull()
  expect(button('New folder')).toBeUndefined()
  for (const name of ['Rename', 'Move', 'Delete', 'Set type']) expect(button(name)).toBeTruthy()
  await act(async () => labeledButton('Clear selection').click())
  expect(container.querySelector('input[placeholder="Search files…"]')).not.toBeNull()
  expect(button('New folder')).toBeTruthy()
  expect(button('Rename')).toBeUndefined()
  expect(container.querySelector<HTMLInputElement>('input[aria-label="Select First.pdf"]')!.checked).toBe(false)
})

it('keeps storage details inside its popover until requested', async () => {
  await render()
  expect(document.body.textContent).not.toContain('Upload budget')
  expect(document.body.textContent).not.toContain('Preview cache')
  await act(async () => button('Storage').click())
  expect(document.body.textContent).toContain('Upload budget')
  expect(document.body.textContent).toContain('Preview cache')
  expect(button('Clear preview cache')).toBeTruthy()
})

it('opens Trash and legacy materials through More options', async () => {
  await connectedFiles(); await render()
  expect(menuItem('Trash')).toBeUndefined()
  await openMenu(button('More options'))
  await act(async () => menuItem('Trash').click())
  expect(container.textContent).toContain('Trash')
  expect(container.querySelector('.mf-row')).toBeNull()
  await act(async () => button('Back to files').click())
  expect(container.querySelectorAll('.mf-row')).toHaveLength(2)
  await openMenu(button('More options'))
  await act(async () => menuItem('Previously added materials').click())
  expect(mocks.back).toHaveBeenCalledTimes(1)
  expect(mocks.save).not.toHaveBeenCalled()
})


async function chooseOption(trigger: HTMLButtonElement, text: string) {
  await openMenu(trigger)
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(item => item.textContent?.trim() === text)!
  expect(option).toBeTruthy()
  await act(async () => { option.focus(); option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
}

it('filters with the themed type picker and restores every row with All types', async () => {
  mocks.library!.items = [
    { id: 'slides', path: 'Lecture slides.pdf', kind: 'file', category: 'Slides', size: 1, modified: 0 },
    { id: 'notes', path: 'Class notes.txt', kind: 'file', category: 'Notes', size: 1, modified: 0 },
  ]
  await render()
  expect(container.querySelectorAll('.mf-row')).toHaveLength(2)
  await chooseOption(labeledButton('Filter material type'), 'Slides')
  expect(container.querySelectorAll('.mf-row')).toHaveLength(1)
  expect(button('Lecture slides.pdf')).toBeTruthy()
  expect(button('Class notes.txt')).toBeUndefined()
  await chooseOption(labeledButton('Filter material type'), 'All types')
  expect(container.querySelectorAll('.mf-row')).toHaveLength(2)
  expect(mocks.save).not.toHaveBeenCalled()
  expect(mocks.download).not.toHaveBeenCalled()
})

it.each(['root', 'nested'])('keeps %s move destinations and submits only after Save', async destination => {
  const disk = new MemoryDirectory('Trial')
  disk.dir('Source').file('First.pdf'); disk.dir('Study').dir('Week 1')
  mocks.library!.writerDevice = 'other-device'; mocks.library!.items = await scanFolder(disk)
  mocks.loadHandle.mockResolvedValue(disk); mocks.lock.mockImplementation(async (_id, work) => work())
  const move = vi.spyOn(folderFilesystem, 'moveEntries').mockRejectedValue(new Error('Synthetic move boundary'))
  await render()
  await act(async () => button('Source').click())
  await openMenu(labeledButton('Actions for First.pdf'))
  await act(async () => menuItem('Move').click())
  await chooseOption(labeledButton('Destination folder'), 'Study/Week 1')
  if (destination === 'root') await chooseOption(labeledButton('Destination folder'), 'Lesson 1')
  expect(labeledButton('Destination folder').textContent).toContain(destination === 'root' ? 'Lesson 1' : 'Study/Week 1')
  expect(move).not.toHaveBeenCalled()
  expect(mocks.save).not.toHaveBeenCalled()
  expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  await act(async () => button('Save').click())
  expect(move).toHaveBeenCalledExactlyOnceWith(disk, [{ from: 'Source/First.pdf', to: destination === 'root' ? 'First.pdf' : 'Study/Week 1/First.pdf' }], 'move', expect.any(Function))
})

it('fills a preset type without submitting and still saves a custom type', async () => {
  await connectedFiles(); await render()
  await openMenu(labeledButton('Actions for First.pdf'))
  await act(async () => menuItem('Set type').click())
  const input = document.querySelector<HTMLInputElement>('input[aria-label="Material type"]')!
  await openMenu(button('Choose type'))
  await act(async () => menuItem('Worksheet').click())
  expect(input.value).toBe('Worksheet')
  expect(mocks.save).not.toHaveBeenCalled()
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'My seminar handout')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(input.value).toBe('My seminar handout')
  await act(async () => button('Save').click())
  expect(mocks.save).toHaveBeenCalledTimes(1)
  const saved = mocks.save.mock.calls[0][1] as FolderLibrary
  expect(saved.items.find(item => item.path === 'First.pdf')).toMatchObject({ category: 'My seminar handout', categoryConfirmed: true })
  expect(saved.items.find(item => item.path === 'Second.pdf')?.category).toBe('Other')
})

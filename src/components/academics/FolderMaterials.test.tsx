import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { FolderMaterials } from './FolderMaterials'
import type { FolderLibrary } from '@/lib/academics/materialFolder/model'
const mocks = vi.hoisted(() => ({ library: undefined as FolderLibrary | undefined, download: vi.fn(), sync: vi.fn() }))
vi.mock('@/store/store', () => ({ useStore: (select: (s: unknown) => unknown) => select({ academics: { classCenter: { workspaces: [{ courseId: 'test', materialFolder: mocks.library }] } } }) }))
vi.mock('@/lib/academics/materialFolder/controller', () => ({ captureFolderFence: () => () => {}, readFolderLibrary: () => mocks.library, saveFolderLibrary: vi.fn(), withFolderLock: vi.fn() }))
vi.mock('@/lib/academics/materialFolder/storage', () => ({ deviceId: () => 'other-device', loadFolderHandle: vi.fn(), saveFolderHandle: vi.fn(), cacheUsage: async () => 0, clearPreviewCache: vi.fn(), cloudBudgetUsed: () => 0, downloadFolderFile: mocks.download, syncFolderFile: mocks.sync }))
vi.mock('./FolderPdfPreview', () => ({ FolderPdfPreview: ({ name }: { name: string }) => <div data-testid="pdf-preview">{name}</div> }))
let root: Root, container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  mocks.download.mockReset(); mocks.sync.mockReset()
  mocks.library = { id: 'library', label: 'Lesson 1', writerDevice: 'source-device', updatedAt: 0, cloudObjects: {}, items: Array.from({ length: 120 }, (_, n) => ({ id: String(n), path: `Reading ${n + 1}.pdf`, kind: 'file', category: 'Reading', size: 1, modified: 0, cloudHash: 'a'.repeat(64) })) }
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function render() { await act(async () => root.render(<FolderMaterials courseId="test" courseLabel="BIOL 103" onBack={() => {}} />)) }
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

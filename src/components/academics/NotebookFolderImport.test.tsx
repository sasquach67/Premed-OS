import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NotebookImportPanel } from './NotebookImportPanel'
import { createInitialDataForMode, useStore } from '@/store/store'
import { exportNotebook } from '@/lib/academics/notebook/import'
import { MemoryNotebookAssets, visualFixture } from '@/lib/academics/notebook/visual.test-fixtures'
import { plainNotebookZip } from '@/lib/academics/notebook/notebookFiles.test-fixtures'
import type { Course } from '@/lib/types'
const pngBytes = () => new Uint8Array(readFileSync('src/lib/academics/notebook/visual-fixtures/question.png'))
let repo: MemoryNotebookAssets, root: Root, container: HTMLDivElement
const imported = vi.fn(), pkg = visualFixture()
const course: Course = { id: 'folder-qa', code: pkg.course.code, title: pkg.course.title, term: pkg.course.term ?? 'Fall 2026', credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }
vi.mock('@/lib/academics/notebook/notebookAssetStore', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/academics/notebook/notebookAssetStore')>()
  return { ...actual, notebookAssetRepository: () => repo, commitNotebookAssets: (options: Parameters<typeof actual.commitNotebookAssets>[0]) => actual.commitNotebookAssets({ ...options, repository: repo }) }
})
beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('Blob', NodeBlob); vi.stubGlobal('File', NodeFile)
  vi.stubGlobal('createImageBitmap', async (blob: Blob) => { const v = new DataView(await blob.arrayBuffer()); return { width: v.getUint32(16), height: v.getUint32(20), close() {} } })
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.defineProperty(HTMLInputElement.prototype, 'webkitdirectory', { configurable: true, value: false })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:folder-qa'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  repo = new MemoryNotebookAssets(); imported.mockClear()
  const data = createInitialDataForMode(false); data.courses = [course]; useStore.getState().replaceAll(data)
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root.render(<NotebookImportPanel courseId={course.id} onImported={imported} />))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); delete (HTMLInputElement.prototype as unknown as Record<string, unknown>).webkitdirectory; vi.restoreAllMocks(); vi.unstubAllGlobals() })
function file(path: string, data: string | Uint8Array, directory = true) { const f = new File([typeof data === 'string' ? data : data.slice().buffer], path.split('/').at(-1)!, { type: path.endsWith('.png') ? 'image/png' : 'application/json' }); if (directory) Object.defineProperty(f, 'webkitRelativePath', { value: 'Folder/' + path }); return f }
function button(label: string) { return [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === label)! }
async function input(selector: string, files: File[]) { const element = container.querySelector<HTMLInputElement>(selector)!; expect(element).toBeTruthy(); await act(async () => { Object.defineProperty(element, 'files', { configurable: true, value: files }); element.dispatchEvent(new Event('change', { bubbles: true })) }); await settled() }
async function folder(files: File[]) { await input('[aria-label="Choose notebook folder"]', files) }
async function settled() { await vi.waitFor(async () => { await act(async () => {}); expect(container.querySelector<HTMLInputElement>('[aria-label="Choose notebook folder"]')!.disabled).toBe(false) }, { timeout: 5000 }) }
async function select(value: string) { await act(async () => { const select = container.querySelector<HTMLSelectElement>('.en-collection-summary select')!; select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })) }) }
function rowsPackage() { const p = visualFixture(); p.assets.push({ ...p.assets[0], id: 'second-image', fileName: 'second.png' }); p.visualReview.candidates.push({ ...p.visualReview.candidates[0], id: 'candidate-second', assetId: 'second-image' }); const figure = p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'figure')!; p.entries[0].sections[0].blocks.push({ ...figure, id: 'second-figure', assetId: 'second-image' }); return p }
it('defaults to the folder action, imports nested images without manual mapping, and preserves raw JSON through save, reload and duplicate import', async () => {
  expect(button('Choose notebook folder')).toBeTruthy(); expect(container.querySelector<HTMLDetailsElement>('.en-import-inputs')!.open).toBe(false)
  const raw = ' \n' + JSON.stringify(pkg, null, 2) + '\n', files = [file('Title.json', raw), file('deep/images/' + pkg.assets[0].fileName, pngBytes()), file('Checks.json', '{}'), file('notes.txt', 'Not interpreted')]
  await folder(files)
  expect(container.textContent).toContain('1 of 1 images validated'); expect(container.querySelectorAll('.en-image-problem')).toHaveLength(0)
  expect(container.querySelectorAll('.en-image-review input[aria-label^="Map image"]')).toHaveLength(0)
  expect(container.querySelector<HTMLDetailsElement>('.en-image-review details:has(.en-matched-images)')!.open).toBe(false)
  expect(container.textContent).toContain('1 unsupported file will not be imported'); expect(container.textContent).toContain('1 supporting JSON file')
  await act(async () => container.querySelector<HTMLInputElement>('input[type=checkbox]')!.click()); expect(container.querySelector('.en-save-blocked')?.textContent).toBeUndefined(); await act(async () => button('Save editable entry to PSYC 101').click()); await settled()
  expect(container.querySelector('.en-error')?.textContent).toBeUndefined(); expect(imported).toHaveBeenCalledTimes(1); expect(repo.bytes.size).toBe(1)
  await act(async () => useStore.persist.rehydrate())
  const saved = useStore.getState().academics.classCenter.lectures[0]
  expect(exportNotebook(saved, 'original')).toBe(raw); expect(saved.importedNotebook!.assetBindings).toHaveLength(1)
  await folder(files); await act(async () => container.querySelector<HTMLInputElement>('input[type=checkbox]')!.click()); expect(button('Open existing saved entry').disabled).toBe(false)
  await act(async () => button('Open existing saved entry').click()); await settled(); expect(useStore.getState().academics.classCenter.lectures).toHaveLength(1)
})
it('shows only the missing image control and cannot partially save otherwise valid images', async () => {
  const p = rowsPackage(); await folder([file('Title.json', JSON.stringify(p)), file('images/' + p.assets[0].fileName, pngBytes())])
  expect(container.textContent).toContain('1 of 2 images validated · 1 need attention'); expect(container.querySelectorAll('.en-image-problem')).toHaveLength(1)
  expect(container.querySelector('.en-image-problem')!.textContent).toContain('second.png'); expect(button('Save editable entry to PSYC 101').disabled).toBe(true)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0); expect(repo.bytes.size).toBe(0)
  await input('.en-image-problem input', [file('second.png', pngBytes(), false)])
  expect(container.textContent).toContain('2 of 2 images validated'); expect(container.querySelectorAll('.en-image-problem')).toHaveLength(0)
})
it('requires an explicit path choice for duplicate basenames', async () => {
  await folder([file('Title.json', JSON.stringify(pkg)), file('originals/' + pkg.assets[0].fileName, pngBytes()), file('rendered/' + pkg.assets[0].fileName, pngBytes())])
  expect(container.textContent).toContain('Ambiguous filename'); expect(button('Save editable entry to PSYC 101').disabled).toBe(true)
  const field = container.querySelector<HTMLSelectElement>('.en-image-problem select')!
  expect([...field.options].map(o => o.text)).toEqual(['Choose the exact image', 'originals/' + pkg.assets[0].fileName, 'rendered/' + pkg.assets[0].fileName])
  await act(async () => { field.value = field.options[1].value; field.dispatchEvent(new Event('change', { bubbles: true })) }); await settled()
  expect(container.textContent).toContain('1 of 1 images validated')
})
it('requires notebook selection for multiple candidates and rejects material-only folders', async () => {
  await folder([file('b.json', JSON.stringify(pkg)), file('a.json', JSON.stringify(pkg)), file('Checks.json', '{}')])
  expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeNull(); expect(container.textContent).toContain('2 JSON files found')
  await select('b.json'); await settled(); expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeTruthy()
  await folder([file('lecture.pdf', 'raw'), file('Checks.json', '{}')]); expect(container.textContent).toContain('No notebook JSON found'); expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeNull()
})
it('does not allow a stale candidate read to replace a newer selection', async () => {
  const a = file('a.json', JSON.stringify(pkg)), bPkg = visualFixture(); bPkg.entries[0].title = 'Selected B'; const b = file('b.json', JSON.stringify(bPkg))
  let finish!: (text: string) => void
  vi.spyOn(a, 'text').mockResolvedValueOnce(JSON.stringify(pkg)).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  await folder([a, b, file('images/' + pkg.assets[0].fileName, pngBytes())]); await select('a.json'); await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
  await select('b.json'); await settled(); expect(container.textContent).toContain('Selected B')
  await act(async () => finish(JSON.stringify(pkg))); await settled(); expect(container.querySelector<HTMLSelectElement>('.en-collection-summary select')!.value).toBe('b.json'); expect(container.textContent).toContain('Selected B')
})
it('keeps ordinary compressed ZIP and separate JSON plus image imports working', async () => {
  const zip = plainNotebookZip([['Title.json', new TextEncoder().encode(JSON.stringify(pkg))], ['images/' + pkg.assets[0].fileName, pngBytes()]])
  await input('input[accept*=".zip"]', [new File([await zip.arrayBuffer()], 'Title.zip', { type: 'application/zip' })]); expect(container.textContent).toContain('1 of 1 images validated')
  await input('input[accept*=".zip"]', [file('Title.json', JSON.stringify(pkg), false)]); expect(container.textContent).toContain('0 of 1 images validated')
  await input('.en-image-review input[multiple]', [file(pkg.assets[0].fileName, pngBytes(), false)]); expect(container.textContent).toContain('1 of 1 images validated')
})
it('offers the ZIP alternative when directory selection is unsupported', async () => {
  delete (HTMLInputElement.prototype as unknown as Record<string, unknown>).webkitdirectory
  await act(async () => root.render(<NotebookImportPanel key="unsupported-directory" courseId={course.id} onImported={imported} />))
  expect(button('Choose notebook folder')).toBeUndefined()
  expect(container.textContent).toContain('Choose your notebook ZIP below')
  expect(container.querySelector<HTMLDetailsElement>('.en-import-inputs')!.open).toBe(true)
})

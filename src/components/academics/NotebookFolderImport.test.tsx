import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync, strFromU8, strToU8 } from 'fflate'
import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NotebookImportPanel } from './NotebookImportPanel'
import { activateAccountWorkspace, activateGuestWorkspace, createInitialDataForMode, snapshotData, useStore } from '@/store/store'
import { exportNotebook, saveNotebookEdits } from '@/lib/academics/notebook/import'
import { notebookTransaction } from './ExternalNotebookView'
import { exportNotebookBackupBundle, prepareNotebookBundle } from '@/lib/academics/notebook/notebookBundle'
import { headerDecoder } from '@/lib/academics/notebook/visual.test-fixtures'
import { decodeWorkspaceStorage, WORKSPACE_STORAGE_PREFIX } from '@/store/workspaceStorageCodec'
import * as workspaceCodec from '@/store/workspaceStorageCodec'
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
  expect(container.textContent).toContain('Open Other import options to choose your notebook ZIP')
  expect(container.querySelector<HTMLDetailsElement>('.en-import-inputs')!.open).toBe(false)
})

it.each([{ name: 'unfinished draft', raw: ' { unfinished draft' }, { name: 'valid notebook', raw: JSON.stringify(pkg) }])('keeps restored $name behind collapsed options on every importer entry without losing it', async ({ raw }) => {
  for (const key of ['first-entry', 'return-entry']) {
    await act(async () => root.render(<NotebookImportPanel key={key} courseId={course.id} initialRaw={raw} onImported={imported} />))
    const options = container.querySelector<HTMLDetailsElement>('.en-import-inputs')!
    expect(options.open).toBe(false)
    expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toBe(raw)
    await act(async () => options.querySelector('summary')!.click())
    expect(options.open).toBe(true)
    expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toBe(raw)
    if (raw === JSON.stringify(pkg)) {
      await act(async () => button('Validate and preview').click()); await settled()
      expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeTruthy()
      expect(options.open).toBe(false)
      expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toBe(raw)
    }
  }
})

it('tests candidate deduplication under quota pressure while retaining the account, staged images and exact retry', async () => {
  // Explicit test-only opt-in. Production must not migrate old warm tabs yet.
  const encode = workspaceCodec.encodeWorkspaceStorage
  vi.spyOn(workspaceCodec, 'encodeWorkspaceStorage').mockImplementation(value => encode(value, { deduplicate: true }))
  await act(async () => activateAccountWorkspace('folder-pressure-a', snapshotData()))
  const files = [file('Title.json', JSON.stringify(pkg)), file('images/' + pkg.assets[0].fileName, pngBytes())]
  await folder(files)
  await act(async () => container.querySelector<HTMLInputElement>('input[type=checkbox]')!.click())
  await act(async () => button('Save editable entry to PSYC 101').click()); await settled()
  const old = useStore.getState().academics.classCenter.lectures[0]
  const edited = structuredClone(old.importedNotebook!.current); edited.entries[0].title = 'Saved manual edit'
  await act(async () => notebookTransaction(state => {
    const record = state.academics.classCenter.lectures[0], notebook = record.importedNotebook!
    const question = notebook.current.entries[0].sections.flatMap(section => section.blocks).find(block => block.type === 'practice')!
    notebook.progress[question.id] = { response: 'My retained practice answer', complete: true }
    notebook.acceptedRaw = notebook.originalRaw
    saveNotebookEdits(record, edited, 'Keep my notes')
  }))
  const prior = structuredClone(useStore.getState().academics)
  const key = useStore.persist.getOptions().name!, before = localStorage.getItem(key)!
  const next = visualFixture(); next.entries[0].id = 'new-notebook'; next.entries[0].title = 'New notebook under pressure'
  // Deterministic low-compressibility source text makes the existing gzip cache
  // meaningfully larger; this is synthetic storage data, not teaching content.
  let seed = 123456789
  next.sources[0].excerpts[0].text = Array.from({ length: 160_000 }, () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return String.fromCharCode(33 + (seed >>> 0) % 90) }).join('')
  const raw = ' \n' + JSON.stringify(next, null, 2) + '\n'
  await folder([file('Title.json', raw), files[1]])
  expect(container.textContent).toContain('1 of 1 images validated')
  await act(async () => container.querySelector<HTMLInputElement>('input[type=checkbox]')!.click())
  const originalSet = Storage.prototype.setItem
  let fail: 'minimal' | 'fixed' = 'minimal', rejectedSize = 0, rejectedCompressed = false, rejectedValue = ''
  const budget = 5 * 1024 * 1024
  function originBytes(replacing?: string, value = '') {
    let total = replacing ? 2 * (replacing.length + value.length) : 0
    for (let i = 0; i < localStorage.length; i++) { const name = localStorage.key(i)!; if (name !== replacing) total += 2 * (name.length + localStorage.getItem(name)!.length) }
    return total
  }
  const pressureKey = 'hq:app-data:account:folder-pressure-b'
  localStorage.setItem(pressureKey, JSON.stringify({ notes: 'Other account data stays exact' }))
  const otherBefore = localStorage.getItem(pressureKey)
  // Existing-origin pressure: allow the prior durable snapshot, reject growth.
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name, value) {
    if (this === localStorage && ((fail === 'minimal' && name === key && value.length > before.length + 128) || (fail === 'fixed' && originBytes(name, value) > budget))) {
      rejectedSize = value.length
      rejectedCompressed = value.startsWith('premed-os:workspace:')
      rejectedValue = value
      throw new DOMException('Origin quota exceeded', 'QuotaExceededError')
    }
    originalSet.call(this, name, value)
  })
  imported.mockClear()
  await act(async () => button('Save editable entry to PSYC 101').click()); await settled()
  expect(container.textContent).toContain('Browser storage could not save')
  expect(imported).not.toHaveBeenCalled()
  expect(useStore.getState().academics).toEqual(prior)
  expect(localStorage.getItem(key)).toBe(before)
  expect(localStorage.getItem(pressureKey)).toBe(otherBefore)
  expect(await repo.journals()).toHaveLength(1)
  expect(repo.bytes.size).toBe(1)
  expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toBe(raw)
  expect(rejectedSize).toBeGreaterThan(before.length + 128)
  expect(rejectedCompressed).toBe(true)
  expect(button('Copy repair request and JSON')).toBeUndefined()
  expect(container.textContent).toContain('Keep your original folder or ZIP')
  // A fixed 5 MiB UTF-16 origin budget with 900 kB left: legacy gzip fails,
  // while deduplicated storage must accept this exact same folder on retry.
  const legacyAttempt = WORKSPACE_STORAGE_PREFIX + btoa(strFromU8(gzipSync(strToU8(decodeWorkspaceStorage(rejectedValue)), { level: 1, mtime: 0 }), true))
  const fillKey = 'synthetic-other-application-cache'
  localStorage.setItem(fillKey, 'x'.repeat(Math.floor((budget - 900_000 - originBytes()) / 2) - fillKey.length))
  const usedBefore = originBytes()
  expect(originBytes(key, legacyAttempt)).toBeGreaterThan(budget)
  expect(originBytes(key, rejectedValue)).toBeLessThan(budget)
  const otherCache = localStorage.getItem(fillKey)
  fail = 'fixed'
  await act(async () => button('Save editable entry to PSYC 101').click()); await settled()
  expect(imported).toHaveBeenCalledTimes(1)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(2)
  await act(async () => useStore.persist.rehydrate())
  const records = useStore.getState().academics.classCenter.lectures
  expect(records.find(r => r.id === old.id)?.importedNotebook).toEqual(prior.classCenter.lectures[0].importedNotebook)
  const saved = records.find(r => r.id !== old.id)!
  expect(exportNotebook(saved, 'original')).toBe(raw)
  const backup = await prepareNotebookBundle(await exportNotebookBackupBundle(saved.importedNotebook!, course.id, repo, headerDecoder), headerDecoder)
  expect(backup.kind).toBe('backup')
  // Device-local lineage IDs are deliberately regenerated on portable restore.
  const portable = structuredClone(saved.importedNotebook!); delete portable.assetLineageId
  if (backup.kind === 'backup') expect(backup.notebook).toEqual(portable)
  expect(localStorage.getItem(pressureKey)).toBe(otherBefore)
  expect(localStorage.getItem(fillKey)).toBe(otherCache)
  expect(originBytes()).toBeLessThanOrEqual(budget)
  if (process.env.NOTEBOOK_QUOTA_RECEIPT) writeFileSync(process.env.NOTEBOOK_QUOTA_RECEIPT, JSON.stringify({ synthetic: true, budgetBytes: budget, rawInputCharacters: raw.length, existingStoredCharacters: before.length, legacyAttemptCharacters: legacyAttempt.length, deduplicatedAttemptCharacters: rejectedSize, originBytesBefore: usedBefore, originBytesAfter: originBytes(), savedAndReloaded: true, exactOriginalRaw: true, previousEditsAndHistoryRetained: true, portableRoundTrip: true }, null, 2))
  const importedBeforeSwitch = structuredClone(records.map(record => record.importedNotebook))
  await act(async () => activateGuestWorkspace())
  await act(async () => activateAccountWorkspace('folder-pressure-a'))
  expect(useStore.getState().academics.classCenter.lectures.map(record => record.importedNotebook)).toEqual(importedBeforeSwitch)
})

it.each([false, true])('rejects an account switch after image staging, even with identical IDs (switch back: %s)', async switchBack => {
  await act(async () => activateAccountWorkspace('folder-stage-a', snapshotData()))
  const data = structuredClone(snapshotData()), key = useStore.persist.getOptions().name!
  const before = localStorage.getItem(key)
  await folder([file('Title.json', JSON.stringify(pkg)), file('images/' + pkg.assets[0].fileName, pngBytes())])
  await act(async () => container.querySelector<HTMLInputElement>('input[type=checkbox]')!.click())
  repo.afterStage = () => {
    activateAccountWorkspace('folder-stage-b', data)
    if (switchBack) activateAccountWorkspace('folder-stage-a')
  }
  await act(async () => button('Save editable entry to PSYC 101').click()); await settled()
  expect(container.textContent).toContain('The active workspace changed')
  expect(button('Copy repair request and JSON')).toBeUndefined()
  expect(imported).not.toHaveBeenCalled()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  expect(JSON.parse(localStorage.getItem(key)!).state.academics).toEqual(JSON.parse(before!).state.academics)
  expect(await repo.journals()).toHaveLength(1)
  expect(repo.bytes.size).toBe(1)
})

it('keeps a committed source-account notebook but suppresses navigation if the account changes during journal cleanup', async () => {
  await act(async () => activateAccountWorkspace('folder-finish-a', snapshotData()))
  const empty = structuredClone(snapshotData()), key = useStore.persist.getOptions().name!
  await folder([file('Title.json', JSON.stringify(pkg)), file('images/' + pkg.assets[0].fileName, pngBytes())])
  await act(async () => container.querySelector<HTMLInputElement>('input[type=checkbox]')!.click())
  let finish!: () => void
  const originalFinish = repo.finish.bind(repo)
  vi.spyOn(repo, 'finish').mockImplementationOnce(async id => { await new Promise<void>(resolve => { finish = resolve }); await originalFinish(id) })
  await act(async () => button('Save editable entry to PSYC 101').click())
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
  const committed = JSON.parse(decodeWorkspaceStorage(localStorage.getItem(key)!)).state.academics.classCenter.lectures
  expect(committed).toHaveLength(1)
  await act(async () => activateAccountWorkspace('folder-finish-b', empty))
  await act(async () => finish()); await settled()
  expect(imported).not.toHaveBeenCalled()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  expect(JSON.parse(decodeWorkspaceStorage(localStorage.getItem(key)!)).state.academics.classCenter.lectures).toEqual(committed)
  expect(await repo.journals()).toHaveLength(0)
})

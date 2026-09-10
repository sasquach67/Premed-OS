import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { createInitialDataForMode, STORAGE_KEY, useStore } from '@/store/store'
import { ExternalNotebookView, notebookTransaction } from './ExternalNotebookView'
import { importNotebook, exportNotebook } from '@/lib/academics/notebook/import'
import { prepareNotebook } from '@/lib/academics/notebook/package'
import * as notebookAssetStore from '@/lib/academics/notebook/notebookAssetStore'
import * as notebookBundles from '@/lib/academics/notebook/notebookBundle'
import { correctedFixture, revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import type { Course } from '@/lib/types'
let root: Root, container: HTMLDivElement, id: string
const pkg = revisionFixture()
const course: Course = { id: 'update-demo', code: pkg.course.code, title: pkg.course.title, term: pkg.course.term!, credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }
const lecture = () => useStore.getState().academics.classCenter.lectures.find(l => l.id === id)!
function Harness() { const current = useStore(s => s.academics.classCenter.lectures.find(l => l.id === id)!); return <ExternalNotebookView lecture={current} courseCode={course.code} /> }
beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); sessionStorage.clear()
  const data = createInitialDataForMode(false); data.courses = [course]; useStore.getState().replaceAll(data)
  const prepared = await prepareNotebook(JSON.stringify(pkg))
  notebookTransaction(state => { [id] = importNotebook(state.academics.classCenter, course, prepared); const n = state.academics.classCenter.lectures[0].importedNotebook!; n.notes = 'Protected notes'; n.progress = { 'question-mapping': { response: 'Left', complete: true }, 'question-timing': { response: '100', complete: true } } })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root.render(<Harness />))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks() })
function button(label: string) { return [...container.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent?.trim() === label)! }
async function click(label: string) {
  expect(button(label), label).toBeTruthy(); await act(async () => button(label).click())
  if (label === 'Validate and preview' || label === 'Accept update to this entry' || label.startsWith('Save editable')) await vi.waitFor(async () => { await act(async () => {}); expect(container.querySelector('input[type="file"]')?.hasAttribute('disabled')).not.toBe(true) }, { timeout: 10000, interval: 20 })
}
async function fill(label: string, value: string) {
  const field = [...container.querySelectorAll('label')].find(l => l.childNodes[0]?.textContent?.trim() === label)?.querySelector('textarea')
  if (!field) throw new Error(`Missing textarea: ${label}`)
  expect(field, label).toBeTruthy(); await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) })
}
async function check(text: string) { const box = [...container.querySelectorAll('label')].find(l => l.textContent?.includes(text))?.querySelector<HTMLInputElement>('input[type="checkbox"]'); if (!box) throw new Error(`Missing checkbox: ${text}`); await act(async () => box.click()) }
async function toImport() {
  await click('Update this notebook'); await click('Next'); await click('Copy update prompt')
  expect(button('Next').disabled).toBe(true)
  await click('I have the baseline file or full JSON'); await click('Next'); await click('I have my notebook files'); await click('Continue to import')
}
async function preview() { await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture())); await click('Validate and preview') }
it('requires saved edits/notes, uses the same goal and names the real saved baseline', async () => {
  await click('Edit entry'); await fill('Entry title', 'My saved wording'); await click('Update this notebook')
  expect(container.textContent).toContain('Save your edits and notes'); expect(lecture().importedNotebook!.updateSession).toBeUndefined()
  await click('Save edits'); await click('Update this notebook')
  expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0)
  expect(container.textContent).toContain('My saved wording'); await click('Next')
  const prompt = container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]') ?? container.querySelector<HTMLTextAreaElement>('.en-code-body textarea')!
  const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(prompt.value)![1])
  expect(JSON.parse(request.revisionInput).entryId).toBe(pkg.entries[0].id)
  expect(JSON.parse(request.revisionInput).baselineFile).toBe('My saved wording.json')
  expect(prompt.value).toContain('My saved wording.json: attach this exact saved baseline')
  expect(request.helpStage).toBeNull()
  const baseline = container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value
  expect(JSON.parse(baseline).entries[0].title).toBe('My saved wording')
  expect(baseline).not.toContain('Protected notes'); expect(baseline).not.toContain('"complete"')
  expect(lecture().importedNotebook!.notes).toBe('Protected notes')
})
it('keeps the baseline/prompt and JSON gates with Back and same-tab reload', async () => {
  await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture()))
  await act(async () => root.unmount()); root = createRoot(container); await act(async () => root.render(<Harness />))
  expect(container.querySelector('h1')?.textContent).toBe('Import your updated notebook')
  expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeNull()
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toContain('200 milliseconds')
  await click('Back to AI steps'); expect(container.textContent).toContain('If you say more files are coming, your AI should wait')
  await click('Back to prompt'); expect(button('Next').disabled).toBe(false)
})
it('shows readable differences and explicit acceptance, preserves independent practice through store reload', async () => {
  await preview()
  expect(container.textContent).toContain('Hypothetical task: how long is the shape shown?')
  expect(container.textContent).toContain('Source / excerpts'); expect(button('Accept update to this entry').disabled).toBe(true)
  const previewFrame = [...container.querySelectorAll('.en-notebook-preview')].find(node => node.querySelector('h3')?.textContent === 'Preview — not saved yet')!
  expect(container.querySelector('.en-import-comparison-scroll[tabindex="0"]')).toBeTruthy()
  expect(previewFrame.querySelector('.en-notebook-preview-scroll[tabindex="0"]')).toBeTruthy()
  expect(previewFrame.querySelector('[inert]')).toBeNull()
  expect(previewFrame.textContent).not.toMatch(/Expand preview|Collapse preview/)
  expect(button('Accept update to this entry').disabled).toBe(true)
  await check('I reviewed the content'); await click('Accept update to this entry')
  expect(lecture().id).toBe(id); expect(lecture().importedNotebook!.current.entries[0].revision).toBe(2)
  expect(lecture().importedNotebook!.progress['question-mapping'].complete).toBe(true)
  expect(lecture().importedNotebook!.progress['question-timing']).toBeUndefined()
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  await act(async () => root.unmount()); root = createRoot(container)
  useStore.setState({ academics: createInitialDataForMode(false).academics }); localStorage.setItem(STORAGE_KEY, JSON.stringify(disk)); await act(async () => useStore.persist.rehydrate())
  await act(async () => root.render(<Harness />))
  expect(lecture().importedNotebook!.history).toHaveLength(1); expect(lecture().importedNotebook!.notes).toBe('Protected notes')
  await click('Edit entry'); await fill('Entry title', 'Edited after acceptance'); await click('Save edits')
  expect(JSON.parse(exportNotebook(lecture(), 'current')).entries[0].title).toBe('Edited after acceptance')
})
it('blocks content changed after preview and explains a separate copy accurately', async () => {
  await preview(); await check('I reviewed the content')
  await act(async () => notebookTransaction(state => { state.academics.classCenter.lectures[0].importedNotebook!.current.entries[0].title = 'Newer saved title' }))
  expect(container.textContent).toContain('Saved content changed after the baseline'); expect(button('Accept update to this entry').disabled).toBe(true)
  await check('Save as separate entries instead')
  expect(container.textContent).toContain('separate copy starts with empty notes and practice records')
  await check('Save revised content as separate entries'); await click(`Save editable entry to ${course.code}`)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(2)
  expect(lecture().importedNotebook!.current.entries[0].title).toBe('Newer saved title')
  const copy = useStore.getState().academics.classCenter.lectures.find(l => l.id !== id)!.importedNotebook!
  expect(copy.notes).toBe(''); expect(copy.progress).toEqual({})
})
it('rolls back content, history and study records when persistence fails during acceptance', async () => {
  await preview(); await check('I reviewed the content'); const before = JSON.stringify(lecture().importedNotebook)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
  await click('Accept update to this entry')
  expect(container.textContent).toContain('Browser storage could not save'); expect(JSON.stringify(lecture().importedNotebook)).toBe(before)
})
it('rejects a cross-tab change after preview without replacing newer disk content', async () => {
  await preview(); await check('I reviewed the content')
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!); disk.state.academics.classCenter.lectures[0].importedNotebook.notes = 'Newer other-tab notes'; localStorage.setItem(STORAGE_KEY, JSON.stringify(disk))
  await click('Accept update to this entry'); expect(container.textContent).toContain('another tab')
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.academics.classCenter.lectures[0].importedNotebook.notes).toBe('Newer other-tab notes')
  expect(lecture().importedNotebook!.current.entries[0].revision).toBe(1)
})
it('restores a reviewed history version and retains the replaced version', async () => {
  await preview(); await check('I reviewed the content'); await click('Accept update to this entry')
  await act(async () => container.querySelector('.en-history summary')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  await click('Review this version'); expect(container.textContent).toContain('Review before restoring')
  await click('Restore this version')
  expect(lecture().importedNotebook!.current.entries[0].revision).toBe(1); expect(lecture().importedNotebook!.history).toHaveLength(2)
  expect(lecture().importedNotebook!.progress['question-timing'].complete).toBe(true)
})
it('keeps the update action visible and the complete guide available throughout the update flow', async () => {
  expect(button('Update this notebook').closest('details')).toBeNull()
  expect(button('Edit entry').closest('details')).toBeNull()
  await click('Update this notebook')
  const guide = container.querySelector<HTMLDetailsElement>('.en-update-guide')!
  expect(guide.open).toBe(false)
  expect(guide.querySelectorAll('.en-update-guide-steps>li')).toHaveLength(8)
  expect(guide.querySelectorAll(':scope>details')).toHaveLength(5)
  expect(guide.textContent).toContain('A whole revised notes file is fine')
  expect(guide.textContent).toContain('No separate draft approval is required.')
  expect(guide.textContent).toContain('A readable draft is optional.')
  expect(guide.textContent).not.toContain('Create the JSON')
  expect(guide.textContent).toContain('check the destination and comparison, and explicitly accept the update')
  expect(guide.textContent).toContain('Download current baseline + images')
  expect(guide.textContent).toContain('Unzip this app-exported bundle')
  expect(guide.textContent).toContain('bindings.json')
  expect(guide.textContent).toContain('For a text-only notebook')
  expect(guide.textContent).toContain('Download every new or revised referenced PNG/JPEG')
  expect(guide.textContent).toContain('restore it from a complete portable backup or recover its exact original file')
  await act(async () => guide.querySelector('summary')!.click())
  await click('Next'); expect(guide.open).toBe(true)
  expect(container.querySelector('.en-code-name')?.textContent).toBe('notebook-update-review-prompt.md')
  expect(button('Download current notebook JSON')).toBeTruthy()
  await click('Copy update prompt'); await click('I have the baseline file or full JSON'); await click('Next')
  expect(container.textContent).toContain('A new chat is fine')
  expect(container.textContent).toContain('Add the saved notebook JSON, its images, and your new materials')
  expect(container.textContent).toContain('Reopen this saved notebook and choose Update this notebook')
  expect(container.textContent).not.toContain('choose Add to notebook')
})
it('blocks an old handoff after saved edits, then restarts with the latest content and fresh acknowledgments', async () => {
  await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture()))
  const oldSession = lecture().importedNotebook!.updateSession!.id
  await click('Back to saved entry'); await click('Edit entry'); await fill('Entry title', 'Latest manual title'); await click('Save edits')
  const before = structuredClone(lecture().importedNotebook!)
  await click('Update this notebook')
  expect(container.textContent).toContain('Saved content changed after the baseline')
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toContain('200 milliseconds')
  await click('Back to AI steps'); await click('Back to prompt')
  expect(button('Copy update prompt').disabled).toBe(true)
  expect(button('Download update prompt').disabled).toBe(true)
  expect(button('Download current notebook JSON').disabled).toBe(true)
  expect(button('Next').disabled).toBe(true)
  expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value).toBe('')
  expect(container.querySelector<HTMLTextAreaElement>('.en-code-body textarea')!.value).toBe('')
  await click('Review pending proposal')
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toContain('200 milliseconds')
  await click('Restart from latest saved entry')
  expect(lecture().importedNotebook!.updateSession!.id).not.toBe(oldSession)
  expect(lecture().importedNotebook!.current).toEqual(before.current)
  expect(lecture().importedNotebook!.notes).toBe(before.notes)
  expect(lecture().importedNotebook!.progress).toEqual(before.progress)
  expect(lecture().importedNotebook!.history).toEqual(before.history)
  await click('Next')
  expect(JSON.parse(container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value)).toEqual({ ...before.current, entries: [before.current.entries[0]] })
  expect(button('Next').disabled).toBe(true)
  expect(button('I have the baseline file or full JSON').getAttribute('aria-pressed')).toBe('false')
})
it('stops copying and downloading immediately if content changes while the prompt step is open', async () => {
  await click('Update this notebook'); await click('Next'); await click('Copy update prompt'); await click('I have the baseline file or full JSON')
  expect(button('Next').disabled).toBe(false)
  await act(async () => notebookTransaction(state => { state.academics.classCenter.lectures[0].importedNotebook!.current.entries[0].title = 'Changed while prompt was open' }))
  expect(button('Copy update prompt').disabled).toBe(true)
  expect(button('Download current notebook JSON').disabled).toBe(true)
  expect(button('Download update prompt').disabled).toBe(true)
  expect(button('Next').disabled).toBe(true)
  expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value).toBe('')
  expect(container.textContent).toContain('Restart from the latest saved entry')
})
it('uses the exact canonical update prompt for preview, clipboard and download with a separate saved JSON', async () => {
  const blobs: Blob[] = [], names: string[] = []
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: (blob: Blob) => { blobs.push(blob); return 'blob:update-test' } })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download) })
  await click('Update this notebook'); await click('Next')
  const prompt = container.querySelector<HTMLTextAreaElement>('.en-code-body textarea')!.value
  expect(prompt.startsWith('# Update my Premed OS notebook: review\n\n')).toBe(true)
  expect(prompt).toContain('complete prompt works in a fresh AI chat')
  await click('Download current notebook JSON'); await click('Copy update prompt')
  await act(async () => container.querySelector('.en-prompt-detail summary')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  await click('Download update prompt')
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(prompt)
  expect(names).toEqual(['Invented classroom task.json', 'notebook-update-review-prompt.md'])
  const read = (blob: Blob) => new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsText(blob) })
  expect(await read(blobs[1])).toBe(prompt)
  const baseline = await read(blobs[0])
  expect(JSON.parse(baseline)).toEqual(lecture().importedNotebook!.updateSession!.baseline)
  expect(baseline).not.toContain('Protected notes')
  expect(baseline).not.toContain('"complete"')
})
it('does not invalidate the content baseline for independent saved notes or progress changes', async () => {
  await click('Update this notebook'); await click('Next')
  await act(async () => notebookTransaction(state => { const n = state.academics.classCenter.lectures[0].importedNotebook!; n.notes = 'New independent note'; n.progress['question-mapping'].response = 'A newer independent response' }))
  expect(button('Copy update prompt').disabled).toBe(false)
  expect(button('Download current notebook JSON').disabled).toBe(false)
  const baseline = container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value
  expect(baseline).not.toContain('New independent note')
  expect(baseline).not.toContain('A newer independent response')
})

it('downloads current, original and backup JSON with their actual titles and exact export bytes', async () => {
  const blobs: Blob[] = [], names: string[] = []
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: (blob: Blob) => { blobs.push(blob); return 'blob:title-test' } })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download) })
  await click('Edit entry'); await fill('Entry title', 'Current: lesson/notes'); await click('Save edits')
  const before = JSON.stringify(lecture().importedNotebook)
  const expected = ['current', 'original', 'backup'].map(kind => exportNotebook(lecture(), kind as 'current' | 'original' | 'backup'))
  await click('Export current JSON'); await click('Export original'); await click('JSON records with progress')
  expect(names).toEqual(['Current- lesson-notes.json', 'Invented classroom task.json', 'Current- lesson-notes.json'])
  for (const [index, blob] of blobs.entries()) {
    const raw = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsText(blob) })
    expect(raw).toBe(expected[index])
  }
  expect(JSON.stringify(lecture().importedNotebook)).toBe(before)
})

it.each(['current', 'backup'] as const)('suggests the current title for the %s ZIP without altering its export inputs', async kind => {
  const names: string[] = [], blob = new Blob(['test bundle bytes'], { type: 'application/zip' })
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:zip-title-test') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download) })
  vi.spyOn(notebookAssetStore, 'notebookAssetRepository').mockReturnValue({} as ReturnType<typeof notebookAssetStore.notebookAssetRepository>)
  const currentBundle = vi.spyOn(notebookBundles, 'exportNotebookPackageBundle').mockResolvedValue(blob)
  const backupBundle = vi.spyOn(notebookBundles, 'exportNotebookBackupBundle').mockResolvedValue(blob)
  await click('Edit entry'); await fill('Entry title', 'Current: lesson/notes'); await click('Save edits')
  const before = JSON.stringify(lecture().importedNotebook)
  await click(kind === 'current' ? 'Download current notebook + images' : 'Download complete portable backup')
  await vi.waitFor(() => expect(names).toEqual(['Current- lesson-notes.zip']))
  if (kind === 'current') expect(currentBundle).toHaveBeenCalledWith(exportNotebook(lecture(), 'current'), [], expect.anything())
  else expect(backupBundle).toHaveBeenCalledWith(lecture().importedNotebook, course.id, expect.anything())
  expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
  expect(JSON.stringify(lecture().importedNotebook)).toBe(before)
})

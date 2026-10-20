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
  if (label === 'Practice') label = [...container.querySelectorAll('button')].find(node => node.textContent?.trim().startsWith('Practice set'))?.textContent?.trim() ?? label
  let target=[...document.querySelectorAll<HTMLElement>('button,[role="menuitem"]')].find(node=>node.textContent?.trim()===label)
  if (!target && ['Edit notebook','Download','Version history','Notebook details','My notes'].includes(label)) {
    const trigger=document.querySelector<HTMLButtonElement>('[aria-label="More notebook actions"]')!
    expect(trigger,label).toBeTruthy();await act(async()=>trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})))
    target=[...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(node=>node.textContent?.trim()===label)
  }
  if (!target && ['Export current JSON','Export original','JSON records with progress','Download current notebook + images','Download complete portable backup'].includes(label)) {
    await click('Download');target=[...document.querySelectorAll<HTMLElement>('button')].find(node=>node.textContent?.trim()===label)
  }
  expect(target,label).toBeTruthy();await act(async()=>target!.click())
  if (['Validate and preview','Save notebook','Save update'].includes(label)) await vi.waitFor(async()=>{await act(async()=>{});expect(container.querySelector('input[type="file"]')?.hasAttribute('disabled')).not.toBe(true)},{timeout:10000,interval:20})
}

async function fill(label: string, value: string) {
  const field = [...document.querySelectorAll('label')].find(l => l.childNodes[0]?.textContent?.trim() === label)?.querySelector('textarea')
  if (!field) throw new Error(`Missing textarea: ${label}`)
  expect(field, label).toBeTruthy(); await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) })
}
async function check(text: string) { const box = [...document.querySelectorAll('label')].find(l => l.textContent?.includes(text))?.querySelector<HTMLInputElement>('input[type="checkbox"]'); if (!box) throw new Error(`Missing checkbox: ${text}`); await act(async () => box.click()) }
async function toImport() {
  await click('Update')
  expect(button('Copy prompt').disabled).toBe(true)
  await click('I already have the current notebook and images'); await click('Copy prompt');await click('Choose the folder your AI made')
}
async function preview() { await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture())); await click('Validate and preview') }
it('requires saved edits/notes, uses the same goal and names the real saved baseline', async () => {
  await click('Edit notebook'); await fill('Entry title', 'My saved wording'); await click('Update')
  expect(container.textContent).toContain('Save your edits and notes'); expect(lecture().importedNotebook!.updateSession).toBeUndefined()
  await click('Save edits'); await click('Update')
  expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0)
  expect(container.textContent).toContain('My saved wording')
  const prompt = container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]') ?? container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]')!
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
it('opens the saved reader after reload and resumes the untouched update draft only on request', async () => {
  await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture()))
  const savedDraft = JSON.stringify(lecture().importedNotebook!.updateSession)
  const sessionBefore = JSON.stringify({ ...sessionStorage })
  await act(async () => root.unmount()); root = createRoot(container); await act(async () => root.render(<Harness />))
  expect(container.querySelector('[aria-label="Saved external notebook"]')).toBeTruthy()
  expect(container.querySelector('[aria-label="Update saved notebook"]')).toBeNull()
  expect(JSON.stringify(lecture().importedNotebook!.updateSession)).toBe(savedDraft)
  expect(JSON.stringify({ ...sessionStorage })).toBe(sessionBefore)
  await click('Update')
  expect(container.querySelector('h1')?.textContent).toBe('Update notebook')
  expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeNull()
  expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toContain('200 milliseconds')
  expect(container.querySelectorAll('.nai-step')).toHaveLength(3)
  expect(button('Copy prompt').disabled).toBe(false)
})
it('shows readable differences and explicit acceptance, preserves independent practice through store reload', async () => {
  await preview()
  expect(container.textContent).toContain('Hypothetical task: how long is the shape shown?')
  expect(container.textContent).toContain('Source / excerpts'); expect(button('Save update').disabled).toBe(true)
  const previewFrame = [...container.querySelectorAll('.en-notebook-preview')].find(node => node.querySelector('h3')?.textContent === 'Preview — not saved yet')!
  expect(container.querySelector('.en-import-comparison-scroll[tabindex="0"]')).toBeTruthy()
  expect(previewFrame.querySelector('.en-notebook-preview-scroll[tabindex="0"]')).toBeTruthy()
  expect(previewFrame.querySelector('[inert]')).toBeNull()
  expect(previewFrame.textContent).not.toMatch(/Expand preview|Collapse preview/)
  expect(button('Save update').disabled).toBe(true)
  await check('I reviewed the content'); await click('Save update')
  expect(lecture().id).toBe(id); expect(lecture().importedNotebook!.current.entries[0].revision).toBe(2)
  expect(lecture().importedNotebook!.progress['question-mapping'].complete).toBe(true)
  expect(lecture().importedNotebook!.progress['question-timing']).toBeUndefined()
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  await act(async () => root.unmount()); root = createRoot(container)
  useStore.setState({ academics: createInitialDataForMode(false).academics }); localStorage.setItem(STORAGE_KEY, JSON.stringify(disk)); await act(async () => useStore.persist.rehydrate())
  await act(async () => root.render(<Harness />))
  expect(lecture().importedNotebook!.history).toHaveLength(1); expect(lecture().importedNotebook!.notes).toBe('Protected notes')
  await click('Edit notebook'); await fill('Entry title', 'Edited after acceptance'); await click('Save edits')
  expect(JSON.parse(exportNotebook(lecture(), 'current')).entries[0].title).toBe('Edited after acceptance')
})
it('blocks content changed after preview and explains a separate copy accurately', async () => {
  await preview(); await check('I reviewed the content')
  await act(async () => notebookTransaction(state => { state.academics.classCenter.lectures[0].importedNotebook!.current.entries[0].title = 'Newer saved title' }))
  expect(container.textContent).toContain('The saved notebook changed after this update started'); expect(button('Save update').disabled).toBe(true)
  await check('Save as separate entries instead')
  expect(container.textContent).toContain('separate copy starts with empty notes and practice records')
  await check('Save revised content as separate entries'); await click('Save notebook')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(2)
  expect(lecture().importedNotebook!.current.entries[0].title).toBe('Newer saved title')
  const copy = useStore.getState().academics.classCenter.lectures.find(l => l.id !== id)!.importedNotebook!
  expect(copy.notes).toBe(''); expect(copy.progress).toEqual({})
})
it('rolls back content, history and study records when persistence fails during acceptance', async () => {
  await preview(); await check('I reviewed the content'); const before = JSON.stringify(lecture().importedNotebook)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
  await click('Save update')
  expect(container.textContent).toContain('Browser storage could not save'); expect(JSON.stringify(lecture().importedNotebook)).toBe(before)
})
it('rejects a cross-tab change after preview without replacing newer disk content', async () => {
  await preview(); await check('I reviewed the content')
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!); disk.state.academics.classCenter.lectures[0].importedNotebook.notes = 'Newer other-tab notes'; localStorage.setItem(STORAGE_KEY, JSON.stringify(disk))
  await click('Save update'); expect(container.textContent).toContain('another tab')
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.academics.classCenter.lectures[0].importedNotebook.notes).toBe('Newer other-tab notes')
  expect(lecture().importedNotebook!.current.entries[0].revision).toBe(1)
})
it('restores a reviewed history version and retains the replaced version', async () => {
  await preview(); await check('I reviewed the content'); await click('Save update')
  await click('Version history')
  await click('Review this version'); expect(document.body.textContent).toContain('Review before restoring')
  await click('Restore this version')
  expect(lecture().importedNotebook!.current.entries[0].revision).toBe(1); expect(lecture().importedNotebook!.history).toHaveLength(2)
  expect(lecture().importedNotebook!.progress['question-timing'].complete).toBe(true)
})
it('uses the shared three steps and one collapsed troubleshooting disclosure for updates', async () => {
  await click('Update')
  expect(container.querySelectorAll('.nai-step')).toHaveLength(3)
  expect([...container.querySelectorAll('.nai-step-body > h2')].map(node=>node.textContent)).toEqual(['Gather your files','Copy the prompt into a new AI chat','Bring it back'])
  const help=container.querySelector<HTMLDetailsElement>('.nai-help')!
  expect(help.open).toBe(false);expect(help.textContent).toContain('I edited after downloading')
  expect(container.querySelector('.en-update-guide')).toBeNull()
  expect(container.textContent).toContain('Your notes, practice answers and checkmarks stay in Premed OS.')
})
it('blocks an old handoff after saved edits, then restarts with the latest content and fresh acknowledgments', async () => {
  await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture()))
  const oldSession = lecture().importedNotebook!.updateSession!.id
  await click('Back to saved entry'); await click('Edit notebook'); await fill('Entry title', 'Latest manual title'); await click('Save edits')
  const before = structuredClone(lecture().importedNotebook!)
  await click('Update')
  expect(container.textContent).toContain('The saved notebook changed after this update started')
  expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toContain('200 milliseconds')
  expect(button('Copy prompt').disabled).toBe(true)
  expect([...container.querySelectorAll<HTMLButtonElement>('.nai-actions button')].find(button=>button.textContent?.trim()==='Download')!.disabled).toBe(true)
  expect(container.querySelector<HTMLButtonElement>('.nai-file button')!.disabled).toBe(true)
  expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value).toBe('')
  expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]')!.value).toBe('')
  await click('Review pending proposal')
  expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toContain('200 milliseconds')
  await click('Restart from latest saved entry')
  expect(lecture().importedNotebook!.updateSession!.id).not.toBe(oldSession)
  expect(lecture().importedNotebook!.current).toEqual(before.current)
  expect(lecture().importedNotebook!.notes).toBe(before.notes)
  expect(lecture().importedNotebook!.progress).toEqual(before.progress)
  expect(lecture().importedNotebook!.history).toEqual(before.history)
  expect(JSON.parse(container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value)).toEqual({ ...before.current, entries: [before.current.entries[0]] })
  expect(button('Copy prompt').disabled).toBe(true)
  expect(button('I already have the current notebook and images').getAttribute('aria-pressed')).toBe('false')
})
it('stops copying and downloading immediately if content changes while the prompt step is open', async () => {
  await click('Update');await click('I already have the current notebook and images');await click('Copy prompt')
  expect(button('Copy prompt').disabled).toBe(false)
  await act(async () => notebookTransaction(state => { state.academics.classCenter.lectures[0].importedNotebook!.current.entries[0].title = 'Changed while prompt was open' }))
  expect(button('Copy prompt').disabled).toBe(true)
  expect(container.querySelector<HTMLButtonElement>('.nai-file button')!.disabled).toBe(true)
  expect([...container.querySelectorAll<HTMLButtonElement>('.nai-actions button')].find(button=>button.textContent?.trim()==='Download')!.disabled).toBe(true)
  expect(button('Copy prompt').disabled).toBe(true)
  expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value).toBe('')
  expect(container.textContent).toContain('Restart from the latest saved version')
})
it('uses the exact canonical update prompt for preview, clipboard and download with a separate saved JSON', async () => {
  const blobs: Blob[] = [], names: string[] = []
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: (blob: Blob) => { blobs.push(blob); return 'blob:update-test' } })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download) })
  await click('Update')
  const prompt = container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]')!.value
  expect(prompt.startsWith('# Update my Premed OS notebook: review\n\n')).toBe(true)
  expect(prompt).toContain('complete prompt works in a fresh AI chat')
  await act(async()=>container.querySelector<HTMLButtonElement>('.nai-file button')!.click());await click('Copy prompt')
  await act(async () => container.querySelector('.en-prompt-detail summary')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  await act(async()=>[...container.querySelectorAll<HTMLButtonElement>('.nai-actions button')].find(button=>button.textContent?.trim()==='Download')!.click())
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
  await click('Update');await click('I already have the current notebook and images')
  await act(async () => notebookTransaction(state => { const n = state.academics.classCenter.lectures[0].importedNotebook!; n.notes = 'New independent note'; n.progress['question-mapping'].response = 'A newer independent response' }))
  expect(button('Copy prompt').disabled).toBe(false)
  expect(container.querySelector<HTMLButtonElement>('.nai-file button')!.disabled).toBe(false)
  const baseline = container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value
  expect(baseline).not.toContain('New independent note')
  expect(baseline).not.toContain('A newer independent response')
})

it('downloads current, original and backup JSON with their actual titles and exact export bytes', async () => {
  const blobs: Blob[] = [], names: string[] = []
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: (blob: Blob) => { blobs.push(blob); return 'blob:title-test' } })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download) })
  await click('Edit notebook'); await fill('Entry title', 'Current: lesson/notes'); await click('Save edits')
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
  await click('Edit notebook'); await fill('Entry title', 'Current: lesson/notes'); await click('Save edits')
  const before = JSON.stringify(lecture().importedNotebook)
  await click(kind === 'current' ? 'Download current notebook + images' : 'Download complete portable backup')
  await vi.waitFor(() => expect(names).toEqual(['Current- lesson-notes.zip']))
  if (kind === 'current') expect(currentBundle).toHaveBeenCalledWith(exportNotebook(lecture(), 'current'), [], expect.anything())
  else expect(backupBundle).toHaveBeenCalledWith(lecture().importedNotebook, course.id, expect.anything())
  expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
  expect(JSON.stringify(lecture().importedNotebook)).toBe(before)
})

it('returns from update to Study guide while retaining its draft and saved study records', async () => {
  await click('Practice'); await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture()))
  const before = JSON.stringify(lecture().importedNotebook)
  const sessionBefore = JSON.stringify({ ...sessionStorage })
  await click('Back to saved entry')
  expect(button('Study guide').getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelector('.nbr-doc')?.getAttribute('data-reader-mode')).toBe('study')
  expect(JSON.stringify(lecture().importedNotebook)).toBe(before)
  expect(JSON.stringify({ ...sessionStorage })).toBe(sessionBefore)
  await click('Update')
  expect(container.querySelector<HTMLTextAreaElement>('.en-paste textarea')!.value).toBe(JSON.stringify(correctedFixture()))
})
it.each(['Save edits', 'Cancel edits'])('returns to Study guide after %s without changing notes or practice progress', async action => {
  const before = structuredClone(lecture().importedNotebook!)
  await click('Practice'); await click('Edit notebook'); await fill('Entry title', 'My revised title'); await click(action)
  expect(button('Study guide').getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelector('.nbr-doc')?.getAttribute('data-reader-mode')).toBe('study')
  expect(lecture().importedNotebook!.notes).toBe(before.notes)
  expect(lecture().importedNotebook!.progress).toEqual(before.progress)
  expect(lecture().importedNotebook!.current.entries[0].title).toBe(action === 'Save edits' ? 'My revised title' : before.current.entries[0].title)
  if (action === 'Save edits') expect(lecture().importedNotebook!.history!.at(-1)!.current).toEqual(before.current)
  else expect(lecture().importedNotebook!.history).toEqual(before.history)
})

it('reopens an existing update draft without requiring another workspace write', async () => {
  await click('Update')
  const draft = JSON.stringify(lecture().importedNotebook!.updateSession)
  await click('Back to saved entry')
  const set = Storage.prototype.setItem
  const writes: string[] = []
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(this: Storage, key, value) {
    if (this === localStorage) { writes.push(key); throw new DOMException('Storage temporarily unavailable', 'UnknownError') }
    return set.call(this, key, value)
  })
  await click('Update')
  expect(container.querySelector('[aria-label="Update saved notebook"]')).toBeTruthy()
  expect(writes).toEqual([])
  expect(JSON.stringify(lecture().importedNotebook!.updateSession)).toBe(draft)
})

it('reports the selected destination when an update is saved as a separate notebook in another class', async () => {
  const destination={...course,id:'separate-destination',code:'OTHER 101',title:'Other class'}
  await act(async()=>useStore.getState().update(state=>{state.courses.push(destination)}))
  const navigate=vi.fn()
  function DestinationHarness(){const current=useStore(state=>state.academics.classCenter.lectures.find(item=>item.id===id)!);return <ExternalNotebookView lecture={current} courseCode={course.code} onNavigateEntry={navigate} />}
  await act(async()=>root.render(<DestinationHarness />))
  const before=structuredClone(lecture().importedNotebook)
  await toImport()
  const proposal=correctedFixture();proposal.course={code:destination.code,title:destination.title,term:destination.term}
  await fill('Paste complete JSON',JSON.stringify(proposal));await click('Validate and preview')
  await check('Save as separate entries instead');await click('Save to OTHER 101');await click('Save notebook')
  const saved=useStore.getState().academics.classCenter.lectures.find(item=>item.courseId===destination.id)!
  expect(saved).toBeTruthy();expect(navigate).toHaveBeenCalledWith(saved.id,destination.id)
  expect(lecture().importedNotebook!.current).toEqual(before!.current)
  expect(lecture().importedNotebook!.notes).toEqual(before!.notes)
  expect(lecture().importedNotebook!.progress).toEqual(before!.progress)
})

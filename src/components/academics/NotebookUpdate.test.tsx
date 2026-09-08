import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { createInitialDataForMode, STORAGE_KEY, useStore } from '@/store/store'
import { ExternalNotebookView, notebookTransaction } from './ExternalNotebookView'
import { importNotebook, exportNotebook } from '@/lib/academics/notebook/import'
import { prepareNotebook } from '@/lib/academics/notebook/package'
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
  const field = [...container.querySelectorAll('label')].find(l => l.childNodes[0]?.textContent?.trim() === label)?.querySelector('textarea')!
  expect(field, label).toBeTruthy(); await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) })
}
async function check(text: string) { const box = [...container.querySelectorAll('label')].find(l => l.textContent?.includes(text))?.querySelector<HTMLInputElement>('input[type="checkbox"]')!; expect(box, text).toBeTruthy(); await act(async () => box.click()) }
async function toImport() {
  await click('Update with new material'); await click('Next'); await click('Copy full prompt')
  expect(button('Next').disabled).toBe(true)
  await click('I have the baseline file or full JSON'); await click('Next'); await click('I have my JSON'); await click('Next')
}
async function preview() { await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture())); await click('Validate and preview') }
it('requires saved edits/notes, uses the same goal and names the real saved baseline', async () => {
  await click('Edit entry'); await fill('Entry title', 'My saved wording'); await click('Update with new material')
  expect(container.textContent).toContain('Save your edits and notes'); expect(lecture().importedNotebook!.updateSession).toBeUndefined()
  await click('Save edits'); await click('Update with new material')
  expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0)
  expect(container.textContent).toContain('My saved wording'); await click('Next')
  const prompt = container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]') ?? container.querySelector<HTMLTextAreaElement>('.en-code-body textarea')!
  const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(prompt.value)![1])
  expect(JSON.parse(request.revisionInput).entryId).toBe(pkg.entries[0].id)
  const baseline = container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value
  expect(JSON.parse(baseline).entries[0].title).toBe('My saved wording')
  expect(baseline).not.toContain('Protected notes'); expect(baseline).not.toContain('"complete"')
  expect(lecture().importedNotebook!.notes).toBe('Protected notes')
})
it('keeps the baseline/prompt and JSON gates with Back and same-tab reload', async () => {
  await toImport(); await fill('Paste complete JSON', JSON.stringify(correctedFixture()))
  await act(async () => root.unmount()); root = createRoot(container); await act(async () => root.render(<Harness />))
  expect(container.querySelector('h1')?.textContent).toBe('Import your notebook')
  expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeNull()
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toContain('200 milliseconds')
  await click('Back to AI steps'); expect(container.textContent).toContain('Done uploading ends intake; it is not approval')
  await click('Back to prompt'); expect(button('Next').disabled).toBe(false)
})
it('shows readable differences and explicit acceptance, preserves independent practice through store reload', async () => {
  await preview()
  expect(container.textContent).toContain('Hypothetical task: how long is the shape shown?')
  expect(container.textContent).toContain('Source / excerpts'); expect(button('Accept update to this entry').disabled).toBe(true)
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

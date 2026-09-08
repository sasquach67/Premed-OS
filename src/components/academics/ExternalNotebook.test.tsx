import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { JournalEntryPage } from '@/pages/JournalEntryPage'
import { createInitialDataForMode, STORAGE_KEY, useStore } from '@/store/store'
import { NotebookImportPanel } from './NotebookImportPanel'
import { ExternalNotebookView, notebookTransaction } from './ExternalNotebookView'
import { ExternalNotebookWorkflow } from './ExternalNotebookWorkflow'
import { importNotebook, exportNotebook } from '@/lib/academics/notebook/import'
import { prepareNotebook } from '@/lib/academics/notebook/package'
import review from '@/lib/academics/notebook/fixtures/fixture-review.json'
import type { Course } from '@/lib/types'
let root: Root, container: HTMLDivElement
const imported = vi.fn()
const course: Course = { id: 'test-notebook', code: review.course.code, title: review.course.title, term: review.course.term ?? 'Fall 2026', credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }
const raw = JSON.stringify(review)
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  const data = createInitialDataForMode(false); data.courses = [course]; useStore.getState().replaceAll(data); imported.mockClear()
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks() })
async function click(label: string) { const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent?.trim() === label)!; expect(button, label).toBeTruthy(); await act(async () => button.click()); if (label === 'Validate and preview' || label.startsWith('Save editable')) await vi.waitFor(async () => { await act(async () => {}); expect(container.textContent).not.toContain('Checking package...'); expect(container.querySelector('input[type="file"]')?.hasAttribute('disabled')).not.toBe(true) }, { timeout: 10000, interval: 20 }) }
async function fill(label: string, text: string) { const el = [...container.querySelectorAll<HTMLLabelElement>('label')].find(l => l.childNodes[0]?.textContent?.trim() === label)?.querySelector('textarea,input') as HTMLTextAreaElement | HTMLInputElement; expect(el, label).toBeTruthy(); await act(async () => { Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })) }) }
async function renderImport() { await act(async () => root.render(<NotebookImportPanel courseId={course.id} onImported={imported} />)) }
it('journal new route opens the external workflow with three mutually exclusive goals and direct import', async () => {
  await act(async () => root.render(<MemoryRouter initialEntries={['/academics/classes/test-notebook/journal/new']}><Routes><Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} /></Routes></MemoryRouter>))
  expect(container.textContent).toContain('Choose your goal'); expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(3)
  expect(container.textContent).toContain('Already have JSON? Import directly')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('does not save before preview/explicit save and identifies exact malformed field for repair', async () => {
  await renderImport(); await fill('Paste complete JSON', raw.replace('"status":"supported"', '"status":"invalid"')); await click('Validate and preview')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('$.entries[0].requirements[0].status')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await fill('Paste complete JSON', raw); await click('Validate and preview')
  expect(container.textContent).toContain(`Save to ${course.code}`); expect(container.textContent).toContain('supported:')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await click(`Save editable entry to ${course.code}`)
  expect(imported).toHaveBeenCalledTimes(1); expect(useStore.getState().academics.classCenter.lectures).toHaveLength(1)
})
it('rejects destination removed between validation and save', async () => {
  await renderImport(); await fill('Paste complete JSON', raw); await click('Validate and preview')
  await act(async () => useStore.getState().update(state => { state.courses = [] }))
  expect(container.textContent).toContain('Destination class not found')
  expect(container.textContent).not.toContain(`Save editable entry to ${course.code}`)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('keeps answers behind reveal and persists manual edits/response/notes through actual store reload', async () => {
  const p = await prepareNotebook(raw); let id = ''
  useStore.getState().update(state => { [id] = importNotebook(state.academics.classCenter, course, p) })
  function Harness() { const lecture = useStore(s => s.academics.classCenter.lectures.find(l => l.id === id)!); return <ExternalNotebookView lecture={lecture} courseCode={course.code} /> }
  await act(async () => root.render(<Harness />))
  await click('Practice')
  const answer = container.querySelector<HTMLDetailsElement>('.en-answer')!; expect(answer.open).toBe(false)
  const practice = p.package.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  await fill('Your response', 'My attempted answer')
  await fill('My notes', 'My independent note'); await click('Save notes')
  await click('Edit content'); await fill('Entry title', 'My edited notebook'); await click('Save edits')
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(disk.state.academics.classCenter.lectures[0].importedNotebook.progress[practice.id].response).toBe('My attempted answer')
  await act(async () => root.unmount()); root = createRoot(container)
  useStore.setState({ academics: createInitialDataForMode(false).academics })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(disk))
  await act(async () => useStore.persist.rehydrate())
  await act(async () => root.render(<Harness />))
  const saved = useStore.getState().academics.classCenter.lectures.find(l => l.id === id)!
  expect(saved.title).toBe('My edited notebook'); expect(saved.importedNotebook!.notes).toBe('My independent note')
  expect(exportNotebook(saved, 'original')).toBe(raw)
  expect(JSON.parse(exportNotebook(saved, 'current')).entries[0].title).toBe('My edited notebook')
})
it('rolls back a failed storage write and reports failure rather than saved success', async () => {
  const before = useStore.getState().academics
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
  expect(() => notebookTransaction(state => { state.academics.classCenter.lectures = [] })).toThrow('Browser storage could not save')
  expect(useStore.getState().academics).toEqual(before)
  write.mockRestore()
})
it('uses one exact prompt for preview, clipboard and download after assessment customization', async () => {
  const clipboard = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } })
  const blobs: Blob[] = []; Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: (blob: Blob) => { blobs.push(blob); return 'blob:fixture' } }); Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() }); vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  await act(async () => root.render(<ExternalNotebookWorkflow courseId={course.id} onImported={imported} />))
  await act(async () => container.querySelector<HTMLInputElement>('input[value="assessment"]')!.click()); await click('Customize prompt (optional)')
  expect(container.textContent).toContain("Start with the instructor's review sheet")
  await fill('Included lessons, readings, and assessment topics', 'Lessons 1-5 and readings A-B')
  await fill('Assessment format (leave blank if unknown)', 'Short answer')
  await fill('Other materials you will attach', 'Exam review sheet and five lesson PDFs')
  const additionalInstructions = 'Keep "quoted wording".\nSecond line: $& literal {{COURSE_CODE}}'
  await fill('Additional instructions for your AI', additionalInstructions)
  await click('View full prompt')
  const beforeCopy = container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  await click('Copy full prompt')
  expect(container.querySelector('h1')?.textContent).toBe('Use it in your AI')
  expect(container.textContent).toContain('Full prompt copied.')
  await click('Back to prompt')
  const details = container.querySelector<HTMLDetailsElement>('.en-prompt-detail')!
  await act(async () => details.querySelector('summary')!.click())
  expect(details.open).toBe(true)
  await click('Download full prompt')
  const preview = container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  expect(preview).toBe(beforeCopy)
  expect(clipboard).toHaveBeenCalledWith(preview)
  const downloaded = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsText(blobs[0]) })
  expect(downloaded).toBe(preview); expect(preview).toContain('Lessons 1-5'); expect(preview).toContain('Short answer')
  expect(JSON.parse(/```json\n([\s\S]*?)\n```/.exec(preview)![1]).userRequest).toBe(additionalInstructions)
})
it('keeps the copy step and offers the full preview and download when clipboard access fails', async () => {
  const clipboard = vi.fn().mockRejectedValue(new Error('Clipboard unavailable'))
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } })
  await act(async () => root.render(<ExternalNotebookWorkflow courseId={course.id} onImported={imported} />))
  await click('View full prompt'); await click('Copy full prompt')
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Download the full prompt or select it in the preview below.')
  const details = container.querySelector<HTMLDetailsElement>('.en-prompt-detail')!
  await act(async () => details.querySelector('summary')!.click())
  expect(details.open).toBe(true)
  const preview = details.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  expect(preview.length).toBeGreaterThan(1000)
  expect(clipboard).toHaveBeenCalledWith(preview)
  const download = [...details.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Download full prompt')!
  expect(download).toBeTruthy(); expect(download.disabled).toBe(false)
  expect(imported).not.toHaveBeenCalled()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('rejects a stale notebook write after another tab changes persisted content', async () => {
  const p = await prepareNotebook(raw)
  useStore.getState().update(state => { importNotebook(state.academics.classCenter, course, p) })
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  disk.state.academics.classCenter.lectures[0].importedNotebook.notes = 'Newer work from another tab'
  localStorage.setItem(STORAGE_KEY, JSON.stringify(disk))
  const before = useStore.getState().academics
  expect(() => notebookTransaction(state => { state.academics.classCenter.lectures[0].title = 'Stale writer' })).toThrow('another tab')
  expect(useStore.getState().academics).toBe(before)
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.academics.classCenter.lectures[0].importedNotebook.notes).toBe('Newer work from another tab')
})
it('does not mistake ordinary undefined optional fields for another-tab changes after hydration', () => {
  useStore.getState().update(state => { state.courses[0].notes = undefined; state.academics.classCenter.workspaces[0].externalNotebookPreferences = undefined })
  expect(() => notebookTransaction(state => { state.academics.classCenter.workspaces[0].externalNotebookPreferences = 'Saved locally after hydration' })).not.toThrow()
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.academics.classCenter.workspaces[0].externalNotebookPreferences).toBe('Saved locally after hydration')
})
it('preserves response progress even for a valid imported ID matching an object prototype name', async () => {
  const fixture = JSON.parse(raw)
  fixture.entries[0].sections.find((s: { purpose: string }) => s.purpose === 'practice').blocks[0].id = '__proto__'
  fixture.entries[0].objectives[0].practiceBlockIds = ['__proto__']
  const p = await prepareNotebook(JSON.stringify(fixture)); let id = ''
  useStore.getState().update(state => { [id] = importNotebook(state.academics.classCenter, course, p) })
  function Harness() { const lecture = useStore(s => s.academics.classCenter.lectures.find(l => l.id === id)!); return <ExternalNotebookView lecture={lecture} courseCode={course.code} /> }
  await act(async () => root.render(<Harness />)); await click('Practice'); await fill('Your response', 'My response stays attached to this exact ID')
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(Object.hasOwn(disk.state.academics.classCenter.lectures[0].importedNotebook.progress, '__proto__')).toBe(true)
  expect(disk.state.academics.classCenter.lectures[0].importedNotebook.progress.__proto__.response).toBe('My response stays attached to this exact ID')
})

import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { prepareNotebook } from '@/lib/academics/notebook/package'
import { importNotebook } from '@/lib/academics/notebook/import'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import { generateRevisedNotes } from '@/lib/academics/generateRevisedNotes'
import type { Course } from '@/lib/types'
import * as notebookView from './ExternalNotebookView'
import { RevisedNotesPromptPanel } from './RevisedNotesPromptPanel'

vi.mock('@/lib/academics/generateRevisedNotes', () => ({ generateRevisedNotes: vi.fn() }))
const pkg = revisionFixture()
const course: Course = { id: 'revision-course', code: pkg.course.code, title: pkg.course.title, term: pkg.course.term!, credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }
let root: Root, container: HTMLDivElement, id: string
const writeText = vi.fn()
const lecture = () => useStore.getState().academics.classCenter.lectures.find(item => item.id === id)!
function promptText() { return container.querySelector<HTMLTextAreaElement>('[aria-label="Complete revised notes prompt"]')! }
function button(label: string) { const found = [...container.querySelectorAll('button')].find(item => item.textContent?.trim() === label); expect(found, label).toBeTruthy(); return found! }
async function click(label: string) { await act(async () => button(label).click()) }
async function render(lectureId = id) { await act(async () => root.render(<MemoryRouter><RevisedNotesPromptPanel courseId={course.id} courseLabel={course.code} lectureId={lectureId} /></MemoryRouter>)) }
beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sessionStorage.clear()
  const data = createInitialDataForMode(false); data.courses = [course]
  useStore.getState().replaceAll(data)
  const prepared = await prepareNotebook(JSON.stringify(pkg))
  await notebookView.notebookTransaction(state => {
    [id] = importNotebook(state.academics.classCenter, course, prepared)
    const n = state.academics.classCenter.lectures[0].importedNotebook!
    n.notes = 'Private student note never sent to AI'
    n.progress = { 'question-mapping': { response: 'Private practice response', complete: true } }
  })
  writeText.mockReset(); writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('prepares and copies a complete prompt without a notes description or any legacy API generation', async () => {
  const before = structuredClone(lecture().importedNotebook!)
  await render()
  expect(lecture().importedNotebook!.updateSession).toBeUndefined()
  await click('Prepare complete prompt')
  expect(lecture().importedNotebook!.updateSession).toBeDefined()
  const prompt = promptText().value
  expect(prompt).toContain('ask which accessible file contains my own authored notes')
  expect(prompt).toContain('Complete notebook format and delivery contract')
  expect(prompt).toContain('premed-os-notebook-package')
  expect(prompt).not.toContain(before.notes)
  expect(prompt).not.toContain('Private practice response')
  await click('Copy complete prompt')
  expect(writeText).toHaveBeenCalledExactlyOnceWith(prompt)
  expect(generateRevisedNotes).not.toHaveBeenCalled()
  expect(lecture().importedNotebook!.current).toEqual(before.current)
  expect(lecture().importedNotebook!.original).toEqual(before.original)
  expect(lecture().importedNotebook!.notes).toBe(before.notes)
  expect(lecture().importedNotebook!.progress).toEqual(before.progress)
})

it('does not substitute an available notebook for an invalid explicitly selected journal', async () => {
  await render('not-in-this-class')
  expect(container.textContent).toContain('Journal unavailable in this class')
  expect(container.textContent).not.toContain('Prepare complete prompt')
  expect(container.querySelector('[aria-label="Complete revised notes prompt"]')).toBeNull()
  expect(lecture().importedNotebook!.updateSession).toBeUndefined()
})

it('offers the exact full prompt as a read-only manual fallback and download', async () => {
  writeText.mockRejectedValue(new Error('Clipboard denied'))
  const download = vi.spyOn(notebookView, 'downloadNotebookText').mockImplementation(() => {})
  await render(); await click('Prepare complete prompt'); await click('Copy complete prompt')
  expect(promptText().readOnly).toBe(true)
  expect(promptText().closest('details')?.open).toBe(true)
  expect(promptText().value).toBe(writeText.mock.calls[0][0])
  expect(container.textContent).toContain('Clipboard unavailable')
  await click('Download prompt')
  expect(download).toHaveBeenLastCalledWith('revised-notes-prompt.md', promptText().value, 'text/markdown;charset=utf-8')
  await click('Download saved notebook JSON')
  const baseline = JSON.parse(download.mock.calls.at(-1)![1])
  expect(baseline).toEqual(lecture().importedNotebook!.updateSession!.baseline)
  expect(JSON.stringify(baseline)).not.toContain('Private student note')
})

it('disables handoff after saved content changes and explicitly restarts with the latest baseline', async () => {
  await render(); await click('Prepare complete prompt')
  const previous = lecture().importedNotebook!.updateSession!.id
  await act(async () => {
    await notebookView.notebookTransaction(state => { state.academics.classCenter.lectures.find(item => item.id === id)!.importedNotebook!.current.entries[0].title = 'Newer saved notebook title' })
  })
  expect(container.textContent).toContain('This notebook or its update session changed')
  for (const label of ['Copy complete prompt', 'Download prompt', 'Download saved notebook JSON', 'Import revised notes']) expect(button(label).disabled).toBe(true)
  await click('Copy complete prompt')
  expect(writeText).not.toHaveBeenCalled()
  await click('Restart from latest saved notebook')
  expect(lecture().importedNotebook!.updateSession!.id).not.toBe(previous)
  expect(lecture().importedNotebook!.updateSession!.baseline.entries[0].title).toBe('Newer saved notebook title')
  expect(button('Copy complete prompt').disabled).toBe(false)
})

it('reuses an existing saved session only when the student prepares the prompt', async () => {
  await render(); await click('Prepare complete prompt')
  const session = structuredClone(lecture().importedNotebook!.updateSession!)
  await act(async () => root.unmount()); root = createRoot(container)
  await render()
  expect(container.querySelector('[aria-label="Complete revised notes prompt"]')).toBeNull()
  await click('Prepare complete prompt')
  expect(lecture().importedNotebook!.updateSession).toEqual(session)
  expect(button('Copy complete prompt').disabled).toBe(false)
})

import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { prepareNotebook } from '@/lib/academics/notebook/package'
import { importNotebook } from '@/lib/academics/notebook/import'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import type { Course, LectureRecord } from '@/lib/types'
import * as notebookView from './ExternalNotebookView'
import { FlashcardPromptPanel } from './FlashcardPromptPanel'

vi.mock('@/lib/academics/flashcards/prompt', () => ({
  flashcardNotebookEligibility: () => ({ eligible: true, reason: '' }),
  buildFlashcardPrompt: vi.fn(({ lecture }: { lecture: LectureRecord }) => `Complete prompt for ${lecture.id}`),
}))
const pkg = revisionFixture()
const course: Course = { id: 'cards-course', code: pkg.course.code, title: pkg.course.title, term: pkg.course.term!, credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }
let root: Root, container: HTMLDivElement, id: string
const writeText = vi.fn()
const saved: { filename: string; blob: Blob }[] = []
function button(label: string) { const found = [...container.querySelectorAll('button')].find(item => item.textContent?.trim() === label); expect(found, label).toBeTruthy(); return found! }
async function click(label: string) { await act(async () => button(label).click()) }
async function render() { await act(async () => root.render(<MemoryRouter><FlashcardPromptPanel courseId={course.id} courseLabel={course.code} lectureId={id} onClose={() => {}} /></MemoryRouter>)) }
beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const data = createInitialDataForMode(false); data.courses = [course]
  useStore.getState().replaceAll(data)
  const prepared = await prepareNotebook(JSON.stringify(pkg))
  await notebookView.notebookTransaction(state => { [id] = importNotebook(state.academics.classCenter, course, prepared) })
  writeText.mockReset(); writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  saved.length = 0
  let pending: Blob | undefined
  vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => { pending = blob as Blob; return 'blob:notebook' })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { saved.push({ filename: this.download, blob: pending! }) })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('marks the notebook required and lecture materials recommended', async () => {
  await render()
  const inputs = container.querySelector('[aria-label="What to attach in your AI chat"]')!
  expect([...inputs.querySelectorAll('li')].map(item => item.textContent)).toEqual(['NotebookRequired', 'Lecture materialsRecommended'])
  expect(container.textContent).not.toContain('Downloads, notes and history')
  expect(container.querySelector('ol')?.textContent).toContain('Get your notebook.')
  expect(container.querySelector('ol')?.textContent).toContain('Open a new AI chat and attach it.')
})
it('holds the prompt until the student downloads the notebook or says they have it', async () => {
  await render()
  expect(button('Copy complete prompt').disabled).toBe(true)
  expect(button('Download prompt').disabled).toBe(true)
  expect(button('I already have it').getAttribute('aria-pressed')).toBe('false')
  await click('I already have it')
  expect(button('I already have it').getAttribute('aria-pressed')).toBe('true')
  expect(button('Copy complete prompt').disabled).toBe(false)
  await click('Copy complete prompt')
  expect(writeText).toHaveBeenCalledExactlyOnceWith(`Complete prompt for ${id}`)
  expect(saved).toEqual([])
})
it('downloads the current saved notebook from this page without changing saved content', async () => {
  const before = JSON.stringify(useStore.getState().academics.classCenter)
  await render()
  await click('Download notebook')
  expect(saved).toHaveLength(1)
  expect(saved[0].filename).toMatch(/\.(json|zip)$/)
  if (saved[0].filename.endsWith('.json')) {
    const downloaded = JSON.parse(await saved[0].blob.text()) as { entries: { id: string }[] }
    expect(downloaded.entries.map(entry => entry.id)).toEqual([useStore.getState().academics.classCenter.lectures.find(item => item.id === id)!.importedNotebook!.entryId])
  }
  expect(container.textContent).toMatch(/Notebook (and its images )?downloaded/)
  expect(button('Copy complete prompt').disabled).toBe(false)
  expect(JSON.stringify(useStore.getState().academics.classCenter)).toBe(before)
})

import { act } from 'react'
import { webcrypto } from 'node:crypto'
import { Blob as NodeBlob } from 'node:buffer'
import review from '@/lib/academics/notebook/fixtures/fixture-review.json'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import { readNotebookZip } from '@/lib/academics/notebook/notebookZip'
import { exportNotebookPackageBundle } from '@/lib/academics/notebook/notebookBundle'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import type { LectureRecord } from '@/lib/types'
import { FlashcardPromptPanel } from './FlashcardPromptPanel'
import { buildFlashcardPrompt } from '@/lib/academics/flashcards/prompt'
vi.mock('@/lib/academics/notebook/notebookBundle', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/academics/notebook/notebookBundle')>()
  return { ...actual, exportNotebookPackageBundle: vi.fn(actual.exportNotebookPackageBundle) }
})
const exportBundle = vi.mocked(exportNotebookPackageBundle)
const blobs: Blob[] = []
const downloads: string[] = []
const nativeObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
const nativeRevokeURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
beforeAll(() => {
  vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('Blob', NodeBlob)
  if (!nativeObjectURL) Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => '' })
  if (!nativeRevokeURL) Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} })
})
afterAll(() => {
  if (!nativeObjectURL) Reflect.deleteProperty(URL, 'createObjectURL')
  if (!nativeRevokeURL) Reflect.deleteProperty(URL, 'revokeObjectURL')
  vi.unstubAllGlobals()
})
const nativeScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
beforeAll(() => { if (!nativeScrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: () => {} }) })
afterAll(() => { if (!nativeScrollIntoView) Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView') })
async function openSelect(selector: string) {
  const trigger = container.querySelector<HTMLButtonElement>(selector)!
  expect(trigger).toBeTruthy()
  await act(async () => { trigger.focus(); trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
}
async function chooseOption(selector: string, label: string) {
  await openSelect(selector)
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(item => item.textContent?.trim() === label)!
  expect(option).toBeTruthy()
  await act(async () => { option.focus(); option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) })
}


vi.mock('@/lib/academics/flashcards/prompt', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/academics/flashcards/prompt')>(),
  buildFlashcardPrompt: vi.fn(({ lecture }: { lecture: LectureRecord }) => `Complete prompt for ${lecture.id}\nAll instructions\n<style>exact card CSS</style>\nbuild_deck.py\nverify_deck.py`),
}))
let container: HTMLDivElement, root: Root
const close = vi.fn()
const writeText = vi.fn()
const journal = (id: string, courseId = 'course', complete = true): LectureRecord => {
  const original = structuredClone(review) as NotebookPackage
  original.entries[0].id = `entry-${id}`
  const current = structuredClone(original)
  current.entries[0].title = `Current ${id}`; current.entries[0].revision = 2; current.entries[0].baseRevision = 1
  return { id, courseId, title: `Journal ${id}`, inputPath: 'materials', processingState: 'ready', workspaceState: complete ? 'complete' : 'draft', createdAt: 1, updatedAt: 1, order: 0,
    importedNotebook: { original, current, originalRaw: JSON.stringify(original), entryId: `entry-${id}`, fingerprint: 'fixture', importedAt: 1, progress: {}, notes: '', assetBindings: [] } }
}
function Location() { return <output aria-label="Current route">{useLocation().pathname}</output> }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  useStore.getState().replaceAll(createInitialDataForMode(false))
  vi.clearAllMocks(); blobs.length = 0; downloads.length = 0; writeText.mockReset(); writeText.mockResolvedValue(undefined)
  vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => { blobs.push(blob as Blob); return 'blob:qa-download' })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download) })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks() })
function seed(lectures: LectureRecord[]) { useStore.getState().update(draft => { draft.academics.classCenter.lectures = lectures }) }
async function render(lectureId?: string) { await act(async () => root.render(<MemoryRouter><FlashcardPromptPanel courseId="course" courseLabel="BIO 103" lectureId={lectureId} onClose={close} /><Location /></MemoryRouter>)) }
function button(label: string) { const element = [...container.querySelectorAll('button')].find(item => item.textContent?.trim() === label); expect(element, label).toBeTruthy(); return element! }
async function click(label: string) { await act(async () => button(label).click()) }

it('requires a completed Journal and routes to the existing notebook workflow', async () => {
  seed([journal('draft', 'course', false)]); await render()
  expect(container.textContent).toContain('Create and save a completed Class Journal')
  expect(container.textContent).not.toContain('Copy complete prompt')
  expect(buildFlashcardPrompt).not.toHaveBeenCalled()
  await click('Create or import Class Journal')
  expect(container.querySelector('output')?.textContent).toBe('/academics/classes/course/journal/new')
  expect(close).toHaveBeenCalledOnce()
})
it('only offers Journals from the current class and disables unfinished entries', async () => {
  seed([journal('other-class', 'other'), journal('unfinished', 'course', false), journal('ready')]); await render()
  expect(container.textContent).not.toContain('Journal other-class')
  expect(container.querySelector('[role="combobox"][aria-label="Class Journal"]')?.textContent).toContain('Journal ready')
  await openSelect('[role="combobox"][aria-label="Class Journal"]')
  const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
  expect(options.some(item => item.textContent?.includes('other-class'))).toBe(false)
  expect(options.find(item => item.textContent?.includes('Journal unfinished'))?.getAttribute('aria-disabled')).toBe('true')
  await act(async () => document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  await click('I have the notebook folder'); await click('Copy complete prompt')
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Complete prompt for ready'))
})
it.each(['missing', 'other-class', 'unfinished'])('never substitutes a different Journal for the scoped %s lecture', async id => {
  seed([journal('other-class', 'other'), journal('unfinished', 'course', false), journal('ready')]); await render(id)
  expect(container.querySelector('[role="combobox"][aria-label="Class Journal"]')).toBeNull()
  expect(container.textContent).not.toContain('Copy complete prompt')
  expect(buildFlashcardPrompt).not.toHaveBeenCalled()
})
it('copies the whole prompt and preserves all saved content', async () => {
  seed([journal('ready')]); const before = JSON.stringify(useStore.getState().academics.classCenter); await render('ready')
  await click('I have the notebook folder')
  const fullPrompt = container.querySelector('textarea')!.value
  expect(fullPrompt).toContain('exact card CSS'); expect(fullPrompt).toContain('verify_deck.py')
  await click('I have the notebook folder'); await click('Copy complete prompt')
  expect(writeText).toHaveBeenCalledExactlyOnceWith(fullPrompt)
  expect(container.textContent).toContain('Complete prompt copied')
  expect(container.querySelector('[aria-label="Lecture materials: Recommended"]')).toBeTruthy()
  expect(container.textContent).not.toContain('Downloads, notes and history')
  expect(container.querySelector('ol')?.textContent).toContain('Get your notebook.')
  expect(container.querySelector('ol')?.textContent).toContain('Open a new AI chat and attach your notebook.')
  expect(container.querySelector('ol')?.textContent).toContain('Attach the original lecture files too if you have them (recommended).')
  expect(container.querySelector('ol')?.textContent).toContain('Copy the complete prompt and paste it into that chat.')
  expect(container.textContent).not.toContain('Try to find the chat where you uploaded')
  expect(container.textContent).not.toContain('return to the original chat')
  expect(container.textContent).toContain('finished deck goes directly into Anki')
  expect(JSON.stringify(useStore.getState().academics.classCenter)).toBe(before)
})
it('shows the missed-question concept-card tip with the complete prompt actions', async () => {
  seed([journal('ready')]); await render('ready')
  expect(container.textContent).toContain('Tip: Missed a practice or mock-exam question? Paste it into the same chat along with this prompt. The deck adds a card or two on the concept you missed, not a copy of the question.')
  expect(button('Copy complete prompt').disabled).toBe(true)
  await click('I have the notebook folder')
  expect(button('Copy complete prompt').disabled).toBe(false)
})
it('opens a read-only complete fallback when clipboard access fails', async () => {
  seed([journal('ready')]); writeText.mockRejectedValue(new Error('Denied')); await render()
  await click('I have the notebook folder'); await click('Copy complete prompt')
  expect(container.textContent).toContain('Clipboard access was unavailable')
  expect(container.querySelector('textarea')?.closest('details')?.open).toBe(true)
  const textarea = container.querySelector('textarea')!
  expect(textarea.readOnly).toBe(true)
  expect(textarea.value).toBe(writeText.mock.calls[0][0])
  await click('Select all prompt text')
  expect(textarea.selectionStart).toBe(0); expect(textarea.selectionEnd).toBe(textarea.value.length)
})
it('clears the old copy acknowledgment when a different Journal is selected', async () => {
  seed([journal('first'), journal('second')]); await render(); await click('I have the notebook folder'); await click('Copy complete prompt')
  await chooseOption('[role="combobox"][aria-label="Class Journal"]', 'Journal second')
  expect(button('Copy complete prompt').disabled).toBe(true)
  expect(container.textContent).not.toContain('Complete prompt copied')
  await click('I have the notebook folder'); await click('Copy complete prompt')
  expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('Complete prompt for second'))
})

it('shows matching Guide directions and sends adjusted selection to the handoff builder', async () => {
  seed([journal('ready')])
  useStore.getState().update(state => state.academics.classCenter.notes.push({ id: 'guide', courseId: 'course', title: 'Explain how the anthropologist knows.', content: '', type: 'other', kind: 'about-class', topicIds: [], linkedFileIds: [], syncStatus: 'local-only', createdAt: 1, updatedAt: 1, order: 0, studentGuidance: { group: 'approach', scope: { kind: 'course' }, origin: 'manual' } }))
  await render('ready')
  const preview = container.querySelector('[aria-label="Using your Guide"]')!
  expect(preview.textContent).toContain('Explain how the anthropologist knows.')
  expect(buildFlashcardPrompt).toHaveBeenLastCalledWith(expect.objectContaining({ guideDirections: [expect.objectContaining({ id: 'guide' })] }))
  await act(async () => preview.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
  expect(buildFlashcardPrompt).toHaveBeenLastCalledWith(expect.objectContaining({ guideDirections: [] }))
})

it('requires a notebook choice before any prompt handoff', async () => {
  seed([journal('ready')]); await render('ready')
  expect(button('Download current notebook + images').disabled).toBe(false)
  expect(button('I have the notebook folder').getAttribute('aria-pressed')).toBe('false')
  expect(button('Copy complete prompt').disabled).toBe(true)
  expect(button('Download prompt').disabled).toBe(true)
  expect(container.querySelector('textarea')).toBeNull()
  expect(container.querySelector('[aria-label="Notebook: Required"]')).toBeTruthy()
  expect(container.querySelector('[aria-label="Lecture materials: Recommended"]')).toBeTruthy()
  expect(container.textContent).not.toContain('Downloads, notes and history')
  await click('Copy complete prompt'); expect(writeText).not.toHaveBeenCalled()
  await click('I have the notebook folder')
  expect(button('I have the notebook folder').getAttribute('aria-pressed')).toBe('true')
  expect(button('Copy complete prompt').disabled).toBe(false)
})
it('downloads the selected current notebook ZIP and then enables copying', async () => {
  seed([journal('first'), journal('second')]); await render('second')
  await act(async () => {
    button('Download current notebook + images').click()
    await exportBundle.mock.results.at(-1)?.value
  })
  expect(button('Copy complete prompt').disabled).toBe(false)
  expect(downloads).toEqual(['Current second.zip'])
  const members = await readNotebookZip(blobs[0])
  const raw = new TextDecoder().decode(members.get('notebook.json')!)
  const notebook = JSON.parse(raw)
  expect(notebook.entries.map((entry: { id: string }) => entry.id)).toEqual(['entry-second'])
  expect(notebook.entries[0].title).toBe('Current second')
  expect(notebook.entries[0].revision).toBe(2)
  expect(notebook).not.toHaveProperty('progress')
  expect(JSON.parse(exportBundle.mock.calls[0][0])).toEqual(notebook)
  await click('Copy complete prompt')
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Complete prompt for second'))
})
it('keeps copying locked if the complete notebook export fails', async () => {
  exportBundle.mockRejectedValueOnce(new Error('A required image is missing.'))
  seed([journal('ready')]); await render('ready')
  await act(async () => {
    button('Download current notebook + images').click()
    await exportBundle.mock.results.at(-1)?.value.catch(() => {})
  })
  expect(container.textContent).toContain('A required image is missing.')
  expect(button('Copy complete prompt').disabled).toBe(true)
  expect(downloads).toEqual([])
})
it('requires a fresh choice after the current saved notebook changes', async () => {
  seed([journal('ready')]); await render('ready'); await click('I have the notebook folder')
  await act(async () => useStore.getState().update(draft => { draft.academics.classCenter.lectures[0].importedNotebook!.current.entries[0].title = 'Changed saved content' }))
  expect(button('Copy complete prompt').disabled).toBe(true)
  expect(button('I have the notebook folder').getAttribute('aria-pressed')).toBe('false')
})

it('does not offer notebook controls for a completed lecture with no Journal', async () => {
  const missing = journal('missing'); delete missing.importedNotebook
  seed([missing]); await render('missing')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Complete this lecture’s Class Journal with a study guide and Mastery Map before creating flashcards.')
  expect(container.querySelector('[aria-label="Get your notebook"]')).toBeNull()
  expect(container.querySelector('textarea')).toBeNull()
})
it('does not download or acknowledge an export superseded while it was being prepared', async () => {
  let finish!: (blob: Blob) => void
  exportBundle.mockImplementationOnce(() => new Promise<Blob>(resolve => { finish = resolve }))
  seed([journal('ready')]); await render('ready')
  await click('Download current notebook + images')
  expect(button('Copy complete prompt').disabled).toBe(true)
  await act(async () => useStore.getState().update(draft => { draft.academics.classCenter.lectures[0].importedNotebook!.current.entries[0].title = 'Newer saved notebook' }))
  await act(async () => finish(new Blob(['superseded export'])))
  expect(downloads).toEqual([])
  expect(button('Copy complete prompt').disabled).toBe(true)
})

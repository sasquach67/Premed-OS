import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import type { LectureRecord } from '@/lib/types'
import { FlashcardPromptPanel } from './FlashcardPromptPanel'
import { buildFlashcardPrompt } from '@/lib/academics/flashcards/prompt'
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


vi.mock('@/lib/academics/flashcards/prompt', () => ({
  flashcardNotebookEligibility: (lecture: LectureRecord) => ({ eligible: lecture.workspaceState === 'complete', reason: 'Complete and save this Class Journal first.' }),
  buildFlashcardPrompt: vi.fn(({ lecture }: { lecture: LectureRecord }) => `Complete prompt for ${lecture.id}\nAll instructions\n<style>exact card CSS</style>\nbuild_deck.py\nverify_deck.py`),
}))
let container: HTMLDivElement, root: Root
const close = vi.fn()
const writeText = vi.fn()
const journal = (id: string, courseId = 'course', complete = true): LectureRecord => ({ id, courseId, title: `Journal ${id}`, inputPath: 'materials', processingState: 'ready', workspaceState: complete ? 'complete' : 'draft', createdAt: 1, updatedAt: 1, order: 0 })
function Location() { return <output aria-label="Current route">{useLocation().pathname}</output> }
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  useStore.getState().replaceAll(createInitialDataForMode(false))
  vi.clearAllMocks(); writeText.mockReset(); writeText.mockResolvedValue(undefined)
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
  await click('Copy complete prompt')
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
  const fullPrompt = container.querySelector('textarea')!.value
  expect(fullPrompt).toContain('exact card CSS'); expect(fullPrompt).toContain('verify_deck.py')
  await click('Copy complete prompt')
  expect(writeText).toHaveBeenCalledExactlyOnceWith(fullPrompt)
  expect(container.textContent).toContain('Complete prompt copied')
  expect(container.textContent).toContain('original materials')
  expect(container.textContent).toContain('finished deck goes directly into Anki')
  expect(JSON.stringify(useStore.getState().academics.classCenter)).toBe(before)
})
it('opens a read-only complete fallback when clipboard access fails', async () => {
  seed([journal('ready')]); writeText.mockRejectedValue(new Error('Denied')); await render()
  await click('Copy complete prompt')
  expect(container.textContent).toContain('Clipboard access was unavailable')
  expect(container.querySelector('textarea')?.closest('details')?.open).toBe(true)
  const textarea = container.querySelector('textarea')!
  expect(textarea.readOnly).toBe(true)
  expect(textarea.value).toBe(writeText.mock.calls[0][0])
  await click('Select all prompt text')
  expect(textarea.selectionStart).toBe(0); expect(textarea.selectionEnd).toBe(textarea.value.length)
})
it('clears the old copy acknowledgment when a different Journal is selected', async () => {
  seed([journal('first'), journal('second')]); await render(); await click('Copy complete prompt')
  await chooseOption('[role="combobox"][aria-label="Class Journal"]', 'Journal second')
  expect(container.textContent).not.toContain('Complete prompt copied')
  await click('Copy complete prompt')
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

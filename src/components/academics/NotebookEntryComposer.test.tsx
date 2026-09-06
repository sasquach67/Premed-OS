import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { NotebookEntryComposer } from './NotebookEntryComposer'
import { ToastProvider } from '@/components/common/ToastProvider'
import { useStore, createInitialDataForMode } from '@/store/store'
import { generateStudyGuide } from '@/lib/academics/generateStudyGuide'
import { generateUnitMasteryOutline } from '@/lib/academics/generateUnitMasteryOutline'
import type { LectureRecord } from '@/lib/types'
vi.mock('@/lib/academics/generateStudyGuide', () => ({ generateStudyGuide: vi.fn() }))
vi.mock('@/lib/academics/generateUnitMasteryOutline', () => ({ generateUnitMasteryOutline: vi.fn() }))
let container: HTMLDivElement, root: Root
const built = vi.fn()
const guide = { ok: true, artifact: { specId: 'study-guide-v1', specHash: 'test', courseId: 'course', topicId: 'scope', sections: [{ id: 'concepts', title: 'Concepts', blocks: [{ id: 'b', type: 'prose', text: { content: 'A grounded explanation.' }, provenance: 'source', sourceRef: { fileId: 'source', chunkId: 'chunk', start: 0, end: 10 } }] }] } } as const
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
  const data = createInitialDataForMode(false)
  data.academics.classCenter.files.push({ id: 'source', courseId: 'course', title: 'Class transcript', type: 'transcript', sourceType: 'paste', owner: 'mine', linkedTopicIds: [], processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0 }, { id: 'foreign', courseId: 'other', title: 'Another class file', type: 'reading', sourceType: 'paste', owner: 'mine', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 })
  data.academics.classCenter.sourceChunks.push({ id: 'chunk', fileId: 'source', courseId: 'course', content: 'Explain the selected concepts and their relationship.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 })
  useStore.getState().replaceAll(data)
  vi.clearAllMocks()
  vi.mocked(generateStudyGuide).mockResolvedValue(structuredClone(guide) as unknown as Awaited<ReturnType<typeof generateStudyGuide>>)
  vi.mocked(generateUnitMasteryOutline).mockResolvedValue({ ok: true, artifact: { courseId: 'course', title: 'Mastery', unit: 'Unit', scope: 'lecture', specId: 'unit-mastery-outline-v1', specHash: 'test', standards: [], sourceChunkIds: ['chunk'] } })
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); useStore.getState().replaceAll(createInitialDataForMode(false)) })
async function render(entry?: LectureRecord) {
  function Harness() { const data = useStore(state => state.academics.classCenter); return <NotebookEntryComposer courseId="course" data={data} entry={entry} onBuilt={built}/> }
  await act(async () => root.render(<MemoryRouter><ToastProvider><Harness/></ToastProvider></MemoryRouter>))
}
async function click(text: string) { const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === text || item.getAttribute('aria-label') === text)!; expect(button, text).toBeTruthy(); await act(async () => button.click()) }
async function fill(element: HTMLTextAreaElement, value: string) { await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })) }) }
function goalChoice(label: string) { const choice = [...container.querySelectorAll<HTMLElement>('[role="radio"]')].find(item => item.getAttribute('aria-label') === label)!; expect(choice, label).toBeTruthy(); return choice }
async function selectSource() { await click('Continue to materials'); await click('Choose saved class materials'); await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click()) }

it('asks the goal before showing any material intake, without creating an empty draft', async () => {
  await render()
  expect(container.textContent).toContain('What would you like to do?')
  expect(container.textContent).not.toContain('Upload or paste')
  expect(container.textContent).not.toContain('Choose saved class materials')
  expect(container.textContent).toContain('Prepare for an assessment')
  expect(container.textContent).toContain('Work on an assignment')
  expect(container.querySelectorAll('[role="radio"]')).toHaveLength(3)
  expect(goalChoice('Review class material').getAttribute('aria-checked')).toBe('true')
  expect(goalChoice('Prepare for an assessment').getAttribute('aria-checked')).toBe('false')
  expect(container.querySelectorAll('textarea')).toHaveLength(1)
  expect(container.querySelector('textarea')?.value).toBe('')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await click('Continue to materials'); await click('Choose saved class materials')
  expect(container.textContent).not.toContain('Another class file')
})
it('keeps the default Guide + Mastery path and passes the complete selected transcript', async () => {
  await render(); await selectSource(); await click('Review and create'); await click('Create entry')
  expect(generateStudyGuide).toHaveBeenCalledWith(expect.objectContaining({ notebookGoal: 'review', notebookRequest: undefined, primarySourceChunkIds: ['chunk'], chunks: [expect.objectContaining({ id: 'chunk' })] }))
  expect(generateUnitMasteryOutline).toHaveBeenCalledTimes(1)
  const saved = useStore.getState().academics.classCenter.lectures[0]
  expect(saved.notebookOutput).toBe('study-package')
  expect(saved.notebookGoal).toBe('review')
  expect(saved.notebookGeneratedGoal).toBe('review')
  expect(saved.workspaceState).toBe('complete')
  expect(built).toHaveBeenCalledWith(saved.id)
})
it('uses a specific writing request for one tailored page and does not generate a Mastery Map', async () => {
  await render(); await click('Work on an assignment'); await fill(container.querySelector('textarea')!, 'Help outline an argument for my paper.'); await selectSource()
  await click('Review and create')
  expect(container.textContent).toContain('Work on an assignment')
  await click('Create entry')
  expect(generateStudyGuide).toHaveBeenCalledWith(expect.objectContaining({ notebookGoal: 'assignment', notebookRequest: 'Help outline an argument for my paper.' }))
  expect(generateUnitMasteryOutline).not.toHaveBeenCalled()
  expect(useStore.getState().academics.classCenter.lectures[0]).toMatchObject({ notebookOutput: 'tailored-page', notebookGoal: 'assignment', notebookGeneratedGoal: 'assignment', notebookGeneratedRequest: 'Help outline an argument for my paper.' })
})
it('lets students revise their request at review and return to the default', async () => {
  await render(); await click('Work on an assignment'); await fill(container.querySelector('textarea')!, 'Compare the readings.'); await selectSource(); await click('Review and create'); await click('Edit materials or request'); await click('Edit goal'); await click('Review class material'); await fill(container.querySelector('textarea')!, ''); await click('Continue to materials'); await click('Review and create')
  expect(container.textContent).toContain('Study Guide + Mastery Map')
  await click('Create entry'); expect(generateUnitMasteryOutline).toHaveBeenCalledTimes(1)
})
it('excludes sources without deleting them from the class library', async () => {
  await render(); await selectSource()
  await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Exclude Class transcript"]')!.click())
  expect(useStore.getState().academics.classCenter.files.some(file => file.id === 'source')).toBe(true)
  expect(useStore.getState().academics.classCenter.lectures[0].selectedSourceFileIds).toEqual([])
  expect([...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Review and create')?.disabled).toBe(true)
})
it('preserves the prior complete result when rebuilding the default package fails', async () => {
  const old: LectureRecord = { id: 'old', courseId: 'course', title: 'Previous page', inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', notebookRequest: '', notebookGoal: 'review', notebookGeneratedGoal: 'assignment', notebookOutput: 'tailored-page', notebookGeneratedRequest: 'Original request', selectedSourceFileIds: ['source'], studyGuide: structuredClone(guide.artifact) as unknown as LectureRecord['studyGuide'], createdAt: 1, updatedAt: 1, order: 0 }
  useStore.getState().update(data => { data.academics.classCenter.lectures.push(old) })
  vi.mocked(generateUnitMasteryOutline).mockResolvedValue({ ok: false, message: 'Mastery failed' })
  await render(old); await click('Continue to materials'); await click('Review and create'); await click('Create entry')
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('Mastery failed')
  expect(useStore.getState().academics.classCenter.lectures[0]).toMatchObject({ notebookOutput: 'tailored-page', notebookGeneratedGoal: 'assignment', notebookGeneratedRequest: 'Original request', studyGuide: old.studyGuide })
  expect(built).not.toHaveBeenCalled()
})
it('rejects packets that would omit readable passages', async () => {
  useStore.getState().update(data => { data.academics.classCenter.sourceChunks.push(...Array.from({ length: 480 }, (_, index) => ({ id: `extra-${index}`, fileId: 'source', courseId: 'course', content: `Passage ${index}`, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: index }))) })
  await render(); await selectSource()
  expect(container.textContent).toContain('exceed the current build limit')
  expect(generateStudyGuide).not.toHaveBeenCalled()
})
it('accepts a short math problem through the same paste intake and selects it for the entry', async () => {
  await render(); await click('Continue to materials'); await click('Upload or paste')
  const paste = document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Paste a transcript, reading, problem, notes, or draft…"]')!
  await fill(paste, 'Solve x + 2 = 5.'); await click('Add material')
  const center = useStore.getState().academics.classCenter
  const chunk = center.sourceChunks.find(chunk => chunk.content === 'Solve x + 2 = 5.')!
  expect(chunk).toBeTruthy()
  expect(center.lectures[0].selectedSourceFileIds).toContain(chunk.fileId)
  expect(center.lectures[0].transcriptFileId).toBeUndefined()
})

it('selects and highlights goals without ever replacing additional instructions', async () => {
  await render()
  const instructions = 'Make it easier to digest, add examples, and prioritize the lecture over the textbook.'
  await fill(container.querySelector('textarea')!, instructions)
  for (const label of ['Prepare for an assessment', 'Work on an assignment', 'Review class material']) {
    await click(label)
    expect(goalChoice(label).getAttribute('aria-checked')).toBe('true')
    expect(container.querySelectorAll('[role="radio"][aria-checked="true"]')).toHaveLength(1)
    expect(container.querySelector('textarea')?.value).toBe(instructions)
  }
  expect(useStore.getState().academics.classCenter.lectures[0].notebookRequest).toBe(instructions)
})
it('keeps review instructions on the established Guide and Mastery workflow', async () => {
  await render()
  const instructions = 'Explain simply, add examples, and focus on the lecture.'
  await fill(container.querySelector('textarea')!, instructions)
  await selectSource(); await click('Review and create')
  expect(container.textContent).toContain('Study Guide + Mastery Map')
  expect(container.textContent).toContain(instructions)
  await click('Create entry')
  expect(generateStudyGuide).toHaveBeenCalledWith(expect.objectContaining({ notebookGoal: 'review', notebookRequest: instructions, primarySourceChunkIds: ['chunk'] }))
  expect(generateUnitMasteryOutline).toHaveBeenCalledWith(expect.objectContaining({ notebookRequest: instructions }))
  expect(useStore.getState().academics.classCenter.lectures[0]).toMatchObject({ notebookOutput: 'study-package', notebookGeneratedGoal: 'review', notebookGeneratedRequest: instructions })
})
it('uses assessment selection with no additional instructions and preserves it when reopened', async () => {
  await render(); await click('Prepare for an assessment')
  expect(container.querySelector('textarea')?.value).toBe('')
  await selectSource()
  const draft = useStore.getState().academics.classCenter.lectures[0]
  expect(draft.notebookGoal).toBe('assessment')
  expect(draft.notebookGeneratedGoal).toBeUndefined()
  await act(async () => root.unmount()); root = createRoot(container)
  await render(draft)
  expect(goalChoice('Prepare for an assessment').getAttribute('aria-checked')).toBe('true')
  await click('Continue to materials'); await click('Review and create')
  expect(container.textContent).toContain('Prepare for an assessment')
  await click('Create entry')
  expect(generateStudyGuide).toHaveBeenCalledWith(expect.objectContaining({ notebookGoal: 'assessment', notebookRequest: undefined }))
  expect(generateUnitMasteryOutline).not.toHaveBeenCalled()
  expect(useStore.getState().academics.classCenter.lectures[0]).toMatchObject({ notebookOutput: 'tailored-page', notebookGeneratedGoal: 'assessment', notebookGeneratedRequest: '' })
})
it('preserves the generated goal and instructions if a tailored rebuild fails', async () => {
  const old: LectureRecord = { id: 'old', courseId: 'course', title: 'Previous page', inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', notebookGoal: 'review', notebookRequest: '', notebookGeneratedGoal: 'review', notebookGeneratedRequest: 'Original explanation', notebookOutput: 'study-package', selectedSourceFileIds: ['source'], studyGuide: structuredClone(guide.artifact) as unknown as LectureRecord['studyGuide'], createdAt: 1, updatedAt: 1, order: 0 }
  useStore.getState().update(data => { data.academics.classCenter.lectures.push(old) })
  vi.mocked(generateStudyGuide).mockResolvedValue({ ok: false, message: 'Generation failed' })
  await render(old); await click('Work on an assignment'); await fill(container.querySelector('textarea')!, 'Help with an essay.'); await click('Continue to materials'); await click('Review and create'); await click('Create entry')
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('Generation failed')
  expect(useStore.getState().academics.classCenter.lectures[0]).toMatchObject({ notebookGoal: 'assignment', notebookRequest: 'Help with an essay.', notebookGeneratedGoal: 'review', notebookGeneratedRequest: 'Original explanation', notebookOutput: 'study-package', studyGuide: old.studyGuide })
  expect(generateUnitMasteryOutline).not.toHaveBeenCalled()
  expect(built).not.toHaveBeenCalled()
})

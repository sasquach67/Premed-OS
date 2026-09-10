import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { JournalEntryPage } from '@/pages/JournalEntryPage'
import { createInitialDataForMode, STORAGE_KEY, useStore } from '@/store/store'
import { NotebookImportPanel } from './NotebookImportPanel'
import { ExternalNotebookView, NotebookPackageView, notebookTransaction } from './ExternalNotebookView'
import { ExternalNotebookWorkflow } from './ExternalNotebookWorkflow'
import { importNotebook, exportNotebook, saveNotebookEdits } from '@/lib/academics/notebook/import'
import { prepareNotebook } from '@/lib/academics/notebook/package'
import composition from '@/lib/academics/notebook/prompts/prompt-composition.json'
import { PROMPT_TEMPLATES } from '@/lib/academics/notebook/prompt'
import { loadNotebookWorkflowDraft, notebookWorkflowDraftKey, persistNotebookWorkflowDraft } from '@/lib/academics/notebook/workflowDraft'
import review from '@/lib/academics/notebook/fixtures/fixture-review.json'
import type { Course } from '@/lib/types'
import { plainVisualFixture, visualFixture } from '@/lib/academics/notebook/visual.test-fixtures'
let root: Root, container: HTMLDivElement
const imported = vi.fn()
const course: Course = { id: 'test-notebook', code: review.course.code, title: review.course.title, term: review.course.term ?? 'Fall 2026', credits: 3, grade: '', bcpm: false, status: 'in-progress', inResidence: true, satisfies: [], order: 0 }
const raw = JSON.stringify(review)
beforeEach(() => {
  sessionStorage.clear()
  vi.stubGlobal('crypto', webcrypto); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  const data = createInitialDataForMode(false); data.courses = [course]; useStore.getState().replaceAll(data); imported.mockClear()
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks() })
async function click(label: string) { const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent?.trim() === label)!; expect(button, label).toBeTruthy(); await act(async () => button.click()); if (label === 'Validate and preview' || label.startsWith('Save editable')) await vi.waitFor(async () => { await act(async () => {}); expect(container.textContent).not.toContain('Checking package...'); expect(container.querySelector('input[type="file"]')?.hasAttribute('disabled')).not.toBe(true) }, { timeout: 10000, interval: 20 }) }
async function fill(label: string, text: string) { const el = [...container.querySelectorAll<HTMLLabelElement>('label')].find(l => l.childNodes[0]?.textContent?.trim() === label)?.querySelector('textarea,input') as HTMLTextAreaElement | HTMLInputElement; expect(el, label).toBeTruthy(); await act(async () => { Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })) }) }
async function renderImport() { await act(async () => root.render(<NotebookImportPanel courseId={course.id} onImported={imported} />)) }
async function choose(goal: 'review' | 'assessment' | 'assignment') { await act(async () => container.querySelector<HTMLInputElement>(`input[value="${goal}"]`)!.click()) }
async function openFallback() { const detail = container.querySelector<HTMLDetailsElement>('.en-prompt-detail')!; if (!detail.open) await act(async () => detail.querySelector('summary')!.click()); return detail }
async function renderWorkflow(id = course.id) { await act(async () => root.render(<ExternalNotebookWorkflow key={id} courseId={id} onImported={imported} />)) }
function nextButton() { return [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Next')! }
it('shows objective cues without practice link rows while preserving mappings, questions and concealed answers', async () => {
  const { package: pkg } = await prepareNotebook(raw)
  const original = JSON.stringify(pkg)
  const mappings = structuredClone(pkg.entries[0].objectives.map(objective => objective.practiceBlockIds))
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="practice" />))
  const objectives = container.querySelector<HTMLElement>('[aria-label="Mastery objectives"]')!
  const objective = objectives.querySelector('.nbr-objective')!
  expect(objective.querySelector('.nbr-objective-number')?.textContent).toBe('01')
  expect(objective.querySelector('.nbr-objective-title')?.textContent).toBe('Distinguish route order, labels and tags.')
  expect(objective.querySelector('.nbr-objective-origin')?.textContent).toBe('Derived study objective')
  for (const cue of [...pkg.entries[0].objectives[0].freeRecallCues, ...pkg.entries[0].objectives[0].understand, ...pkg.entries[0].objectives[0].beAbleToDo, ...pkg.entries[0].objectives[0].watchFor]) {
    const rendered = [...objective.querySelectorAll('.en-text')].find(node => node.textContent === cue)
    expect(rendered, cue).toBeTruthy()
    expect(rendered?.closest('details')).toBeNull()
  }
  expect(objective.querySelector('details details')).toBeNull()
  expect(objective.querySelector<HTMLDetailsElement>('.en-evidence')?.open).toBe(false)
  expect(objectives.querySelector('.nbr-objective-practice')).toBeNull()
  expect(objectives.querySelector('button,a')).toBeNull()
  expect(objectives.textContent).not.toContain('Question 1')
  const questions = pkg.entries[0].sections.flatMap(section => section.blocks).filter(block => block.type === 'practice')
  expect(container.querySelectorAll('.en-block-practice')).toHaveLength(questions.length)
  expect([...container.querySelectorAll('.np-number')].map(el => el.textContent)).toEqual(questions.map((_, i) => String(i + 1).padStart(2, '0')))
  expect(container.querySelectorAll('.np-set-cue')).toHaveLength(1)
  expect(container.querySelectorAll('.nbr-mental-cue')).toHaveLength(0)
  expect([...container.querySelectorAll('.np-original .en-text')].map(el => el.textContent)).toEqual(questions.map(q => q.prompt))
  expect([...container.querySelectorAll('.np-answer h4')].every(el => el.textContent === 'Answer')).toBe(true)
  expect([...container.querySelectorAll('.np-why h4')].every(el => el.textContent === 'Why')).toBe(true)
  for (const question of questions) expect(container.textContent).toContain(question.prompt)
  expect([...container.querySelectorAll<HTMLDetailsElement>('.en-answer')].every(answer => !answer.open)).toBe(true)
  expect(pkg.entries[0].objectives.map(objective => objective.practiceBlockIds)).toEqual(mappings)
  expect(JSON.stringify(pkg)).toBe(original)
})
it('preserves every objective text editor and omits practice rows from editing and study-only previews', async () => {
  const { package: pkg } = await prepareNotebook(raw)
  pkg.entries[0].objectives[0].evidenceLimit = 'Only the supplied route example was reviewed.'
  const change = vi.fn()
  await act(async () => root.render(<NotebookPackageView pkg={pkg} change={change} />))
  expect(container.querySelector('.nbr-objective-practice')).toBeNull()
  for (const [label, field] of [['Objective title', 'title'], ['Recall cue', 'freeRecallCues'], ['understand', 'understand'], ['beAbleToDo', 'beAbleToDo'], ['watchFor', 'watchFor'], ['Evidence limit', 'evidenceLimit']]) {
    await fill(label, `Edited ${field}`)
    expect(change).toHaveBeenLastCalledWith(['entries', 0, 'objectives', 0, field, ...(['title', 'evidenceLimit'].includes(field) ? [] : [0])], `Edited ${field}`)
  }
  await act(async () => root.render(<NotebookPackageView pkg={pkg} mode="study" />))
  expect(container.querySelector('.nbr-objective-practice')).toBeNull()
  expect(container.querySelector('.nbr-objectives')?.textContent).not.toContain('Question 1')
})
it('journal new route requires a goal and has noninteractive progress without a direct-import bypass', async () => {
  await act(async () => root.render(<MemoryRouter initialEntries={['/academics/classes/test-notebook/journal/new']}><Routes><Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} /></Routes></MemoryRouter>))
  expect(container.textContent).toContain('Choose your goal'); expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(3)
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0)
  expect(container.textContent).not.toContain('Already have JSON? Import directly')
  const progress = container.querySelector('[aria-label="Notebook workflow progress"]')!
  expect(progress.querySelectorAll('li')).toHaveLength(4)
  expect(progress.querySelectorAll('button,a,[tabindex]')).toHaveLength(0)
  expect(progress.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
  expect(nextButton().disabled).toBe(true)
  await click('Next'); expect(container.querySelector('h1')?.textContent).toBe('Choose your goal')
  await choose('review'); await click('Next')
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
  expect(nextButton().disabled).toBe(true)
  expect(progress.querySelectorAll('[data-state="completed"]')).toHaveLength(1)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('does not save before preview/explicit save and identifies exact malformed field for repair', async () => {
  await renderImport(); await fill('Paste complete JSON', raw.replace('"status":"supported"', '"status":"invalid"')); await click('Validate and preview')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('$.entries[0].requirements[0].status')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await fill('Paste complete JSON', raw); await click('Validate and preview')
  expect(container.textContent).toContain(`Save to ${course.code}`); expect(container.textContent).toContain('Covered:')
  const excerpt = container.querySelector('.en-notebook-preview')!
  expect(excerpt.textContent).toContain('Preview — not saved yet')
  expect(excerpt.querySelector('.en-notebook-preview-scroll[tabindex="0"]')).toBeTruthy()
  expect(excerpt.querySelector('.en-notebook-preview-scroll[inert], .en-notebook-preview-scroll[aria-hidden]')).toBeNull()
  expect(container.querySelector('.en-save-actions')?.closest('.en-notebook-preview')).toBeNull()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  // The complete preview is available immediately; validation gates already passed.
  await click(`Save editable entry to ${course.code}`)
  expect(imported).toHaveBeenCalledTimes(1); expect(useStore.getState().academics.classCenter.lectures).toHaveLength(1)
})
it('shows the complete accessible preview without granting destination approval', async () => {
  const differentClass = JSON.stringify({ ...review, course: { ...review.course, code: 'OTHER 101' } })
  await renderImport(); await fill('Paste complete JSON', differentClass); await click('Validate and preview')
  const frame = container.querySelector('.en-notebook-preview')!
  const body = frame.querySelector<HTMLElement>('.en-notebook-preview-scroll')!
  const save = container.querySelector<HTMLButtonElement>('.en-save-actions button')!
  expect(frame.textContent).not.toMatch(/Expand preview|Collapse preview|Preview cut off here/)
  expect(body.hasAttribute('inert')).toBe(false)
  expect(body.hasAttribute('aria-hidden')).toBe(false)
  expect(body.tabIndex).toBe(0)
  expect(body.getAttribute('aria-labelledby')).toBe(frame.querySelector('h3')!.id)
  expect(body.textContent).toContain(review.entries[0].title)
  expect(save.disabled).toBe(true)
  const confirmation = [...container.querySelectorAll('label')].find(label => label.textContent?.includes('I want to save this package'))!.querySelector<HTMLInputElement>('input')!
  await act(async () => confirmation.click())
  expect(save.disabled).toBe(false)
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toBe(differentClass)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('distinguishes minimum materials, optional lecture sources, partial exam scope and external checkpoints', async () => {
  await act(async () => root.render(<ExternalNotebookWorkflow courseId={course.id} onImported={imported} />))
  await choose('review')
  expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(3)
  expect(container.textContent).toContain('Review a lecture or lesson.')
  const guide = container.querySelector('.en-goal-guide')!
  expect(guide.querySelectorAll('.en-output-list li')).toHaveLength(4)
  expect(guide.querySelector('.en-output-list')?.textContent).toContain('Recall outline')
  expect([...guide.querySelectorAll('.en-output-list svg')].every(icon => icon.getAttribute('aria-hidden') === 'true')).toBe(true)
  expect(guide.querySelector('.en-guide-limit')?.closest('details')).toBeNull()
  expect(guide.querySelector('.en-guide-limit')?.textContent).toContain('Thin or unreadable material')
  expect(guide.textContent).toContain('Readable material for the topic you want help with.')
  const detail = guide.querySelector<HTMLDetailsElement>('details')!
  expect(detail.open).toBe(false)
  await act(async () => detail.querySelector('summary')!.click())
  expect(detail.textContent).toContain('After a lecture, use the lecture itself plus slides, notes and related readings')
  expect(detail.textContent).toContain('not an all-required list')
  expect(detail.textContent).toContain('only if your chosen AI can actually inspect it')
  await act(async () => container.querySelector<HTMLInputElement>('input[value="assessment"]')!.click())
  expect(guide.textContent).toContain('Week 3 material can support a Week 3 quiz or partial preparation')
  expect(guide.textContent).toContain('not a complete Weeks 1-6 guide')
  expect(guide.textContent).toContain('Premed OS does not combine separate batches')
  await click('Next')
  expect(container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value).toContain(composition.promptBuild)
  await openFallback(); await click('I copied it manually'); await click('Next')
  const steps = container.querySelector('.en-handoff-list')!
  expect([...steps.querySelectorAll('h2')].map(node => node.textContent)).toEqual(['Paste the prompt', 'Add your materials', 'Download your notebook'])
  expect(steps.textContent).toContain('Open your AI chat and paste the full prompt.')
  expect(steps.textContent).toContain('Include the review sheet or assessment scope.')
  expect(steps.textContent).toContain('JSON file and any accompanying images')
  expect(steps.textContent).not.toContain('Checkpoint')
  const help = container.querySelector<HTMLDetailsElement>('.en-handoff-help')!
  expect(help.open).toBe(false)
  expect(help.querySelector('details')).toBeNull()
  for (const text of ['where evidence is missing', 'Checkpoint files stay outside Premed OS', 'Import only the final, complete notebook JSON', 'If you say more files are coming', 'Use a recording only if your AI can inspect it', 'downloadable original again', 'Do not substitute a different image under the same ID', 'Missing declared images prevent saving', 'Paste JSON instead', 'Closing it can lose the draft']) expect(help.textContent).toContain(text)
  expect([...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Continue to import')!.disabled).toBe(true)
  await click('I have my notebook files'); await click('Continue to import')
  expect(container.textContent).toContain('Working checkpoint files are not final notebooks')
  expect(imported).not.toHaveBeenCalled()
})
it.each(['paste', 'upload'])('discloses blank table heading repair from %s and retains the exact original after save and reload', async path => {
  const p = (await prepareNotebook(raw)).package
  const table = p.entries[0].sections.flatMap(section => section.blocks).find(block => block.type === 'table')!
  if (table.type !== 'table') throw new Error('Expected fixture table')
  table.columns[0] = ' \t'
  const original = JSON.stringify(p), rows = structuredClone(table.rows)
  await renderImport()
  if (path === 'paste') {
    await fill('Paste complete JSON', original); await click('Validate and preview')
  } else {
    const file = new File([original], 'blank-table.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => original })
    const input = container.querySelector<HTMLInputElement>('.en-upload input')!
    Object.defineProperty(input, 'files', { value: [file] })
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))
  }
  expect(container.querySelector('.en-import-adjustments')?.textContent).toContain('Blank table headings adjusted (1)')
  expect(container.querySelector('.en-import-adjustments')?.textContent).toContain('Column 1')
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toBe(original)
  expect(container.querySelector('[role="alert"]')).toBeNull()
  await click(`Save editable entry to ${course.code}`)
  expect(imported).toHaveBeenCalledTimes(1)
  const saved = useStore.getState().academics.classCenter.lectures[0]
  expect(exportNotebook(saved, 'original')).toBe(original)
  const current = saved.importedNotebook!.current.entries[0].sections.flatMap(section => section.blocks).find(block => block.id === table.id)!
  expect(current).toMatchObject({ columns: ['Column 1', ...table.columns.slice(1)], rows })
  const disk = localStorage.getItem(STORAGE_KEY)!
  await act(async () => root.unmount()); root = createRoot(container)
  useStore.setState({ academics: createInitialDataForMode(false).academics }); localStorage.setItem(STORAGE_KEY, disk)
  await act(async () => useStore.persist.rehydrate())
  const reloaded = useStore.getState().academics.classCenter.lectures.find(lecture => lecture.id === saved.id)!
  await act(async () => root.render(<ExternalNotebookView lecture={reloaded} courseCode={course.code} />))
  expect(container.querySelector('.en-import-adjustments')?.textContent).toContain('Blank table headings adjusted (1)')
  expect(exportNotebook(reloaded, 'original')).toBe(original)
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
  await act(async () => notebookTransaction(state => { state.academics.classCenter.lectures.find(l => l.id === id)!.importedNotebook!.progress[practice.id] = { response: 'My attempted answer', complete: false } }))
  expect(container.querySelector('.en-block-practice textarea')).toBeNull()
  expect(container.querySelector('.nbr-earlier-work')?.textContent).toContain('My attempted answer')
  await fill('My notes', 'My independent note'); await click('Save notes')
  await click('Edit entry'); await fill('Entry title', 'My edited notebook'); await click('Save edits')
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
  await click('Next')
  const beforeCopy = container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  await click('Copy full prompt')
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
  expect(nextButton().disabled).toBe(false)
  expect(container.textContent).toContain('Full prompt copied.')
  await click('Next')
  expect(container.querySelector('h1')?.textContent).toBe('Use it in your AI')
  await click('Back to prompt')
  const details = await openFallback()
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
  await choose('review'); await click('Next'); await click('Copy full prompt')
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Select the prompt above and copy it, or download it')
  expect(nextButton().disabled).toBe(true)
  const details = await openFallback()
  expect(details.open).toBe(true)
  const preview = container.querySelector<HTMLTextAreaElement>('.en-code-body textarea[readonly]')!.value
  expect(preview.length).toBeGreaterThan(1000)
  expect(clipboard).toHaveBeenCalledWith(preview)
  const download = [...details.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Download full prompt')!
  expect(download).toBeTruthy(); expect(download.disabled).toBe(false)
  await click('I copied it manually')
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
  expect(nextButton().disabled).toBe(false)
  await click('Next'); expect(container.querySelector('h1')?.textContent).toBe('Use it in your AI')
  expect(imported).not.toHaveBeenCalled()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('keeps a requested download on the copy step until the student acknowledges having it and clicks Next', async () => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:download-fallback') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  await renderWorkflow(); await choose('review'); await click('Next'); await openFallback()
  await click('Download full prompt')
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt'); expect(nextButton().disabled).toBe(true)
  await click('I have the downloaded prompt')
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt'); expect(nextButton().disabled).toBe(false)
  await click('Next'); expect(container.querySelector('h1')?.textContent).toBe('Use it in your AI')
})
it('keeps inputs on Back and invalidates copy and JSON readiness when the goal changes', async () => {
  await renderWorkflow(); await choose('assessment'); await fill('Additional instructions for your AI', 'Keep my exact request.')
  await click('Next'); await openFallback(); await click('I copied it manually'); await click('Next')
  await click('I have my notebook files'); await click('Continue to import'); await fill('Paste complete JSON', raw)
  await click('Back to AI steps'); await click('Back to prompt')
  expect(nextButton().disabled).toBe(false)
  await click('Back to goal')
  expect(container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Additional instructions for your AI"]')!.value).toBe('Keep my exact request.')
  await choose('assignment'); await click('Next')
  expect(nextButton().disabled).toBe(true)
  const saved = JSON.parse(sessionStorage.getItem(notebookWorkflowDraftKey(course.id))!)
  expect(saved.confirmedPrompt).toBeNull(); expect(saved.jsonReady).toBe(false)
  expect(saved.rawJson).toBe(raw)
})
it('restores the valid import stage and raw JSON in the same class, revalidates before save, and clears the draft after save', async () => {
  await renderWorkflow(); await choose('review'); await click('Next'); await openFallback(); await click('I copied it manually'); await click('Next')
  await click('I have my notebook files'); await click('Continue to import'); await fill('Paste complete JSON', raw)
  await act(async () => root.unmount()); root = createRoot(container); await renderWorkflow()
  expect(container.querySelector('h1')?.textContent).toBe('Import your notebook')
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toBe(raw)
  expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeNull()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await click('Validate and preview'); await click(`Save editable entry to ${course.code}`)
  expect(imported).toHaveBeenCalledTimes(1)
  expect(sessionStorage.getItem(notebookWorkflowDraftKey(course.id))).toBeNull()
})
it('keeps workflow drafts isolated by class when the actual keyed workflow changes classes', async () => {
  await renderWorkflow(); await choose('review'); await fill('Additional instructions for your AI', 'Class A request'); await click('Next')
  const other = { ...course, id: 'other-notebook-class', code: 'DEMO 202' }
  await act(async () => useStore.getState().update(state => { state.courses.push(other) }))
  await renderWorkflow(other.id)
  expect(container.querySelector('h1')?.textContent).toBe('Choose your goal')
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0)
  await fill('Additional instructions for your AI', 'Class B request')
  await renderWorkflow(course.id)
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
  const prompt = container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  expect(prompt).toContain('Class A request'); expect(prompt).not.toContain('Class B request')
})
it('returns to Copy when canonical prompt content changes instead of trusting a stale saved acknowledgment', async () => {
  await renderWorkflow(); await choose('review'); await fill('Additional instructions for your AI', 'Keep this input across an update.')
  await click('Next'); await openFallback(); await click('I copied it manually'); await click('Next')
  await act(async () => root.unmount()); root = createRoot(container)
  const previous = PROMPT_TEMPLATES.review
  try {
    PROMPT_TEMPLATES.review += '\nTest-only prompt revision.'
    await renderWorkflow()
    expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
    expect(nextButton().disabled).toBe(true)
    expect(container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value).toContain('Keep this input across an update.')
    expect(container.textContent).toContain('The prompt has changed')
  } finally { PROMPT_TEMPLATES.review = previous }
})
it('does not trust a stored later stage without the current prompt acknowledgment', async () => {
  const saved = loadNotebookWorkflowDraft(course.id, { preferences: '', term: course.term }).draft
  Object.assign(saved, { goal: 'review', goalAccepted: true, step: 'import', jsonReady: true })
  sessionStorage.setItem(notebookWorkflowDraftKey(course.id), JSON.stringify(saved))
  await renderWorkflow()
  expect(container.querySelector('h1')?.textContent).toBe('Copy your prompt')
  expect(nextButton().disabled).toBe(true)
  expect(container.querySelector('[aria-label="Import external notebook"]')).toBeNull()
})
it('reports session-storage failure and removes an older draft rather than restoring stale completion later', () => {
  const draft = loadNotebookWorkflowDraft(course.id, { preferences: '', term: course.term }).draft
  sessionStorage.setItem(notebookWorkflowDraftKey(course.id), JSON.stringify(draft))
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Session quota exceeded') })
  expect(persistNotebookWorkflowDraft(draft)).toContain('could not be kept for your return')
  expect(sessionStorage.getItem(notebookWorkflowDraftKey(course.id))).toBeNull()
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
  await act(async () => notebookTransaction(state => { const n = state.academics.classCenter.lectures.find(l => l.id === id)!.importedNotebook!; n.progress = { ...n.progress, ['__proto__']: { response: 'My response stays attached to this exact ID', complete: false } } }))
  await act(async () => root.render(<Harness />)); await click('Practice')
  expect(container.querySelector('.en-block-practice textarea')).toBeNull()
  expect(container.querySelector('.nbr-earlier-work')?.textContent).toContain('My response stays attached to this exact ID')
  const disk = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(Object.hasOwn(disk.state.academics.classCenter.lectures[0].importedNotebook.progress, '__proto__')).toBe(true)
  expect(disk.state.academics.classCenter.lectures[0].importedNotebook.progress.__proto__.response).toBe('My response stays attached to this exact ID')
})

it('keeps all 78 requirements in a collapsed disclosure with an honest actionable notice', async () => {
  const pkg = (await prepareNotebook(raw)).package, entry = pkg.entries[0], base = entry.requirements[0]
  entry.requirements = Array.from({ length: 78 }, (_, i) => ({ ...base, id: `coverage-${i}`, text: `Requested topic ${i + 1}`, status: (['supported', 'partial', 'missing', 'out-of-scope'] as const)[i % 4], nextStep: i % 4 === 1 || i % 4 === 2 ? 'Add the relevant source and update this notebook.' : null }))
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} reader mode="study" />))
  const detail = container.querySelector<HTMLDetailsElement>('.nbr-coverage-disclosure')!
  expect(detail.open).toBe(false); expect(detail.querySelectorAll('[data-requirement-id]')).toHaveLength(78)
  expect(detail.textContent).toContain('Covered: 20'); expect(detail.textContent).toContain('Partly covered: 20')
  expect(detail.textContent).toContain('Missing: 19'); expect(detail.textContent).toContain('Outside this notebook: 19')
  expect(detail.textContent).toContain('Add the relevant source and update this notebook.')
  expect(container.querySelector('.nbr-coverage-notice')?.textContent).toContain('Some requested material is partly covered or missing.')
  detail.querySelector('h3')!.scrollIntoView = vi.fn()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
  await click('See coverage and next steps')
  expect(detail.open).toBe(true); expect(document.activeElement).toBe(detail.querySelector('summary'))
  await act(async () => detail.querySelector('summary')!.click()); expect(detail.open).toBe(false)
})
it('does not show a deficiency notice for covered or outside-scope material and preserves old coverage navigation', async () => {
  const pkg = (await prepareNotebook(raw)).package, entry = pkg.entries[0]
  entry.requirements = entry.requirements.map((r, i) => ({ ...r, status: i % 2 ? 'out-of-scope' : 'supported' }))
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} reader mode="study" />))
  expect(container.querySelector('.nbr-coverage-notice')).toBeNull()
  expect(container.querySelector<HTMLDetailsElement>('.nbr-coverage-disclosure')!.open).toBe(false)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} reader mode="coverage" />))
  expect(container.querySelector<HTMLDetailsElement>('.nbr-coverage-disclosure')!.open).toBe(true)
})
it('has no prominent Coverage mode in the saved notebook navigation', async () => {
  const prepared = await prepareNotebook(raw); let id = ''
  useStore.getState().update(state => { [id] = importNotebook(state.academics.classCenter, course, prepared) })
  const lecture = useStore.getState().academics.classCenter.lectures.find(l => l.id === id)!
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode={course.code} />))
  const labels = [...container.querySelectorAll('button')].map(button => button.textContent?.trim())
  expect(labels).toContain('Study guide'); expect(labels).toContain('Practice'); expect(labels).toContain('Sources')
  expect(labels).not.toContain('Coverage'); expect(container.querySelector<HTMLDetailsElement>('.nbr-coverage-disclosure')!.open).toBe(false)
})

it('renders practice-prompt data as a safe table while retaining exact JSON, edit text and Reveal gating', async () => {
  const pkg = (await prepareNotebook(raw)).package, practice = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  if (practice.type !== 'practice') throw new Error('Expected practice fixture')
  const prompt = 'Represent an endpoint and a time course\n\n| Time, minutes | Lotion A | Lotion B |\n|---|---:|---:|\n| 0 | 0 | 0 |\n| 10 | 3 | 1 |\n| 20 | 6 | 1 |\n\nNo variability measurements or p-values are provided. <img src=x onerror=alert(1)>'
  practice.prompt = prompt; practice.answer = 'Answer only behind Reveal.'
  const prepared = await prepareNotebook(JSON.stringify(pkg)); let id = ''
  useStore.getState().update(state => { [id] = importNotebook(state.academics.classCenter, course, prepared) })
  const lecture = useStore.getState().academics.classCenter.lectures.find(l => l.id === id)!
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode={course.code} />)); await click('Practice')
  const table = container.querySelector('.nbr-prompt-table table')!
  expect([...table.querySelectorAll('th')].map(e => e.textContent)).toEqual(['Time, minutes', 'Lotion A', 'Lotion B'])
  expect(table.querySelectorAll('tbody tr')).toHaveLength(3)
  expect(table.closest('.en-answer')).toBeNull(); expect(table.closest('.en-block-practice')?.querySelector<HTMLDetailsElement>('.en-answer')?.open).toBe(false)
  expect(container.querySelector('img[src="x"]')).toBeNull()
  expect(exportNotebook(lecture, 'original')).toBe(prepared.raw)
  expect(JSON.parse(exportNotebook(lecture, 'current')).entries[0].sections.flatMap((s: { blocks: { id: string; prompt?: string }[] }) => s.blocks).find((b: { id: string }) => b.id === practice.id).prompt).toBe(prompt)
  await click('Edit entry'); expect([...container.querySelectorAll('textarea')].some(e => e.value === prompt)).toBe(true)
})

it('relocates provenance into source details without changing saved text, exports, notes or history', async () => {
  const pkg = (await prepareNotebook(raw)).package, entry = pkg.entries[0], section = entry.sections[0]
  const paragraph = entry.sections.flatMap(s => s.blocks).find(b => b.type === 'paragraph')!
  if (paragraph.type !== 'paragraph') throw new Error('Expected paragraph fixture')
  const sourceId = paragraph.sourceIds[0]
  paragraph.text = `[Student-source explanation: ${sourceId} GRQ 3.] Quantitative data are numbers.`
  section.title = 'At a glance'
  section.blocks.push({ ...paragraph, id: 'graph-explanation', text: `[Source and clarification: ${sourceId} Activity 2 graphs.] In the firefly figure, read both axes.` })
  section.blocks.push({ ...paragraph, id: 'reference-only', text: `[Source: ${sourceId} p.3.]` })
  section.blocks.push({ ...paragraph, id: 'qualified-explanation', text: `[Source: ${sourceId} p.3; illustrative calculation, not empirical observations.] Keep the substantive teaching explanation.` })
  const prepared = await prepareNotebook(JSON.stringify(pkg)); let id = ''
  useStore.getState().update(state => {
    [id] = importNotebook(state.academics.classCenter, course, prepared)
    const lecture = state.academics.classCenter.lectures.find(l => l.id === id)!, edited = structuredClone(lecture.importedNotebook!.current)
    edited.entries[0].title += ' (saved edit)'; saveNotebookEdits(lecture, edited, 'Keep my note')
  })
  const lecture = useStore.getState().academics.classCenter.lectures.find(l => l.id === id)!, before = JSON.stringify(lecture.importedNotebook)
  const exports = (['current', 'original', 'backup'] as const).map(kind => exportNotebook(lecture, kind))
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode={course.code} />))
  const teaching = [...container.querySelectorAll('.nbr-blocks .en-text')].filter(e => !e.closest('.nbr-sources-panel')).map(e => e.textContent).join('\n')
  expect(teaching).toContain('Quantitative data are numbers.'); expect(teaching).toContain('In the firefly figure, read both axes.')
  expect(teaching).not.toContain('[Student-source explanation:'); expect(teaching).not.toContain('[Source and clarification:')
  expect(teaching).toContain('Illustrative calculation, not empirical observations.'); expect(teaching).toContain('Keep the substantive teaching explanation.')
  expect([...container.querySelectorAll('.en-block-paragraph')].every(e => e.textContent?.trim())).toBe(true)
  const evidence = container.querySelector<HTMLDetailsElement>('.nbr-sources-panel')!
  expect(evidence.open).toBe(false); expect(evidence.textContent).toContain(`[Student-source explanation: ${sourceId} GRQ 3.]`)
  await act(async () => evidence.querySelector('summary')!.click()); expect(evidence.open).toBe(true)
  const notes = evidence.querySelector<HTMLDetailsElement>('.nbr-reference-notes')!
  expect(notes.open).toBe(false); await act(async () => notes.querySelector('summary')!.click()); expect(notes.open).toBe(true)
  const article = container.querySelector('.nbr-doc article')!, firstSection = article.querySelector('.en-section')!, coverage = article.querySelector('.nbr-coverage-disclosure')!
  expect(firstSection.querySelector('h2')?.textContent).toBe('At a glance')
  expect(firstSection.compareDocumentPosition(coverage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(container.querySelector('.nbr-tools > summary')?.textContent).toBe('Downloads, notes and history')
  expect(container.querySelector('.nbr-views')?.tagName).toBe('NAV')
  await click('Practice'); await click('Sources'); await click('Study guide')
  expect(JSON.stringify(lecture.importedNotebook)).toBe(before)
  expect((['current', 'original', 'backup'] as const).map(kind => exportNotebook(lecture, kind))).toEqual(exports)
})
it('keeps earlier work collapsed after answer and explanation inside the corresponding Reveal', async () => {
  const prepared = await prepareNotebook(raw); let id = ''
  useStore.getState().update(state => {
    [id] = importNotebook(state.academics.classCenter, course, prepared)
    const n = state.academics.classCenter.lectures.find(l => l.id === id)!.importedNotebook!, practice = n.current.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
    n.progress[practice.id] = { response: 'Earlier response stays private until Reveal', complete: true }
  })
  const lecture = useStore.getState().academics.classCenter.lectures.find(l => l.id === id)!, before = JSON.stringify(lecture.importedNotebook)
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode={course.code} />)); await click('Practice')
  const earlier = [...container.querySelectorAll<HTMLDetailsElement>('.nbr-earlier-work')].find(e => e.textContent?.includes('Earlier response stays private'))!, answer = earlier.closest<HTMLDetailsElement>('.en-answer')!
  expect(answer).toBeTruthy(); expect(answer.open).toBe(false); expect(earlier.open).toBe(false); expect(answer.querySelector('.np-secondary')?.lastElementChild).toBe(earlier)
  await act(async () => answer.querySelector('summary')!.click()); expect(answer.open).toBe(true); expect(earlier.open).toBe(false)
  await act(async () => earlier.querySelector('summary')!.click()); expect(earlier.open).toBe(true)
  expect(JSON.stringify(lecture.importedNotebook)).toBe(before)
})
it('labels retained source questions without claiming their answer is a verified source key', async () => {
  const pkg = plainVisualFixture(), entry = pkg.entries[0], practice = entry.sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  practice.provenance = 'source'
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} mode="practice" reader />))
  const answer = container.querySelector<HTMLDetailsElement>('.en-answer')!
  expect(answer.open).toBe(false); expect(answer.closest('.np-card')?.querySelector('.np-origin')?.textContent).toBe('Question from supplied course material')
  expect(answer.textContent).not.toContain('Verified source answer')
})
it('exposes distinct question, answer and reasoning type roles without changing source text or Reveal boundaries', async () => {
  const pkg = plainVisualFixture(), entry = pkg.entries[0], before = JSON.stringify(pkg)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} mode="practice" reader />))
  const question = container.querySelector('[data-reader-role="question"]')!, answer = container.querySelector('[data-reader-role="answer"]')!, reasoning = container.querySelector('[data-reader-role="reasoning"]')!
  expect(question).toBeTruthy(); expect(question.closest('.en-answer')).toBeNull()
  expect(answer.closest<HTMLDetailsElement>('.en-answer')?.open).toBe(false)
  expect(reasoning.closest('.en-answer')).toBe(answer.closest('.en-answer'))
  expect(JSON.stringify(pkg)).toBe(before)
})
it('keeps dedicated course-question figures and tables with Practice while preserving mixed teaching and all-content views', async () => {
  const pkg = visualFixture(), entry = pkg.entries[0]
  const practice = entry.sections.flatMap(section => section.blocks).find(block => block.type === 'practice')!
  const figure = entry.sections.flatMap(section => section.blocks).find(block => block.type === 'figure')!
  if (practice.type !== 'practice' || figure.type !== 'figure') throw new Error('Expected visual practice fixture')
  const teaching = entry.sections.find(section => section.purpose !== 'practice' && section.blocks.some(block => block.type !== 'practice'))!
  const neutralFigure = { ...figure, id: 'dedicated-question-figure', caption: 'Neutral figure for the lecture question' }
  const evidence = { provenance: 'source' as const, sourceIds: figure.sourceIds, excerptIds: figure.excerptIds, assetIds: [] }
  const intro = { ...evidence, id: 'dedicated-question-intro', type: 'paragraph' as const, text: 'Try each lecture question using its supplied setup.' }
  const table = { ...evidence, id: 'dedicated-question-table', type: 'table' as const, columns: ['Lotion', 'Redness'], rows: [['A', '22'], ['B', '4.5']] }
  const question = { ...practice, id: 'dedicated-course-question', prompt: 'Compare the two lotions using the neutral figure and table.', stimulusBlockIds: [intro.id, neutralFigure.id, table.id] }
  const mixedQuestion = { ...practice, id: 'mixed-teaching-question', prompt: 'Recall the mixed teaching example.' }
  teaching.blocks.push(mixedQuestion)
  entry.sections.push({ ...teaching, id: 'dedicated-course-questions', title: 'Lecture questions', purpose: 'practice', blocks: [intro, neutralFigure, table, question] })
  const before = JSON.stringify(pkg)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} mode="study" reader />))
  expect(container.querySelector('section[aria-label="Lecture questions"]')).toBeNull()
  expect(container.textContent).not.toContain(intro.text); expect(container.textContent).not.toContain(neutralFigure.caption)
  expect([...container.querySelectorAll('.nbr-section-head h2')].some(heading => heading.textContent === teaching.title)).toBe(true)
  expect(container.textContent).not.toContain(mixedQuestion.prompt)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} mode="practice" reader />))
  expect(container.textContent).toContain(mixedQuestion.prompt)
  const item = [...container.querySelectorAll('.en-block-practice')].find(block => block.querySelector('[data-reader-role="question"]')?.textContent === question.prompt)!
  const stimulus = item.querySelector('.nbr-practice-stimulus')!
  expect(stimulus.textContent).toContain(intro.text); expect(stimulus.textContent).toContain(neutralFigure.caption)
  expect(stimulus.querySelector('.nbr-figure')?.getAttribute('data-asset-id')).toBe(figure.assetId)
  expect([...stimulus.querySelectorAll('tbody td')].map(cell => cell.textContent)).toEqual(['A', '22', 'B', '4.5'])
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} mode="all" />))
  expect(container.textContent).toContain(intro.text); expect(container.textContent).toContain(neutralFigure.caption); expect(container.textContent).toContain(question.prompt)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={entry.id} mode="all" reader change={() => {}} />))
  expect([...container.querySelectorAll('textarea')].some(input => input.value === intro.text)).toBe(true)
  expect([...container.querySelectorAll('textarea')].some(input => input.value === question.prompt)).toBe(true)
  expect(JSON.stringify(pkg)).toBe(before)
})

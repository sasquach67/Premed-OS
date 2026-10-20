import { webcrypto } from 'node:crypto'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { JournalEntryPage } from '@/pages/JournalEntryPage'
import { createInitialDataForMode, STORAGE_KEY, useStore } from '@/store/store'
import { NotebookImportPanel } from './NotebookImportPanel'
import { ExternalNotebookView, NotebookPackageView, notebookTransaction } from './ExternalNotebookView'
import { ExternalNotebookWorkflow } from './ExternalNotebookWorkflow'
import { importNotebook, exportNotebook, saveNotebookEdits } from '@/lib/academics/notebook/import'
import { prepareNotebook } from '@/lib/academics/notebook/package'
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

async function fill(label: string, text: string) { const el = [...document.querySelectorAll<HTMLLabelElement>('label')].find(l => l.childNodes[0]?.textContent?.trim() === label)?.querySelector('textarea,input') as HTMLTextAreaElement | HTMLInputElement; expect(el, label).toBeTruthy(); await act(async () => { Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })) }) }
async function renderImport() { await act(async () => root.render(<NotebookImportPanel courseId={course.id} onImported={imported} />)) }
async function choose(goal: 'review' | 'assessment') { await act(async () => container.querySelector<HTMLInputElement>(`input[value="${goal}"]`)!.click()) }
async function openFallback() { const detail = container.querySelector<HTMLDetailsElement>('.en-prompt-detail')!; if (!detail.open) await act(async () => detail.querySelector('summary')!.click()); return detail }
async function renderWorkflow(id = course.id) { await act(async () => root.render(<ExternalNotebookWorkflow key={id} courseId={id} onImported={imported} />)) }
function flowButton(label:string) { const button=[...container.querySelectorAll<HTMLButtonElement>('button')].find(button=>button.textContent?.trim()===label);expect(button,label).toBeTruthy();return button! }
it('reopens the saved reader from normal notebook navigation and reload while retaining an explicit update draft', async () => {
  let id = ''
  const prepared = await prepareNotebook(raw)
  notebookTransaction(state => { [id] = importNotebook(state.academics.classCenter, course, prepared) })
  const path = `/academics/classes/${course.id}/journal/${id}`
  const page = <MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} />
    <Route path="/academics/classes/:courseId" element={<Link to={path}>Open notebook</Link>} />
  </Routes></MemoryRouter>
  await act(async () => root.render(page))
  await click('Update')
  await fill('Additional instructions for your AI', 'Keep my unfinished update instructions.')
  const session = JSON.stringify(useStore.getState().academics.classCenter.lectures.find(item => item.id === id)!.importedNotebook!.updateSession)
  const draftStorage = JSON.stringify({ ...sessionStorage })
  await click('Back to Class Notebook')
  await act(async () => container.querySelector<HTMLAnchorElement>('a')!.click())
  expect(container.querySelector('[aria-label="Saved external notebook"]')).toBeTruthy()
  expect(container.querySelector('[aria-label="Update saved notebook"]')).toBeNull()
  await act(async () => root.unmount()); root = createRoot(container)
  await act(async () => useStore.persist.rehydrate())
  await act(async () => root.render(page))
  expect(container.querySelector('[aria-label="Saved external notebook"]')).toBeTruthy()
  expect(JSON.stringify(useStore.getState().academics.classCenter.lectures.find(item => item.id === id)!.importedNotebook!.updateSession)).toBe(session)
  expect(JSON.stringify({ ...sessionStorage })).toBe(draftStorage)
  await click('Update')
  expect(container.querySelector('[aria-label="Update saved notebook"]')).toBeTruthy()
  expect([...container.querySelectorAll('textarea')].some(field => field.value === 'Keep my unfinished update instructions.')).toBe(true)
})
it('shows objective cues without practice link rows while preserving mappings, questions and concealed answers', async () => {
  const { package: pkg } = await prepareNotebook(raw)
  const original = JSON.stringify(pkg)
  const mappings = structuredClone(pkg.entries[0].objectives.map(objective => objective.practiceBlockIds))
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="mastery" />))
  const objectives = container.querySelector<HTMLElement>('[aria-label="Mastery objectives"]')!
  const objective = objectives.querySelector('.nmo-objective')!
  expect(objective.querySelector('.nmo-number')?.textContent).toBe('01')
  expect(objective.querySelector('.nbr-objective-title')?.textContent).toBe('Distinguish route order, labels and tags.')
  expect(objective.querySelector('.nmo-origin')?.textContent).toBe('Derived study objective')
  for (const cue of [...pkg.entries[0].objectives[0].understand, ...pkg.entries[0].objectives[0].beAbleToDo]) {
    const rendered = [...objective.querySelectorAll('.en-text')].find(node => node.textContent === cue)
    expect(rendered, cue).toBeTruthy()
    expect(rendered?.closest('details')).toBeNull()
  }
  expect(objective.querySelector('details details')).toBeNull()
  expect(objective.querySelector<HTMLDetailsElement>('.en-evidence')?.open).toBe(false)
  expect(objectives.querySelector('.nbr-objective-practice')).toBeNull()
  expect(objectives.querySelector('button,a')).toBeNull()
  expect(objectives.textContent).not.toContain('Question 1')
  expect([...objective.querySelectorAll('h4')].map(node=>node.textContent)).toEqual(["How it may be tested",'Be able to do','Understand'])
  expect(objective.textContent).not.toMatch(/Try recalling first|Watch for/)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="practice" />))
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
  for (const [label, field] of [['Objective title', 'title'], ['Understanding', 'understand'], ['Application skill', 'beAbleToDo']]) {
    await fill(label, `Edited ${field}`)
    expect(change).toHaveBeenLastCalledWith(['entries', 0, 'objectives', 0, field, ...(['title', 'evidenceLimit'].includes(field) ? [] : [0])], `Edited ${field}`)
  }
  expect(container.textContent).not.toMatch(/Try recalling first|Watch for/)
  expect(pkg.entries[0].objectives[0].freeRecallCues.length).toBeGreaterThan(0)
  expect(pkg.entries[0].objectives[0].watchFor.length).toBeGreaterThan(0)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} mode="study" />))
  expect(container.querySelector('.nbr-objective-practice')).toBeNull()
  expect(container.querySelector('.nbr-objectives')?.textContent).not.toContain('Question 1')
})
it('requires a goal and current prompt acknowledgement before opening folder import', async () => {
  await renderWorkflow()
  expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(2)
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0)
  expect([...container.querySelectorAll('.nai-step > .nai-step-body > h2')].map(node => node.textContent)).toEqual(['Gather your files','Copy the prompt into a new AI chat','Bring it back'])
  expect(flowButton('Copy prompt').disabled).toBe(true)
  expect(flowButton('Choose the folder your AI made').disabled).toBe(true)
  await choose('review')
  expect(flowButton('Copy prompt').disabled).toBe(false)
  expect(flowButton('Choose the folder your AI made').disabled).toBe(true)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})

it('does not save before preview/explicit save and identifies exact malformed field for repair', async () => {
  await renderImport(); await fill('Paste complete JSON', raw.replace('"status":"supported"', '"status":"invalid"')); await click('Validate and preview')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('$.entries[0].requirements[0].status')
  const repairCopy = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: repairCopy } })
  await click('Copy repair request and JSON')
  expect(repairCopy.mock.calls[0][0]).not.toMatch(/draft approval/i)
  expect(repairCopy.mock.calls[0][0]).toContain('Preserve all other content, source text, IDs, and revisions.')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await fill('Paste complete JSON', raw); await click('Validate and preview')
  expect(container.textContent).toContain(`Ready to save in ${course.code}`); expect(container.textContent).toContain('Covered:')
  const excerpt = container.querySelector('.en-notebook-preview')!
  expect(excerpt.textContent).toContain('Preview — not saved yet')
  expect(excerpt.querySelector('.en-notebook-preview-scroll[tabindex="0"]')).toBeTruthy()
  expect(excerpt.querySelector('.en-notebook-preview-scroll[inert], .en-notebook-preview-scroll[aria-hidden]')).toBeNull()
  expect(container.querySelector('.en-save-actions')?.closest('.en-notebook-preview')).toBeNull()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  // The complete preview is available immediately; validation gates already passed.
  await click('Save notebook')
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
  expect(flowButton('Save to OTHER 101').disabled).toBe(true)
  await click(`Keep in ${course.code}`)
  expect(save.disabled).toBe(false)
  expect(container.querySelector<HTMLTextAreaElement>('.en-json')!.value).toBe(differentClass)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('saves to an existing matching class only after an explicit destination choice', async () => {
  const other={...course,id:'matched-class',code:'OTHER 101',title:'Other class'}
  await act(async()=>useStore.getState().update(state=>{state.courses.push(other)}))
  const differentClass=JSON.stringify({...review,course:{code:other.code,title:other.title,term:other.term}})
  await renderImport();await fill('Paste complete JSON',differentClass);await click('Validate and preview')
  expect(flowButton('Save notebook').disabled).toBe(true)
  expect(flowButton('Save to OTHER 101').disabled).toBe(false)
  expect(container.textContent).toContain('Choose where to save first.')
  await click('Save to OTHER 101')
  expect(flowButton('Save notebook').disabled).toBe(false)
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await click('Save notebook')
  const record=useStore.getState().academics.classCenter.lectures[0]
  expect(record.courseId).toBe(other.id)
  expect(imported).toHaveBeenCalledWith(record.id,other.id)
  expect(exportNotebook(record,'original')).toBe(differentClass)
})
it('changes focus and scope fields with the notebook goal without losing hidden exam format', async () => {
  await renderWorkflow(); await choose('review')
  expect(container.textContent).toContain('Understand and connect')
  expect(container.textContent).not.toContain('Exam format, if known')
  await fill('What are you working on?', 'Cell division')
  await choose('assessment')
  expect(container.textContent).toContain('Establish scope and coverage')
  await fill('Exam format, if known','Short answer')
  await choose('review')
  expect(container.textContent).not.toContain('Exam format, if known')
  await choose('assessment')
  expect(container.querySelector<HTMLInputElement>('input[value="Short answer"]')).toBeTruthy()
  const prompt=container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  expect(prompt).toContain('Short answer');expect(prompt).toContain('Cell division')
})

it('rejects destination removed between validation and save', async () => {
  await renderImport(); await fill('Paste complete JSON', raw); await click('Validate and preview')
  await act(async () => useStore.getState().update(state => { state.courses = [] }))
  expect(container.textContent).toContain('Destination class not found')
  expect(container.textContent).not.toContain('Save notebook')
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})
it('keeps answers behind reveal and persists manual edits/response/notes through actual store reload', async () => {
  const p = await prepareNotebook(raw); let id = ''
  useStore.getState().update(state => { [id] = importNotebook(state.academics.classCenter, course, p) })
  function Harness() { const lecture = useStore(s => s.academics.classCenter.lectures.find(l => l.id === id)!); return <ExternalNotebookView lecture={lecture} courseCode={course.code} /> }
  await act(async () => root.render(<Harness />))
  await click('Practice set')
  const answer = container.querySelector<HTMLDetailsElement>('.en-answer')!; expect(answer.open).toBe(false)
  const practice = p.package.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  await act(async () => notebookTransaction(state => { state.academics.classCenter.lectures.find(l => l.id === id)!.importedNotebook!.progress[practice.id] = { response: 'My attempted answer', complete: false } }))
  expect(container.querySelector('.en-block-practice textarea')).toBeNull()
  expect(container.querySelector('.nbr-earlier-work')?.textContent).toContain('My attempted answer')
  await click('My notes'); await fill('My notes', 'My independent note'); await click('Save notes')
  await click('Edit notebook'); await fill('Entry title', 'My edited notebook'); await click('Save edits')
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
  const clipboard=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:clipboard}})
  const blobs: Blob[]=[];Object.defineProperty(URL,'createObjectURL',{configurable:true,value:(blob:Blob)=>{blobs.push(blob);return 'blob:fixture'}});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
  await renderWorkflow();await choose('assessment')
  await fill('What does the exam cover?','Lessons 1-5 and readings A-B')
  await fill('Exam format, if known','Short answer')
  await fill('Other materials you will attach','Review sheet and five lesson PDFs')
  const request='Keep "quoted wording".\nSecond line: $& literal {{COURSE_CODE}}'
  await fill('Additional instructions for your AI',request)
  const prompt=container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  await click('Copy prompt');await click('Download')
  expect(clipboard).toHaveBeenCalledExactlyOnceWith(prompt)
  const downloaded=await new Promise<string>(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as string);reader.readAsText(blobs[0])})
  expect(downloaded).toBe(prompt);expect(prompt).toContain('Lessons 1-5');expect(prompt).toContain('Short answer')
  expect(JSON.parse(/```json\n([\s\S]*?)\n```/.exec(prompt)![1]).userRequest).toBe(request)
})

it('offers complete manual copy after clipboard failure without unlocking import early', async () => {
  const clipboard=vi.fn().mockRejectedValue(new Error('Denied'));Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:clipboard}})
  await renderWorkflow();await choose('review');await click('Copy prompt')
  expect(container.querySelector<HTMLDetailsElement>('.en-prompt-detail')!.open).toBe(true)
  expect(flowButton('Choose the folder your AI made').disabled).toBe(true)
  const prompt=container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  expect(clipboard).toHaveBeenCalledWith(prompt);expect(prompt.length).toBeGreaterThan(1000)
  await click('I copied it manually')
  expect(flowButton('Choose the folder your AI made').disabled).toBe(false)
  expect(imported).not.toHaveBeenCalled();expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
})

it('requires acknowledgement after a requested prompt download', async () => {
  Object.defineProperty(URL,'createObjectURL',{configurable:true,value:vi.fn(()=> 'blob:download')});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
  await renderWorkflow();await choose('review');await click('Download')
  expect(flowButton('Choose the folder your AI made').disabled).toBe(true)
  await click('I have the downloaded prompt')
  expect(flowButton('Choose the folder your AI made').disabled).toBe(false)
})

it('preserves raw JSON but invalidates copy and import readiness when the goal changes', async () => {
  await renderWorkflow();await choose('assessment');await fill('Additional instructions for your AI','Keep my request.')
  await click('I copied it manually');await click('Choose the folder your AI made');await fill('Paste complete JSON',raw)
  await choose('review')
  const saved=JSON.parse(sessionStorage.getItem(notebookWorkflowDraftKey(course.id))!)
  expect(saved.confirmedPrompt).toBeNull();expect(saved.jsonReady).toBe(false);expect(saved.rawJson).toBe(raw)
  expect(flowButton('Choose the folder your AI made').disabled).toBe(true)
  expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Additional instructions for your AI"]')!.value).toBe('Keep my request.')
})

it('restores raw import JSON but requires revalidation before saving and clears the draft only after save', async () => {
  await renderWorkflow();await choose('review');await click('I copied it manually');await click('Choose the folder your AI made');await fill('Paste complete JSON',raw)
  await act(async()=>root.unmount());root=createRoot(container);await renderWorkflow()
  expect(container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Paste complete JSON"]')?.value ?? [...container.querySelectorAll('textarea')].find(el=>el.value===raw)?.value).toBe(raw)
  expect(container.querySelector('[aria-label="Validated notebook preview"]')).toBeNull()
  expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
  await click('Validate and preview');await click('Save notebook')
  expect(imported).toHaveBeenCalledTimes(1);expect(sessionStorage.getItem(notebookWorkflowDraftKey(course.id))).toBeNull()
})

it('keeps workflow drafts isolated by class across remounts', async () => {
  await renderWorkflow();await choose('review');await fill('Additional instructions for your AI','Class A request')
  const other={...course,id:'other-class',code:'DEMO 202'};await act(async()=>useStore.getState().update(state=>{state.courses.push(other)}));await renderWorkflow(other.id)
  expect(container.querySelectorAll('input[type="radio"]:checked')).toHaveLength(0)
  await fill('Additional instructions for your AI','Class B request');await renderWorkflow(course.id)
  const prompt=container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  expect(prompt).toContain('Class A request');expect(prompt).not.toContain('Class B request')
})

it('invalidates a saved acknowledgement when canonical prompt instructions change', async () => {
  await renderWorkflow();await choose('review');await fill('Additional instructions for your AI','Keep my input.');await click('I copied it manually')
  await act(async()=>root.unmount());root=createRoot(container)
  const previous=PROMPT_TEMPLATES.review
  try { PROMPT_TEMPLATES.review+='\nTest-only prompt revision.';await renderWorkflow()
    expect(flowButton('Choose the folder your AI made').disabled).toBe(true)
    expect(container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value).toContain('Keep my input.')
  } finally { PROMPT_TEMPLATES.review=previous }
})

it('rejects a stored import stage without current prompt acknowledgement', async () => {
  const draft=loadNotebookWorkflowDraft(course.id,{preferences:'',term:course.term}).draft
  Object.assign(draft,{goal:'review',goalAccepted:true,step:'import',jsonReady:true});sessionStorage.setItem(notebookWorkflowDraftKey(course.id),JSON.stringify(draft))
  await renderWorkflow();expect(flowButton('Choose the folder your AI made').disabled).toBe(true)
  expect(container.querySelector('[aria-label="Import external notebook"]')).toBeNull()
})

it('drops a restored assignment goal from a new-notebook draft but keeps it when updating an existing notebook', () => {
  const defaults = { preferences: '', term: course.term }, updateId = `${course.id}:update:local:entry`
  for (const storageId of [course.id, updateId]) {
    const draft = loadNotebookWorkflowDraft(course.id, defaults, storageId).draft
    sessionStorage.setItem(notebookWorkflowDraftKey(storageId), JSON.stringify({ ...draft, goal: 'assignment', goalAccepted: true }))
  }
  expect(loadNotebookWorkflowDraft(course.id, defaults).draft).toMatchObject({ goal: null, goalAccepted: false })
  expect(loadNotebookWorkflowDraft(course.id, defaults, updateId).draft).toMatchObject({ goal: 'assignment', goalAccepted: true })
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
  await act(async () => root.render(<Harness />)); await click('Practice set')
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
  expect(labels).toContain('Study guide'); expect(labels.some(label => label?.startsWith('Practice set'))).toBe(true); expect(labels.some(label => label?.startsWith('Sources'))).toBe(true)
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
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode={course.code} />)); await click('Practice set')
  const table = container.querySelector('.nbr-prompt-table table')!
  expect([...table.querySelectorAll('th')].map(e => e.textContent)).toEqual(['Time, minutes', 'Lotion A', 'Lotion B'])
  expect(table.querySelectorAll('tbody tr')).toHaveLength(3)
  expect(table.closest('.en-answer')).toBeNull(); expect(table.closest('.en-block-practice')?.querySelector<HTMLDetailsElement>('.en-answer')?.open).toBe(false)
  expect(container.querySelector('img[src="x"]')).toBeNull()
  expect(exportNotebook(lecture, 'original')).toBe(prepared.raw)
  expect(JSON.parse(exportNotebook(lecture, 'current')).entries[0].sections.flatMap((s: { blocks: { id: string; prompt?: string }[] }) => s.blocks).find((b: { id: string }) => b.id === practice.id).prompt).toBe(prompt)
  await click('Edit notebook'); expect([...container.querySelectorAll('textarea')].some(e => e.value === prompt)).toBe(true)
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
  expect(container.querySelector('[aria-label="More notebook actions"]')).toBeTruthy()
  expect(container.querySelector('.nbr-views')?.tagName).toBe('NAV')
  await click('Practice set'); await click('Sources'); await click('Study guide')
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
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode={course.code} />)); await click('Practice set')
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

it('uses current Guide directions in the handoff, allows exclusions, and refreshes after later edits', async () => {
  useStore.getState().update(state => state.academics.classCenter.notes.push({ id: 'guide-context', courseId: course.id, title: 'Interpret healing through cultural and social context.', content: '', kind: 'about-class', type: 'other', topicIds: [], linkedFileIds: [], syncStatus: 'local-only', createdAt: 1, updatedAt: 1, order: 0, studentGuidance: { group: 'approach', scope: { kind: 'course' }, origin: 'manual' } }))
  await renderWorkflow(); await choose('review')
  const preview = container.querySelector<HTMLElement>('[aria-label="Using your Guide"]')!
  expect(preview.textContent).toContain('Interpret healing through cultural and social context.')
  await openFallback()
  const prompt = () => container.querySelector<HTMLTextAreaElement>('textarea[readonly]')!.value
  expect(prompt()).toContain('Interpret healing through cultural and social context.')
  await act(async () => container.querySelector<HTMLInputElement>('[aria-label="Using your Guide"] input[type="checkbox"]')!.click())
  await openFallback()
  expect(prompt()).not.toContain('Interpret healing through cultural and social context.')
  await act(async () => container.querySelector<HTMLInputElement>('[aria-label="Using your Guide"] input[type="checkbox"]')!.click())
  await act(async () => useStore.getState().update(state => { state.academics.classCenter.notes.find(n => n.id === 'guide-context')!.title = 'Explain how the anthropologist knows.' }))
  await openFallback()
  expect(prompt()).not.toContain('Interpret healing through cultural and social context.')
  expect(prompt()).toContain('Explain how the anthropologist knows.')
})

it('opens the saved notebook under the explicitly selected destination class route', async () => {
  const target={...course,id:'route-target',code:'OTHER 101',title:'Other class'}
  await act(async()=>useStore.getState().update(state=>{state.courses.push(target)}))
  function Location(){return <output aria-label="Current notebook route">{useLocation().pathname}</output>}
  await act(async()=>root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}/journal/new`]}><Routes><Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} /></Routes><Location /></MemoryRouter>))
  await choose('review');await click('I copied it manually');await click('Choose the folder your AI made')
  const proposal=JSON.stringify({...review,course:{code:target.code,title:target.title,term:target.term}})
  await fill('Paste complete JSON',proposal);await click('Validate and preview');await click('Save to OTHER 101');await click('Save notebook')
  const saved=useStore.getState().academics.classCenter.lectures[0]
  expect(saved.courseId).toBe(target.id)
  expect(container.querySelector('[aria-label="Current notebook route"]')?.textContent).toBe(`/academics/classes/${target.id}/journal/${saved.id}`)
  expect(container.querySelector('h1')?.textContent).toBe(review.entries[0].title)
  expect(container.textContent).not.toContain('Notebook entry not found')
  expect([...container.querySelectorAll('button')].filter(button=>button.textContent?.trim()==='Flashcards')).toHaveLength(0)
  expect(container.textContent).toContain('Make flashcards')
  expect([...container.querySelectorAll('button')].some(button=>button.textContent?.trim()==='Create flashcards')).toBe(false)
})

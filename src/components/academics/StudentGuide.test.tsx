import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { createInitialDataForMode, CURRENT_STORE_VERSION, snapshotData, STORAGE_KEY, useStore } from '@/store/store'
import { buildLectureGuideProposal } from '@/lib/academics/guideContract'
import { matchingGuideNotes } from '@/lib/academics/studentGuide'
import reviewFixture from '@/lib/academics/notebook/fixtures/fixture-review.json'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import { StudentGuide } from './StudentGuide'
import { useStudentGuide } from './UsingStudentGuide'
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


Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root, container: HTMLDivElement, courseId: string
function Harness() {
  const data = useStore(s => s.academics.classCenter)
  return <StudentGuide courseId={courseId} data={data} />
}
async function fill(selector: string, value: string) {
  const field = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!
  expect(field).toBeTruthy()
  await act(async () => {
    Object.getOwnPropertyDescriptor(field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function click(label: string) {
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent?.trim() === label || b.getAttribute('aria-label') === label)!
  expect(button, label).toBeTruthy()
  await act(async () => button.click())
}
beforeEach(async () => {
  localStorage.clear()
  const seed = structuredClone(createSeedData()); courseId = seed.courses.find(c => c.code === 'BIOL 103')!.id
  useStore.getState().replaceAll(seed)
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root.render(<Harness />))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove() })
it('adds a whole-class headline with one input and preserves existing notes and study progress on reload', async () => {
  await act(async () => useStore.getState().update(state => {
    const c = state.academics.classCenter
    const pkg = structuredClone(reviewFixture) as NotebookPackage
    c.lectures.push({ id: 'saved-notebook', courseId, title: 'Existing notebook', inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', selectedSourceFileIds: [], createdAt: 1, updatedAt: 1, order: 0,
      importedNotebook: { original: pkg, current: structuredClone(pkg), originalRaw: JSON.stringify(pkg), entryId: pkg.entries[0].id, fingerprint: 'existing', importedAt: 1, notes: 'My independent notes', progress: { question1: { response: 'My saved answer', complete: true } } } })
    c.generatedFlashcardDecks.push({ id: 'saved-deck', courseId, title: 'Existing cards', sourceChunkIds: ['source'], specId: 'flashcards-v1', specHash: 'existing', cards: [{ id: 'saved-card', type: 'conceptual', front: 'Why does the detail matter?', back: 'My saved answer', tags: [], conceptId: 'context', sourceChunkId: 'source' }], createdAt: 1, updatedAt: 1, order: 0 })
  }))
  const before = structuredClone(snapshotData())
  expect(container.querySelectorAll('article')).toHaveLength(0)
  await fill('#guide-headline', 'Explain why details matter.')
  await click('Add')
  const saved = useStore.getState().academics.classCenter.notes.find(n => n.title === 'Explain why details matter.')!
  expect(saved.studentGuidance).toEqual({ group: 'emphasis', scope: { kind: 'course' }, origin: 'manual' })
  expect(saved.linkedFileIds).toEqual([])
  expect(container.querySelector('article')?.textContent).toContain(saved.title)
  const after = snapshotData()
  expect(after.academics.classCenter.notes.filter(n => n.id !== saved.id)).toEqual(before.academics.classCenter.notes)
  expect({ ...after.academics.classCenter, notes: [] }).toEqual({ ...before.academics.classCenter, notes: [] })
  const persisted = useStore.persist.getOptions().partialize!(useStore.getState())
  await act(async () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()
  })
  const reloaded = snapshotData().academics.classCenter
  expect(reloaded.notes.find(n => n.id === saved.id)).toEqual(saved)
  expect(reloaded.lectures).toEqual(before.academics.classCenter.lectures)
  expect(reloaded.generatedFlashcardDecks).toEqual(before.academics.classCenter.generatedFlashcardDecks)
})
it('reviews rough notes before activation and retains full text when moving back as reference only', async () => {
  const raw = 'Explain how the anthropologist knows. Avoid memorizing minor details.'
  await fill('[aria-label="Rough Guide notes"]', raw)
  await click('Review headlines')
  expect(matchingGuideNotes(useStore.getState().academics.classCenter.notes, { courseId })).toEqual([])
  await fill('[aria-label="Suggested headline 1"]', 'Explain how the researcher knows.')
  await act(async () => container.querySelector<HTMLInputElement>('[aria-label="Include headline 2"]')!.click())
  await click('Save selected headlines')
  const saved = useStore.getState().academics.classCenter.notes.find(n => n.studentGuidance)!
  expect(saved.studentGuidance?.originalText).toBe(raw)
  expect(matchingGuideNotes(useStore.getState().academics.classCenter.notes, { courseId })).toHaveLength(1)
  expect(container.querySelector('article details')?.hasAttribute('open')).toBe(false)
  await click(`Keep ${saved.title} as reference only`)
  const retained = useStore.getState().academics.classCenter.notes.find(n => n.id === saved.id)!
  expect(retained.content).toContain(raw)
  expect(retained.studentGuidance).toBeUndefined()
})
it('edits with cancel semantics and keeps exam expectations within the selected assessment', async () => {
  await fill('#guide-headline', 'Use two sentences.')
  await click('Add')
  const exam = useStore.getState().academics.classCenter.assignments.find(a => a.courseId === courseId)!
  await click('Edit Use two sentences.')
  await fill('[aria-label="Edit Guide headline"]', 'Unsaved')
  await click('Cancel')
  await click('Edit Use two sentences.')
  expect(container.querySelector<HTMLInputElement>('[aria-label="Edit Guide headline"]')!.value).toBe('Use two sentences.')
  await chooseOption('article [role="combobox"][aria-label="Applies to"]', `Exam or assignment · ${exam.title}`)
  await click('Save')
  const notes = useStore.getState().academics.classCenter.notes
  expect(matchingGuideNotes(notes, { courseId })).toEqual([])
  expect(matchingGuideNotes(notes, { courseId, assessmentId: exam.id })).toHaveLength(1)
})
it('requires explicit acceptance of a source-validated lecture suggestion', async () => {
  await act(async () => useStore.getState().update(state => {
    const c = state.academics.classCenter
    c.files.push({ id: 'transcript', courseId, sourceType: 'paste', title: 'Transcript', type: 'transcript', owner: 'mine', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 })
    c.sourceChunks.push({ id: 'passage', fileId: 'transcript', courseId, content: 'Explain why details matter.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 })
    c.lectures.push({ id: 'lesson', courseId, title: 'Lecture', inputPath: 'pasted', transcriptFileId: 'transcript', processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0 })
    c.lectureFindings.push({ id: 'finding', courseId, lectureId: 'lesson', sourceChunkId: 'passage', quote: 'Explain why details matter.', timestamp: '10:00', label: 'Emphasis', detail: 'Explain the significance of a detail.', createdAt: 1, updatedAt: 1, order: 0 })
    c.guideProposals.push(buildLectureGuideProposal({ center: c, courseId, lectureId: 'lesson', finding: c.lectureFindings.at(-1)! })!)
  }))
  await click('Review as a headline')
  expect(container.querySelector('[aria-label="Review Guide headlines"] [role="combobox"][aria-label="Applies to"]')?.textContent).toContain('Whole class')
  await chooseOption('[aria-label="Review Guide headlines"] [role="combobox"][aria-label="Applies to"]', 'Lesson · Lecture')
  expect(matchingGuideNotes(useStore.getState().academics.classCenter.notes, { courseId, lessonIds: ['lesson'] })).toEqual([])
  await click('Save selected headlines')
  const c = useStore.getState().academics.classCenter
  expect(matchingGuideNotes(c.notes, { courseId })).toEqual([])
  expect(matchingGuideNotes(c.notes, { courseId, lessonIds: ['lesson'] })[0].guideSourceRefs?.[0].sourcePassage).toBe('Explain why details matter.')
  expect(c.guideProposals.at(-1)?.status).toBe('accepted')
  // Subsequent manual entry starts at Whole class, not the previous lecture.
  await fill('#guide-headline', 'Use examples.')
  await click('Add')
  expect(matchingGuideNotes(useStore.getState().academics.classCenter.notes, { courseId }).map(n => n.title)).toEqual(['Use examples.'])
})
it('visibly adjusts one shared selection for a generation without changing saved guidance', async () => {
  await fill('#guide-headline', 'Interpret healing in social context.')
  await click('Add')
  function Preview() { const guide = useStudentGuide({ courseId }); return <>{guide.preview}<output>{JSON.stringify(guide.directions.map(n => n.title))}</output></> }
  await act(async () => root.render(<Preview />))
  expect(container.querySelector('output')?.textContent).toContain('Interpret healing')
  await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
  expect(container.querySelector('output')?.textContent).toBe('[]')
  expect(matchingGuideNotes(useStore.getState().academics.classCenter.notes, { courseId })).toHaveLength(1)
})

it('reviews and imports guidance and reference notes together without activating references', async () => {
  const raw = JSON.stringify({ format: 'premed-os-guide', version: 1, id: 'fixture', courseId, entries: [
    { key: 'direction', headline: 'Design controls.', details: 'Source: course objectives.', group: 'emphasis', scope: { kind: 'course' } },
    { key: 'hours', headline: 'Wednesday office hours.', details: 'Source: instructor page.', group: 'reference' },
  ] })
  await fill('[aria-label="Compiled Guide"]', raw)
  await click('Review Guide import')
  expect(matchingGuideNotes(useStore.getState().academics.classCenter.notes, { courseId })).toEqual([])
  await click('Add reviewed entries to Guide')
  const notes = useStore.getState().academics.classCenter.notes
  expect(notes.find(note => note.title === 'Wednesday office hours.')?.studentGuidance).toBeUndefined()
  expect(notes.find(note => note.title === 'Wednesday office hours.')?.content).toBe('Source: instructor page.')
  expect(matchingGuideNotes(notes, { courseId }).map(note => note.title)).toEqual(['Design controls.'])
  expect(container.textContent).toContain('Added 2 entries to your Guide.')
})

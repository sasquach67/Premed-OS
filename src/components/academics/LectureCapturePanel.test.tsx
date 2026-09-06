import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LectureCapturePanel } from './LectureCapturePanel'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createDemoData } from '@/data/demoSeed'
import { createInitialDataForMode, useStore } from '@/store/store'

const generationMocks = vi.hoisted(() => ({
  generateStudyGuide: vi.fn(),
  generateUnitMasteryOutline: vi.fn(),
}))

vi.mock('@/lib/academics/lectureAnalysis', () => ({ analyzeLectureTranscript: vi.fn() }))
vi.mock('@/lib/academics/generateStudyGuide', () => ({ generateStudyGuide: generationMocks.generateStudyGuide }))
vi.mock('@/lib/academics/generateUnitMasteryOutline', () => ({ generateUnitMasteryOutline: generationMocks.generateUnitMasteryOutline }))
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

describe('lecture import and workspace', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
    generationMocks.generateStudyGuide.mockReset()
    generationMocks.generateUnitMasteryOutline.mockReset()
  })
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); useStore.getState().replaceAll(createInitialDataForMode(false)) })

  function render(courseId: string, initialLectureId?: string, initialDestination?: 'transcript' | 'evidence' | 'study-work', displayMode: 'dialog' | 'embedded' | 'page' = 'dialog', onNavigateLecture?: (id: string) => void) {
    const center = useStore.getState().academics.classCenter
    return act(async () => root.render(<MemoryRouter><ToastProvider><LectureCapturePanel courseId={courseId} data={center} initialLectureId={initialLectureId} initialDestination={initialDestination} displayMode={displayMode} onNavigateLecture={onNavigateLecture} onOpenNotes={() => {}} /></ToastProvider></MemoryRouter>))
  }


  it('opens a completed lecture to the Study Guide preview and Mastery Map with transcript under Sources', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    seed.academics.classCenter.lectures.push({ id: 'complete', courseId, title: 'Lecture 1 · Origins of Psychology', inputPath: 'pasted', transcriptFileId: 'transcript', occurredOn: '2026-09-02', processingState: 'ready', workspaceState: 'complete', selectedSourceFileIds: ['transcript'], createdAt: 1, updatedAt: 1, order: 0 })
    seed.academics.classCenter.files.push({ id: 'transcript', courseId, lectureId: 'complete', sourceType: 'paste', title: 'Lecture transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0 })
    seed.academics.classCenter.sourceChunks.push({ id: 'chunk', fileId: 'transcript', courseId, content: 'Psychology connects observable behavior with mental processes because both require evidence.', sourcePosition: { index: 0, label: '00:10' }, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 })
    useStore.getState().replaceAll(seed)
    await render(courseId, 'complete')
    expect(container.textContent).toContain('Study Guide')
    expect(container.textContent).toContain('At a glance')
    expect(container.textContent).not.toContain('Lecture Brief')
    expect(container.textContent).toContain('becomes the opening of the full Study Guide')
    expect(container.textContent).toContain('Lecture in one page')
    expect(container.textContent).toContain('Concept map & connections')
    expect(container.textContent).toContain('Mastery Map')
    expect(container.textContent).not.toContain('Add related materials (optional)')
    expect(container.querySelector('blockquote')).toBeNull()
    const more = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'More')!
    expect(more.className).toContain('mr-8')
    const sourcePassages = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.startsWith('Show source passages'))!
    await act(async () => sourcePassages.click())
    expect(container.querySelector('blockquote')).toBeTruthy()
    const sources = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Sources')!
    await act(async () => sources.click())
    expect(container.querySelector('input[placeholder="Search exact words across transcript and sources"]')).toBeTruthy()
    expect(container.textContent).toContain('Find class remarks')
    expect(container.textContent).toContain('configured external AI provider')
    const catalogRecord = container.querySelector<HTMLElement>('[data-lecture-actions="complete"]')!
    expect(catalogRecord.querySelector('button[aria-label="Actions for Lecture 1 · Origins of Psychology"]')).toBeTruthy()
    await act(async () => catalogRecord.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 12 })))
    const actions = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].map((item) => item.textContent?.trim())
    expect(actions).toEqual(expect.arrayContaining(['Open lecture', 'Edit lecture', 'Delete lecture']))
  })

  it('gives the lecture list, fixed header, and reading pane separate layout ownership', async () => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
    seed.academics.classCenter.lectures.push(...Array.from({ length: 18 }, (_, index) => ({
      id: `long-catalog-${index}`,
      courseId: 'demo-course-biol103-current',
      title: `Lecture ${index + 3} · Extended catalog item`,
      inputPath: 'pasted' as const,
      occurredOn: `2026-02-${String(index + 1).padStart(2, '0')}`,
      processingState: 'ready' as const,
      workspaceState: 'draft' as const,
      selectedSourceFileIds: [],
      createdAt: index + 20,
      updatedAt: index + 20,
      order: index + 2,
    })))
    useStore.getState().replaceAll(seed)
    await render('demo-course-biol103-current', 'demo-lecture-biol103-2', undefined, 'page')
    const reading = container.querySelector<HTMLElement>('[aria-label="Lecture reading area"]')
    expect(container.querySelector('[aria-label="Lecture catalog"]')).toBeNull()
    const switcher = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Switch lecture')!
    await act(async () => switcher.click())
    const catalog = document.body.querySelector<HTMLElement>('[aria-label="Lecture catalog"]')
    const lectureList = document.body.querySelector<HTMLElement>('[aria-label="Lecture list"]')
    const header = container.querySelector<HTMLElement>('[aria-label="Lecture header"]')
    expect(reading).not.toBeNull()
    expect(reading?.getAttribute('tabindex')).toBe('0')
    expect(lectureList?.getAttribute('tabindex')).toBe('0')
    expect(lectureList?.querySelectorAll('.lecture-workspace-catalog-record').length).toBeGreaterThan(18)
    expect(reading?.contains(catalog)).toBe(false)
    expect(reading?.contains(header)).toBe(false)
    expect(catalog?.contains(lectureList)).toBe(true)
    expect(header?.querySelector('nav[aria-label="Lecture workspace views"]')).toBeTruthy()
    expect(container.querySelector('.lecture-workspace')?.getAttribute('data-layout')).toBe('independent-scroll')
  })

  it('keeps the embedded journal preview bounded without adding the page catalog', async () => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
    useStore.getState().replaceAll(seed)
    await render('demo-course-biol103-current', 'demo-lecture-biol103-2', undefined, 'embedded')
    const embedded = container.querySelector<HTMLElement>('[aria-label="Embedded lecture workspace"]')
    const reading = embedded?.querySelector<HTMLElement>('[aria-label="Lecture reading area"]')
    expect(embedded).toBeTruthy()
    expect(reading?.className).toContain('max-h-[38rem]')
    expect(container.querySelector('[aria-label="Lecture catalog"]')).toBeNull()
  })

  it('shows the BIOL 103 concept map itself with source-backed stages and method branches', async () => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
    const outline = seed.academics.classCenter.generatedMasteryOutlines.find((item) => item.lectureId === 'demo-lecture-biol103-2')!
    outline.standards[0].understand.push('Keep the actual teaching sentence. provenance: source')
    useStore.getState().replaceAll(seed)
    await render('demo-course-biol103-current', 'demo-lecture-biol103-2')
    expect(container.textContent).toContain('From stored gene to working protein')
    expect(container.textContent).toContain('DNA gene')
    expect(container.textContent).toContain('Primary RNA transcript')
    expect(container.textContent).toContain('Mature mRNA')
    expect(container.textContent).toContain('Functional, localized protein')
    expect(container.textContent).toContain('In situ hybridization')
    expect(container.textContent).toContain('Immunostaining')
    expect(container.textContent).toContain('Transcription · complementary RNA synthesis')
    expect(container.textContent).not.toContain('Transcript excerpt · central information flow')
    const showSources = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.startsWith('Show concept sources'))!
    await act(async () => showSources.click())
    expect(container.textContent).toContain('Biol 103 Lecture 2 Captions.txt · Transcript excerpt · central information flow')
    const mastery = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Mastery Map')!
    await act(async () => mastery.click())
    const recall = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Closed note'))!
    await act(async () => recall.click())
    expect(container.textContent).toContain('Try before you reveal')
    expect(container.textContent).toContain('Keep the actual teaching sentence.')
    expect(container.textContent).not.toContain('provenance: source')
    expect(useStore.getState().academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id)?.standards[0].understand).toContain('Keep the actual teaching sentence. provenance: source')
    expect(container.textContent).toContain('Without notes, explain the complete process of transcription and RNA processing')
    expect(container.textContent).toContain('Trace gene expression from DNA to a mature transcript')
    for (const trigger of container.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"][data-state="closed"]')) await act(async () => trigger.click())
    expect(container.textContent).toContain('Use the codon table with mRNA')
    expect(container.textContent).toContain('Infer the likely destination of a protein')
    expect(container.textContent).toContain('Use the Ebola activity data and controls')
    expect(container.querySelectorAll('button[aria-label^="Mastery state for"]').length).toBe(5)
    expect([...container.querySelectorAll('details')].filter((item) => item.querySelector('summary')?.textContent === 'Reveal after trying').every((item) => !item.open)).toBe(true)
  })

  it('uses Materials as a lecture-scoped library for generated work and uploaded sources', async () => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
    const center = seed.academics.classCenter
    const courseId = 'demo-course-biol103-current'
    center.generatedFlashcardDecks.push(
      {
        id: 'lecture-2-cards', courseId, title: 'Central Dogma Recall', sourceChunkIds: ['demo-chunk-biol103-transcript-flow'], specId: 'flashcards-v1', specHash: 'lecture-2', createdAt: 1, updatedAt: 1, order: 0,
        cards: [{ id: 'card-1', type: 'process', front: 'What follows transcription?', back: 'RNA processing, then translation.', tags: ['central-dogma'], conceptId: 'gene-expression', sourceChunkId: 'demo-chunk-biol103-transcript-flow' }],
      },
      {
        id: 'unrelated-cards', courseId, title: 'Unrelated Syllabus Cards', sourceChunkIds: ['unrelated-syllabus-chunk'], specId: 'flashcards-v1', specHash: 'unrelated', createdAt: 2, updatedAt: 2, order: 1,
        cards: [{ id: 'card-2', type: 'basic', front: 'When is the final?', back: 'See the syllabus.', tags: ['schedule'], conceptId: 'schedule', sourceChunkId: 'unrelated-syllabus-chunk' }],
      },
    )
    center.files.push({ id: 'unrelated-syllabus', courseId, sourceType: 'upload', title: 'Course syllabus', type: 'syllabus', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 99 })
    center.sourceChunks.push({ id: 'unrelated-syllabus-chunk', fileId: 'unrelated-syllabus', courseId, content: 'The final exam is cumulative.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 99 })
    useStore.getState().replaceAll(seed)

    await render(courseId, 'demo-lecture-biol103-2', 'study-work')

    expect(container.textContent).toContain('Generated resources')
    expect(container.textContent).toContain('Your sources')
    expect(container.textContent).toContain('Central Dogma Recall')
    expect(container.textContent).not.toContain('Unrelated Syllabus Cards')
    expect(container.textContent).toContain('Biol 103 Lecture 2 Captions.txt')
    expect(container.textContent).toContain('Lecture 2 Central Dogma BIOL103.pdf')
    expect(container.textContent).toContain('Lesson 2 GRQ.pdf')
    expect(container.textContent).toContain('BIOL103-Lessons-2-and-3-Unit-Mastery-Outline.docx')
    expect(container.textContent).toContain('Create new resources from Class Materials.')
    expect(container.textContent).not.toContain('A comprehensive source-grounded guide for this lecture.')
    expect([...container.querySelectorAll('button')].some((button) => button.textContent?.trim() === 'Add source')).toBe(false)
  })

  it('lets a generated lecture be rebuilt without discarding the saved result first', async () => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
    const generatedLecture = seed.academics.classCenter.lectures.find((lecture) => lecture.id === 'demo-lecture-biol103-2')!
    generatedLecture.studyGuide = {
      specId: 'study-guide-v1', specHash: 'saved-guide', courseId: 'demo-course-biol103-current', topicId: '__class_material__',
      sections: [{ id: 'overview', title: 'Overview', blocks: [{ id: 'saved-block', type: 'prose', text: { content: 'Previously verified lecture content.' }, provenance: 'source', sourceRef: { fileId: 'demo-file-biol103-transcript-l2', chunkId: 'demo-chunk-biol103-flow', start: 0, end: 20 } }] }],
    }
    useStore.getState().replaceAll(seed)
    await render('demo-course-biol103-current', 'demo-lecture-biol103-2')

    const before = useStore.getState().academics.classCenter.lectures.find((lecture) => lecture.id === 'demo-lecture-biol103-2')!
    expect(before.studyGuide).toBeDefined()
    const rebuild = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Rebuild with AI'))!
    expect(rebuild).toBeTruthy()

    await act(async () => rebuild.click())

    expect(container.textContent).toContain('What would you like to do?')
    expect(container.textContent).toContain('Continue to materials')
    const preserved = useStore.getState().academics.classCenter.lectures.find((lecture) => lecture.id === 'demo-lecture-biol103-2')!
    expect(preserved.workspaceState).toBe('complete')
    expect(preserved.studyGuide).toBeDefined()
  })
})

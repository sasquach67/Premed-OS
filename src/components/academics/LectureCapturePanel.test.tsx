import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LectureCapturePanel } from './LectureCapturePanel'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createDemoData } from '@/data/demoSeed'
import { createInitialDataForMode, useStore } from '@/store/store'

vi.mock('@/lib/academics/lectureAnalysis', () => ({ analyzeLectureTranscript: vi.fn() }))
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

describe('lecture import and workspace', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container) })
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); useStore.getState().replaceAll(createInitialDataForMode(false)) })

  function render(courseId: string, initialLectureId?: string, initialDestination?: 'transcript' | 'evidence' | 'study-work') {
    const center = useStore.getState().academics.classCenter
    return act(async () => root.render(<MemoryRouter><ToastProvider><LectureCapturePanel courseId={courseId} data={center} initialLectureId={initialLectureId} initialDestination={initialDestination} onOpenNotes={() => {}} /></ToastProvider></MemoryRouter>))
  }

  it('starts with the three-step lecture-first wizard and one primary continuation', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    useStore.getState().replaceAll(seed)
    await render(courseId)
    expect(container.textContent).toContain('Add lecture source')
    expect(container.textContent).toContain('Add related materials')
    expect(container.textContent).toContain('Build lecture page')
    expect(container.textContent).toContain('The transcript is source evidence')
    expect(container.textContent).toContain('Ways to get a transcript')
    expect(container.textContent).toContain('Panopto or your course site')
    expect(container.textContent).toContain('Voice Memos or Word Transcribe')
    expect(container.textContent).toContain('Ask before recording')
    expect(container.textContent).toContain('Premed OS does not record audio here')
    expect(container.querySelector('[aria-label="Lecture identity"]')?.className).toContain('mr-8')
    expect([...container.querySelectorAll('button')].filter((button) => button.textContent?.includes('Continue to materials'))).toHaveLength(1)
    expect(container.textContent).not.toContain('CaptureReviewIndex')
  })

  it('offers contextual material types, exact known files, selection, privacy disclosure, and builds from only selected sources', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    const now = 10
    seed.academics.classCenter.lectures.push({ id: 'lecture', courseId, title: 'Lecture 1 · Conditioning', inputPath: 'pasted', transcriptFileId: 'transcript', occurredOn: '2026-09-02', processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds: ['transcript'], createdAt: now, updatedAt: now, order: 0 })
    seed.academics.classCenter.files.push(
      { id: 'transcript', courseId, lectureId: 'lecture', sourceType: 'paste', title: 'Lecture transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', sourceCoverage: { readableCharacterCount: 80, figureStatus: 'not-present-or-unknown' }, createdAt: now, updatedAt: now, order: 0 },
      { id: 'slides', courseId, sourceType: 'upload', title: 'Professor deck', fileName: 'PSYC101-week3-slides.pdf', mimeType: 'application/pdf', type: 'lecture-slides', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', sourceCoverage: { pageCount: 10, readablePages: [1,2,3,4,5,6,7,8], ocrRecoveredPages: [8], unreadablePages: [9,10], readableCharacterCount: 1200, figureStatus: 'not-interpreted' }, createdAt: now, updatedAt: now, order: 1 },
    )
    seed.academics.classCenter.sourceChunks.push(
      { id: 'transcript-chunk', fileId: 'transcript', courseId, content: 'Classical conditioning connects a neutral cue with a meaningful outcome. Remember that acquisition depends on repeated pairing.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 0 },
      { id: 'slides-chunk', fileId: 'slides', courseId, content: 'Compare acquisition with extinction and do not treat extinction as erasure.', sourcePosition: { index: 0, label: 'Page 8' }, coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 1 },
    )
    useStore.getState().replaceAll(seed)
    await render(courseId, 'lecture', 'transcript')
    expect(container.textContent).toContain('Textbook pages')
    expect(container.textContent).toContain('Worksheets or problem sets')
    expect(container.textContent).toContain('Pearson / publisher practice questions')
    expect(container.textContent).toContain('Questions guide new practice; they are never copied.')
    expect(container.textContent).toContain('PSYC101-week3-slides.pdf')
    expect(container.textContent).toContain('8/10 pages readable')
    expect(container.textContent).toContain('2 unreadable')
    const slides = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('PSYC101-week3-slides.pdf'))!
    await act(async () => slides.click())
    const continueButton = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Continue to build preview'))!
    await act(async () => continueButton.click())
    expect(container.querySelector('[aria-label="Lecture page preview"]')).toBeTruthy()
    expect(container.textContent).toContain('Your lecture, before you build')
    expect(container.textContent).toContain('Classical conditioning connects a neutral cue with a meaningful outcome.')
    expect(container.textContent).toContain('How the ideas connect')
    expect(container.textContent).toContain('What you should be able to do')
    expect(container.textContent).not.toContain('Summary, connections, vocabulary in context')
    expect(container.textContent).toContain('Privacy and processing')
    expect(container.textContent).toContain('private server workspace')
    expect(container.textContent).toContain('Figures are not sent or interpreted')
    const build = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Build lecture page'))!
    await act(async () => build.click())
    const saved = useStore.getState().academics.classCenter.lectures.find((lecture) => lecture.id === 'lecture')!
    expect(saved.workspaceState).toBe('complete')
    expect(saved.selectedSourceFileIds).toEqual(expect.arrayContaining(['transcript', 'slides']))
    expect(saved.lectureBrief?.selectedSourceFileIds).toEqual(expect.arrayContaining(['transcript', 'slides']))
    await render(courseId, 'lecture', 'transcript')
    expect(container.textContent).toContain('Concept map & connections')
    expect(container.querySelector('input[placeholder="Search exact words across transcript and sources"]')).toBeNull()
  })

  it('opens a completed lecture to Brief and Mastery with transcript under Sources', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    seed.academics.classCenter.lectures.push({ id: 'complete', courseId, title: 'Lecture 1 · Origins of Psychology', inputPath: 'pasted', transcriptFileId: 'transcript', occurredOn: '2026-09-02', processingState: 'ready', workspaceState: 'complete', selectedSourceFileIds: ['transcript'], createdAt: 1, updatedAt: 1, order: 0 })
    seed.academics.classCenter.files.push({ id: 'transcript', courseId, lectureId: 'complete', sourceType: 'paste', title: 'Lecture transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0 })
    seed.academics.classCenter.sourceChunks.push({ id: 'chunk', fileId: 'transcript', courseId, content: 'Psychology connects observable behavior with mental processes because both require evidence.', sourcePosition: { index: 0, label: '00:10' }, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 })
    useStore.getState().replaceAll(seed)
    await render(courseId, 'complete')
    expect(container.textContent).toContain('Lecture Brief')
    expect(container.textContent).toContain('Study the explanation here')
    expect(container.textContent).toContain('Lecture in one page')
    expect(container.textContent).toContain('Concept map & connections')
    expect(container.textContent).toContain('Mastery Map')
    expect(container.textContent).not.toContain('Add related materials (optional)')
    expect(container.querySelector('blockquote')).toBeNull()
    const sourcePassages = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.startsWith('Show source passages'))!
    await act(async () => sourcePassages.click())
    expect(container.querySelector('blockquote')).toBeTruthy()
    const sources = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Sources')!
    await act(async () => sources.click())
    expect(container.querySelector('input[placeholder="Search exact words across transcript and sources"]')).toBeTruthy()
    expect(container.textContent).toContain('Find class remarks')
    expect(container.textContent).toContain('configured external AI provider')
  })

  it('shows the BIOL 103 concept map itself with source-backed stages and method branches', async () => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
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
    expect(container.textContent).toContain('Trace gene expression from DNA to a mature transcript')
    expect(container.textContent).toContain('Use the codon table with mRNA')
    expect(container.textContent).toContain('Infer the likely destination of a protein')
    expect(container.textContent).toContain('Use the Ebola activity data and controls')
    expect(container.querySelectorAll('select[aria-label^="Mastery state for"]').length).toBe(5)
  })
})

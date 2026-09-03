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
    expect(container.textContent).toContain('Add lecture materials')
    expect(container.textContent).toContain('Build lecture page')
    expect(container.textContent).toContain('The transcript is source evidence')
    expect(container.textContent).toContain('Ways to get a transcript')
    expect(container.textContent).toContain('Panopto or your course site')
    expect(container.textContent).toContain('Voice Memos or Word Transcribe')
    expect(container.textContent).toContain('Ask before recording')
    expect(container.textContent).toContain('Premed OS does not record audio here')
    expect(container.querySelector('[aria-label="Lecture identity"]')?.className).toContain('mr-8')
    expect(container.querySelector('input[type="date"]')).toBeNull()
    const lectureDate = container.querySelector<HTMLButtonElement>('button[aria-label="Lecture date"]')
    expect(lectureDate?.textContent).toMatch(/^[A-Z][a-z]{2} \d{1,2}, 20\d{2}$/)
    expect([...container.querySelectorAll('button')].filter((button) => button.textContent?.includes('Continue to materials'))).toHaveLength(1)
    expect(container.textContent).not.toContain('CaptureReviewIndex')
  })

  it('uses only materials added to this lecture, without a class-wide source picker', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    const now = 10
    seed.academics.classCenter.lectures.push({ id: 'lecture', courseId, title: 'Lecture 1 · Conditioning', inputPath: 'pasted', transcriptFileId: 'transcript', occurredOn: '2026-09-02', processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds: ['transcript'], createdAt: now, updatedAt: now, order: 0 })
    seed.academics.classCenter.files.push(
      { id: 'transcript', courseId, lectureId: 'lecture', sourceType: 'paste', title: 'Lecture transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', sourceCoverage: { readableCharacterCount: 80, figureStatus: 'not-present-or-unknown' }, createdAt: now, updatedAt: now, order: 0 },
      { id: 'slides', courseId, lectureId: 'lecture', sourceType: 'upload', title: 'Professor deck', fileName: 'PSYC101-week3-slides.pdf', mimeType: 'application/pdf', type: 'lecture-slides', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', sourceCoverage: { pageCount: 10, readablePages: [1,2,3,4,5,6,7,8], ocrRecoveredPages: [8], unreadablePages: [9,10], readableCharacterCount: 1200, figureStatus: 'not-interpreted' }, createdAt: now, updatedAt: now, order: 1 },
      { id: 'class-library-file', courseId, sourceType: 'upload', title: 'Class library file', fileName: 'Entire-course-reference.pdf', mimeType: 'application/pdf', type: 'reading', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', sourceCoverage: { pageCount: 2, readablePages: [1,2], readableCharacterCount: 400, figureStatus: 'not-interpreted' }, createdAt: now, updatedAt: now, order: 2 },
    )
    seed.academics.classCenter.sourceChunks.push(
      { id: 'transcript-chunk', fileId: 'transcript', courseId, content: 'Classical conditioning connects a neutral cue with a meaningful outcome. Remember that acquisition depends on repeated pairing.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 0 },
      { id: 'slides-chunk', fileId: 'slides', courseId, content: 'Compare acquisition with extinction and do not treat extinction as erasure.', sourcePosition: { index: 0, label: 'Page 8' }, coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 1 },
    )
    useStore.getState().replaceAll(seed)
    generationMocks.generateStudyGuide.mockResolvedValue({
      ok: true,
      title: 'Generated · Lecture 1 study guide',
      content: '## Big picture\nConditioning links cues with outcomes.',
      specHash: 'guide-hash',
      fileIds: ['transcript', 'slides'],
      auditStatus: 'approved',
      artifact: {
        specId: 'study-guide-v1', specHash: 'guide-hash', courseId, topicId: '__class_material__',
        sections: [
          { id: 'big-picture', title: 'BIG PICTURE', blocks: [{ id: 'g1', type: 'prose', text: { content: 'Conditioning links cues with outcomes.' }, provenance: 'source', conceptLabel: 'Conditioning', sourceRef: { fileId: 'transcript', chunkId: 'transcript-chunk', start: 0, end: 76 } }] },
        ],
      },
    })
    generationMocks.generateUnitMasteryOutline.mockResolvedValue({
      ok: true,
      artifact: {
        courseId, lectureId: 'lecture', scope: 'lecture', scopeId: 'lecture', title: 'Generated · Lecture 1 mastery map', unit: 'Lecture 1 · Conditioning', specId: 'unit-mastery-outline-v1', specHash: 'mastery-hash', sourceChunkIds: ['transcript-chunk'],
        standards: [{ id: 'objective-1', title: 'Explain conditioning', understand: ['Explain how cues connect to outcomes.'], beAbleToDo: ['Apply the relationship to a new example.'], watchFor: ['Do not confuse extinction with erasure.'], sourceChunkIds: ['transcript-chunk'], masteryState: 'not-started' }],
      },
    })
    await render(courseId, 'lecture', 'transcript')
    expect(container.textContent).not.toContain('Choose sources')
    expect(container.textContent).not.toContain('selected')
    expect(container.textContent).toContain('Added to this lecture')
    expect(container.textContent).toContain('Automatically included when readable')
    expect([...container.querySelectorAll('button')].some((button) => button.textContent?.trim() === 'Add material')).toBe(true)
    const suggestionGuide = container.querySelector<HTMLDetailsElement>('[data-testid="material-suggestion-guide"]')!
    expect(suggestionGuide.open).toBe(false)
    expect(suggestionGuide.querySelector('summary')?.textContent).toContain('Not sure what to add?')
    expect(container.textContent).toContain('Textbook')
    expect(container.textContent).toContain('Slides')
    expect(container.textContent).toContain('Practice questions')
    expect(container.textContent).toContain('Quizzes, exams, problem sets & keys')
    expect(container.textContent).not.toContain('Pearson')
    expect(container.textContent).not.toContain('TA problem sheets')
    expect(container.querySelectorAll('[data-testid="material-suggestion"]')).toHaveLength(9)
    expect(container.querySelector('[data-testid="material-suggestion"] .lucide-book-open')).toBeTruthy()
    expect(container.querySelector('[data-testid="material-suggestion"] .lucide-presentation')).toBeTruthy()
    expect(container.textContent).toContain('PSYC101-week3-slides.pdf')
    expect(container.textContent).not.toContain('Entire-course-reference.pdf')
    expect(container.textContent).toContain('8/10 pages readable')
    expect(container.textContent).toContain('2 unreadable')
    const continueButton = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Continue to build preview'))!
    expect(continueButton.disabled).toBe(false)
    await act(async () => continueButton.click())
    expect(container.querySelector('[aria-label="Lecture page preview"]')).toBeTruthy()
    expect(container.textContent).toContain('Your lecture, before you build')
    expect(container.textContent).toContain('Classical conditioning connects a neutral cue with a meaningful outcome.')
    expect(container.textContent).toContain('How the ideas connect')
    expect(container.textContent).toContain('What you should be able to do')
    expect(container.textContent).not.toContain('Summary, connections, vocabulary in context')
    expect(container.textContent).toContain('Privacy and processing')
    expect(container.textContent).toContain('private server workspace')
    expect(container.textContent).toContain('Original file bytes stay local')
    const build = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Build Guide + Mastery'))!
    await act(async () => { build.click(); await Promise.resolve() })
    const saved = useStore.getState().academics.classCenter.lectures.find((lecture) => lecture.id === 'lecture')!
    expect(generationMocks.generateStudyGuide).toHaveBeenCalledWith(expect.objectContaining({ courseId, chunks: expect.arrayContaining([expect.objectContaining({ id: 'transcript-chunk' }), expect.objectContaining({ id: 'slides-chunk' })]), practiceQuestionChunkIds: ['slides-chunk'] }))
    expect(generationMocks.generateUnitMasteryOutline).toHaveBeenCalledWith(expect.objectContaining({ courseId, scope: 'lecture', chunks: expect.arrayContaining([expect.objectContaining({ id: 'transcript-chunk' }), expect.objectContaining({ id: 'slides-chunk' })]), practiceQuestionChunkIds: ['slides-chunk'] }))
    expect(saved.workspaceState).toBe('complete')
    expect(saved.studyGuide?.specId).toBe('study-guide-v1')
    expect(saved.selectedSourceFileIds).toEqual(expect.arrayContaining(['transcript', 'slides']))
    expect(saved.lectureBrief?.selectedSourceFileIds).toEqual(expect.arrayContaining(['transcript', 'slides']))
    await render(courseId, 'lecture', 'transcript')
    expect(container.textContent).toContain('Lecture Study Guide')
    expect(container.textContent).toContain('Concept map')
    expect(container.querySelector('input[placeholder="Search exact words across transcript and sources"]')).toBeNull()
  })

  it('does not mark a lecture complete or save a partial guide when generation fails', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    seed.academics.classCenter.lectures.push({ id: 'lecture', courseId, title: 'Lecture 1 · Scientific Thinking', inputPath: 'pasted', transcriptFileId: 'transcript', occurredOn: '2026-09-02', processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds: ['transcript'], createdAt: 1, updatedAt: 1, order: 0 })
    seed.academics.classCenter.files.push(
      { id: 'transcript', courseId, lectureId: 'lecture', sourceType: 'paste', title: 'Lecture transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'notes', courseId, lectureId: 'lecture', sourceType: 'paste', title: 'Scientific thinking notes', type: 'other', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 1 },
    )
    seed.academics.classCenter.sourceChunks.push(
      { id: 'chunk', fileId: 'transcript', courseId, content: 'Scientific thinking compares claims with evidence and uses controls to rule out alternatives.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'notes-chunk', fileId: 'notes', courseId, content: 'A useful control changes one factor while keeping the comparison conditions stable.', coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 1 },
    )
    generationMocks.generateStudyGuide.mockResolvedValue({ ok: true, artifact: { specId: 'study-guide-v1', specHash: 'guide-hash', courseId, topicId: '__class_material__', sections: [] }, content: 'guide', specHash: 'guide-hash' })
    generationMocks.generateUnitMasteryOutline.mockResolvedValue({ ok: false, failure: 'invalid-response', message: 'The mastery outline was invalid. Nothing was saved.' })
    useStore.getState().replaceAll(seed)
    await render(courseId, 'lecture', 'transcript')
    const continueButton = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Continue to build preview'))!
    await act(async () => continueButton.click())
    const build = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Build Guide + Mastery'))!
    await act(async () => { build.click(); await Promise.resolve() })
    const saved = useStore.getState().academics.classCenter.lectures.find((item) => item.id === 'lecture')!
    expect(saved.workspaceState).toBe('draft')
    expect(saved.studyGuide).toBeUndefined()
    expect(container.textContent).toContain('Nothing was saved')
  })

  it('requires one supporting material before continuing to the build preview', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    const now = 10
    seed.academics.classCenter.lectures.push({ id: 'lecture', courseId, title: 'Lecture 1 · Conditioning', inputPath: 'pasted', transcriptFileId: 'transcript', occurredOn: '2026-09-02', processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds: ['transcript'], createdAt: now, updatedAt: now, order: 0 })
    seed.academics.classCenter.files.push({ id: 'transcript', courseId, lectureId: 'lecture', sourceType: 'paste', title: 'Lecture transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', sourceCoverage: { readableCharacterCount: 80, figureStatus: 'not-present-or-unknown' }, createdAt: now, updatedAt: now, order: 0 })
    seed.academics.classCenter.sourceChunks.push({ id: 'transcript-chunk', fileId: 'transcript', courseId, content: 'Classical conditioning connects a neutral cue with a meaningful outcome.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 0 })
    useStore.getState().replaceAll(seed)

    await render(courseId, 'lecture', 'transcript')

    expect(container.textContent).toContain('Add at least one lecture material to continue.')
    expect(container.textContent).not.toContain('Skip for now')
    expect(container.textContent).not.toContain('Choose sources')
    const continueButton = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Continue to build preview'))!
    expect(continueButton.disabled).toBe(true)
  })

  it('treats legacy selected lecture sources as attached materials', async () => {
    const seed = structuredClone(createSeedData())
    const courseId = seed.academics.classCenter.workspaces[0].courseId
    const now = 10
    seed.academics.classCenter.lectures.push({ id: 'lecture', courseId, title: 'Lecture 1 · Conditioning', inputPath: 'pasted', transcriptFileId: 'transcript', occurredOn: '2026-09-02', processingState: 'ready', workspaceState: 'draft', selectedSourceFileIds: ['transcript', 'legacy-slides'], createdAt: now, updatedAt: now, order: 0 })
    seed.academics.classCenter.files.push(
      { id: 'transcript', courseId, lectureId: 'lecture', sourceType: 'paste', title: 'Lecture transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', sourceCoverage: { readableCharacterCount: 80, figureStatus: 'not-present-or-unknown' }, createdAt: now, updatedAt: now, order: 0 },
      { id: 'legacy-slides', courseId, sourceType: 'upload', title: 'Previously selected slides', fileName: 'BIOL103-lecture-1-slides.pdf', mimeType: 'application/pdf', type: 'lecture-slides', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', sourceCoverage: { pageCount: 12, readablePages: [1,2,3,4,5,6,7,8,9,10,11,12], readableCharacterCount: 1200, figureStatus: 'not-interpreted' }, createdAt: now, updatedAt: now, order: 1 },
    )
    seed.academics.classCenter.sourceChunks.push(
      { id: 'transcript-chunk', fileId: 'transcript', courseId, content: 'Classical conditioning connects a neutral cue with a meaningful outcome.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 0 },
      { id: 'slides-chunk', fileId: 'legacy-slides', courseId, content: 'Compare acquisition with extinction and do not treat extinction as erasure.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 1 },
    )
    useStore.getState().replaceAll(seed)

    await render(courseId, 'lecture', 'transcript')

    expect(container.textContent).toContain('BIOL103-lecture-1-slides.pdf')
    const continueButton = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Continue to build preview'))!
    expect(continueButton.disabled).toBe(false)
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

    expect(container.textContent).toContain('2. Add lecture materials')
    expect(container.textContent).toContain('Continue to build preview')
    const preserved = useStore.getState().academics.classCenter.lectures.find((lecture) => lecture.id === 'demo-lecture-biol103-2')!
    expect(preserved.workspaceState).toBe('complete')
    expect(preserved.studyGuide).toBeDefined()
  })
})

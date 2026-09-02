import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LectureCapturePanel } from './LectureCapturePanel'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createInitialDataForMode, useStore } from '@/store/store'

const analyzeLectureTranscriptMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/academics/lectureAnalysis', () => ({ analyzeLectureTranscript: analyzeLectureTranscriptMock }))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})))

describe('Lecture capture study-work handoff', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    analyzeLectureTranscriptMock.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  it('opens study work with only the selected lecture transcript and evidence', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const courseId = workspace.courseId
    const now = Date.UTC(2026, 7, 27)
    const lectureId = 'lecture-source-scope'
    seed.academics.classCenter.lectures.push({
      id: lectureId,
      courseId,
      title: 'Lecture #1',
      inputPath: 'pasted',
      transcriptFileId: 'lecture-transcript',
      occurredOn: '2026-08-27',
      topicIds: [],
      processingState: 'ready',
      createdAt: now,
      updatedAt: now,
      order: 0,
    })
    seed.academics.classCenter.files.push(
      { id: 'lecture-transcript', courseId, lectureId, sourceType: 'paste', title: 'Lecture transcript source', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 0 },
      { id: 'lecture-evidence', courseId, lectureId, sourceType: 'paste', title: 'Lecture slides source', type: 'lecture-slides', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 1 },
      { id: 'unrelated-source', courseId, sourceType: 'paste', title: 'Unrelated class source', type: 'reading', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 2 },
    )
    seed.academics.classCenter.sourceChunks.push(
      { id: 'chunk-transcript', fileId: 'lecture-transcript', courseId, content: 'Exact lecture transcript evidence.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 0 },
      { id: 'chunk-evidence', fileId: 'lecture-evidence', courseId, content: 'Exact supporting slide evidence.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 1 },
      { id: 'chunk-unrelated', fileId: 'unrelated-source', courseId, content: 'This source belongs to the class but not the lecture.', coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 2 },
    )
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter>
          <ToastProvider>
            <LectureCapturePanel courseId={courseId} data={seed.academics.classCenter} initialLectureId={lectureId} onOpenNotes={() => {}} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    const createResources = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Create study resources')
    expect(createResources).toBeTruthy()
    await act(async () => createResources!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 })))
    const studyGuide = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((item) => item.textContent?.trim() === 'Study guide')
    expect(studyGuide).toBeTruthy()
    await act(async () => studyGuide!.click())

    expect(container.textContent).toContain('Create from selected material')
    expect(container.textContent).toContain('Lecture transcript source')
    expect(container.textContent).toContain('Lecture slides source')
    expect(container.textContent).not.toContain('Unrelated class source')
  })

  it('keeps lecture recording help beside the capture workflow', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter>
          <ToastProvider>
            <LectureCapturePanel courseId={workspace.courseId} data={seed.academics.classCenter} onOpenNotes={() => {}} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    const help = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('How to record & transcribe'))
    expect(help).toBeTruthy()
    await act(async () => help!.click())
    expect(document.body.textContent).toContain('Record once. Bring the transcript here.')
  })

  it('adds a transcript to the selected numbered lecture without creating a duplicate lecture', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const courseId = workspace.courseId
    const lectureId = 'lecture-awaiting-transcript'
    seed.academics.classCenter.lectures.push({
      id: lectureId, courseId, title: 'Lecture #1', inputPath: 'pasted', occurredOn: '2026-08-27', topicIds: [],
      processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0,
    })
    useStore.getState().replaceAll(seed)
    const beforeCount = seed.academics.classCenter.lectures.filter((lecture) => lecture.courseId === courseId).length

    await act(async () => {
      root.render(
        <MemoryRouter>
          <ToastProvider>
            <LectureCapturePanel courseId={courseId} data={seed.academics.classCenter} initialLectureId={lectureId} initialDestination="transcript" onOpenNotes={() => {}} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Add transcript to Lecture #1')
    const textarea = container.querySelector<HTMLTextAreaElement>('textarea')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, '00:10 A source-grounded lecture passage with enough text to retain.')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const add = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Add pasted transcript'))!
    await act(async () => add.click())

    const center = useStore.getState().academics.classCenter
    expect(center.lectures.filter((lecture) => lecture.courseId === courseId)).toHaveLength(beforeCount)
    expect(center.lectures.find((lecture) => lecture.id === lectureId)).toEqual(expect.objectContaining({ transcriptFileId: expect.any(String), processingState: 'ready' }))
    expect(center.files.find((file) => file.lectureId === lectureId)?.type).toBe('transcript')
    expect(document.body.textContent).not.toContain('Record once. Bring the transcript here.')
  })

  it('does not reopen the tutorial after the workspace already has a saved lecture transcript', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const courseId = workspace.courseId
    const lectureId = 'lecture-second-transcript'
    seed.academics.classCenter.files.push({
      id: 'existing-transcript', courseId, sourceType: 'paste', title: 'Earlier lecture transcript',
      type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready',
      createdAt: 1, updatedAt: 1, order: 1,
    })
    seed.academics.classCenter.lectures.push({
      id: lectureId, courseId, title: 'Lecture #2', inputPath: 'pasted', occurredOn: '2026-08-29', topicIds: [],
      processingState: 'ready', createdAt: 2, updatedAt: 2, order: 1,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter>
          <ToastProvider>
            <LectureCapturePanel courseId={courseId} data={seed.academics.classCenter} initialLectureId={lectureId} initialDestination="transcript" onOpenNotes={() => {}} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    const textarea = container.querySelector<HTMLTextAreaElement>('textarea')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(textarea, '00:20 A second source-grounded lecture passage with enough text to retain.')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const add = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Add pasted transcript'))!
    await act(async () => add.click())

    expect(document.body.textContent).not.toContain('Record once. Bring the transcript here.')
  })

  it('prevents duplicate analysis, clears busy after a thrown failure, and allows a successful retry', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const courseId = workspace.courseId
    const lectureId = 'lecture-analysis-retry'
    seed.academics.classCenter.lectures.push({
      id: lectureId, courseId, title: 'Lecture #1', inputPath: 'pasted', transcriptFileId: 'analysis-transcript',
      occurredOn: '2026-08-27', topicIds: [], processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0,
    })
    seed.academics.classCenter.files.push({
      id: 'analysis-transcript', courseId, lectureId, sourceType: 'paste', title: 'Analysis transcript',
      type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0,
    })
    seed.academics.classCenter.sourceChunks.push({
      id: 'analysis-chunk', fileId: 'analysis-transcript', courseId, content: 'Exact transcript evidence.',
      sourcePosition: { index: 0, label: '00:10' }, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0,
    })
    useStore.getState().replaceAll(seed)
    let rejectRequest!: (error: Error) => void
    analyzeLectureTranscriptMock.mockImplementationOnce(() => new Promise((_, reject) => { rejectRequest = reject }))

    await act(async () => {
      root.render(
        <MemoryRouter>
          <ToastProvider>
            <LectureCapturePanel courseId={courseId} data={seed.academics.classCenter} initialLectureId={lectureId} onOpenNotes={() => {}} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    const analyze = [...container.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.includes('Find class remarks'))!
    await act(async () => {
      analyze.click()
      analyze.click()
    })
    expect(analyzeLectureTranscriptMock).toHaveBeenCalledOnce()
    expect([...container.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.includes('Analyzing complete transcript'))?.disabled).toBe(true)

    await act(async () => {
      rejectRequest(new Error('Lecture analysis disconnected.'))
      await Promise.resolve()
    })
    expect([...container.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.includes('Find class remarks'))?.disabled).toBe(false)
    expect(document.body.textContent).toContain('No lecture remarks were saved')
    expect(document.body.textContent).toContain('Lecture analysis disconnected.')

    analyzeLectureTranscriptMock.mockResolvedValueOnce({ ok: true, findings: [] })
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.includes('Find class remarks'))?.click())
    expect(analyzeLectureTranscriptMock).toHaveBeenCalledTimes(2)
    expect(document.body.textContent).toContain('No class-specific remarks found')
  })
})

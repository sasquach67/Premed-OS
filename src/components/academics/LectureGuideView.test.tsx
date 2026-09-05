import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AcademicFile, LectureRecord, SourceChunk } from '@/lib/types'
import type { StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import { createInitialDataForMode, useStore } from '@/store/store'
import { GeneratedLectureGuideView } from './LectureStudyViews'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('lecture study guide reading navigation', () => {
  let container: HTMLDivElement
  let root: Root
  let reduceMotion = false

  const lecture: LectureRecord = {
    id: 'lecture-1', courseId: 'course-1', title: 'Lecture 1 — Gene expression', inputPath: 'pasted',
    processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0,
  }
  const slides: AcademicFile = {
    id: 'slides-1', courseId: lecture.courseId, lectureId: lecture.id, sourceType: 'upload', title: 'Lecture 2 slides', fileName: 'Lecture-2-Slides.pdf', type: 'lecture-slides', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0,
  }
  const chunks: SourceChunk[] = [{
    id: 'slide-chunk-1', fileId: slides.id, courseId: lecture.courseId, content: 'Blocking transcription prevents synthesis of a new RNA product.', sourcePosition: { index: 13, label: 'Slide 14' }, coveredByKeyPoint: true, createdAt: 1, updatedAt: 1, order: 0,
  }]
  const guide: StudyGuideArtifact = {
    specId: 'study-guide-v1', specHash: 'guide-hash', courseId: lecture.courseId, topicId: '__class_material__',
    sections: [
      { id: 'overview', title: 'Big picture', blocks: [{ id: 'overview-block', type: 'prose', provenance: 'source', basis: 'instructor-emphasis', sourceRef: { fileId: slides.id, chunkId: chunks[0].id, start: 0, end: 31 }, text: { content: 'Genes are expressed through connected synthesis steps.' } }] },
      { id: 'application', title: 'Apply it', blocks: [
        { id: 'application-block', type: 'callout', provenance: 'clarification', conceptLabel: 'Generated exam application', sourceRef: { fileId: slides.id, chunkId: chunks[0].id, start: 0, end: 31 }, text: { content: 'Predict what changes after transcription is blocked.' } },
        { id: 'answer-block', type: 'numbered', provenance: 'clarification', conceptLabel: 'Worked answer', sourceRef: { fileId: slides.id, chunkId: chunks[0].id, start: 0, end: 31 }, items: [{ content: 'Identify which RNA product can no longer be synthesized.' }] },
      ] },
    ],
  }

  beforeEach(() => {
    reduceMotion = false
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduceMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function renderInReadingPane(kind: 'embedded' | 'page') {
    await act(async () => root.render(
      <div data-testid="shell-scroll-owner">
        <div className={kind === 'page' ? 'lecture-workspace-reading' : ''} role="region" aria-label="Lecture reading area" tabIndex={0}>
          <GeneratedLectureGuideView lecture={lecture} guide={guide} brief={{} as NonNullable<LectureRecord['lectureBrief']>} chunks={chunks} files={[slides]} onOpenMastery={() => {}} />
        </div>
      </div>,
    ))
    const pane = container.querySelector<HTMLElement>('[aria-label="Lecture reading area"]')!
    const shell = container.querySelector<HTMLElement>('[data-testid="shell-scroll-owner"]')!
    Object.defineProperty(pane, 'scrollTop', { configurable: true, writable: true, value: 120 })
    Object.defineProperty(pane, 'scrollTo', { configurable: true, value: vi.fn() })
    Object.defineProperty(shell, 'scrollTo', { configurable: true, value: vi.fn() })
    pane.getBoundingClientRect = () => ({ top: 100, bottom: 700, left: 0, right: 800, width: 800, height: 600, x: 0, y: 100, toJSON: () => ({}) })
    const heading = [...container.querySelectorAll<HTMLHeadingElement>('h3')].find((item) => item.textContent === 'Apply it')!
    heading.getBoundingClientRect = () => ({ top: 460, bottom: 490, left: 260, right: 700, width: 440, height: 30, x: 260, y: 460, toJSON: () => ({}) })
    return { pane, shell, heading }
  }

  it.each(['embedded', 'page'] as const)('scrolls only the %s reading pane and focuses the requested heading', async (kind) => {
    const { pane, shell, heading } = await renderInReadingPane(kind)
    const target = [...container.querySelectorAll<HTMLButtonElement>('nav[aria-label="Study guide sections"] button')].find((button) => button.textContent === 'Apply it')!
    await act(async () => target.click())

    expect(pane.scrollTo).toHaveBeenCalledWith({ top: 456, behavior: 'smooth' })
    expect(shell.scrollTo).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(heading)
  })

  it('uses an instant reading-pane scroll when reduced motion is requested', async () => {
    reduceMotion = true
    const { pane } = await renderInReadingPane('page')
    const target = [...container.querySelectorAll<HTMLButtonElement>('nav[aria-label="Study guide sections"] button')].find((button) => button.textContent === 'Apply it')!
    await act(async () => target.click())

    expect(pane.scrollTo).toHaveBeenCalledWith({ top: 456, behavior: 'instant' })
  })

  it('renders supported exam-application metadata without presenting it as an instructor prediction', async () => {
    await renderInReadingPane('page')
    expect(container.textContent).toContain('Professor emphasis')
    expect(container.querySelector('[data-guide-block="exam-application"]')?.textContent).toContain('Generated exam application')
    expect(container.querySelector('[data-guide-block="exam-application"]')?.textContent).toContain('Practice, not an exam prediction')
    expect(container.querySelector('[data-guide-block="exam-application"]')?.textContent).not.toContain('Take note')
    expect(container.querySelector('[data-guide-block="worked-answer"]')?.textContent).toContain('Worked answer')
    expect(container.textContent).toContain('Lecture-2-Slides.pdf · Slide 14')
  })
})

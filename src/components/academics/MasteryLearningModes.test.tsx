import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AcademicFile, GeneratedMasteryOutline, LectureRecord, SourceChunk } from '@/lib/types'
import { createInitialDataForMode, useStore } from '@/store/store'
import { MasteryMapView } from './MasteryLearningModes'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })

describe('mastery learning modes', () => {
  let container: HTMLDivElement
  let root: Root
  const courseId = 'course-1'
  const lecture: LectureRecord = { id: 'lecture-1', courseId, title: 'Lecture 1 — Gene expression', inputPath: 'pasted', processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0 }
  const file: AcademicFile = { id: 'slides-1', courseId, lectureId: lecture.id, sourceType: 'upload', title: 'Instructor slides', fileName: 'BIOL103-Lecture-1.pdf', type: 'lecture-slides', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0 }
  const chunks: SourceChunk[] = [{ id: 'chunk-1', fileId: file.id, courseId, content: 'RNA polymerase builds RNA 5′ to 3′ from the DNA template.', sourcePosition: { index: 7, label: 'Slide 8' }, coveredByKeyPoint: true, createdAt: 1, updatedAt: 1, order: 0 }]
  const outline: GeneratedMasteryOutline = {
    id: 'outline-1', courseId, lectureId: lecture.id, scope: 'lecture', scopeId: lecture.id,
    title: 'Gene expression mastery', unit: 'Lecture 1', specId: 'unit-mastery-outline-v1', specHash: 'hash-1',
    sourceChunkIds: ['chunk-1'], createdAt: 1, updatedAt: 1, order: 0,
    standards: [{
      id: 'objective-1', title: 'Trace transcription from DNA to RNA',
      freeRecallCues: ['Without notes, explain how polymerase uses the template strand.'],
      understand: ['RNA is complementary and antiparallel to the template strand.'],
      beAbleToDo: ['Write the RNA product 5′ to 3′ from a labeled DNA template.'],
      watchFor: ['Do not copy the coding strand unchanged.'],
      examPractice: [{ prompt: 'What RNA is made from 3′-TAC-5′?', answer: '5′-AUG-3′', rationale: 'Build the complementary RNA antiparallel to the template.', sourceChunkIds: ['chunk-1'] }],
      sourceChunkIds: ['chunk-1'], masteryState: 'not-started',
    }],
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const data = structuredClone(createInitialDataForMode(false))
    data.academics.classCenter.lectures.push(lecture)
    data.academics.classCenter.files.push(file)
    data.academics.classCenter.sourceChunks.push(...chunks)
    data.academics.classCenter.generatedMasteryOutlines.push(outline)
    useStore.getState().replaceAll(data)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  function render() {
    return act(async () => root.render(<MasteryMapView outline={outline} chunks={chunks} lecture={lecture} />))
  }

  it('makes the outline a notes-open learning view with the full objective visible', async () => {
    await render()

    expect(container.textContent).toContain('Learn the map')
    expect(container.textContent).toContain('Keep your notes open')
    expect(container.textContent).toContain('Notes open')
    expect(container.textContent).toContain('Mastery outline')
    expect(container.textContent).toContain('Active recall')
    expect(container.textContent).toContain('RNA is complementary and antiparallel')
    expect(container.textContent).toContain('Write the RNA product 5′ to 3′')
    expect(container.textContent).toContain('Do not copy the coding strand unchanged')
    expect(container.textContent).toContain('What RNA is made from 3′-TAC-5′?')
    expect(container.querySelector<HTMLDetailsElement>('[data-testid="practice-solution-objective-1-0"]')?.open).toBe(false)
    expect(container.querySelector('nav[aria-label="Mastery objectives"]')).toBeTruthy()
  })

  it('keeps teaching content, sources, and self-assessment inside the recall reveal', async () => {
    await render()
    const recall = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Active recall'))!
    await act(async () => recall.click())

    expect(container.textContent).toContain('Practice from memory')
    expect(container.textContent).toContain('Close your notes')
    expect(container.textContent).toContain('Try before you reveal')
    expect(container.textContent).toContain('Without notes, explain how polymerase uses the template strand.')
    const reveal = container.querySelector<HTMLDetailsElement>('[data-testid="recall-reveal-objective-1"]')!
    expect(reveal.open).toBe(false)
    expect(reveal.querySelector('summary')?.textContent).toBe('Reveal after trying')
    expect(reveal.querySelector('button[aria-label^="Mastery state for"]')).toBeTruthy()
    expect(reveal.querySelector('details details summary')?.textContent).toBe('Show answer and working')
    expect(reveal.querySelector('[data-source-chunk-id="chunk-1"]')).toBeTruthy()
    expect(container.querySelector('button[aria-label^="Mastery state for"]')?.closest('[data-testid="recall-reveal-objective-1"]')).toBe(reveal)

    await act(async () => reveal.querySelector('summary')!.click())
    expect(reveal.open).toBe(true)
    expect(reveal.textContent).toContain('Compare your answer with the teaching checklist')
    expect(reveal.textContent).toContain('BIOL103-Lecture-1.pdf · Slide 8')
  })

  it('preserves student-recorded progress without turning it into an automatic score', async () => {
    await render()
    expect(container.textContent).toContain('Student-recorded progress')
    expect(container.textContent).toContain('This is your judgment, not an automatic score.')
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="Mastery state for Trace transcription from DNA to RNA"]')!
    await act(async () => trigger.click())
    const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find((item) => item.textContent === 'Can apply without notes')!
    await act(async () => option.click())

    const saved = useStore.getState().academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id)
    expect(saved?.standards[0].masteryState).toBe('can-apply-without-notes')
    expect(container.textContent).not.toContain('exam ready')
  })
})

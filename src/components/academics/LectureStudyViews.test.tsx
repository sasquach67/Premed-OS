import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AcademicFile, GeneratedMasteryOutline, LectureRecord, SourceChunk } from '@/lib/types'
import { createInitialDataForMode, useStore } from '@/store/store'
import { MasteryMapView } from './LectureStudyViews'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

const scrollIntoView = vi.fn()
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })

describe('lecture mastery study view', () => {
  let container: HTMLDivElement
  let root: Root

  const courseId = 'course-1'
  const lecture: LectureRecord = {
    id: 'lecture-1', courseId, title: 'Lecture 1 — Gene expression', inputPath: 'pasted',
    processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0,
  }
  const textbook: AcademicFile = {
    id: 'textbook-1', courseId, lectureId: lecture.id, sourceType: 'upload',
    title: 'Gene Expression Textbook', fileName: 'BIOL103-Chapter-8.pdf', type: 'reading',
    linkedTopicIds: [], owner: 'course', processingStatus: 'ready', createdAt: 1, updatedAt: 1, order: 0,
  }
  const sourceText = 'Transcription produces an RNA copy of a DNA template.\nThe polymerase reads the template strand while building RNA 5′ to 3′.'
  const chunks: SourceChunk[] = [
    { id: 'source-1', fileId: textbook.id, courseId, content: sourceText, sourcePosition: { index: 11, label: 'Page 12' }, coveredByKeyPoint: true, createdAt: 1, updatedAt: 1, order: 0 },
    { id: 'source-2', fileId: textbook.id, courseId, content: 'Translation uses the codon sequence to assemble a polypeptide.', sourcePosition: { index: 12, label: 'Page 13' }, coveredByKeyPoint: true, createdAt: 1, updatedAt: 1, order: 1 },
  ]
  const outline: GeneratedMasteryOutline = {
    id: 'outline-1', courseId, lectureId: lecture.id, scope: 'lecture', scopeId: lecture.id,
    title: 'Gene expression mastery', unit: 'Lecture 1', specId: 'unit-mastery-outline-v1', specHash: 'hash-1',
    sourceChunkIds: chunks.map((chunk) => chunk.id), createdAt: 1, updatedAt: 1, order: 0,
    standards: [
      {
        id: 'objective-1', title: 'Explain how transcription preserves genetic information',
        freeRecallCues: ['Without notes, trace transcription from DNA template to RNA product.'],
        understand: ['RNA is complementary to the DNA template strand.'],
        beAbleToDo: ['Given a template sequence, write the RNA product 5′ to 3′.'],
        watchFor: ['Do not copy the coding strand without converting thymine to uracil.'],
        examPractice: [{
          prompt: 'A template strand reads 3′-TAC-5′. What RNA sequence is produced?',
          answer: '5′-AUG-3′',
          rationale: 'Build the complementary RNA antiparallel to the DNA template.',
          sourceChunkIds: ['source-1'],
        }],
        sourceChunkIds: ['source-1'], masteryState: 'not-started',
      },
      {
        id: 'objective-2', title: 'Connect codons to a polypeptide product',
        freeRecallCues: ['Explain how a codon sequence becomes an amino-acid sequence.'],
        understand: ['Ribosomes read mRNA codons during translation.'],
        beAbleToDo: ['Translate a short mRNA sequence using a codon table.'],
        watchFor: ['Keep the reading frame fixed after the start codon.'],
        sourceChunkIds: ['source-2'], masteryState: 'can-explain',
      },
    ],
  }

  beforeEach(() => {
    scrollIntoView.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    const data = structuredClone(createInitialDataForMode(false))
    data.academics.classCenter.lectures.push(lecture)
    data.academics.classCenter.files.push(textbook)
    data.academics.classCenter.sourceChunks.push(...chunks)
    data.academics.classCenter.generatedMasteryOutlines.push(outline)
    useStore.getState().replaceAll(data)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  function render(viewOutline: GeneratedMasteryOutline = outline) {
    return act(async () => root.render(<MasteryMapView outline={viewOutline} chunks={chunks} lecture={lecture} />))
  }

  it('shows the full objective outline first while keeping generated answers hidden and sources exact', async () => {
    await render()

    expect(container.textContent).toContain('Learn the map')
    expect(container.querySelector('nav[aria-label="Mastery objectives"]')).toBeTruthy()
    expect(container.textContent).toContain('RNA is complementary to the DNA template strand.')
    expect(container.textContent).toContain('Given a template sequence, write the RNA product 5′ to 3′.')
    expect(container.textContent).toContain('Do not copy the coding strand')
    expect(container.textContent).toContain('Original practice built from the selected sources')
    expect(container.textContent).toContain('A template strand reads 3′-TAC-5′.')

    const solution = container.querySelector<HTMLDetailsElement>('[data-testid="practice-solution-objective-1-0"]')!
    expect(solution.open).toBe(false)
    expect(solution.querySelector('summary')?.textContent).toBe('Show answer and working')

    const objectiveSources = [...container.querySelectorAll<HTMLDetailsElement>('details')].find((details) => details.querySelector('[data-source-chunk-id="source-1"]'))!
    expect(objectiveSources.open).toBe(false)
    await act(async () => objectiveSources.querySelector('summary')!.click())
    expect(objectiveSources.open).toBe(true)
    expect(objectiveSources.textContent).toContain('BIOL103-Chapter-8.pdf · Page 12')
    expect(objectiveSources.textContent).toContain(sourceText)
  })

  it('keeps blank-page recall separate and opens a chosen objective without revealing its checklist', async () => {
    await render()
    const recallMode = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Active recall'))!
    await act(async () => recallMode.click())

    expect(container.textContent).toContain('Close your notes. Answer first')
    expect(container.textContent).toContain('Choose a closed-notes prompt')
    const secondTrigger = document.getElementById([...container.querySelectorAll<HTMLElement>('[data-state]')].find((node) => node.textContent?.includes('Connect codons to a polypeptide product') && node.tagName === 'BUTTON')?.id ?? '') as HTMLButtonElement
    expect(secondTrigger.getAttribute('data-state')).toBe('closed')

    const objectiveButton = [...container.querySelectorAll<HTMLButtonElement>('nav[aria-label="Mastery objectives"] button')].find((button) => button.textContent?.includes('Connect codons to a polypeptide product'))!
    await act(async () => objectiveButton.click())

    expect(secondTrigger.getAttribute('data-state')).toBe('open')
    expect(document.activeElement).toBe(secondTrigger)
    expect(scrollIntoView).toHaveBeenCalled()
    expect(container.textContent).toContain('Explain how a codon sequence becomes an amino-acid sequence.')
    expect(container.querySelector<HTMLDetailsElement>('[data-testid="recall-reveal-objective-2"]')?.open).toBe(false)
  })

  it('persists self-assessment and renders an honest fallback for legacy saved maps', async () => {
    await render()
    const stateTrigger = container.querySelector<HTMLButtonElement>('button[aria-label="Mastery state for Explain how transcription preserves genetic information"]')!
    await act(async () => stateTrigger.click())
    const applyOption = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find((option) => option.textContent === 'Can apply without notes')!
    await act(async () => applyOption.click())

    const saved = useStore.getState().academics.classCenter.generatedMasteryOutlines.find((item) => item.id === outline.id)
    expect(saved?.standards[0].masteryState).toBe('can-apply-without-notes')

    const legacy: GeneratedMasteryOutline = {
      ...outline,
      id: 'legacy-outline',
      scope: undefined,
      standards: outline.standards.map(({ examPractice: _examPractice, ...standard }) => standard),
    }
    await render(legacy)

    expect(container.textContent).toContain('Legacy unit scope')
    expect(container.querySelector('[data-testid="legacy-practice-objective-1"]')).toBeTruthy()
    expect(container.textContent).toContain('This earlier saved map has no generated application questions or worked answers')
    expect(container.textContent).toContain('Given a template sequence, write the RNA product 5′ to 3′.')
    expect(container.textContent).not.toContain('Rebuild with AI')
    expect(container.querySelector('[data-testid^="practice-solution-"]')).toBeNull()
  })
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import type { ClassAssignment, Course } from '@/lib/types'
import { ToastProvider } from '@/components/common/ToastProvider'
import { ExamPrepMode } from './ExamPrepMode'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

const course: Course = {
  id: 'chem', term: 'Fall 2026', code: 'CHEM 262', title: 'Organic Chemistry II', credits: 3,
  grade: '', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 0,
}
const exam: ClassAssignment = {
  id: 'exam', courseId: course.id, title: 'Exam 2', type: 'exam', dueDate: '2099-10-14',
  status: 'not-started', linkedTopicIds: ['topic'], linkedFileIds: ['file'], coveredTopicIds: ['topic'],
  createdAt: 1, updatedAt: 1, order: 0,
}

function button(container: HTMLElement, label: string) {
  return [...container.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.includes(label))
}

describe('Exam Prep capacity and focused attempt paths', () => {
  let container: HTMLDivElement
  let root: Root
  const onExit = vi.fn()
  const onOpenTab = vi.fn()

  beforeEach(() => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    useStore.getState().update((draft) => {
      draft.courses.push(course)
      draft.academics.classCenter.topics.push({
        id: 'topic', courseId: course.id, title: 'Aldol condensation', basis: 'syllabus-standard',
        status: 'not-started', confidence: 2, sourceNoteIds: [], fsrs: {
          due: 0, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0,
          learningSteps: 0, reps: 0, lapses: 0, state: 0,
        }, order: 0,
      })
      draft.academics.classCenter.assignments.push(exam)
      draft.academics.classCenter.files.push({
        id: 'file', courseId: course.id, sourceType: 'upload', title: 'Lecture 16 slides',
        type: 'lecture-slides', linkedTopicIds: ['topic'], owner: 'course', createdAt: 1, updatedAt: 1, order: 0,
      })
      draft.academics.classCenter.sourceChunks.push({
        id: 'chunk', fileId: 'file', courseId: course.id, topicId: 'topic', content: 'Selected evidence',
        coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0,
      })
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    onExit.mockReset()
    onOpenTab.mockReset()
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function render() {
    function Harness() {
      const data = useStore((state) => state.academics.classCenter)
      return <ExamPrepMode course={course} data={data} exam={exam} onExit={onExit} onOpenTab={onOpenTab} />
    }
    await act(async () => root.render(<ToastProvider><Harness /></ToastProvider>))
  }

  it('requires an explicit capacity choice before persisting a plan', async () => {
    await render()
    expect(button(container, 'Create exam plan')?.disabled).toBe(true)
    expect(container.textContent).toContain('No weekly availability is recorded')

    await act(async () => button(container, 'Continue without it')?.click())
    expect(button(container, 'Create exam plan')?.disabled).toBe(false)
    expect(container.textContent).toContain('Un-timed plan')

    await act(async () => button(container, 'Create exam plan')?.click())
    expect(useStore.getState().academics.classCenter.examPrepPlans).toHaveLength(1)
    expect(container.querySelector('input[placeholder="Add a specific study task"]')).toBeTruthy()
  })

  it('restores the current question, keeps elapsed time factual, and produces actionable autopsy evidence', async () => {
    useStore.getState().update((draft) => {
      draft.academics.classCenter.generatedMockAttempts.push({
        id: 'attempt', courseId: course.id, examAssignmentId: exam.id, topicIds: ['topic'],
        sourceChunkIds: ['chunk'], specId: 'class-full-mock-v1', specHash: 'hash',
        questions: [
          { id: 'q1', prompt: 'Explain aldol selection.', sourceChunkId: 'chunk', topicId: 'topic', order: 0 },
          { id: 'q2', prompt: 'Compare the products.', sourceChunkId: 'chunk', topicId: 'topic', order: 1 },
        ],
        answers: { q1: 'First answer' }, flaggedQuestionIds: [], currentQuestionId: 'q2',
        startedAt: Date.now() - 65_000, createdAt: 1, updatedAt: 1, order: 0,
      })
    })
    await render()

    expect(container.textContent).toContain('Compare the products.')
    expect(container.querySelector('[role="timer"]')?.textContent).toMatch(/^01:0[45]$/)
    await act(async () => button(container, 'Previous')?.click())
    expect(useStore.getState().academics.classCenter.generatedMockAttempts[0].currentQuestionId).toBe('q1')
    await act(async () => button(container, 'Mark for review')?.click())
    expect(useStore.getState().academics.classCenter.generatedMockAttempts[0].flaggedQuestionIds).toEqual(['q1'])
    await act(async () => button(container, 'Save and exit')?.click())
    expect(onExit).toHaveBeenCalledOnce()
    expect(useStore.getState().academics.classCenter.generatedMockAttempts[0].endedAt).toBeUndefined()

    await act(async () => button(container, 'End attempt')?.click())
    expect(useStore.getState().academics.classCenter.generatedMockAttempts[0].endedAt).toEqual(expect.any(Number))
    expect(container.textContent).toContain('Post-mock autopsy')
    expect(container.textContent).toContain('Aldol condensation')
    expect(container.textContent).toContain('Lecture 16 slides')
    expect(button(container, 'Review topic')).toBeTruthy()
    expect(button(container, 'Open source')).toBeTruthy()
  })
})

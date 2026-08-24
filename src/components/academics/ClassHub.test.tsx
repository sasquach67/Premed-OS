import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WritingTools } from '@/components/academics/ClassHub'
import { createSeedData } from '@/data/seed'
import { recurringFeedbackThemes, readingDebt } from '@/lib/academics/writingEvidence'
import { createInitialDataForMode, CURRENT_STORE_VERSION, snapshotData, STORAGE_KEY, useStore } from '@/store/store'

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

let courseId = ''
const now = Date.UTC(2026, 7, 23)

describe('WritingTools', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    const seed = structuredClone(createSeedData())
    courseId = seed.courses.find((course) => course.code === 'ENGL 105')!.id
    const center = seed.academics.classCenter
    center.paperDrafts.push({
      id: 'draft-1', courseId, assignmentId: 'essay-2', title: 'Literacy narrative', stage: 'draft', selfDeadline: '2026-09-04',
      createdAt: now, updatedAt: now, order: 0,
    })
    center.assignedReadings.push(
      { id: 'reading-1', courseId, week: 'Week 2', title: 'Writing as revision', status: 'not-started', dueForDiscussion: '2026-08-20', createdAt: now, updatedAt: now, order: 0 },
      { id: 'reading-2', courseId, week: 'Week 3', title: 'Audience and purpose', status: 'skimmed', createdAt: now, updatedAt: now, order: 1 },
    )
    center.feedbackNotes.push(
      { id: 'feedback-1', courseId, assignmentId: 'essay-1', theme: 'clarify your claim', quote: 'State the claim before your evidence.', createdAt: now, updatedAt: now, order: 0 },
      { id: 'feedback-2', courseId, assignmentId: 'essay-2', theme: 'clarify your claim', createdAt: now + 1, updatedAt: now + 1, order: 1 },
      { id: 'feedback-3', courseId, assignmentId: 'essay-2', theme: 'Use stronger transitions', quote: 'Move the reader through the paragraph.', createdAt: now + 2, updatedAt: now + 2, order: 2 },
    )
    center.assignments.push(
      { id: 'essay-1', courseId, title: 'Literacy narrative', type: 'project', dueDate: '2026-09-10', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], createdAt: now, updatedAt: now, order: 0 },
      { id: 'essay-2', courseId, title: 'Rhetorical analysis', type: 'project', status: 'not-started', linkedTopicIds: [], linkedFileIds: [], createdAt: now, updatedAt: now, order: 1 },
    )
    const workspace = center.workspaces.find((item) => item.courseId === courseId)
    if (workspace) workspace.readingListState = 'partial'
    useStore.getState().replaceAll(seed)

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await render()
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function render() {
    const data = useStore.getState().academics.classCenter
    const workspace = data.workspaces.find((item) => item.courseId === courseId)
    await act(async () => {
      root.render(<WritingTools
        courseId={courseId}
        readingListState={workspace?.readingListState ?? 'unknown'}
        drafts={data.paperDrafts.filter((item) => item.courseId === courseId)}
        readings={data.assignedReadings.filter((item) => item.courseId === courseId)}
        feedback={data.feedbackNotes.filter((item) => item.courseId === courseId)}
        assignments={data.assignments.filter((item) => item.courseId === courseId)}
      />)
    })
  }

  it('renders the writing ladder from persisted records and keeps its controls durable across a rerender', async () => {
    expect(container.textContent).toContain('Current draft')
    expect(container.textContent).toContain('Professor deadline')
    expect(container.textContent).toContain('Readings')
    expect(container.querySelectorAll('.writing-term-dot')).toHaveLength(2)
    expect(container.textContent).toContain('clarify your claim')
    expect(container.textContent).toContain('State the claim before your evidence.')

    const revision = container.querySelector('button[aria-label^="Set Literacy narrative to Revision"]') as HTMLButtonElement
    await act(async () => revision.click())
    expect(useStore.getState().academics.classCenter.paperDrafts.find((item) => item.id === 'draft-1')?.stage).toBe('revision')

    await render()
    expect((container.querySelector('button[aria-label^="Set Literacy narrative to Revision"]') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true')

    expect(container.querySelector('button[aria-label="Reading status for Writing as revision: Not started"]')).toBeTruthy()
  })

  it('keeps reading-list completeness separate from the students recorded reading statuses', async () => {
    expect(container.textContent).toContain('You’re adding the list as you go.')
    await act(async () => ([...container.querySelectorAll('button')].find((item) => item.textContent?.includes('Mark list complete')) as HTMLButtonElement).click())

    expect(useStore.getState().academics.classCenter.workspaces.find((item) => item.courseId === courseId)?.readingListState).toBe('complete')
    expect(useStore.getState().academics.classCenter.assignedReadings.find((item) => item.id === 'reading-1')?.status).toBe('not-started')
  })

  it('survives the real persisted-store hydration seam without inventing Writing evidence', async () => {
    const seeded = snapshotData()

    for (const readingListState of ['unknown', 'partial', 'complete', 'not-applicable'] as const) {
      const beforeReload = structuredClone(seeded)
      const workspace = beforeReload.academics.classCenter.workspaces.find((item) => item.courseId === courseId)!
      workspace.type = 'writing'
      workspace.readingListState = readingListState
      useStore.getState().replaceAll(beforeReload)

      // This is the exact Zustand persist shape: partialize → localStorage →
      // `persist.rehydrate()`. It deliberately does not use a fake adapter.
      const partialize = useStore.persist.getOptions().partialize!
      const persisted = partialize(useStore.getState())
      useStore.getState().replaceAll(createInitialDataForMode(false))
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
      await useStore.persist.rehydrate()

      const afterReload = snapshotData()
      const center = afterReload.academics.classCenter
      const restoredWorkspace = center.workspaces.find((item) => item.courseId === courseId)
      const restoredDraft = center.paperDrafts.find((item) => item.id === 'draft-1')
      const restoredReadings = center.assignedReadings.filter((item) => item.courseId === courseId)
      const restoredFeedback = center.feedbackNotes.filter((item) => item.courseId === courseId)

      expect(restoredWorkspace).toMatchObject({ type: 'writing', readingListState })
      expect(restoredDraft).toMatchObject({ stage: 'draft', selfDeadline: '2026-09-04', assignmentId: 'essay-2' })
      // essay-2 intentionally has no professor deadline. Hydration must not
      // turn the student's target into one.
      expect(center.assignments.find((item) => item.id === 'essay-2')?.dueDate).toBeUndefined()
      expect(restoredReadings.map((item) => item.status)).toEqual(['not-started', 'skimmed'])
      expect(readingDebt(restoredReadings, readingListState, '2026-08-23')).toBe(readingListState === 'complete' ? 1 : 0)

      const themes = recurringFeedbackThemes(restoredFeedback)
      expect(themes).toHaveLength(1)
      expect(themes[0]).toMatchObject({ key: 'clarify your claim', label: 'clarify your claim', paperIds: ['essay-1', 'essay-2'] })
      expect(themes[0].notes).toHaveLength(2)
      expect(themes[0].notes.find((item) => item.quote)?.quote).toBe('State the claim before your evidence.')
      expect(restoredFeedback.find((item) => item.id === 'feedback-3')).toMatchObject({ theme: 'Use stronger transitions', quote: 'Move the reader through the paragraph.' })
    }
  })

  it('shows real empty Writing actions after the persisted Academics store is cleared', async () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    const empty = snapshotData()
    expect(empty.courses).toEqual([])
    expect(empty.academics.classCenter.workspaces).toEqual([])
    expect(empty.academics.classCenter.paperDrafts).toEqual([])
    expect(empty.academics.classCenter.assignedReadings).toEqual([])
    expect(empty.academics.classCenter.feedbackNotes).toEqual([])

    await act(async () => {
      root.render(<WritingTools courseId="empty-writing" readingListState="unknown" drafts={[]} readings={[]} feedback={[]} assignments={[]} />)
    })

    expect(container.textContent).toContain('No papers assigned yet')
    expect(container.textContent).toContain('No readings listed yet')
    expect(container.textContent).toContain('No recurring feedback theme yet')
    expect(container.textContent).toContain('No full reading list recorded.')
    expect(container.textContent).toContain('Add paper')
    expect(container.textContent).toContain('Add reading')
    expect(container.textContent).not.toMatch(/Literacy narrative|Writing as revision|clarify your claim|reading behind|BIOL 252|CHEM 262/)
  })
})

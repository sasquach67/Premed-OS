import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassHub, WritingTools } from '@/components/academics/ClassHub'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createDemoData } from '@/data/demoSeed'
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
HTMLElement.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1 }))
vi.stubGlobal('cancelAnimationFrame', vi.fn())

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

describe('ClassHub approved Overview', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('uses the saved class color as the banner ambience while keeping the study-resource action blue', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    workspace.color = 'red'

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })

    const banner = container.querySelector<HTMLElement>('.class-hub-banner')!
    expect(banner.querySelectorAll('.class-hub-identity')).toHaveLength(1)
    expect(banner.dataset.courseColor).toBe('red')
    expect(banner.style.getPropertyValue('--class-hub-accent')).toBe('#e8806f')
    expect(banner.style.getPropertyValue('--class-hub-accent-rgb')).toBe('232 128 111')
    expect(container.querySelector('button.class-hub-primary-action')?.textContent).toContain('Create study resources')
  })

  it('shows every professor and teaching assistant with structured contact details in the banner menu', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'general')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    seed.academics.classCenter.contacts = seed.academics.classCenter.contacts
      .filter((item) => item.courseId !== course.id)
      .concat([
        {
          id: 'contact-professor', courseId: course.id, name: 'Dr. Adrian Drummond-Cole', role: 'professor',
          email: 'adrian@example.edu', officeHours: 'Mon 1:00–2:00 PM', location: 'Saunders 214',
          createdAt: now, updatedAt: now, order: 0,
        },
        {
          id: 'contact-ta-fatima', courseId: course.id, name: 'Fatima Noor', role: 'TA',
          email: 'fatima@example.edu', officeHours: 'Tues 3:00–4:00 PM', location: 'Zoom',
          createdAt: now, updatedAt: now, order: 1,
        },
        {
          id: 'contact-ta-marco', courseId: course.id, name: 'Marco Ruiz', role: 'TA',
          email: 'marco@example.edu', officeHours: 'Thurs 11:00 AM–12:00 PM', location: 'Peabody 1040',
          createdAt: now, updatedAt: now, order: 2,
        },
      ])

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })

    const trigger = [...container.querySelectorAll('button')].find((item) => item.textContent?.includes('Office hours & links')) as HTMLButtonElement
    await act(async () => trigger.click())

    const contacts = document.body.querySelector('[aria-label="Course contacts"]')
    expect(contacts).toBeTruthy()
    expect(contacts?.textContent).toContain('Dr. Adrian Drummond-Cole')
    expect(contacts?.textContent).toContain('Professor')
    expect(contacts?.textContent).toContain('Fatima Noor')
    expect(contacts?.textContent).toContain('Marco Ruiz')
    expect(contacts?.textContent).toContain('Teaching assistant')
    expect(contacts?.textContent).toContain('Tues 3:00–4:00 PM')
    expect(contacts?.textContent).toContain('Peabody 1040')
    expect(document.body.querySelector('a[href="mailto:fatima@example.edu"]')).toBeTruthy()
    expect(document.body.querySelector('a[href="mailto:marco@example.edu"]')).toBeTruthy()
  })

  it('gives Writing classes a source-backed resource menu instead of replacing it with the draft action', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'writing')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })

    const trigger = container.querySelector('button.class-hub-primary-action') as HTMLButtonElement
    expect(trigger.textContent).toContain('Create study resources')
    await act(async () => trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 })))

    expect(document.body.textContent).toContain('Study guide')
    expect(document.body.textContent).toContain('Mastery Map')
    expect(document.body.textContent).not.toContain('Study outline')
    expect(document.body.textContent).not.toContain('Unit question bank')
  })

  it('gives General classes study resources suited to objective-led and applied coursework', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'general')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })

    const trigger = container.querySelector('button.class-hub-primary-action') as HTMLButtonElement
    expect(trigger.textContent).toContain('Create study resources')
    await act(async () => trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 })))

    expect(document.body.textContent).toContain('Study guide')
    expect(document.body.textContent).toContain('Mastery Map')
    expect(document.body.textContent).toContain('Practice questions')
    expect(document.body.textContent).not.toContain('Flashcards')
  })

  it('keeps transcript capture as the default while the bounded journal opens saved lecture evidence on demand', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    for (const topic of seed.academics.classCenter.topics.filter((item) => item.courseId === course.id)) {
      topic.status = 'ready'
      topic.fsrs.reps = 0
    }
    seed.academics.classCenter.lectures.push({
      id: 'lecture-saved-1',
      courseId: course.id,
      title: 'Lecture 1',
      inputPath: 'pasted',
      processingState: 'ready',
      occurredOn: '2026-08-26',
      createdAt: now,
      updatedAt: now,
      order: 0,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Class journal')
    expect(container.textContent).toContain('Build a lecture page')
    expect(container.textContent).toContain('Paste or upload a lecture source')
    expect(container.querySelector('.lecture-rail-list')).toBeTruthy()
    expect(container.textContent).toContain('Recent study work')
    expect(container.textContent).not.toContain('Class Plan')
    expect([...container.querySelectorAll<HTMLButtonElement>('button')].some((button) => button.textContent?.trim().startsWith('Topics'))).toBe(true)

    const savedLecture = container.querySelector('button.lecture-rail-entry') as HTMLButtonElement
    await act(async () => savedLecture.click())
    expect(container.textContent).toContain('Study Guide')
    expect(container.textContent).not.toContain('Lecture Brief')
    expect(container.textContent).toContain('Mastery Map')
    expect(container.textContent).toContain('0 selected sources')

    const addToday = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Add today’s lecture')
    expect(addToday).toBeTruthy()
    await act(async () => addToday!.click())
    expect(document.body.textContent).toContain('Build a lecture')
    expect(document.body.textContent).toContain('Add the transcript')
  })

  it('gives every saved lecture matching right-click and overflow actions for edit and recoverable delete', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const center = seed.academics.classCenter
    center.lectures = center.lectures.filter((lecture) => lecture.courseId !== course.id)
    center.lectures.push(
      {
        id: 'lecture-actions', courseId: course.id, title: 'Lecture 1 · Cell signaling', inputPath: 'pasted',
        transcriptFileId: 'lecture-actions-source', occurredOn: '2026-09-01', processingState: 'ready',
        workspaceState: 'complete', selectedSourceFileIds: ['lecture-actions-source'], masteryMapId: 'lecture-actions-mastery',
        createdAt: now, updatedAt: now, order: 0,
      },
      {
        id: 'lecture-actions-2', courseId: course.id, title: 'Lecture 2 · Autophagy generation', inputPath: 'pasted',
        aiTitle: 'Autophagy quality control',
        transcriptFileId: 'lecture-actions-source-2', occurredOn: '2026-09-02', processingState: 'ready',
        createdAt: now + 1, updatedAt: now + 1, order: 1,
      },
      {
        id: 'lecture-actions-3', courseId: course.id, title: 'Lecture 2', inputPath: 'pasted',
        transcriptFileId: 'lecture-actions-source-3', occurredOn: '2026-09-03', processingState: 'ready',
        createdAt: now + 2, updatedAt: now + 2, order: 2,
      },
    )
    center.files.push({
      id: 'lecture-actions-source', courseId: course.id, lectureId: 'lecture-actions', sourceType: 'paste',
      title: 'Cell signaling transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready',
      createdAt: now, updatedAt: now, order: 0,
    })
    center.generatedMasteryOutlines.push({
      id: 'lecture-actions-mastery', courseId: course.id, lectureId: 'lecture-actions', scope: 'lecture', scopeId: 'lecture-actions',
      title: 'Cell signaling mastery', unit: 'Lecture 1', specId: 'unit-mastery-outline-v1', specHash: 'actions', standards: [],
      sourceChunkIds: [], createdAt: now, updatedAt: now, order: 0,
    })
    center.lectureFindings.push({
      id: 'lecture-actions-finding', courseId: course.id, lectureId: 'lecture-actions', sourceChunkId: 'source-chunk',
      quote: 'Cell signaling', timestamp: '01:00', label: 'Emphasis', detail: 'Know this pathway.',
      createdAt: now, updatedAt: now, order: 0,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={center} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })

    const lectureRecord = container.querySelector<HTMLElement>('[data-lecture-actions="lecture-actions"]')!
    const card = lectureRecord.querySelector<HTMLButtonElement>('button.lecture-rail-entry')!
    const overflow = container.querySelector<HTMLButtonElement>('button[aria-label="Actions for Lecture 1 · Cell signaling"]')!
    const controls = overflow.closest<HTMLElement>('[data-lecture-rail-controls]')
    expect(controls).toBeTruthy()
    expect(controls?.textContent?.trim()).toBe('')
    expect(lectureRecord.className).toContain('grid-cols-[minmax(0,1fr)_1.75rem]')
    expect(controls?.className).not.toContain('absolute')
    expect(controls?.className).toContain('opacity-0')
    expect(controls?.className).toContain('pointer-events-none')
    expect(controls?.className).toContain('group-hover/lecture-record:opacity-100')
    expect(controls?.className).toContain('focus-within:opacity-100')
    expect(card.textContent).not.toMatch(/Lecture \d+\s*·\s*Lecture \d+/)
    for (const [lectureId, expectedTitle] of [
      ['lecture-actions', 'Lecture 1 · Cell signaling'],
      ['lecture-actions-2', 'Lecture 2 · Autophagy quality control'],
      ['lecture-actions-3', 'Lecture 3'],
    ]) {
      const record = container.querySelector<HTMLElement>(`[data-lecture-actions="${lectureId}"]`)!
      expect(record.className).toContain('grid-cols-[minmax(0,1fr)_1.75rem]')
      expect(record.querySelector('.lecture-rail-controls')?.className).not.toContain('absolute')
      expect(record.querySelector('b')?.textContent).toBe(expectedTitle)
    }
    await act(async () => card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 12 })))
    const contextItems = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    for (const label of ['Open lecture', 'Open full screen', 'Edit lecture', 'Delete lecture']) {
      expect(contextItems.some((item) => item.textContent?.trim() === label)).toBe(true)
    }

    const edit = contextItems.find((item) => item.textContent?.trim() === 'Edit lecture')!
    await act(async () => edit.click())
    const title = document.body.querySelector<HTMLInputElement>('input[aria-label="Lecture title"]')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(title, 'Lecture 1 · Receptor signaling')
      title.dispatchEvent(new Event('input', { bubbles: true }))
      title.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const save = [...document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Save changes')!
    await act(async () => save.click())
    expect(useStore.getState().academics.classCenter.lectures.find((lecture) => lecture.id === 'lecture-actions')?.title).toBe('Lecture 1 · Receptor signaling')

    expect(overflow).toBeTruthy()
    await act(async () => {
      overflow.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      overflow.click()
    })
    const remove = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((item) => item.textContent?.trim() === 'Delete lecture')!
    await act(async () => remove.click())
    expect(document.body.textContent).toContain('Attached files will stay in Class Materials')
    const confirm = [...document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Delete lecture')!
    await act(async () => confirm.click())

    const deleted = useStore.getState().academics.classCenter
    expect(deleted.lectures.some((lecture) => lecture.id === 'lecture-actions')).toBe(false)
    expect(deleted.files.find((file) => file.id === 'lecture-actions-source')).toMatchObject({ lectureId: undefined })
    expect(deleted.generatedMasteryOutlines.some((outline) => outline.id === 'lecture-actions-mastery')).toBe(false)
    expect(deleted.lectureFindings.some((finding) => finding.id === 'lecture-actions-finding')).toBe(false)

    const undo = [...document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Undo')!
    await act(async () => undo.click())
    const restored = useStore.getState().academics.classCenter
    expect(restored.lectures.some((lecture) => lecture.id === 'lecture-actions')).toBe(true)
    expect(restored.files.find((file) => file.id === 'lecture-actions-source')?.lectureId).toBe('lecture-actions')
    expect(restored.generatedMasteryOutlines.some((outline) => outline.id === 'lecture-actions-mastery')).toBe(true)
    expect(restored.lectureFindings.some((finding) => finding.id === 'lecture-actions-finding')).toBe(true)
  })

  it('makes the completed lecture workspace usable from the Class Hub with full screen still available', async () => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
    const course = seed.courses.find((item) => item.id === 'demo-course-biol103-current')!
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.courseId === course.id)!
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })

    const lectureTwo = [...container.querySelectorAll<HTMLButtonElement>('button.lecture-rail-entry')]
      .find((button) => button.textContent?.includes('Central Dogma'))!
    await act(async () => lectureTwo.click())

    const workspaceSurface = container.querySelector('[aria-label="Embedded lecture workspace"]')!
    expect(workspaceSurface.textContent).toContain('A gene is expressed through linked but distinct synthesis steps')
    expect(workspaceSurface.textContent).toContain('DNA gene')
    expect(workspaceSurface.textContent).toContain('Primary RNA transcript')
    expect(container.textContent).toContain('Open full screen')
    expect(workspaceSurface.textContent).not.toContain('Source-led draft available')

    const mastery = [...workspaceSurface.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Mastery Map')!
    await act(async () => mastery.click())
    expect(workspaceSurface.textContent).toContain('Trace gene expression from DNA to a mature transcript')
    expect(workspaceSurface.querySelectorAll('select[aria-label^="Mastery state for"]').length).toBe(5)

    const materials = [...workspaceSurface.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Materials')!
    await act(async () => materials.click())
    expect(workspaceSurface.textContent).toContain('Generated resources')
    expect(workspaceSurface.textContent).toContain('Your sources')
    expect(workspaceSurface.textContent).toContain('Mastery Map')
    expect(workspaceSurface.textContent).toContain('Lecture 2 Central Dogma BIOL103.pdf')
    expect([...workspaceSurface.querySelectorAll<HTMLButtonElement>('button')].some((button) => button.textContent?.trim() === 'Add source')).toBe(false)

    const sources = [...workspaceSurface.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Sources')!
    await act(async () => sources.click())
    expect(workspaceSurface.querySelector('input[placeholder="Search exact words across transcript and sources"]')).toBeTruthy()
  })

  it('keeps the transcript-first journal on writing and general class overviews', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'writing')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Class journal')
    expect(container.textContent).toContain('Add source')
    expect(container.textContent).toContain('Add materials')
    expect(container.textContent).toContain('Guide + Mastery')
  })

  it('retires the legacy Create study work action in favor of the lecture workspace', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    seed.academics.classCenter.lectures.push({
      id: 'lecture-with-source', courseId: course.id, title: 'Lecture #1', inputPath: 'pasted',
      transcriptFileId: 'lecture-source-file', occurredOn: '2026-08-27', topicIds: [], processingState: 'ready',
      createdAt: now, updatedAt: now, order: 0,
    })
    seed.academics.classCenter.files.push({
      id: 'lecture-source-file', courseId: course.id, lectureId: 'lecture-with-source', sourceType: 'paste',
      title: 'Lecture transcript source', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready',
      createdAt: now, updatedAt: now, order: 0,
    })
    seed.academics.classCenter.sourceChunks.push({
      id: 'lecture-source-chunk', fileId: 'lecture-source-file', courseId: course.id, content: 'Exact saved lecture evidence.',
      coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 0,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    await act(async () => (container.querySelector('button.lecture-rail-entry') as HTMLButtonElement).click())
    expect(container.textContent).toContain('Study Guide')
    expect(container.textContent).toContain('Mastery Map')
    expect(container.textContent).not.toContain('Create study work')
  })

  it('moves the legacy Read transcript action under Sources', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    seed.academics.classCenter.lectures.push({
      id: 'lecture-read-route', courseId: course.id, title: 'Lecture #1', inputPath: 'pasted', transcriptFileId: 'lecture-read-file',
      occurredOn: '2026-08-27', topicIds: [], processingState: 'ready', createdAt: now, updatedAt: now, order: 0,
    })
    seed.academics.classCenter.files.push({
      id: 'lecture-read-file', courseId: course.id, lectureId: 'lecture-read-route', sourceType: 'paste', title: 'Lecture transcript source',
      type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 0,
    })
    seed.academics.classCenter.sourceChunks.push({
      id: 'lecture-read-chunk', fileId: 'lecture-read-file', courseId: course.id, content: 'Exact transcript passage for the selected lecture.',
      coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: 0,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })
    await act(async () => (container.querySelector('button.lecture-rail-entry') as HTMLButtonElement).click())
    expect(container.textContent).not.toContain('Read transcript')
    expect(container.textContent).toContain('Transcript and supporting files stay under Sources')
  })

  it('retires the legacy Add evidence summary action', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    seed.academics.classCenter.lectures.push({
      id: 'lecture-add-evidence', courseId: course.id, title: 'Lecture #1', inputPath: 'pasted', transcriptFileId: 'lecture-add-evidence-file',
      occurredOn: '2026-08-27', topicIds: [], processingState: 'ready', createdAt: now, updatedAt: now, order: 0,
    })
    seed.academics.classCenter.files.push({
      id: 'lecture-add-evidence-file', courseId: course.id, lectureId: 'lecture-add-evidence', sourceType: 'paste', title: 'Transcript',
      type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 0,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })
    await act(async () => (container.querySelector('button.lecture-rail-entry') as HTMLButtonElement).click())
    expect(container.textContent).not.toContain('Add evidence')
    expect(container.textContent).toContain('Study Guide')
  })

  it('moves lecture materials behind Sources and Materials', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    seed.academics.classCenter.lectures.push({
      id: 'lecture-open-evidence', courseId: course.id, title: 'Lecture #1', inputPath: 'pasted', transcriptFileId: 'lecture-open-transcript',
      occurredOn: '2026-08-27', topicIds: [], processingState: 'ready', createdAt: now, updatedAt: now, order: 0,
    })
    seed.academics.classCenter.files.push(
      { id: 'lecture-open-transcript', courseId: course.id, lectureId: 'lecture-open-evidence', sourceType: 'paste', title: 'Transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 0 },
      { id: 'lecture-open-slides', courseId: course.id, lectureId: 'lecture-open-evidence', sourceType: 'upload', title: 'Lecture slides', type: 'lecture-slides', linkedTopicIds: [], owner: 'course', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 1 },
    )
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })
    await act(async () => (container.querySelector('button.lecture-rail-entry') as HTMLButtonElement).click())
    expect(container.textContent).not.toContain('Supporting evidence')
    expect(container.textContent).toContain('Transcript and supporting files stay under Sources')
  })

  it('moves generated lecture work behind the Materials view', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    seed.academics.classCenter.lectures.push({
      id: 'lecture-open-study', courseId: course.id, title: 'Lecture #1', inputPath: 'pasted', transcriptFileId: 'lecture-study-transcript',
      occurredOn: '2026-08-27', topicIds: [], processingState: 'ready', createdAt: now, updatedAt: now, order: 0,
    })
    seed.academics.classCenter.files.push(
      { id: 'lecture-study-transcript', courseId: course.id, lectureId: 'lecture-open-study', sourceType: 'paste', title: 'Transcript', type: 'transcript', linkedTopicIds: [], owner: 'mine', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 0 },
      { id: 'lecture-study-guide', courseId: course.id, lectureId: 'lecture-open-study', sourceType: 'paste', title: 'Lecture 1 study guide', type: 'study-guide', linkedTopicIds: [], owner: 'generated', processingStatus: 'ready', createdAt: now, updatedAt: now, order: 1 },
    )
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>)
    })
    await act(async () => (container.querySelector('button.lecture-rail-entry') as HTMLButtonElement).click())
    expect(container.textContent).not.toContain('Open study work')
    expect(container.textContent).toContain('Study Guide')
  })

  it('keeps Topics syllabus-led and groups scheduled standards by week before unit', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const topics = seed.academics.classCenter.topics.filter((item) => item.courseId === course.id)
    topics[0].scheduledFor = '2026-09-09'
    topics[0].unit = 'Later unit label'
    topics[1].scheduledFor = '2026-09-01'
    topics[1].unit = 'Earlier unit label'
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=topics`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    const text = container.textContent ?? ''
    expect(text).toContain('Syllabus standards, ordered by scheduled week.')
    expect(text).toContain('Import / refresh syllabus')
    expect(text).toContain('Week of Aug 31')
    expect(text).toContain('Week of Sep 7')
    expect(text.indexOf('Week of Aug 31')).toBeLessThan(text.indexOf('Week of Sep 7'))
    expect(text).not.toContain('Covered a topic today')
    expect([...container.querySelectorAll('button')].some((button) => button.textContent?.trim() === 'Add topic')).toBe(false)
  })

  it('keeps class Assignments execution-first with a global handoff and supporting grade scenario', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const assignment = seed.academics.classCenter.assignments.find((item) => item.courseId === course.id)!
    Object.assign(assignment, { category: 'Midterms', pointsEarned: 88, pointsPossible: 100, weight: 50, status: 'graded' })
    seed.academics.classCenter.gradeCategories.push(
      { id: 'test-midterms', courseId: course.id, name: 'Midterms', weight: 50, createdAt: now, updatedAt: now, order: 0 },
      { id: 'test-final', courseId: course.id, name: 'Final exam', weight: 50, createdAt: now, updatedAt: now, order: 1 },
    )
    useStore.getState().replaceAll(seed)

    const scrollIntoView = vi.mocked(HTMLElement.prototype.scrollIntoView)
    scrollIntoView.mockClear()
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=assignments&whatIf=1`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })
    await act(async () => { await new Promise<void>((resolve) => requestAnimationFrame(() => resolve())) })

    expect(container.textContent).toContain('Coursework execution, fixed to this class.')
    expect(container.textContent).not.toContain(`${course.code} only`)
    expect([...container.querySelectorAll('a')].some((link) => link.textContent?.includes('All assignments') && link.getAttribute('href')?.includes('tab=assignments'))).toBe(true)
    expect(container.textContent).toContain('Course grade context · supporting')
    expect(container.textContent).toContain('What if…')
    expect(container.querySelector('.class-hub-what-if-grid')).toBeTruthy()
    expect(scrollIntoView).toHaveBeenCalled()
    expect(useStore.getState().academics.classCenter.assignments.find((item) => item.id === assignment.id)?.pointsEarned).toBe(88)
  })

  it('restores a source-selection handoff from the study-guide deep link', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=materials&createMaterial=study-guide`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Create from selected material')
    expect(container.textContent).toContain('Study guide')
    expect(container.textContent).toContain('Nothing outside this selection is used.')
  })

  it('opens Add today’s lecture from the lecture-capture deep link', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=overview&captureLecture=1`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    expect(document.body.textContent).toContain('Build a lecture')
    expect(document.body.textContent).toContain('Transcript')
    expect(document.body.textContent).toContain('Materials')
  })

  it('keeps the topic-focused Guide notice outside the New Guide item action', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const topic = seed.academics.classCenter.topics.find((item) => item.courseId === course.id)!
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=guide&noteTopic=${topic.id}`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        </MemoryRouter>,
      )
    })

    const newItem = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'New Guide item')
    const showAll = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Show all Guide items')
    expect(newItem).toBeTruthy()
    expect(showAll).toBeTruthy()
    expect(newItem!.querySelector('button')).toBeNull()
    expect(container.textContent).toContain(`Showing Guide items linked to ${topic.title}`)
  })

  it('groups Materials by explicit course week and lets the student place uncertain work without hiding generated resources', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const topic = seed.academics.classCenter.topics.find((item) => item.courseId === course.id)!
    topic.scheduledFor = '2026-09-09'
    workspace.syllabusSchedule = [{ id: 'schedule-week-3', week: 'Week 3', label: 'Membrane transport', startDate: '2026-09-07', order: 0 }]
    const slides = {
      id: 'materials-week-slides', courseId: course.id, sourceType: 'upload' as const, title: 'Membrane transport slides', type: 'lecture-slides' as const,
      topicId: topic.id, linkedTopicIds: [topic.id], owner: 'course' as const, createdAt: now, updatedAt: now, order: 800,
    }
    seed.academics.classCenter.files.push(slides, {
      id: 'materials-learning-objectives', courseId: course.id, sourceType: 'upload', title: 'Unit 2 learning objectives', type: 'other',
      topicId: topic.id, linkedTopicIds: [topic.id], owner: 'course', createdAt: now, updatedAt: now, order: 799,
    }, {
      id: 'materials-unassigned-homework', courseId: course.id, sourceType: 'upload', title: 'Homework 4', type: 'other',
      linkedTopicIds: [], owner: 'mine', createdAt: now, updatedAt: now, order: 801,
    })
    seed.academics.classCenter.notes.unshift({
      id: 'materials-generated-outline', courseId: course.id, title: 'Study outline · Membrane transport', type: 'study-guide', kind: 'on-material',
      date: '2026-09-09', unit: '', topicIds: [], content: 'A source-grounded outline.', syncStatus: 'local-only', linkedFileIds: [slides.id], createdAt: now, updatedAt: now, order: 802,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=materials`]}>
          <ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider>
        </MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Course weeks')
    expect(container.textContent).toContain('Week 3')
    expect(container.textContent).toContain('Not placed yet')
    expect(container.textContent).toContain('No week assumed')
    expect(container.textContent).toContain('Study outline · Membrane transport')

    const placeHomework = container.querySelector<HTMLButtonElement>('button[aria-label="Place Homework 4 in a course week"]')!
    await act(async () => {
      placeHomework.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      placeHomework.click()
    })
    const weekTwo = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((item) => item.textContent?.trim() === 'Week 2')!
    await act(async () => weekTwo.click())
    expect(useStore.getState().academics.classCenter.files.find((file) => file.id === 'materials-unassigned-homework')?.courseWeek).toBe(2)
    await act(async () => useStore.getState().update((draft) => {
      const homework = draft.academics.classCenter.files.find((file) => file.id === 'materials-unassigned-homework')
      if (homework) homework.courseWeek = undefined
    }))

    const grouping = container.querySelector<HTMLButtonElement>('button[aria-label="Group materials"]')!
    await act(async () => {
      grouping.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      grouping.click()
    })
    const category = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find((option) => option.textContent?.trim() === 'Material type')!
    await act(async () => category.click())

    expect(container.textContent).toContain('Slides')
    expect(container.textContent).toContain('Learning objectives')
    expect(container.textContent).toContain('Generated resources')
    const unassigned = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Not placed')!
    await act(async () => unassigned.click())
    expect(container.textContent).toContain('Homework 4')
    expect(container.textContent).not.toContain('Unassigned')
  })

  it('does not invent a course week from a topic date without an explicit numbered syllabus week', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const topic = seed.academics.classCenter.topics.find((item) => item.courseId === course.id)!
    topic.scheduledFor = '2026-09-09'
    workspace.syllabusSchedule = [{ id: 'schedule-undated-label', week: 'September 7', label: 'Membrane transport', startDate: '2026-09-07', order: 0 }]
    seed.academics.classCenter.files.push({
      id: 'materials-date-only', courseId: course.id, sourceType: 'upload', title: 'Dated lecture slides', type: 'lecture-slides',
      topicId: topic.id, linkedTopicIds: [topic.id], owner: 'course', createdAt: now, updatedAt: now, order: 900,
    })
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=materials`]}>
          <ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider>
        </MemoryRouter>,
      )
    })

    const inbox = [...container.querySelectorAll<HTMLElement>('.class-hub-material-group')].find((group) => group.textContent?.includes('Not placed yet'))!
    expect(inbox.textContent).toContain('Dated lecture slides')
    expect(inbox.textContent).toContain('No week assumed')
    expect(container.textContent).not.toMatch(/Week of Sep/)
  })

  it('keeps generated study work in Materials and operational course context in Guide', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    seed.academics.classCenter.notes.unshift(
      { id: 'boundary-study-guide', courseId: course.id, title: 'Learning objectives outline', type: 'study-guide', kind: 'on-material', date: '2026-09-01', unit: '', topicIds: [], content: 'Generated objectives.', syncStatus: 'local-only', linkedFileIds: [], createdAt: now, updatedAt: now, order: 900 },
      { id: 'boundary-course-context', courseId: course.id, title: 'Ask about exam format', type: 'question-log', kind: 'about-class', date: '2026-09-01', unit: '', topicIds: [], content: 'Confirm whether the exam uses essays.', syncStatus: 'local-only', linkedFileIds: [], createdAt: now, updatedAt: now, order: 901 },
    )
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter key="materials-boundary" initialEntries={[`/academics/classes/${course.id}?classTab=materials&materialNote=boundary-study-guide`]}>
          <ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider>
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Learning objectives outline')
    expect(container.querySelector<HTMLDetailsElement>('#material-note-boundary-study-guide')?.open).toBe(true)
    expect(container.textContent).not.toContain('Ask about exam format')

    await act(async () => {
      root.render(
        <MemoryRouter key="guide-boundary" initialEntries={[`/academics/classes/${course.id}?classTab=guide`]}>
          <ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider>
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
    expect(container.textContent).toContain('Ask about exam format')
    expect(container.textContent).not.toContain('Learning objectives outline')
    expect(container.textContent).not.toContain('Study guides')
  })
})

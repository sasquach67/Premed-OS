import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LecturePage } from '@/pages/LecturePage'
import { JournalEntryPage } from '@/pages/JournalEntryPage'
import { ClassHub, WritingTools } from '@/components/academics/ClassHub'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createDemoData } from '@/data/demoSeed'
import type { ClassAssignment, AssignedReading } from '@/lib/types'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
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

const localFiles = vi.hoisted(() => ({ readLocalBlob: vi.fn() }))
vi.mock('@/lib/localBlobStore', () => localFiles)

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

  it('requires a title before saving a paper and keeps single feedback notes visible', async () => {
    const count = useStore.getState().academics.classCenter.paperDrafts.length
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Add paper'))!.click())
    expect(useStore.getState().academics.classCenter.paperDrafts).toHaveLength(count)
    const input = document.querySelector<HTMLInputElement>('[role="dialog"] input')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Named paper')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => document.querySelector<HTMLFormElement>('[role="dialog"] form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await render()
    expect(container.textContent).toContain('Named paper')
    expect(container.querySelector('button[aria-label="Edit Named paper"]')).toBeTruthy()
    expect(container.textContent).toContain('Move the reader through the paragraph.')
  })

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

  it.each(['stem', 'writing', 'general'] as const)('shows actionable header metrics for %s classes using unfinished work in the next seven days', async type => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-23T12:00:00'))
    try {
      const seed = structuredClone(createSeedData())
      const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
      workspace.type = type
      const course = seed.courses.find(item => item.id === workspace.courseId)!
      course.grade = 'A-'
      const assignment = (id: string, dueDate?: string, status: ClassAssignment['status'] = 'not-started', type: ClassAssignment['type'] = 'homework'): ClassAssignment => ({ id, courseId: course.id, title: id, dueDate, status, type, linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0 })
      seed.academics.classCenter.assignments = [
        assignment('past exam', '2026-09-22', 'not-started', 'exam'),
        assignment('next exam', '2026-10-22', 'not-started', 'exam'),
        assignment('today', '2026-09-23'), assignment('six days', '2026-09-29', 'in-progress'),
        assignment('seven days', '2026-09-30'), assignment('overdue', '2026-09-22'),
        assignment('submitted', '2026-09-24', 'submitted'), assignment('graded', '2026-09-24', 'graded'),
        assignment('dropped', '2026-09-24', 'dropped'), assignment('no date'),
      ]
      const reading = (id: string, dueForDiscussion?: string, status: AssignedReading['status'] = 'not-started'): AssignedReading => ({ id, courseId: course.id, title: id, week: '', dueForDiscussion, status, createdAt: 1, updatedAt: 1, order: 0 })
      seed.academics.classCenter.assignedReadings = [reading('today', '2026-09-23'), reading('skimmed', '2026-09-29', 'skimmed'), reading('finished', '2026-09-24', 'read'), reading('later', '2026-09-30'), reading('past', '2026-09-22'), reading('undated')]
      useStore.getState().replaceAll(seed)
      await act(async () => root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>))
      const metrics = [...container.querySelectorAll('[aria-label="Current metrics"] > div')].map(item => [...item.querySelectorAll('p')].map(p => p.textContent))
      expect(metrics).toEqual([['Grade', 'A-'], ['Next exam', 'In 29 days'], ['Due this week', '4']])
    } finally { vi.useRealTimers() }
  })

  it('continues directly into the saved imported notebook instead of selecting its catalog row', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
    const course = seed.courses.find(item => item.id === workspace.courseId)!
    const pkg = revisionFixture()
    const id = 'continue-imported'
    seed.academics.classCenter.lectures.push({
      id, courseId: course.id, title: pkg.entries[0].title, inputPath: 'pasted',
      processingState: 'ready', workspaceState: 'complete', createdAt: now, updatedAt: now, order: 0,
      importedNotebook: { original: pkg, current: pkg, originalRaw: JSON.stringify(pkg), entryId: pkg.entries[0].id, fingerprint: id, importedAt: now, progress: {}, notes: '' },
    })
    workspace.lastOpenedLectureId = id
    useStore.getState().replaceAll(seed)
    await act(async () => root.render(
      <MemoryRouter initialEntries={[`/academics/classes/${course.id}`]}><ToastProvider><Routes>
        <Route path="/academics/classes/:courseId" element={<ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />} />
        <Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} />
      </Routes></ToastProvider></MemoryRouter>,
    ))
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('Continue reading'))!.click())
    expect(container.querySelector('.notebook-entry-page')).toBeTruthy()
    expect(container.textContent).toContain(pkg.entries[0].title)
    expect(container.querySelector('.class-hub-overview')).toBeNull()
  })

  it.each(['journal', 'lectures'])('remembers the notebook opened through the %s reader route', async (route) => {
    const seed = createDemoData(new Date('2026-09-02T12:00:00-04:00').getTime())
    const course = seed.courses.find(item => item.id === 'demo-course-biol103-current')!
    const lecture = seed.academics.classCenter.lectures.find(item => item.courseId === course.id && item.workspaceState === 'complete')!
    const workspace = seed.academics.classCenter.workspaces.find(item => item.courseId === course.id)!
    workspace.lastOpenedLectureId = 'previous-entry'
    useStore.getState().replaceAll(seed)
    await act(async () => root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}/${route}/${lecture.id}`]}><ToastProvider><Routes>
      <Route path="/academics/classes/:courseId/journal/:entryId" element={<JournalEntryPage />} />
      <Route path="/academics/classes/:courseId/lectures/:lectureId" element={<LecturePage />} />
    </Routes></ToastProvider></MemoryRouter>))
    expect(useStore.getState().academics.classCenter.workspaces.find(item => item.courseId === course.id)?.lastOpenedLectureId).toBe(lecture.id)
  })

  it('keeps supporting screenshots out of Materials and its badge without deleting source records', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
    const course = seed.courses.find(item => item.id === workspace.courseId)!
    const base = { courseId: course.id, sourceType: 'upload' as const, type: 'reading' as const, linkedTopicIds: [], createdAt: now, updatedAt: now, order: 0 }
    seed.academics.classCenter.files = [
      { ...base, id: 'pdf', title: 'Lecture handout', fileName: 'lecture.pdf', mimeType: 'application/pdf', owner: 'course' },
      { ...base, id: 'shot', title: 'Screenshot 2026-09-03', fileName: 'capture.png', mimeType: 'image/png', owner: 'mine' },
      { ...base, id: 'generated', title: 'Generated concept map', fileName: 'map.png', mimeType: 'image/png', owner: 'generated' },
    ]
    seed.academics.classCenter.notes = []
    await act(async () => root.render(<MemoryRouter initialEntries={['/?classTab=materials']}><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>))
    expect(container.textContent).toContain('2 items in this course library')
    // Materials became the Lessons tab (Oct 2026); its file count moved to the Class files section.
    expect(container.querySelector('[role="tab"][data-state="active"]')?.textContent).toMatch(/^Lessons/)
    expect(container.querySelector('.lessons-files-count')?.textContent).toBe('2')
    expect(container.textContent).toContain('Lecture handout')
    expect(container.textContent).toContain('Generated concept map')
    expect(container.textContent).not.toContain('Screenshot 2026-09-03')
    const toggle = [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === 'Show supporting images (1)')!
    await act(async () => toggle.click())
    expect(container.textContent).toContain('Screenshot 2026-09-03')
    expect(seed.academics.classCenter.files).toHaveLength(3)
  })

  it('uses the saved class color as the banner ambience while keeping the study-resource action blue', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    workspace.color = 'red'

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
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
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
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

  it('offers flashcards for Writing classes without duplicating Notebook resources', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'writing')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
    })

    const trigger = container.querySelector('button.class-hub-primary-action') as HTMLButtonElement
    expect(trigger.textContent).toContain('Create study resources')
    await act(async () => trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 })))

    const menu = document.body.querySelector('[role=menu]')!
    expect([...menu.querySelectorAll('[role=menuitem]')].map(item => item.textContent?.trim())).toEqual(['Flashcards', 'Revised notes'])
    expect(menu.textContent).toContain('included in Class Notebook')
  })

  it('offers flashcards for General classes without duplicating Notebook resources', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'general')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!

    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
    })

    const trigger = container.querySelector('button.class-hub-primary-action') as HTMLButtonElement
    expect(trigger.textContent).toContain('Create study resources')
    await act(async () => trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 })))

    const menu = document.body.querySelector('[role=menu]')!
    expect([...menu.querySelectorAll('[role=menuitem]')].map(item => item.textContent?.trim())).toEqual(['Flashcards', 'Revised notes'])
    expect(menu.textContent).toContain('included in Class Notebook')
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
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}/lectures/lecture-with-source`]}>
          
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })

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
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}/lectures/lecture-read-route`]}><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
    })
    expect(container.textContent).not.toContain('Read transcript')
    expect([...container.querySelectorAll('button')].some(button => button.textContent?.trim() === 'Sources')).toBe(true)
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
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}/lectures/lecture-add-evidence`]}><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
    })
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
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}/lectures/lecture-open-evidence`]}><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
    })
    expect(container.textContent).not.toContain('Supporting evidence')
    expect([...container.querySelectorAll('button')].some(button => button.textContent?.trim() === 'Sources')).toBe(true)
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
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}/lectures/lecture-open-study`]}><Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>)
    })
    expect(container.textContent).not.toContain('Open study work')
    expect(container.textContent).toContain('Study Guide')
  })

  it('redirects retired Topics links to Materials and preserves legacy records', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const topics = seed.academics.classCenter.topics.filter((item) => item.courseId === course.id)
    topics[0].scheduledFor = '2026-09-09'
    topics[0].unit = 'Later unit label'
    topics[1].scheduledFor = '2026-09-01'
    topics[1].unit = 'Earlier unit label'
    useStore.getState().replaceAll(seed)
    const savedFiles = structuredClone(useStore.getState().academics.classCenter.files)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=topics`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })

    const text = container.textContent ?? ''
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toMatch(/^Lessons/)
    expect([...container.querySelectorAll('[role="tab"]')].map(tab => tab.textContent)).not.toContain('Topics')
    expect(text).not.toContain('Syllabus standards, ordered by scheduled week.')
    expect(useStore.getState().academics.classCenter.topics).toEqual(seed.academics.classCenter.topics)
    expect(useStore.getState().academics.classCenter.files).toEqual(savedFiles)
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
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
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
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Create from selected material')
    expect(container.textContent).toContain('Study guide')
    expect(container.textContent).toContain('Nothing outside this selection is used.')
  })

  it('opens Add to notebook from the lecture-capture deep link', async () => {
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
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })

    expect(document.body.textContent).toContain('Gather your files')
    expect(document.body.textContent).toContain('Review a lesson')
    expect(document.body.textContent).toContain('Prepare for an exam')
    expect(document.body.textContent).toContain('Copy the prompt into a new AI chat')
    expect(document.body.textContent).toContain('Bring it back')
    expect(document.body.querySelector('[aria-label="Notebook workflow progress"]')).toBeNull()

  })

  it('ignores retired topic filters so old Guide links keep all reference notes accessible', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find((item) => item.type === 'stem')!
    const course = seed.courses.find((item) => item.id === workspace.courseId)!
    const topic = seed.academics.classCenter.topics.find((item) => item.courseId === course.id)!
    useStore.getState().replaceAll(seed)

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=details&noteTopic=${topic.id}`]}>
          <ToastProvider>
            <ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} />
          </ToastProvider>
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })

    const newItem = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'New reference note')
    const showAll = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Show all Guide items')
    expect(newItem).toBeTruthy()
    expect(showAll).toBeUndefined()
    expect(newItem!.querySelector('button')).toBeNull()
    expect(container.textContent).not.toContain('Showing Guide items linked to')
    for (const note of seed.academics.classCenter.notes.filter(note => note.courseId === course.id && note.kind === 'about-class' && note.type !== 'study-guide' && !note.studentGuidance)) {
      expect(container.textContent).toContain(note.title)
    }
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
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })

    expect(container.textContent).toContain('Course weeks')
    expect(container.textContent).toContain('Week 3')
    expect(container.textContent).toContain('Needs organizing')
    expect(container.textContent).toContain('Choose a week or keep it in General materials')
    expect(container.textContent).toContain('Study outline · Membrane transport')
    expect(container.querySelector('.class-hub-material-file')?.textContent).not.toContain('Summarize')
    expect(container.querySelector('.class-hub-material-file')?.textContent).not.toContain('Mine')
    expect(container.textContent).not.toContain('Prime yourself')
    // General is an explicit saved choice, even for a source linked to Week 3.
    const organizeSlides = container.querySelector<HTMLButtonElement>('button[aria-label="Organize Membrane transport slides"]')!
    await act(async () => {
      organizeSlides.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      organizeSlides.click()
    })
    const general = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent?.startsWith('General materials'))!
    await act(async () => general.click())
    expect(useStore.getState().academics.classCenter.files.find(file => file.id === slides.id)?.materialPlacement).toBe('general')
    const saved = structuredClone(snapshotData())
    await act(async () => useStore.getState().replaceAll(saved))
    expect(useStore.getState().academics.classCenter.files.find(file => file.id === slides.id)?.materialPlacement).toBe('general')


    const placeHomework = container.querySelector<HTMLButtonElement>('button[aria-label="Organize Homework 4"]')!
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
    const unassigned = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Needs organizing')!
    await act(async () => unassigned.click())
    expect(container.textContent).toContain('Homework 4')
    expect(container.textContent).not.toContain('Unassigned')
  })

  it('previews a retrieved PDF inside the app without an asynchronous popup', async () => {
    const createUrl = vi.fn(() => 'blob:original-preview')
    const revokeUrl = vi.fn()
    const previousCreate = URL.createObjectURL
    const previousRevoke = URL.revokeObjectURL
    URL.createObjectURL = createUrl
    URL.revokeObjectURL = revokeUrl
    try {
      localFiles.readLocalBlob.mockResolvedValueOnce(new Blob(['pdf'], { type: 'application/pdf' }))
      const seed = structuredClone(createSeedData())
      const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
      const course = seed.courses.find(item => item.id === workspace.courseId)!
      seed.academics.classCenter.files.push({ id: 'original-preview', title: 'Original reading', type: 'reading', sourceType: 'upload', owner: 'mine', courseId: course.id, blobRef: 'idb://academics/material/original-preview', linkedTopicIds: [], createdAt: now, updatedAt: now, order: 900 })
      useStore.getState().replaceAll(seed)
      await act(async () => root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=materials`]}><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>))
      await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Open Original reading"]')!.click())
      expect(document.body.querySelector('iframe[title="Preview of Original reading"]')?.getAttribute('src')).toBe('blob:original-preview')
      expect(document.body.querySelector('a[download="Original reading"]')?.getAttribute('href')).toBe('blob:original-preview')
      await act(async () => root.render(null))
      expect(revokeUrl).toHaveBeenCalledWith('blob:original-preview')
    } finally {
      URL.createObjectURL = previousCreate
      URL.revokeObjectURL = previousRevoke
    }
  })

  it.each(['missing', 'storage-error'])('explains an unavailable original in the file reader (%s)', async (reason) => {
    if (reason === 'storage-error') localFiles.readLocalBlob.mockRejectedValueOnce(new Error('Storage denied'))
    else localFiles.readLocalBlob.mockResolvedValueOnce(undefined)
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
    const course = seed.courses.find(item => item.id === workspace.courseId)!
    seed.academics.classCenter.files.push({ id: 'missing-original', title: 'Missing reading', type: 'reading', courseId: course.id, sourceType: 'upload', blobRef: 'idb://missing-original', owner: 'mine', linkedTopicIds: [], createdAt: now, updatedAt: now, order: 900 })
    useStore.getState().replaceAll(seed)
    await act(async () => root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=materials`]}><ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider></MemoryRouter>))
    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Open Missing reading"]')!.click())
    expect(localFiles.readLocalBlob).toHaveBeenCalledWith('idb://missing-original')
    const reader = document.body.querySelector('[role="dialog"]')!
    expect(reader).not.toBeNull()
    expect(reader.textContent).toContain('Original file unavailable in this browser')
    expect(reader.textContent).toContain('browser and site where you uploaded it')
    expect([...reader.querySelectorAll('button')].find(button => button.textContent?.includes('Summarize for class'))).toBeUndefined()
  })

  it('keeps general files and notes out of the organizing inbox and allows moving them to a week', async () => {
    const seed = structuredClone(createSeedData())
    const workspace = seed.academics.classCenter.workspaces.find(item => item.type === 'stem')!
    const course = seed.courses.find(item => item.id === workspace.courseId)!
    const topic = seed.academics.classCenter.topics.find(item => item.courseId === course.id)!
    topic.scheduledFor = '2026-09-09'
    workspace.syllabusSchedule = [{ id: 'week-three', week: 'Week 3', label: 'Teaching', startDate: '2026-09-07', order: 0 }]
    seed.academics.classCenter.files.push({ id: 'general-transcript', title: 'Class discussion transcript', type: 'transcript', courseId: course.id, sourceType: 'paste', owner: 'mine', linkedTopicIds: [topic.id], materialPlacement: 'general', createdAt: now, updatedAt: now, order: 900 })
    seed.academics.classCenter.notes.push({ id: 'general-note', courseId: course.id, title: 'Reference notes', type: 'study-guide', kind: 'on-material', materialPlacement: 'general', date: '2026-09-09', unit: '', topicIds: [topic.id], content: 'Reference explanation', syncStatus: 'local-only', linkedFileIds: [], createdAt: now, updatedAt: now, order: 901 })
    useStore.getState().replaceAll(seed)
    function LiveMaterials() {
      const state = useStore()
      return <ClassHub course={course} workspace={workspace} data={state.academics.classCenter} persons={state.persons} />
    }
    await act(async () => root.render(<MemoryRouter initialEntries={[`/academics/classes/${course.id}?classTab=materials`]}><ToastProvider><LiveMaterials /></ToastProvider></MemoryRouter>))
    const generalGroup = () => [...container.querySelectorAll<HTMLElement>('.class-hub-material-group')].find(group => group.textContent?.includes('For the whole class'))!
    expect(generalGroup().textContent).toContain('Class discussion transcript')
    expect(generalGroup().textContent).toContain('Reference notes')
    const filter = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Needs organizing')!
    await act(async () => filter.click())
    expect(container.textContent).not.toContain('Class discussion transcript')
    expect(container.textContent).not.toContain('Reference notes')
    const all = [...container.querySelector('.lessons-files')!.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim().startsWith('All '))!
    await act(async () => all.click())
    const organize = container.querySelector<HTMLButtonElement>('button[aria-label="Organize Class discussion transcript"]')!
    await act(async () => { organize.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 })); organize.click() })
    const week = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent?.trim() === 'Week 2')!
    await act(async () => week.click())
    const file = useStore.getState().academics.classCenter.files.find(item => item.id === 'general-transcript')!
    expect(file.materialPlacement).toBeUndefined()
    expect(file.courseWeek).toBe(2)
    expect(generalGroup().textContent).not.toContain('Class discussion transcript')
    expect(generalGroup().textContent).toContain('Reference notes')
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
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })

    const inbox = [...container.querySelectorAll<HTMLElement>('.class-hub-material-group')].find((group) => group.textContent?.includes('Needs organizing'))!
    expect(inbox.textContent).toContain('Dated lecture slides')
    expect(inbox.textContent).toContain('Choose a week or keep it in General materials')
    expect(container.textContent).not.toMatch(/Week of Sep/)
  })

  it('keeps generated study work in Materials and operational course context in Class details', async () => {
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
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Learning objectives outline')
    expect(container.querySelector<HTMLDetailsElement>('#material-note-boundary-study-guide')?.open).toBe(true)
    expect(container.textContent).not.toContain('Ask about exam format')

    await act(async () => {
      root.render(
        <MemoryRouter key="guide-boundary" initialEntries={[`/academics/classes/${course.id}?classTab=details`]}>
          <ToastProvider><ClassHub course={course} workspace={workspace} data={seed.academics.classCenter} persons={seed.persons} /></ToastProvider>
        <Routes><Route path="/academics/classes/:courseId/lectures/:lectureId" element={<ToastProvider><LecturePage /></ToastProvider>} /><Route path="/academics/classes/:courseId/journal/:entryId" element={<ToastProvider><JournalEntryPage /></ToastProvider>} /><Route path="*" element={null} /></Routes></MemoryRouter>,
      )
      await Promise.resolve()
    })
    expect(container.textContent).toContain('Ask about exam format')
    expect(container.textContent).not.toContain('Learning objectives outline')
    expect(container.textContent).not.toContain('Study guides')
  })
})

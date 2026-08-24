import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassCenter } from './ClassCenter'
import { ToastProvider } from '@/components/common/ToastProvider'
import { CURRENT_STORE_VERSION, createInitialDataForMode, snapshotData, STORAGE_KEY, useStore } from '@/store/store'
import { retainLocalSyllabus } from '@/lib/academics/localSyllabusFiles'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/lib/academics/localSyllabusFiles', () => ({
  retainLocalSyllabus: vi.fn(async (_file: File, id: string) => `local-syllabus:${id}`),
}))

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

const SYLLABUS = `CHEM 262 — Organic Chemistry II
Week 1: Aromatic substitution
Week 2: Stereochemistry
Midterm Exam — October 14, 2026
Problem sets — 15%
Exams — 60%
Final — 25%
Problem set 1 due September 9, 2026
Attendance is required. Office hours Tuesday 2 PM.`

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

function button(container: HTMLElement, label: string) {
  const result = [...container.querySelectorAll('button')].find((item) => item.textContent?.includes(label))
  if (!result) throw new Error(`Could not find button containing ${label}`)
  return result as HTMLButtonElement
}

describe('syllabus setup journey persistence (§4.1-M)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.mocked(retainLocalSyllabus).mockClear()
    localStorage.removeItem(STORAGE_KEY)
    useStore.getState().replaceAll(createInitialDataForMode(false))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.removeItem(STORAGE_KEY)
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function render(entry: string) {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={[entry]}><ToastProvider><ClassCenter /></ToastProvider></MemoryRouter>)
    })
  }

  async function readPastedSyllabus(mode: 'import' | 'reimport' = 'import') {
    const textarea = container.querySelector('textarea[placeholder="Paste syllabus text from Canvas…"]') as HTMLTextAreaElement
    expect(textarea).toBeTruthy()
    await act(async () => setTextareaValue(textarea, SYLLABUS))
    await act(async () => button(container, 'Read syllabus').click())
    expect(container.textContent).toContain(mode === 'reimport' ? 'things changed' : 'Here’s what I found')
  }

  it('creates one class only after review, persists all parsed course records, and retains the source locally', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import syllabus').click())
    expect(snapshotData().courses).toHaveLength(0)

    await readPastedSyllabus()
    expect(snapshotData().courses).toHaveLength(0)
    await act(async () => button(container, 'Add to CHEM 262').click())

    const created = snapshotData()
    expect(created.courses).toHaveLength(1)
    const course = created.courses[0]
    const center = created.academics.classCenter
    expect(course).toMatchObject({ code: 'CHEM 262', title: 'Organic Chemistry II' })
    expect(center.workspaces.filter((item) => item.courseId === course.id)).toHaveLength(1)
    expect(center.topics.filter((item) => item.courseId === course.id)).toHaveLength(2)
    expect(center.assignments.filter((item) => item.courseId === course.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Midterm Exam', dueDate: '2026-10-14', type: 'exam' }),
      expect.objectContaining({ title: 'Problem set 1', dueDate: '2026-09-09' }),
    ]))
    expect(center.gradeCategories.filter((item) => item.courseId === course.id).map((item) => item.weight).sort((a, b) => a - b)).toEqual([15, 25, 60])
    expect(center.gradeCategories.filter((item) => item.courseId === course.id).every((item) => item.policyNote?.includes('Attendance is required.'))).toBe(true)
    expect(center.files.filter((item) => item.courseId === course.id && item.type === 'syllabus')).toEqual([
      expect.objectContaining({ blobRef: expect.stringMatching(/^local-syllabus:/), sourceType: 'upload' }),
    ])
    expect(retainLocalSyllabus).toHaveBeenCalledTimes(1)

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()

    const hydrated = snapshotData()
    expect(hydrated.courses).toHaveLength(1)
    expect(hydrated.academics.classCenter.topics.filter((item) => item.courseId === course.id)).toHaveLength(2)
    expect(hydrated.academics.classCenter.assignments.filter((item) => item.courseId === course.id)).toHaveLength(2)
    expect(hydrated.academics.classCenter.gradeCategories.filter((item) => item.courseId === course.id)).toHaveLength(3)
    expect(hydrated.academics.classCenter.files.find((item) => item.courseId === course.id)?.blobRef).toMatch(/^local-syllabus:/)
  })

  it('treats a second scoped import as a data-backed diff and never creates a duplicate course or workspace', async () => {
    const initial = createInitialDataForMode(false)
    initial.courses.push({
      id: 'chem-262', code: 'CHEM 262', title: 'Organic Chemistry II', term: 'Fall 2026', credits: 3,
      grade: '', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 0,
    })
    initial.academics.classCenter.workspaces.push({
      id: 'workspace-chem-262', courseId: 'chem-262', color: 'blue', icon: 'flask', type: 'stem',
      status: 'active', createdAt: 1, updatedAt: 1, order: 0,
    })
    initial.academics.classCenter.topics.push({
      id: 'topic-week-1', courseId: 'chem-262', title: 'Week 1: Aromatic substitution', unit: 'Week 1: Aromatic substitution',
      status: 'not-started', fsrs: {} as never, confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0,
    })
    useStore.getState().replaceAll(initial)

    await render('/academics?tab=class-center&importFor=chem-262')
    expect(container.textContent).toContain('Add a syllabus to CHEM 262')
    await readPastedSyllabus('reimport')
    expect(container.textContent).toContain('Re-import · CHEM 262')
    expect(container.textContent).toContain('items are unchanged and are not listed again')
    await act(async () => button(container, 'Apply accepted changes').click())

    const after = snapshotData()
    expect(after.courses).toHaveLength(1)
    expect(after.academics.classCenter.workspaces).toHaveLength(1)
    expect(after.courses[0].id).toBe('chem-262')
    // The pre-existing topic survives its default Keep decision; the new week
    // is added by its default Accept decision. This is identity-based, not positional.
    expect(after.academics.classCenter.topics.filter((item) => item.courseId === 'chem-262').map((item) => item.title)).toEqual(expect.arrayContaining([
      'Week 1: Aromatic substitution', 'Week 2: Stereochemistry',
    ]))
  })

  it('attaches a first scoped import to its existing class and fills only blank logistics fields', async () => {
    const initial = createInitialDataForMode(false)
    initial.courses.push({
      id: 'chem-262', code: 'CHEM 262', title: 'Organic Chemistry II', term: 'Fall 2026', credits: 3,
      grade: '', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 0,
    })
    initial.academics.classCenter.workspaces.push({
      id: 'workspace-chem-262', courseId: 'chem-262', instructor: 'Dr. Student-entered', color: 'blue', icon: 'flask', type: 'stem',
      status: 'active', createdAt: 1, updatedAt: 1, order: 0,
    })
    useStore.getState().replaceAll(initial)

    await render('/academics?tab=class-center&importFor=chem-262')
    await readPastedSyllabus()
    await act(async () => button(container, 'Add to CHEM 262').click())

    const after = snapshotData()
    expect(after.courses).toHaveLength(1)
    expect(after.academics.classCenter.workspaces).toHaveLength(1)
    const workspace = after.academics.classCenter.workspaces[0]
    expect(workspace).toMatchObject({ courseId: 'chem-262', instructor: 'Dr. Student-entered' })
    expect(workspace.meetingDays || workspace.meetingTime || workspace.location).toBeTruthy()
    const categories = after.academics.classCenter.gradeCategories.filter((item) => item.courseId === 'chem-262')
    expect(categories).toHaveLength(3)
    expect(categories.every((item) => item.policyNote?.includes('Attendance is required.'))).toBe(true)
    expect(categories.every((item) => item.dropLowestCount === undefined && item.replacementRule === undefined)).toBe(true)
  })
})

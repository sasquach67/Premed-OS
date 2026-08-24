import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassCenter } from './ClassCenter'
import { ToastProvider } from '@/components/common/ToastProvider'
import { CURRENT_STORE_VERSION, createInitialDataForMode, snapshotData, STORAGE_KEY, useStore } from '@/store/store'
import { retainLocalSyllabus } from '@/lib/academics/localSyllabusFiles'
import { retainLocalMaterial } from '@/lib/academics/localMaterialFiles'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/lib/academics/localSyllabusFiles', () => ({
  retainLocalSyllabus: vi.fn(async (_file: File, id: string) => `local-syllabus:${id}`),
}))

vi.mock('@/lib/academics/localMaterialFiles', () => ({
  retainLocalMaterial: vi.fn(async (_file: File, id: string) => `local-material:${id}`),
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

const PROBLEM_SET = `CHEM 262 Problem Set 6
Due Oct 24, 2026
1. Draw the mechanism for the following substitution.
2. Rank the leaving groups below.
3. Predict the major product.`

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function button(container: HTMLElement, label: string) {
  const result = [...container.querySelectorAll('button')].find((item) => item.textContent?.includes(label))
  if (!result) throw new Error(`Could not find button containing ${label}`)
  return result as HTMLButtonElement
}

function buttonInRow(container: HTMLElement, rowText: string, label: string) {
  const result = [...container.querySelectorAll('button')].find((item) => {
    const rowDetails = item.parentElement?.previousElementSibling
    return item.textContent?.trim() === label && rowDetails?.textContent?.includes(rowText)
  })
  if (!result) throw new Error(`Could not find ${label} for ${rowText}`)
  return result as HTMLButtonElement
}

describe('syllabus setup journey persistence (§4.1-M)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.mocked(retainLocalSyllabus).mockClear()
    vi.mocked(retainLocalMaterial).mockClear()
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

    // A student correction is part of the same ownership boundary: hydration
    // must not revive the parsed label over a later student-owned edit.
    useStore.getState().update((draft) => {
      const topic = draft.academics.classCenter.topics.find((item) => item.courseId === course.id)
      if (topic) topic.title = 'Aromatic substitution — student wording'
    })
    const expected = snapshotData()

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()

    const hydrated = snapshotData()
    expect(hydrated.courses).toEqual(expected.courses.map((course) => ({
      ...course,
      // Planner-term identity is losslessly derived by the current store
      // migration; all fields that the syllabus flow owns remain unchanged.
      plannerTermId: course.plannerTermId ?? 'planner-term-fall-2026',
    })))
    expect(hydrated.academics.classCenter.workspaces.filter((item) => item.courseId === course.id)).toEqual(expected.academics.classCenter.workspaces.filter((item) => item.courseId === course.id))
    const topicFieldsOwnedByImport = (item: typeof hydrated.academics.classCenter.topics[number]) => ({
      id: item.id, courseId: item.courseId, title: item.title, unit: item.unit,
      status: item.status, confidence: item.confidence, sourceNoteIds: item.sourceNoteIds,
      linkedFileIds: item.linkedFileIds, order: item.order,
    })
    // Hydration may add empty linkage arrays to a legacy record shape, but it
    // cannot alter any field this import or a later student correction owns.
    expect(hydrated.academics.classCenter.topics.filter((item) => item.courseId === course.id).map(topicFieldsOwnedByImport)).toEqual(expected.academics.classCenter.topics.filter((item) => item.courseId === course.id).map(topicFieldsOwnedByImport))
    expect(hydrated.academics.classCenter.assignments.filter((item) => item.courseId === course.id)).toEqual(expected.academics.classCenter.assignments.filter((item) => item.courseId === course.id))
    expect(hydrated.academics.classCenter.gradeCategories.filter((item) => item.courseId === course.id)).toEqual(expected.academics.classCenter.gradeCategories.filter((item) => item.courseId === course.id))
    const fileFieldsOwnedByImport = (item: typeof hydrated.academics.classCenter.files[number]) => ({
      id: item.id, courseId: item.courseId, title: item.title, type: item.type,
      sourceType: item.sourceType, owner: item.owner, blobRef: item.blobRef,
      fileName: item.fileName, mimeType: item.mimeType, linkedTopicIds: item.linkedTopicIds,
      order: item.order,
    })
    // File processing state is derived during hydration. The source identity
    // and class association written by the import must survive unchanged.
    expect(hydrated.academics.classCenter.files.filter((item) => item.courseId === course.id).map(fileFieldsOwnedByImport)).toEqual(expected.academics.classCenter.files.filter((item) => item.courseId === course.id).map(fileFieldsOwnedByImport))
  })

  it('creates a class once, then scopes the Add-class import fast path to that same class', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Add manually').click())

    const code = document.body.querySelector('input[placeholder="BIOL 103"]') as HTMLInputElement
    const title = document.body.querySelector('input[placeholder="How Cells Function"]') as HTMLInputElement
    expect(code).toBeTruthy()
    expect(title).toBeTruthy()
    await act(async () => setInputValue(code, 'CHEM 262'))
    await act(async () => setInputValue(title, 'Organic Chemistry II'))
    await act(async () => button(document.body, 'STEM').click())
    await act(async () => button(document.body, 'Create & import syllabus').click())

    const staged = snapshotData()
    expect(staged.courses).toHaveLength(1)
    const course = staged.courses[0]
    expect(staged.academics.classCenter.workspaces.filter((item) => item.courseId === course.id)).toHaveLength(1)
    expect(container.textContent).toContain('Add a syllabus to CHEM 262')

    await readPastedSyllabus()
    await act(async () => button(container, 'Add to CHEM 262').click())

    const applied = snapshotData()
    expect(applied.courses).toHaveLength(1)
    expect(applied.academics.classCenter.workspaces.filter((item) => item.courseId === course.id)).toHaveLength(1)
    expect(applied.academics.classCenter.topics.filter((item) => item.courseId === course.id)).toHaveLength(2)
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

  it('applies only an explicitly accepted re-import change and keeps removed student records', async () => {
    const initial = createInitialDataForMode(false)
    initial.courses.push({
      id: 'chem-262', code: 'CHEM 262', title: 'Organic Chemistry II', term: 'Fall 2026', credits: 3,
      grade: '', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 0,
    })
    initial.academics.classCenter.workspaces.push({
      id: 'workspace-chem-262', courseId: 'chem-262', color: 'blue', icon: 'flask', type: 'stem',
      status: 'active', createdAt: 1, updatedAt: 1, order: 0,
    })
    initial.academics.classCenter.gradeCategories.push(
      { id: 'problem-sets', courseId: 'chem-262', name: 'Problem sets —', weight: 10, policyNote: 'Student kept this policy verbatim.', createdAt: 1, updatedAt: 1, order: 0 },
      { id: 'participation', courseId: 'chem-262', name: 'Participation', weight: 5, createdAt: 1, updatedAt: 1, order: 1 },
    )
    useStore.getState().replaceAll(initial)

    await render('/academics?tab=class-center&importFor=chem-262')
    await readPastedSyllabus('reimport')
    // Changed grade weights default to Keep; accepting this one record must
    // not silently accept the removed Participation category.
    await act(async () => buttonInRow(container, 'Problem sets', 'Accept').click())
    await act(async () => button(container, 'Apply accepted changes').click())

    const categories = snapshotData().academics.classCenter.gradeCategories.filter((item) => item.courseId === 'chem-262')
    expect(categories.find((item) => item.id === 'problem-sets')).toMatchObject({ weight: 15, policyNote: 'Student kept this policy verbatim.' })
    expect(categories.find((item) => item.id === 'participation')).toBeTruthy()
  })

  it('files a clearly non-syllabus document into an existing class Materials shelf without changing syllabus records', async () => {
    const initial = createInitialDataForMode(false)
    initial.courses.push({
      id: 'chem-262', code: 'CHEM 262', title: 'Organic Chemistry II', term: 'Fall 2026', credits: 3,
      grade: '', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 0,
    })
    initial.academics.classCenter.workspaces.push({
      id: 'workspace-chem-262', courseId: 'chem-262', color: 'blue', icon: 'flask', type: 'stem',
      status: 'active', createdAt: 1, updatedAt: 1, order: 0,
    })
    useStore.getState().replaceAll(initial)

    await render('/academics?tab=class-center&importFor=chem-262')
    const textarea = container.querySelector('textarea[placeholder="Paste syllabus text from Canvas…"]') as HTMLTextAreaElement
    await act(async () => setTextareaValue(textarea, PROBLEM_SET))
    await act(async () => button(container, 'Read syllabus').click())
    expect(container.textContent).toContain('That reads like course material')
    await act(async () => button(container, 'File it in Materials').click())

    const after = snapshotData()
    expect(after.courses).toHaveLength(1)
    expect(after.academics.classCenter.workspaces).toHaveLength(1)
    expect(after.academics.classCenter.topics).toHaveLength(0)
    expect(after.academics.classCenter.assignments).toHaveLength(0)
    expect(after.academics.classCenter.gradeCategories).toHaveLength(0)
    expect(after.academics.classCenter.files).toEqual([
      expect.objectContaining({ courseId: 'chem-262', type: 'other', sourceType: 'paste', blobRef: expect.stringMatching(/^local-material:/) }),
    ])
    expect(retainLocalMaterial).toHaveBeenCalledTimes(1)
  })

  it('never creates a class for a wrong document until the student explicitly reviews it as a syllabus', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import syllabus').click())
    const textarea = container.querySelector('textarea[placeholder="Paste syllabus text from Canvas…"]') as HTMLTextAreaElement
    await act(async () => setTextareaValue(textarea, PROBLEM_SET))
    await act(async () => button(container, 'Read syllabus').click())
    expect(container.textContent).toContain('Nothing to apply')
    expect(container.textContent).toContain('Choose a class first')
    expect(snapshotData().courses).toHaveLength(0)
    expect(snapshotData().academics.classCenter.files).toHaveLength(0)
  })
})

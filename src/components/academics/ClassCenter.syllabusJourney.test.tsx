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
Learning outcomes
1. Explain aromatic substitution.
2. Distinguish stereochemical relationships.
Week 1: Aromatic substitution
Week 2: Stereochemistry
Midterm Exam — October 14, 2026
Problem sets — 15%
Exams — 60%
Final — 25%
Problem set 1 due September 9, 2026
Class meetings TR 10:10 AM-11:00 AM in Kenan B12.
Attendance is required. Office hours Tuesday 2 PM.`

const PROBLEM_SET = `CHEM 262 Problem Set 6
Due Oct 24, 2026
1. Draw the mechanism for the following substitution.
2. Rank the leaving groups below.
3. Predict the major product.`

const ANTH_SCHEDULE = `Anthropology 147 Comparative Healing Systems
Fall 2026
COURSE GOALS: Upon completion of ANTH 147, the student should be able to:
Demonstrate knowledge of global cultural understandings of health and healing.
Explain how biomedicine is shaped by cultural ideas.
Explain anthropological approaches to clashes between healing systems.
Submit 6 Draft Reading Responses (RR) x 5 pts each: 30 pts (3%)
Midterm 1 240 pts (24%)
Final Exam 280 pts (28%)
SCHEDULE FOR CLASS, READINGS, RECITATION SECTIONS, AND EXAMS
Week/Theme
READING
Introduction: 8/19-8/21
Symbols, Political Economy, and the Burdens of Inequality in Illness and Healing
Berry, N. “The Story of Rosario,” in Unsafe Motherhood, pp. xi-xix.
Medina, “Communicating with the Dead,” in Religion and Healing in America, pp.205–216.
Wk 4: 9/15-9/17
Exam Week
Tuesday Exam #1`

const OPERATIONAL_SYLLABUS = `Psychology 101.001 Introduction to Psychology
Fall 2026
Objectives and Expectations: In completing this course, you will be able to
• define both the science and the practice of psychology
• explain how biological and social contexts shape behavior
Instructor: Dr. Adrian Rivera · arivera@unc.edu
Office Hours: Davie Hall 210 on Tuesday 2:00-3:00 PM.
TR 8am-9:15pm
Instructional Assistants: Weekly office hours are below.
• Fatima: Monday, 10:00-11:00 AM on Zoom
Learning Center: See https://learningcenter.unc.edu for support.
Course Schedule
Thursday 8/20 The Evolution of Psychology Chapter 1
Thursday 9/17 Exam 1
Research Requirement due December 1, 2026.
AI Policy: Generated text may be used only when the assignment explicitly permits it.
Late Work: Contact the teaching team before the deadline when an emergency prevents submission.`

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
    const textarea = document.body.querySelector('textarea[placeholder="Paste syllabus text from Canvas…"]') as HTMLTextAreaElement
    expect(textarea).toBeTruthy()
    await act(async () => setTextareaValue(textarea, SYLLABUS))
    await act(async () => button(document.body, 'Read syllabus').click())
    if (mode === 'reimport') expect(document.body.textContent).toContain('things changed')
    else expect(document.body.textContent).toMatch(/Here’s what I found|Review the syllabus extraction|Review syllabus/)
  }

  it('creates one class only after review, persists all parsed course records, and retains the source locally', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import a syllabus').click())
    expect(snapshotData().courses).toHaveLength(0)

    await readPastedSyllabus()
    expect(snapshotData().courses).toHaveLength(0)
    expect([...document.body.querySelectorAll('button')].some((item) => item.textContent?.trim() === 'Create & import syllabus')).toBe(false)
    expect(document.body.textContent).toContain('Course code · found')
    expect(document.body.textContent).toContain('Location · not found')
    await act(async () => button(document.body, 'Review syllabus records').click())

    expect(snapshotData().courses).toHaveLength(0)
    expect(document.body.textContent).toContain('Import syllabus · review before apply')
    expect(document.body.textContent).toContain('Final check')
    expect(document.body.textContent).toContain('Not found')
    expect(document.body.querySelector('#syllabus-group-standards button')?.getAttribute('aria-expanded')).toBe('false')
    await act(async () => button(document.body, 'Add reviewed syllabus to CHEM 262').click())

    const created = snapshotData()
    expect(created.courses).toHaveLength(1)
    const course = created.courses[0]
    const center = created.academics.classCenter
    expect(course).toMatchObject({ code: 'CHEM 262', title: 'Organic Chemistry II' })
    expect(center.workspaces.filter((item) => item.courseId === course.id)).toHaveLength(1)
    expect(center.workspaces.find((item) => item.courseId === course.id)?.syllabusSchedule).toHaveLength(2)
    expect(center.topics.filter((item) => item.courseId === course.id)).toHaveLength(2)
    expect(center.topics.filter((item) => item.courseId === course.id).every((item) => item.syllabusSourceKey && item.linkedFileIds?.length === 1)).toBe(true)
    expect(center.assignments.filter((item) => item.courseId === course.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Midterm Exam', dueDate: '2026-10-14', type: 'exam' }),
      expect.objectContaining({ title: 'Problem set 1', dueDate: '2026-09-09' }),
    ]))
    expect(center.assignments.filter((item) => item.courseId === course.id).every((item) => item.syllabusSourceKey && item.linkedFileIds.length === 1)).toBe(true)
    expect(center.gradeCategories.filter((item) => item.courseId === course.id).map((item) => item.weight).sort((a, b) => a - b)).toEqual([15, 25, 60])
    expect(center.gradeCategories.filter((item) => item.courseId === course.id).every((item) => item.policyNote == null)).toBe(true)
    expect(center.files.filter((item) => item.courseId === course.id && item.type === 'syllabus')).toEqual([
      expect.objectContaining({ blobRef: expect.stringMatching(/^local-syllabus:/), sourceType: 'paste' }),
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

  it('persists reviewed humanities schedule and readings without promoting them to Topics', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import a syllabus').click())
    const textarea = document.body.querySelector('textarea[placeholder="Paste syllabus text from Canvas…"]') as HTMLTextAreaElement
    await act(async () => setTextareaValue(textarea, ANTH_SCHEDULE))
    await act(async () => button(document.body, 'Read syllabus').click())
    await act(async () => button(document.body, 'Review syllabus records').click())
    await act(async () => button(document.body, 'Add reviewed syllabus to ANTH 147').click())

    const center = snapshotData().academics.classCenter
    const course = snapshotData().courses.find((item) => item.code === 'ANTH 147')
    expect(course).toBeTruthy()
    const courseId = course!.id
    expect(center.topics.filter((item) => item.courseId === courseId).map((item) => item.title)).toHaveLength(3)
    expect(center.topics.some((item) => /Story of Rosario|Symbols, Political Economy/i.test(item.title))).toBe(false)
    expect(center.assignedReadings.filter((item) => item.courseId === courseId)).toEqual(expect.arrayContaining([
      expect.objectContaining({ week: 'Introduction', title: expect.stringContaining('Story of Rosario'), dueForDiscussion: '2026-08-19' }),
      expect.objectContaining({ week: 'Introduction', title: expect.stringContaining('Communicating with the Dead'), dueForDiscussion: '2026-08-19' }),
    ]))
    expect(center.workspaces.find((item) => item.courseId === courseId)).toMatchObject({
      type: 'writing', readingListState: 'complete', syllabusSchedule: expect.arrayContaining([
        expect.objectContaining({ week: 'Introduction', label: expect.stringContaining('Symbols, Political Economy'), startDate: '2026-08-19' }),
      ]),
    })
    expect(center.assignments).toEqual(expect.arrayContaining([
      expect.objectContaining({ courseId, type: 'exam', title: 'Exam 1', dueDate: '2026-09-15' }),
    ]))
  })

  it('maps reviewed syllabus facts to their operational homes without turning class context into tasks', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import a syllabus').click())
    const textarea = document.body.querySelector('textarea[placeholder="Paste syllabus text from Canvas…"]') as HTMLTextAreaElement
    await act(async () => setTextareaValue(textarea, OPERATIONAL_SYLLABUS))
    await act(async () => button(document.body, 'Read syllabus').click())
    expect(document.body.textContent).toContain('Meeting time · needs a look')
    expect(document.body.querySelector('input[value="8 AM–9:15 AM"]')).toBeTruthy()
    await act(async () => button(document.body, 'General').click())
    await act(async () => button(document.body, 'Review syllabus records').click())
    // The class-details dialog has a close transition. The parsed proposal must
    // survive that handoff instead of being cleared as though the user canceled.
    await act(async () => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(document.body.textContent).toContain('Review syllabus')
    expect(document.body.textContent).toContain('Policies & boundaries')
    expect(document.body.textContent).toContain('People, meetings & support')
    const addReviewed = button(document.body, 'above to continue')
    expect(addReviewed.disabled).toBe(true)
    const confirmations = [...document.body.querySelectorAll<HTMLButtonElement>('button[aria-label^="Confirm "]')]
    // Every extracted row can be affirmed, not only the low-confidence row
    // that blocks Apply. This keeps the review interaction consistent.
    expect(confirmations.length).toBeGreaterThan(1)
    expect(confirmations.some((confirmation) => confirmation.getAttribute('aria-label') === 'Confirm Meeting time')).toBe(true)
    for (const confirmation of confirmations) await act(async () => confirmation.click())
    expect(document.body.textContent).toContain('Confirmed')
    expect(document.body.textContent).toContain('Ready to add')
    expect(button(document.body, 'Add reviewed syllabus to').disabled).toBe(false)
    const meetingTime = document.body.querySelector('input[value="8 AM–9:15 AM"]') as HTMLInputElement
    await act(async () => setInputValue(meetingTime, '8 AM–9:10 AM'))
    expect(button(document.body, 'above to continue').disabled).toBe(true)
    const reconfirmMeetingTime = document.body.querySelector<HTMLButtonElement>('button[aria-label="Confirm Meeting time"]')
    expect(reconfirmMeetingTime).toBeTruthy()
    await act(async () => reconfirmMeetingTime!.click())
    expect(button(document.body, 'Add reviewed syllabus to').disabled).toBe(false)
    await act(async () => button(document.body, 'Add reviewed syllabus to').click())

    const saved = snapshotData()
    const course = saved.courses.find((item) => item.code === 'PSYC 101')
    expect(course).toBeTruthy()
    const courseId = course!.id
    const center = saved.academics.classCenter
    const syllabusFile = center.files.find((item) => item.courseId === courseId && item.type === 'syllabus')
    expect(syllabusFile).toBeTruthy()

    const topics = center.topics.filter((item) => item.courseId === courseId)
    expect(topics.map((item) => item.title)).toEqual([
      'define both the science and the practice of psychology',
      'explain how biological and social contexts shape behavior',
    ])
    expect(topics.every((item) => item.basis === 'syllabus-standard' && item.linkedFileIds?.includes(syllabusFile!.id))).toBe(true)

    const workspace = center.workspaces.find((item) => item.courseId === courseId)
    expect(workspace?.syllabusSchedule).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'The Evolution of Psychology', startDate: '2026-08-20', source: expect.stringContaining('Chapter 1') }),
    ]))

    const readings = center.assignedReadings.filter((item) => item.courseId === courseId)
    expect(readings).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: expect.stringContaining('Chapter 1'), dueForDiscussion: '2026-08-20', source: expect.stringContaining('Chapter 1') }),
    ]))
    const assignments = center.assignments.filter((item) => item.courseId === courseId)
    expect(assignments).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: expect.stringContaining('Read Chapter 1'), type: 'reading', dueDate: '2026-08-20', linkedFileIds: [syllabusFile!.id] }),
      expect.objectContaining({ title: 'Exam 1', type: 'exam', dueDate: '2026-09-17', linkedFileIds: [syllabusFile!.id] }),
      expect.objectContaining({ title: expect.stringContaining('Research Requirement'), type: 'other', dueDate: '2026-12-01', linkedFileIds: [syllabusFile!.id] }),
    ]))
    expect(assignments.some((item) => /office hours|fatima|learning center/i.test(item.title))).toBe(false)
    expect(assignments.some((item) => item.type !== 'reading' && /evolution of psychology/i.test(item.title))).toBe(false)

    expect(center.contacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ courseId, role: 'professor', name: 'Dr. Adrian Rivera', email: 'arivera@unc.edu' }),
      expect.objectContaining({ courseId, role: 'TA', name: 'Fatima' }),
    ]))
    expect(center.notes).toEqual(expect.arrayContaining([
      expect.objectContaining({ courseId, kind: 'about-class', title: 'Learning Center', linkedFileIds: [syllabusFile!.id] }),
      expect.objectContaining({ courseId, kind: 'about-class', title: 'AI Policy', content: expect.stringContaining('assignment explicitly permits it'), linkedFileIds: [syllabusFile!.id] }),
      expect.objectContaining({ courseId, kind: 'about-class', title: 'Late Work', content: expect.stringContaining('emergency prevents submission'), linkedFileIds: [syllabusFile!.id] }),
    ]))
    expect(center.sourceChunks.filter((item) => item.courseId === courseId && item.fileId === syllabusFile!.id).length).toBeGreaterThanOrEqual(8)
  })

  it('moves backward through final review and class details without saving a partial class', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import a syllabus').click())
    await readPastedSyllabus()
    await act(async () => button(document.body, 'Review syllabus records').click())

    expect(snapshotData().courses).toEqual([])
    await act(async () => button(container, 'Back').click())
    expect(document.body.textContent).toContain('Review class details')
    expect(document.body.textContent).toContain('Course code · found')
    expect(snapshotData().courses).toEqual([])

    await act(async () => button(document.body, 'Back to import').click())
    expect(document.body.textContent).toContain('Drop a syllabus or course schedule here')
    expect(snapshotData().courses).toEqual([])

    await act(async () => button(document.body, 'Cancel').click())
    expect(snapshotData().courses).toEqual([])
    expect(document.body.textContent).toContain('Start with a syllabus')
  })

  it('reads multiple local files into one proposal and keeps each fact linked to its source file', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import a syllabus').click())
    const makeTextFile = (name: string, text: string) => {
      const file = new File([text], name, { type: 'text/plain' })
      Object.defineProperty(file, 'text', { value: async () => text })
      return file
    }
    const overview = makeTextFile('CHEM262-overview.txt', `CHEM 262 — Organic Chemistry II
Fall 2026
Student learning outcomes
1. Explain aromatic substitution and predict its major products.
Problem sets — 15%`)
    const schedule = makeTextFile('CHEM262-schedule.txt', `CHEM 262 — Organic Chemistry II
Fall 2026
Midterm Exam — October 14, 2026
Week 1: Aromatic substitution and reaction energy diagrams.`)
    const fileInput = document.body.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(fileInput, 'files', { configurable: true, value: [overview, schedule] })
    await act(async () => fileInput.dispatchEvent(new Event('change', { bubbles: true })))
    await act(async () => button(document.body, 'Read syllabus').click())

    expect(document.body.textContent).toContain('CHEM262-overview.txt + CHEM262-schedule.txt')
    expect(snapshotData().courses).toEqual([])
    await act(async () => button(document.body, 'STEM').click())
    await act(async () => button(document.body, 'Review syllabus records').click())
    expect(document.body.textContent).toContain('Final check')
    await act(async () => button(document.body, 'Add reviewed syllabus to CHEM 262').click())

    const saved = snapshotData().academics.classCenter
    const overviewFile = saved.files.find((file) => file.fileName === 'CHEM262-overview.txt')
    const scheduleFile = saved.files.find((file) => file.fileName === 'CHEM262-schedule.txt')
    expect(overviewFile).toBeTruthy()
    expect(scheduleFile).toBeTruthy()
    expect(saved.topics.find((topic) => topic.title.includes('aromatic substitution'))?.linkedFileIds).toEqual([overviewFile?.id])
    expect(saved.assignments.find((assignment) => assignment.title.includes('Midterm Exam'))?.linkedFileIds).toEqual([scheduleFile?.id])
    expect(retainLocalSyllabus).toHaveBeenCalledTimes(2)
  })

  it('lets the student exclude one false-positive row before the first apply', async () => {
    await render('/academics?tab=class-center')
    await act(async () => button(container, 'Import a syllabus').click())
    await readPastedSyllabus()
    await act(async () => button(document.body, 'STEM').click())
    await act(async () => button(document.body, 'Review syllabus records').click())
    const standardsGroup = document.body.querySelector('#syllabus-group-standards') as HTMLElement
    expect(standardsGroup).toBeTruthy()
    if (standardsGroup.querySelector('button[aria-expanded="false"]')) {
      await act(async () => (standardsGroup.querySelector('button[aria-expanded="false"]') as HTMLButtonElement).click())
    }
    const removeButtons = [...standardsGroup.querySelectorAll<HTMLButtonElement>('button[aria-label="Remove Learning standards row"]')]
    expect(removeButtons).toHaveLength(2)
    await act(async () => removeButtons[0].click())
    await act(async () => button(document.body, 'Add reviewed syllabus to CHEM 262').click())

    const saved = snapshotData().academics.classCenter.topics.filter((item) => item.courseId === snapshotData().courses[0].id)
    expect(saved).toHaveLength(1)
    expect(saved[0].title).toContain('Distinguish stereochemical relationships')
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
    await act(async () => button(container, 'Add reviewed syllabus to CHEM 262').click())

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
      id: 'topic-standard-1', courseId: 'chem-262', title: 'Explain aromatic substitution.', unit: '', basis: 'syllabus-standard',
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
    // The pre-existing learning standard survives unchanged; the other standard
    // is added by its default Accept decision. This is identity-based, not positional.
    expect(after.academics.classCenter.topics.filter((item) => item.courseId === 'chem-262').map((item) => item.title)).toEqual(expect.arrayContaining([
      'Explain aromatic substitution.', 'Distinguish stereochemical relationships.',
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
    await act(async () => button(container, 'Add reviewed syllabus to CHEM 262').click())

    const after = snapshotData()
    expect(after.courses).toHaveLength(1)
    expect(after.academics.classCenter.workspaces).toHaveLength(1)
    const workspace = after.academics.classCenter.workspaces[0]
    expect(workspace).toMatchObject({ courseId: 'chem-262', instructor: 'Dr. Student-entered' })
    expect(workspace.meetingDays || workspace.meetingTime || workspace.location).toBeTruthy()
    const categories = after.academics.classCenter.gradeCategories.filter((item) => item.courseId === 'chem-262')
    expect(categories).toHaveLength(3)
    expect(categories.every((item) => item.policyNote == null)).toBe(true)
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

  it('matches student-renamed syllabus rows by their retained source identity', async () => {
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
      id: 'topic-standard-1', courseId: 'chem-262', title: 'Aromatic substitution — my wording', syllabusSourceKey: 'explain aromatic substitution.', unit: '', basis: 'syllabus-standard',
      status: 'not-started', fsrs: {} as never, confidence: 3, sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 2, order: 0,
    })
    initial.academics.classCenter.assignments.push({
      id: 'assignment-midterm', courseId: 'chem-262', title: 'The first big exam', syllabusSourceKey: 'midterm exam|2026-10-14', type: 'exam', dueDate: '2026-10-14',
      status: 'not-started', linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 2, order: 0,
    })
    useStore.getState().replaceAll(initial)

    await render('/academics?tab=class-center&importFor=chem-262')
    await readPastedSyllabus('reimport')
    await act(async () => button(container, 'Apply accepted changes').click())

    const after = snapshotData().academics.classCenter
    const topics = after.topics.filter((item) => item.courseId === 'chem-262')
    const assignments = after.assignments.filter((item) => item.courseId === 'chem-262')
    expect(topics).toHaveLength(2)
    expect(topics).toContainEqual(expect.objectContaining({ id: 'topic-standard-1', title: 'Aromatic substitution — my wording', syllabusSourceKey: 'explain aromatic substitution.' }))
    expect(assignments).toHaveLength(2)
    expect(assignments).toContainEqual(expect.objectContaining({ id: 'assignment-midterm', title: 'The first big exam', syllabusSourceKey: 'midterm exam|2026-10-14' }))
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
    await act(async () => button(container, 'Import a syllabus').click())
    const textarea = document.body.querySelector('textarea[placeholder="Paste syllabus text from Canvas…"]') as HTMLTextAreaElement
    await act(async () => setTextareaValue(textarea, PROBLEM_SET))
    await act(async () => button(document.body, 'Read syllabus').click())
    expect(document.body.textContent).toContain('Nothing to apply')
    expect(document.body.textContent).toContain('Choose a class first')
    expect(snapshotData().courses).toHaveLength(0)
    expect(snapshotData().academics.classCenter.files).toHaveLength(0)
  })
})

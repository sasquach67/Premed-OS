import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LessonsTab } from './LessonsTab'
import { lessonSchedule } from '@/lib/academics/classDays'
import { autoExamScope, editedExamScope, type LessonExam } from '@/lib/academics/lessonGroups'
import type { LectureRecord, SyllabusScheduleEntry } from '@/lib/types'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const entry = (lesson: number, label: string, dates: string[]): SyllabusScheduleEntry => ({ id: `e${lesson}`, week: '', label, order: lesson, lesson, startDate: dates[0], dates })
const schedule = [
  entry(1, 'Chapter 1 The Evolution of Psychology', ['2026-08-20']),
  entry(7, 'Chapter 7 Human Memory', ['2026-09-22', '2026-09-24']),
  entry(8, 'Chapter 8 Cognition and Intelligence', ['2026-09-29']),
  entry(9, 'Chapter 9 Motivation and Emotion', ['2026-10-08', '2026-10-13']),
  entry(11, 'Chapter 11 Personality', ['2026-10-27']),
]
const notebook = (id: string, occurredOn: string, extra: Partial<LectureRecord> = {}): LectureRecord => ({ id, courseId: 'c', title: 'Notebook', inputPath: 'pasted', occurredOn, topicIds: [], processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0, ...extra } as LectureRecord)

let container: HTMLDivElement
let root: Root
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(() => { act(() => root.unmount()); container.remove() })

function render(lectures: LectureRecord[] = [], extra: Partial<Parameters<typeof LessonsTab>[0]> = {}) {
  const handlers = { onOpenNotebook: vi.fn(), onNewNotebook: vi.fn(), onFlashcards: vi.fn(), onPracticeSet: vi.fn(), onSetUpFolder: vi.fn(), onSkipFolder: vi.fn() }
  act(() => root.render(<LessonsTab schedule={schedule} exams={[{ id: 'x1', title: 'Exam 1', date: '2026-09-17' }, { id: 'x2', title: 'Exam 2', date: '2026-11-03' }]} lectures={lectures} today="2026-10-20" titleOf={(l) => l.title} defaultFolderName="PSYC 101 Lecture Material" {...extra} classFiles={<p>Class files content</p>} {...handlers} />))
  return handlers
}
const text = (sel: string) => [...container.querySelectorAll(sel)].map((e) => e.textContent)

describe('LessonsTab', () => {
  it('groups lessons under exams and opens the current lesson', () => {
    render([notebook('n9', '2026-10-13', { flashcardsMadeAt: 5 })])
    expect(text('.lessons-ghead .t')).toEqual(['Exam 1 · Sep 17', 'Exam 2 · Nov 3'])
    expect(container.querySelector('.lessons-card h3')?.textContent).toBe('Lesson 9 — Motivation and Emotion')
    expect(container.querySelector('.lessons-prog')?.getAttribute('aria-label')).toBe('2 of 3 made')
    expect(text('.lessons-main b')).toEqual(['Lesson 11', 'Lesson 8 — Cognition and Intelligence', 'Lesson 7 — Human Memory'])
    expect(container.textContent).toContain('1 not taught yet')
  })

  it('offers each lesson its next step', () => {
    const h = render([notebook('n9', '2026-10-13')])
    const make = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Make notebook')!
    act(() => make.click())
    expect(h.onNewNotebook).toHaveBeenCalled()
    const tiles = container.querySelectorAll<HTMLButtonElement>('.lessons-tile')
    act(() => tiles[1].click())
    expect(h.onFlashcards).toHaveBeenCalledWith('n9')
    act(() => tiles[0].click())
    expect(h.onOpenNotebook).toHaveBeenCalledWith('n9')
  })

  it('filters to lessons without a notebook', () => {
    render([notebook('n9', '2026-10-13')])
    act(() => ([...container.querySelectorAll('button')].find((b) => b.textContent === 'No notebook')!).click())
    expect(text('.lessons-main b')).toEqual(['Lesson 11', 'Lesson 8 — Cognition and Intelligence', 'Lesson 7 — Human Memory'])
    expect(container.querySelector('.lessons-card')).toBeNull()
  })

  it('asks for the class folder until it is set up or skipped', () => {
    const h = render()
    expect(container.textContent).toContain('Set up your class folder')
    expect(container.textContent).toContain('Before your first notebook')
    act(() => ([...container.querySelectorAll('button')].find((b) => b.textContent === 'Skip for now. Files go to Downloads.')!).click())
    expect(h.onSkipFolder).toHaveBeenCalled()
    act(() => ([...container.querySelectorAll('button')].find((b) => b.textContent === 'Set it up · 5 min')!).click())
    expect(h.onSetUpFolder).toHaveBeenCalled()
  })

  it('shows a ready class folder before the first notebook', () => {
    render([], { classFolder: { site: 'canvas', place: 'documents', mover: 'me', name: 'PSYC 101 Lecture Material', state: 'ready', updatedAt: 1 } })
    expect(container.textContent).not.toContain('Set up your class folder')
    expect(container.querySelector('.class-folder-ready')?.textContent).toContain('Documents › PSYC 101 Lecture Material')
  })

  it('lists readings under their exam, joins a book’s parts and names what a class discusses', () => {
    const reading = (id: string, due: string, week: string, title: string, status: 'read' | 'not-started' = 'not-started') => ({ id, courseId: 'c', week, title, status, dueForDiscussion: due, createdAt: 1, updatedAt: 1, order: 0 })
    const h = { onToggleReadingPart: vi.fn(), onNewReadingNotebook: vi.fn() }
    render([], {
      readings: [
        reading('a', '2026-09-22', 'Week 5', 'Steinberg, Sizwe’s Test, “Preface”—“Thandeka” (pp. 1-75).', 'read'),
        reading('b', '2026-09-29', 'Week 6', 'Steinberg, “Garden and Home”—AIDS Needle,” (pp.79-162.)'),
        reading('c', '2026-10-13', 'Week 8', 'Manderson, Lenore. 1998. “Applying Medical Anthropology”'),
        reading('d', '2026-10-27', 'Week 10', 'Moore, R. 2022. “Marshallese resilience”'),
      ],
      ...h,
    })
    expect(container.querySelector('.lessons-subhead')?.textContent).toBe('Readings 2 assigned')
    expect(text('.lessons-row.is-reading .lessons-main b')).toEqual(['Manderson, “Applying Medical Anthropology”', 'Steinberg, Sizwe’s Test'])
    expect(container.textContent).toContain('Book · 1 of 2 parts read')
    expect(container.textContent).toContain('For Oct 27')
    expect(container.querySelector('.lessons-card .lessons-disc')?.textContent).toBe('Discusses Manderson, “Applying Medical Anthropology”')
    act(() => (container.querySelector('[aria-label="Expand Steinberg, Sizwe’s Test"]') as HTMLButtonElement).click())
    act(() => ([...container.querySelectorAll('.lessons-parts button')][1] as HTMLButtonElement).click())
    expect(h.onToggleReadingPart).toHaveBeenCalledWith('b')
    expect(container.textContent).toContain('On disk: premedOS › Reading - Steinberg, Sizwe’s Test')
    act(() => ([...container.querySelectorAll('.lessons-card.is-reading .lessons-tile')][0] as HTMLButtonElement).click())
    expect(h.onNewReadingNotebook).toHaveBeenCalledWith('steinberg, sizwes test')
  })

  it('shows PSYC 101’s rewritten schedule as Lessons 1–6 and 7, with no chapter readings (Oct 27 2026)', () => {
    const saved: SyllabusScheduleEntry[] = ([
      ['2026-08-18', 'Class Introduction'], ['2026-08-20', 'The Evolution of Psychology'], ['2026-08-25', 'Research Enterprise in Psychology'],
      ['2026-08-27', 'The Biological Bases of Behavior'], ['2026-09-01', 'The Biological Bases of Behavior'], ['2026-09-03', 'Sensation and Perception'], ['2026-09-08', 'Variations in Consciousness'],
      ['2026-09-10', 'Learning'], ['2026-09-15', 'Learning'], ['2026-09-22', 'Human Memory'], ['2026-09-24', 'Human Memory'],
    ] as const).map(([startDate, label], order) => ({ id: `s${order}`, week: 'Unscheduled', label, startDate, order }))
    const reading = (title: string, due: string) => ({ id: due, courseId: 'c', week: 'Due for Tues class', title, status: 'not-started' as const, dueForDiscussion: due, createdAt: 1, updatedAt: 1, order: 0 })
    render([], { schedule: lessonSchedule(saved), today: '2026-09-25', readings: [reading('Chapter 6 · Learning', '2026-09-15'), reading('Chapter 7 · Human Memory', '2026-09-22')] })
    expect(text('.lessons-ghead .r')).toEqual(['Lessons 1–6', 'Lesson 7'])
    expect(container.textContent).not.toContain('Readings')
    expect(container.textContent).not.toMatch(/Lesson [89] — Learning/)
  })

  it('keeps the class files in a collapsed section', () => {
    render()
    expect(container.textContent).toContain('Class files')
    expect(container.textContent).not.toContain('Class files content')
  })

  it('lets the student change which lessons an exam covers, and go back to automatic', () => {
    const saved = vi.fn()
    // Applies an edit the way ClassHub's store update does.
    function Harness() {
      const [exams, setExams] = useState<LessonExam[]>([{ id: 'x1', title: 'Exam 1', date: '2026-09-17' }, { id: 'x2', title: 'Exam 2', date: '2026-11-03' }])
      return <LessonsTab schedule={schedule} exams={exams} lectures={[]} today="2026-10-30" titleOf={(l) => l.title} defaultFolderName="PSYC 101" classFolder={{ site: 'canvas', place: 'documents', mover: 'me', name: 'PSYC 101', state: 'skipped', updatedAt: 1 }} classFiles={null}
        onOpenNotebook={vi.fn()} onNewNotebook={vi.fn()} onFlashcards={vi.fn()} onPracticeSet={vi.fn()} onSetUpFolder={vi.fn()} onSkipFolder={vi.fn()}
        onSetExamLessons={(id, range, lessons) => { saved(id, range); setExams((list) => list.map((e) => e.id !== id ? e : { ...e, scope: range ? editedExamScope(e.scope, range.first, range.last, lessons) : autoExamScope(e.scope) })) }} />
    }
    act(() => root.render(<Harness />))
    expect(text('.lessons-ghead .r')).toEqual(['Lesson 1', 'Lessons 7–11'])
    const editButton = () => container.querySelector<HTMLButtonElement>('[aria-label="Change which lessons Exam 1 covers"]')!
    const setValue = (id: string, value: string) => act(() => {
      const input = container.querySelector<HTMLInputElement>(`#${id}`)!
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const save = () => [...container.querySelectorAll<HTMLButtonElement>('.lessons-range button')].find((b) => b.textContent === 'Save')!

    act(() => editButton().click())
    expect((container.querySelector('#exam-range-x1-from') as HTMLInputElement).value).toBe('1')
    expect(container.textContent).not.toContain('Back to automatic')
    setValue('exam-range-x1-to', '20')
    expect(save().disabled).toBe(true)
    expect(container.textContent).toContain('Pick lessons between 1 and 11')
    setValue('exam-range-x1-to', '8')
    act(() => save().click())
    expect(saved).toHaveBeenLastCalledWith('x1', { first: 1, last: 8 })
    expect(container.querySelector('.lessons-range')).toBeNull()
    expect(text('.lessons-ghead .r')).toEqual(['Lessons 1–8 · set by you', 'Lessons 9–11'])

    act(() => editButton().click())
    act(() => [...container.querySelectorAll<HTMLButtonElement>('.lessons-range button')].find((b) => b.textContent === 'Back to automatic')!.click())
    expect(saved).toHaveBeenLastCalledWith('x1', null)
    expect(text('.lessons-ghead .r')).toEqual(['Lesson 1', 'Lessons 7–11'])
  })

  it('shows no range control without a way to save it', () => {
    render()
    expect(container.querySelector('.lessons-gedit')).toBeNull()
  })
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassDays } from './ClassDays'
import type { SyllabusScheduleEntry } from '@/lib/types'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const schedule: SyllabusScheduleEntry[] = [
  { id: 'a', week: '', label: 'Chapter 9 Motivation and Emotion', order: 0, lesson: 9, startDate: '2026-10-13', dates: ['2026-10-13', '2026-10-15'] },
  { id: 'b', week: '', label: 'Chapter 10 Human Development Across the Lifespan', order: 1, lesson: 10, startDate: '2026-10-20', dates: ['2026-10-20', '2026-10-22'] },
]

let container: HTMLDivElement
let root: Root
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(() => { act(() => root.unmount()); container.remove() })

function render(props: Partial<Parameters<typeof ClassDays>[0]> = {}) {
  const onToggle = vi.fn(), newNotebook = vi.fn(), onOverride = vi.fn()
  act(() => root.render(<ClassDays schedule={schedule} meetingDays="Tue · Thurs" exams={[]} checks={{}} today="2026-10-20" titleFor={() => undefined} notebookFor={() => undefined} onNewNotebook={newNotebook} onToggle={onToggle} onOverride={onOverride} {...props} />))
  return { onToggle, newNotebook, onOverride }
}
const buttons = (text: string) => [...container.querySelectorAll('button')].filter((b) => b.textContent?.includes(text))

describe('ClassDays', () => {
  it('names this week’s class days by lesson, marking a lesson’s second day', () => {
    render()
    expect(container.querySelector('.class-days-title')?.textContent).toBe('Week 2Oct 19–23')
    expect([...container.querySelectorAll('.class-day h3')].map((h) => h.textContent)).toEqual([
      'Lesson 10 — Human Development Across the Lifespan',
      'Lesson 10 — Human Development Across the Lifespan',
    ])
    expect(container.textContent).toContain('Continued')
  })

  it('opens only Prime before class, every stage on the class day, and saves a tick through onToggle', () => {
    const { onToggle } = render()
    const prime = buttons('Do the before-class work')[0]
    expect(prime.disabled).toBe(false)
    const [todayClass, thursday] = buttons('Go to class and take notes')
    expect(todayClass.disabled).toBe(false)
    expect(thursday.disabled).toBe(true)
    act(() => prime.click())
    expect(onToggle).toHaveBeenCalledWith('2026-10-20', 'prime')
    act(() => todayClass.click())
    expect(onToggle).toHaveBeenCalledWith('2026-10-20', 'attend')
  })

  it('offers Import on a past day with no notebook and flags missed steps', () => {
    const { newNotebook } = render({ today: '2026-10-21', checks: { '2026-10-20': ['prime'] } })
    act(() => buttons('Import')[0].click())
    expect(newNotebook).toHaveBeenCalled()
    expect(container.querySelector('.class-day .class-days-ring')?.getAttribute('aria-label')).toBe('1 of 5 done')
    expect(container.querySelector('.class-day-stage.is-late')?.textContent).toContain('missed')
  })

  it('moves between weeks and jumps from the term strip', () => {
    render()
    act(() => (container.querySelector('[aria-label="Previous week"]') as HTMLButtonElement).click())
    expect(container.querySelector('.class-day h3')?.textContent).toBe('Lesson 9 — Motivation and Emotion')
    expect(buttons('Today').length).toBe(1)
    act(() => (container.querySelector('[aria-label="Week 2"]') as HTMLButtonElement).click())
    expect(container.querySelector('.class-day h3')?.textContent).toContain('Lesson 10')
  })

  it('keeps one notebook per lesson: a lesson’s later class updates it', () => {
    const open = vi.fn(), update = vi.fn()
    render({ today: '2026-10-23', checks: { '2026-10-20': ['attend'], '2026-10-22': ['attend'] }, notebookFor: (l) => l === 10 ? { open, update } : undefined })
    const rows = [...container.querySelectorAll('.class-day')].map((c) => [...c.querySelectorAll('.class-day-check')].find((r) => /notebook/.test(r.textContent ?? ''))?.textContent)
    expect(rows).toEqual(['Work through the notebookOpen', 'Add today’s class to the notebookUpdate'])
    act(() => buttons('Update')[0].click())
    expect(update).toHaveBeenCalled()
  })

  it('asks to make the notebook on a later class when none exists yet', () => {
    render({ today: '2026-10-23', checks: { '2026-10-22': ['attend'] } })
    expect(container.querySelectorAll('.class-day')[1].textContent).toContain('Make the notebook (covers every class so far)')
  })

  it('changes one class with the pencil', () => {
    const { onOverride } = render({ schedule: [...schedule, { id: 'c', week: '', label: 'Chapter 11 Personality', order: 2, lesson: 11, startDate: '2026-10-27' }] })
    act(() => (container.querySelector('[aria-label^="Change what the Oct 22 class"]') as HTMLButtonElement).click())
    expect(container.textContent).toContain('This class covers')
    act(() => buttons('Lesson 11')[0].click())
    expect(onOverride).toHaveBeenCalledWith('2026-10-22', { lessons: [10, 11] })
    act(() => buttons('No class — cancelled')[0].click())
    expect(onOverride).toHaveBeenCalledWith('2026-10-22', { cancelled: true })
  })

  it('shows a changed class against the syllabus, and a cancelled one', () => {
    render({ overrides: { '2026-10-20': { lessons: [10, 11] }, '2026-10-22': { cancelled: true } }, schedule: [...schedule, { id: 'c', week: '', label: 'Chapter 11 Personality', order: 2, lesson: 11, startDate: '2026-10-27' }] })
    const cards = [...container.querySelectorAll('.class-day')]
    expect(cards[0].querySelector('h3')?.textContent).toBe('Lessons 10 & 11')
    expect(cards[0].textContent).toContain('Syllabus: Lesson 10')
    expect(cards[0].textContent).toContain('Work through the Lesson 10 notebook')
    expect(cards[0].textContent).toContain('Work through the Lesson 11 notebook')
    expect(cards[1].querySelector('h3')?.textContent).toBe('Class cancelled')
    expect(container.querySelector('.class-days-changed')?.textContent).toContain('2 classes changed from the syllabus')
  })

  it('explains itself when the syllabus has no dates', () => {
    render({ schedule: [{ id: 'x', week: '', label: 'Lesson 1', order: 0, lesson: 1 }] })
    expect(container.textContent).toContain('Your syllabus has no class dates yet.')
  })
})

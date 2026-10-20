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
  const onToggle = vi.fn(), newNotebook = vi.fn()
  act(() => root.render(<ClassDays schedule={schedule} meetingDays="Tue · Thurs" exams={[]} checks={{}} today="2026-10-20" titleFor={() => undefined} linksFor={() => ({ newNotebook })} onToggle={onToggle} {...props} />))
  return { onToggle, newNotebook }
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

  it('opens only Prime before class and saves a tick through onToggle', () => {
    const { onToggle } = render()
    const prime = buttons('Do the before-class work')[0]
    expect(prime.disabled).toBe(false)
    expect(buttons('Go to class and take notes')[0].disabled).toBe(true)
    act(() => prime.click())
    expect(onToggle).toHaveBeenCalledWith('2026-10-20', 'prime')
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

  it('explains itself when the syllabus has no dates', () => {
    render({ schedule: [{ id: 'x', week: '', label: 'Lesson 1', order: 0, lesson: 1 }] })
    expect(container.textContent).toContain('Your syllabus has no class dates yet.')
  })
})

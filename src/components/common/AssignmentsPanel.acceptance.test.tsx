import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AssignmentsPanel } from './AssignmentsPanel'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createDemoData } from '@/data/demoSeed'
import { createInitialDataForMode, CURRENT_STORE_VERSION, STORAGE_KEY, useStore } from '@/store/store'
import type { ClassAssignment } from '@/lib/types'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('PointerEvent', MouseEvent)
Element.prototype.scrollIntoView = vi.fn()
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function dateOffset(days: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function assignment(id: string, courseId: string, title: string, dueDate: string, status: ClassAssignment['status'] = 'not-started'): ClassAssignment {
  return {
    id, courseId, title, type: 'homework', dueDate, status,
    linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0,
  }
}

function setInput(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

async function openMenu(button: HTMLButtonElement) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
    button.click()
  })
}

describe('Daily Assignments public interaction contract', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    useStore.getState().replaceAll(createInitialDataForMode(false))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    document.body.querySelectorAll('[data-radix-popper-content-wrapper]').forEach((element) => element.remove())
    localStorage.removeItem(STORAGE_KEY)
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function render(options: { scopedCourseId?: string; entry?: string } = {}) {
    const entry = options.entry ?? (options.scopedCourseId
      ? `/academics/classes/${options.scopedCourseId}?classTab=assignments&view=agenda`
      : '/academics?mode=daily&tab=assignments&view=agenda')
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[entry]}>
          <ToastProvider>
            <AssignmentsPanel courseId={options.scopedCourseId} />
            <LocationProbe />
          </ToastProvider>
        </MemoryRouter>,
      )
    })
  }

  it('creates and cancels inside a fixed class scope without exposing another class choice', async () => {
    const seeded = createDemoData()
    const courseId = seeded.courses[0].id
    seeded.academics.classCenter.assignments = []
    useStore.getState().replaceAll(seeded)
    await render({ scopedCourseId: courseId })

    expect(container.textContent).not.toContain(`${seeded.courses[0].code} only`)
    const topAdd = container.querySelector<HTMLButtonElement>('[data-testid="assignment-add-primary"]')
    expect(topAdd).toBeTruthy()
    expect(topAdd?.closest('.daily-assignments-filter')).toBeTruthy()
    await act(async () => {
      topAdd!.click()
    })
    expect(document.body.textContent).toContain('Add assignment')
    expect(document.body.querySelector('button[aria-label="Class"]')).toBeNull()
    expect(document.body.textContent).toContain(seeded.courses[0].code)

    const title = document.body.querySelector<HTMLInputElement>('#assignment-title')!
    await act(async () => setInput(title, 'Scoped lab report'))
    const submit = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Add assignment')!
    await act(async () => submit.click())

    expect(useStore.getState().academics.classCenter.assignments).toEqual([
      expect.objectContaining({ title: 'Scoped lab report', courseId }),
    ])

    await act(async () => {
      ;([...container.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.textContent?.includes('Add an assignment'))!).click()
    })
    const beforeCancel = useStore.getState().academics.classCenter.assignments.length
    const cancel = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Cancel')!
    await act(async () => cancel.click())
    expect(useStore.getState().academics.classCenter.assignments).toHaveLength(beforeCancel)
    expect(document.body.textContent).not.toContain('Keep the first entry lightweight')
  })

  it('keeps Add assignment in the top command bar on the all-classes page', async () => {
    useStore.getState().replaceAll(createDemoData())
    await render()

    const toolbar = container.querySelector('.daily-assignments-filter')
    const topAdd = toolbar?.querySelector<HTMLButtonElement>('[data-testid="assignment-add-primary"]')
    const agenda = container.querySelector('.daily-assignment-agenda')
    expect(topAdd).toBeTruthy()
    expect(agenda).toBeTruthy()
    expect(topAdd!.compareDocumentPosition(agenda!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await act(async () => topAdd!.click())
    expect(document.body.textContent).toContain('Keep the first entry lightweight')
    expect(document.body.querySelector('button[aria-label="Class"]')).toBeTruthy()
  })

  it('completes with undo and toggles important through visible row controls', async () => {
    const seeded = createDemoData()
    const courseId = seeded.courses[0].id
    seeded.academics.classCenter.assignments = [assignment('accept-one', courseId, 'Acceptance worksheet', dateOffset(0))]
    useStore.getState().replaceAll(seeded)
    await render()

    const checkbox = container.querySelector<HTMLButtonElement>('button[aria-label="Complete Acceptance worksheet"]')!
    await act(async () => checkbox.click())
    expect(useStore.getState().academics.classCenter.assignments[0].status).toBe('submitted')

    const undo = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Undo')!
    await act(async () => undo.click())
    expect(useStore.getState().academics.classCenter.assignments[0].status).toBe('not-started')

    const important = container.querySelector<HTMLButtonElement>('button[aria-label="Mark important"]')!
    await act(async () => important.click())
    expect(useStore.getState().academics.classCenter.assignments[0].important).toBe(true)
    expect(container.querySelector('button[aria-label="Remove important"]')).toBeTruthy()
  })

  it('shows the weekday with each agenda due date', async () => {
    const seeded = createDemoData()
    const courseId = seeded.courses[0].id
    seeded.academics.classCenter.assignments = [assignment('dated-row', courseId, 'Dated reading', '2026-08-19')]
    useStore.getState().replaceAll(seeded)

    await render()

    expect(container.textContent).toContain('Wed, Aug 19')
  })

  it('edits, duplicates, deletes, and restores an assignment from its public actions', async () => {
    const seeded = createDemoData()
    const courseId = seeded.courses[0].id
    seeded.academics.classCenter.assignments = [assignment('accept-actions', courseId, 'Original assignment', dateOffset(0))]
    useStore.getState().replaceAll(seeded)
    await render()

    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Edit assignment"]')!.click())
    const title = document.body.querySelector<HTMLInputElement>('#assignment-title')!
    await act(async () => setInput(title, 'Edited assignment'))
    await act(async () => {
      ;([...document.body.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.textContent?.trim() === 'Save changes')!).click()
    })
    expect(useStore.getState().academics.classCenter.assignments[0].title).toBe('Edited assignment')

    await openMenu(container.querySelector<HTMLButtonElement>('button[aria-label="Actions for Edited assignment"]')!)
    const duplicate = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((item) => item.textContent?.trim() === 'Duplicate')!
    await act(async () => duplicate.click())
    expect(useStore.getState().academics.classCenter.assignments.map((item) => item.title)).toContain('Edited assignment copy')

    await openMenu(container.querySelector<HTMLButtonElement>('button[aria-label="Actions for Edited assignment"]')!)
    const remove = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((item) => item.textContent?.trim() === 'Delete')!
    await act(async () => remove.click())
    expect(useStore.getState().academics.classCenter.assignments.some((item) => item.id === 'accept-actions')).toBe(false)
    const undo = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .filter((button) => button.textContent?.trim() === 'Undo').at(-1)!
    await act(async () => undo.click())
    expect(useStore.getState().academics.classCenter.assignments.some((item) => item.id === 'accept-actions')).toBe(true)
  })

  it('searches and filters across classes while the class-scoped surface stays locked', async () => {
    const seeded = createDemoData()
    const [first, second] = seeded.courses
    seeded.academics.classCenter.assignments = [
      assignment('accept-first', first.id, 'First course work', dateOffset(0)),
      assignment('accept-second', second.id, 'Second course work', dateOffset(0)),
      assignment('accept-completed', first.id, 'Completed course work', dateOffset(-1), 'submitted'),
    ]
    useStore.getState().replaceAll(seeded)
    await render()

    const search = container.querySelector<HTMLInputElement>('input[placeholder="Search assignments…"]')!
    await act(async () => setInput(search, second.code))
    expect(container.textContent).toContain('Second course work')
    expect(container.textContent).not.toContain('First course work')
    expect(container.querySelector('[data-assignment-course]')?.textContent).toContain(second.code)
    await act(async () => setInput(search, ''))
    expect(container.textContent).not.toContain('Completed course work')

    await openMenu(container.querySelector<HTMLButtonElement>('button[aria-label="Assignment options"]')!)
    const showCompleted = [...document.body.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')]
      .find((item) => item.textContent?.trim() === 'Show completed')!
    await act(async () => showCompleted.click())
    const completedBucket = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim().startsWith('Completed'))!
    await act(async () => completedBucket.click())
    expect(container.textContent).toContain('Completed course work')

    const filter = container.querySelector<HTMLButtonElement>('button[aria-label="Filter by class"]')!
    await openMenu(filter)
    const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((item) => item.textContent?.trim() === first.code)!
    await act(async () => option.click())
    expect(container.textContent).toContain('First course work')
    expect(container.textContent).not.toContain('Second course work')

    await act(async () => root.unmount())
    root = createRoot(container)
    await render({ scopedCourseId: second.id })
    expect(container.textContent).not.toContain(`${second.code} only`)
    expect(container.querySelector('button[aria-label="Filter by class"]')).toBeNull()
    expect(container.querySelector('[data-assignment-course]')).toBeNull()
    expect(container.textContent).toContain('Second course work')
    expect(container.textContent).not.toContain('First course work')
  })

  it('persists collapsed buckets and assignment changes through hydration', async () => {
    const seeded = createDemoData()
    const courseId = seeded.courses[0].id
    seeded.academics.classCenter.assignments = [assignment('accept-today', courseId, 'Today item', dateOffset(0))]
    useStore.getState().replaceAll(seeded)
    await render()

    const today = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim().startsWith('Today'))!
    expect(today.getAttribute('aria-expanded')).toBe('true')
    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Mark important"]')!.click())
    await act(async () => today.click())
    expect(today.getAttribute('aria-expanded')).toBe('false')

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()

    expect(useStore.getState().settings.listPreferences['academics.assignments']?.filters.collapsedBuckets).toContain('today')
    expect(useStore.getState().academics.classCenter.assignments[0]).toMatchObject({ id: 'accept-today', important: true })

    await act(async () => root.unmount())
    root = createRoot(container)
    await render()
    const restoredToday = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim().startsWith('Today'))!
    expect(restoredToday.getAttribute('aria-expanded')).toBe('false')
    await act(async () => restoredToday.click())
    expect(container.querySelector('button[aria-label="Remove important"]')).toBeTruthy()
  })

  it('navigates weeks and months and changes the selected calendar date', async () => {
    const seeded = createDemoData()
    useStore.getState().replaceAll(seeded)
    await render()

    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Weekly view"]')!.click())
    const beforeWeek = [...container.querySelectorAll('p')].find((item) => item.textContent?.startsWith('Week of'))?.textContent
    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Next week"]')!.click())
    const afterWeek = [...container.querySelectorAll('p')].find((item) => item.textContent?.startsWith('Week of'))?.textContent
    expect(afterWeek).not.toBe(beforeWeek)

    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Calendar view"]')!.click())
    const monthGrid = container.querySelector<HTMLElement>('[role="grid"]')
    expect(monthGrid?.className).toContain('grid')
    expect(monthGrid?.closest('section')?.className).toContain('overflow-hidden')
    const visibleWeeks = monthGrid?.querySelectorAll('[data-calendar-week]') ?? []
    expect(visibleWeeks).toHaveLength(4)
    expect([...visibleWeeks].every((week) => week.className.includes('h-'))).toBe(true)
    expect(monthGrid?.querySelectorAll('[data-calendar-cell-surface="clear"]')).toHaveLength(28)
    const dayCards = monthGrid?.querySelectorAll<HTMLButtonElement>('button[role="gridcell"]') ?? []
    expect(dayCards).toHaveLength(28)
    expect([...dayCards].every((card) => card.className.includes('focus-visible:ring-inset'))).toBe(true)
    const beforeWindow = container.querySelector('.calendar-window-caption')?.textContent
    const nextWindow = container.querySelector<HTMLButtonElement>('button[aria-label="Next four weeks"]')!
    await act(async () => nextWindow.click())
    expect(container.querySelector('.calendar-window-caption')?.textContent).not.toBe(beforeWindow)

    const inMonthDay = [...container.querySelectorAll<HTMLButtonElement>('button[data-day]')]
      .find((button) => button.querySelector('span')?.textContent?.trim() === '15')!
    expect(inMonthDay).toBeTruthy()
    await act(async () => inMonthDay.click())
    expect(container.querySelector('aside')?.textContent).toContain('15')
  })

  it('opens Weekly cards on click globally and Enter inside a fixed class scope', async () => {
    const seeded = createDemoData()
    const [first, second] = seeded.courses
    seeded.academics.classCenter.assignments = [
      assignment('weekly-global', first.id, 'Global weekly task', dateOffset(0)),
      assignment('weekly-scoped', second.id, 'Scoped weekly task', dateOffset(0)),
    ]
    useStore.getState().replaceAll(seeded)
    await render({ entry: '/academics?mode=daily&tab=assignments&view=weekly' })

    const weekLayout = container.querySelector<HTMLElement>('[data-week-layout="weekday-emphasis"]')
    expect(weekLayout).toBeTruthy()
    expect(weekLayout?.className).toContain('minmax(6.25rem,.62fr)')
    expect(container.querySelectorAll('[data-week-scope="weekday"]')).toHaveLength(5)
    expect(container.querySelectorAll('[data-week-scope="weekend"]')).toHaveLength(2)
    expect([...container.querySelectorAll('[data-week-scope="weekend"]')]
      .some((column) => column.textContent?.includes('Nothing due'))).toBe(false)

    const globalCard = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Global weekly task'))
    expect(globalCard).toBeTruthy()
    await act(async () => globalCard!.click())
    expect(document.body.textContent).toContain('Edit assignment')

    const cancel = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Cancel')
    expect(cancel).toBeTruthy()
    await act(async () => cancel!.click())

    await act(async () => {
      globalCard!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, buttons: 1, clientX: 0, clientY: 0 }))
      globalCard!.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, buttons: 1, clientX: 10, clientY: 0 }))
      globalCard!.click()
    })
    expect(document.body.textContent).not.toContain('Edit assignment')

    await act(async () => root.unmount())
    root = createRoot(container)
    await render({
      scopedCourseId: second.id,
      entry: `/academics/classes/${second.id}?classTab=assignments&view=weekly`,
    })

    const scopedCard = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Scoped weekly task'))
    expect(scopedCard).toBeTruthy()
    await act(async () => scopedCard!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    expect(document.body.textContent).toContain('Edit assignment')
    expect(document.body.querySelector('button[aria-label="Class"]')).toBeNull()
  })
})

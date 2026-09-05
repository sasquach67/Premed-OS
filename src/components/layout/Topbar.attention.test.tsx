import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import { useStore } from '@/store/store'
import { ShellActionsProvider } from './ShellActionsProvider'
import { Topbar } from './Topbar'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/store/useTheme', () => ({
  useTheme: () => ({ isDark: true, setTheme: vi.fn() }),
}))

vi.mock('@/store/useBackup', () => ({
  useBackup: () => ({ enabled: true }),
}))

vi.mock('./CommandSearch', () => ({ CommandSearch: () => null }))

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current route">{location.pathname}</output>
}

describe('Topbar attention status', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-03T12:00:00'))
    const data = structuredClone(createSeedData())
    data.tasks = []
    data.experiences = []
    data.letters = []
    data.orgs = []
    data.persons = []
    data.organizations = []
    data.academics.classCenter.assignments = [{
      id: 'attention-assignment',
      courseId: 'demo-course-chem262',
      title: 'Mechanism problem set',
      type: 'homework',
      dueDate: '2026-09-02',
      status: 'not-started',
      linkedTopicIds: [],
      linkedFileIds: [],
      createdAt: 0,
      updatedAt: 0,
      order: 0,
    }]
    data.settings.backup.enabled = true
    data.settings.backup.lastError = undefined
    data.settings.attentionSnoozedUntil = {}
    useStore.getState().replaceAll(data)

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.useRealTimers()
  })

  it('puts the class journal return link in the shell on lecture pages', async () => {
    const course = useStore.getState().courses[0]
    await act(async () => root.render(
      <MemoryRouter initialEntries={[`/academics/classes/${course.id}/lectures/lesson-2`]}>
        <ShellActionsProvider onRequestSignOut={() => undefined}>
          <Topbar onMenu={() => undefined} />
          <LocationProbe />
        </ShellActionsProvider>
      </MemoryRouter>,
    ))
    const link = container.querySelector<HTMLAnchorElement>('a[aria-label*="class journal"]')!
    expect(link.getAttribute('href')).toBe(`/academics/classes/${course.id}?classTab=overview`)
    await act(async () => link.click())
    expect(container.querySelector('[aria-label="Current route"]')?.textContent).toBe(`/academics/classes/${course.id}`)
  })

  it('opens the live Attention feed instead of navigating to the generic Tasks page', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/academics']}>
          <ShellActionsProvider onRequestSignOut={() => undefined}>
            <Topbar onMenu={() => undefined} />
            <LocationProbe />
          </ShellActionsProvider>
        </MemoryRouter>,
      )
    })

    const status = [...container.querySelectorAll<HTMLElement>('a, button')]
      .find((element) => element.textContent?.includes('1 need attention'))
    expect(status).toBeDefined()

    await act(async () => status?.click())

    expect(document.body.textContent).toContain('Mechanism problem set')
    expect(document.body.textContent).toContain('Overdue by 1 day')
    expect(container.querySelector('[aria-label="Current route"]')?.textContent).toBe('/academics')

    const snooze = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Tomorrow'))
    await act(async () => snooze?.click())

    expect(document.body.textContent).not.toContain('Mechanism problem set')
    expect(container.textContent).toContain('All clear')
  })
})

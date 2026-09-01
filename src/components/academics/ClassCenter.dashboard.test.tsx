import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassCenter } from './ClassCenter'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createDemoData } from '@/data/demoSeed'
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

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

describe('Daily Class Center persisted dashboard boundary', () => {
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
    localStorage.removeItem(STORAGE_KEY)
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function render(entry = '/academics?tab=class-center') {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[entry]}>
          <ToastProvider>
            <ClassCenter />
            <LocationProbe />
          </ToastProvider>
        </MemoryRouter>,
      )
    })
  }

  it('renders the real personal first-run recovery without demo facts and enters the cold import flow', async () => {
    await render()

    expect(container.textContent).toContain('Start with a syllabus')
    expect(container.textContent).toContain('Import a syllabus')
    expect(container.textContent).toContain('Add manually')
    expect(container.querySelector('.academics-class-card')).toBeNull()
    expect(container.textContent).not.toMatch(/BIOL 252|CHEM 262|Andy Quach|5 active|Organic Chemistry/i)

    const importButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Import a syllabus'))
    expect(importButton).toBeTruthy()
    await act(async () => importButton!.click())

    // There is no course to scope at first run. The intended recovery is the
    // cold import route, which gathers the class identity after material is
    // supplied rather than attaching to a seeded course.
    expect(document.body.textContent).toContain('Import a syllabus')
    expect(document.body.textContent).toContain('Drop a syllabus or course schedule here')
    expect(document.body.textContent).toContain('Nothing saved')
    expect(document.body.textContent).not.toMatch(/BIOL 252|CHEM 262|Andy Quach/i)

    await act(async () => root.unmount())
    root = createRoot(container)
    await render()
    const manualButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Add manually'))
    expect(manualButton).toBeTruthy()
    await act(async () => manualButton!.click())
    expect(document.body.textContent).toContain('Create class')
  })

  it('keeps the URL-backed List selection through a dashboard remount', async () => {
    useStore.getState().replaceAll(structuredClone(createSeedData()))
    await render()

    const listButton = container.querySelector('button[aria-label="List view"]') as HTMLButtonElement
    expect(listButton).toBeTruthy()
    await act(async () => listButton.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain('classView=list')

    await act(async () => root.unmount())
    root = createRoot(container)
    await render('/academics?tab=class-center&classView=list')

    expect((container.querySelector('button[aria-label="List view"]') as HTMLButtonElement).getAttribute('data-state')).toBe('on')
    expect(container.querySelector('.academics-class-card')?.className).toContain('min-h-0')
  })

  it('shows this week coursework completion as a horizontal done-versus-left bar', async () => {
    const seeded = structuredClone(createSeedData())
    const courseId = seeded.academics.classCenter.workspaces[0]?.courseId
    const courseCode = seeded.courses.find((course) => course.id === courseId)?.code
    if (!courseId || !courseCode) throw new Error('Expected a visible seeded course for the weekly-progress test')
    const today = new Date()
    const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const thisWeek = (offset: number) => {
      const due = new Date(sunday)
      due.setDate(due.getDate() + offset)
      return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
    }
    seeded.academics.classCenter.assignments = [
      {
        id: 'weekly-done', courseId, title: 'Completed this week', type: 'homework', dueDate: thisWeek(1), status: 'submitted',
        linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 0,
      },
      {
        id: 'weekly-left', courseId, title: 'Still due this week', type: 'reading', dueDate: thisWeek(5), status: 'not-started',
        linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 1,
      },
      {
        id: 'later-work', courseId, title: 'Not part of this week', type: 'exam', dueDate: thisWeek(9), status: 'not-started',
        linkedTopicIds: [], linkedFileIds: [], createdAt: 1, updatedAt: 1, order: 2,
      },
    ]
    useStore.getState().replaceAll(seeded)
    await render()

    const card = [...container.querySelectorAll<HTMLElement>('.academics-class-card')]
      .find((item) => item.textContent?.includes(courseCode))
    const progress = card?.querySelector<HTMLElement>('.academics-coursework-progress')
    expect(progress).toBeTruthy()
    expect(progress?.querySelector('.academics-coursework-track')).toBeTruthy()
    expect(progress?.querySelector('.academics-coursework-ring')).toBeNull()
    expect(progress?.textContent).toContain('Weekly progress')
    expect(progress?.textContent).toContain('1 done')
    expect(progress?.textContent).toContain('1 left')
    expect(progress?.textContent).toContain('2 this week')
    expect(progress?.getAttribute('aria-label')).toBe('1 of 2 coursework items complete this week; 1 left')
  })

  it('opens a new syllabus import from the shared importFor=new route and clears it on cancel', async () => {
    useStore.getState().replaceAll(structuredClone(createSeedData()))
    await render('/academics?tab=class-center&importFor=new')

    expect(document.body.textContent).toContain('Import a syllabus')
    expect(document.body.textContent).toContain('Drop a syllabus or course schedule here')
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain('importFor=new')

    const cancel = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Cancel')
    expect(cancel).toBeTruthy()
    await act(async () => cancel!.click())

    expect(container.querySelector('[data-testid="location"]')?.textContent).not.toContain('importFor')
    expect(container.textContent).toContain('Your classes')
  })

  it('offers recognizable icon choices across common subject areas', async () => {
    await render()
    const manualButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Add manually'))
    expect(manualButton).toBeTruthy()
    await act(async () => manualButton!.click())

    for (const label of ['Languages', 'Art', 'Music', 'Computer science', 'History', 'Geography', 'Law and policy', 'Business', 'Education', 'Physical education', 'Performing arts', 'Engineering', 'Economics', 'Philosophy']) {
      expect(document.body.querySelector(`button[aria-label="${label}"]`)).toBeTruthy()
    }
    expect(document.body.querySelectorAll('button[aria-label="Math"]')).toHaveLength(1)
    expect(document.body.querySelector('button[aria-label="Mathematics"]')).toBeNull()

    const book = document.body.querySelector('button[aria-label="Book"]') as HTMLButtonElement
    const engineering = document.body.querySelector('button[aria-label="Engineering"]') as HTMLButtonElement
    expect(book.getAttribute('aria-pressed')).toBe('true')
    expect(engineering.getAttribute('aria-pressed')).toBe('false')
    await act(async () => engineering.click())
    expect(engineering.getAttribute('aria-pressed')).toBe('true')
  })

  it('restores the saved icon as the pressed choice when class settings reopen', async () => {
    const seeded = structuredClone(createSeedData())
    seeded.academics.classCenter.workspaces[0].icon = 'engineering'
    useStore.getState().replaceAll(seeded)
    await render()

    const overflow = container.querySelector('button[aria-label="Class actions"]') as HTMLButtonElement
    expect(overflow).toBeTruthy()
    await act(async () => {
      overflow.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      overflow.click()
    })
    const settings = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((item) => item.textContent?.trim() === 'Class settings')
    expect(settings).toBeTruthy()
    await act(async () => settings!.click())

    expect(document.body.querySelector('button[aria-label="Engineering"]')?.getAttribute('aria-pressed')).toBe('true')
  })

  it('offers a complete three-row class color palette', async () => {
    useStore.getState().replaceAll(structuredClone(createSeedData()))
    await render()

    const overflow = container.querySelector('button[aria-label="Class actions"]') as HTMLButtonElement
    await act(async () => {
      overflow.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      overflow.click()
    })
    const settings = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((item) => item.textContent?.trim() === 'Class settings')
    await act(async () => settings!.click())

    const palette = [...document.body.querySelectorAll<HTMLButtonElement>('button[title]')]
      .filter((button) => ['Blue', 'Sky', 'Cyan', 'Teal', 'Mint', 'Green', 'Lime', 'Yellow', 'Orange', 'Coral', 'Red', 'Pink', 'Purple', 'Plum', 'Indigo', 'Navy', 'Brown', 'Gray'].includes(button.title))
    expect(palette.map((button) => button.title)).toEqual([
      'Blue', 'Sky', 'Cyan', 'Teal', 'Mint', 'Green',
      'Lime', 'Yellow', 'Orange', 'Coral', 'Red', 'Pink',
      'Purple', 'Plum', 'Indigo', 'Navy', 'Brown', 'Gray',
    ])
    expect(palette[0].parentElement?.className).toContain('grid-cols-6')
  })

  it('previews from the card body or keyboard and opens the full hub only from Open', async () => {
    const seeded = structuredClone(createSeedData())
    const course = seeded.courses.find((item) => item.code === 'BIOL 103')!
    useStore.getState().replaceAll(seeded)
    await render()

    const card = [...container.querySelectorAll<HTMLElement>('.academics-class-card')]
      .find((item) => item.textContent?.includes(course.code))
    const open = [...(card?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      .find((button) => button.textContent?.trim() === 'Open')

    expect(card).toBeTruthy()
    expect(open).toBeTruthy()
    expect(open!.className).toContain('md:opacity-0')
    expect(open!.querySelector('.lucide-arrow-up-right')).toBeTruthy()
    await act(async () => card!.click())
    expect(document.body.textContent).toContain(`${course.code} preview`)
    expect(document.body.textContent).toContain('Open Class Hub')
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=class-center')

    const close = document.body.querySelector<HTMLButtonElement>('button[aria-label="Close record"]')
    expect(close).toBeTruthy()
    await act(async () => close!.click())
    await act(async () => card!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    expect(document.body.textContent).toContain(`${course.code} preview`)
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=class-center')

    const closeAgain = document.body.querySelector<HTMLButtonElement>('button[aria-label="Close record"]')
    expect(closeAgain).toBeTruthy()
    await act(async () => closeAgain!.click())
    await act(async () => open!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(`/academics/classes/${course.id}`)
  })

  it('opens the dated exam in Exam Prep from the Up next panel', async () => {
    const seeded = structuredClone(createSeedData())
    const exam = seeded.academics.classCenter.assignments
      .filter((item) => item.type === 'exam' && item.dueDate)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
    seeded.academics.classCenter.assignments.forEach((item) => {
      if (item.id !== exam.id) item.status = 'submitted'
    })
    useStore.getState().replaceAll(seeded)
    await render()

    const examPlan = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Build exam plan')
    expect(examPlan).toBeTruthy()
    await act(async () => examPlan!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent)
      .toBe(`/academics/classes/${exam.courseId}?classTab=overview&examPrep=${exam.id}`)
  })

  it('routes the GPA What-if action to Grades & Archive scenario mode', async () => {
    useStore.getState().replaceAll(structuredClone(createSeedData()))
    await render()

    const whatIf = [...container.querySelectorAll<HTMLAnchorElement>('a')]
      .find((link) => link.textContent?.includes('What-if'))
    expect(whatIf?.getAttribute('href')).toBe('/academics?mode=planning&tab=archive&gradeView=what-if')
    await act(async () => whatIf!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent)
      .toBe('/academics?mode=planning&tab=archive&gradeView=what-if')
  })

  it('matches the approved Class Center information hierarchy without inventing missing trends', async () => {
    useStore.getState().replaceAll(createDemoData())
    await render()

    expect(container.textContent).toContain('Topic coverage')
    expect(container.textContent).toContain('Lecture journal')
    expect(container.textContent).toContain('Recent study work')
    expect(container.textContent).toContain('Class materials')
    expect(container.textContent).toContain('GPA trend')
    expect(container.textContent).toContain('Contribution by course')
    expect(container.textContent).not.toContain('Recent recall')
    expect(container.textContent).not.toContain('Review activity')
    expect(container.textContent).not.toContain('Mastery trend')
    expect(container.textContent).not.toContain('Marked for review')

    const addClass = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Add class')
    expect(addClass).toBeTruthy()
    expect(addClass?.parentElement?.parentElement?.textContent).toContain('Your classes')
    expect(container.textContent).not.toContain('from your course plan or start blank')
    expect(container.querySelector('[aria-label$="% retrievability"]')).toBeNull()
    expect(container.querySelector('[aria-label$="days stability"]')).toBeNull()
  })

  it('ranks Up next from recorded weight and proximity and keeps Upcoming major-only', async () => {
    const seeded = createDemoData()
    const topic = seeded.academics.classCenter.topics[0]
    const courseId = topic.courseId
    topic.status = 'not-started'
    const due = (days: number) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date.toISOString().slice(0, 10)
    }
    const base = { courseId, status: 'not-started' as const, linkedTopicIds: [topic.id], linkedFileIds: [], createdAt: 1, updatedAt: 1 }
    seeded.academics.classCenter.assignments = [
      { ...base, id: 'light-soon', title: 'Light soon', type: 'homework', dueDate: due(1), weight: 2, order: 0 },
      { ...base, id: 'heavy-later', title: 'Heavy later', type: 'exam', dueDate: due(4), weight: 40, order: 1 },
      { ...base, id: 'minor', title: 'Minor task', type: 'homework', dueDate: due(1), weight: 5, order: 2 },
    ]
    useStore.getState().replaceAll(seeded)
    await render()

    const panelByTitle = (title: string) => [...container.querySelectorAll<HTMLElement>('.academics-bento-panel')]
      .find((panel) => [...panel.querySelectorAll('*')].some((node) => node.textContent?.trim() === title))
    const upNext = panelByTitle('Up next')!
    expect(upNext.querySelector('h3')?.textContent).toBe('Heavy later')
    const upcoming = panelByTitle('Upcoming')!
    expect(upcoming.textContent).toContain('Heavy later')
    expect(upcoming.textContent).not.toContain('Minor task')
  })

  it('persists a changed course-owned fact through Zustand hydration without replacing it with seed data', async () => {
    const seeded = structuredClone(createSeedData())
    const course = seeded.courses.find((item) => item.code === 'BIOL 103')!
    course.grade = 'A-'
    useStore.getState().replaceAll(seeded)

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()

    const afterHydration = snapshotData()
    expect(afterHydration.courses.find((item) => item.id === course.id)).toMatchObject({ code: 'BIOL 103', grade: 'A-' })
    expect(afterHydration.courses).toHaveLength(seeded.courses.length)

    await render()
    expect(container.textContent).toContain('BIOL 103')
    expect(container.textContent).toContain('A-')
  })
})

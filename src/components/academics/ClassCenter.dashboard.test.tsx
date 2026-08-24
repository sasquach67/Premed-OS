import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassCenter } from './ClassCenter'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
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

    expect(container.textContent).toContain('Bring in your first class')
    expect(container.textContent).toContain('Import syllabus')
    expect(container.textContent).toContain('Add manually')
    expect(container.querySelector('.academics-class-card')).toBeNull()
    expect(container.textContent).not.toMatch(/BIOL 252|CHEM 262|Andy Quach|5 active|Organic Chemistry/i)

    const importButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Import syllabus'))
    expect(importButton).toBeTruthy()
    await act(async () => importButton!.click())

    // There is no course to scope at first run. The intended recovery is the
    // cold import route, which gathers the class identity after material is
    // supplied rather than attaching to a seeded course.
    expect(container.textContent).toContain('Add a class from its syllabus')
    expect(container.textContent).toContain('Drop a syllabus or course schedule here')
    expect(container.textContent).not.toMatch(/BIOL 252|CHEM 262|Andy Quach/i)

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

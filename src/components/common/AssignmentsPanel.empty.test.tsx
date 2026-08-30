import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AssignmentsPanel } from './AssignmentsPanel'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createSeedData } from '@/data/seed'
import { createInitialDataForMode, STORAGE_KEY, useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function HistoryControls() {
  const navigate = useNavigate()
  return <button type="button" data-testid="back" onClick={() => navigate(-1)}>Back</button>
}

describe('Daily Assignments first-run boundary', () => {
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

  it('keeps the cross-class agenda honest before the student has a class', async () => {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/academics?mode=daily&tab=assignments']}><ToastProvider><AssignmentsPanel /><LocationProbe /></ToastProvider></MemoryRouter>)
    })

    expect(container.textContent).toContain('Add a class before an assignment')
    expect(container.textContent).toContain('Assignments are coursework commitments')
    expect(container.textContent).toContain('Import a syllabus')
    expect(container.textContent).not.toContain('All classes')

    const recovery = [...container.querySelectorAll('a, button')].find((control) => control.textContent?.includes('Import a syllabus'))
    expect(recovery).toBeTruthy()
    await act(async () => (recovery as HTMLElement).click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?mode=daily&tab=class-center&importFor=new')
  })

  it('starts a cold syllabus import from All classes instead of choosing an arbitrary course', async () => {
    useStore.getState().replaceAll(structuredClone(createSeedData()))
    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/academics?mode=daily&tab=assignments']}><ToastProvider><AssignmentsPanel /><LocationProbe /></ToastProvider></MemoryRouter>)
    })

    const options = container.querySelector('button[aria-label="Assignment options"]') as HTMLButtonElement
    await act(async () => {
      options.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      options.click()
    })
    const importItem = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((item) => item.textContent?.trim() === 'Import syllabus')
    expect(importItem).toBeTruthy()
    await act(async () => importItem!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?mode=daily&tab=class-center&importFor=new')
  })

  it('keeps syllabus import scoped from a course Assignments view', async () => {
    const seeded = structuredClone(createSeedData())
    const courseId = seeded.courses[0].id
    useStore.getState().replaceAll(seeded)
    await act(async () => {
      root.render(<MemoryRouter initialEntries={[`/academics/classes/${courseId}?classTab=assignments`]}><ToastProvider><AssignmentsPanel courseId={courseId} /><LocationProbe /></ToastProvider></MemoryRouter>)
    })

    const options = container.querySelector('button[aria-label="Assignment options"]') as HTMLButtonElement
    await act(async () => {
      options.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
      options.click()
    })
    const importItem = [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')]
      .find((item) => item.textContent?.trim() === 'Import syllabus')
    expect(importItem).toBeTruthy()
    await act(async () => importItem!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(`/academics?mode=daily&tab=class-center&importFor=${courseId}`)
  })

  it('keeps the selected assignment view in the URL and follows browser history', async () => {
    useStore.getState().replaceAll(structuredClone(createSeedData()))
    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/academics?mode=daily&tab=assignments&view=agenda']}><ToastProvider><AssignmentsPanel /><LocationProbe /><HistoryControls /></ToastProvider></MemoryRouter>)
    })

    const weekly = container.querySelector<HTMLButtonElement>('button[aria-label="Weekly view"]')!
    await act(async () => weekly.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain('view=weekly')
    expect(weekly.getAttribute('data-state')).toBe('on')

    await act(async () => container.querySelector<HTMLButtonElement>('[data-testid="back"]')!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain('view=agenda')
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="Agenda view"]')?.getAttribute('data-state')).toBe('on')
  })
})

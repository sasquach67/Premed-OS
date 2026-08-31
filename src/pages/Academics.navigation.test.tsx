import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { ToastProvider } from '@/components/common/ToastProvider'
import { Academics } from './Academics'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
HTMLElement.prototype.scrollIntoView = vi.fn()

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}{location.search}</output>
}

function HistoryControls() {
  const navigate = useNavigate()
  const location = useLocation()
  return <>
    <button type="button" data-testid="back" onClick={() => navigate(-1)}>Back</button>
    <button type="button" data-testid="forward" onClick={() => navigate(1)}>Forward</button>
    <button
      type="button"
      data-testid="modal-query"
      onClick={() => {
        const next = new URLSearchParams(location.search)
        next.set('createMaterial', 'flashcards')
        navigate(`${location.pathname}?${next}`)
      }}
    >Open modal state</button>
  </>
}

function control(root: ParentNode, role: string, name: string) {
  return [...root.querySelectorAll<HTMLElement>(`[role="${role}"]`)]
    .find((item) => item.textContent?.trim().startsWith(name))
}

describe('Academics navigation', () => {
  let container: HTMLDivElement
  let scrollContainer: HTMLElement
  let scrollTo: ReturnType<typeof vi.fn>
  let root: Root

  beforeEach(() => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    container = document.createElement('div')
    scrollContainer = document.createElement('main')
    scrollContainer.dataset.appScrollContainer = ''
    scrollTo = vi.fn()
    scrollContainer.scrollTo = scrollTo as unknown as HTMLElement['scrollTo']
    scrollContainer.appendChild(container)
    document.body.appendChild(scrollContainer)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    scrollContainer.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  async function render(entry: string) {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={[entry]}><ToastProvider><Academics /></ToastProvider><LocationProbe /><HistoryControls /></MemoryRouter>)
    })
  }

  it('adopts a valid mode deep link, keeps its valid tab, and canonicalizes the URL', async () => {
    await render('/academics?mode=planning&tab=archive&gradeView=gpa')

    expect(useStore.getState().settings.academicsMode).toBe('planning')
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=archive&gradeView=gpa')
    expect(control(container, 'tab', 'Grades & archive')?.getAttribute('data-state')).toBe('active')
  })

  it('canonicalizes invalid mode and tab values to the persisted mode without dropping unrelated state', async () => {
    useStore.getState().update((draft) => { draft.settings.academicsMode = 'planning' })
    await render('/academics?mode=unknown&tab=unknown&plannerView=requirements')

    expect(useStore.getState().settings.academicsMode).toBe('planning')
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=planner&plannerView=requirements')
    expect(control(container, 'tab', 'Planner')?.getAttribute('data-state')).toBe('active')
  })

  it('moves between modes with arrow keys and persists the selected mode', async () => {
    await render('/academics?tab=class-center')
    const daily = control(container, 'radio', 'Daily')!

    await act(async () => daily.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))

    expect(useStore.getState().settings.academicsMode).toBe('planning')
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=planner')
    expect(control(container, 'radio', 'Planning')?.getAttribute('aria-checked')).toBe('true')
  })

  it('does not add top-level tab state to a class workspace URL', async () => {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/academics/classes/missing?classTab=guide']}><ToastProvider><Routes><Route path="/academics/classes/:courseId" element={<Academics />} /></Routes></ToastProvider><LocationProbe /></MemoryRouter>)
    })

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics/classes/missing?classTab=guide')
  })

  it('recovers an invalid syllabus-import target without hiding the Academics shell', async () => {
    await render('/academics?tab=class-center&importFor=missing-id')

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=class-center')
    expect(container.querySelector('h1')?.textContent).toBe('Academics')
    expect(container.textContent).toContain('Start with a syllabus')
  })

  it('records tab changes in browser history so Back and Forward restore the visible tab', async () => {
    await render('/academics?tab=class-center')
    scrollTo.mockClear()

    await act(async () => {
      const assignments = control(container, 'tab', 'Assignments')!
      assignments.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      assignments.click()
    })
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=assignments&view=agenda')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })

    scrollTo.mockClear()
    await act(async () => container.querySelector<HTMLButtonElement>('[data-testid="back"]')!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=class-center')
    expect(control(container, 'tab', 'Class center')?.getAttribute('data-state')).toBe('active')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })

    scrollTo.mockClear()
    await act(async () => container.querySelector<HTMLButtonElement>('[data-testid="forward"]')!.click())
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/academics?tab=assignments&view=agenda')
    expect(control(container, 'tab', 'Assignments')?.getAttribute('data-state')).toBe('active')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })

  it('does not reset the page behind a modal-only query transition', async () => {
    await render('/academics?tab=assignments&view=weekly')
    scrollTo.mockClear()

    await act(async () => container.querySelector<HTMLButtonElement>('[data-testid="modal-query"]')!.click())

    expect(container.querySelector('[data-testid="location"]')?.textContent)
      .toBe('/academics?tab=assignments&view=weekly&createMaterial=flashcards')
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('opens How to study from the first-login handoff and consumes the one-time query', async () => {
    await render('/academics?mode=daily&tab=class-center&studyGuide=open')

    expect(document.body.textContent).toContain('Record once. Bring the transcript here.')

    const gotIt = [...document.body.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Got it')!
    await act(async () => gotIt.click())

    expect(container.querySelector('[data-testid="location"]')?.textContent)
      .toBe('/academics?tab=class-center')
  })
})

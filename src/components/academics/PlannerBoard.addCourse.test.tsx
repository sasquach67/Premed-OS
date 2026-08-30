import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Academics } from '@/pages/Academics'
import { createInitialDataForMode, CURRENT_STORE_VERSION, STORAGE_KEY, useStore } from '@/store/store'
import type { Course } from '@/lib/types'
import { PlannerBoard } from './PlannerBoard'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
HTMLElement.prototype.scrollIntoView = vi.fn()

const course: Course = {
  id: 'existing', term: 'This term', code: 'CHEM 101', title: 'General Chemistry', credits: 4,
  grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0,
}

function buttonByText(root: ParentNode, text: RegExp) {
  return [...root.querySelectorAll('button')].find((button) => text.test((button.textContent ?? '').trim()))
}

function setInput(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Planner reviewed Add course entry', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.removeItem(STORAGE_KEY)
  })

  it('opens the catalog from top and per-term Add course without writing a blank Course', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [course]
      draft.academics.classCenter.plannerTerms = [
        { id: 'next', label: 'Next term', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))

    const original = useStore.getState().courses.map((item) => ({ ...item }))
    const topAdd = buttonByText(container.querySelector('.planning-filter-bar')!, /^＋ Add course$/)!
    await act(async () => topAdd.click())

    expect(useStore.getState().courses).toEqual(original)
    expect(container.querySelector('.planning-catalog-entry')?.textContent).toContain('Spring 2027 is the destination semester')
    expect(document.activeElement).toBe(container.querySelector('input[aria-label="Search UNC course catalog"]'))

    await act(async () => buttonByText(container.querySelector('.planning-catalog-entry')!, /^Cancel$/)!.click())

    const perTermAdds = [...container.querySelectorAll<HTMLButtonElement>('.planning-term-add')]
    await act(async () => perTermAdds.at(-1)!.click())
    expect(useStore.getState().courses).toEqual(original)
    expect(container.querySelector('.planning-catalog-entry')?.textContent).toContain('Spring 2027 is the destination semester')
  })

  it('uses app-styled dropdowns throughout the Planner catalog instead of native browser menus', async () => {
    useStore.getState().update((draft) => { draft.courses = [course] })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))

    const catalog = container.querySelector('.planning-catalog-dock')!
    expect(catalog.querySelectorAll('select')).toHaveLength(0)
    expect(catalog.querySelector('button[aria-label="Subject"]')).toBeTruthy()
    expect(catalog.querySelector('input[aria-label="Course number"]')).toBeTruthy()
    expect(catalog.querySelector('button[aria-label="Level"]')).toBeTruthy()
    expect(catalog.querySelector('button[aria-label="Requirement"]')).toBeTruthy()
    expect(catalog.querySelector('button[aria-label="Attribute"]')).toBeNull()
    expect(catalog.querySelector('button[aria-label="Credits"]')).toBeNull()
  })

  it('prefills published title and credits and persists only after planning details are reviewed', async () => {
    useStore.getState().update((draft) => { draft.courses = [course] })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    await act(async () => buttonByText(container.querySelector('.planning-filter-bar')!, /^＋ Add course$/)!.click())
    await act(async () => setInput(document.querySelector('input[aria-label="Search UNC course catalog"]')!, 'AAAD 101'))
    await act(async () => (document.querySelector('.planning-catalog-result') as HTMLButtonElement).click())
    await act(async () => buttonByText(document, /^＋ Add to Fall 2026$/)!.click())

    const inlineReview = document.querySelector('.planning-catalog-inline-add')!
    expect(inlineReview.textContent).toContain('Introduction to Africa')
    expect(inlineReview.querySelector<HTMLInputElement>('input[readonly]')?.value).toBe('3')
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0)
    await act(async () => buttonByText(inlineReview, /^Add to Fall 2026$/)!.click())

    expect(useStore.getState().courses).toHaveLength(2)
    expect(useStore.getState().courses[1]).toMatchObject({ code: 'AAAD 101', title: 'Introduction to Africa', credits: 3, term: 'Fall 2026', status: 'planned' })
    expect(useStore.getState().courses[1].notes).toContain('UNC 2026-2027 catalog')
    expect(useStore.getState().courses.some((item) => !item.code.trim() || !item.title.trim())).toBe(false)
  })

  it('uses the selected-program mapping consistently from catalog add through card, inspector, and reload', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [{ ...course, term: 'Fall 2026', plannerTermId: 'fall-2026' }]
      draft.academics.classCenter.plannerTerms = [
        { id: 'fall-2026', label: 'Fall 2026', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
      ]
      draft.academics.classCenter.planningProgramContext = { selectedProgramId: 'neuroscience-bs', updatedAt: 1 }
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    await act(async () => buttonByText(container.querySelector('.planning-filter-bar')!, /^＋ Add course$/)!.click())
    await act(async () => setInput(container.querySelector('input[aria-label="Search UNC course catalog"]')!, 'NSCI 175'))
    const exact = [...container.querySelectorAll<HTMLButtonElement>('.planning-catalog-result')].find((item) => item.querySelector('b')?.textContent === 'NSCI 175')!
    await act(async () => exact.click())
    await act(async () => buttonByText(container, /^＋ Add to Fall 2026$/)!.click())
    await act(async () => buttonByText(container.querySelector('.planning-catalog-inline-add')!, /^Add to Fall 2026$/)!.click())

    const card = [...container.querySelectorAll<HTMLButtonElement>('.planning-course')].find((item) => item.textContent?.includes('NSCI 175'))!
    expect(card.textContent).toContain('Introduction')
    expect(card.textContent).not.toContain('Unmapped')
    // A reviewed catalog add selects the new course immediately.
    expect(container.querySelector('.planning-rail')?.textContent).toContain('Introduction')
    expect(container.querySelector('.planning-rail')?.textContent).toContain('UNC 2026-2027 catalog')

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()
    expect(useStore.getState().academics.classCenter.planningProgramContext.selectedProgramId).toBe('neuroscience-bs')
    const restoredCard = [...container.querySelectorAll<HTMLButtonElement>('.planning-course')].find((item) => item.textContent?.includes('NSCI 175'))!
    expect(restoredCard.textContent).toContain('Introduction')
    expect(restoredCard.textContent).not.toContain('Unmapped')
  })

  it('keeps an earned attempt intact when a reviewed catalog course is added as a retake', async () => {
    useStore.getState().update((draft) => { draft.courses = [{ ...course, status: 'completed', grade: 'C-' }] })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    await act(async () => buttonByText(container.querySelector('.planning-filter-bar')!, /^＋ Add course$/)!.click())
    await act(async () => setInput(container.querySelector('input[aria-label="Search UNC course catalog"]')!, 'CHEM 101'))
    const exact = [...container.querySelectorAll<HTMLButtonElement>('.planning-catalog-result')].find((item) => item.querySelector('b')?.textContent === 'CHEM 101')!
    await act(async () => exact.click())
    await act(async () => buttonByText(container, /^＋ Add to Fall 2026$/)!.click())
    await act(async () => buttonByText(container.querySelector('.planning-catalog-inline-add')!, /^Add to Fall 2026$/)!.click())

    const decision = document.querySelector('[role="alertdialog"]')!
    expect(decision.textContent).toContain('Keep both CHEM 101 attempts')
    expect(useStore.getState().courses).toHaveLength(1)
    await act(async () => buttonByText(decision, /^Keep planned repeat$/)!.click())
    expect(useStore.getState().courses).toHaveLength(2)
    expect(useStore.getState().courses[0]).toMatchObject({ grade: 'C-', status: 'completed' })
    expect(useStore.getState().courses[1]).toMatchObject({ code: 'CHEM 101', grade: '', status: 'planned' })
  })

  it('does not add a duplicate planned course unless the student explicitly keeps it', async () => {
    useStore.getState().update((draft) => { draft.courses = [course] })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    await act(async () => buttonByText(container.querySelector('.planning-filter-bar')!, /^＋ Add course$/)!.click())
    await act(async () => setInput(container.querySelector('input[aria-label="Search UNC course catalog"]')!, 'CHEM 101'))
    const exact = [...container.querySelectorAll<HTMLButtonElement>('.planning-catalog-result')].find((item) => item.querySelector('b')?.textContent === 'CHEM 101')!
    await act(async () => exact.click())
    await act(async () => buttonByText(container, /^＋ Add to Fall 2026$/)!.click())
    await act(async () => buttonByText(container.querySelector('.planning-catalog-inline-add')!, /^Add to Fall 2026$/)!.click())
    const decision = document.querySelector('[role="alertdialog"]')!
    expect(decision.textContent).toContain('already in the plan')
    expect(useStore.getState().courses).toHaveLength(1)
    await act(async () => buttonByText(decision, /^Cancel$/)!.click())
    expect(useStore.getState().courses).toHaveLength(1)
  })

  it('keeps a catalog course unplaced when its published prerequisite is absent from the local sequence', async () => {
    useStore.getState().update((draft) => { draft.courses = [course] })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    await act(async () => buttonByText(container.querySelector('.planning-filter-bar')!, /^＋ Add course$/)!.click())
    await act(async () => setInput(container.querySelector('input[aria-label="Search UNC course catalog"]')!, 'CHEM 430'))
    const exact = [...container.querySelectorAll<HTMLButtonElement>('.planning-catalog-result')].find((item) => item.querySelector('b')?.textContent === 'CHEM 430')!
    await act(async () => exact.click())
    await act(async () => buttonByText(container, /^＋ Add to Fall 2026$/)!.click())
    await act(async () => buttonByText(container.querySelector('.planning-catalog-inline-add')!, /^Add to Fall 2026$/)!.click())

    const decision = document.querySelector('[role="alertdialog"]')!
    expect(decision.textContent).toContain('CHEM 430 needs prerequisite review')
    expect(decision.textContent).toContain('BIOL 101, and CHEM 262')
    await act(async () => buttonByText(decision, /^Keep unplaced$/)!.click())
    expect(useStore.getState().courses.at(-1)).toMatchObject({ code: 'CHEM 430', term: 'Unscheduled', plannerTermId: undefined })
  })

  it('keeps add and remove controls on the semester itself', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [course]
      draft.academics.classCenter.plannerTerms = [
        { id: 'empty-term', label: 'Spring 2027', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))

    const term = [...container.querySelectorAll<HTMLElement>('.planning-term')].find((item) => item.textContent?.includes('Spring 2027'))!
    expect(term.querySelector('.planning-term-add')).toBeTruthy()
    const remove = term.querySelector<HTMLButtonElement>('button[aria-label="Delete Spring 2027"]')!
    expect(remove.disabled).toBe(false)
    await act(async () => remove.click())
    await act(async () => buttonByText(document.querySelector('[role="alertdialog"]')!, /^Remove semester$/)!.click())
    expect(useStore.getState().academics.classCenter.plannerTerms).toHaveLength(0)
  })

  it('names the next standard semester automatically and refuses an exact duplicate', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [{ ...course, term: 'Fall 2026', plannerTermId: 'fall-2026' }]
      draft.academics.classCenter.plannerTerms = [
        { id: 'fall-2026', label: 'Fall 2026', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    await act(async () => buttonByText(container.querySelector('.planning-card-header')!, /^＋ Add term$/)!.click())
    const dialog = document.querySelector('[role="dialog"]')!
    const label = dialog.querySelector<HTMLInputElement>('input[placeholder="e.g. Summer 2027"]')!
    expect(label.value).toBe('Spring 2027')
    await act(async () => buttonByText(dialog, /^Add term$/)!.click())
    expect(useStore.getState().academics.classCenter.plannerTerms.map((term) => term.label)).toEqual(['Fall 2026', 'Spring 2027'])
    await act(async () => setInput(label, 'Spring 2027'))
    await act(async () => buttonByText(dialog, /^Add term$/)!.click())
    expect(useStore.getState().academics.classCenter.plannerTerms).toHaveLength(2)
  })

  it('saves a term note and restores it through persisted hydration', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [{ ...course, term: 'Spring 2027', plannerTermId: 'spring-2027' }]
      draft.academics.classCenter.plannerTerms = [
        { id: 'spring-2027', label: 'Spring 2027', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Edit Spring 2027"]')!.click())
    const dialog = document.querySelector('[role="dialog"]')!
    const note = dialog.querySelector<HTMLTextAreaElement>('textarea')!
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    await act(async () => { setter.call(note, 'Keep Tuesday open for lab.'); note.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => buttonByText(dialog, /^Save term details$/)!.click())
    expect(useStore.getState().academics.classCenter.plannerTerms[0].note).toBe('Keep Tuesday open for lab.')

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await useStore.persist.rehydrate()
    expect(useStore.getState().academics.classCenter.plannerTerms[0].note).toBe('Keep Tuesday open for lab.')
  })

  it('opens a student-recorded registration nudge and hands Review into the persisted term editor', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [{ ...course, term: 'Fall 2027', plannerTermId: 'fall-2027' }]
      draft.academics.classCenter.plannerTerms = [
        { id: 'fall-2027', label: 'Fall 2027', kind: 'standard', origin: 'student-created', note: 'Registration opens Apr 6', createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))

    await act(async () => buttonByText(container, /Registration opens Apr 6/)!.click())
    const panel = container.querySelector('.planning-registration-panel')!
    expect(panel.textContent).toContain('Review this term before registration')
    expect(panel.textContent).toContain('Current sections, seats, restrictions, and enrollment stay in ConnectCarolina')
    expect(panel.querySelector<HTMLAnchorElement>('a')?.href).toContain('connectcarolina.unc.edu')
    await act(async () => buttonByText(panel, /^Review Fall 2027$/)!.click())
    expect(container.querySelector('.planning-registration-panel')).toBeNull()
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('Term details')
    expect(dialog.textContent).toContain('Fall 2027')
    const note = dialog.querySelector<HTMLTextAreaElement>('textarea')!
    expect(note.value).toBe('Registration opens Apr 6')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
    await act(async () => { setter.call(note, 'Registration opens Apr 8'); note.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => buttonByText(dialog, /^Save term details$/)!.click())
    expect(useStore.getState().academics.classCenter.plannerTerms[0].note).toBe('Registration opens Apr 8')
  })

  it('keeps the plan trajectory full-width below the timeline instead of stacking it in the requirements rail', async () => {
    useStore.getState().update((draft) => { draft.courses = [course] })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))
    expect(container.querySelector('.planning-main > .planning-trajectory-wide')).toBeTruthy()
    expect(container.querySelector('.planning-rail .planning-trajectory-wide')).toBeNull()
    const action = buttonByText(container.querySelector('.planning-trajectory-actions')!, /Add course to the next open term/)!
    await act(async () => action.click())
    expect(container.querySelector('.planning-catalog-entry')?.textContent).toContain('is the destination semester')
  })

  it('turns the trajectory action into an honest add-term recovery when no semester can accept a course', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [{ ...course, term: 'Fall 2026', plannerTermId: 'fall-2026' }]
      draft.academics.classCenter.plannerTerms = [
        { id: 'fall-2026', label: 'Fall 2026', kind: 'standard', origin: 'student-created', lockedAt: 1, createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))

    const action = buttonByText(container.querySelector('.planning-trajectory-actions')!, /Add an editable term first/)!
    expect(action.textContent).toContain('Create a term before choosing a course')
    await act(async () => action.click())

    expect(container.querySelector('.planning-catalog-entry')).toBeNull()
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('Add a planning term')
    expect(dialog.textContent).toContain('A term is a planning slot, not an official registration record')
  })

  it('can remove an editable semester and its planned courses after confirmation', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [{ ...course, term: 'Spring 2027', plannerTermId: 'spring-2027' }]
      draft.academics.classCenter.plannerTerms = [
        { id: 'spring-2027', label: 'Spring 2027', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))

    const remove = container.querySelector<HTMLButtonElement>('button[aria-label="Delete Spring 2027"]')!
    expect(remove.disabled).toBe(false)
    await act(async () => remove.click())
    expect(useStore.getState().courses).toHaveLength(1)
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain('its 1 planned course')
    await act(async () => buttonByText(document.querySelector('[role="alertdialog"]')!, /^Remove semester$/)!.click())
    expect(useStore.getState().courses).toHaveLength(0)
    expect(useStore.getState().academics.classCenter.plannerTerms).toHaveLength(0)
  })

  it('collapses legacy relative and concrete labels into one visible semester', async () => {
    useStore.getState().update((draft) => {
      draft.profile.startTerm = 'Fall 2026'
      draft.courses = [{ ...course, plannerTermId: 'legacy-current' }]
      draft.academics.classCenter.plannerTerms = [
        { id: 'legacy-current', label: 'This term', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
        { id: 'fall-2026', label: 'Fall 2026', kind: 'standard', origin: 'student-created', createdAt: 2, updatedAt: 2, order: 1 },
      ]
    })
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => undefined} /></MemoryRouter>))

    const fallTerms = [...container.querySelectorAll('.planning-term-name')]
      .filter((item) => item.textContent?.trim() === 'Fall 2026')
    expect(fallTerms).toHaveLength(1)
    expect(container.textContent).toContain('CHEM 101')
  })

  it('opens the same catalog-first flow from the empty Planner without creating a placeholder', async () => {
    useStore.getState().update((draft) => {
      draft.courses = []
      draft.settings.academicsMode = 'planning'
      draft.profile.startTerm = 'Fall 2026'
    })
    await act(async () => root.render(<MemoryRouter initialEntries={['/academics?tab=planner']}><Academics /></MemoryRouter>))

    await act(async () => buttonByText(container, /^Add your first course$/)!.click())
    expect(useStore.getState().courses).toHaveLength(0)
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog).toBeTruthy()
    expect(dialog.textContent).toContain('Add a course to Fall 2026')
    expect(dialog.querySelector('.planning-catalog-dock')?.closest('.planning-workspace')).toBeTruthy()
    expect(container.querySelector('.planning-catalog-dock')).toBeNull()
    expect(container.textContent).not.toContain('Title not recorded')
  })

  it('uses the visible empty-term slots as real course destinations', async () => {
    useStore.getState().update((draft) => {
      draft.courses = []
      draft.settings.academicsMode = 'planning'
      draft.profile.startTerm = 'Fall 2026'
    })
    await act(async () => root.render(<MemoryRouter initialEntries={['/academics?tab=planner']}><Academics /></MemoryRouter>))

    await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label="Add a course to Spring 2027"]')!.click())

    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('Add a course to Spring 2027')
    expect(useStore.getState().courses).toHaveLength(0)
  })

  it('supports a reviewed manual course when the local library has no match', async () => {
    useStore.getState().update((draft) => {
      draft.courses = []
      draft.settings.academicsMode = 'planning'
      draft.profile.startTerm = 'Fall 2026'
    })
    await act(async () => root.render(<MemoryRouter initialEntries={['/academics?tab=planner']}><Academics /></MemoryRouter>))

    await act(async () => buttonByText(container, /^Add your first course$/)!.click())
    await act(async () => buttonByText(document, /^Enter manually$/)!.click())
    expect(useStore.getState().courses).toHaveLength(0)

    const dialog = [...document.querySelectorAll('[role="dialog"]')].at(-1)!
    await act(async () => {
      setInput(dialog.querySelector('input[placeholder="e.g. BIOL 252"]')!, 'HIST 101')
      setInput(dialog.querySelector('input[placeholder="e.g. 3"]')!, '3')
      setInput(dialog.querySelector('input[placeholder="Enter the title from your source"]')!, 'World History')
    })
    await act(async () => buttonByText(dialog, /^Add to Fall 2026$/)!.click())

    expect(useStore.getState().courses).toHaveLength(1)
    expect(useStore.getState().courses[0]).toMatchObject({ code: 'HIST 101', title: 'World History', credits: 3, term: 'Fall 2026', status: 'planned', inResidence: true })
    expect(container.textContent).not.toContain('Give the empty plan a starting point.')
    expect(container.querySelector('[aria-label="Academic planner"]')).toBeTruthy()
    expect(container.textContent).toContain('HIST 101')
  })
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlannerBoard } from './PlannerBoard'
import { createInitialDataForMode, STORAGE_KEY, useStore } from '@/store/store'
import type { Course } from '@/lib/types'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

const course = (over: Partial<Course> = {}): Course => ({
  id: 'c1', term: 'This term', code: '', title: '', credits: 3, grade: '',
  bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0, ...over,
})

/**
 * WHY THIS EXISTS: every planned row needs one correction surface after the
 * reviewed catalog add flow. Edit, placement, and recoverable removal all work
 * against the same persisted Course record.
 */
describe('Planner inspector correction paths', () => {
  let container: HTMLDivElement
  let root: Root

  const byText = (re: RegExp) => [...container.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()))
  const selectFirstCourse = async () => {
    const row = container.querySelector('.planning-course') as HTMLElement | null
    await act(async () => { row?.click() })
  }

  beforeEach(async () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    useStore.getState().update((d) => {
      d.courses = [course()]
      d.academics.classCenter.plannerTerms = [
        { id: 'next', label: 'Next term', kind: 'standard', origin: 'student-created', createdAt: 1, updatedAt: 1, order: 0 },
      ]
    })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<MemoryRouter><PlannerBoard onComparePlans={() => {}} /></MemoryRouter>)
    })
    await selectFirstCourse()
  })

  afterEach(async () => { await act(async () => root.unmount()); container.remove() })

  it('offers edit and remove alongside Choose term', () => {
    expect(byText(/^Choose term$/)).toBeTruthy()
    expect(byText(/^Edit details$/)).toBeTruthy()
    expect(byText(/^Remove$/)).toBeTruthy()
  })

  it('corrects a blank record in place', async () => {
    await act(async () => { byText(/^Edit details$/)!.click() })
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    const field = (label: string) => [...container.querySelectorAll('input')].find((i) => i.getAttribute('aria-label') === label)!
    await act(async () => {
      const code = field('Course code')
      setter.call(code, 'BIOL 252')
      code.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(useStore.getState().courses[0].code).toBe('BIOL 252')
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as { state?: { courses?: Course[] } }
    expect(persisted.state?.courses?.[0].code).toBe('BIOL 252')
  })

  it('previews and persists placement only after the destination is confirmed', async () => {
    await act(async () => { byText(/^Choose term$/)!.click() })
    const dialog = document.querySelector('[role="dialog"]')!
    await act(async () => { byTextIn(dialog, /^Spring 2027/)!.click() })
    expect(useStore.getState().courses[0].term).toBe('This term')
    await act(async () => { byTextIn(dialog, /^Place in Spring 2027$/)!.click() })
    expect(useStore.getState().courses[0]).toMatchObject({ term: 'Spring 2027', plannerTermId: 'next' })
  })

  it('removes the course, recoverably', async () => {
    await act(async () => { byText(/^Remove$/)!.click() })
    expect(useStore.getState().courses).toHaveLength(0)
    // Soft delete: an accidental removal must not be final.
    expect(useStore.getState().meta.recoveryStack.length).toBeGreaterThan(0)
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as { state?: { courses?: Course[] } }
    expect(persisted.state?.courses).toHaveLength(0)
  })

  it('does not allow a course to mutate indirectly while its planning term is locked', async () => {
    await act(async () => root.unmount())
    useStore.getState().update((draft) => {
      draft.courses = [course({ plannerTermId: 'next', term: 'Spring 2027' })]
      draft.academics.classCenter.plannerTerms = [
        { id: 'next', label: 'Spring 2027', kind: 'standard', origin: 'student-created', lockedAt: 2, createdAt: 1, updatedAt: 2, order: 0 },
      ]
    })
    root = createRoot(container)
    await act(async () => root.render(<MemoryRouter><PlannerBoard onComparePlans={() => {}} /></MemoryRouter>))
    await selectFirstCourse()

    expect(container.textContent).toContain('Unlock this planning term before moving, editing, or removing its courses.')
    expect(byText(/^Choose term$/)).toBeUndefined()
    expect(byText(/^Edit details$/)).toBeUndefined()
    expect(byText(/^Remove$/)).toBeUndefined()
  })
})

function byTextIn(root: ParentNode, re: RegExp) {
  return [...root.querySelectorAll('button')].find((button) => re.test((button.textContent || '').trim()))
}

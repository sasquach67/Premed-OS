import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlannerBoard } from './PlannerBoard'
import { createInitialDataForMode, useStore } from '@/store/store'
import type { Course } from '@/lib/types'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

const course = (over: Partial<Course> = {}): Course => ({
  id: 'c1', term: 'This term', code: '', title: '', credits: 3, grade: '',
  bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0, ...over,
})

/**
 * WHY THIS EXISTS: `Add course` writes the row immediately, so a blank or wrong
 * 3-credit record could be created and then never corrected or taken back — the
 * Planner had no edit or remove path at all.
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
    useStore.getState().update((d) => { d.courses = [course()] })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<MemoryRouter><PlannerBoard onAddCourse={() => {}} onComparePlans={() => {}} /></MemoryRouter>)
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
  })

  it('removes the course, recoverably', async () => {
    await act(async () => { byText(/^Remove$/)!.click() })
    expect(useStore.getState().courses).toHaveLength(0)
    // Soft delete: an accidental removal must not be final.
    expect(useStore.getState().meta.recoveryStack.length).toBeGreaterThan(0)
  })
})

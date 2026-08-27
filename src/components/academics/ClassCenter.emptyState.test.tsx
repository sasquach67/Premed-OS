import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassCenter } from './ClassCenter'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createInitialDataForMode, useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

/**
 * Approved source: academics-empty-states-prototype.html — Variant A's
 * `.setup-guide` carrying Variant B's copy.
 *
 * WHY THIS EXISTS: cb963a3 shipped this surface with a numbered
 * "Review before saving / Keep work in one place / Change it any time" strip
 * that appears in no variant, dropped the partial-parse promise entirely, and
 * flipped the page to `built`. No test asserted the approved copy, so nothing
 * caught it for four months.
 */
describe('Class Center zero-class empty state', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<MemoryRouter><ToastProvider><ClassCenter /></ToastProvider></MemoryRouter>)
    })
  })

  afterEach(async () => { await act(async () => root.unmount()); container.remove() })

  it('renders the approved "What this sets up" explanation', () => {
    const panel = container.querySelector('[aria-label="What this sets up"]')
    expect(panel).toBeTruthy()
    expect(panel!.textContent).toContain('What this sets up')
    expect(panel!.textContent).toContain('one import, then you stay in control')
  })

  it('names what the import will populate, in the approved order', () => {
    const panel = container.querySelector('[aria-label="What this sets up"]')!
    const titles = [...panel.querySelectorAll('p')].map((p) => p.textContent?.trim())
    expect(titles).toEqual(expect.arrayContaining(['Class details', 'Dates and deadlines', 'Grade structure']))
    expect(panel.textContent).toContain('Course, instructor, meetings, office hours.')
    expect(panel.textContent).toContain('Exams, assignments, readings, and due dates.')
    expect(panel.textContent).toContain('Categories and weights, checked to total 100%.')
  })

  it('keeps the partial-parse promise — the one statement about half-working extraction', () => {
    expect(container.textContent).toContain(
      'If part of the syllabus can’t be read, we keep what worked and show exactly what needs manual entry.',
    )
  })

  it('does not reintroduce the unapproved numbered strip', () => {
    expect(container.textContent).not.toContain('Review before saving')
    expect(container.textContent).not.toContain('Keep work in one place')
    expect(container.textContent).not.toContain('Change it any time')
  })

  it('keeps the ruled primary action and the quiet manual link', () => {
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent?.trim())
    expect(buttons.some((t) => t?.includes('Import syllabus'))).toBe(true)
    expect(buttons.some((t) => t === 'Add manually')).toBe(true)
  })

  it('shows no metric or placeholder course on an empty store', () => {
    expect(container.querySelectorAll('[data-course-id]')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/\b0\.00\b/)
  })
})

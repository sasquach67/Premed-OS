import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { GradesArchive } from './GradesArchive'
import { PlannerBoard } from './PlannerBoard'
import { PlanningColdStart } from './PlanningColdStart'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function setInput(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Planning Variant A fidelity corrections', () => {
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
  })

  it('renders transcript-empty before every Grades ledger control and opens intake, then the record entry', async () => {
    useStore.getState().update((draft) => {
      draft.courses.push({ id: 'chem', term: 'Fall 2026', code: 'CHEM 101', title: 'General Chemistry', credits: 4, grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0 })
    })
    await act(async () => root.render(<MemoryRouter><GradesArchive courses={useStore.getState().courses} /></MemoryRouter>))

    expect(container.textContent).toContain('Start with one course line.')
    expect(container.textContent).not.toContain('What-if')
    expect(container.textContent).not.toContain('Search the ledger')
    expect(container.textContent).not.toContain('Export coursework preview')

    const add = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Add a transcript record')
    await act(async () => add?.click())
    // Approved 2026-08-27: the empty archive opens transcript *intake* first, so
    // a transcript file has somewhere to go. The manual line stays one click
    // away as an equal route rather than the only one.
    expect(container.querySelector('.grades-intake-drop')).toBeTruthy()
    expect(container.textContent).toContain('Enter one line manually')
    expect(container.textContent).not.toContain('Export coursework preview')

    const manual = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Enter one line manually')
    await act(async () => manual?.click())
    expect(container.querySelector('input[placeholder="Institution (exact)"]')).toBeTruthy()
    expect(container.textContent).toContain('Save transcript record')
    expect(container.textContent).not.toContain('Export coursework preview')

    await act(async () => {
      setInput(container.querySelector('input[placeholder="Institution (exact)"]')!, 'UNC Chapel Hill')
      setInput(container.querySelector('input[placeholder="Course number (exact)"]')!, 'CHEM 101')
      setInput(container.querySelector('input[placeholder="Course title (exact)"]')!, 'General Chemistry')
    })
    const save = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Save transcript record'))
    await act(async () => save?.click())
    expect(container.textContent).toContain('Ledger')
    expect(container.textContent).toContain('UNC Chapel Hill')
  })

  it('restores the approved Planner control and planning-context labels without fabricated values', async () => {
    useStore.getState().update((draft) => {
      draft.courses.push({ id: 'chem', term: 'Fall 2026', code: 'CHEM 101', title: 'General Chemistry', credits: 4, grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0 })
    })
    await act(async () => root.render(<PlannerBoard onComparePlans={() => undefined} />))

    const controls = container.querySelector('.planning-filter-bar')?.textContent ?? ''
    expect(controls).toContain('Current course plan')
    expect(controls).toContain('Program not selected · Catalog not recorded')
    expect(controls).toContain('Export for advisor')
    expect(controls).toContain('•••')
    const orderedLabels = [
      'Current course plan', 'Program not selected · Catalog not recorded', '＋ Add course',
      'Compare plans', 'MCAT · date not recorded', 'Export for advisor', '•••',
    ]
    const positions = orderedLabels.map((label) => controls.indexOf(label))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))

    const context = container.querySelector('.planning-context-bar')?.textContent ?? ''
    expect(context).toContain('Major / programChoose a major')
    expect(context).toContain('Catalog + cohortSet by major selection')
    expect(context).toContain('Premed / MCATDate not recorded')
    expect(context).toContain('Prior creditNot recorded')
    const priorCredit = container.querySelector<HTMLAnchorElement>('.planning-context-field[data-action="true"]')
    expect(priorCredit?.getAttribute('href')).toContain('tab=archive')
    expect(priorCredit?.getAttribute('href')).toContain('transcript=intake')
    expect(context).toContain('InterestsNot recorded')
    expect(context).not.toContain('Requirement mapSelect a program first')
  })

  it('opens saved-plan comparison from the primary plan control', async () => {
    useStore.getState().update((draft) => {
      draft.courses = [{ id: 'chem', term: 'Fall 2026', code: 'CHEM 101', title: 'General Chemistry', credits: 4, grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0 }]
    })
    const onComparePlans = vi.fn()
    await act(async () => root.render(<PlannerBoard onComparePlans={onComparePlans} />))
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label^="Open saved plans for"]')!.click())
    expect(onComparePlans).toHaveBeenCalledOnce()
  })

  it('routes prior credit from the empty Planner to Grades-owned transcript intake', async () => {
    await act(async () => root.render(<MemoryRouter><PlanningColdStart currentTerm="Fall 2026" /></MemoryRouter>))
    const priorCredit = [...container.querySelectorAll<HTMLAnchorElement>('a')].find((link) => link.textContent?.includes('Prior credit'))!
    expect(priorCredit.getAttribute('href')).toContain('tab=archive')
    expect(priorCredit.getAttribute('href')).toContain('transcript=intake')
  })
})

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { planningProgramLabel, RequirementsAudit } from './RequirementsAudit'
import { candidatePlanCoverage, planningRequirementSet, UNC_PLANNING_LIBRARY } from '@/lib/academics/uncPlanningLibrary'
import { createInitialDataForMode, CURRENT_STORE_VERSION, STORAGE_KEY, useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function selectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  setter?.call(select, value)
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('Requirements Audit planning library', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    useStore.getState().update((draft) => {
      draft.courses.push({ id: 'n175', term: 'Fall 2026', code: 'NSCI 175', title: 'Introduction to Neuroscience', credits: 3, grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0 })
    })
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

  async function render(entry = '/academics?mode=planning&tab=tracker') {
    await act(async () => root.render(<MemoryRouter initialEntries={[entry]}><RequirementsAudit /></MemoryRouter>))
  }

  it('renders safely from the requirement-map view without assuming a program', async () => {
    await render()
    expect(container.textContent).toContain('Requirement map')
    expect(container.textContent).toContain('Choose a program and track')
    expect(container.textContent).toContain('No program is assumed')
    expect(container.textContent).toContain('Official audit · unconfigured')
  })

  it('sorts distinct degree and track records by their student-facing label', async () => {
    await render()
    const labels = [...(container.querySelector('select') as HTMLSelectElement).options].slice(1).map((option) => option.text)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)))
    expect(labels).toHaveLength(UNC_PLANNING_LIBRARY.length)
    expect(labels).toContain(planningProgramLabel(UNC_PLANNING_LIBRARY.find((set) => set.id === 'physics-bs-standard')!))
    expect(labels).toContain(planningProgramLabel(UNC_PLANNING_LIBRARY.find((set) => set.id === 'physics-bs-astrophysics')!))
  })

  it('does not crash when a legacy hydrated payload omitted Class Center', async () => {
    useStore.getState().update((draft) => { draft.academics.classCenter = undefined as never })
    await render()
    expect(container.textContent).toContain('No program is assumed')
    const select = container.querySelector('select') as HTMLSelectElement
    await act(async () => selectValue(select, 'neuroscience-bs'))
    expect(useStore.getState().academics.classCenter.planningProgramContext.selectedProgramId).toBe('neuroscience-bs')
  })

  it('persists a selected program and presents candidate evidence rather than completion', async () => {
    await render()
    const select = container.querySelector('select') as HTMLSelectElement
    await act(async () => selectValue(select, 'neuroscience-bs'))

    expect(useStore.getState().academics.classCenter.planningProgramContext.selectedProgramId).toBe('neuroscience-bs')
    expect(container.textContent).toContain('Course recorded')
    expect(container.textContent).toContain('not official fulfillment')
    expect(container.textContent).toContain('Manual review')
    expect(container.textContent).toContain('Manual review needed')
  })

  it('restores the selected program and the same derived coverage counts after hydration', async () => {
    await render()
    const select = container.querySelector('select') as HTMLSelectElement
    await act(async () => selectValue(select, 'neuroscience-bs'))

    const requirementSet = planningRequirementSet('neuroscience-bs')!
    const courseCodes = useStore.getState().courses.map((course) => course.code)
    const before = candidatePlanCoverage(requirementSet, courseCodes).map((item) => item.state)
    expect(before.filter((state) => state === 'scheduled')).toHaveLength(1)

    const partialize = useStore.persist.getOptions().partialize!
    const persisted = partialize(useStore.getState())
    useStore.getState().replaceAll(createInitialDataForMode(false))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: persisted, version: CURRENT_STORE_VERSION }))
    await act(async () => { await useStore.persist.rehydrate() })

    expect(useStore.getState().academics.classCenter.planningProgramContext.selectedProgramId).toBe('neuroscience-bs')
    const restoredCodes = useStore.getState().courses.map((course) => course.code)
    expect(candidatePlanCoverage(requirementSet, restoredCodes).map((item) => item.state)).toEqual(before)
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('neuroscience-bs')
  })

  it('collects Gillings admission context only for an admission-gated B.S.P.H. record', async () => {
    await render()
    const select = container.querySelector('select') as HTMLSelectElement
    await act(async () => selectValue(select, 'biostatistics-bsph'))

    expect(container.textContent).toContain('Gillings admission term (as recorded)')
    expect(container.textContent).toContain('Limited Gillings admission')
  })

  it('keeps the all-requirements and prior-credit subviews reachable', async () => {
    await render('/academics?mode=planning&tab=tracker&requirementsView=requirements')
    expect(container.textContent).toContain('Catalog evidence')
    await act(async () => {
      ;[...container.querySelectorAll('button')].find((button) => button.textContent === 'Prior credit')?.click()
    })
    expect(container.textContent).toContain('Exact transcript fields stay separate from planning labels')
  })

  it('stores prior credit only in Grades and Archive without creating a Planner course or semester', async () => {
    await render('/academics?mode=planning&tab=tracker&requirementsView=prior-credit')
    await act(async () => {
      ;[...container.querySelectorAll('button')].find((button) => /Add prior credit/.test(button.textContent || ''))!.click()
    })
    const setInput = (placeholder: string, value: string) => {
      const input = [...container.querySelectorAll<HTMLInputElement>('input')].find((item) => item.placeholder === placeholder)!
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await act(async () => {
      setInput('Institution (exact)', 'Wake Tech')
      setInput('Course number (exact)', 'CHM 151')
      setInput('Course title (exact)', 'GENERAL CHEMISTRY I')
      setInput('Term label', 'Spring 2025')
      setInput('Credit hours', '4')
      setInput('Grade as recorded', 'B+')
    })
    await act(async () => {
      ;[...container.querySelectorAll('button')].find((button) => button.textContent === 'Save prior credit')!.click()
    })

    const state = useStore.getState()
    expect(state.courses).toHaveLength(1)
    expect(state.courses.some((course) => /prior credit/i.test(course.term))).toBe(false)
    expect(state.academics.classCenter.plannerTerms.some((term) => /prior credit/i.test(term.label))).toBe(false)
    expect(state.academics.classCenter.transcriptRecords).toHaveLength(1)
    expect(state.academics.classCenter.transcriptRecords[0]).toMatchObject({
      institution: 'Wake Tech',
      courseNumberExact: 'CHM 151',
      courseType: 'transfer',
    })
    expect(state.academics.classCenter.transcriptRecords[0].courseId).toBeUndefined()
  })
})

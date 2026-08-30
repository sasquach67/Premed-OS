import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { GradesArchive } from './GradesArchive'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

describe('Grades & Archive routes', () => {
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

  async function render(entry = '/academics?mode=planning&tab=archive') {
    const courses = useStore.getState().courses
    await act(async () => root.render(<MemoryRouter initialEntries={[entry]}><GradesArchive courses={courses} /></MemoryRouter>))
  }

  function seedRecord() {
    useStore.getState().update((draft) => {
      draft.courses.push({ id: 'bio', term: 'Fall 2026', code: 'BIOL 101', title: 'Biology', credits: 4, grade: 'A-', bcpm: true, status: 'completed', inResidence: true, satisfies: [], order: 0 })
      draft.academics.classCenter.transcriptRecords.push({ id: 'row', courseId: 'bio', institution: 'UNC Chapel Hill', courseNumberExact: 'BIOL 101', titleExact: 'GENERAL BIOLOGY', creditsExact: '4.0', gradeExact: 'A-', term: 'Fall', year: '2026', courseType: 'regular', classificationSource: 'Student-confirmed record', classificationReason: 'Biology', createdAt: 1, updatedAt: 1, order: 0 })
    })
  }

  it('keeps the honest empty state ahead of record tabs and opens transcript intake', async () => {
    await render()
    expect(container.textContent).toContain('Start with one course line')
    expect(container.querySelector('[role="tablist"]')).toBeNull()
    await act(async () => {
      ;[...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Add a transcript record'))?.click()
    })
    expect(container.textContent).toContain('Add coursework')
    expect(container.textContent).toContain('Enter one line manually')
  })

  it('opens transcript intake directly from the Planning prior-credit handoff', async () => {
    await render('/academics?mode=planning&tab=archive&gradeView=ledger&transcript=intake')
    expect(container.textContent).toContain('Bring the transcript in, then check it')
    expect(container.querySelector('.grades-intake-drop')).toBeTruthy()
  })

  it('keeps prior-credit transcript intake open when the ledger already has records', async () => {
    seedRecord()
    await render('/academics?mode=planning&tab=archive&gradeView=ledger&transcript=intake')

    expect(container.textContent).toContain('Bring the transcript in, then check it')
    expect(container.querySelector('.grades-intake-drop')).toBeTruthy()
    expect(container.textContent).toContain('GENERAL BIOLOGY')
  })

  it('keeps Ledger, GPA, and What-if reachable from one populated record', async () => {
    seedRecord()
    await render()
    expect(container.textContent).toContain('GENERAL BIOLOGY')
    expect(container.textContent).toContain('The record')
    expect(container.textContent).toContain('Export transcript')
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Ledger', 'GPA', 'What-if'])
    await act(async () => tabs.find((tab) => tab.textContent === 'GPA')?.click())
    expect(container.textContent).toContain('UNC / in-residence GPA')
    expect(container.textContent).toContain('AMCAS preview')
    expect(container.textContent).toContain('Export GPA report')
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((tab) => tab.textContent === 'What-if')?.click())
    expect(container.textContent).toContain('Assume a grade')
    expect(container.textContent).toContain('Scratch work only')
  })

  it('does not expose the retired forecast-accuracy route from Grades and Archive', async () => {
    seedRecord()
    useStore.getState().update((draft) => {
      draft.academics.classCenter.retrievabilityPredictions = [{
        id: 'legacy-forecast', courseId: 'bio', topicId: 'legacy-topic', reviewEventId: 'legacy-review',
        predictedAt: 1, predictedBand: 'solid', predictedRange: '80–100%', modelVersion: 'fsrs-v1',
        outcome: 'recalled', resolvedAt: 2, order: 0,
      }]
    })
    await render('/academics?mode=planning&tab=archive&gradeView=ledger&forecastAccuracy=1')
    expect(container.textContent).not.toContain('Forecast accuracy')
    expect(container.textContent).toContain('GENERAL BIOLOGY')
  })

  it('mutates and resets What-if scratch rows without changing or persisting coursework', async () => {
    seedRecord()
    useStore.getState().update((draft) => {
      const biology = draft.courses.find((course) => course.id === 'bio')
      if (biology) biology.status = 'in-progress'
    })
    const courseworkBefore = JSON.stringify({ courses: useStore.getState().courses, records: useStore.getState().academics.classCenter.transcriptRecords })
    await render('/academics?mode=planning&tab=archive&gradeView=what-if')

    expect(container.querySelectorAll('.grades-whatif-row')).toHaveLength(1)
    const classHandoff = container.querySelector<HTMLAnchorElement>('a[href*="/academics/classes/bio?classTab=assignments"]')
    expect(classHandoff?.getAttribute('href')).toContain('whatIf=1')
    expect(classHandoff?.textContent).toContain('Open BIOL 101 calculator')
    await act(async () => {
      ;[...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Add assumption'))?.click()
    })
    expect(container.querySelectorAll('.grades-whatif-row')).toHaveLength(2)
    expect(JSON.stringify({ courses: useStore.getState().courses, records: useStore.getState().academics.classCenter.transcriptRecords })).toBe(courseworkBefore)

    await act(async () => {
      ;[...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.trim() === 'Reset')?.click()
    })
    expect(container.querySelectorAll('.grades-whatif-row')).toHaveLength(1)

    await act(async () => root.unmount())
    root = createRoot(container)
    await render('/academics?mode=planning&tab=archive&gradeView=what-if')
    expect(container.querySelectorAll('.grades-whatif-row')).toHaveLength(1)
    expect(JSON.stringify({ courses: useStore.getState().courses, records: useStore.getState().academics.classCenter.transcriptRecords })).toBe(courseworkBefore)
  })

  it('exports the populated ledger as the student-controlled coursework payload', async () => {
    seedRecord()
    let exportedBlob: Blob | undefined
    let downloadedAs = ''
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      if (!(blob instanceof Blob)) throw new Error('Expected a Blob coursework export')
      exportedBlob = blob
      return 'blob:coursework-export'
    })
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedAs = this.download
    })

    await render()
    await act(async () => {
      ;[...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Export transcript'))?.click()
    })

    expect(downloadedAs).toBe('premed-os-coursework.json')
    expect(exportedBlob?.type).toBe('application/json')
    const payloadText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error)
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(exportedBlob!)
    })
    const payload = JSON.parse(payloadText)
    expect(payload.notice).toContain('Not an official transcript')
    expect(payload.coursework[0]).toMatchObject({ institution: 'UNC Chapel Hill', courseNumber: 'BIOL 101', title: 'GENERAL BIOLOGY', credits: '4.0', grade: 'A-' })
    expect(createObjectUrl).toHaveBeenCalledOnce()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:coursework-export')
    anchorClick.mockRestore()
    revokeObjectUrl.mockRestore()
    createObjectUrl.mockRestore()
  })

  it('keeps manual entry open from the populated transcript tools', async () => {
    seedRecord()
    await render()
    await act(async () => {
      ;[...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Transcript record tools'))?.click()
    })
    await act(async () => {
      ;[...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Import a transcript'))?.click()
    })
    await act(async () => {
      ;[...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Enter one line manually'))?.click()
    })
    expect(container.textContent).toContain('Add transcript record')
    expect(container.querySelector('input[placeholder="Institution (exact)"]')).toBeTruthy()
  })

  it('opens saved term reports without exposing the retired forecast surface', async () => {
    seedRecord()
    useStore.getState().update((draft) => {
      draft.academics.classCenter.termReports.push({
        id: 'report', term: 'Fall 2026', courseIds: ['bio'], status: 'ready', selectedFileIds: [],
        snapshot: { term: 'Fall 2026', courseIds: ['bio'], compiledAt: 1, evidenceLimit: 'Only saved local records are included.', facts: [] },
        blocks: [{ id: 'limit', kind: 'limit', title: 'Boundary', text: 'Only saved local records are included.', evidenceIds: [], source: 'deterministic' }],
        createdAt: 1, updatedAt: 1, order: 0,
      })
    })
    await render()
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Term reports'))?.click())
    expect(container.textContent).toContain('End-of-term record')
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.includes('Grades ledger'))?.click())
    expect(container.textContent).not.toContain('Forecast accuracy')
  })
})

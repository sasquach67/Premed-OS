import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranscriptRecordsPanel } from './TranscriptRecordsPanel'
import { createInitialDataForMode, useStore } from '@/store/store'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

/**
 * WHY THIS EXISTS: manual transcript entry required a Course to already exist,
 * so on an empty store the save button was permanently disabled — prior credit
 * could never be entered at all, because the only way to add a course was to
 * have one.
 */
describe('manual transcript entry on an empty store', () => {
  let container: HTMLDivElement
  let root: Root

  const setInput = (ph: string, value: string) => {
    const el = [...container.querySelectorAll('input')].find((i) => i.placeholder === ph)!
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  beforeEach(async () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    useStore.getState().update((d) => { d.courses = [] })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => { root.render(<TranscriptRecordsPanel courses={[]} entryOnly />) })
  })

  afterEach(async () => { await act(async () => root.unmount()); container.remove() })

  it('saves the line and records the course it evidences', async () => {
    expect(useStore.getState().courses).toHaveLength(0)
    await act(async () => {
      setInput('Institution (exact)', 'Wake Tech')
      setInput('Course number (exact)', 'CHM 151')
      setInput('Course title (exact)', 'GENERAL CHEMISTRY I')
      setInput('Credits (exact)', '4')
      setInput('Grade (exact)', 'B+')
    })
    const save = [...container.querySelectorAll('button')].find((b) => /Save transcript record/.test(b.textContent || ''))!
    expect(save.disabled).toBe(false)
    await act(async () => { save.click() })

    const state = useStore.getState()
    expect(state.courses.map((c) => c.code)).toEqual(['CHM 151'])
    const [record] = state.academics.classCenter.transcriptRecords
    // Exact strings, including the all-caps registrar title.
    expect(record).toMatchObject({ institution: 'Wake Tech', courseNumberExact: 'CHM 151', titleExact: 'GENERAL CHEMISTRY I', creditsExact: '4', gradeExact: 'B+' })
    expect(record.courseId).toBe(state.courses[0].id)
  })

  it('offers a real attach control for transcript-line evidence', () => {
    // The picker could only choose an already-existing file, so a student
    // holding a photo of the line had no way to attach it from this flow.
    const attach = [...container.querySelectorAll('button')].find((b) => /Attach/.test(b.textContent || ''))
    expect(attach).toBeTruthy()
    const input = [...container.querySelectorAll('input')].find((i) => /transcript-line image/i.test(i.getAttribute('aria-label') || ''))
    expect(input?.getAttribute('accept')).toContain('image/')
    expect(input?.getAttribute('accept')).toContain('application/pdf')
  })

  it('links an existing course instead of creating a duplicate', async () => {
    useStore.getState().update((d) => {
      d.courses = [{ id: 'existing', term: 'Fall 2025', code: 'CHM 151', title: 'Gen Chem', credits: 4, grade: '', bcpm: false, status: 'completed', inResidence: false, satisfies: [], order: 0 }]
    })
    await act(async () => {
      setInput('Institution (exact)', 'Wake Tech')
      setInput('Course number (exact)', 'chm 151')
      setInput('Course title (exact)', 'GENERAL CHEMISTRY I')
    })
    await act(async () => {
      [...container.querySelectorAll('button')].find((b) => /Save transcript record/.test(b.textContent || ''))!.click()
    })
    const state = useStore.getState()
    expect(state.courses).toHaveLength(1)
    expect(state.academics.classCenter.transcriptRecords[0].courseId).toBe('existing')
  })
})

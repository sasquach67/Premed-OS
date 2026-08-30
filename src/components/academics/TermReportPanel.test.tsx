import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/common/ToastProvider'
import { createInitialDataForMode, useStore } from '@/store/store'
import { createTermReport } from '@/lib/academics/termReport'
import type { Course } from '@/lib/types'
import { TermReportPanel } from './TermReportPanel'

const termReportMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/intelligence/studyTools', () => ({
  studyTools: { termReport: termReportMock },
  acceptStudySourceDisclosure: vi.fn(),
  hasAcceptedStudySourceDisclosure: () => true,
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))

const course: Course = {
  id: 'chem', term: 'Fall 2026', code: 'CHEM 262', title: 'Organic Chemistry II', credits: 3,
  grade: 'B+', bcpm: true, status: 'completed', inResidence: true, satisfies: [], order: 0,
}

function button(label: string) {
  return [...document.body.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.textContent?.includes(label))
}

describe('Term Report generation reliability', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    termReportMock.mockReset()
    const data = createInitialDataForMode(false)
    data.courses.push(course)
    data.academics.classCenter.mistakes.push({ id: 'mistake', courseId: course.id, label: 'Mechanism step', createdAt: 1, updatedAt: 1, order: 0 })
    data.academics.classCenter.termReports.push(createTermReport({
      id: 'report',
      input: { courses: data.courses, center: data.academics.classCenter, term: course.term, now: 100 },
      order: 0,
    }))
    useStore.getState().replaceAll(data)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    document.body.querySelectorAll('[data-radix-portal]').forEach((element) => element.remove())
    useStore.getState().replaceAll(createInitialDataForMode(false))
  })

  it('prevents duplicate generation, records a thrown failure, clears busy, and allows a successful retry', async () => {
    let rejectRequest!: (error: Error) => void
    termReportMock.mockImplementationOnce(() => new Promise((_, reject) => { rejectRequest = reject }))
    await act(async () => root.render(<ToastProvider><TermReportPanel focusReportId="report" /></ToastProvider>))

    await act(async () => button('Generate observations')?.click())
    const generate = button('Generate report')!
    await act(async () => {
      generate.click()
      generate.click()
    })
    expect(termReportMock).toHaveBeenCalledOnce()
    expect(button('Generating…')?.disabled).toBe(true)

    await act(async () => {
      rejectRequest(new Error('Term report service disconnected.'))
      await Promise.resolve()
    })
    expect(button('Generate report')?.disabled).toBe(false)
    expect(useStore.getState().academics.classCenter.termReports[0]).toEqual(expect.objectContaining({
      status: 'unavailable',
      providerMessage: 'Term report service disconnected.',
    }))
    expect(document.body.textContent).toContain('Term report service disconnected.')

    termReportMock.mockResolvedValueOnce({
      ok: true,
      data: {
        artifact: {
          takeaways: [
            { title: 'Returned-work record', text: 'You saved one trouble spot from CHEM 262 returned work.', evidenceIds: ['mistake:chem'] },
            { title: 'Course record', text: 'Your saved CHEM 262 record includes a final grade.', evidenceIds: ['course:chem'] },
          ],
          experiments: [{ title: 'Try next term', text: 'Try a short returned-work check before reopening notes.', evidenceIds: ['mistake:chem'] }],
          limit: 'This report reads only the records you saved.',
        },
        citations: [],
      },
    })
    await act(async () => button('Generate report')?.click())
    expect(termReportMock).toHaveBeenCalledTimes(2)
    expect(useStore.getState().academics.classCenter.termReports).toHaveLength(2)
    expect(useStore.getState().academics.classCenter.termReports[1].status).toBe('ready')
  })
})

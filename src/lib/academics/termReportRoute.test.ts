import { describe, expect, it } from 'vitest'
import { isSavedTermReportId, termReportRoute } from '@/lib/academics/termReportRoute'

describe('term report routes', () => {
  it('keeps a report as contextual Ledger state and safely encodes its id', () => {
    expect(termReportRoute('fall/2026')).toBe('/academics?mode=planning&tab=archive&gradeView=ledger&termReport=fall%2F2026')
  })

  it('does not substitute a different saved report for an unknown id', () => {
    const reports = [{ id: 'fall' }, { id: 'spring' }]
    expect(isSavedTermReportId('fall', reports)).toBe(true)
    expect(isSavedTermReportId('missing', reports)).toBe(false)
    expect(isSavedTermReportId(null, reports)).toBe(false)
  })
})

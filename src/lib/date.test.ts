import { afterEach, describe, expect, it, vi } from 'vitest'
import { daysUntil, fmtDeadline, fmtEventDate, fmtRecordedDate } from '@/lib/date'

describe('contextual date labels', () => {
  afterEach(() => vi.useRealTimers())

  it('keeps date-only values on the student’s local calendar day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 17, 12))

    expect(daysUntil('2026-08-17')).toBe(0)
    expect(fmtDeadline('2026-08-17')).toBe('Due today')
    expect(fmtDeadline('2026-08-19')).toBe('Due in 2 days')
    expect(fmtDeadline('2026-08-16')).toBe('Overdue by 1 day')
  })

  it('does not call events or logged records due', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 17, 12))

    expect(fmtEventDate('2026-08-17')).toBe('Today')
    expect(fmtEventDate('2026-08-18')).toBe('Tomorrow')
    expect(fmtEventDate('2026-08-20')).toBe('In 3 days')
    expect(fmtRecordedDate('2026-08-16')).toBe('Recorded yesterday')
    expect(fmtRecordedDate('2026-08-13')).toBe('Recorded 4 days ago')
  })

  it('gives an honest empty label for each date meaning', () => {
    expect(fmtDeadline()).toBe('No due date')
    expect(fmtEventDate()).toBe('Date TBD')
    expect(fmtRecordedDate()).toBe('No date recorded')
  })
})

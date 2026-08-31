import { describe, expect, it } from 'vitest'
import { readingTaskDueDate } from '@/lib/academics/readingSchedule'

describe('reading task scheduling', () => {
  it('places a before-class reading on the preceding calendar day', () => {
    expect(readingTaskDueDate('2026-08-20')).toBe('2026-08-19')
  })

  it('crosses month and year boundaries without a timezone shift', () => {
    expect(readingTaskDueDate('2026-03-01')).toBe('2026-02-28')
    expect(readingTaskDueDate('2027-01-01')).toBe('2026-12-31')
  })

  it('leaves missing or non-calendar source dates unchanged', () => {
    expect(readingTaskDueDate()).toBeUndefined()
    expect(readingTaskDueDate('Week 3')).toBe('Week 3')
  })
})

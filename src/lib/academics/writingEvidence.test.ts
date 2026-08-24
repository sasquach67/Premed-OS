import { describe, expect, it } from 'vitest'
import type { AssignedReading, FeedbackNote } from '@/lib/types'
import { readingDebt, recurringFeedbackThemes } from './writingEvidence'

const reading = (overrides: Partial<AssignedReading> = {}): AssignedReading => ({
  id: 'reading-1', courseId: 'course', week: 'Week 1', title: 'Chapter 1', status: 'not-started', dueForDiscussion: '2026-08-20', createdAt: 1, updatedAt: 1, order: 0, ...overrides,
})
const note = (overrides: Partial<FeedbackNote> = {}): FeedbackNote => ({
  id: 'note-1', courseId: 'course', theme: 'Clarify thesis', createdAt: 1, updatedAt: 1, order: 0, ...overrides,
})

describe('writing evidence boundaries', () => {
  it('never calculates reading debt without a complete student-confirmed list', () => {
    const rows = [reading()]
    expect(readingDebt(rows, 'unknown', '2026-08-23')).toBe(0)
    expect(readingDebt(rows, 'partial', '2026-08-23')).toBe(0)
    expect(readingDebt(rows, 'not-applicable', '2026-08-23')).toBe(0)
    expect(readingDebt(rows, 'complete', '2026-08-23')).toBe(1)
  })

  it('surfaces only repeated exact normalized feedback themes', () => {
    expect(recurringFeedbackThemes([note()])).toEqual([])
    expect(recurringFeedbackThemes([
      note({ id: 'one', theme: 'Clarify   thesis', assignmentId: 'paper-1' }),
      note({ id: 'two', theme: ' clarify thesis ', assignmentId: 'paper-2' }),
      note({ id: 'three', theme: 'Clarify thesis earlier', assignmentId: 'paper-3' }),
    ])).toEqual([expect.objectContaining({
      label: 'Clarify   thesis',
      paperIds: ['paper-1', 'paper-2'],
      notes: [expect.objectContaining({ id: 'one' }), expect.objectContaining({ id: 'two' })],
    })])
  })
})

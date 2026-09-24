import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { hasLocalWork, localCounts, localWorkSince } from './publicLayer'

describe('record-based guest work detection', () => {
  it('detects a zero-hour-only log without counting legacy aggregate hours', () => {
    const data = createPersonalInitialData()
    expect(hasLocalWork(data)).toBe(false)
    data.experienceHourEntries = [{ id: 'zero', experienceId: 'preserved-parent', kind: 'logged', date: '2026-09-24', hours: 0, note: 'Observed', thoughts: 'Ask next time', createdAt: 1, updatedAt: 1, archived: false, order: 0 }]
    expect(hasLocalWork(data)).toBe(true)
    expect(localCounts(data)).toEqual([{ key: 'hourEntries', label: 'Hour and log entries', value: 1, tint: 'var(--cat-clinical)' }])
    expect(localWorkSince(data)).toBeDefined()
  })
  it.each(['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships', 'notePages'] as const)('detects %s-only work, including preserved historical data', (key) => {
    const data = createPersonalInitialData()
    Object.assign(data, { [key]: [{ id: 'record', createdAt: 1, deletedAt: 2 }] })
    expect(hasLocalWork(data)).toBe(true)
  })
})

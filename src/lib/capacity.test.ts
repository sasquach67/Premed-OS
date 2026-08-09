import { describe, expect, it } from 'vitest'
import type { WeeklyCapacity } from '@/lib/types'
import {
  allocate,
  assessCapacity,
  availableHours,
  oversubscriptionMessage,
  slackHours,
  type CapacityClaim,
} from './capacity'

/** 2026-08-09 is a Sunday, matching hoursByWeekday's Sunday-first order. */
const WEEK = '2026-08-09'

function capacity(overrides: Partial<WeeklyCapacity> = {}): WeeklyCapacity {
  return {
    hoursByWeekday: [4, 3, 3, 3, 3, 2, 4], // 22h
    busyPeriods: [],
    updatedAt: 1_700_000_000_000,
    ...overrides,
  }
}

const uncaptured: WeeklyCapacity = { hoursByWeekday: [0, 0, 0, 0, 0, 0, 0], busyPeriods: [], updatedAt: 0 }

describe('availableHours', () => {
  it('sums the ordinary week', () => {
    expect(availableHours(capacity(), WEEK)).toBe(22)
  })

  it('substitutes a busy period rather than subtracting it', () => {
    // Finals covers Mon–Fri at 1h/day. Those weekdays were 3,3,3,3,2 = 14,
    // replaced by 5 — so the week is 22 - 14 + 5 = 13, not 22 - 5.
    const finals = capacity({
      busyPeriods: [{ id: 'f', label: 'Finals', startDate: '2026-08-10', endDate: '2026-08-14', hoursOverride: 1 }],
    })
    expect(availableHours(finals, WEEK)).toBe(13)
  })

  it('treats a zero-hour busy period as a genuinely blank stretch', () => {
    const travel = capacity({
      busyPeriods: [{ id: 't', label: 'Travel', startDate: '2026-08-09', endDate: '2026-08-15', hoursOverride: 0 }],
    })
    expect(availableHours(travel, WEEK)).toBe(0)
  })
})

describe('slackHours', () => {
  it('reserves one typical day, not a fixed number', () => {
    expect(slackHours(capacity())).toBe(3.25) // 22 / 7 active days
  })

  it('reserves a heavy day for someone with few heavy days', () => {
    expect(slackHours(capacity({ hoursByWeekday: [0, 0, 8, 0, 8, 0, 0] }))).toBe(8)
  })

  it('is zero when there is no week to reserve from', () => {
    expect(slackHours(uncaptured)).toBe(0)
  })
})

describe('assessCapacity', () => {
  const claims: CapacityClaim[] = [
    { tab: 'academics', kind: 'Review queue', hoursPerWeek: 6 },
    { tab: 'mcat', kind: 'Study sessions', hoursPerWeek: 8 },
  ]

  it('reports un-captured rather than zero — nobody has been asked', () => {
    const result = assessCapacity(uncaptured, claims, WEEK)
    expect(result.captured).toBe(false)
    // Critically NOT flagged as oversubscribed: that would tell a student with
    // no recorded hours that their plan does not fit, which is a lie.
    expect(result.oversubscribed).toBe(false)
    expect(result.shortfall).toBe(0)
  })

  it('holds slack back from both tabs, not from one', () => {
    const result = assessCapacity(capacity(), claims, WEEK)
    expect(result.available).toBe(22)
    expect(result.slack).toBe(3.25)
    expect(result.allocatable).toBe(18.75)
  })

  it('detects the collision the section exists to prevent', () => {
    // Two independently reasonable plans that cannot both happen.
    const heavy: CapacityClaim[] = [
      { tab: 'academics', kind: 'Exam prep', hoursPerWeek: 20 },
      { tab: 'mcat', kind: 'Full lengths', hoursPerWeek: 14 },
    ]
    const result = assessCapacity(capacity(), heavy, WEEK)
    expect(result.claimed).toBe(34)
    expect(result.oversubscribed).toBe(true)
    expect(result.shortfall).toBe(15.25)
  })

  it('is not oversubscribed when the claims fit', () => {
    const result = assessCapacity(capacity(), claims, WEEK)
    expect(result.claimed).toBe(14)
    expect(result.oversubscribed).toBe(false)
  })
})

describe('oversubscriptionMessage', () => {
  it('states the arithmetic and passes no judgement', () => {
    const heavy: CapacityClaim[] = [
      { tab: 'academics', kind: 'Exam prep', hoursPerWeek: 20 },
      { tab: 'mcat', kind: 'Full lengths', hoursPerWeek: 14 },
    ]
    const message = oversubscriptionMessage(assessCapacity(capacity(), heavy, WEEK))
    expect(message).toBe('This plan needs 34h a week and you have 18.8h.')
    expect(message).not.toMatch(/should|behind|failing|need to/i)
  })

  it('says nothing when the plan fits', () => {
    const result = assessCapacity(capacity(), [{ tab: 'mcat', kind: 'CARS', hoursPerWeek: 2 }], WEEK)
    expect(oversubscriptionMessage(result)).toBeNull()
  })

  it('says nothing when nobody has been asked', () => {
    const result = assessCapacity(uncaptured, [{ tab: 'mcat', kind: 'CARS', hoursPerWeek: 40 }], WEEK)
    expect(oversubscriptionMessage(result)).toBeNull()
  })
})

describe('allocate', () => {
  const both: CapacityClaim[] = [
    { tab: 'academics', kind: 'Exam prep', hoursPerWeek: 20 },
    { tab: 'mcat', kind: 'Study', hoursPerWeek: 20 },
  ]

  it('works with one tab only — nothing changes for a non-MCAT student', () => {
    const result = assessCapacity(capacity(), [{ tab: 'academics', kind: 'Review', hoursPerWeek: 6 }], WEEK)
    expect(allocate(result)).toEqual({ academics: 6, mcat: 0 })
  })

  it('gives Academics precedence during an exam week', () => {
    const result = assessCapacity(capacity(), both, WEEK)
    expect(allocate(result, { examWeek: true })).toEqual({ academics: 18.75, mcat: 0 })
  })

  it('gives MCAT precedence during dedicated study', () => {
    const result = assessCapacity(capacity(), both, WEEK)
    expect(allocate(result, { dedicatedStudy: true })).toEqual({ academics: 0, mcat: 18.75 })
  })

  it('otherwise splits toward the nearer deadline', () => {
    const result = assessCapacity(capacity(), both, WEEK)
    const split = allocate(result, { daysToDeadline: { academics: 5, mcat: 60 } })
    expect(split.academics).toBeGreaterThan(split.mcat)
    expect(split.academics + split.mcat).toBe(18.75)
  })

  it('honours a student override and never exceeds the pool', () => {
    const result = assessCapacity(capacity(), both, WEEK)
    expect(allocate(result, { override: { academics: 15 } })).toEqual({ academics: 15, mcat: 3.75 })
    expect(allocate(result, { override: { academics: 999 } })).toEqual({ academics: 18.75, mcat: 0 })
  })

  it('allocates nothing from an empty pool', () => {
    const result = assessCapacity(uncaptured, both, WEEK)
    expect(allocate(result)).toEqual({ academics: 0, mcat: 0 })
  })
})

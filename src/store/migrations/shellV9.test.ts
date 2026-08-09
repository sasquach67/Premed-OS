import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import type { AppData, WeeklyCapacity } from '@/lib/types'
import {
  emptyWeeklyCapacity,
  isCapacityCaptured,
  migrateShellV9,
  weeklyCapacityTotal,
} from './shellV9'

function without(capacity?: Partial<WeeklyCapacity>): AppData {
  const base = createSeedData()
  const settings = { ...base.settings } as Record<string, unknown>
  if (capacity === undefined) delete settings.weeklyCapacity
  else settings.weeklyCapacity = capacity
  return { ...base, settings } as unknown as AppData
}

describe('shell v9 — weekly capacity', () => {
  it('adds an un-captured pool to a workspace that has none', () => {
    const migrated = migrateShellV9(without())
    expect(migrated.settings.weeklyCapacity).toEqual({
      hoursByWeekday: [0, 0, 0, 0, 0, 0, 0],
      busyPeriods: [],
      updatedAt: 0,
    })
  })

  it('does not invent a plausible week', () => {
    // The whole point of 00 §11b is that a generator must never plan against
    // hours the student never gave. A seeded default would silently defeat it.
    const migrated = migrateShellV9(without())
    expect(isCapacityCaptured(migrated.settings.weeklyCapacity)).toBe(false)
    expect(weeklyCapacityTotal(migrated.settings.weeklyCapacity)).toBe(0)
  })

  it('leaves a captured pool untouched', () => {
    const captured: WeeklyCapacity = {
      hoursByWeekday: [2, 3, 3, 3, 3, 1, 4],
      busyPeriods: [{ id: 'finals', label: 'Finals', startDate: '2026-12-07', endDate: '2026-12-15', hoursOverride: 8 }],
      updatedAt: 1_700_000_000_000,
    }
    const migrated = migrateShellV9(without(captured))
    expect(migrated.settings.weeklyCapacity).toEqual(captured)
    expect(isCapacityCaptured(migrated.settings.weeklyCapacity)).toBe(true)
    expect(weeklyCapacityTotal(migrated.settings.weeklyCapacity)).toBe(19)
  })

  it('repairs a partial write without discarding what was there', () => {
    const partial = { hoursByWeekday: [3, 3], updatedAt: 42 } as unknown as WeeklyCapacity
    const migrated = migrateShellV9(without(partial))
    expect(migrated.settings.weeklyCapacity.hoursByWeekday).toEqual([3, 3, 0, 0, 0, 0, 0])
    // The timestamp is real history — a repair must not reset it to "never asked".
    expect(migrated.settings.weeklyCapacity.updatedAt).toBe(42)
    expect(migrated.settings.weeklyCapacity.busyPeriods).toEqual([])
  })

  it('coerces junk to zero rather than propagating NaN into a plan', () => {
    const junk = { hoursByWeekday: ['x', -4, null, 5, Infinity, undefined, 2], updatedAt: 1 } as unknown as WeeklyCapacity
    const migrated = migrateShellV9(without(junk))
    expect(migrated.settings.weeklyCapacity.hoursByWeekday).toEqual([0, 0, 0, 5, 0, 0, 2])
  })

  it('is idempotent', () => {
    const once = migrateShellV9(without())
    const twice = migrateShellV9(once)
    expect(twice.settings.weeklyCapacity).toEqual(once.settings.weeklyCapacity)
  })

  it('never mutates its input — the store hydrates from frozen state', () => {
    const input = without()
    Object.freeze(input)
    Object.freeze(input.settings)
    expect(() => migrateShellV9(input)).not.toThrow()
    expect('weeklyCapacity' in input.settings).toBe(false)
  })

  it('emptyWeeklyCapacity is not shared between callers', () => {
    const a = emptyWeeklyCapacity()
    a.busyPeriods.push({ id: 'x', label: 'x', startDate: '', endDate: '', hoursOverride: 0 })
    expect(emptyWeeklyCapacity().busyPeriods).toHaveLength(0)
  })
})

/* v9 — `settings.weeklyCapacity`, the shell-owned hour pool (`00` §11b).
 *
 * Additive and lossless: it introduces a field, reads nothing, and destroys
 * nothing. Re-running it on migrated data is a no-op.
 *
 * The one judgement call is what an un-captured pool looks like, and the spec
 * settles it: capacity is "captured once at first setup", and generators must
 * "check before generating, not after" — so a workspace that has never been
 * asked must be *visibly* un-captured, not quietly seeded with a plausible
 * week. A fabricated 20h/week would let a generator emit a plan built on a
 * number the student never gave, which is the exact failure §11b exists to
 * prevent. `updatedAt: 0` is therefore the signal for "ask first", and every
 * consumer is expected to branch on it.
 *
 * Pure: never writes to `data` (state may be frozen by immer).
 */
import type { AppData, WeeklyCapacity } from '@/lib/types'

/** Seven zeroes and no timestamp — "nobody has been asked yet", not "the
 *  student has no time". Consumers must distinguish those. */
export function emptyWeeklyCapacity(): WeeklyCapacity {
  return { hoursByWeekday: [0, 0, 0, 0, 0, 0, 0], busyPeriods: [], updatedAt: 0 }
}

/** True once the student has actually answered. Generators call this before
 *  producing a plan, per §11b — never assume a default. */
export function isCapacityCaptured(capacity?: WeeklyCapacity): boolean {
  return Boolean(capacity && capacity.updatedAt > 0)
}

/** Total hours in an ordinary week, ignoring busy-period exceptions. */
export function weeklyCapacityTotal(capacity: WeeklyCapacity): number {
  return capacity.hoursByWeekday.reduce((sum, hours) => sum + (hours || 0), 0)
}

export function migrateShellV9(data: AppData): AppData {
  const existing = data.settings?.weeklyCapacity
  // Length alone is not validity: a seven-entry array of NaN/Infinity/strings
  // would pass straight through and reach a plan generator, where it becomes a
  // NaN total rather than an obvious error. Only skip when every entry is a
  // usable number.
  if (existing && Array.isArray(existing.busyPeriods) && isUsableWeek(existing.hoursByWeekday)) {
    return data
  }

  // Preserve anything a partial write left behind rather than replacing it.
  const capacity: WeeklyCapacity = {
    ...emptyWeeklyCapacity(),
    ...(existing ?? {}),
    hoursByWeekday: normalizeWeek(existing?.hoursByWeekday),
    busyPeriods: Array.isArray(existing?.busyPeriods) ? existing.busyPeriods : [],
  }

  return { ...data, settings: { ...data.settings, weeklyCapacity: capacity } }
}

/** Seven entries, each a finite number at or above zero. */
function isUsableWeek(input: unknown): input is WeeklyCapacity['hoursByWeekday'] {
  return Array.isArray(input)
    && input.length === 7
    && input.every((hours) => typeof hours === 'number' && Number.isFinite(hours) && hours >= 0)
}

/** Coerce whatever is there into exactly seven finite, non-negative numbers. */
function normalizeWeek(input: unknown): WeeklyCapacity['hoursByWeekday'] {
  const source = Array.isArray(input) ? input : []
  const week = [0, 0, 0, 0, 0, 0, 0] as WeeklyCapacity['hoursByWeekday']
  for (let day = 0; day < 7; day += 1) {
    const value = Number(source[day])
    week[day] = Number.isFinite(value) && value > 0 ? value : 0
  }
  return week
}

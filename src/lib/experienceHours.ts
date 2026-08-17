import type { CollectionRecord, ExperienceCategory, ExperienceEntry, ExperienceHourEntry } from '@/lib/types'

export interface ExperienceHourTotals {
  total: number
  logged: number
  estimated: number
}

export interface HourPaceProjection {
  observationStart: string
  observationEnd: string
  loggedHours: number
  weeklyRate: number
  remainingHours: number
  /** Visible separately whenever an estimate contributes to remaining work. */
  estimatedHours: number
  projectedDate: string
}

function isIsoDay(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()))
}

function activeEntries(entries: CollectionRecord<ExperienceHourEntry>[]) {
  return entries.filter((entry) => !entry.deletedAt && !entry.archived && Number.isFinite(entry.hours) && entry.hours > 0)
}

export function totalsForExperience(
  entries: CollectionRecord<ExperienceHourEntry>[],
  experienceId: string,
): ExperienceHourTotals {
  return activeEntries(entries)
    .filter((entry) => entry.experienceId === experienceId)
    .reduce<ExperienceHourTotals>((totals, entry) => ({
      total: totals.total + entry.hours,
      logged: totals.logged + (entry.kind === 'logged' ? entry.hours : 0),
      estimated: totals.estimated + (entry.kind === 'estimated' ? entry.hours : 0),
    }), { total: 0, logged: 0, estimated: 0 })
}

export function totalsForCategory(
  experiences: CollectionRecord<ExperienceEntry>[],
  entries: CollectionRecord<ExperienceHourEntry>[],
  category: ExperienceCategory,
): ExperienceHourTotals {
  const ids = new Set(experiences.filter((entry) => !entry.deletedAt && entry.category === category).map((entry) => entry.id))
  return activeEntries(entries)
    .filter((entry) => ids.has(entry.experienceId))
    .reduce<ExperienceHourTotals>((totals, entry) => ({
      total: totals.total + entry.hours,
      logged: totals.logged + (entry.kind === 'logged' ? entry.hours : 0),
      estimated: totals.estimated + (entry.kind === 'estimated' ? entry.hours : 0),
    }), { total: 0, logged: 0, estimated: 0 })
}

/**
 * Deterministic arithmetic over student-supplied, dated logs only. Two distinct
 * log dates are the irreducible observation window; without them there is no
 * rate to calculate, so the caller receives null rather than a guess.
 */
export function hourPaceProjection(
  experiences: CollectionRecord<ExperienceEntry>[],
  entries: CollectionRecord<ExperienceHourEntry>[],
  category: ExperienceCategory,
  goal: number | undefined,
  now = new Date(),
): HourPaceProjection | null {
  if (!(goal && goal > 0)) return null
  const ids = new Set(experiences.filter((entry) => !entry.deletedAt && entry.category === category).map((entry) => entry.id))
  const logged = activeEntries(entries)
    .filter((entry) => entry.kind === 'logged' && ids.has(entry.experienceId) && isIsoDay(entry.date))
    .sort((a, b) => a.date!.localeCompare(b.date!))
  const dates = [...new Set(logged.map((entry) => entry.date!))]
  if (dates.length < 2) return null

  const observationStart = dates[0]
  const observationEnd = dates.at(-1)!
  const start = new Date(`${observationStart}T12:00:00`)
  const end = new Date(`${observationEnd}T12:00:00`)
  const observedDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  if (observedDays <= 0) return null

  const loggedHours = logged.reduce((sum, entry) => sum + entry.hours, 0)
  const weeklyRate = (loggedHours / observedDays) * 7
  if (!(weeklyRate > 0)) return null
  const totals = totalsForCategory(experiences, entries, category)
  const remainingHours = Math.max(0, goal - totals.total)
  const daysToGoal = Math.ceil((remainingHours / weeklyRate) * 7)
  const projected = new Date(now)
  projected.setHours(12, 0, 0, 0)
  projected.setDate(projected.getDate() + daysToGoal)

  return {
    observationStart,
    observationEnd,
    loggedHours,
    weeklyRate,
    remainingHours,
    estimatedHours: totals.estimated,
    projectedDate: projected.toISOString().slice(0, 10),
  }
}

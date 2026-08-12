/* Part 1 — derived properties (data-model §6: computed, NEVER stored).
 *
 * Every function here is pure: records in, facts out. Nothing is memoised into
 * the store and nothing is persisted, because totals and averages drift the
 * moment an underlying record changes. `selectors.ts` keeps the app-wide
 * primitives (GPA, hour totals, best MCAT); this module adds the per-pillar
 * signals the tab specs call for.
 */
import type {
  CollectionRecord, ExperienceCategory, ExperienceEntry, LegacyEntityEnvelope, TaskItem,
} from '@/lib/types'

const DAY_MS = 86_400_000

/** A record that may or may not carry the additive envelope timestamps. */
type Timestamped = LegacyEntityEnvelope

function startOfDayMs(value: Date | number): number {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Parse an ISO `YYYY-MM-DD` into local midnight. Returns null for junk input,
 *  so callers can skip rather than fabricate a date. */
export function parseIsoDate(iso?: string): Date | null {
  if (!iso) return null
  const parsed = new Date(`${iso}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Whole days between two instants (b - a), floored to day boundaries. */
export function daysBetween(a: Date | number, b: Date | number): number {
  return Math.round((startOfDayMs(b) - startOfDayMs(a)) / DAY_MS)
}

/** Days since a record was last touched.
 *
 *  Returns `null` when the record predates the additive `updatedAt` envelope —
 *  the honest answer is "unknown", and every staleness rule skips rather than
 *  inventing a date (architecture/02: retrieval failure increases transparency,
 *  not speculation). */
export function daysSinceUpdate(record: Timestamped, now: Date = new Date()): number | null {
  const stamp = record.updatedAt ?? record.createdAt
  if (!stamp) return null
  return Math.max(0, daysBetween(stamp, now))
}

export interface PaceProjection {
  /** Hours still needed to reach the goal (0 once met). */
  remaining: number
  /** Weeks to the goal at the observed rate; null when the rate is 0 or unknown. */
  weeksToGoal: number | null
  /** Projected completion date; null when it cannot be computed. */
  projectedDate: Date | null
  /** True once the goal has already been met. */
  met: boolean
}

/** Pace toward a Goals target.
 *
 *  Only meaningful when the user actually set a goal — spec 03 §6.5 forbids
 *  normalized progress bars for domains without a user-set target, so callers
 *  must not render this when `goal` is 0/undefined. */
export function paceProjection(current: number, goal: number, hoursPerWeek: number, now: Date = new Date()): PaceProjection | null {
  if (!goal || goal <= 0) return null
  const remaining = Math.max(0, goal - current)
  if (remaining === 0) return { remaining: 0, weeksToGoal: 0, projectedDate: null, met: true }
  if (hoursPerWeek <= 0) return { remaining, weeksToGoal: null, projectedDate: null, met: false }
  const weeksToGoal = remaining / hoursPerWeek
  const projectedDate = new Date(now.getTime() + weeksToGoal * 7 * DAY_MS)
  return { remaining, weeksToGoal, projectedDate, met: false }
}

export interface PillarSignals {
  category: ExperienceCategory
  totalHours: number
  entryCount: number
  activeCount: number
  /** Days from the earliest start date to today (or to the latest end date). */
  longevityDays: number | null
  /** Unknown until the hour-log model supplies dated, measured entries. */
  hoursPerWeek: number | null
  /** Distinct organizations represented — breadth, not volume. */
  distinctOrgs: number
  /** Distinct tags (used for Shadowing specialty breadth). */
  distinctTags: number
  /** Most recent `updatedAt` across the pillar's entries; null when unknown. */
  lastTouchedAt: number | null
  /** Days since anything in this pillar was updated; null when unknown. */
  daysSinceActivity: number | null
}

/** Per-pillar derived signals (data-model §6 "Per-pillar derived"):
 *  longevity + cadence, hrs/wk, distinct-population/specialty counts. */
export function pillarSignals(
  entries: CollectionRecord<ExperienceEntry>[],
  category: ExperienceCategory,
  now: Date = new Date()
): PillarSignals {
  const rows = entries.filter((entry) => entry.category === category && !entry.deletedAt)
  const totalHours = rows.reduce((sum, entry) => sum + (entry.hours || 0), 0)

  const starts = rows.map((entry) => parseIsoDate(entry.startDate)).filter((d): d is Date => Boolean(d))
  const ends = rows.map((entry) => parseIsoDate(entry.endDate)).filter((d): d is Date => Boolean(d))
  const earliest = starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : null
  // An open-ended (still active) pillar runs to today; a fully closed one stops
  // at its last end date so a finished role doesn't keep diluting hrs/wk.
  const hasOpenEntry = rows.some((entry) => entry.status === 'active' || !entry.endDate)
  const latestEnd = ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : null
  const spanEnd = hasOpenEntry || !latestEnd ? now : latestEnd

  const longevityDays = earliest ? Math.max(0, daysBetween(earliest, spanEnd)) : null
  // A parent position's date range is not a measured activity interval. Using it
  // to divide an aggregate would manufacture a pace; keep this dormant instead.
  const hoursPerWeek = null

  const stamps = rows
    .map((entry) => entry.updatedAt ?? entry.createdAt)
    .filter((stamp): stamp is number => typeof stamp === 'number')
  const lastTouchedAt = stamps.length ? Math.max(...stamps) : null

  return {
    category,
    totalHours,
    entryCount: rows.length,
    activeCount: rows.filter((entry) => entry.status === 'active').length,
    longevityDays,
    hoursPerWeek,
    distinctOrgs: new Set(rows.map((entry) => entry.org.trim().toLocaleLowerCase()).filter(Boolean)).size,
    distinctTags: new Set(rows.flatMap((entry) => entry.tags ?? []).map((tag) => tag.trim().toLocaleLowerCase()).filter(Boolean)).size,
    lastTouchedAt,
    daysSinceActivity: lastTouchedAt == null ? null : Math.max(0, daysBetween(lastTouchedAt, now)),
  }
}

/** The next unfinished dated task, or null. Pure date arithmetic — no ranking. */
export function nextDeadline(tasks: CollectionRecord<TaskItem>[], now: Date = new Date()): { task: TaskItem; daysLeft: number } | null {
  let best: { task: TaskItem; daysLeft: number } | null = null
  for (const task of tasks) {
    if (task.archived || task.progress === 'Finished' || task.deletedAt) continue
    const deadline = parseIsoDate(task.deadline)
    if (!deadline) continue
    const daysLeft = daysBetween(now, deadline)
    if (!best || daysLeft < best.daysLeft) best = { task, daysLeft }
  }
  return best
}

/** Count of distinct non-empty values for a field — the shared primitive behind
 *  "distinct populations served" (Volunteering) and "specialty breadth" (Shadowing). */
export function distinctCount(values: (string | undefined)[]): number {
  return new Set(values.map((value) => value?.trim().toLocaleLowerCase()).filter(Boolean)).size
}

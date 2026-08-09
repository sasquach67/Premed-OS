/* ============================================================
   capacity.ts — reading the one weekly hour pool (`00` §11b).

   Every plan generator is a CONSUMER of `settings.weeklyCapacity`, never an
   owner of its own budget. Academics claims class time, the review queue,
   exam prep and assignment work; MCAT claims study sessions, daily CARS, and
   full-lengths with their review blocks. Neither may allocate hours the other
   has already taken.

   The governing rule is "check before generating, not after": if the pool is
   oversubscribed, say so BEFORE producing a plan. Two plans that cannot both
   happen must never both be emitted.

   Nothing here is a productivity target. The pool describes what a student
   HAS, not what they SHOULD use, and no function in this file exists to
   encourage filling unclaimed hours.
   ============================================================ */
import type { BusyPeriod, WeeklyCapacity } from '@/lib/types'
import { isCapacityCaptured, weeklyCapacityTotal } from '@/store/migrations/shellV9'

export type CapacityTab = 'academics' | 'mcat'

/** One generator's stated weekly need. `kind` is shown to the student when a
 *  plan has to bend, so it must name the work, not the tab. */
export interface CapacityClaim {
  tab: CapacityTab
  kind: string
  hoursPerWeek: number
}

export interface CapacityAssessment {
  /** False when nobody has been asked yet — callers must ask, not assume. */
  captured: boolean
  /** Hours in this week after busy-period overrides. */
  available: number
  /** Held back from both generators, never from one (§11b). */
  slack: number
  /** What generators may actually divide between them. */
  allocatable: number
  claimed: number
  oversubscribed: boolean
  /** Hours by which claims exceed what is allocatable. Zero when they fit. */
  shortfall: number
  byTab: Record<CapacityTab, number>
}

/** Roughly one catch-up day a week, reserved from the pool rather than from a
 *  tab (`02` §3.3-B1). Taken as one *typical* day — the mean of the days that
 *  actually have hours — so a student with four heavy days reserves a heavy
 *  day, and one with seven light days reserves a light one. */
export function slackHours(capacity: WeeklyCapacity): number {
  const activeDays = capacity.hoursByWeekday.filter((hours) => hours > 0)
  if (!activeDays.length) return 0
  const total = activeDays.reduce((sum, hours) => sum + hours, 0)
  return round(total / activeDays.length)
}

/** Does an ISO date fall inside a busy period (inclusive both ends)? */
function coversDate(period: BusyPeriod, iso: string): boolean {
  return period.startDate <= iso && iso <= period.endDate
}

/**
 * Hours available in the week beginning `weekStartIso` (a Sunday, matching
 * `hoursByWeekday`). A busy period replaces the weekday total for each day it
 * covers — finals week does not simply subtract, it *substitutes*.
 *
 * Busy periods bend both plans, and bending is not debt: nothing accrues a
 * backlog because a week was known in advance to be short (`01` §6.10-B).
 */
export function availableHours(capacity: WeeklyCapacity, weekStartIso: string): number {
  const start = new Date(`${weekStartIso}T00:00:00`)
  if (Number.isNaN(start.getTime())) return weeklyCapacityTotal(capacity)

  let total = 0
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(start)
    day.setDate(day.getDate() + offset)
    const iso = day.toISOString().slice(0, 10)
    const override = capacity.busyPeriods.find((period) => coversDate(period, iso))
    total += override ? Math.max(0, override.hoursOverride) : capacity.hoursByWeekday[day.getDay()]
  }
  return round(total)
}

/**
 * The check every generator runs *before* building a plan.
 *
 * An un-captured pool is not "zero hours" — it is "nobody has been asked".
 * Callers must branch on `captured` and ask, rather than treating the student
 * as having no time.
 */
export function assessCapacity(
  capacity: WeeklyCapacity,
  claims: CapacityClaim[],
  weekStartIso: string,
): CapacityAssessment {
  const captured = isCapacityCaptured(capacity)
  const available = captured ? availableHours(capacity, weekStartIso) : 0
  const slack = captured ? Math.min(slackHours(capacity), available) : 0
  const allocatable = round(Math.max(0, available - slack))

  const byTab: Record<CapacityTab, number> = { academics: 0, mcat: 0 }
  for (const claim of claims) {
    byTab[claim.tab] = round(byTab[claim.tab] + Math.max(0, claim.hoursPerWeek))
  }
  const claimed = round(byTab.academics + byTab.mcat)

  return {
    captured,
    available,
    slack,
    allocatable,
    claimed,
    oversubscribed: captured && claimed > allocatable,
    shortfall: captured ? round(Math.max(0, claimed - allocatable)) : 0,
    byTab,
  }
}

/**
 * The sentence a generator shows instead of a plan it cannot honour.
 *
 * Stated as arithmetic, never as a verdict on the student — §11b's whole
 * stance is that the app caused this collision, so the copy names the numbers
 * and leaves the choice with them. Returns null when there is nothing to say.
 */
export function oversubscriptionMessage(assessment: CapacityAssessment): string | null {
  if (!assessment.captured) return null
  if (!assessment.oversubscribed) return null
  // Two numbers, no subtraction — §11b's own example is "your Fall plan needs
  // 34h/week and you have 22." Stating the difference as well meant showing
  // rounded operands beside an unrounded result (34 - 18.8 printed as 15.3),
  // so a student checking the arithmetic found it did not reconcile.
  return `This plan needs ${fmt(assessment.claimed)}h a week and you have ${fmt(assessment.allocatable)}h.`
}

/**
 * Split the allocatable pool when both tabs want it.
 *
 * Precedence is explicit, not emergent (§11b):
 *   · Academics wins during exam weeks
 *   · MCAT wins during dedicated study periods
 *   · otherwise, proportional to time-to-deadline
 *
 * The student can override, and the override persists — callers pass it in
 * rather than this function inventing one.
 */
export function allocate(
  assessment: CapacityAssessment,
  context: {
    examWeek?: boolean
    dedicatedStudy?: boolean
    /** Days until each tab's next deadline; closer deadline gets more. */
    daysToDeadline?: Partial<Record<CapacityTab, number>>
    override?: Partial<Record<CapacityTab, number>>
  } = {},
): Record<CapacityTab, number> {
  const pool = assessment.allocatable
  if (pool <= 0) return { academics: 0, mcat: 0 }

  if (context.override) {
    const academics = clamp(context.override.academics ?? 0, 0, pool)
    return { academics, mcat: round(pool - academics) }
  }

  const wants = assessment.byTab
  // One tab only: it takes what it asked for, capped. A student not yet
  // studying for the MCAT sees no MCAT claims and nothing changes for them.
  if (!wants.mcat) return { academics: Math.min(wants.academics, pool), mcat: 0 }
  if (!wants.academics) return { academics: 0, mcat: Math.min(wants.mcat, pool) }

  if (context.examWeek) return favour('academics', wants, pool)
  if (context.dedicatedStudy) return favour('mcat', wants, pool)

  // Proportional to urgency: the nearer deadline gets the larger share.
  const days = context.daysToDeadline ?? {}
  const urgency = {
    academics: 1 / Math.max(1, days.academics ?? 30),
    mcat: 1 / Math.max(1, days.mcat ?? 30),
  }
  const weight = urgency.academics + urgency.mcat
  const academics = round((pool * urgency.academics) / weight)
  return { academics, mcat: round(pool - academics) }
}

/** The winning tab gets what it asked for; the other gets the remainder. */
function favour(tab: CapacityTab, wants: Record<CapacityTab, number>, pool: number): Record<CapacityTab, number> {
  const primary = Math.min(wants[tab], pool)
  const other: CapacityTab = tab === 'academics' ? 'mcat' : 'academics'
  return { [tab]: primary, [other]: round(pool - primary) } as Record<CapacityTab, number>
}

function clamp(value: number, min: number, max: number): number {
  return round(Math.min(max, Math.max(min, value)))
}

/** Quarter-hour precision — the pool is a plan, not a stopwatch. */
function round(value: number): number {
  return Math.round(value * 4) / 4
}

function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

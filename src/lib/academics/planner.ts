/**
 * The Planner term board (§4.2) — sequencing, not editing.
 *
 * Drawing:   mockup-lab/01-academics/academics-planner-prototype.html
 * Decisions: academics-planner-prototype.md — **A + C ruled Aug 19 2026**: the
 *            whole-plan board with the selected-course inspector on demand,
 *            plus a six-point handoff this module's shapes are built to serve.
 *
 * ⚠️ Reuses rather than reinvents:
 *   • `gpaStats` owns the AMCAS cumulative/BCPM/AO maths.
 *   • `termToMonths` owns term parsing — the same scale the MCAT divider needs,
 *     so terms are never parsed twice with two different sets of rules.
 *
 * ⚠️ U-9 throughout: this module returns credits, named requirements, and named
 * courses. It returns no readiness score, no composite, no ranking, and no
 * "on track" verdict — a projection that cannot name its inputs is not shown.
 */
import { gpaStats } from '@/lib/selectors'
import { termToMonths } from '@/lib/academics/mcatTiming'
import type { Course, PlannerTerm, RequirementItem } from '@/lib/types'

/** A term with no parseable name still gets a column — see `plannerTerms`. */
export const UNSCHEDULED = 'Unscheduled'
export const PRIOR_CREDIT = 'Prior credit'

const PRIOR_CREDIT_TYPES = new Set(['ap', 'ib', 'transfer', 'dual-enrollment'])

/**
 * Transcript-only prior credit belongs to Grades & Archive. It may still have
 * an exact historical term on its transcript record, but it is not a UNC
 * semester in the student's editable Planner timeline.
 */
export function isPriorCreditCourse(course: Course): boolean {
  return course.term.trim().toLocaleLowerCase() === PRIOR_CREDIT.toLocaleLowerCase()
    || PRIOR_CREDIT_TYPES.has(course.transcript?.courseType?.trim().toLocaleLowerCase() ?? '')
}

export interface PlannerColumn {
  id?: string
  term: string
  kind?: PlannerTerm['kind']
  note?: string
  lockedAt?: number
  lockReason?: string
  /** Orderable month index, or undefined for an unparseable term. */
  months?: number
  courses: Course[]
  credits: number
  bcpmCredits: number
  /** A factual boundary: recorded as complete or in progress, so not a proposal. */
  registered: boolean
}

/**
 * Term columns in real chronological order.
 *
 * Unparseable terms are **not dropped**. A course with no usable term is
 * exactly what this board exists to surface, so it lands in a trailing column
 * instead of disappearing from the plan.
 */
export function plannerTerms(courses: Course[], slots: PlannerTerm[] = []): PlannerColumn[] {
  const planningCourses = courses.filter((course) => !isPriorCreditCourse(course))
  const planningSlots = slots.filter((slot) => slot.label.trim().toLocaleLowerCase() !== PRIOR_CREDIT.toLocaleLowerCase())
  const byTerm = new Map<string, Course[]>()
  for (const course of planningCourses) {
    const term = course.term?.trim() || UNSCHEDULED
    byTerm.set(term, [...(byTerm.get(term) ?? []), course])
  }

  const slotByLabel = new Map(planningSlots.map((slot) => [slot.label.trim().toLocaleLowerCase(), slot]))
  const rowsForSlot = new Map<string, Course[]>()
  for (const course of planningCourses) {
    if (course.plannerTermId) rowsForSlot.set(course.plannerTermId, [...(rowsForSlot.get(course.plannerTermId) ?? []), course])
  }
  const columns = planningSlots.map((slot): PlannerColumn => {
    const rows = rowsForSlot.get(slot.id) ?? byTerm.get(slot.label) ?? []
    return {
      id: slot.id, term: slot.label, kind: slot.kind, note: slot.note, lockedAt: slot.lockedAt, lockReason: slot.lockReason,
      months: termToMonths(slot.label), courses: [...rows].sort((a, b) => a.order - b.order),
      credits: rows.reduce((sum, course) => sum + (course.credits || 0), 0),
      bcpmCredits: rows.filter((course) => course.bcpm).reduce((sum, course) => sum + (course.credits || 0), 0),
      registered: rows.some((course) => course.status === 'completed' || course.status === 'in-progress'),
    }
  })
  for (const [term, rows] of byTerm.entries()) {
    if (slotByLabel.has(term.trim().toLocaleLowerCase())) continue
    columns.push({
    term,
    months: termToMonths(term),
    courses: [...rows].sort((a, b) => a.order - b.order),
    credits: rows.reduce((sum, course) => sum + (course.credits || 0), 0),
    bcpmCredits: rows.filter((course) => course.bcpm).reduce((sum, course) => sum + (course.credits || 0), 0),
    registered: rows.some((course) => course.status === 'completed' || course.status === 'in-progress'),
    })
  }

  return columns.sort((a, b) => {
    if (a.months == null && b.months == null) return a.term.localeCompare(b.term)
    if (a.months == null) return 1
    if (b.months == null) return -1
    return a.months - b.months
  })
}

/**
 * Which column the MCAT falls after. **Absent without a date** — a divider
 * placed on a guessed date would misrepresent the whole sequence.
 */
export function mcatDividerAfter(columns: PlannerColumn[], mcatDate?: string): number | undefined {
  if (!mcatDate) return undefined
  const at = new Date(mcatDate)
  if (Number.isNaN(at.getTime())) return undefined
  const months = at.getFullYear() * 12 + at.getMonth()
  let index: number | undefined
  columns.forEach((column, position) => {
    if (column.months != null && column.months <= months) index = position
  })
  return index
}

const codesOf = (requirement: RequirementItem) =>
  (requirement.satisfiedBy ?? []).map((code) => code.trim().toUpperCase()).filter(Boolean)

/** Open requirements no recorded course satisfies, each keeping its confidence. */
export function unplacedRequirements(requirements: RequirementItem[], courses: Course[]): RequirementItem[] {
  const placed = new Set(courses.filter((course) => course.term?.trim() && course.term !== UNSCHEDULED).map((course) => course.code.trim().toUpperCase()))
  return requirements.filter((requirement) => {
    if (requirement.done) return false
    const codes = codesOf(requirement)
    if (!codes.length) return false
    return !codes.some((code) => placed.has(code))
  })
}

export interface RequirementEffect {
  label: string
  group: string
  /** Read from the record. Never inferred from a name match. */
  confidence: 'verified' | 'inferred'
  source?: string
}

export interface CourseEffects {
  clears: RequirementEffect[]
  /** Courses whose recorded prerequisite names this one. */
  unlocks: Course[]
  /** Present only when the course record itself carries an offering warning. */
  offeringRisk?: string
}

/**
 * The inspector's payload — "if I take this, it clears that".
 *
 * Deliberately returns nothing numeric: the inspector explains consequences,
 * and a number here would become the readiness score U-9 forbids.
 */
export function courseEffects(
  course: Course,
  requirements: RequirementItem[],
  courses: Course[],
): CourseEffects {
  const code = course.code.trim().toUpperCase()

  const clears = requirements
    .filter((requirement) => codesOf(requirement).includes(code))
    .map((requirement): RequirementEffect => ({
      label: requirement.label,
      group: requirement.group,
      confidence: requirement.verificationStatus === 'needs-verification' ? 'inferred' : 'verified',
      source: requirement.sourceLabel,
    }))

  const unlocks = courses.filter((other) =>
    other.id !== course.id
    && (other.prereqOf ?? '').trim().toUpperCase().includes(code))

  const notes = course.notes?.trim()
  return {
    clears,
    unlocks,
    offeringRisk: notes && /only|offered|spring|fall/i.test(notes) ? notes : undefined,
  }
}

export interface OutcomeProjection {
  cumulative: number
  science: number
  gradedCredits: number
  /** Credits recorded but not yet graded — stated, never folded into the GPA. */
  inProgressCredits: number
  plannedCredits: number
}

/** Numbers that exist, with what they exclude named beside them. */
export function outcomeProjection(courses: Course[]): OutcomeProjection {
  const stats = gpaStats(courses)
  const creditsWhere = (status: Course['status']) => courses
    .filter((course) => course.status === status)
    .reduce((sum, course) => sum + (course.credits || 0), 0)
  return {
    cumulative: stats.cum,
    science: stats.science,
    gradedCredits: stats.credits,
    inProgressCredits: creditsWhere('in-progress'),
    plannedCredits: creditsWhere('planned'),
  }
}

/**
 * Prerequisites sitting at or after the MCAT — named individually, because
 * "one prerequisite is late" is actionable and a count is not.
 */
export function prereqVsMcat(courses: Course[], mcatDate?: string): Course[] {
  if (!mcatDate) return []
  const at = new Date(mcatDate)
  if (Number.isNaN(at.getTime())) return []
  const months = at.getFullYear() * 12 + at.getMonth()
  return courses.filter((course) => {
    if (!course.prereqOf && !course.bcpm) return false
    if (course.status === 'completed') return false
    const own = termToMonths(course.term)
    return own != null && own >= months
  })
}

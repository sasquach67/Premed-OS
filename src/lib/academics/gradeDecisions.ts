/**
 * Grade decisions — the record layer inside Grades & archive (§4.1 #44, #50).
 *
 * Drawing:   mockup-lab/01-academics/academics-grade-decisions.html
 * Decisions: academics-grade-decisions.md — three STATE views of one treatment,
 *            not visual variants.
 *
 * ⚠️ The distinction the whole surface turns on: **a policy that was never
 * recorded is not a policy recorded as not applying.** `undefined` means the
 * app was never told; `false` means the student told it no. Collapsing those
 * two is how a projection starts lying, so `PolicyState` keeps them apart and
 * the component renders them differently.
 *
 * ⚠️ Premed OS never claims a regrade is justified and never estimates an
 * unpublished curve.
 */
import type {
  ClassAssignment, GradeCategory,
} from '@/lib/types'

const DAY = 86_400_000
const isoToMs = (iso?: string) => (iso ? new Date(iso).getTime() : undefined)

export type RegradeState = 'open' | 'closed' | 'unknown'

export interface RegradeWindow {
  state: RegradeState
  closesOn?: string
  daysLeft?: number
}

/**
 * #44 — points genuinely still on the table, or an honest "unknown".
 *
 * A missing deadline is `unknown`, never `closed`: the app has no basis to tell
 * a student their window has expired, and guessing one from the returned date
 * would invent an instructor policy.
 */
export function regradeWindow(assignment: ClassAssignment, now = Date.now()): RegradeWindow {
  const closes = isoToMs(assignment.regradeDeadline)
  if (closes == null) return { state: 'unknown' }
  const daysLeft = Math.ceil((closes - now) / DAY)
  return {
    state: daysLeft >= 0 ? 'open' : 'closed',
    closesOn: assignment.regradeDeadline,
    daysLeft,
  }
}

/** Returned work that can still be acted on, soonest deadline first. */
export function reviewableWork(assignments: ClassAssignment[], now = Date.now()): ClassAssignment[] {
  return assignments
    .filter((item) => item.status === 'graded' && regradeWindow(item, now).state === 'open')
    .sort((a, b) => String(a.regradeDeadline).localeCompare(String(b.regradeDeadline)))
}

export type PolicyState = 'applied' | 'not-applied' | 'not-recorded'

export interface PolicyRow {
  id: 'drop-lowest' | 'replacement' | 'curve'
  title: string
  state: PolicyState
  detail: string
  /** Where the fact came from — or the plain statement that it is missing. */
  source: string
}

/**
 * #50 — every rule the calculation used, and every rule it could not use.
 * A row is never omitted: silence about a policy is what the student cannot
 * detect, so "not recorded" is stated rather than skipped.
 */
export function appliedPolicies(category: GradeCategory): PolicyRow[] {
  const drop = category.dropLowestCount
  const replacement = category.replacementRule
  const curve = category.curvePublished
  const source = category.source || 'student-approved syllabus category policy'

  return [
    {
      id: 'drop-lowest',
      title: 'Drop-lowest rule',
      state: drop == null ? 'not-recorded' : drop > 0 ? 'applied' : 'not-applied',
      detail: drop == null
        ? 'No drop-lowest policy has been recorded for this category, so the calculation does not assume one either way.'
        : drop > 0
          ? `${drop === 1 ? 'One completed item is' : `${drop} completed items are`} excluded because the syllabus says the lowest eligible ${drop === 1 ? 'item does' : 'items do'} not count.`
          : 'The syllabus records no drop-lowest allowance for this category, so every posted score counts.',
      source: drop == null ? 'Source: missing course policy' : `Source: ${source}`,
    },
    {
      id: 'replacement',
      title: 'Replacement rule',
      state: replacement == null ? 'not-recorded' : replacement ? 'applied' : 'not-applied',
      detail: replacement == null
        ? 'No replacement policy has been recorded, so no earlier result is altered and none is assumed safe.'
        : replacement
          ? 'A later assessment is marked as replacing an earlier one, and the calculation says so rather than silently overwriting it.'
          : 'No later assessment has been marked as a replacement, so no earlier result is silently altered.',
      source: replacement == null ? 'Source: no supporting course record' : `Source: ${source}`,
    },
    {
      id: 'curve',
      title: 'Instructor curve',
      state: curve == null ? 'not-recorded' : curve ? 'applied' : 'not-applied',
      detail: curve == null
        ? 'The instructor has not published a curve here. This names the uncertainty instead of estimating an outcome.'
        : curve
          ? 'A published curve is recorded and applied as the instructor stated it.'
          : 'The instructor has confirmed there is no curve, so the raw calculation stands.',
      source: curve == null ? 'Source: missing official policy' : `Source: ${source}`,
    },
  ]
}

export interface MissingInput {
  id: string
  fact: string
  recovery: string
}

/**
 * The course facts that block a calculation, most-blocking first. A weight that
 * was never recorded is the canonical case: without it there is no honest
 * projection, and the surface shows the gap rather than a zero.
 */
export function missingInputs(categories: GradeCategory[], assignments: ClassAssignment[]): MissingInput[] {
  const out: MissingInput[] = []
  for (const category of categories) {
    if (category.weight == null || Number.isNaN(category.weight) || category.weight <= 0) {
      out.push({
        id: `weight:${category.id}`,
        fact: `${category.name} has no confirmed weight.`,
        recovery: 'Add the category weight or attach the syllabus excerpt it comes from.',
      })
    }
  }
  const ungradedButDue = assignments.filter(
    (item) => item.status === 'graded' && item.pointsPossible == null,
  )
  for (const item of ungradedButDue) {
    out.push({
      id: `points:${item.id}`,
      fact: `${item.title} is marked graded but records no points possible.`,
      recovery: 'Record what the item was out of, so its result can enter a calculation.',
    })
  }
  return out
}

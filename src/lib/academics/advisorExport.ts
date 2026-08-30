/**
 * Advisor snapshot (§4.1 planning decisions · export).
 *
 * Decisions: academics-planning-decisions.md — "a paper-like snapshot with the
 * catalog source date, included terms, open requirements, substitution state,
 * and a plain statement that it is not an official audit or enrollment action."
 *
 * ⚠️ Open requirements are NAMED, never counted. A count is exactly the thing
 * that lets an unmet requirement hide, and this document exists to be read by
 * the one person who can catch that.
 */
import type { Course, PlanningProgramContext, RequirementItem } from '@/lib/types'
import { planningRequirementSet } from '@/lib/academics/uncPlanningLibrary'

export const NOT_OFFICIAL =
  'Advisor review is still required. This snapshot explains the student’s plan and its source date. '
  + 'It does not claim a degree audit, enrollment, or official approval.'

export interface AdvisorSnapshot {
  text: string
  terms: string[]
  openRequirements: string[]
}

export function buildAdvisorSnapshot({ courses, requirements, catalogDate, studentName, planningContext }: {
  courses: Course[]
  requirements: RequirementItem[]
  catalogDate?: string
  studentName?: string
  planningContext?: PlanningProgramContext
}): AdvisorSnapshot {
  const terms = [...new Set(courses.map((course) => course.term).filter(Boolean))]
  const open = requirements.filter((item) => !item.done)
  const openRequirements = open.map((item) => `${item.group} — ${item.label}`)

  const lines: string[] = []
  lines.push(`Plan snapshot${studentName ? ` · ${studentName}` : ''}`)
  lines.push(`Prepared ${new Date().toISOString().slice(0, 10)} — prepared, not official`)
  lines.push('')
  lines.push(`Terms included: ${terms.length ? terms.join(', ') : 'none recorded'}`)
  lines.push(`Catalog source: ${catalogDate ? `saved ${catalogDate}` : 'no catalog date recorded'}`)
  const selectedProgram = planningContext?.selectedProgramId
    ? planningRequirementSet(planningContext.selectedProgramId)
    : undefined
  lines.push(`Selected catalog plan: ${selectedProgram
    ? `${selectedProgram.program} ${selectedProgram.degree}${selectedProgram.trackOrConcentration ? ` — ${selectedProgram.trackOrConcentration}` : ''}`
    : planningContext?.selectedProgramId ? `unavailable local source (${planningContext.selectedProgramId})` : 'not recorded'}`)
  lines.push(`Matriculation term: ${planningContext?.matriculationTerm || 'not recorded'}`)
  lines.push(`IDEAs catalog year: ${planningContext?.ideasCatalogYear || 'not recorded'}`)
  if (selectedProgram?.admissionGate || planningContext?.gillingsAdmissionTerm || planningContext?.programAdmissionStatus) {
    lines.push(`Program admission context: ${planningContext?.gillingsAdmissionTerm || 'term not recorded'} · ${planningContext?.programAdmissionStatus || 'status not recorded'}`)
  }
  if (selectedProgram) {
    lines.push(`Planning reference: ${selectedProgram.sourceUrl} · retrieved ${selectedProgram.retrievedAt} · catalog ${selectedProgram.catalogYear}`)
  }
  lines.push('')
  lines.push(`Courses (${courses.length}):`)
  for (const course of courses) {
    lines.push(`  ${course.term} · ${course.code} — ${course.title} · ${course.credits} cr · ${course.status}${course.grade ? ` · ${course.grade}` : ''}`)
  }
  lines.push('')
  // Named, never counted — a count is how an unmet requirement hides.
  lines.push(`Open requirements (${openRequirements.length} listed by name):`)
  if (!openRequirements.length) lines.push('  none open against the recorded catalog')
  for (const item of openRequirements) lines.push(`  - ${item}`)
  lines.push('')
  lines.push('Substitution state: alternatives are comparison records only; none has been accepted as a replacement.')
  lines.push('')
  lines.push(NOT_OFFICIAL)

  return { text: lines.join('\n'), terms, openRequirements }
}

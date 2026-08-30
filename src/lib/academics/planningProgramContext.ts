import type { PlanningProgramContext } from '@/lib/types'
import { planningRequirementSet } from '@/lib/academics/uncPlanningLibrary'

const ADMISSION_STATUSES = new Set<NonNullable<PlanningProgramContext['programAdmissionStatus']>>([
  'not-applicable', 'planning', 'applied', 'admitted',
])

export interface PlanningContextValidationResult {
  ok: boolean
  value?: PlanningProgramContext
  errors: string[]
}

function cleanOptional(value: string | undefined) {
  const cleaned = value?.trim()
  return cleaned || undefined
}

/** Validates a student-authored write. Hydration itself stays lossless and
 * never calls this helper on an existing backup. */
export function validatePlanningProgramContext(
  input: PlanningProgramContext,
  now = Date.now(),
): PlanningContextValidationResult {
  const selectedProgramId = cleanOptional(input.selectedProgramId)
  const matriculationTerm = cleanOptional(input.matriculationTerm)
  const ideasCatalogYear = cleanOptional(input.ideasCatalogYear)
  const gillingsAdmissionTerm = cleanOptional(input.gillingsAdmissionTerm)
  const programAdmissionStatus = input.programAdmissionStatus
  const errors: string[] = []

  const selectedProgram = selectedProgramId ? planningRequirementSet(selectedProgramId) : undefined
  if (selectedProgramId && !selectedProgram) errors.push('Selected program is not in the source-versioned local planning library.')
  if (programAdmissionStatus && !ADMISSION_STATUSES.has(programAdmissionStatus)) errors.push('Program admission status is not recognized.')
  if (gillingsAdmissionTerm && selectedProgram && !selectedProgram.admissionGate) {
    errors.push('Admission-term context is only accepted for a program with a recorded admission gate.')
  }
  if (errors.length) return { ok: false, errors }

  const value: PlanningProgramContext = {
    selectedProgramId,
    matriculationTerm,
    ideasCatalogYear,
    gillingsAdmissionTerm,
    programAdmissionStatus,
  }
  if (Object.values(value).some((entry) => entry !== undefined)) value.updatedAt = now
  return { ok: true, value, errors: [] }
}

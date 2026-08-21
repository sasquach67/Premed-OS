import type {
  AcademicFile, AssessmentMaterialPermission, ClassAssignment,
  ProfessorEvidenceObservation, TranscriptCourseRecord,
} from '@/lib/types'

export const PROFESSOR_EVIDENCE_SAMPLE_GATE = 2

/** Returned work in this course is the only admissible professor evidence. */
export function eligibleProfessorEvidence(
  evidence: ProfessorEvidenceObservation[],
  assignments: ClassAssignment[],
  courseId: string,
) {
  const returnedAssignmentIds = new Set(
    assignments.filter((assignment) => assignment.courseId === courseId && !!assignment.returnedAt).map((assignment) => assignment.id),
  )
  return evidence
    .filter((item) => item.courseId === courseId && returnedAssignmentIds.has(item.assignmentId))
    .sort((a, b) => b.observedAt - a.observedAt)
}

export function professorEvidenceIsEligible(count: number) {
  return count >= PROFESSOR_EVIDENCE_SAMPLE_GATE
}

export const ASSESSMENT_PERMISSION_LABEL: Record<AssessmentMaterialPermission, string> = {
  'instructor-provided': 'Instructor-provided',
  'publicly-posted': 'Publicly posted',
  'my-returned-work': 'My returned work',
  'unknown-origin': 'Unknown origin · private',
}

export function canShareAssessmentMaterial(permission: AssessmentMaterialPermission) {
  return permission !== 'unknown-origin'
}

/** Derived student preview only — never represents a registrar export. */
export function courseworkExport(records: TranscriptCourseRecord[]) {
  return records.map((record) => ({
    institution: record.institution,
    courseNumber: record.courseNumberExact,
    title: record.titleExact,
    credits: record.creditsExact,
    grade: record.gradeExact,
    term: `${record.term} ${record.year}`.trim(),
    courseType: record.courseType,
    classificationSource: record.classificationSource ?? '',
    classificationReason: record.classificationReason ?? '',
  }))
}

export function assessmentFileLabel(file: AcademicFile | undefined) {
  return file?.title || 'Unlinked assessment material'
}

import { describe, expect, it } from 'vitest'
import { canShareAssessmentMaterial, courseworkExport, eligibleProfessorEvidence } from './evidence'

describe('academic evidence boundaries', () => {
  it('uses only returned assignments from the same course for professor evidence', () => {
    const assignments: any[] = [
      { id: 'returned', courseId: 'course-a', returnedAt: '2026-08-20' },
      { id: 'pending', courseId: 'course-a' },
      { id: 'other', courseId: 'course-b', returnedAt: '2026-08-20' },
    ]
    const evidence: any[] = [
      { id: 'one', courseId: 'course-a', assignmentId: 'returned', observedAt: 3 },
      { id: 'two', courseId: 'course-a', assignmentId: 'pending', observedAt: 2 },
      { id: 'three', courseId: 'course-b', assignmentId: 'other', observedAt: 1 },
    ]
    expect(eligibleProfessorEvidence(evidence, assignments, 'course-a').map((item) => item.id)).toEqual(['one'])
  })

  it('keeps unknown-origin assessment material private', () => {
    expect(canShareAssessmentMaterial('unknown-origin')).toBe(false)
    expect(canShareAssessmentMaterial('instructor-provided')).toBe(true)
  })

  it('derives export fields from exact transcript strings', () => {
    const [row] = courseworkExport([{
      id: 'one', courseId: 'course-a', institution: 'Example U', courseNumberExact: 'BIOL-252',
      titleExact: 'Neurobiology & Systems', creditsExact: '3.00', gradeExact: 'A-', term: 'Fall', year: '2026',
      courseType: 'Undergraduate', classificationSource: 'Student review', classificationReason: 'Catalog description',
      createdAt: 1, updatedAt: 1, order: 0,
    }])
    expect(row).toMatchObject({ courseNumber: 'BIOL-252', credits: '3.00', grade: 'A-', classificationReason: 'Catalog description' })
  })
})

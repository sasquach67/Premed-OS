import { describe, expect, it } from 'vitest'
import type { ClassAssignment } from '@/lib/types'
import { assignmentBucket, assignmentWorkload, workloadLabel } from '@/components/common/assignmentsLogic'

function assignment(patch: Partial<ClassAssignment>): ClassAssignment {
  return {
    id: 'assignment',
    courseId: 'course',
    title: 'Exam',
    type: 'exam',
    status: 'not-started',
    linkedTopicIds: [],
    linkedFileIds: [],
    createdAt: 1,
    updatedAt: 1,
    order: 0,
    ...patch,
  }
}

describe('assignment agenda rules', () => {
  const monday = new Date(2026, 6, 27)

  it('never hides urgent records behind later buckets', () => {
    expect(assignmentBucket(assignment({ dueDate: '2026-07-26' }), monday)).toBe('overdue')
    expect(assignmentBucket(assignment({ dueDate: '2026-07-27' }), monday)).toBe('today')
  })

  it('treats submitted and graded records as completed', () => {
    expect(assignmentBucket(assignment({ status: 'submitted', dueDate: '2026-07-27' }), monday)).toBe('completed')
    expect(assignmentBucket(assignment({ status: 'graded', dueDate: '2026-08-27' }), monday)).toBe('completed')
  })

  it('uses the locked workload thresholds', () => {
    expect(workloadLabel(0)).toBe('Free')
    expect(workloadLabel(9.9)).toBe('Light')
    expect(workloadLabel(10)).toBe('Busy')
    expect(workloadLabel(30)).toBe('Busy')
    expect(workloadLabel(30.1)).toBe('Heavy')
  })
})

it('does not call unweighted or zero-weight work free', () => {
  expect(assignmentWorkload([{ weight: undefined }]).label).toBe('1 due')
  expect(assignmentWorkload([{ weight: 0 }]).label).toBe('1 due')
  expect(assignmentWorkload([{ weight: 20 }, { weight: undefined }])).toMatchObject({ total: 20, unknown: 1, label: '2 due' })
  expect(assignmentWorkload([]).label).toBe('Free')
})

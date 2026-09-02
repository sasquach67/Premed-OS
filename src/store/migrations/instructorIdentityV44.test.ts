import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateInstructorIdentityV44 } from './instructorIdentityV44'

describe('migrateInstructorIdentityV44', () => {
  it('cleans an existing instructor without replacing the class or linked work', () => {
    const existing = structuredClone(createSeedData())
    const workspace = existing.academics.classCenter.workspaces[0]
    workspace.instructor = "Dr. Erik Maloney (erikglen@live.unc.edu) (If I don't respond within 48 hours, email again.)"
    const course = existing.courses.find((item) => item.id === workspace.courseId)!
    const contact = existing.academics.classCenter.contacts[0]
    contact.name = 'Dr. Emily Weber, Ph.D.'
    const linkedIds = existing.academics.classCenter.assignments
      .filter((item) => item.courseId === course.id)
      .map((item) => item.id)

    const out = migrateInstructorIdentityV44(existing)

    expect(out.academics.classCenter.workspaces.find((item) => item.id === workspace.id)).toMatchObject({
      id: workspace.id,
      courseId: course.id,
      instructor: 'Erik Maloney',
    })
    expect(out.courses.find((item) => item.id === course.id)).toBe(course)
    expect(out.academics.classCenter.contacts.find((item) => item.id === contact.id)).toMatchObject({
      id: contact.id,
      name: 'Emily Weber, PhD',
    })
    expect(out.academics.classCenter.assignments.filter((item) => item.courseId === course.id).map((item) => item.id)).toEqual(linkedIds)
    expect(migrateInstructorIdentityV44(out)).toBe(out)
  })
})

import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateClassIdentityV43 } from './classIdentityV43'

describe('migrateClassIdentityV43', () => {
  it('standardizes an existing class without replacing it or its linked work', () => {
    const existing = structuredClone(createSeedData())
    const workspace = existing.academics.classCenter.workspaces[0]
    const course = existing.courses.find((item) => item.id === workspace.courseId)!
    course.code = 'biol103'
    course.title = '  How   Cells Function '
    course.term = 'fall   2026'
    workspace.instructor = 'Instructor:  Emily Weber, Ph.D.'
    workspace.meetingDays = 'TR'
    workspace.meetingTime = '10am - 11:15am'
    workspace.location = 'Coker Hall,  Rm. 104'
    const linkedIds = existing.academics.classCenter.assignments.filter((item) => item.courseId === course.id).map((item) => item.id)
    const counts = {
      courses: existing.courses.length,
      workspaces: existing.academics.classCenter.workspaces.length,
      assignments: existing.academics.classCenter.assignments.length,
    }

    const out = migrateClassIdentityV43(existing)
    expect(out.courses.find((item) => item.id === course.id)).toMatchObject({ id: course.id, code: 'BIOL 103', title: 'How Cells Function', term: 'Fall 2026' })
    expect(out.academics.classCenter.workspaces.find((item) => item.id === workspace.id)).toMatchObject({
      id: workspace.id,
      courseId: course.id,
      instructor: 'Emily Weber, PhD',
      meetingDays: 'Tue · Thurs',
      meetingTime: '10:00 AM–11:15 AM',
      location: 'Coker Hall, Room 104',
    })
    expect({ courses: out.courses.length, workspaces: out.academics.classCenter.workspaces.length, assignments: out.academics.classCenter.assignments.length }).toEqual(counts)
    expect(out.academics.classCenter.assignments.filter((item) => item.courseId === course.id).map((item) => item.id)).toEqual(linkedIds)
    expect(migrateClassIdentityV43(out)).toBe(out)
  })
})

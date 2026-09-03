import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateClassIdentityV46 } from './classIdentityV46'

describe('migrateClassIdentityV46', () => {
  it('upgrades an existing class to the full identity contract without replacing linked records', () => {
    const existing = structuredClone(createSeedData())
    const workspace = existing.academics.classCenter.workspaces[0]
    const course = existing.courses.find((item) => item.id === workspace.courseId)!
    const contact = existing.academics.classCenter.contacts[0]
    const linkedIds = existing.academics.classCenter.assignments
      .filter((item) => item.courseId === course.id)
      .map((item) => item.id)

    course.code = 'biol103'
    course.title = 'HOW CELLS FUNCTION'
    course.term = 'fall   2026'
    workspace.instructor = 'Professor: Dr. Emily Weber (she/her)'
    workspace.meetingDays = 'TTH'
    workspace.meetingTime = '12:30pm - 1:45pm'
    workspace.location = 'Wilson Hall, Rm. 107'
    contact.name = 'Dr. Laura Ott'

    const before = structuredClone(existing)
    Object.freeze(existing)
    Object.freeze(existing.courses)
    Object.freeze(existing.academics)
    Object.freeze(existing.academics.classCenter)

    const out = migrateClassIdentityV46(existing)

    expect(out.courses.find((item) => item.id === course.id)).toMatchObject({
      id: course.id,
      code: 'BIOL 103',
      title: 'How Cells Function',
      term: 'Fall 2026',
    })
    expect(out.academics.classCenter.workspaces.find((item) => item.id === workspace.id)).toMatchObject({
      id: workspace.id,
      courseId: course.id,
      instructor: 'Emily Weber',
      meetingDays: 'Tue · Thurs',
      meetingTime: '12:30 PM–1:45 PM',
      location: 'Wilson Hall, Room 107',
    })
    expect(out.academics.classCenter.contacts.find((item) => item.id === contact.id)).toMatchObject({
      id: contact.id,
      name: 'Laura Ott',
    })
    expect(out.academics.classCenter.assignments.filter((item) => item.courseId === course.id).map((item) => item.id)).toEqual(linkedIds)
    expect(existing).toEqual(before)
    expect(migrateClassIdentityV46(out)).toBe(out)
  })
})

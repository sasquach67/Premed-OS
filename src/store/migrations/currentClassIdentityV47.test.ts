import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateCurrentClassIdentityV47 } from './currentClassIdentityV47'

describe('migrateCurrentClassIdentityV47', () => {
  it('updates current classes in place while preserving linked work', () => {
    const existing = structuredClone(createSeedData())
    const workspace = existing.academics.classCenter.workspaces[0]
    const course = existing.courses.find((item) => item.id === workspace.courseId)!
    const linkedAssignment = existing.academics.classCenter.assignments.find((item) => item.courseId === course.id)
    const linkedFile = existing.academics.classCenter.files.find((item) => item.courseId === course.id)

    course.code = 'biol103'
    course.title = 'HOW CELLS FUNCTION'
    workspace.instructor = 'Dr. Emily Weber'
    workspace.meetingDays = 'TTH'
    workspace.meetingTime = '12:30pm - 1:45pm'
    workspace.location = 'Wilson Hall Rm. 107'

    const out = migrateCurrentClassIdentityV47(existing)

    expect(out.courses.find((item) => item.id === course.id)).toMatchObject({
      id: course.id,
      code: 'BIOL 103',
      title: 'How Cells Function',
    })
    expect(out.academics.classCenter.workspaces.find((item) => item.id === workspace.id)).toMatchObject({
      id: workspace.id,
      courseId: course.id,
      instructor: 'Emily Weber',
      meetingDays: 'Tue · Thurs',
      meetingTime: '12:30 PM–1:45 PM',
      location: 'Wilson Hall, Room 107',
    })
    expect(out.academics.classCenter.assignments.find((item) => item.id === linkedAssignment?.id)).toBe(linkedAssignment)
    expect(out.academics.classCenter.files.find((item) => item.id === linkedFile?.id)).toBe(linkedFile)
    expect(migrateCurrentClassIdentityV47(out)).toBe(out)
  })
})

import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateCourseTitleV45 } from './courseTitleV45'

describe('migrateCourseTitleV45', () => {
  it('renames an existing ENGL 105 class without replacing it or linked work', () => {
    const existing = structuredClone(createSeedData())
    const course = existing.courses.find((item) => item.code === 'ENGL 105')!
    course.title = 'ENG COMP & RHETORIC'
    const linkedIds = existing.academics.classCenter.assignments
      .filter((item) => item.courseId === course.id)
      .map((item) => item.id)

    const out = migrateCourseTitleV45(existing)

    expect(out.courses.find((item) => item.id === course.id)).toMatchObject({
      id: course.id,
      code: 'ENGL 105',
      title: 'English Composition & Rhetoric',
    })
    expect(out.academics.classCenter.assignments.filter((item) => item.courseId === course.id).map((item) => item.id)).toEqual(linkedIds)
    expect(migrateCourseTitleV45(out)).toBe(out)
  })
})

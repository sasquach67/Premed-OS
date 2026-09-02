import type { AppData } from '@/lib/types'
import { normalizeCourseTitle } from '@/lib/academics/classIdentity'

/** Applies preferred display titles to existing classes without replacing
 * course ids or anything linked to them. */
export function migrateCourseTitleV45(data: AppData): AppData {
  let changed = false
  const courses = data.courses.map((course) => {
    const title = normalizeCourseTitle(course.title, course.code)
    if (title === course.title) return course
    changed = true
    return { ...course, title }
  })
  return changed ? { ...data, courses } : data
}

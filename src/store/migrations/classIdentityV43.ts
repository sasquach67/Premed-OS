import type { AppData } from '@/lib/types'
import {
  normalizeClassTerm,
  normalizeClassWorkspaceIdentity,
  normalizeCourseCode,
  normalizeCourseTitle,
} from '@/lib/academics/classIdentity'

/** Canonicalizes existing class identity fields in place without replacing a
 * course or any records linked to its id. */
export function migrateClassIdentityV43(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  let changed = false
  const courses = data.courses.map((course) => {
    const code = normalizeCourseCode(course.code)
    const next = {
      ...course,
      code,
      title: normalizeCourseTitle(course.title, code),
      term: normalizeClassTerm(course.term),
    }
    if (next.code === course.code && next.title === course.title && next.term === course.term) return course
    changed = true
    return next
  })
  const workspaces = center.workspaces.map((workspace) => {
    const next = normalizeClassWorkspaceIdentity(workspace)
    if (
      next.instructor === workspace.instructor
      && next.meetingDays === workspace.meetingDays
      && next.meetingTime === workspace.meetingTime
      && next.location === workspace.location
    ) return workspace
    changed = true
    return next
  })
  if (!changed) return data
  return {
    ...data,
    courses,
    academics: {
      ...data.academics,
      classCenter: { ...center, workspaces },
    },
  }
}

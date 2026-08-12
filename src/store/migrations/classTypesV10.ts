/* v10 — class study-layer configuration.
 *
 * The class type controls only which shared hub tools are visible. It never
 * changes Course fields or removes topic/review data. Existing workspaces get
 * a conservative type from the course code, then BCPM/topic history; all
 * legacy study records remain available if the student switches back.
 */
import type { AppData, ClassWorkspace, ClassWorkspaceType, Course } from '@/lib/types'

const WRITING_CODE = /^(ENGL|WRIT|COMP|RHET|LIT)\b/i

function inferredType(workspace: ClassWorkspace, course: Course | undefined, topicCourseIds: Set<string>): ClassWorkspaceType {
  if (workspace.type === 'stem' || workspace.type === 'writing' || workspace.type === 'general') return workspace.type
  if (course && WRITING_CODE.test(course.code)) return 'writing'
  if (course?.bcpm || topicCourseIds.has(workspace.courseId)) return 'stem'
  return 'general'
}

/** Pure, idempotent, and lossless: only additive arrays and the view selector. */
export function migrateClassTypesV10(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const byCourse = new Map(data.courses.map((course) => [course.id, course]))
  const topicCourseIds = new Set((center.topics ?? []).map((topic) => topic.courseId))
  const workspaces = (center.workspaces ?? []).map((workspace) => {
    const type = inferredType(workspace, byCourse.get(workspace.courseId), topicCourseIds)
    return workspace.type === type ? workspace : { ...workspace, type }
  })
  const hasArrays = Array.isArray(center.paperDrafts) && Array.isArray(center.assignedReadings) && Array.isArray(center.feedbackNotes)
  const changed = workspaces.some((workspace, index) => workspace !== center.workspaces[index])
  if (!changed && hasArrays) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        workspaces,
        paperDrafts: center.paperDrafts ?? [],
        assignedReadings: center.assignedReadings ?? [],
        feedbackNotes: center.feedbackNotes ?? [],
      },
    },
  }
}

import type { AppData } from '@/lib/types'

/**
 * v34 adds the explicit evidence boundary for Writing reading lists. Existing
 * classes may have some rows from a syllabus or manual entry, but the app has
 * no evidence that the list is complete, so `unknown` is the only honest
 * backwards-compatible default.
 */
export function migrateWritingEvidenceV34(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center || !Array.isArray(center.workspaces)) return data
  const workspaces = center.workspaces.map((workspace) =>
    workspace.readingListState ? workspace : { ...workspace, readingListState: 'unknown' as const },
  )
  if (workspaces.every((workspace, index) => workspace === center.workspaces[index])) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, workspaces },
    },
  }
}

import type { LectureRecord } from '@/lib/types'

/** Class dates are student-entered calendar dates, never import or edit times. */
export function notebookCatalogDate(lecture: LectureRecord): Date | null {
  const day = lecture.occurredOn
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const date = new Date(`${day}T12:00:00`)
  return Number.isFinite(date.getTime()) && date.getFullYear() === Number(day.slice(0, 4)) && date.getMonth() + 1 === Number(day.slice(5, 7)) && date.getDate() === Number(day.slice(8, 10)) ? date : null
}

/** Editing a notebook does not change when it was added. */
export function notebookAddedDate(lecture: LectureRecord): Date | null {
  for (const timestamp of [lecture.importedNotebook?.importedAt, lecture.importedStudyPackage?.importedAt, lecture.createdAt]) {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) continue
    const date = new Date(timestamp)
    if (Number.isFinite(date.getTime())) return date
  }
  return null
}

export function compareNotebookCatalogDates(a: LectureRecord, b: LectureRecord): number {
  const left = notebookCatalogDate(a)?.getTime() ?? Infinity
  const right = notebookCatalogDate(b)?.getTime() ?? Infinity
  if (left !== right) return left < right ? -1 : 1
  const leftAdded = notebookAddedDate(a)?.getTime() ?? Infinity
  const rightAdded = notebookAddedDate(b)?.getTime() ?? Infinity
  if (leftAdded !== rightAdded) return leftAdded < rightAdded ? -1 : 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Negative ranks are explicit manual order; legacy nonnegative ranks stay date-sorted. */
export function isNotebookManualOrder(lectures: readonly LectureRecord[], courseId?: string): boolean {
  return lectures.some(lecture => (courseId === undefined || lecture.courseId === courseId) && Number.isFinite(lecture.order) && lecture.order < 0)
}

export function sortNotebookLectures(lectures: readonly LectureRecord[], courseId?: string): LectureRecord[] {
  const rows = lectures.filter(lecture => courseId === undefined || lecture.courseId === courseId)
  return rows.sort((a, b) => {
    const aManual = Number.isFinite(a.order) && a.order < 0
    const bManual = Number.isFinite(b.order) && b.order < 0
    if (aManual !== bManual) return aManual ? -1 : 1
    if (aManual && a.order !== b.order) return a.order - b.order
    return compareNotebookCatalogDates(a, b)
  })
}

/** Mutates only the requested course's existing order fields, suitable for a store draft. */
export function setNotebookManualOrder(lectures: LectureRecord[], courseId: string, orderedIds: readonly string[]): void {
  const rows = sortNotebookLectures(lectures, courseId)
  const byId = new Map(rows.map(lecture => [lecture.id, lecture]))
  const ordered: LectureRecord[] = []
  for (const id of orderedIds) {
    const lecture = byId.get(id)
    if (lecture) { ordered.push(lecture); byId.delete(id) }
  }
  ordered.push(...rows.filter(lecture => byId.has(lecture.id)))
  ordered.forEach((lecture, index) => { lecture.order = index - ordered.length })
}

export function resetNotebookOrder(lectures: LectureRecord[], courseId: string): void {
  lectures.filter(lecture => lecture.courseId === courseId).sort(compareNotebookCatalogDates).forEach((lecture, index) => { lecture.order = index })
}

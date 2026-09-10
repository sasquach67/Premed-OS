import type { LectureRecord } from '@/lib/types'

/** The same date drives both the catalog row and its default order. */
export function notebookCatalogDate(lecture: LectureRecord): Date | null {
  const notebook = lecture.importedNotebook
  const timestamp = notebook ? notebook.editedAt ?? notebook.importedAt : undefined
  if (notebook) {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return null
    const date = new Date(timestamp)
    return Number.isFinite(date.getTime()) ? date : null
  }
  if (!lecture.occurredOn) return null
  const day = lecture.occurredOn.slice(0, 10)
  const date = new Date(`${day}T12:00:00`)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(date.getTime()) ? date : null
}

export function compareNotebookCatalogDates(a: LectureRecord, b: LectureRecord): number {
  const left = notebookCatalogDate(a)?.getTime() ?? -Infinity
  const right = notebookCatalogDate(b)?.getTime() ?? -Infinity
  if (left !== right) return left > right ? -1 : 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

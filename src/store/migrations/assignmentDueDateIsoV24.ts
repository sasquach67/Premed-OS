import type { AppData } from '@/lib/types'
import { toIsoDate } from '@/lib/academics/syllabusParser'

/**
 * v24 repairs assignment due dates that the syllabus importer stored as
 * display text.
 *
 * Until Aug 20 2026 the importer wrote `item.value` straight through, so a
 * parsed `September 8, 2026` was saved verbatim while the rest of the app
 * stores `yyyy-MM-dd`. `date.ts` reads dates with `iso.slice(0, 10)`, turning
 * those into Invalid Date: the assignment rendered as `Date TBD`, produced no
 * countdown, never reached the Attention bell, and sorted by month NAME.
 *
 * Lossless and idempotent. A value already ISO is left alone, and one that
 * cannot be parsed is KEPT AS WRITTEN rather than dropped or guessed at — a
 * date we cannot read is still the student's record of one, and erasing it
 * would lose information the "Date TBD" row at least admits to.
 *
 * The year is taken from the value itself; the importer only ever wrote a
 * bare `Oct 6` when the document had no year anywhere, and this migration has
 * no document to consult, so those stay untouched for the student to fix.
 */
export function migrateAssignmentDueDateIsoV24(data: AppData): AppData {
  const center = data.academics?.classCenter
  const assignments = center?.assignments
  if (!center || !Array.isArray(assignments) || assignments.length === 0) return data

  let changed = false
  const repaired = assignments.map((assignment) => {
    const due = assignment.dueDate
    if (!due || /^\d{4}-\d{2}-\d{2}$/.test(due)) return assignment
    const iso = toIsoDate(due.trim())
    if (!iso) return assignment
    changed = true
    return { ...assignment, dueDate: iso }
  })
  if (!changed) return data

  return {
    ...data,
    academics: { ...data.academics, classCenter: { ...center, assignments: repaired } },
  }
}

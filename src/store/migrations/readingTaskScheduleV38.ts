import type { AppData } from '@/lib/types'
import { readingTaskDueDate } from '@/lib/academics/readingSchedule'
import { syllabusReadingSourceKey } from '@/lib/academics/syllabusReimport'

/**
 * v38 separates the source-backed class/discussion date from the actionable
 * reading deadline. It changes only untouched parser-generated tasks; a
 * student-edited deadline no longer equals its linked reading's class date and
 * is therefore preserved.
 */
export function migrateReadingTaskScheduleV38(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data

  const classDateByTaskKey = new Map<string, string>(center.assignedReadings.flatMap((reading) => {
    if (!reading.dueForDiscussion) return []
    const readingKey = reading.syllabusSourceKey
      ?? syllabusReadingSourceKey(reading.title, reading.week, reading.dueForDiscussion)
    return [[`reading-calendar:${readingKey}`, reading.dueForDiscussion] as const]
  }))

  let changed = false
  const assignments = center.assignments.map((assignment) => {
    const classDate = assignment.syllabusSourceKey
      ? classDateByTaskKey.get(assignment.syllabusSourceKey)
      : undefined
    if (!classDate || assignment.type !== 'reading' || assignment.dueDate !== classDate) return assignment
    const dueDate = readingTaskDueDate(classDate)
    if (!dueDate || dueDate === classDate) return assignment
    changed = true
    const notes = assignment.notes?.replace(
      /^Due for the scheduled class on \d{4}-\d{2}-\d{2}\./,
      `Task due ${dueDate}; scheduled class ${classDate}.`,
    )
    return { ...assignment, dueDate, notes }
  })

  if (!changed) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, assignments },
    },
  }
}

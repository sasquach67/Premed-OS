const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * A syllabus reading date describes the class/discussion that needs it.
 * The actionable task belongs on the preceding calendar day so the student
 * sees the work before class, while the reading record keeps the source date.
 */
export function readingTaskDueDate(classDate?: string) {
  if (!classDate || !ISO_DAY.test(classDate)) return classDate
  const point = new Date(`${classDate}T00:00:00Z`)
  if (Number.isNaN(point.getTime()) || point.toISOString().slice(0, 10) !== classDate) return classDate
  point.setUTCDate(point.getUTCDate() - 1)
  return point.toISOString().slice(0, 10)
}

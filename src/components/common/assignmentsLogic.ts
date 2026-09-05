import type { ClassAssignment, ClassAssignmentStatus } from '@/lib/types'

export type AssignmentBucketId = 'overdue' | 'today' | 'this-week' | 'next-week' | 'later' | 'completed'

const COMPLETED = new Set<ClassAssignmentStatus>(['submitted', 'graded'])

function isoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function localDate(iso?: string) {
  if (!iso) return null
  const value = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return Number.isNaN(value.getTime()) ? null : value
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfWeek(date: Date) {
  return addDays(startOfDay(date), -date.getDay())
}

export function assignmentBucket(assignment: ClassAssignment, today = startOfDay()): AssignmentBucketId {
  if (COMPLETED.has(assignment.status)) return 'completed'
  const due = localDate(assignment.dueDate)
  if (!due) return 'later'
  if (due < today) return 'overdue'
  if (isoDate(due) === isoDate(today)) return 'today'
  const thisWeekEnd = addDays(startOfWeek(today), 7)
  if (due < thisWeekEnd) return 'this-week'
  const nextWeekEnd = addDays(thisWeekEnd, 7)
  if (due < nextWeekEnd) return 'next-week'
  return 'later'
}

export function workloadLabel(total: number) {
  if (total <= 0) return 'Free'
  if (total < 10) return 'Light'
  if (total <= 30) return 'Busy'
  return 'Heavy'
}

export function assignmentWorkload(items: readonly Pick<ClassAssignment, 'weight'>[]) {
  const total = items.reduce((sum, item) => sum + (item.weight ?? 0), 0)
  const unknown = items.filter((item) => item.weight == null).length
  return {
    total, unknown,
    label: !items.length ? 'Free' : unknown || total === 0 ? `${items.length} due` : workloadLabel(total),
  }
}

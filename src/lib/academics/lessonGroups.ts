import type { SyllabusScheduleEntry } from '@/lib/types'
import { topicOf } from './classDays'

/**
 * The Lessons tab (Andy picked the Oct 18 design, Oct 20 2026): one row per
 * syllabus lesson, grouped under the exam that tests it.
 */
export interface LessonRow {
  lesson: number
  /** Syllabus topic, without a bare "Lesson N" or "Chapter N" prefix. */
  title?: string
  /** Every class date of the lesson, ISO yyyy-mm-dd, oldest first. */
  dates: string[]
}

export interface LessonExam {
  id: string
  title: string
  date?: string
  scope?: { lessons?: string[]; cumulative?: boolean }
}

export interface LessonGroup {
  key: string
  name: string
  date?: string
  /** True when the exam is cumulative; the group then holds only lessons new since the last exam. */
  cumulative?: boolean
  lessons: LessonRow[]
}

/** Lessons from the syllabus schedule. Rows without a lesson number are numbered in order. */
export function buildLessons(schedule: SyllabusScheduleEntry[] = []): LessonRow[] {
  const rows = new Map<number, LessonRow>()
  const ordered = [...schedule].sort((a, b) => (a.startDate ?? '9').localeCompare(b.startDate ?? '9') || a.order - b.order)
  let next = 1
  for (const entry of ordered) {
    const lesson = entry.lesson ?? next
    next = Math.max(next, lesson + 1)
    const dates = (entry.dates?.length ? entry.dates : entry.startDate ? [entry.startDate] : []).map((d) => d.slice(0, 10))
    const row = rows.get(lesson) ?? { lesson, dates: [] }
    row.title ??= topicOf(entry.label)
    row.dates = [...new Set([...row.dates, ...dates])].sort()
    rows.set(lesson, row)
  }
  return [...rows.values()].sort((a, b) => a.lesson - b.lesson)
}

/** Lesson numbers named by an exam's scope ("Lesson 9", "Lessons 9-15", "Lesson 10 & 11"). */
export function scopeLessonNumbers(scope?: LessonExam['scope']): number[] {
  const out = new Set<number>()
  for (const label of scope?.lessons ?? []) {
    const range = label.match(/(\d+)\s*[-–]\s*(\d+)/)
    if (range) for (let n = +range[1]; n <= +range[2]; n++) out.add(n)
    else for (const n of label.match(/\d+/g) ?? []) out.add(+n)
  }
  return [...out]
}

/**
 * Each lesson belongs to exactly one group: the first exam, in date order,
 * whose scope names it. A cumulative exam claims only lessons no earlier exam
 * claimed. A lesson no scope names joins the first exam dated after it. With
 * no exams, everything is one group.
 */
export function groupLessonsByExam(lessons: LessonRow[], exams: LessonExam[]): LessonGroup[] {
  const sorted = [...exams].sort((a, b) => (a.date ?? '9').localeCompare(b.date ?? '9'))
  if (!sorted.length) return lessons.length ? [{ key: 'all', name: 'All lessons', lessons }] : []
  const groups: LessonGroup[] = sorted.map((exam) => ({ key: exam.id, name: exam.title, date: exam.date, cumulative: exam.scope?.cumulative || undefined, lessons: [] }))
  const named = sorted.map((exam) => new Set(scopeLessonNumbers(exam.scope)))
  for (const row of lessons) {
    let at = sorted.findIndex((exam, i) => !exam.scope?.cumulative && named[i].has(row.lesson))
    if (at < 0) {
      const last = row.dates[row.dates.length - 1]
      at = last ? sorted.findIndex((exam) => exam.date !== undefined && exam.date >= last) : -1
    }
    if (at < 0) at = named.findIndex((set) => set.has(row.lesson))
    if (at < 0) at = groups.length - 1
    groups[at].lessons.push(row)
  }
  return groups.filter((group) => group.lessons.length)
}

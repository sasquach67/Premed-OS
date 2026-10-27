import type { ExamScope, LectureRecord, SyllabusScheduleEntry } from '@/lib/types'
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
  /** The syllabus unit the lesson sits under, e.g. "Unit 2: How cells control division". */
  unit?: string
}

export interface LessonExam {
  id: string
  title: string
  date?: string
  scope?: ExamScope
}

export interface LessonGroup {
  key: string
  name: string
  date?: string
  /** True when the exam is cumulative; the group then holds only lessons new since the last exam. */
  cumulative?: boolean
  /** True when the student set which lessons this exam covers. */
  edited?: boolean
  lessons: LessonRow[]
}

/** Lessons from the syllabus schedule. Rows without a lesson number are numbered in order. */
export function buildLessons(schedule: SyllabusScheduleEntry[] = []): LessonRow[] {
  const rows = new Map<number, LessonRow>()
  // When the syllabus numbers or dates its lessons, an entry with neither is a
  // heading or note (an undated "Unit 1: …" line), not a lesson.
  const structured = schedule.some((e) => e.lesson !== undefined || e.startDate || e.dates?.length)
  const entries = structured ? schedule.filter((e) => e.lesson !== undefined || e.startDate || e.dates?.length) : schedule
  const ordered = [...entries].sort((a, b) => (a.startDate ?? '9').localeCompare(b.startDate ?? '9') || a.order - b.order)
  let next = 1
  for (const entry of ordered) {
    const lesson = entry.lesson ?? next
    next = Math.max(next, lesson + 1)
    const dates = (entry.dates?.length ? entry.dates : entry.startDate ? [entry.startDate] : []).map((d) => d.slice(0, 10))
    const row = rows.get(lesson) ?? { lesson, dates: [] }
    row.title ??= topicOf(entry.label)
    row.unit ??= entry.unit
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
 * Each lesson belongs to exactly one group. A range the student set on the
 * Lessons tab wins first, and an edited exam holds only its range. Then the
 * first exam, in date order, whose scope names it; a cumulative exam claims
 * only lessons no earlier exam claimed. A lesson no scope names joins the
 * first unedited exam dated after it. With no exams, everything is one group.
 */
export function groupLessonsByExam(lessons: LessonRow[], exams: LessonExam[]): LessonGroup[] {
  const sorted = [...exams].sort((a, b) => (a.date ?? '9').localeCompare(b.date ?? '9'))
  if (!sorted.length) return lessons.length ? [{ key: 'all', name: 'All lessons', lessons }] : []
  const edited = sorted.map((exam) => Boolean(exam.scope?.studentEdit))
  const groups: LessonGroup[] = sorted.map((exam, i) => ({ key: exam.id, name: exam.title, date: exam.date, cumulative: exam.scope?.cumulative || undefined, edited: edited[i] || undefined, lessons: [] }))
  const named = sorted.map((exam) => new Set(scopeLessonNumbers(exam.scope)))
  const lastAuto = edited.lastIndexOf(false)
  for (const row of lessons) {
    let at = named.findIndex((set, i) => edited[i] && set.has(row.lesson))
    if (at < 0) at = sorted.findIndex((exam, i) => !edited[i] && !exam.scope?.cumulative && named[i].has(row.lesson))
    if (at < 0) {
      const last = row.dates[row.dates.length - 1]
      at = last ? sorted.findIndex((exam, i) => !edited[i] && exam.date !== undefined && exam.date >= last) : -1
    }
    if (at < 0) at = named.findIndex((set, i) => !edited[i] && set.has(row.lesson))
    if (at < 0) at = lastAuto >= 0 ? lastAuto : groups.length - 1
    groups[at].lessons.push(row)
  }
  // An edited exam stays even when empty, so the student can change it back.
  return groups.filter((group) => group.lessons.length || group.edited)
}

/** A lesson range as a scope label: "Lesson 7" or "Lessons 7–11". */
export const lessonRangeLabel = (first: number, last: number) => first === last ? `Lesson ${first}` : `Lessons ${first}–${last}`

/**
 * The scope after the student sets an exam's lessons to `first`–`last`. The
 * syllabus's own list is kept so `autoExamScope` can bring it back, and
 * `cumulative` is left as it was. When the range starts at the first real
 * lesson, an introduction day (lesson 0) comes with it, as the header hides it.
 */
export function editedExamScope(scope: ExamScope | undefined, first: number, last: number, lessons: LessonRow[] = [], now = Date.now()): ExamScope {
  const lo = Math.min(first, last), hi = Math.max(first, last)
  const firstReal = lessons.find((row) => row.lesson > 0)?.lesson
  const start = lo === firstReal && lessons.some((row) => row.lesson === 0) ? 0 : lo
  const syllabusLessons = scope?.studentEdit ? scope.studentEdit.syllabusLessons : scope?.lessons
  return {
    ...scope,
    lessons: [lessonRangeLabel(start, hi)],
    studentEdit: { ...(syllabusLessons ? { syllabusLessons } : {}), editedAt: now },
  }
}

/** The scope with the student's range undone: back to the syllabus's own lessons. */
export function autoExamScope(scope: ExamScope | undefined): ExamScope | undefined {
  if (!scope?.studentEdit) return scope
  const { studentEdit, lessons: _edited, ...rest } = scope
  return { ...rest, ...(studentEdit.syllabusLessons ? { lessons: studentEdit.syllabusLessons } : {}) }
}

/**
 * A reading that is only a lesson's own textbook chapter ("Chapter 6 ·
 * Learning", due on a Learning class day) is that lesson, not a reading of its
 * own: the lesson's notebook already covers it. PSYC 101 lists one beside every
 * class, and Andy said the Readings group they made is unnecessary (Oct 27
 * 2026). The parser drops them on import; this drops ones saved before that.
 */
export function isLessonChapter(title: string, due: string | undefined, lessons: LessonRow[]): boolean {
  const chapter = title.trim().match(/^(?:chapter|ch\.?)\s*(\d+)\s*(?:[·:\-–—]\s*(.+))?$/i)
  const row = chapter && lessons.find((r) => r.lesson === Number(chapter[1]))
  if (!row) return false
  const norm = (text: string) => text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
  return Boolean(due && row.dates.includes(due.slice(0, 10))) || Boolean(chapter[2] && row.title && norm(chapter[2]) === norm(row.title))
}

/**
 * A lesson's notebook (one per lesson, Andy Oct 20 2026): the notebook saved
 * for that lesson; else, for older notebooks, one dated on any of the
 * lesson's class days (after the student's changes) or titled "Lesson N".
 */
export function findLessonNotebook<T extends Pick<LectureRecord, 'lesson' | 'occurredOn' | 'title'>>(notebooks: T[], lesson: number, dates: string[]): T | undefined {
  return notebooks.find((n) => n.lesson === lesson)
    ?? notebooks.find((n) => n.lesson === undefined && n.occurredOn && dates.includes(n.occurredOn.slice(0, 10)))
    ?? notebooks.find((n) => n.lesson === undefined && new RegExp(`\\blesson\\s*${lesson}\\b`, 'i').test(n.title))
}

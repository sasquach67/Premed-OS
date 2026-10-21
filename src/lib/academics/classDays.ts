import type { SyllabusScheduleEntry } from '@/lib/types'

/**
 * Class days (Andy, Oct 19 2026): the Overview shows only the days a class
 * meets, a week at a time, numbered as lectures, with exams in place. Each day
 * carries a three-stage checklist (Prime, Learn, Retain) that the student
 * ticks; having a file never ticks a row.
 *
 * Dates come from the syllabus schedule (per-lesson rows carry every class
 * date since PR #42). A week-based schedule gives one date per week, so its
 * class days are generated from the meeting days inside each listed week.
 */
export interface ClassDay {
  /** ISO date, yyyy-mm-dd. */
  date: string
  kind: 'class' | 'exam'
  /** Running count of class meetings, 1-based; absent on exam days. */
  lecture?: number
  lesson?: number
  /** Syllabus topic for the day, without a bare "Lesson N" label. */
  topic?: string
  examTitle?: string
  examId?: string
  /** 1-based week of term, counted from the Monday of the first class day. */
  week: number
  /** True on a lesson's second (or later) class day. */
  continued?: boolean
  /** Every lesson this class covers; usually one, two when a class covers two. */
  lessons?: number[]
  /** The lesson the syllabus set for this class, when the student changed it. */
  syllabusLesson?: number
  /** The student marked this class cancelled. */
  cancelled?: boolean
}

/** What the student changed on one class (Oct 2026): which lessons it covered, or that it was cancelled. */
export interface ClassDayOverride { lessons?: number[]; cancelled?: boolean }

export interface ClassDayExam { id: string; title: string; date: string }

const DAY_INDEX: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, thurs: 4, fri: 5, sat: 6, sun: 0 }
const DAY_MS = 86_400_000

export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function dateOf(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function mondayOf(iso: string): Date {
  const d = dateOf(iso)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/** Weekdays (0–6) from the workspace's normalized meeting days ("Tue · Thurs"). */
export function meetingWeekdays(meetingDays?: string): number[] {
  if (!meetingDays || /\b(?:alternating|every\s+other)\b/i.test(meetingDays)) return []
  return [...new Set(meetingDays.split(/[^A-Za-z]+/).map((t) => DAY_INDEX[t.toLowerCase()]).filter((d) => d !== undefined))].sort()
}

const BARE_LABEL = /^(?:lessons?|lectures?|week|class|session|unit|module)\s*#?\s*\d+(?:\s*(?:&|and|[-–])\s*\d+)?\s*[:.\-–—]?\s*$/i

export function topicOf(label: string): string | undefined {
  const t = label.trim()
  if (!t || BARE_LABEL.test(t)) return undefined
  // "Chapter 10 Human Development" reads as "Human Development": the day is
  // already numbered as a lecture, and two numbers in one title confuse.
  return t.replace(/^(?:lessons?|lectures?|class|session)\s*#?\s*\d+(?:\s*(?:&|and)\s*\d+)?\s*[:.\-–—]\s*/i, '')
    .replace(/^(?:chapters?|chs?\.?)\s*\d+(?:\s*(?:&|and|[-–])\s*\d+)?\s*[:.\-–—]?\s+(?=\S)/i, '').trim() || undefined
}

function entryDates(entry: SyllabusScheduleEntry): string[] {
  if (entry.dates?.length) return entry.dates.map((d) => d.slice(0, 10))
  return entry.startDate ? [entry.startDate.slice(0, 10)] : []
}

/**
 * Build the class days. Returns [] when nothing is dated, so the caller can
 * show its empty state.
 */
export function buildClassDays({ schedule = [], meetingDays, exams = [], overrides = {} }: {
  schedule?: SyllabusScheduleEntry[]
  meetingDays?: string
  exams?: ClassDayExam[]
  /** Per-date changes the student made with the pencil; the syllabus is never rewritten. */
  overrides?: Record<string, ClassDayOverride>
}): ClassDay[] {
  const weekdays = meetingWeekdays(meetingDays)
  const dated = schedule.filter((e) => entryDates(e).length).sort((a, b) => entryDates(a)[0].localeCompare(entryDates(b)[0]) || a.order - b.order)
  const perClass = dated.some((e) => e.lesson !== undefined || (e.dates?.length ?? 0) > 1)
  const days = new Map<string, { lesson?: number; topic?: string }>()

  if (perClass || !weekdays.length) {
    for (const e of dated) for (const d of entryDates(e)) if (!days.has(d)) days.set(d, { lesson: e.lesson, topic: topicOf(e.label) })
  } else {
    // Week schedule: one entry per week, class days are the meeting days inside it.
    dated.forEach((e, i) => {
      const start = mondayOf(entryDates(e)[0])
      const next = dated[i + 1] ? mondayOf(entryDates(dated[i + 1])[0]) : new Date(start.getTime() + 7 * DAY_MS)
      const stop = Math.min(next.getTime(), start.getTime() + 7 * DAY_MS)
      for (let d = new Date(start); d.getTime() < stop; d.setDate(d.getDate() + 1)) {
        if (weekdays.includes(d.getDay()) && !days.has(isoDay(d))) days.set(isoDay(d), { topic: topicOf(e.label) })
      }
    })
  }
  if (!days.size) return []

  const examOn = new Map(exams.filter((x) => x.date).map((x) => [x.date.slice(0, 10), x]))
  const all = [...new Set([...days.keys(), ...examOn.keys()])].sort()
  const first = mondayOf(all[0]).getTime()
  const seenLesson = new Set<number>()
  let lecture = 0
  return all.map((date): ClassDay => {
    const week = Math.round((mondayOf(date).getTime() - first) / (7 * DAY_MS)) + 1
    const exam = examOn.get(date)
    if (exam) return { date, kind: 'exam', examTitle: exam.title, examId: exam.id, week }
    const info = days.get(date) ?? {}
    const change = overrides[date]
    lecture += 1
    if (change?.cancelled) return { date, kind: 'class', lecture, week, cancelled: true, topic: info.topic, ...(info.lesson !== undefined ? { syllabusLesson: info.lesson } : {}) }
    const lessons = change?.lessons?.length ? [...new Set(change.lessons)].sort((x, y) => x - y) : info.lesson !== undefined ? [info.lesson] : []
    const changed = Boolean(change?.lessons?.length) && lessons.join() !== String(info.lesson ?? '')
    const continued = lessons.length === 1 && seenLesson.has(lessons[0])
    lessons.forEach((l) => seenLesson.add(l))
    return {
      date, kind: 'class', lecture, week, lesson: lessons[0], lessons,
      // A changed class shows its own lessons, so the syllabus topic would mislead.
      topic: changed ? undefined : info.topic,
      ...(continued ? { continued } : {}),
      ...(changed && info.lesson !== undefined ? { syllabusLesson: info.lesson } : {}),
    }
  })
}

/** Lessons whose class dates are known, for the pencil's choices. */
export function lessonNumbers(days: ClassDay[]): number[] {
  return [...new Set(days.flatMap((d) => d.kind === 'class' ? [...(d.lessons ?? []), ...(d.syllabusLesson !== undefined ? [d.syllabusLesson] : [])] : []))].sort((a, b) => a - b)
}

/** Every class date a lesson is taught on, after the student's changes. */
export function lessonDates(days: ClassDay[], lesson: number): string[] {
  return days.filter((d) => d.kind === 'class' && !d.cancelled && d.lessons?.includes(lesson)).map((d) => d.date)
}

export interface ChecklistStage { name: string; when: string; items: readonly { id: string; label: string }[] }

/** The checklist, in three stages. Every item is something the student does. */
export const CLASS_DAY_STAGES: readonly ChecklistStage[] = [
  { name: 'Prime', when: 'before class', items: [{ id: 'prime', label: 'Do the before-class work' }] },
  { name: 'Learn', when: 'in and after class', items: [{ id: 'attend', label: 'Go to class and take notes' }, { id: 'notebook', label: 'Work through the notebook' }] },
  { name: 'Retain', when: 'within 2 days', items: [{ id: 'cards', label: 'Do today’s Anki reviews' }, { id: 'practice', label: 'Do the practice set' }] },
] as const

export const EXAM_DAY_STAGES: readonly ChecklistStage[] = [
  { name: 'Prepare', when: 'before', items: [{ id: 'mock', label: 'Take a mock exam' }] },
  { name: 'Sit it', when: 'in class', items: [{ id: 'sat', label: 'Exam taken' }] },
  { name: 'Review', when: 'after', items: [{ id: 'review', label: 'Go over what you missed' }] },
] as const

/** "Lesson 14 — Gene Expression" → "Gene Expression", so a class day reads
 * "Lecture 18 — Gene Expression" and never names two numbers. */
export function lessonlessTitle(title: string): string {
  return title.replace(/^(?:lessons?|lectures?|week|class)\s*#?\s*\d+(?:\s*(?:&|and|[-–])\s*\d+)?\s*[—–:\-·.]\s*/i, '').trim() || title
}

export type StageState = 'done' | 'part' | 'late' | 'open' | 'locked'

export function stagesFor(day: ClassDay): readonly ChecklistStage[] {
  if (day.kind === 'exam') return EXAM_DAY_STAGES
  if ((day.lessons?.length ?? 0) < 2) return CLASS_DAY_STAGES
  // A class that covers two lessons works through each lesson's notebook.
  return CLASS_DAY_STAGES.map((stage) => stage.name !== 'Learn' ? stage : {
    ...stage,
    items: [stage.items[0], ...day.lessons!.map((l) => ({ id: `notebook-${l}`, label: `Work through the Lesson ${l} notebook` }))],
  })
}

/**
 * State of each stage on one day. "late" only marks days the student was
 * tracking (on or after `trackedFrom`), so adding a class mid-term does not
 * paint every earlier lecture as missed.
 */
export function stageStates(day: ClassDay, checked: readonly string[], today: string, trackedFrom?: string): StageState[] {
  const past = day.date < today
  const tracked = !trackedFrom || day.date >= trackedFrom
  const daysSince = (dateOf(today).getTime() - dateOf(day.date).getTime()) / DAY_MS
  return stagesFor(day).map((stage, i) => {
    const on = stage.items.filter((item) => checked.includes(item.id)).length
    if (on === stage.items.length) return 'done'
    // Prime and Learn are late the day after class; Retain after its two days.
    if (past && tracked && day.kind === 'class' && (i < 2 || daysSince > 2)) return 'late'
    if (on) return 'part'
    return i === 0 || past || day.kind === 'exam' ? 'open' : 'locked'
  })
}

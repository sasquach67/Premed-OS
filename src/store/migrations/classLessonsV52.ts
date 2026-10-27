import { lessonSchedule } from '@/lib/academics/classDays'
import type { AppData, SyllabusScheduleEntry } from '@/lib/types'

/**
 * A class schedule saved before lessons were grouped (PR #42, Oct 19 2026)
 * has one entry per class date and no lesson numbers. The Lessons tab numbered
 * those dates in order, so PSYC 101 showed "Lesson 8 — Learning" and "Lesson 9
 * — Learning" and Exam 1 took Lessons 1–9. Andy chose to number by chapter to
 * match his class folders (Oct 27 2026): rewrite the schedule as lessons once,
 * and move every number saved against the old rows with it, so each notebook
 * stays on its lesson (or, when its own title names its lesson, on that one).
 * A notebook started from old row 8 (the 9/10 Learning
 * class) moves to Lesson 6, Learning. A number whose class day is no lesson
 * now (a break) is cleared; that notebook is then matched by date or title,
 * as notebooks without a number always were. Idempotent: a rewritten schedule
 * has lesson numbers, which `lessonSchedule` leaves alone.
 */
export function migrateClassLessonsV52(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center?.workspaces?.length) return data
  const moves = new Map<string, (old: number, title: string) => number | undefined>()
  const workspaces = center.workspaces.map((workspace) => {
    const saved = workspace.syllabusSchedule
    const lessons = lessonSchedule(saved)
    if (!saved || lessons === saved) return workspace
    const move = renumbering(saved, lessons)
    moves.set(workspace.courseId, move)
    const overrides = workspace.classDayOverrides && Object.fromEntries(Object.entries(workspace.classDayOverrides).map(([date, change]) =>
      [date, change.lessons ? { ...change, lessons: [...new Set(change.lessons.map((n) => move(n, '')).filter((n): n is number => n !== undefined))] } : change]))
    return { ...workspace, syllabusSchedule: lessons, ...(overrides ? { classDayOverrides: overrides } : {}) }
  })
  if (!moves.size) return data
  const lectures = center.lectures.map((lecture) => {
    const move = lecture.lesson !== undefined ? moves.get(lecture.courseId) : undefined
    if (!move) return lecture
    const { lesson: old, ...rest } = lecture
    const lesson = move(old!, lecture.title)
    return lesson === undefined ? rest : { ...rest, lesson }
  })
  return { ...data, academics: { ...data.academics, classCenter: { ...center, workspaces, lectures } } }
}

/** Old row number → new lesson, through the class date the old row stood for. */
function renumbering(saved: SyllabusScheduleEntry[], lessons: SyllabusScheduleEntry[]) {
  // The rows as the Lessons tab numbered them: dated entries in date order, from 1.
  const oldRows = saved.filter((e) => e.startDate || e.dates?.length)
    .sort((a, b) => (a.startDate ?? '9').localeCompare(b.startDate ?? '9') || a.order - b.order)
  const norm = (text: string) => text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
  return (old: number, title: string) => {
    const row = oldRows[old - 1]
    // A notebook titled for its own lesson ("Lesson 1 — Foundations of
    // Psychology", saved from old row 1, Class Introduction) keeps that lesson,
    // unless the title only repeats the old row ("Lesson 8 — Learning").
    const named = title.match(/^lesson\s*(\d+)\s*[—–:\-·.]\s*(.+)$/i)
    if (named && lessons.some((l) => l.lesson === Number(named[1])) && (!row || norm(named[2]) !== norm(row.label))) return Number(named[1])
    const date = (row?.dates?.[0] ?? row?.startDate)?.slice(0, 10)
    return date ? lessons.find((l) => l.dates?.includes(date))?.lesson : undefined
  }
}

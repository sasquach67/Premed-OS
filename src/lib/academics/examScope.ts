import type { SyllabusItem, SyllabusProposal } from '@/lib/academics/syllabusParser'
import type { ClassAssignment, ClassCenterData, SyllabusScheduleEntry } from '@/lib/types'

/** The per-lesson facts a schedule unit carries into `syllabusSchedule`. */
export function lessonFields(item: SyllabusItem): Pick<SyllabusScheduleEntry, 'lesson' | 'dates' | 'objectives'> {
  return {
    ...(item.lesson != null ? { lesson: item.lesson } : {}),
    ...(item.dates?.length ? { dates: item.dates } : {}),
    ...(item.objectives?.length ? { objectives: item.objectives } : {}),
  }
}

const lessonNumber = (unit: SyllabusItem) => unit.lesson ?? (/^Lesson\s+(\d+)$/i.test(unit.label) ? Number(unit.label.replace(/\D+/g, '')) : undefined)

/** An exam's stated scope as the assignment stores it (D9b stage 4). Lessons
 *  are kept as the schedule's own labels, because at first import a class has
 *  no topics yet and topic ids alone would lose "lessons 1–7" on the day it was
 *  read. `coveredTopicIds` is filled wherever a topic already matches a lesson
 *  by its scheduled date or its `Lesson N` title; a cumulative exam covers every
 *  topic and every lesson up to its date. */
export function examScopeFromSyllabus(center: ClassCenterData, courseId: string, proposal: SyllabusProposal, item: SyllabusItem): Pick<ClassAssignment, 'examScope' | 'coveredTopicIds'> {
  if (item.kind !== 'exams' || !item.scope) return {}
  const schedule = proposal.items.filter((unit) => unit.kind === 'units' && lessonNumber(unit) != null)
  const numbers = item.scope.cumulative
    ? schedule.filter((unit) => !item.value || !unit.value || unit.value <= item.value).map((unit) => lessonNumber(unit) as number)
    : item.scope.lessons ?? []
  const wanted = new Set(numbers)
  const lessons = [...wanted].sort((left, right) => left - right).map((number) => `Lesson ${number}`)
  const lessonDates = new Set(schedule
    .filter((unit) => wanted.has(lessonNumber(unit) as number))
    .flatMap((unit) => unit.dates ?? (unit.value ? [unit.value] : [])))
  const topics = center.topics.filter((topic) => topic.courseId === courseId)
  const covered = item.scope.cumulative
    ? topics.map((topic) => topic.id)
    : topics.filter((topic) => (topic.scheduledFor && lessonDates.has(topic.scheduledFor.slice(0, 10)))
      || lessons.some((label) => new RegExp(`^${label}\\b`, 'i').test(topic.title))).map((topic) => topic.id)
  return {
    examScope: { ...(lessons.length ? { lessons } : {}), ...(item.scope.cumulative !== undefined ? { cumulative: item.scope.cumulative } : {}) },
    ...(covered.length ? { coveredTopicIds: covered } : {}),
  }
}

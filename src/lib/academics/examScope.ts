import type { SyllabusItem, SyllabusProposal } from '@/lib/academics/syllabusParser'
import type { ClassAssignment, ClassCenterData } from '@/lib/types'

/** An exam's stated scope as the assignment stores it (D9b stage 4). Lessons
 *  are kept as the schedule's own labels, because at first import a class has
 *  no topics yet and topic ids alone would lose "lessons 1–7" on the day it was
 *  read. `coveredTopicIds` is filled wherever a topic already matches a lesson
 *  by its scheduled date or its `Lesson N` title; a cumulative exam covers every
 *  topic and every lesson up to its date. */
export function examScopeFromSyllabus(center: ClassCenterData, courseId: string, proposal: SyllabusProposal, item: SyllabusItem): Pick<ClassAssignment, 'examScope' | 'coveredTopicIds'> {
  if (item.kind !== 'exams' || !item.scope) return {}
  const schedule = proposal.items.filter((unit) => unit.kind === 'units' && /^Lesson\s+\d+$/i.test(unit.label))
  const numbers = item.scope.cumulative
    ? schedule.filter((unit) => !item.value || !unit.value || unit.value <= item.value).map((unit) => Number(unit.label.replace(/\D+/g, '')))
    : item.scope.lessons ?? []
  const lessons = [...new Set(numbers)].sort((left, right) => left - right).map((number) => `Lesson ${number}`)
  const lessonDates = new Set(schedule.filter((unit) => lessons.includes(unit.label)).map((unit) => unit.value).filter((value): value is string => Boolean(value)))
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

import { GRADE_POINTS } from '@/lib/selectors'
import { daysUntil } from '@/lib/date'
import type {
  Course,
  CollectionRecord,
  ExperienceCategory,
  ExperienceEntry,
  TaskHorizon,
  TaskItem,
  TimelineMilestone,
} from '@/lib/types'

const NON_GPA = new Set(['', 'P', 'NP', 'IP'])

export interface TermGpaPoint {
  term: string
  cumulative: number
  science: number | null
}

export function termGpaSeries(courses: Course[]): TermGpaPoint[] {
  const orderedTerms: string[] = []
  const byTerm = new Map<string, Course[]>()

  for (const course of courses) {
    if (!course.inResidence || NON_GPA.has(course.grade) || GRADE_POINTS[course.grade] == null) continue
    if (!byTerm.has(course.term)) {
      orderedTerms.push(course.term)
      byTerm.set(course.term, [])
    }
    byTerm.get(course.term)?.push(course)
  }

  let allQp = 0
  let allCredits = 0
  let scienceQp = 0
  let scienceCredits = 0

  return orderedTerms.map((term) => {
    for (const course of byTerm.get(term) ?? []) {
      const credits = course.credits || 0
      const points = GRADE_POINTS[course.grade] * credits
      allQp += points
      allCredits += credits
      if (course.bcpm) {
        scienceQp += points
        scienceCredits += credits
      }
    }
    return {
      term,
      cumulative: allCredits ? allQp / allCredits : 0,
      science: scienceCredits ? scienceQp / scienceCredits : null,
    }
  })
}

/** A progress surface exists only when both a standing target and a real
 * recorded value exist. Undefined keeps insufficient/no-target rows dormant
 * instead of drawing an empty bar that reads as zero progress. */
export function goalProgress(current: number, goal?: number): number | undefined {
  if (!(current > 0) || !(goal && goal > 0)) return undefined
  return Math.min(100, (current / goal) * 100)
}

export type OverviewTaskTab = TaskHorizon | 'done'

/** Dated work becomes actionable during its final week. The stored horizon is
 * still meaningful for undated tasks, but it must not leave a months-away
 * deadline in Now or hide an approaching deadline in Soon. */
export const OVERVIEW_NOW_WINDOW_DAYS = 7

export function overviewTaskTab(task: TaskItem): OverviewTaskTab {
  if (task.progress === 'Finished') return 'done'
  const days = daysUntil(task.deadline)
  if (days != null) return days <= OVERVIEW_NOW_WINDOW_DAYS ? 'now' : 'soon'
  // A missing date is still a present commitment. Keep its chosen horizon,
  // defaulting unsorted work to Now.
  return task.horizon ?? 'now'
}

export function overviewTasks(tasks: CollectionRecord<TaskItem>[], tab: OverviewTaskTab): CollectionRecord<TaskItem>[] {
  return tasks
    .filter((task) => !task.deletedAt && !task.timelineMilestoneId)
    .filter((task) => tab === 'done' ? task.progress === 'Finished' : !task.archived && task.progress !== 'Finished')
    .filter((task) => overviewTaskTab(task) === tab)
    .sort((a, b) => {
      const importance = Number(Boolean(b.important)) - Number(Boolean(a.important))
      if (importance) return importance
      if (a.deadline && b.deadline) {
        const deadline = a.deadline.localeCompare(b.deadline)
        if (deadline) return deadline
      } else if (a.deadline) return -1
      else if (b.deadline) return 1
      return a.order - b.order
    })
}

export interface RoadmapMilestone {
  id: string
  label: string
  target?: string
  detail?: string
  implementationTaskId?: string
  route: string
  state: 'done' | 'current' | 'future'
}

/** One canonical Timeline projection. No title parsing or generic routing:
 * every compact card returns to the Timeline record that owns it. */
export function roadmapMilestones(items: CollectionRecord<TimelineMilestone>[]): RoadmapMilestone[] {
  const milestones = items
    .filter((milestone) => !milestone.deletedAt)
    .sort((a, b) => {
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate)
      if (a.targetDate) return -1
      if (b.targetDate) return 1
      return a.order - b.order
    })

  const currentId = milestones.find((milestone) => !milestone.completed)?.id
  return milestones.map((milestone) => ({
    id: milestone.id,
    label: milestone.title,
    target: milestone.targetDate,
    detail: milestone.detail,
    implementationTaskId: milestone.implementationTaskId,
    route: '/timeline',
    state: milestone.completed ? 'done' : milestone.id === currentId ? 'current' : 'future',
  }))
}

/** Aggregate experience rows do not contain dated activity. Keep pace dormant
 * until the hour-log model can supply real dated entries. */
export function observedWeeklyHours(_entries: CollectionRecord<ExperienceEntry>[], _category: ExperienceCategory): number | null {
  return null
}

export function latestExperienceLabel(entries: CollectionRecord<ExperienceEntry>[]): string | null {
  // A position start date is not the date on which its aggregate hours happened.
  void entries
  return null
}

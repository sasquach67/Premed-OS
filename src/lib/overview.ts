import { GRADE_POINTS } from '@/lib/selectors'
import type {
  Course,
  CollectionRecord,
  ExperienceCategory,
  ExperienceEntry,
  TaskHorizon,
  TaskItem,
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

export function overviewTaskTab(task: TaskItem): OverviewTaskTab {
  if (task.progress === 'Finished') return 'done'
  return task.horizon ?? (task.kanban === 'doing' || task.deadline ? 'now' : 'soon')
}

export function overviewTasks(tasks: CollectionRecord<TaskItem>[], tab: OverviewTaskTab): CollectionRecord<TaskItem>[] {
  return tasks
    .filter((task) => !task.deletedAt && !task.milestone)
    .filter((task) => tab === 'done' ? task.progress === 'Finished' : !task.archived && task.progress !== 'Finished')
    .filter((task) => overviewTaskTab(task) === tab)
    .sort((a, b) => Number(Boolean(b.important)) - Number(Boolean(a.important)) || a.order - b.order)
}

export interface RoadmapMilestone {
  id: string
  label: string
  target?: string
  detail?: string
  route: string
  state: 'done' | 'current' | 'future'
}

function milestoneRoute(task: TaskItem) {
  const value = `${task.type} ${task.title}`.toLowerCase()
  if (value.includes('mcat')) return '/mcat'
  if (value.includes('letter') || value.includes('lor')) return '/letters'
  if (value.includes('essay') || value.includes('statement') || value.includes('secondary')) return '/essays'
  if (value.includes('school')) return '/schools'
  if (value.includes('course') || value.includes('gpa')) return '/academics'
  return '/timeline'
}

export function roadmapMilestones(tasks: CollectionRecord<TaskItem>[]): RoadmapMilestone[] {
  const milestones = tasks
    .filter((task) => task.milestone && !task.deletedAt)
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
      if (a.deadline) return -1
      if (b.deadline) return 1
      return a.order - b.order
    })

  const currentId = milestones.find((task) => task.progress !== 'Finished')?.id
  return milestones.map((task) => ({
    id: task.id,
    label: task.title,
    target: task.deadline,
    detail: task.notes,
    route: milestoneRoute(task),
    state: task.progress === 'Finished' ? 'done' : task.id === currentId ? 'current' : 'future',
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

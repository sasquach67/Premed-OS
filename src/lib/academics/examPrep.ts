import type {
  AcademicFile, ClassAssignment, ExamPrepIntensity, ExamPrepPlan, ExamPrepPlanItem, Topic,
} from '@/lib/types'

export type ExamPrepDormantReason = 'exam-date' | 'exam-scope' | 'study-material'

export interface ExamPrepBuildResult {
  plan: ExamPrepPlan | null
  dormant: ExamPrepDormantReason[]
}

interface BuildExamPrepPlanInput {
  id: string
  courseId: string
  exam: ClassAssignment
  topics: Topic[]
  assignments: ClassAssignment[]
  files: AcademicFile[]
  intensity: ExamPrepIntensity
  now?: number
}

interface CatchUpProposal {
  missedItemIds: string[]
  unscheduledItemIds: string[]
}

function isoDate(timestamp: number) {
  const date = new Date(timestamp)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function addDays(date: string, amount: number) {
  const point = new Date(`${date}T12:00:00`)
  point.setDate(point.getDate() + amount)
  return isoDate(point.getTime())
}

function datesBefore(examDate: string, today: string) {
  const dates: string[] = []
  for (let cursor = today; cursor < examDate; cursor = addDays(cursor, 1)) dates.push(cursor)
  return dates
}

function plannedDates(examDate: string, today: string, itemCount: number, intensity: ExamPrepIntensity) {
  const available = datesBefore(examDate, today)
  if (!available.length) return []
  if (intensity === 'accelerated') {
    const firstDays = available.slice(0, Math.min(3, available.length))
    return Array.from({ length: itemCount }, (_, index) => firstDays[index % firstDays.length])
  }
  if (itemCount === 1) return [available[0]]
  return Array.from({ length: itemCount }, (_, index) => available[Math.round(index * (available.length - 1) / (itemCount - 1))])
}

/**
 * Builds only from actual class records. There is intentionally no time,
 * workload, outcome estimate, or percentage: none of those inputs exists here.
 */
export function buildExamPrepPlan(input: BuildExamPrepPlanInput): ExamPrepBuildResult {
  const now = input.now ?? Date.now()
  const dormant: ExamPrepDormantReason[] = []
  if (!input.exam.dueDate) return { plan: null, dormant: ['exam-date'] }

  const scopeIds = new Set(input.exam.coveredTopicIds ?? [])
  if (!scopeIds.size) dormant.push('exam-scope')

  const scopeTopics = input.topics.filter((topic) => scopeIds.has(topic.id))
  const linkedFiles = input.files.filter((file) => file.linkedTopicIds.some((id) => scopeIds.has(id)))
  const linkedAssignments = input.assignments.filter((assignment) =>
    assignment.id !== input.exam.id
      && assignment.status !== 'graded'
      && assignment.status !== 'dropped'
      && assignment.linkedTopicIds.some((id) => scopeIds.has(id)),
  )

  if (!scopeTopics.length && !linkedFiles.length && !linkedAssignments.length) dormant.push('study-material')

  const sources: Array<Omit<ExamPrepPlanItem, 'id' | 'plannedDate' | 'order' | 'state' | 'createdAt' | 'updatedAt'>> = [
    ...scopeTopics.map((topic) => ({ owner: 'topic' as const, topicId: topic.id })),
    ...linkedAssignments.map((assignment) => ({ owner: 'assignment' as const, assignmentId: assignment.id })),
    ...linkedFiles.map((file) => ({ owner: 'file' as const, fileId: file.id })),
  ]
  const dates = plannedDates(input.exam.dueDate, isoDate(now), sources.length, input.intensity)
  const items = sources.map((source, order) => ({
    id: `${input.id}-item-${order}`,
    ...source,
    plannedDate: dates[order] ?? input.exam.dueDate!,
    order,
    state: 'planned' as const,
    createdAt: now,
    updatedAt: now,
  }))

  return {
    dormant,
    plan: {
      id: input.id,
      courseId: input.courseId,
      examAssignmentId: input.exam.id,
      intensity: input.intensity,
      items,
      createdAt: now,
      updatedAt: now,
    },
  }
}

/** Catch-up is a proposal. It never changes plan data until the student applies it. */
export function getCatchUpProposal(plan: ExamPrepPlan, today = isoDate(Date.now())): CatchUpProposal | null {
  const missed = plan.items.filter((item) => item.state === 'planned' && item.plannedDate < today)
  if (!missed.length) return null
  return { missedItemIds: missed.map((item) => item.id), unscheduledItemIds: missed.map((item) => item.id) }
}

export function applyCatchUpProposal(plan: ExamPrepPlan, proposal: CatchUpProposal, now = Date.now()): ExamPrepPlan {
  const ids = new Set(proposal.missedItemIds)
  if (!ids.size) return plan
  return {
    ...plan,
    updatedAt: now,
    items: plan.items.map((item) => ids.has(item.id) && item.state === 'planned'
      ? { ...item, state: 'missed' as const, missedAt: now, updatedAt: now }
      : item),
  }
}

export function closeExamPrepPlan(plan: ExamPrepPlan, input: { returnedGrade?: string; feedback?: string }, now = Date.now()): ExamPrepPlan {
  return {
    ...plan,
    returnedGrade: input.returnedGrade?.trim() || undefined,
    feedback: input.feedback?.trim() || undefined,
    closedAt: now,
    updatedAt: now,
  }
}

export const examPrepDates = { isoDate }

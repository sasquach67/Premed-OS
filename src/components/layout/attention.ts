/* Part 5 — the unified attention model.
 *
 * ONE deterministic source, three feeds (shell §7.5): deadlines · data-health ·
 * system. The attention bell, the LiveStatusChip, and the review queue all read
 * from here, so a warning can never say one thing in the bell and another in
 * the chip.
 *
 * Severity vocabulary is general.md's blocking / important / suggested, which
 * maps architecture/02's notification thresholds: Critical → blocking,
 * Important → important, Helpful/Informational → suggested.
 */
import type { AppData, ClassAssignment, TaskItem } from '@/lib/types'
import { dataHealthWarnings } from '@/lib/intelligence/dataHealth'
import { dedupCandidates } from '@/lib/intelligence/dedup'
import type { Severity } from '@/lib/intelligence/types'

export type AttentionSource = 'deadline' | 'data-health' | 'system'
/** Alias kept so existing call sites read naturally; the vocabulary is shared. */
export type AttentionPriority = Severity

export interface AttentionItem {
  id: string
  source: AttentionSource
  priority: AttentionPriority
  title: string
  /** Plain-language reason — every item explains itself (architecture/02). */
  why: string
  route: string
  actionLabel: string
  date?: string
  daysLeft?: number
}

export type AttentionFeed = (data: AppData) => AttentionItem[]

const SEVERITY_ORDER: Record<AttentionPriority, number> = { blocking: 0, important: 1, suggested: 2 }

function dayStart(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function deadlineItem(task: TaskItem, today: Date): AttentionItem | null {
  if (task.archived || task.progress === 'Finished' || !task.deadline) return null
  const deadline = dayStart(new Date(`${task.deadline}T00:00:00`))
  const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86_400_000)
  if (daysLeft > 10) return null
  const priority: AttentionPriority = daysLeft < 0 ? 'blocking' : daysLeft <= 2 ? 'important' : 'suggested'
  const why = daysLeft < 0
    ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`
    : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
  return { id: `deadline:${task.id}`, source: 'deadline', priority, title: task.title, why, route: '/timeline', actionLabel: 'Open task', date: task.deadline, daysLeft }
}

/** Finished or abandoned work can't be due. */
const CLOSED_ASSIGNMENT_STATUS = new Set<ClassAssignment['status']>(['submitted', 'graded', 'dropped'])

/** Class assignments carry real deadlines, so they belong in attention.
 *  They deliberately do NOT join Home's to-do widget — that widget stays
 *  `data.tasks` only; coursework reaches the user through the bell. */
function assignmentDeadlineItem(
  assignment: ClassAssignment, courseLabel: string, today: Date,
): AttentionItem | null {
  if (!assignment.dueDate || CLOSED_ASSIGNMENT_STATUS.has(assignment.status)) return null
  const deadline = dayStart(new Date(`${assignment.dueDate}T00:00:00`))
  const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86_400_000)
  if (daysLeft > 10) return null
  const priority: AttentionPriority = daysLeft < 0 ? 'blocking' : daysLeft <= 2 ? 'important' : 'suggested'
  const when = daysLeft < 0
    ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`
    : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
  return {
    id: `deadline:assignment:${assignment.id}`,
    source: 'deadline',
    priority,
    title: assignment.title,
    why: courseLabel ? `${when} · ${courseLabel}` : when,
    route: '/academics?tab=assignments',
    actionLabel: 'Open assignment',
    date: assignment.dueDate,
    daysLeft,
  }
}

export const deadlinesFeed: AttentionFeed = (data) => {
  const today = dayStart(new Date())
  const courseLabel = new Map(
    (data.courses ?? []).map((course) => [course.id, course.code || course.title || '']),
  )
  const assignments = data.academics?.classCenter?.assignments ?? []
  return [
    ...data.tasks.map((task) => deadlineItem(task, today)),
    ...assignments.map((assignment) =>
      assignmentDeadlineItem(assignment, courseLabel.get(assignment.courseId) ?? '', today)),
  ]
    .filter((item): item is AttentionItem => Boolean(item))
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
}

/** Feed 2 — per-entity data-health warnings from the rules engine. */
export const dataHealthFeed: AttentionFeed = (data) =>
  dataHealthWarnings(data).map((warning) => ({
    id: warning.id,
    source: 'data-health' as const,
    priority: warning.severity,
    title: warning.entityLabel,
    why: warning.why,
    route: warning.route,
    actionLabel: warning.actionLabel,
  }))

/** Feed 3 — system state (backup off, sync/backup failure). */
export const systemFeed: AttentionFeed = (data) => {
  const items: AttentionItem[] = []
  const { backup } = data.settings
  if (!backup.enabled) {
    items.push({
      id: 'system:backup-off',
      source: 'system',
      priority: 'suggested',
      title: 'Backup is off',
      why: 'Your data lives only in this browser, so clearing site data would lose it.',
      route: '/settings',
      actionLabel: 'Open settings',
    })
  }
  if (backup.lastError) {
    items.push({
      id: 'system:backup-error',
      source: 'system',
      priority: 'important',
      title: 'Backup failed',
      why: `The last backup didn't complete: ${backup.lastError}`,
      route: '/settings',
      actionLabel: 'Open settings',
    })
  }
  return items
}

/** The single unified model. `extraFeeds` remains open so future sources
 *  (pending imports, unlinked files) plug in without reshaping this contract. */
export function buildAttention(data: AppData, extraFeeds: AttentionFeed[] = []): AttentionItem[] {
  const now = Date.now()
  return [deadlinesFeed, dataHealthFeed, systemFeed, ...extraFeeds]
    .flatMap((feed) => feed(data))
    .filter((item) => (data.settings.attentionSnoozedUntil[item.id] ?? 0) <= now)
    .sort((a, b) => SEVERITY_ORDER[a.priority] - SEVERITY_ORDER[b.priority])
}

export function attentionStatus(items: AttentionItem[], backupEnabled: boolean) {
  const blocking = items.filter((item) => item.priority === 'blocking').length
  const important = items.filter((item) => item.priority === 'important').length
  if (blocking) return { label: `${blocking} overdue`, tone: 'alert' as const }
  if (important) return { label: `${important} due soon`, tone: 'due' as const }
  if (!backupEnabled) return { label: 'Backup off', tone: 'system' as const }
  return { label: 'All clear', tone: 'clear' as const }
}

export type ReviewQueueKind = 'attention' | 'duplicate'

export interface ReviewQueueItem {
  id: string
  kind: ReviewQueueKind
  priority: AttentionPriority
  title: string
  why: string
  route: string
  actionLabel: string
  /** Present on duplicate rows only — the one genuinely uncertain check. */
  confidence?: 'high' | 'moderate' | 'low'
  /** Present on duplicate rows only — what a merge would need to reconcile. */
  differingFields?: string[]
}

/** The review queue (general.md): everything needing a decision, in one list.
 *
 *  Today it merges the attention model with duplicate candidates. Overdue
 *  tasks, missing data, stale records, and sync conflicts already arrive via
 *  the three feeds; pending imports and unlinked files join the same shape when
 *  those systems ship — no redesign required (shell §7.5).
 *
 *  Exposed as a tested selector now; the dedicated route renders it later. */
export function attentionReviewQueue(data: AppData): ReviewQueueItem[] {
  const fromAttention: ReviewQueueItem[] = buildAttention(data).map((item) => ({
    id: item.id,
    kind: 'attention',
    priority: item.priority,
    title: item.title,
    why: item.why,
    route: item.route,
    actionLabel: item.actionLabel,
  }))

  const now = Date.now()
  const fromDuplicates: ReviewQueueItem[] = dedupCandidates(data)
    .filter((candidate) => (data.settings.attentionSnoozedUntil[candidate.id] ?? 0) <= now)
    .map((candidate) => ({
      id: candidate.id,
      kind: 'duplicate' as const,
      priority: 'suggested' as const,
      title: `${candidate.left.label} · ${candidate.right.label}`,
      why: candidate.why,
      route: candidate.route,
      actionLabel: 'Review',
      confidence: candidate.confidence,
      differingFields: candidate.differingFields,
    }))

  return [...fromAttention, ...fromDuplicates]
    .sort((a, b) => SEVERITY_ORDER[a.priority] - SEVERITY_ORDER[b.priority])
}

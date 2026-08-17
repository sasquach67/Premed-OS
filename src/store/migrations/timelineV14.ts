import type { AppData, TimelineMilestone } from '@/lib/types'

/** v14 separates legacy task-backed roadmap nodes into Timeline-owned records.
 * It is deliberately additive: the source task survives, receives only a
 * stable relationship id, and every visible legacy field is copied verbatim. */
export function migrateTimelineV14(data: AppData): AppData {
  const existing = Array.isArray(data.timelineMilestones) ? data.timelineMilestones : []
  const byLegacyTask = new Map(existing.filter((milestone) => milestone.legacyTaskId).map((milestone) => [milestone.legacyTaskId!, milestone]))
  const timelineMilestones = [...existing]
  let nextOrder = timelineMilestones.reduce((max, milestone) => Math.max(max, milestone.order ?? -1), -1) + 1
  let added = !Array.isArray(data.timelineMilestones)

  const tasks = data.tasks.map((task) => {
    if (!task.milestone) return task
    const id = task.timelineMilestoneId ?? byLegacyTask.get(task.id)?.id ?? `timeline-milestone-${task.id}`
    if (!byLegacyTask.has(task.id)) {
      const milestone: TimelineMilestone = {
        id,
        title: task.title,
        targetDate: task.deadline,
        detail: task.notes,
        completed: task.progress === 'Finished',
        legacyTaskId: task.id,
        order: nextOrder++,
      }
      timelineMilestones.push(milestone)
      byLegacyTask.set(task.id, milestone)
      added = true
    }
    return task.timelineMilestoneId === id ? task : { ...task, timelineMilestoneId: id }
  })

  const tasksChanged = tasks.some((task, index) => task !== data.tasks[index])
  if (!added && !tasksChanged) return data
  return { ...data, tasks, timelineMilestones }
}

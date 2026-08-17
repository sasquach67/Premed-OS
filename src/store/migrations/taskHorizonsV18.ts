import type { AppData } from '@/lib/types'

/**
 * v18 corrects the former implicit default for undated, unfinished tasks.
 * Before the Now/Soon split was clarified, those rows were persisted as Soon
 * even though the student had not chosen a due date. A dated task and a
 * finished task retain their existing horizon because each carries separate
 * evidence for its placement. The rewrite is idempotent.
 */
export function migrateTaskHorizonsV18(data: AppData): AppData {
  let changed = false
  const tasks = data.tasks.map((task) => {
    if (task.horizon !== 'soon' || task.deadline || task.progress === 'Finished') return task
    changed = true
    return { ...task, horizon: 'now' as const }
  })

  return changed ? { ...data, tasks } : data
}

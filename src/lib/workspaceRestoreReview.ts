import type { AppData } from './types'
import { KNOWN_WORKSPACE_KEYS, mergeRestoredWorkspace } from './workspaceSchema'

const labels: Partial<Record<keyof AppData, string>> = {
  experienceHourEntries: 'Experience hours', timelineMilestones: 'Timeline milestones',
  interviewQs: 'Interview questions', focusTargets: 'Focus targets', quarterlyGoals: 'Quarterly goals',
  advisingQs: 'Advising questions', notePages: 'Note pages', mcat: 'MCAT', meta: 'Workspace details',
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

type Counts = { added: number; changed: number; removed: number }
function recordChanges(before: unknown, after: unknown): Counts {
  if (Array.isArray(before) || Array.isArray(after)) {
    const records = (value: unknown) => new Map((Array.isArray(value) ? value : []).flatMap(row =>
      row && typeof row === 'object' && typeof row.id === 'string' ? [[row.id, row] as const] : []))
    const oldRecords = records(before), newRecords = records(after)
    return {
      added: [...newRecords.keys()].filter(id => !oldRecords.has(id)).length,
      removed: [...oldRecords.keys()].filter(id => !newRecords.has(id)).length,
      changed: [...newRecords.keys()].filter(id => oldRecords.has(id) && !same(oldRecords.get(id), newRecords.get(id))).length,
    }
  }
  const oldObject = before && typeof before === 'object' ? before as Record<string, unknown> : {}
  const newObject = after && typeof after === 'object' ? after as Record<string, unknown> : {}
  return [...new Set([...Object.keys(oldObject), ...Object.keys(newObject)])].reduce((total, key) => {
    const next = recordChanges(oldObject[key], newObject[key])
    return { added: total.added + next.added, changed: total.changed + next.changed, removed: total.removed + next.removed }
  }, { added: 0, changed: 0, removed: 0 })
}

/** Review only known sections: opaque data is retained without rendering its contents. */
export function workspaceRestoreReview(current: AppData, incoming: AppData): string[] {
  const restored = mergeRestoredWorkspace(current, incoming)
  return KNOWN_WORKSPACE_KEYS.flatMap(key => {
    const before = current[key], after = restored[key]
    if (same(before, after)) return []
    const label = labels[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
    const { added, changed, removed } = recordChanges(before, after)
    if (added || changed || removed) return [`${label}: ${added} added, ${changed} changed, ${removed} removed.`]
    return [`${label}: saved details or order replaced.`]
  })
}

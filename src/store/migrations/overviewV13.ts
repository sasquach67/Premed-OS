import type { AppData } from '@/lib/types'

/** v13 makes a quarterly goal's presentation explicit without re-reading its prose.
 * Existing target links are already structured evidence for measured treatment; all
 * other legacy goals remain manual check-offs. */
export function migrateOverviewV13(data: AppData): AppData {
  const quarterlyGoals = data.quarterlyGoals.map((goal) => {
    if (goal.kind === 'check-off' || goal.kind === 'measured') return goal
    return { ...goal, kind: goal.standingTarget ? 'measured' as const : 'check-off' as const }
  })
  return quarterlyGoals.some((goal, index) => goal !== data.quarterlyGoals[index])
    ? { ...data, quarterlyGoals }
    : data
}

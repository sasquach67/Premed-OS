import type { AppData } from '@/lib/types'

/** v16 introduces only an optional TimelineMilestone field. Existing records
 * already retain unknown fields losslessly, so this migration is intentionally
 * a pure no-op: no relationship can be inferred from legacy data. */
export function migrateRoadmapTaskLinkV16(data: AppData): AppData {
  return data
}

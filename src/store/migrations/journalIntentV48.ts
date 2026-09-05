import type { AppData } from '@/lib/types'

/** v48 adds optional journal intent and a materials-only input path. Existing
 * records deliberately retain absent intent: their lecture naming, sources,
 * and generated results must not be retroactively reclassified. No backfill
 * is needed for this additive schema; retaining identity is lossless. */
export function migrateJournalIntentV48(data: AppData): AppData {
  return data
}

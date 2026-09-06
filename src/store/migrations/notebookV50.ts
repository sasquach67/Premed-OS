import type { AppData } from '@/lib/types'

/** v50 adds optional notebookGoal and notebookGeneratedGoal. Do not backfill a
 * guessed purpose: older prompts, study intents, and generated artifacts remain
 * byte-for-byte intact. The composer resolves legacy goals only when resumed. */
export function migrateNotebookV50(data: AppData): AppData {
  return data
}

import type { AppData } from '@/lib/types'
/** v49 adds optional notebookRequest, notebookOutput, and notebookGeneratedRequest. Absence keeps the
 * existing lecture/journal behavior and every saved artifact unchanged. */
export function migrateNotebookV49(data: AppData): AppData { return data }

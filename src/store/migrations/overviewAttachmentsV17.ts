import type { AppData } from '@/lib/types'

/**
 * v17 adds an optional StoryEntry attachment reference. Nothing trustworthy can
 * be inferred for older records, so this migration is deliberately lossless.
 */
export function migrateOverviewAttachmentsV17(data: AppData): AppData {
  return data
}

import type { AppData } from '@/lib/types'

/**
 * v35 adds empty reviewed-backup-folder collections only. Existing materials
 * retain their current provenance and are never recast as folder imports.
 */
export function migrateWatchedNotesV35(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const hasSources = Array.isArray(center.watchedNoteSources)
  const hasProposals = Array.isArray(center.watchedNoteProposals)
  if (hasSources && hasProposals) return data

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        watchedNoteSources: hasSources ? center.watchedNoteSources : [],
        watchedNoteProposals: hasProposals ? center.watchedNoteProposals : [],
      },
    },
  }
}

import type { AppData } from '@/lib/types'

/** v26 adds an empty home only; existing notes are never recast as generated. */
export function migrateRevisedNotesV26(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center || Array.isArray(center.generatedRevisedNotes)) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, generatedRevisedNotes: [] },
    },
  }
}

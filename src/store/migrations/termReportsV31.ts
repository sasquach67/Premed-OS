import type { AppData } from '@/lib/types'

/**
 * v31 adds an empty collection for saved, evidence-led Term Reports.
 *
 * Reports are a reading of existing Academics history, so this migration never
 * tries to backfill a report, infer evidence, or touch any course record.
 */
export function migrateTermReportsV31(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center || Array.isArray(center.termReports)) return data

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        termReports: [],
      },
    },
  }
}

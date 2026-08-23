import type { AppData } from '@/lib/types'

/**
 * v33 creates the empty home for future, per-review retrievability calls.
 *
 * A historic review does not tell us what the scheduler predicted before it
 * happened, so it would be misleading to backfill this collection.
 */
export function migrateRetrievabilityPredictionsV33(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center || Array.isArray(center.retrievabilityPredictions)) return data

  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        retrievabilityPredictions: [],
      },
    },
  }
}

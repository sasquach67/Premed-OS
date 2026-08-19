import type { AppData } from '@/lib/types'

/**
 * v23 introduces `classCenter.savedPlans` (§4.1 plan comparison).
 *
 * Pure, idempotent, and empty: a saved plan is a snapshot the student chose to
 * take, and there is no honest way to reconstruct one they never took.
 */
export function migrateSavedPlansV23(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  if (Array.isArray(center.savedPlans)) return data
  return {
    ...data,
    academics: { ...data.academics, classCenter: { ...center, savedPlans: [] } },
  }
}

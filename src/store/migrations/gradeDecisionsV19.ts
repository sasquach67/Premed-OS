import type { AppData } from '@/lib/types'

/**
 * v19 introduces `classCenter.mistakes`, the store for student-marked mistake
 * causes (§4.1 #47/#48).
 *
 * Pure and idempotent, and deliberately empty-handed: it creates no mistake
 * record, infers no cause from a low score, and touches no existing field. A
 * mistake exists only because the student marked one.
 */
export function migrateGradeDecisionsV19(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  if (Array.isArray(center.mistakes)) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, mistakes: [] },
    },
  }
}

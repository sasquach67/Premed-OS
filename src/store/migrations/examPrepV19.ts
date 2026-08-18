import type { AppData } from '@/lib/types'

/** v19 gives every legacy class center an empty, additive Exam Prep home. */
export function migrateExamPrepV19(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center || Array.isArray(center.examPrepPlans)) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: { ...center, examPrepPlans: [] },
    },
  }
}

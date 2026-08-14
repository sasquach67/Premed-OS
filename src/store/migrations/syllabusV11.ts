import type { AppData } from '@/lib/types'

/** v11 is additive and lossless: a parked home for confirmed syllabus weights. */
export function migrateSyllabusV11(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center || Array.isArray(center.gradeCategories)) return data
  return {
    ...data,
    academics: { ...data.academics, classCenter: { ...center, gradeCategories: [] } },
  }
}

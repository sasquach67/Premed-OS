import type { AppData } from '@/lib/types'

/** v39 adds durable homes for the unit mastery map and question bank. */
export function migrateGeneratedUnitResourcesV39(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const needsOutlines = !Array.isArray(center.generatedMasteryOutlines)
  const needsBanks = !Array.isArray(center.generatedUnitQuestionBanks)
  if (!needsOutlines && !needsBanks) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        ...(needsOutlines ? { generatedMasteryOutlines: [] } : {}),
        ...(needsBanks ? { generatedUnitQuestionBanks: [] } : {}),
      },
    },
  }
}

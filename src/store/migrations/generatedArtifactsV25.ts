import type { AppData } from '@/lib/types'

/**
 * v25 adds empty homes for generated study artifacts. It is additive,
 * lossless, idempotent, and does not reinterpret any historic record.
 */
export function migrateGeneratedArtifactsV25(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  const needsDecks = !Array.isArray(center.generatedFlashcardDecks)
  const needsAttempts = !Array.isArray(center.generatedMockAttempts)
  if (!needsDecks && !needsAttempts) return data
  return {
    ...data,
    academics: {
      ...data.academics,
      classCenter: {
        ...center,
        ...(needsDecks ? { generatedFlashcardDecks: [] } : {}),
        ...(needsAttempts ? { generatedMockAttempts: [] } : {}),
      },
    },
  }
}

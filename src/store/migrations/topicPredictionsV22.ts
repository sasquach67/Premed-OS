import type { AppData } from '@/lib/types'

/**
 * v22 introduces `classCenter.topicPredictions` (§6.6 Predict).
 *
 * Pure, idempotent, and empty: a prediction is an expectation the student held
 * before a lecture, and one they never wrote cannot be reconstructed after it.
 */
export function migrateTopicPredictionsV22(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  if (Array.isArray(center.topicPredictions)) return data
  return {
    ...data,
    academics: { ...data.academics, classCenter: { ...center, topicPredictions: [] } },
  }
}

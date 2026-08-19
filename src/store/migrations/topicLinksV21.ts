import type { AppData } from '@/lib/types'

/**
 * v21 introduces `classCenter.topicLinks`, the store for the Connect step
 * (§6.6).
 *
 * Pure, idempotent, and empty-handed on purpose: it creates no link and infers
 * none from shared words, shared units, or shared MCAT categories. A link is a
 * claim the student made about their own knowledge, and one they did not make
 * is not recoverable by guessing.
 */
export function migrateTopicLinksV21(data: AppData): AppData {
  const center = data.academics?.classCenter
  if (!center) return data
  if (Array.isArray(center.topicLinks)) return data
  return {
    ...data,
    academics: { ...data.academics, classCenter: { ...center, topicLinks: [] } },
  }
}

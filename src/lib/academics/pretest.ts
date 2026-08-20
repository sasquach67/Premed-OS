/**
 * §6.6 Pretest — answering before you are taught.
 *
 * > Before a lecture is covered, serve 3–5 questions on that upcoming topic.
 * > **Getting them wrong is the point** — the *pretesting effect* means a failed
 * > attempt before instruction improves retention of the subsequent instruction
 * > more than reading alone.
 *
 * ⚠️ §6.6 is unusually blunt about the interface risk: *"The UI must say so
 * plainly, or users will read a 0/5 as failure and quit."* So there is no score
 * here, not even a private one — `recordPretest` writes a timestamp and nothing
 * else, and the surface leads with the mechanism rather than the result.
 *
 * ⚠️ *"it must not touch FSRS state or weak-topic flags."* A pretest is priming,
 * not assessment; letting it move a review schedule would make a deliberate
 * failure cost the student real scheduling.
 *
 * The questions are the class's own `KeyPoint` records, produced during
 * ingestion — this needs no generator.
 */
import type { KeyPoint, Topic, TopicStatus } from '@/lib/types'

/** Fewer than this is not a pretest, it is a question. */
export const MIN_PRETEST_PROMPTS = 3
export const MAX_PRETEST_PROMPTS = 5

const COVERED: TopicStatus[] = ['seen', 'notes-made', 'reviewing', 'ready']

export function canPretest(topic: Topic): boolean {
  if (COVERED.includes(topic.status)) return false
  return topic.pretestedAt == null
}

/**
 * The topic's own key points, capped at five.
 *
 * Returns none below the floor rather than padding from a neighbouring topic —
 * borrowing questions would be inventing what the lecture is about.
 */
export function pretestPrompts(
  topic: Topic,
  keyPoints: KeyPoint[],
  limit = MAX_PRETEST_PROMPTS,
): KeyPoint[] {
  const mine = keyPoints
    .filter((point) => point.topicId === topic.id)
    .sort((a, b) => a.order - b.order)
  if (mine.length < MIN_PRETEST_PROMPTS) return []
  return mine.slice(0, limit)
}

/** Marks the priming act done. Writes the timestamp and nothing else. */
export function recordPretest(topics: Topic[], topicId: string, now = Date.now()): Topic[] {
  return topics.map((topic) =>
    topic.id === topicId && topic.pretestedAt == null
      ? { ...topic, pretestedAt: now }
      : topic)
}

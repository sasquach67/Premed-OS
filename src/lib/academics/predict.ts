/**
 * §6.6 Predict — the pre-lecture expectation.
 *
 * "One prompt before class: *What do you think this lecture will cover?* …
 * Answers are stored and **surfaced again after the lecture** so the user sees
 * where their expectation was violated — the violation is where the encoding
 * happens."
 *
 * ⚠️ A prediction is never graded. There is nothing to be right about: §6.6
 * rules the whole pretesting family as priming, not performance, so nothing
 * here reads or writes FSRS, weak-topic flags, or review history.
 *
 * ⚠️ An unrevealed prediction is a dead record. The feature is the resurfacing,
 * not the writing, which is why `pendingReveal` exists at all.
 */
import { uid } from '@/lib/id'
import type { Topic, TopicPrediction, TopicStatus } from '@/lib/types'

/** Statuses that mean the lecture has happened. */
const COVERED: TopicStatus[] = ['seen', 'notes-made', 'reviewing', 'ready']

export const PREDICT_PROMPT = 'What do you think this lecture will cover?'

export function isCovered(topic: Topic): boolean {
  return COVERED.includes(topic.status)
}

/**
 * A topic can be predicted while it is still ahead of the student, and only
 * once. After coverage the moment has passed — an answer written then is a
 * memory of the lecture, not an expectation of it, and storing it as the latter
 * would quietly corrupt the one thing this record is for.
 */
export function canPredict(topic: Topic, predictions: TopicPrediction[]): boolean {
  if (isCovered(topic)) return false
  return !predictions.some((prediction) => prediction.topicId === topic.id)
}

export function predictionFor(topicId: string, predictions: TopicPrediction[]): TopicPrediction | undefined {
  return predictions.find((prediction) => prediction.topicId === topicId)
}

/** Written before the lecture; surfaced back after it. */
export function recordPrediction(
  predictions: TopicPrediction[],
  { courseId, topicId, answer, now = Date.now() }: {
    courseId: string
    topicId: string
    answer: string
    now?: number
  },
): TopicPrediction[] {
  const text = answer.trim()
  if (!text) return predictions
  if (predictions.some((prediction) => prediction.topicId === topicId)) return predictions
  return [...predictions, {
    id: uid(),
    courseId,
    topicId,
    prompt: PREDICT_PROMPT,
    answer: text,
    createdAt: now,
    updatedAt: now,
    order: predictions.length,
  }]
}

/**
 * Predictions whose topic has since been covered and which the student has not
 * seen back yet. This is the whole feature.
 */
export function pendingReveal(topics: Topic[], predictions: TopicPrediction[]): TopicPrediction[] {
  return predictions.filter((prediction) => {
    if (prediction.revealedAt != null) return false
    const topic = topics.find((item) => item.id === prediction.topicId)
    return topic != null && isCovered(topic)
  })
}

export function revealPrediction(
  predictions: TopicPrediction[],
  predictionId: string,
  now = Date.now(),
): TopicPrediction[] {
  return predictions.map((prediction) =>
    prediction.id === predictionId ? { ...prediction, revealedAt: now, updatedAt: now } : prediction)
}

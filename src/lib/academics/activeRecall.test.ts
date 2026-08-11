import { describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import { reviewTopic } from '@/lib/academics/fsrs'
import {
  REVIEW_RATINGS, buildRecallQueue, noKeyLoopAvailable,
} from '@/lib/academics/activeRecall'
import type { Topic } from '@/lib/types'

function topic(id: string, due: number, status: Topic['status'], reps = 0): Topic {
  return {
    id, courseId: 'course-1', title: id, status, confidence: 2,
    sourceNoteIds: [], linkedNoteIds: [], linkedAssignmentIds: [], linkedFileIds: [],
    fsrs: { ...createTopicFsrsState(1), due, reps }, order: 0,
  }
}

describe('active recall deterministic loop', () => {
  it('works without any API key', () => {
    expect(noKeyLoopAvailable()).toBe(true)
    expect(REVIEW_RATINGS).toEqual({
      again: Rating.Again,
      hard: Rating.Hard,
      good: Rating.Good,
      easy: Rating.Easy,
    })
    const before = createTopicFsrsState(1)
    const after = reviewTopic(before, REVIEW_RATINGS.good, 2)
    expect(after.reps).toBeGreaterThan(before.reps)
    expect(after.due).toBeGreaterThan(2)
  })

  it('keeps an explicitly requested topic first, then uses the recorded due order', () => {
    const queue = buildRecallQueue([
      topic('later', 500, 'ready', 2),
      topic('never', 50, 'seen'),
      topic('weak', 100, 'weak', 1),
    ], 200, 'never')
    expect(queue.map((item) => item.id)).toEqual(['never', 'weak'])
  })

})

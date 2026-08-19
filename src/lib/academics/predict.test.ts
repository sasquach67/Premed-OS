import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  PREDICT_PROMPT, canPredict, pendingReveal, predictionFor, recordPrediction, revealPrediction,
} from '@/lib/academics/predict'
import type { Topic, TopicPrediction, TopicStatus } from '@/lib/types'

const now = Date.UTC(2026, 8, 19)
const topic = (id: string, status: TopicStatus = 'not-started'): Topic => ({
  id, courseId: 'c1', title: id, status, fsrs: createTopicFsrsState(now),
  confidence: 3, sourceNoteIds: [], order: 0,
})

describe('predicting is a pre-lecture act', () => {
  it('is allowed for a topic still ahead of the student', () => {
    expect(canPredict(topic('t1'), [])).toBe(true)
  })

  it('is refused once the lecture has happened', () => {
    // An answer written after the lecture is a memory, not an expectation.
    for (const status of ['seen', 'notes-made', 'reviewing', 'ready'] as TopicStatus[]) {
      expect(canPredict(topic('t1', status), [])).toBe(false)
    }
  })

  it('is allowed only once per topic', () => {
    const once = recordPrediction([], { courseId: 'c1', topicId: 't1', answer: 'enolates', now })
    expect(canPredict(topic('t1'), once)).toBe(false)
    const twice = recordPrediction(once, { courseId: 'c1', topicId: 't1', answer: 'something else', now })
    expect(twice).toHaveLength(1)
    expect(twice[0].answer).toBe('enolates')
  })

  it('ignores an empty answer rather than storing a blank expectation', () => {
    expect(recordPrediction([], { courseId: 'c1', topicId: 't1', answer: '   ', now })).toEqual([])
  })

  it('stores the prompt it was answering', () => {
    const [prediction] = recordPrediction([], { courseId: 'c1', topicId: 't1', answer: 'enolates', now })
    expect(prediction.prompt).toBe(PREDICT_PROMPT)
    expect(predictionFor('t1', [prediction])).toBe(prediction)
  })
})

describe('the resurfacing is the feature', () => {
  const written = recordPrediction([], { courseId: 'c1', topicId: 't1', answer: 'enolates', now })

  it('surfaces a prediction once its topic is covered', () => {
    expect(pendingReveal([topic('t1', 'seen')], written)).toHaveLength(1)
  })

  it('does not surface one whose lecture has not happened yet', () => {
    expect(pendingReveal([topic('t1')], written)).toEqual([])
  })

  it('stops surfacing it once seen', () => {
    const revealed = revealPrediction(written, written[0].id, now)
    expect(revealed[0].revealedAt).toBe(now)
    expect(pendingReveal([topic('t1', 'seen')], revealed)).toEqual([])
  })
})

describe('priming is never performance', () => {
  it('never reads or writes FSRS, and stores no score of any kind', () => {
    const before = topic('t1')
    const written = recordPrediction([], { courseId: 'c1', topicId: 't1', answer: 'enolates', now })
    const revealed = revealPrediction(written, written[0].id, now)
    expect(before.fsrs).toEqual(createTopicFsrsState(now))
    const keys = Object.keys(revealed[0] as TopicPrediction).sort()
    expect(keys).toEqual([
      'answer', 'courseId', 'createdAt', 'id', 'order', 'prompt', 'revealedAt', 'topicId', 'updatedAt',
    ])
    expect(JSON.stringify(revealed)).not.toMatch(/score|correct|grade|accuracy/i)
  })
})

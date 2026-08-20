import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  MIN_PRETEST_PROMPTS, canPretest, pretestPrompts, recordPretest,
} from '@/lib/academics/pretest'
import type { KeyPoint, Topic, TopicStatus } from '@/lib/types'

const now = Date.UTC(2026, 8, 19)
const topic = (id: string, status: TopicStatus = 'not-started', patch: Partial<Topic> = {}): Topic => ({
  id, courseId: 'c1', title: id, status, fsrs: createTopicFsrsState(now),
  confidence: 3, sourceNoteIds: [], order: 0, ...patch,
})
const point = (id: string, topicId: string, order: number): KeyPoint => ({
  id, topicId, text: `Explain ${id}`, sourceChunkIds: ['chunk'],
  timesSurfaced: 0, createdAt: now, updatedAt: now, order,
})
const five = (topicId: string) => [0, 1, 2, 3, 4].map((n) => point(`k${n}`, topicId, n))

describe('pretesting happens before the lecture', () => {
  it('is offered for an uncovered topic', () => {
    expect(canPretest(topic('t1'))).toBe(true)
  })

  it('is refused once the lecture has happened', () => {
    for (const status of ['seen', 'notes-made', 'reviewing', 'ready'] as TopicStatus[]) {
      expect(canPretest(topic('t1', status))).toBe(false)
    }
  })

  it('is offered only once', () => {
    expect(canPretest(topic('t1', 'not-started', { pretestedAt: now }))).toBe(false)
  })
})

describe('the questions come from the class’s own key points', () => {
  it('serves up to five, in their recorded order', () => {
    const prompts = pretestPrompts(topic('t1'), [...five('t1'), point('k5', 't1', 5)])
    expect(prompts).toHaveLength(5)
    expect(prompts.map((p) => p.id)).toEqual(['k0', 'k1', 'k2', 'k3', 'k4'])
  })

  it('serves none below the floor rather than padding from another topic', () => {
    // Borrowing questions would be inventing what the lecture is about.
    const thin = [point('k0', 't1', 0), point('k1', 't1', 1), ...five('other')]
    expect(pretestPrompts(topic('t1'), thin)).toEqual([])
    expect(MIN_PRETEST_PROMPTS).toBe(3)
  })

  it('never serves another topic’s key points', () => {
    const prompts = pretestPrompts(topic('t1'), [...five('t1'), ...five('t2')])
    expect(prompts.every((p) => p.topicId === 't1')).toBe(true)
  })
})

describe('a pretest is priming, never performance', () => {
  it('records a timestamp and nothing else', () => {
    const before = topic('t1')
    const [after] = recordPretest([before], 't1', now)
    expect(after.pretestedAt).toBe(now)
    // §6.6: "it must not touch FSRS state or weak-topic flags."
    expect(after.fsrs).toEqual(before.fsrs)
    expect(after.status).toBe(before.status)
    expect(after.confidence).toBe(before.confidence)
  })

  it('stores no score of any kind', () => {
    const [after] = recordPretest([topic('t1')], 't1', now)
    expect(JSON.stringify(after)).not.toMatch(/score|correct|wrong|grade|accuracy/i)
  })

  it('does not overwrite an existing pretest, and leaves other topics alone', () => {
    const topics = [topic('t1', 'not-started', { pretestedAt: 111 }), topic('t2')]
    const after = recordPretest(topics, 't1', now)
    expect(after[0].pretestedAt).toBe(111)
    expect(after[1].pretestedAt).toBeUndefined()
  })
})

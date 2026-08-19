import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  ASSUMED_MINUTES_PER_TOPIC, interleaveByCourse, studySessionPlan,
} from '@/lib/academics/studySession'
import type { Course, Topic } from '@/lib/types'

const now = Date.UTC(2026, 8, 19)
const due = (id: string, courseId: string): Topic => ({
  id, courseId, title: id, status: 'reviewing',
  fsrs: { ...createTopicFsrsState(now), reps: 2, due: now - 1000 },
  confidence: 3, sourceNoteIds: [], order: 0,
})
const notDue = (id: string, courseId: string): Topic => ({
  ...due(id, courseId), fsrs: { ...createTopicFsrsState(now), reps: 2, due: now + 86_400_000 },
})
const courses: Course[] = [
  { id: 'chem', term: 'Fall 2026', code: 'CHEM 262', title: 'Orgo', credits: 3, grade: '', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 0 },
  { id: 'biol', term: 'Fall 2026', code: 'BIOL 252', title: 'Neuro', credits: 3, grade: '', bcpm: true, status: 'in-progress', inResidence: true, satisfies: [], order: 1 },
]

describe('interleaving is the feature', () => {
  it('alternates classes rather than blocking one at a time', () => {
    const topics = [due('c1', 'chem'), due('c2', 'chem'), due('b1', 'biol'), due('b2', 'biol')]
    const order = interleaveByCourse(topics).map((topic) => topic.courseId)
    expect(order).toEqual(['chem', 'biol', 'chem', 'biol'])
  })

  it('keeps every topic when one class has more due than another', () => {
    const topics = [due('c1', 'chem'), due('c2', 'chem'), due('c3', 'chem'), due('b1', 'biol')]
    const order = interleaveByCourse(topics)
    expect(order).toHaveLength(4)
    expect(new Set(order.map((t) => t.id)).size).toBe(4)
  })

  it('handles a single class without stalling', () => {
    const topics = [due('c1', 'chem'), due('c2', 'chem')]
    expect(interleaveByCourse(topics).map((t) => t.id)).toEqual(['c1', 'c2'])
  })
})

describe('the plan fits the time given', () => {
  const topics = [due('c1', 'chem'), due('c2', 'chem'), due('b1', 'biol'), due('b2', 'biol')]

  it('takes as many topics as the minutes allow, and defers the rest', () => {
    const plan = studySessionPlan(topics, courses, { minutes: 10, now })
    expect(plan.blocks).toHaveLength(2)
    expect(plan.deferred).toBe(2)
  })

  it('returns nothing rather than half a topic', () => {
    const plan = studySessionPlan(topics, courses, { minutes: 2, now })
    expect(plan.blocks).toEqual([])
    expect(plan.deferred).toBe(4)
  })

  it('only plans what is actually due', () => {
    const mixed = [due('c1', 'chem'), notDue('c2', 'chem')]
    const plan = studySessionPlan(mixed, courses, { minutes: 90, now })
    expect(plan.blocks.map((b) => b.topic.id)).toEqual(['c1'])
  })

  it('names its assumption instead of implying a measurement', () => {
    // ReviewEvent records no duration, so the plan must not look timed.
    const plan = studySessionPlan(topics, courses, { minutes: 90, now })
    expect(plan.assumption).toContain(`${ASSUMED_MINUTES_PER_TOPIC} minutes per topic`)
    expect(plan.assumption).toMatch(/estimate rather than a measurement/)
  })

  it('labels each block with the class it came from', () => {
    const plan = studySessionPlan(topics, courses, { minutes: 90, now })
    expect(plan.blocks[0].courseCode).toBe('CHEM 262')
    expect(plan.blocks[1].courseCode).toBe('BIOL 252')
    expect(plan.blocks.map((b) => b.position)).toEqual([1, 2, 3, 4])
  })
})

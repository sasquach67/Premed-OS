import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import { CYCLE, completedSteps, panelShouldRender, studyGroups } from '@/lib/academics/studyMethod'
import type { ReviewEvent, Topic } from '@/lib/types'

const DAY = 86_400_000
const now = Date.UTC(2026, 8, 18)
const topic = (patch: Partial<Topic> = {}): Topic => ({
  id: 't1', courseId: 'c1', title: 'SN1 / SN2', status: 'not-started',
  fsrs: createTopicFsrsState(now), confidence: 3, sourceNoteIds: [], order: 0, ...patch,
})
const review = (topicId: string, at: number, order = 0): ReviewEvent =>
  ({ id: `r${order}`, topicId, timestamp: at, grade: 'good', confidence: 3, order })

describe('the nine-step cycle', () => {
  it('is nine steps in three stages of three', () => {
    expect(CYCLE).toHaveLength(9)
    for (const stage of ['before', 'after', 'retain'] as const) {
      expect(CYCLE.filter((entry) => entry.stage === stage)).toHaveLength(3)
    }
  })

  it('marks exactly the three §6.6 steps that still have no engine', () => {
    // Connect left this list on Aug 19 2026 when TopicLink landed.
    const missing = CYCLE.filter((entry) => !entry.hasEngine).map((entry) => entry.step)
    expect(missing).toEqual(['pretest', 'predict', 'mock'])
  })

  it('fills the connect dot only for a topic that actually has a link', () => {
    const reviewed = topic({ fsrs: { ...createTopicFsrsState(now), reps: 3 } })
    expect(completedSteps(reviewed, [], new Set(['t1'])).has('connect')).toBe(true)
    expect(completedSteps(reviewed, [], new Set(['other'])).has('connect')).toBe(false)
    // No graph passed at all: hollow, rather than claimed done on no evidence.
    expect(completedSteps(reviewed, []).has('connect')).toBe(false)
  })

  it('never reports an engineless step as done, however the topic looks', () => {
    const busy = topic({
      status: 'ready', sourceNoteIds: ['n1'], linkedNoteIds: ['n2'],
      fsrs: { ...createTopicFsrsState(now), reps: 12 },
    })
    const done = completedSteps(busy, [review('t1', now - DAY, 0), review('t1', now - 2 * DAY, 1), review('t1', now - 3 * DAY, 2)])
    for (const step of ['pretest', 'predict', 'mock'] as const) {
      expect(done.has(step)).toBe(false)
    }
  })

  it('does report the steps that have an engine', () => {
    const busy = topic({ sourceNoteIds: ['n1'], fsrs: { ...createTopicFsrsState(now), reps: 3 } })
    const done = completedSteps(busy, [review('t1', now - DAY, 0), review('t1', now - 2 * DAY, 1), review('t1', now - 3 * DAY, 2)])
    expect(done.has('prime')).toBe(true)
    expect(done.has('recall')).toBe(true)
    expect(done.has('spaced')).toBe(true)
  })
})

describe('the panel offers only groups whose action exists', () => {
  it('never offers before-class, needs-connecting, or exam-ready', () => {
    const groups = studyGroups([topic({ status: 'seen', updatedAt: now - DAY })], [], now)
    const ids = groups.map((group) => group.id)
    expect(ids).not.toContain('before-class')
    expect(ids).not.toContain('needs-connecting')
    expect(ids).not.toContain('exam-ready')
  })

  it('puts a freshly covered, never-recalled topic in just-covered', () => {
    const groups = studyGroups([topic({ status: 'seen', updatedAt: now - DAY })], [], now)
    expect(groups.find((group) => group.id === 'just-covered')?.topics).toHaveLength(1)
  })

  it('drops it once it has been recalled since being covered', () => {
    const covered = topic({ status: 'seen', updatedAt: now - 2 * DAY })
    const groups = studyGroups([covered], [review('t1', now - DAY)], now)
    expect(groups.find((group) => group.id === 'just-covered')).toBeUndefined()
  })

  it('drops it once the 7-day window has passed', () => {
    const groups = studyGroups([topic({ status: 'seen', updatedAt: now - 9 * DAY })], [], now)
    expect(groups.find((group) => group.id === 'just-covered')).toBeUndefined()
  })

  it('lists a scheduled, due topic under due-to-review', () => {
    const due = topic({ status: 'reviewing', fsrs: { ...createTopicFsrsState(now), reps: 3, due: now - DAY } })
    const groups = studyGroups([due], [], now)
    expect(groups.find((group) => group.id === 'due-to-review')?.topics).toHaveLength(1)
  })

  it('keeps the two groups mutually exclusive', () => {
    const both = topic({ status: 'seen', updatedAt: now - DAY, fsrs: { ...createTopicFsrsState(now), reps: 3, due: now - DAY } })
    const groups = studyGroups([both], [], now)
    expect(groups.find((group) => group.id === 'due-to-review')).toBeUndefined()
    expect(groups.find((group) => group.id === 'just-covered')?.topics).toHaveLength(1)
  })

  it('omits an empty group rather than showing a zero', () => {
    const groups = studyGroups([topic({ status: 'not-started' })], [], now)
    expect(groups).toHaveLength(0)
  })

  it('renders no panel at all when every group is empty', () => {
    expect(panelShouldRender(studyGroups([topic({ status: 'not-started' })], [], now))).toBe(false)
    expect(panelShouldRender(studyGroups([topic({ status: 'seen', updatedAt: now - DAY })], [], now))).toBe(true)
  })
})

describe('§4.1-N — General classes get no panel, not a disabled one', () => {
  const covered = topic({ status: 'seen', updatedAt: now - DAY })

  it('withholds the panel from a General class even when a group would fill', () => {
    const groups = studyGroups([covered], [], now)
    expect(groups).toHaveLength(1)
    expect(panelShouldRender(groups, 'general')).toBe(false)
  })

  it('still renders it for STEM and Writing', () => {
    const groups = studyGroups([covered], [], now)
    expect(panelShouldRender(groups, 'stem')).toBe(true)
    expect(panelShouldRender(groups, 'writing')).toBe(true)
  })
})

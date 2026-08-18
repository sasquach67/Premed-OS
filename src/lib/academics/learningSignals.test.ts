import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  MAX_SIGNALS, learningSignals, signalsShouldRender,
} from '@/lib/academics/learningSignals'
import { studyGroups } from '@/lib/academics/studyMethod'
import type { ClassAssignment, ReviewEvent, Topic } from '@/lib/types'

const DAY = 86_400_000
const now = Date.UTC(2026, 8, 18)
const iso = (at: number) => new Date(at).toISOString().slice(0, 10)

const topic = (patch: Partial<Topic> = {}): Topic => ({
  id: 't1', courseId: 'c1', title: 'SN1 / SN2', status: 'not-started',
  fsrs: createTopicFsrsState(now), confidence: 3, sourceNoteIds: [], order: 0, ...patch,
})
const review = (topicId: string, at: number, order = 0): ReviewEvent =>
  ({ id: `r${topicId}${order}`, topicId, timestamp: at, grade: 'good', confidence: 3, order })
const assignment = (patch: Partial<ClassAssignment> = {}): ClassAssignment => ({
  id: 'a1', courseId: 'c1', title: 'Problem set 6', type: 'homework',
  status: 'not-started', linkedTopicIds: [], linkedFileIds: [],
  createdAt: now, updatedAt: now, order: 0, ...patch,
})
const input = (patch: Partial<Parameters<typeof learningSignals>[0]> = {}) =>
  ({ courseId: 'c1', topics: [], events: [], assignments: [], ...patch })

describe('dormancy — nothing is invented from an empty class', () => {
  it('returns no signal at all when there are no records', () => {
    expect(learningSignals(input(), now)).toEqual([])
  })

  it('renders no panel for an empty signal list', () => {
    expect(signalsShouldRender([], 'stem')).toBe(false)
  })

  it('renders no panel for Writing or General, however much evidence exists', () => {
    const signals = learningSignals(input({
      topics: [topic({ fsrs: { ...createTopicFsrsState(now), reps: 0 } })],
      assignments: [assignment({ dueDate: iso(now + 3 * DAY), linkedTopicIds: ['t1'] })],
    }), now)
    expect(signals.length).toBeGreaterThan(0)
    expect(signalsShouldRender(signals, 'writing')).toBe(false)
    expect(signalsShouldRender(signals, 'general')).toBe(false)
    expect(signalsShouldRender(signals, undefined)).toBe(false)
    expect(signalsShouldRender(signals, 'stem')).toBe(true)
  })
})

describe('#37 assignment-to-topic linkage', () => {
  const due = assignment({ dueDate: iso(now + 3 * DAY), linkedTopicIds: ['t1'] })

  it('fires when a dated assignment names a topic with no recorded practice', () => {
    const [signal] = learningSignals(input({ topics: [topic()], assignments: [due] }), now)
    expect(signal.type).toBe('assignment-topic-link')
    expect(signal.kind).toBe('timing')
    expect(signal.action).toEqual({ type: 'tab', tab: 'assignments' })
    expect(signal.evidenceLabel).toBe('Assignment record')
  })

  it('stays silent once the linked topic has been practised', () => {
    const practised = topic({ fsrs: { ...createTopicFsrsState(now), reps: 2 } })
    expect(learningSignals(input({ topics: [practised], assignments: [due] }), now)).toEqual([])
  })

  it('stays silent for finished work and for work beyond the two-week window', () => {
    const done = { ...due, status: 'submitted' as const }
    const far = { ...due, dueDate: iso(now + 40 * DAY) }
    expect(learningSignals(input({ topics: [topic()], assignments: [done] }), now)).toEqual([])
    expect(learningSignals(input({ topics: [topic()], assignments: [far] }), now)).toEqual([])
  })
})

describe('#41 post-exam decay', () => {
  const exam = assignment({
    id: 'a2', title: 'Exam 1', type: 'exam', status: 'graded',
    dueDate: iso(now - 20 * DAY), coveredTopicIds: ['t1'], linkedTopicIds: [],
  })

  it('fires when nothing the exam tested has been retrieved since', () => {
    const tested = topic({ fsrs: { ...createTopicFsrsState(now), reps: 1 } })
    const [signal] = learningSignals(input({
      topics: [tested], assignments: [exam], events: [review('t1', now - 25 * DAY)],
    }), now)
    expect(signal.type).toBe('post-exam-decay')
    expect(signal.action).toEqual({ type: 'route', to: '/academics/review/c1' })
  })

  it('stays silent when a scoped topic was reviewed after the exam', () => {
    const tested = topic({ fsrs: { ...createTopicFsrsState(now), reps: 1 } })
    expect(learningSignals(input({
      topics: [tested], assignments: [exam], events: [review('t1', now - 5 * DAY)],
    }), now)).toEqual([])
  })

  it('stays silent inside the two-week window and with no recorded scope', () => {
    const recent = { ...exam, dueDate: iso(now - 3 * DAY) }
    const scopeless = { ...exam, coveredTopicIds: [] }
    expect(learningSignals(input({ topics: [topic()], assignments: [recent] }), now)).toEqual([])
    expect(learningSignals(input({ topics: [topic()], assignments: [scopeless] }), now)).toEqual([])
  })
})

describe('#27 topic difficulty outlier', () => {
  const lapsing = topic({
    id: 't1', title: 'Acid–base', fsrs: { ...createTopicFsrsState(now), reps: 5, lapses: 3 },
  })
  const calm = topic({ id: 't2', title: 'Titration', fsrs: { ...createTopicFsrsState(now), reps: 5, lapses: 0 } })
  const threeReviews = [review('t1', now - 9 * DAY, 0), review('t1', now - 6 * DAY, 1), review('t1', now - 2 * DAY, 2)]

  it('fires for the one topic lapsing more than every other', () => {
    const [signal] = learningSignals(input({ topics: [lapsing, calm], events: threeReviews }), now)
    expect(signal.type).toBe('topic-difficulty-outlier')
    expect(signal.evidenceDetail).toContain('3 of them lapses')
  })

  it('stays silent on a tie — that is a pattern, not an outlier', () => {
    const twin = topic({ id: 't2', fsrs: { ...createTopicFsrsState(now), reps: 5, lapses: 3 } })
    expect(learningSignals(input({ topics: [lapsing, twin], events: threeReviews }), now)).toEqual([])
  })

  it('stays silent below three recorded reviews', () => {
    expect(learningSignals(input({ topics: [lapsing, calm], events: threeReviews.slice(0, 2) }), now)).toEqual([])
  })
})

describe('panel discipline', () => {
  it('never returns more than three items', () => {
    const signals = learningSignals(input({
      topics: [
        topic({ id: 't1' }),
        topic({ id: 't2', title: 'Acid–base', fsrs: { ...createTopicFsrsState(now), reps: 5, lapses: 3 } }),
        topic({ id: 't3', title: 'Titration', fsrs: { ...createTopicFsrsState(now), reps: 5, lapses: 0 } }),
      ],
      events: [review('t2', now - 9 * DAY, 0), review('t2', now - 6 * DAY, 1), review('t2', now - 2 * DAY, 2)],
      assignments: [
        assignment({ dueDate: iso(now + 3 * DAY), linkedTopicIds: ['t1'] }),
        assignment({
          id: 'a2', title: 'Exam 1', type: 'exam', status: 'graded',
          dueDate: iso(now - 20 * DAY), coveredTopicIds: ['t3'],
        }),
      ],
    }), now)
    expect(signals).toHaveLength(3)
    expect(signals.length).toBeLessThanOrEqual(MAX_SIGNALS)
    expect(signals.map((signal) => signal.kind)).toEqual(['timing', 'routine', 'routine'])
  })

  it('gives every signal exactly one action and one piece of evidence', () => {
    const signals = learningSignals(input({
      topics: [topic()], assignments: [assignment({ dueDate: iso(now + 3 * DAY), linkedTopicIds: ['t1'] })],
    }), now)
    for (const signal of signals) {
      expect(signal.actionLabel.length).toBeGreaterThan(0)
      expect(signal.evidenceLabel.length).toBeGreaterThan(0)
      expect(signal.evidenceDetail.length).toBeGreaterThan(0)
    }
  })

  it('never constructs the dormant cross-class proposal', () => {
    const signals = learningSignals(input({
      topics: [topic()], assignments: [assignment({ dueDate: iso(now + 3 * DAY), linkedTopicIds: ['t1'] })],
    }), now)
    expect(signals.some((signal) => signal.kind === 'proposal')).toBe(false)
  })

  it('does not restate a study-method group', () => {
    // A freshly covered, never-recalled topic is `just-covered` in the study
    // cycle. Learning signals must not say the same thing a second time.
    const covered = topic({ status: 'seen', updatedAt: now - DAY })
    const groups = studyGroups([covered], [], now)
    expect(groups.map((group) => group.id)).toContain('just-covered')
    expect(learningSignals(input({ topics: [covered] }), now)).toEqual([])
  })
})

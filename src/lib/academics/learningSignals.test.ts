import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import { replayStates } from '@/lib/academics/forgettingCurve'
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

describe('#21 prerequisite decay', () => {
  const current = topic({ id: 'cur', courseId: 'c1' })
  // Built by replaying real reviews rather than hand-setting FSRS fields: a
  // card left in the New state reads as zero retrievability whatever
  // `stability` says, so a hand-mangled fixture tests nothing.
  const stateAfter = (offsets: number[]) => {
    const reviews = offsets.map((offset, index) => review('prior', now - offset * DAY, index))
    const states = replayStates(reviews)
    return states[states.length - 1]
  }
  const decayedPrior = topic({
    id: 'prior', courseId: 'c0', title: 'Nucleophilic substitution',
    fsrs: stateAfter([420, 410, 400]),
  })
  const freshPrior = topic({
    id: 'prior', courseId: 'c0', title: 'Nucleophilic substitution',
    fsrs: stateAfter([30, 12, 1]),
  })
  const prereqLink = [{
    id: 'l1', fromTopicId: 'cur', toTopicId: 'prior', relation: 'prerequisite' as const,
    createdAt: now, updatedAt: now, order: 0,
  }]

  it('names a prior-course topic the student marked as a prerequisite', () => {
    const [signal] = learningSignals(input({
      topics: [current], topicLinks: prereqLink, allTopics: [current, decayedPrior],
    }), now).filter((item) => item.type === 'prerequisite-decay')
    expect(signal.title).toContain('Nucleophilic substitution')
    expect(signal.evidenceLabel).toBe('Prerequisite link')
  })

  it('reports the band label and never a retrievability figure', () => {
    // C1: the number never ships without its label, and a signal carries no
    // numbers at all — so the label alone is the honest half.
    const [signal] = learningSignals(input({
      topics: [current], topicLinks: prereqLink, allTopics: [current, decayedPrior],
    }), now).filter((item) => item.type === 'prerequisite-decay')
    expect(signal.cause).toMatch(/fading|likely gone/i)
    expect(signal.cause).not.toMatch(/\d+%/)
  })

  it('stays silent when the prerequisite is still holding', () => {
    const signals = learningSignals(input({
      topics: [current], topicLinks: prereqLink, allTopics: [current, freshPrior],
    }), now)
    expect(signals.some((item) => item.type === 'prerequisite-decay')).toBe(false)
  })

  it('stays silent for a prior topic with no review history', () => {
    // No history means no decay to measure, not decay of zero.
    const never = topic({ id: 'prior', courseId: 'c0', fsrs: createTopicFsrsState(now) })
    const signals = learningSignals(input({
      topics: [current], topicLinks: prereqLink, allTopics: [current, never],
    }), now)
    expect(signals.some((item) => item.type === 'prerequisite-decay')).toBe(false)
  })

  it('ignores a prerequisite link inside the same class', () => {
    const sibling = topic({ id: 'prior', courseId: 'c1', fsrs: stateAfter([420, 410, 400]) })
    const signals = learningSignals(input({
      topics: [current, sibling], topicLinks: prereqLink, allTopics: [current, sibling],
    }), now)
    expect(signals.some((item) => item.type === 'prerequisite-decay')).toBe(false)
  })

  it('never infers a prerequisite the student did not mark', () => {
    const other = [{ ...prereqLink[0], relation: 'builds-on' as const }]
    const signals = learningSignals(input({
      topics: [current], topicLinks: other, allTopics: [current, decayedPrior],
    }), now)
    expect(signals.some((item) => item.type === 'prerequisite-decay')).toBe(false)
  })
})

describe('#39 concept-map gaps', () => {
  const linked = [topic({ id: 't1' }), topic({ id: 't2' }), topic({ id: 't3' }), topic({ id: 't4' })]
  const oneLink = [{
    id: 'l1', fromTopicId: 't1', toTopicId: 't2', relation: 'builds-on' as const,
    createdAt: now, updatedAt: now, order: 0,
  }]

  it('stays silent before the student has authored any link', () => {
    // Every topic is isolated in a class that has never used Connect. Firing
    // there would be an accusation, not an observation.
    const signals = learningSignals(input({ topics: linked, topicLinks: [] }), now)
    expect(signals.some((signal) => signal.type === 'concept-map-gap')).toBe(false)
  })

  it('fires once linking has started and topics still stand alone', () => {
    const signals = learningSignals(input({ topics: linked, topicLinks: oneLink }), now)
    const gap = signals.find((signal) => signal.type === 'concept-map-gap')!
    expect(gap.title).toContain('2 topics are not connected')
    expect(gap.evidenceDetail).toContain('1 link recorded')
  })

  it('stays silent when fewer than two topics are isolated', () => {
    const nearlyAll = [
      { ...oneLink[0] },
      { id: 'l2', fromTopicId: 't3', toTopicId: 't1', relation: 'builds-on' as const, createdAt: now, updatedAt: now, order: 1 },
    ]
    const signals = learningSignals(input({ topics: linked, topicLinks: nearlyAll }), now)
    expect(signals.some((signal) => signal.type === 'concept-map-gap')).toBe(false)
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

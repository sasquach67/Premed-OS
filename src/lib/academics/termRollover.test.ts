import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  applyFates, defaultFate, dismissUntilNextTerm, isScheduled, pauseEverything,
  pendingRollovers, type RolloverState,
} from '@/lib/academics/termRollover'
import type { Course, Topic } from '@/lib/types'

const now = Date.UTC(2026, 11, 18)
const course = (id: string, patch: Partial<Course> = {}): Course => ({
  id, term: 'Fall 2026', code: id.toUpperCase(), title: id, credits: 3, grade: 'A',
  bcpm: true, status: 'completed', inResidence: true, satisfies: [], order: 0, ...patch,
})
const topic = (id: string, patch: Partial<Topic> = {}): Topic => ({
  id, courseId: 'chem262', title: id, status: 'ready', fsrs: createTopicFsrsState(now),
  confidence: 3, sourceNoteIds: [], order: 0, ...patch,
})
const state = (): RolloverState => ({
  courses: [course('chem262'), course('chem430', { status: 'planned', title: 'Biochemistry' })],
  topics: [topic('t1'), topic('t2')],
})

describe('which courses are owed a transition', () => {
  it('lists completed courses that have not been rolled over', () => {
    expect(pendingRollovers(state().courses).map((item) => item.id)).toEqual(['chem262'])
  })

  it('drops a course once its ritual is complete', () => {
    const done = [course('chem262', { rolloverAt: now })]
    expect(pendingRollovers(done)).toEqual([])
  })

  it('does not re-offer within the term it was dismissed for, but does after', () => {
    const dismissed = [course('chem262', { rolloverDismissedTerm: 'Fall 2026' })]
    expect(pendingRollovers(dismissed, 'Fall 2026')).toEqual([])
    expect(pendingRollovers(dismissed, 'Spring 2027')).toHaveLength(1)
  })
})

describe('the pre-sorted defaults', () => {
  const planned = [course('chem430', { status: 'planned', code: 'CHEM 430', title: 'Biochemistry' })]

  it('proposes prerequisite when a planned course needs the topic', () => {
    const proposal = defaultFate(topic('t1', { title: 'Biochemistry pathways' }), planned)
    expect(proposal.fate).toBe('prerequisite')
    expect(proposal.reason).toContain('CHEM 430')
  })

  it('proposes MCAT for a topic with real retention behind it', () => {
    const studied = topic('t1', { fsrs: { ...createTopicFsrsState(now), reps: 4 } })
    expect(defaultFate(studied, []).fate).toBe('mcat')
  })

  it('retires everything else, as the honest default', () => {
    expect(defaultFate(topic('t1'), []).fate).toBe('retired')
  })
})

describe('nothing is ever deleted, and study state survives', () => {
  it('carries a topic without touching a single FSRS field', () => {
    const studied = { ...createTopicFsrsState(now), reps: 6, lapses: 2, stability: 41.5, due: now + 9e6 }
    const before: RolloverState = { ...state(), topics: [topic('t1', { fsrs: studied })] }
    const after = applyFates(before, { courseId: 'chem262', fates: [{ topicId: 't1', fate: 'mcat', reason: 'x' }], now })
    expect(after.topics[0].termFate).toBe('mcat')
    expect(after.topics[0].fsrs).toEqual(studied)
  })

  it('retires without removing the topic, and keeps it findable', () => {
    const after = applyFates(state(), { courseId: 'chem262', fates: [{ topicId: 't1', fate: 'retired', reason: 'x' }], now })
    expect(after.topics).toHaveLength(2)
    expect(after.topics[0].title).toBe('t1')
    expect(isScheduled(after.topics[0])).toBe(false)
    expect(isScheduled(after.topics[1])).toBe(true)
  })

  it('never touches another course’s topics', () => {
    const mixed: RolloverState = { ...state(), topics: [topic('t1'), topic('other', { courseId: 'biol252' })] }
    const after = applyFates(mixed, { courseId: 'chem262', fates: [{ topicId: 'other', fate: 'mcat', reason: 'x' }], now })
    expect(after.topics[1].termFate).toBeUndefined()
  })
})

describe('the bulk exit and the re-offer', () => {
  it('pauses everything in one action, losing nothing', () => {
    const after = pauseEverything(state(), 'chem262', now)
    expect(after.topics.every((item) => item.termFate === 'retired')).toBe(true)
    expect(after.topics).toHaveLength(2)
    expect(after.courses[0].rolloverAt).toBe(now)
  })

  it('is reversible afterwards', () => {
    const paused = pauseEverything(state(), 'chem262', now)
    const changed = applyFates(paused, { courseId: 'chem262', fates: [{ topicId: 't1', fate: 'mcat', reason: 'x' }], now })
    expect(changed.topics[0].termFate).toBe('mcat')
  })

  it('records a dismissal without completing the ritual', () => {
    const after = dismissUntilNextTerm(state(), 'chem262', 'Fall 2026')
    expect(after.courses[0].rolloverDismissedTerm).toBe('Fall 2026')
    expect(after.courses[0].rolloverAt).toBeUndefined()
  })
})

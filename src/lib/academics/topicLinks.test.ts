import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  PICKER_THRESHOLD, assignmentsForTopic, isLinked, linkedIds, setLinks,
  shouldOfferPicker, toggleLink, topicsForAssignment, type LinkState,
} from '@/lib/academics/topicLinks'
import type { ClassAssignment, Topic } from '@/lib/types'

const now = Date.UTC(2026, 8, 18)
const topic = (id: string, patch: Partial<Topic> = {}): Topic => ({
  id, courseId: 'c1', title: id, status: 'not-started', fsrs: createTopicFsrsState(now),
  confidence: 3, sourceNoteIds: [], linkedAssignmentIds: [], order: 0, ...patch,
})
const assignment = (id: string, patch: Partial<ClassAssignment> = {}): ClassAssignment => ({
  id, courseId: 'c1', title: id, type: 'homework', status: 'not-started',
  linkedTopicIds: [], linkedFileIds: [], createdAt: now, updatedAt: now, order: 0, ...patch,
})
const state = (): LinkState => ({
  assignments: [assignment('a1'), assignment('exam', { type: 'exam', coveredTopicIds: [] })],
  topics: [topic('t1'), topic('t2')],
})

describe('coverage links write both directions', () => {
  it('writes the assignment field and the topic mirror in one call', () => {
    const next = setLinks(state(), { assignmentId: 'a1', field: 'coverage', topicIds: ['t1'] })
    expect(next.assignments[0].linkedTopicIds).toEqual(['t1'])
    expect(next.topics[0].linkedAssignmentIds).toEqual(['a1'])
    expect(next.topics[1].linkedAssignmentIds).toEqual([])
  })

  it('removes from both sides when the link goes away', () => {
    const linked = setLinks(state(), { assignmentId: 'a1', field: 'coverage', topicIds: ['t1', 't2'] })
    const next = setLinks(linked, { assignmentId: 'a1', field: 'coverage', topicIds: ['t2'] })
    expect(next.assignments[0].linkedTopicIds).toEqual(['t2'])
    expect(next.topics[0].linkedAssignmentIds).toEqual([])
    expect(next.topics[1].linkedAssignmentIds).toEqual(['a1'])
  })

  it('never duplicates an id', () => {
    const next = setLinks(state(), { assignmentId: 'a1', field: 'coverage', topicIds: ['t1', 't1'] })
    expect(next.assignments[0].linkedTopicIds).toEqual(['t1'])
  })

  it('toggles the same link from either entry point', () => {
    const on = toggleLink(state(), { assignmentId: 'a1', field: 'coverage', topicId: 't1' })
    expect(isLinked(on.assignments[0], 'coverage', 't1')).toBe(true)
    const off = toggleLink(on, { assignmentId: 'a1', field: 'coverage', topicId: 't1' })
    expect(isLinked(off.assignments[0], 'coverage', 't1')).toBe(false)
    expect(off.topics[0].linkedAssignmentIds).toEqual([])
  })
})

describe('scope is a separate field', () => {
  it('writes coveredTopicIds and leaves coverage alone', () => {
    const next = setLinks(state(), { assignmentId: 'exam', field: 'scope', topicIds: ['t1'] })
    expect(next.assignments[1].coveredTopicIds).toEqual(['t1'])
    expect(next.assignments[1].linkedTopicIds).toEqual([])
  })

  it('does not write the topic mirror, so unlinking coverage cannot strip scope', () => {
    const scoped = setLinks(state(), { assignmentId: 'exam', field: 'scope', topicIds: ['t1'] })
    expect(scoped.topics[0].linkedAssignmentIds).toEqual([])
    const covered = setLinks(scoped, { assignmentId: 'a1', field: 'coverage', topicIds: ['t1'] })
    const uncovered = setLinks(covered, { assignmentId: 'a1', field: 'coverage', topicIds: [] })
    expect(uncovered.assignments[1].coveredTopicIds).toEqual(['t1'])
  })

  it('reports both kinds from one source of truth on the topic side', () => {
    let next = setLinks(state(), { assignmentId: 'a1', field: 'coverage', topicIds: ['t1'] })
    next = setLinks(next, { assignmentId: 'exam', field: 'scope', topicIds: ['t1'] })
    expect(assignmentsForTopic(next, 't1').map((entry) => [entry.assignment.id, entry.field]))
      .toEqual([['a1', 'coverage'], ['exam', 'scope']])
  })
})

describe('unlinking is not a delete', () => {
  it('leaves the topic, the assignment, and every FSRS field untouched', () => {
    const linked = setLinks(state(), { assignmentId: 'a1', field: 'coverage', topicIds: ['t1'] })
    const next = setLinks(linked, { assignmentId: 'a1', field: 'coverage', topicIds: [] })
    expect(next.topics).toHaveLength(2)
    expect(next.assignments).toHaveLength(2)
    expect(next.topics[0].fsrs).toEqual(createTopicFsrsState(now))
    expect(next.topics[0].title).toBe('t1')
  })
})

describe('the picker threshold', () => {
  it('is five, and the escape hatch appears only above it', () => {
    expect(PICKER_THRESHOLD).toBe(5)
    expect(shouldOfferPicker(5)).toBe(false)
    expect(shouldOfferPicker(6)).toBe(true)
    expect(shouldOfferPicker(0)).toBe(false)
  })
})

describe('reading helpers', () => {
  it('resolves linked topics in their stored order and drops missing ids', () => {
    const next = setLinks(state(), { assignmentId: 'a1', field: 'coverage', topicIds: ['t2', 't1', 'gone'] })
    expect(linkedIds(next.assignments[0], 'coverage')).toEqual(['t2', 't1', 'gone'])
    expect(topicsForAssignment(next, next.assignments[0], 'coverage').map((item) => item.id)).toEqual(['t2', 't1'])
  })
})

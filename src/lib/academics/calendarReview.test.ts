import { describe, expect, it } from 'vitest'
import {
  applyProposedDate, feedState, matchEventToAssignment, proposedDateChanges,
} from '@/lib/academics/calendarReview'
import type { ClassAssignment, NormalizedScheduleEvent } from '@/lib/types'

const now = Date.UTC(2026, 9, 20)
const assignment = (patch: Partial<ClassAssignment> = {}): ClassAssignment => ({
  id: 'a1', courseId: 'c1', title: 'Problem set 6', type: 'homework', status: 'not-started',
  dueDate: '2026-10-22', linkedTopicIds: [], linkedFileIds: [],
  createdAt: now, updatedAt: now, order: 0, ...patch,
})
const event = (patch: Partial<NormalizedScheduleEvent> = {}): NormalizedScheduleEvent => ({
  id: 'e1', title: 'CHEM 262 Problem set 6', start: '2026-10-24T23:59:00Z', ...patch,
})

describe('matching an event to a record', () => {
  it('matches when the calendar title contains the assignment title', () => {
    expect(matchEventToAssignment(event(), [assignment()])?.id).toBe('a1')
  })

  it('returns nothing for an unrelated event rather than guessing', () => {
    expect(matchEventToAssignment(event({ title: 'Dentist appointment' }), [assignment()])).toBeUndefined()
  })

  it('ignores titles too short to mean anything', () => {
    expect(matchEventToAssignment(event({ title: 'PS' }), [assignment()])).toBeUndefined()
  })
})

describe('proposed date changes', () => {
  it('proposes exactly one change when the dates disagree', () => {
    const proposals = proposedDateChanges([event()], [assignment()])
    expect(proposals).toHaveLength(1)
    expect(proposals[0].recordedDate).toBe('2026-10-22')
    expect(proposals[0].calendarDate).toBe('2026-10-24')
  })

  it('proposes nothing when the calendar agrees with the record', () => {
    expect(proposedDateChanges([event({ start: '2026-10-22T23:59:00Z' })], [assignment()])).toEqual([])
  })

  it('proposes nothing for an unmatched event', () => {
    expect(proposedDateChanges([event({ title: 'Lab safety training' })], [assignment()])).toEqual([])
  })

  it('ignores cancelled events', () => {
    expect(proposedDateChanges([event({ status: 'cancelled' })], [assignment()])).toEqual([])
  })

  it('never proposes twice for the same assignment', () => {
    const duplicates = [event(), event({ id: 'e2', start: '2026-10-25T23:59:00Z' })]
    expect(proposedDateChanges(duplicates, [assignment()])).toHaveLength(1)
  })

  it('skips an assignment with no recorded date — there is nothing to disagree with', () => {
    expect(proposedDateChanges([event()], [assignment({ dueDate: undefined })])).toEqual([])
  })
})

describe('accepting a proposal', () => {
  it('writes only the due date', () => {
    const before = assignment({ status: 'in-progress', weight: 10, pointsPossible: 25, linkedTopicIds: ['t1'] })
    const [after] = applyProposedDate([before], { assignmentId: 'a1', date: '2026-10-24', now })
    expect(after.dueDate).toBe('2026-10-24')
    expect(after.status).toBe('in-progress')
    expect(after.weight).toBe(10)
    expect(after.pointsPossible).toBe(25)
    expect(after.linkedTopicIds).toEqual(['t1'])
  })

  it('leaves every other assignment untouched', () => {
    const rows = [assignment(), assignment({ id: 'a2', title: 'Quiz 3', dueDate: '2026-11-02' })]
    const after = applyProposedDate(rows, { assignmentId: 'a1', date: '2026-10-24', now })
    expect(after[1].dueDate).toBe('2026-11-02')
  })
})

describe('feed state', () => {
  it('separates connected-but-empty from unavailable', () => {
    // A subscribed calendar with no course dates yet is ordinary, not a fault.
    expect(feedState({ connected: true, events: [] })).toBe('connected-empty')
    expect(feedState({ connected: true, events: [], lastError: 'network' })).toBe('unavailable')
  })

  it('reports disconnected before anything else', () => {
    expect(feedState({ connected: false, events: [event()] })).toBe('disconnected')
  })

  it('reports connected when events exist', () => {
    expect(feedState({ connected: true, events: [event()] })).toBe('connected')
  })
})

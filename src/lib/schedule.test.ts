import { describe, expect, it } from 'vitest'
import { classScheduleEvents, parseMeetingDays, parseMeetingTime } from '@/lib/schedule'

const courses = [
  { id: 'chem', code: 'CHEM 262', title: 'Organic Chemistry II' },
  { id: 'biol', code: 'BIOL 252', title: 'Neurobiology' },
]
// A Tuesday.
const tuesday = new Date(2026, 8, 15, 8, 0, 0)
const monday = new Date(2026, 8, 14, 8, 0, 0)

describe('parsing meeting days', () => {
  it('reads compact forms, preferring two-letter tokens', () => {
    expect(parseMeetingDays('MWF')).toEqual([1, 3, 5])
    // A bare T is ambiguous, so Th is consumed as one token before the T is
    // read as Tuesday — an earlier version dropped Tuesday entirely here.
    expect(parseMeetingDays('TTh')).toEqual([2, 4])
  })

  it('reads R as Thursday, the convention that exists to remove that ambiguity', () => {
    expect(parseMeetingDays('TR')).toEqual([2, 4])
    expect(parseMeetingDays('MWR')).toEqual([1, 3, 4])
  })

  it('reads separated forms', () => {
    expect(parseMeetingDays('Tue/Thu')).toEqual([2, 4])
    expect(parseMeetingDays('Mon, Wed')).toEqual([1, 3])
  })

  it('yields nothing for input it does not understand', () => {
    // A partial match means the string was not understood. `TBD` parsed as
    // Tuesday before this, putting a class on a day nobody scheduled.
    expect(parseMeetingDays('TBD')).toEqual([])
    expect(parseMeetingDays('TBA')).toEqual([])
    expect(parseMeetingDays('by arrangement')).toEqual([])
    expect(parseMeetingDays(undefined)).toEqual([])
    expect(parseMeetingDays('')).toEqual([])
  })
})

describe('parsing meeting times', () => {
  it('carries the meridiem backwards when only the end states it', () => {
    expect(parseMeetingTime('10:10–11:00 AM')).toEqual({ start: 610, end: 660 })
  })

  it('reads a range that crosses midday', () => {
    expect(parseMeetingTime('11:00 AM–12:15 PM')).toEqual({ start: 660, end: 735 })
  })

  it('refuses a range it cannot read rather than guessing', () => {
    expect(parseMeetingTime('mornings')).toBeUndefined()
    expect(parseMeetingTime('11:00 AM')).toBeUndefined()
    expect(parseMeetingTime(undefined)).toBeUndefined()
  })

  it('refuses an inverted range', () => {
    expect(parseMeetingTime('3:00 PM–1:00 PM')).toBeUndefined()
  })
})

describe('the derived day never invents a class', () => {
  const workspaces = [
    { courseId: 'chem', meetingDays: 'Tue/Thu', meetingTime: '11:00 AM–12:15 PM', location: 'Kenan 100', status: 'active' },
    { courseId: 'biol', meetingDays: 'MWF', meetingTime: '10:10–11:00 AM', status: 'active' },
  ]

  it('shows only the classes that actually meet that weekday', () => {
    const events = classScheduleEvents(workspaces, courses, tuesday)
    expect(events.map((event) => event.title)).toEqual(['CHEM 262 Organic Chemistry II'])
    expect(events[0].location).toBe('Kenan 100')
  })

  it('shows the other class on its own day', () => {
    expect(classScheduleEvents(workspaces, courses, monday).map((e) => e.title))
      .toEqual(['BIOL 252 Neurobiology'])
  })

  it('omits a class whose meeting time cannot be parsed', () => {
    // An invented 9am class is precisely the bug this replaced.
    const vague = [{ courseId: 'chem', meetingDays: 'Tue/Thu', meetingTime: 'afternoons', status: 'active' }]
    expect(classScheduleEvents(vague, courses, tuesday)).toEqual([])
  })

  it('omits a class whose days cannot be parsed', () => {
    const vague = [{ courseId: 'chem', meetingDays: 'TBD', meetingTime: '11:00 AM–12:15 PM', status: 'active' }]
    expect(classScheduleEvents(vague, courses, tuesday)).toEqual([])
  })

  it('omits an archived workspace and an unknown course', () => {
    const archived = [{ ...workspaces[0], status: 'archived' }]
    expect(classScheduleEvents(archived, courses, tuesday)).toEqual([])
    expect(classScheduleEvents(workspaces, [], tuesday)).toEqual([])
  })

  it('returns an empty day rather than filling it', () => {
    const sunday = new Date(2026, 8, 13, 8, 0, 0)
    expect(classScheduleEvents(workspaces, courses, sunday)).toEqual([])
  })
})

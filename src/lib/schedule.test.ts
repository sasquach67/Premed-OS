import { describe, expect, it } from 'vitest'
import { classScheduleEvents, classScheduleEventsForWindow, mergeCalendarAndClassEvents, normalizeTimedEvents, normalizeUpcomingTimedEvents, parseMeetingDays, parseMeetingTime, upcomingTimedEvents } from '@/lib/schedule'

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

  it('finds the next recurring classes beyond the current day', () => {
    const events = classScheduleEventsForWindow(workspaces, courses, monday, 3)

    expect(events.map((event) => event.title)).toEqual([
      'BIOL 252 Neurobiology',
      'CHEM 262 Organic Chemistry II',
      'BIOL 252 Neurobiology',
    ])
  })
})

describe('overview calendar horizon', () => {
  it('keeps imported class blocks alongside Google events', () => {
    const merged = mergeCalendarAndClassEvents(
      [{ id: 'google-research', title: 'Research workshop', start: '2026-09-02T17:15:00-04:00', end: '2026-09-02T18:30:00-04:00', status: 'confirmed' }],
      [{ id: 'class-geog', title: 'GEOG 121 Geographies of Globalization', start: '2026-09-02T09:05:00-04:00', end: '2026-09-02T09:55:00-04:00', status: 'confirmed' }],
    )

    expect(merged.map((event) => event.id)).toEqual(['class-geog', 'google-research'])
  })

  it('does not duplicate a class already represented in Google Calendar', () => {
    const merged = mergeCalendarAndClassEvents(
      [{ id: 'google-geog', title: 'GEOG 121', start: '2026-09-02T09:05:00-04:00', end: '2026-09-02T09:55:00-04:00', status: 'confirmed' }],
      [{ id: 'class-geog', title: 'GEOG 121 Geographies of Globalization', start: '2026-09-02T09:05:00-04:00', end: '2026-09-02T09:55:00-04:00', status: 'confirmed' }],
    )

    expect(merged.map((event) => event.id)).toEqual(['google-geog'])
  })

  it('keeps unrelated commitments that start at the same time', () => {
    const merged = mergeCalendarAndClassEvents(
      [{ id: 'google-advising', title: 'Advising appointment', start: '2026-09-02T09:05:00-04:00', end: '2026-09-02T09:30:00-04:00', status: 'confirmed' }],
      [{ id: 'class-geog', title: 'GEOG 121 Geographies of Globalization', start: '2026-09-02T09:05:00-04:00', end: '2026-09-02T09:55:00-04:00', status: 'confirmed' }],
    )

    expect(merged.map((event) => event.id)).toEqual(['google-advising', 'class-geog'])
  })

  it('removes finished events so later commitments remain visible', () => {
    const now = new Date('2026-08-30T21:42:00')
    const events = normalizeTimedEvents([
      { id: 'past', title: 'Earlier meeting', start: '2026-08-30T17:00:00', end: '2026-08-30T18:00:00', status: 'confirmed' },
      { id: 'next-1', title: 'bruh', start: '2026-08-30T21:45:00', end: '2026-08-30T22:15:00', status: 'confirmed' },
      { id: 'next-2', title: 'bruh2', start: '2026-08-30T22:45:00', end: '2026-08-30T23:15:00', status: 'confirmed' },
      { id: 'next-3', title: 'bruh 3', start: '2026-08-30T23:30:00', end: '2026-08-30T23:59:00', status: 'confirmed' },
    ], now)

    expect(upcomingTimedEvents(events.timedEvents, now).map((event) => event.title))
      .toEqual(['bruh', 'bruh2', 'bruh 3'])
  })

  it('keeps the first upcoming timed events even when they are not today', () => {
    const now = new Date('2026-08-31T10:00:00-04:00')
    const analysis = normalizeUpcomingTimedEvents([
      { id: 'soon', title: 'In a few hours', start: '2026-08-31T14:00:00-04:00', end: '2026-08-31T15:00:00-04:00', status: 'confirmed' },
      { id: 'later', title: 'Next week', start: '2026-09-07T10:00:00-04:00', end: '2026-09-07T11:00:00-04:00', status: 'confirmed' },
      { id: 'past', title: 'Already finished', start: '2026-08-31T09:00:00-04:00', end: '2026-08-31T09:30:00-04:00', status: 'confirmed' },
    ], now)

    expect(analysis.timedEvents.map((event) => event.title)).toEqual(['In a few hours', 'Next week'])
    expect(analysis.current).toBeNull()
    expect(analysis.next?.title).toBe('In a few hours')
  })
})

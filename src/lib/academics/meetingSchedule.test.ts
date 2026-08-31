import { describe, expect, it } from 'vitest'
import { extractClassMeetingDays, extractClassMeetingTime, extractMeetingDays, isPlausibleClassMeetingTime, normalizeMeetingDays, proposePlausibleMeetingTime } from './meetingSchedule'

describe('meeting-day normalization', () => {
  it.each([
    ['TR', 'Tuesday · Thursday'],
    ['TTh', 'Tuesday · Thursday'],
    ['T/Th', 'Tuesday · Thursday'],
    ['Tues Thurs', 'Tuesday · Thursday'],
    ['Tuesdays and Thursdays', 'Tuesday · Thursday'],
    ['MWF', 'Monday · Wednesday · Friday'],
    ['Mon / Wed / Fri', 'Monday · Wednesday · Friday'],
  ])('normalizes %s', (source, expected) => {
    expect(normalizeMeetingDays(source)).toBe(expected)
  })

  it('extracts a registrar code from a full logistics line', () => {
    expect(extractMeetingDays('TR 8:00 AM-9:15 AM Hanes Art Center Rm 121')).toBe('Tuesday · Thursday')
    expect(extractMeetingDays('Tu/Th 8:00 AM-9:15 AM')).toBe('Tuesday · Thursday')
    expect(extractClassMeetingTime('TR 8am-9:15am Hanes Art Center Rm 121')).toBe('8 AM–9:15 AM')
  })

  it('extracts a natural full-name meeting sentence and normalizes its time range', () => {
    const line = 'Meets Tuesdays and Thursdays 10:00 AM to 11:15 AM'
    expect(extractClassMeetingDays(line)).toBe('Tuesday · Thursday')
    expect(extractClassMeetingTime(line)).toBe('10:00 AM–11:15 AM')
  })

  it('normalizes compact 24-hour registrar times', () => {
    const line = 'Section 63, MWF 1745–1835, Wilson Hall 139'
    expect(extractClassMeetingDays(line)).toBe('Monday · Wednesday · Friday')
    expect(extractClassMeetingTime(line)).toBe('5:45 PM–6:35 PM')
    expect(isPlausibleClassMeetingTime(extractClassMeetingTime(line))).toBe(true)
  })

  it('does not promote office hours into the class schedule', () => {
    expect(extractClassMeetingDays('Office hours Tuesday 2 PM Room 310')).toBe('')
    expect(extractClassMeetingTime('Office hours Tuesday 2 PM Room 310')).toBe('')
  })

  it('preserves a non-standard student-entered schedule', () => {
    expect(normalizeMeetingDays('Alternating Fridays')).toBe('Alternating Fridays')
  })

  it('flags an implausibly long class time without rewriting the source value', () => {
    expect(isPlausibleClassMeetingTime('8 AM–9:15 PM')).toBe(false)
    expect(isPlausibleClassMeetingTime('8 AM–9:15 AM')).toBe(true)
  })

  it('proposes a same-meridiem correction only when it yields a plausible class duration', () => {
    expect(proposePlausibleMeetingTime('8 AM–9:15 PM')).toBe('8 AM–9:15 AM')
    expect(proposePlausibleMeetingTime('8 AM–7:15 PM')).toBeUndefined()
    expect(proposePlausibleMeetingTime('8 AM–9:15 AM')).toBeUndefined()
  })
})

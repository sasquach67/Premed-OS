import { describe, expect, it } from 'vitest'
import { extractClassMeetingDays, extractClassMeetingTime, extractMeetingDays, normalizeMeetingDays } from './meetingSchedule'

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

  it('does not promote office hours into the class schedule', () => {
    expect(extractClassMeetingDays('Office hours Tuesday 2 PM Room 310')).toBe('')
    expect(extractClassMeetingTime('Office hours Tuesday 2 PM Room 310')).toBe('')
  })

  it('preserves a non-standard student-entered schedule', () => {
    expect(normalizeMeetingDays('Alternating Fridays')).toBe('Alternating Fridays')
  })
})

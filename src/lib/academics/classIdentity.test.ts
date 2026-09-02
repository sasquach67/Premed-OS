import { describe, expect, it } from 'vitest'
import {
  normalizeClassLocation,
  normalizeClassMeetingTime,
  normalizeClassTerm,
  normalizeCourseCode,
  normalizeCourseTitle,
  normalizeInstructorName,
} from './classIdentity'

describe('canonical class identity formatting', () => {
  it('standardizes common imported and manual class fields without inventing facts', () => {
    expect(normalizeCourseCode('psyc101')).toBe('PSYC 101')
    expect(normalizeClassTerm('fall   2026')).toBe('Fall 2026')
    expect(normalizeInstructorName('Instructor:  Ndidi Adeyanju, Ph.D.')).toBe('Ndidi Adeyanju, PhD')
    expect(normalizeClassMeetingTime('8am - 9:15am')).toBe('8:00 AM–9:15 AM')
    expect(normalizeClassLocation('Hanes Art Center,  Rm. 121')).toBe('Hanes Art Center, Room 121')
  })

  it('uses stable course titles instead of registrar-style shorthand', () => {
    expect(normalizeCourseTitle('ENG COMP & RHETORIC', 'engl105')).toBe('English Composition & Rhetoric')
    expect(normalizeCourseTitle('GENERAL PSYCHOLOGY', 'PSYC 101')).toBe('Introduction to Psychology')
    expect(normalizeCourseTitle('  Molecular   Genetics ', 'BIOL 202')).toBe('Molecular Genetics')
  })

  it('formats instructors as name plus sourced credential without contact prose or honorifics', () => {
    expect(normalizeInstructorName("Instructor: Erik Maloney (erikglen@live.unc.edu) (If I don't respond within 48 hours, email again.)")).toBe('Erik Maloney')
    expect(normalizeInstructorName('Dr. Emily Weber, Ph.D.')).toBe('Emily Weber, PhD')
    expect(normalizeInstructorName('Prof. Adrian Drummond-Cole')).toBe('Adrian Drummond-Cole')
  })

  it('preserves nonstandard sourced values instead of guessing', () => {
    expect(normalizeClassMeetingTime('Asynchronous online')).toBe('Asynchronous online')
    expect(normalizeInstructorName('A. Rivera')).toBe('A. Rivera')
    expect(normalizeClassLocation('Campus location announced weekly')).toBe('Campus location announced weekly')
  })
})

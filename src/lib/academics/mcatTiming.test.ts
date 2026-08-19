import { describe, expect, it } from 'vitest'
import {
  courseSections, relearningOrder, termToMonths, timingTarget, unknownsNote,
} from '@/lib/academics/mcatTiming'
import type { Course } from '@/lib/types'

const course = (code: string, term: string, patch: Partial<Course> = {}): Course => ({
  id: code, term, code, title: code, credits: 3, grade: 'A', bcpm: true,
  status: 'completed', inResidence: true, satisfies: [], order: 0, ...patch,
})

describe('mapping courses to MCAT sections', () => {
  it('matches a slashed catalog entry like CHEM 261/262', () => {
    expect(courseSections(course('CHEM 262', 'Fall 2026')).map((s) => s.id)).toEqual(['chem-phys'])
    expect(courseSections(course('CHEM 261', 'Fall 2026')).map((s) => s.id)).toEqual(['chem-phys'])
  })

  it('matches an "or" entry on both sides', () => {
    expect(courseSections(course('PHYS 118', 'Fall 2026')).map((s) => s.id)).toEqual(['chem-phys'])
    expect(courseSections(course('PHYS 115', 'Fall 2026')).map((s) => s.id)).toEqual(['chem-phys'])
  })

  it('maps the psych/soc pair', () => {
    expect(courseSections(course('PSYC 101', 'Spring 2026')).map((s) => s.id)).toEqual(['psych-soc'])
    expect(courseSections(course('SOCI 101', 'Fall 2026')).map((s) => s.id)).toEqual(['psych-soc'])
  })

  it('returns nothing for a course the map does not name', () => {
    // Guessing here would make the whole ordering untrustworthy.
    expect(courseSections(course('ENGL 105', 'Fall 2026'))).toEqual([])
    expect(courseSections(course('NSCI 225', 'Spring 2027'))).toEqual([])
  })
})

describe('the timing target', () => {
  it('uses a real MCAT date when one is set', () => {
    const target = timingTarget('2029-01-15')
    expect(target.isPlanningWindow).toBe(false)
    expect(target.label).toContain('MCAT date')
  })

  it('names the planning window instead of substituting silently', () => {
    const target = timingTarget(undefined, Date.UTC(2026, 7, 19))
    expect(target.isPlanningWindow).toBe(true)
    expect(target.label).toContain('no MCAT date is set')
  })

  it('parses terms it understands and refuses ones it does not', () => {
    expect(termToMonths('Fall 2026')).toBe(2026 * 12 + 8)
    expect(termToMonths('Unscheduled')).toBeUndefined()
  })
})

describe('the relearning order', () => {
  const courses = [
    course('PSYC 101', 'Spring 2026'),
    course('CHEM 262', 'Fall 2027'),
    course('ENGL 105', 'Fall 2026'),
    course('BIOL 103', 'Spring 2026'),
    course('CHEM 430', 'Unscheduled', { status: 'planned' }),
  ]

  it('orders by elapsed time and content share, oldest-heaviest first', () => {
    const { entries } = relearningOrder(courses, { mcatDate: '2029-01-15' })
    const codes = entries.map((entry) => entry.course.code)
    // PSYC 101 and BIOL 103 are the same term and their sections carry the same
    // question count, so they tie and are broken alphabetically — deterministic
    // rather than falsely precise. Both must precede the far more recent CHEM 262.
    expect(codes.indexOf('CHEM 262')).toBe(2)
    expect(codes.slice(0, 2).sort()).toEqual(['BIOL 103', 'PSYC 101'])
    expect(entries.map((entry) => entry.position)).toEqual([1, 2, 3])
  })

  it('excludes unmapped courses and unparseable terms', () => {
    const { entries } = relearningOrder(courses, { mcatDate: '2029-01-15' })
    const codes = entries.map((entry) => entry.course.code)
    expect(codes).not.toContain('ENGL 105')
    expect(codes).not.toContain('CHEM 430')
  })

  it('EXPOSES NO SCORE — U-9 holds because the number is never returned', () => {
    const { entries } = relearningOrder(courses, { mcatDate: '2029-01-15' })
    for (const entry of entries) {
      expect(Object.keys(entry).sort()).toEqual(['course', 'evidence', 'position'])
    }
  })

  it('names its evidence in plain language', () => {
    const { entries } = relearningOrder(courses, { mcatDate: '2029-01-15' })
    expect(entries[0].evidence).toMatch(/months before/)
    expect(entries[0].evidence).toMatch(/substantial|moderate|limited/)
    // The AAMC shorthand, not the first word of a comma-separated title.
    expect(entries.map((entry) => entry.evidence).join(' ')).toMatch(/Chem\/Phys|Bio\/Biochem|Psych\/Soc/)
    expect(entries.map((entry) => entry.evidence).join(' ')).not.toContain('Psychological,')
  })

  it('labels the planning window in its evidence when no date is set', () => {
    const { entries, target } = relearningOrder(courses, { now: Date.UTC(2026, 7, 19) })
    expect(target.isPlanningWindow).toBe(true)
    expect(entries[0].evidence).toContain('planning window')
  })

  it('says what it does not know', () => {
    const { entries } = relearningOrder(courses, { mcatDate: '2029-01-15' })
    expect(unknownsNote(entries)).toContain('not a retention prediction')
    expect(unknownsNote([])).toContain('nothing to order')
  })
})

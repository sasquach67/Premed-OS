import { describe, expect, it } from 'vitest'
import { parseSyllabusText, weightGap } from './syllabusParser'

describe('syllabus parser', () => {
  const text = `CHEM 262 — Organic Chemistry II
Week 1: Aromatic substitution
Midterm Exam — October 14, 2026
Problem sets — 15%
Exams — 60%
Final — 25%
Problem set 1 due September 9, 2026
Attendance is required. Office hours Tuesday 2 PM.`

  it('extracts deterministic, attributable syllabus facts without a key', () => {
    const proposal = parseSyllabusText(text)
    expect(proposal.items.some((item) => item.kind === 'identity' && item.label === 'CHEM 262')).toBe(true)
    expect(proposal.items.some((item) => item.kind === 'exams' && item.value?.includes('October 14'))).toBe(true)
    expect(proposal.items.filter((item) => item.kind === 'weights')).toHaveLength(3)
    expect(proposal.items.find((item) => item.kind === 'units')?.evidence.location).toBe('line 2')
    expect(weightGap(proposal.items)).toBe(0)
  })

  it('calls a near-empty text layer a scan instead of claiming nothing parsed', () => {
    expect(parseSyllabusText('  ').scanDetected).toBe(true)
  })
})

describe('document classification (§4.1-M-d)', () => {
  const problemSet = [
    'CHEM 262 Problem Set 6',
    'Due Oct 24, 2026',
    '1. Draw the mechanism for the following substitution.',
    '2. Rank the leaving groups below.',
    '3. Predict the major product.',
  ].join('\n')

  const thinSyllabus = [
    'CHEM 262 - Organic Chemistry II',
    'Instructor: Dr. Alvarez, office hours Tue 2:00 PM, room 214',
  ].join('\n')

  it('calls a problem set unrecognized — a lone due date is not structure', () => {
    const parsed = parseSyllabusText(problemSet, 'Problem Set 6.pdf')
    expect(parsed.documentKind).toBe('unrecognized')
    expect(parsed.structureFound).toEqual([])
    expect(parsed.numberedItems).toBe(3)
  })

  it('keeps a one-page syllabus with only logistics as a syllabus', () => {
    const parsed = parseSyllabusText(thinSyllabus, 'Syllabus.pdf')
    expect(parsed.documentKind).toBe('syllabus')
    expect(parsed.structureFound).toContain('logistics')
  })

  it('never calls an unreadable scan unrecognized — that is a different diagnosis', () => {
    const parsed = parseSyllabusText('', 'Scan.pdf', 'image')
    expect(parsed.scanDetected).toBe(true)
    expect(parsed.documentKind).toBe('syllabus')
  })

  it('reports the structural signals it did find', () => {
    const parsed = parseSyllabusText(['CHEM 262 - Organic Chemistry II', 'Problem sets 15%', 'Week 1 Introduction'].join('\n'))
    expect(parsed.documentKind).toBe('syllabus')
    expect(parsed.structureFound).toEqual(expect.arrayContaining(['weights', 'units']))
  })
})

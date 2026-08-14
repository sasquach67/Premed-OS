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

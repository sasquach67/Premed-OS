import { describe, expect, it } from 'vitest'
import { proposeClassType } from './classTypeProposal'

describe('class type proposal', () => {
  it('uses a high-confidence staged-writing syllabus signal before course metadata', () => {
    const proposal = proposeClassType({
      courseCode: 'BIOL 252',
      bcpm: true,
      syllabusItems: [{ kind: 'deadlines', label: 'Revision draft due October 8', confidence: 'high' }],
    })

    expect(proposal).toEqual({
      kind: 'suggestion',
      type: 'writing',
      source: 'syllabus',
      reason: 'Suggested Writing — this syllabus includes writing work.',
    })
  })

  it('uses a high-confidence units-and-exams syllabus signal for STEM', () => {
    const proposal = proposeClassType({
      courseCode: 'ENGL 105',
      syllabusItems: [
        { kind: 'units', label: 'Unit 1', confidence: 'high' },
        { kind: 'units', label: 'Unit 2', confidence: 'high' },
        { kind: 'exams', label: 'Midterm exam', confidence: 'high' },
      ],
    })

    expect(proposal).toEqual({
      kind: 'suggestion',
      type: 'stem',
      source: 'syllabus',
      reason: 'Suggested STEM — this syllabus has units and exams to review.',
    })
  })

  it('prefers a course with graded reading responses over the generic units-and-exams STEM signal', () => {
    expect(proposeClassType({ syllabusItems: [
      { kind: 'weights', label: 'Submit 6 Draft Reading Responses', value: '3%', confidence: 'high' },
      { kind: 'units', label: 'Week 1', confidence: 'high' },
      { kind: 'units', label: 'Week 2', confidence: 'high' },
      { kind: 'exams', label: 'Exam 1', value: '2026-09-15', confidence: 'high' },
    ] })).toMatchObject({ kind: 'suggestion', type: 'writing', source: 'syllabus' })
  })

  it('falls back to a narrowly recognised writing course code', () => {
    expect(proposeClassType({ courseCode: 'ENGL 105' })).toEqual({
      kind: 'suggestion',
      type: 'writing',
      source: 'course-code',
      reason: 'Suggested Writing — this course code is usually writing-intensive.',
    })
  })

  it('falls back to explicit BCPM metadata only after stronger evidence is absent', () => {
    expect(proposeClassType({ courseCode: 'BIOL 252', bcpm: true })).toEqual({
      kind: 'suggestion',
      type: 'stem',
      source: 'course-metadata',
      reason: 'Suggested STEM — this course is marked BCPM.',
    })
  })

  it('does not treat low-confidence or ambiguous facts as a selection', () => {
    expect(proposeClassType({
      courseCode: 'ART 102',
      syllabusItems: [
        { kind: 'units', label: 'Unit 1', confidence: 'low' },
        { kind: 'exams', label: 'Final exam', confidence: 'low' },
      ],
    })).toEqual({ kind: 'needs-choice' })
    expect(proposeClassType({})).toEqual({ kind: 'needs-choice' })
  })

  it('is stable and leaves frozen input untouched', () => {
    const items = Object.freeze([
      Object.freeze({ kind: 'weights' as const, label: 'Papers', value: '55%', confidence: 'high' as const }),
    ])
    const input = Object.freeze({ courseCode: 'PSYC 101', bcpm: true, syllabusItems: items })

    const once = proposeClassType(input)
    expect(proposeClassType(input)).toEqual(once)
    expect(input).toEqual({ courseCode: 'PSYC 101', bcpm: true, syllabusItems: items })
    expect(once.kind === 'suggestion' && ['stem', 'writing', 'general'].includes(once.type)).toBe(true)
  })
})

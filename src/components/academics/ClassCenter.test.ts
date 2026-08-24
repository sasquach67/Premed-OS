import { describe, expect, it } from 'vitest'
import { classCardColor } from './ClassCenter'
import { classTypeDraftDecision } from '@/lib/academics/classTypeDraftDecision'

describe('Class Center card compatibility', () => {
  it('falls back to the current blue accent for a persisted retired color', () => {
    expect(classCardColor('teal')).toBe('blue')
    expect(classCardColor(undefined)).toBe('blue')
    expect(classCardColor('purple')).toBe('purple')
  })
})

describe('Class Center add-class type selection', () => {
  it('keeps a blank manual class unselected until the student chooses a type', () => {
    expect(classTypeDraftDecision({ isCreate: true, courseCode: '' })).toEqual({ selectionKind: 'needs-choice' })
  })

  it('shows an attributable Writing proposal without persisting it', () => {
    expect(classTypeDraftDecision({ isCreate: true, courseCode: 'ENGL 105' })).toEqual({
      selectedType: 'writing',
      selectionKind: 'suggestion',
      proposal: {
        kind: 'suggestion',
        type: 'writing',
        source: 'course-code',
        reason: 'Suggested Writing — this course code is usually writing-intensive.',
      },
    })
  })

  it('keeps the student choice when they revise the course code', () => {
    expect(classTypeDraftDecision({
      isCreate: true,
      courseCode: 'BIOL 252',
      studentChoice: 'general',
    })).toEqual({ selectedType: 'general', selectionKind: 'student' })
  })

  it('uses the already-saved type for edit flows without proposing another one', () => {
    expect(classTypeDraftDecision({
      isCreate: false,
      courseCode: 'ENGL 105',
      savedType: 'stem',
    })).toEqual({ selectedType: 'stem', selectionKind: 'saved' })
  })
})

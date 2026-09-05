import { describe, expect, it } from 'vitest'
import type { AcademicFile } from '@/lib/types'
import { instructorSourceFileIds, lectureSourcePriorityInstruction } from './lectureSourcePriority'

describe('lecture source priority', () => {
  it('prefers the attached transcript and typed slides, not a textbook with a lecture-like name', () => {
    const file = (id: string, type: AcademicFile['type']): AcademicFile => ({ id, type, title: 'Lecture material', courseId: 'course', sourceType: 'upload', owner: 'mine', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 })
    expect(instructorSourceFileIds([file('transcript', 'other'), file('slides', 'lecture-slides'), file('book', 'reading')], 'transcript')).toEqual(['transcript', 'slides'])
  })
  it('does not claim instructor evidence when none is identified', () => {
    expect(lectureSourcePriorityInstruction([])).toBe('')
    const instruction = lectureSourcePriorityInstruction(['chunk', 'chunk'])
    expect(instruction).toContain('Instructor evidence chunk IDs: chunk.')
    expect(instruction).toContain('learning objectives verbatim')
    expect(instruction).toContain('flag the disagreement')
  })
})

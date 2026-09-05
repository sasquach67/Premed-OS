import { describe, expect, it } from 'vitest'
import type { AcademicFile, SourceChunk } from '@/lib/types'
import { selectGenerationSourceChunks } from './syncGenerationSources'
import { instructorSourceFileIds, lectureSourcePriorityInstruction } from './lectureSourcePriority'

describe('lecture source priority', () => {
  it('prefers the attached transcript and typed slides, not a textbook with a lecture-like name', () => {
    const file = (id: string, type: AcademicFile['type']): AcademicFile => ({ id, type, title: 'Lecture material', courseId: 'course', sourceType: 'upload', owner: 'mine', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 })
    expect(instructorSourceFileIds([file('transcript', 'other'), file('slides', 'lecture-slides'), file('book', 'reading')], 'transcript')).toEqual(['transcript', 'slides'])
  })
  it('documents weighted selection rather than promising full instructor coverage', () => {
    const chunks = ['transcript', 'slides', ...Array.from({ length: 10 }, (_, i) => `book-${i}`)].flatMap((fileId) => Array.from({ length: 60 }, (_, order) => ({ id: `${fileId}-${order}`, fileId, courseId: 'course', content: 'Template pairing mechanism and related explanation.', order } as SourceChunk)))
    const selected = selectGenerationSourceChunks(chunks, { preferredFileIds: ['transcript', 'slides'], maxChunks: 40 })
    const count = (fileId: string) => selected.filter((chunk) => chunk.fileId === fileId).length
    expect(count('transcript')).toBeGreaterThan(count('book-0'))
    expect(count('slides')).toBeGreaterThan(count('book-0'))
    expect(count('transcript')).toBeLessThan(60)
    expect(selected).toHaveLength(40)
    expect(chunks).toHaveLength(720)
  })
  it('does not claim instructor evidence when none is identified', () => {
    expect(lectureSourcePriorityInstruction([])).toContain('No instructor evidence was identified')
    const instruction = lectureSourcePriorityInstruction(['chunk', 'chunk'])
    expect(instruction).toContain('Instructor evidence chunk IDs: chunk.')
    expect(instruction).toContain('learning objectives verbatim')
    expect(instruction).toContain('flag the disagreement')
    expect(instruction).toContain('only explicitly stated learning objectives verbatim')
    expect(instruction).toContain('transcript and slide passages')
    expect(instruction).toContain('Do not invent slide numbers')
  })
})

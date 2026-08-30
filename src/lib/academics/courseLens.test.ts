import { describe, expect, it } from 'vitest'
import { applicableCourseLens, courseLensInstruction } from './courseLens'

const chunks = [
  { id: 'syllabus-goal', fileId: 'syllabus', courseId: 'anth', content: 'Compare healing systems in ethnographic context.' },
  { id: 'lecture-kinship', fileId: 'lecture', courseId: 'anth', content: 'Kinship and reciprocity shape authority and care.' },
] as any

describe('course lens context', () => {
  const lens = {
    text: 'Read cases through comparative healing systems, ethnographic context, kinship and reciprocity, and culturally situated meanings of illness and a good outcome. Reflect on biomedical assumptions only when the supplied course evidence supports it.',
    sourceFileIds: ['syllabus', 'lecture'], sourceChunkIds: ['syllabus-goal', 'lecture-kinship'], updatedAt: 1,
  }

  it('only becomes generation context when every declared source is explicitly selected', () => {
    expect(applicableCourseLens(lens, chunks.slice(0, 1), { syllabus: 'Syllabus learning goals', lecture: 'Lecture 1 transcript' })).toBeUndefined()
    expect(applicableCourseLens(lens, chunks, { syllabus: 'Syllabus learning goals', lecture: 'Lecture 1 transcript' })).toEqual(expect.objectContaining({
      text: lens.text,
      sourceLabels: ['Syllabus learning goals', 'Lecture 1 transcript'],
    }))
  })

  it('makes the source-only boundary explicit in the generation instruction', () => {
    const context = applicableCourseLens(lens, chunks, { syllabus: 'Syllabus learning goals', lecture: 'Lecture 1 transcript' })!
    const instruction = courseLensInstruction(context)
    expect(instruction).toContain('Course lens — student-reviewed course context')
    expect(instruction).toContain('Do not add cultural, historical, disciplinary, or factual context')
    expect(instruction).toContain('Course lens used')
  })
})

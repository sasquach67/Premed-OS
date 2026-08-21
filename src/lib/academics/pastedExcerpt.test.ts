import { describe, expect, it } from 'vitest'
import { buildPastedExcerpt, MIN_PASTED_EXCERPT_CHARACTERS } from './pastedExcerpt'

describe('pasted textbook excerpt intake', () => {
  const text = 'A student-pasted, bounded textbook section with enough exact material to be a useful source for a course-specific study output. '.repeat(2)

  it('creates one owned paste material and one exact-range source chunk', () => {
    const built = buildPastedExcerpt({
      courseId: 'course-1', text, title: 'Reading 2', sourceLabel: 'OpenStax Psychology', sectionLabel: '1.2', now: 4, order: 3,
    })!
    expect(built.file).toMatchObject({
      courseId: 'course-1', sourceType: 'paste', owner: 'mine', type: 'other', title: 'Reading 2', order: 3,
    })
    expect(built.file.notes).toContain('OpenStax Psychology')
    expect(built.chunks).toHaveLength(1)
    expect(built.chunks[0]).toMatchObject({
      courseId: 'course-1', fileId: built.file.id, content: text.trim(), characterStart: 0, characterEnd: text.trim().length,
    })
  })

  it('refuses a blank or too-short paste without constructing a partial record', () => {
    expect(buildPastedExcerpt({ courseId: 'course-1', text: '' })).toBeUndefined()
    expect(buildPastedExcerpt({ courseId: 'course-1', text: 'x'.repeat(MIN_PASTED_EXCERPT_CHARACTERS - 1) })).toBeUndefined()
  })
})

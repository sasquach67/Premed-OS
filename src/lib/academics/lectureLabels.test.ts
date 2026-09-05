import { describe, expect, it } from 'vitest'
import { lectureDisplayTitle } from './lectureLabels'
import { conciseStudyGuideTitle } from './generateStudyGuide'

describe('completed lecture titles', () => {
  it('keeps the source lesson number instead of its position in the list', () => {
    expect(lectureDisplayTitle(1, 'Lecture 2', 'Gene Expression')).toBe('Lesson 2 — Gene Expression')
  })
  it('does not duplicate a lesson prefix supplied by the AI', () => {
    expect(lectureDisplayTitle(1, 'Lesson 2', 'Lesson 2 — Gene Expression')).toBe('Lesson 2 — Gene Expression')
  })
  it('recovers a provider-authored topic from an existing guide without a TITLE section', () => {
    expect(conciseStudyGuideTitle({ sections: [
      { id: 'overview', title: 'At a glance', blocks: [] },
      { id: 'section_1', title: 'Gene Expression', blocks: [] },
    ] })).toBe('Gene Expression')
  })
})

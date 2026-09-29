import { describe, expect, it } from 'vitest'
import { completedLectureTitle, lectureDisplayTitle } from './lectureLabels'
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

it('keeps custom exam titles and uses AI titles for generic journal labels without lesson numbering', () => {
  expect(completedLectureTitle(3, { title: 'Exam 1 — Anthropology', aiTitle: 'Culture and Healing', studyIntent: { purpose: 'exam-prep' } })).toBe('Exam 1 — Anthropology')
  expect(completedLectureTitle(3, { title: 'Study session 3', aiTitle: 'Culture and Healing', studyIntent: { purpose: 'study' } })).toBe('Culture and Healing')
})


it('preserves explicit student titles over both stored AI titles and generated guide headings', () => {
  const studyGuide = { specId: 'synthetic', specHash: 'synthetic', courseId: 'synthetic', topicId: 'synthetic', sections: [{ id: 'heading', title: 'Old generated heading', blocks: [] }] }
  expect(completedLectureTitle(1, { title: 'Student named entry', aiTitle: 'Old AI title', studyGuide })).toBe('Lesson 1 — Student named entry')
  expect(completedLectureTitle(1, { title: 'Student named entry', studyGuide })).toBe('Lesson 1 — Student named entry')
  expect(completedLectureTitle(1, { title: 'Lecture 2 — Student named entry', aiTitle: 'Old AI title', studyGuide })).toBe('Lesson 2 — Student named entry')
  expect(completedLectureTitle(1, { title: 'Lecture 2', studyGuide })).toBe('Lesson 2 — Old heading')
})

import { expect, it } from 'vitest'
import { conciseStudyGuideTitle } from './generateStudyGuide'
import type { StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
function guide(titles: string[]): Pick<StudyGuideArtifact, 'sections'> {
  return { sections: [
    { id: 'title', title: 'TITLE', blocks: titles.map((content, index) => ({ id: String(index), type: 'prose', provenance: 'clarification', text: { content } })) },
    { id: 'comparison', title: 'Comparing Competing Explanations', blocks: [] },
  ] }
}
it('does not turn a coverage receipt into the Notebook title', () => {
  expect(conciseStudyGuideTitle(guide(['Built from 1 of your 1 files.']))).toBe('Comparing Competing Explanations')
  expect(conciseStudyGuideTitle(guide(['Built from 2 files', 'Evidence and Interpretation']))).toBe('Evidence and Interpretation')
  expect(conciseStudyGuideTitle(guide(['Evidence and Interpretation']))).toBe('Evidence and Interpretation')
})

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LecturePreview } from './LecturePreview'

describe('LecturePreview', () => {
  it('samples saved generated content without embedding the complete guide', () => {
    const html = renderToStaticMarkup(<LecturePreview sourceCount={43} lecture={{
      workspaceState: 'complete',
      studyGuide: {
        specId: 'guide', specHash: 'saved', courseId: 'course', topicId: 'lecture',
        sections: [
          { id: 'title', title: 'Title', blocks: [{ id: 'title', type: 'prose', provenance: 'source', text: { content: 'Title-only text' } }] },
          { id: 'overview', title: 'At a glance', blocks: [{ id: 'summary', type: 'bullets', provenance: 'source', items: ['First summary', 'Second summary', 'Third summary'].map(content => ({ content })) }] },
          { id: 'details', title: 'Details', blocks: Array.from({ length: 6 }, (_, index) => ({ id: `concept-${index}`, type: 'prose' as const, provenance: 'source' as const, conceptLabel: `Concept ${index}`, text: { content: 'Detailed study content' } })) },
        ],
      },
    }} />)
    expect(html).toContain('First summary')
    expect(html).toContain('Second summary')
    expect(html).toContain('Concept 3')
    expect(html).toContain('43 selected sources')
    for (const omitted of ['Title-only text', 'Third summary', 'Concept 4', 'Detailed study content']) expect(html).not.toContain(omitted)
  })

  it('explains the ungenerated state without implying there is a saved guide', () => {
    const html = renderToStaticMarkup(<LecturePreview sourceCount={1} lecture={{}} />)
    expect(html).toContain('Sources captured')
    expect(html).toContain('No Study Guide has been generated yet')
    expect(html).toContain('1 selected source')
  })
})

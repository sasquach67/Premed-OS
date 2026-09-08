import { describe, expect, it } from 'vitest'
import { collectReaderEvidence, isRoutineNotebookCitation, notebookReaderContents, readerBlocks, splitNotebookAnnotations } from './readerPresentation'
import { revisionFixture } from './revision.test-fixtures'

describe('conservative notebook annotation presentation', () => {
  it.each(['[Source: ref-one p.3.]', '[Source synthesis: ref-one p.3.]', '[Source and clarification: ref-one p.3.]', '[Clarification of ref-one Activities 2-5.]', '[ref-one pp.1-3; ref-two Figure 2.]'])('recognizes explicit source/location syntax: %s', span => {
    expect(isRoutineNotebookCitation(span, ['ref-one', 'ref-two'])).toBe(true)
  })
  it.each(['[Source: missing p.3.]', '[Source: ref-one p.3; this proves causation.]', '[Source: ref-one p.3; participants were excluded.]', '[Source: ref-one p.3; NOT RANDOMIZED.]', '[Source: ref-one results discussion.]', '[Replace the conclusion with this statement.]'])('keeps unknown or substantive brackets: %s', span => {
    const value = `${span} Exact teaching text.  `
    expect(splitNotebookAnnotations(value, ['ref-one']).body).toBe(value)
  })
  it('retains consequential annotations, including answer-specific invented-data cautions', () => {
    const value = 'Answer remains here. [Source: ref-one p.3; numerical inputs are hypothetical.]'
    const result = splitNotebookAnnotations(value, ['ref-one'])
    expect(result.trailing).toEqual([{ text: '[Source: ref-one p.3; numerical inputs are hypothetical.]', kind: 'limit' }])
    expect(result.body).toBe('Answer remains here.')
  })
  it('handles annotation-only paragraphs and both boundaries without rewriting the input', () => {
    const only = '[Source: ref-one p.3.]'
    expect(splitNotebookAnnotations(only, ['ref-one'])).toEqual({ body: '', leading: [{ text: only, kind: 'citation' }], trailing: [] })
    const raw = '[Source: ref-one p.3.] A  sentence.\nAnother line. [ref-two p.4.]'
    const result = splitNotebookAnnotations(raw, ['ref-one', 'ref-two'])
    expect(result.body).toBe('A  sentence.\nAnother line.')
    expect(result.leading).toHaveLength(1); expect(result.trailing).toHaveLength(1)
    expect(raw).toBe('[Source: ref-one p.3.] A  sentence.\nAnother line. [ref-two p.4.]')
  })
})

describe('reader evidence and navigation boundaries', () => {
  it('never promotes practice-only evidence into a section panel', () => {
    const pkg = revisionFixture()
    const teaching = pkg.entries[0].sections[0].blocks[0]
    const practice = pkg.entries[0].sections[1].blocks[0]
    pkg.sources[0].excerpts.push({ id: 'secret-answer', location: 'Answer key', text: 'Answer-only evidence.' })
    practice.excerptIds = ['secret-answer']
    const grouped = collectReaderEvidence([teaching, practice], pkg, 'section')
    expect(grouped[0].excerpts.map(e => e.id)).toEqual(['excerpt-mapping'])
    expect(grouped[0].excerpts[0].blockIds).toEqual([teaching.id])
    expect(collectReaderEvidence([practice], pkg, 'section')).toEqual([])
    expect(collectReaderEvidence([practice], pkg, 'item')[0].excerpts[0].id).toBe('secret-answer')
  })
  it.each(['review', 'assessment', 'assignment'] as const)('routes mixed-purpose %s content by block type, not section purpose', goal => {
    const pkg = revisionFixture(), entry = pkg.entries[0]
    entry.goal = goal
    entry.sections[0].purpose = 'workspace'
    entry.sections[0].blocks.push(entry.sections[1].blocks[0]); entry.sections.splice(1, 1)
    expect(readerBlocks(entry.sections[0].blocks, 'study').map(b => b.type)).toEqual(['paragraph'])
    expect(readerBlocks(entry.sections[0].blocks, 'practice').map(b => b.type)).toEqual(['practice'])
    for (const mode of ['study', 'practice'] as const) expect(notebookReaderContents(pkg, entry.id, mode, 'reader').some(item => item.title === 'mapping explanation')).toBe(true)
    expect(notebookReaderContents(pkg, entry.id, 'practice', 'reader')[0].title).toBe('Mastery objectives')
  })
})

import { describe, expect, it } from 'vitest'
import { collectReaderAnnotations, collectReaderEvidence, isRoutineNotebookCitation, notebookReaderContents, readerBlocks, splitNotebookAnnotations } from './readerPresentation'
import { revisionFixture } from './revision.test-fixtures'
import inventory from './reader-fixtures/biol-reader-annotations.json'

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
    expect(result.trailing).toEqual([{ text: '[Source: ref-one p.3; numerical inputs are hypothetical.]', kind: 'limit', displayText: 'Numerical inputs are hypothetical.' }])
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

describe('actual accepted BIOL boundary inventory', () => {
  const packageSourceIds = [...new Set(inventory.flatMap(record => record.sourceIds))]
  it.each(inventory)('relocates $blockId $field provenance without losing qualifications or body', ({ span }) => {
    for (const value of [`${span} Exact teaching body.`, `Exact teaching body. ${span}`]) {
      const split = splitNotebookAnnotations(value, packageSourceIds), notes = [...split.leading, ...split.trailing]
      expect(split.body).toBe('Exact teaching body.')
      expect(notes).toHaveLength(1); expect(notes[0].text).toBe(span)
      if (notes[0].kind === 'limit') { expect(notes[0].displayText).toBeTruthy(); expect(notes[0].displayText).not.toMatch(/^\[/) }
    }
  })
  it('preserves the explicit qualification, not raw provenance jargon', () => {
    const cases = [
      ['[Clarification and source paraphrase: S5 Activity 1; Activity 5A questions 1\u20133 and data table. The illustration is a study explanation, not a copied assignment response.]', ['S5'], 'The illustration is a study explanation, not a copied assignment response.'],
      ['[Clarification of those responses; original textbook figure unavailable.]', ['S2', 'S6'], 'Original textbook figure unavailable.'],
      ['[Clarification and source paraphrase: same sources. The histogram distinction relies on the supplied GRQ response, not inspection of Appendix F.]', ['S2', 'S6'], 'The histogram distinction relies on the supplied GRQ response, not inspection of Appendix F.'],
      ['[S5 Activity 5B and table; the small practice dataset is generated.]', ['S5'], 'The small practice dataset is generated.'],
      ['[Source: S5 Activity 5; illustrative calculation, not empirical observations.]', ['S5'], 'Illustrative calculation, not empirical observations.'],
    ] as const
    for (const [span, ids, expected] of cases) expect(splitNotebookAnnotations(`${span} Body.`, [...ids]).leading[0]?.displayText).toBe(expected)
  })
  it('keeps unknown IDs, free prose and internal brackets; folds adjacent known boundary notes', () => {
    for (const span of ['[Student-source explanation: unknown GRQ 3.]', '[Source: S5 Activity 2 graphs; this proves treatment efficacy.]', '[Do not use the original source.]']) expect(splitNotebookAnnotations(`${span} Body.`, ['S5']).body).toBe(`${span} Body.`)
    expect(splitNotebookAnnotations('An internal [Source: S5 Activity 2 graphs.] note.', ['S5']).body).toBe('An internal [Source: S5 Activity 2 graphs.] note.')
    const parts = splitNotebookAnnotations('[Source: S5 Activity 1.] [Source: S5 Activity 2 graphs.] Body. [Source: S5 Activity 3.]', ['S5'])
    expect(parts.body).toBe('Body.'); expect(parts.leading).toHaveLength(2); expect(parts.trailing).toHaveLength(1)
  })
})

describe('reader evidence and navigation boundaries', () => {
  it('identifies known-but-unlinked references without promoting their excerpts', () => {
    const pkg = revisionFixture(), block = pkg.entries[0].sections[0].blocks[0]
    if (block.type !== 'paragraph') throw new Error('Expected paragraph fixture')
    pkg.sources.push({ ...pkg.sources[0], id: 'unlinked-source', title: 'Known but unlinked source', used: false, excerpts: [{ id: 'unlinked-excerpt', location: 'Page 6', text: 'Not evidence for this item.' }] })
    block.text = `[Source: ${block.sourceIds[0]} p.3; unlinked-source p.6.] Body.`
    expect(collectReaderAnnotations([block], pkg, 'section')[0].unlinkedSourceIds).toEqual(['unlinked-source'])
    expect(collectReaderEvidence([block], pkg, 'section').some(group => group.source.id === 'unlinked-source')).toBe(false)
  })
  it('starts study navigation with teaching and places coverage last', () => {
    const pkg = revisionFixture(); pkg.entries[0].sections[0].title = 'At a glance'
    const contents = notebookReaderContents(pkg, pkg.entries[0].id, 'study', 'reader')
    expect(contents[0].title).toBe('At a glance'); expect(contents.at(-1)?.title).toBe("What's covered and missing")
  })
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
    if (practice.type !== 'practice') throw new Error('Expected practice fixture')
    practice.answer = `[Source: ${practice.sourceIds[0]} p.3.] Answer-only note.`
    expect(collectReaderAnnotations([teaching, practice], pkg, 'section').some(note => note.blockId === practice.id)).toBe(false)
    expect(collectReaderAnnotations([practice], pkg, 'item')[0].blockId).toBe(practice.id)
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
  it('omits dedicated practice setups from Study and its contents without changing all-content or Practice views', () => {
    const pkg = revisionFixture(), entry = pkg.entries[0], section = entry.sections[1]
    section.purpose = 'practice'
    section.blocks.unshift({ ...entry.sections[0].blocks[0], id: 'dedicated-neutral-setup' })
    const before = JSON.stringify(pkg)
    expect(readerBlocks(section.blocks, 'study', section.purpose)).toEqual([])
    expect(notebookReaderContents(pkg, entry.id, 'study', 'reader').some(item => item.title === section.title)).toBe(false)
    expect(notebookReaderContents(pkg, entry.id, 'practice', 'reader').some(item => item.title === section.title)).toBe(true)
    expect(readerBlocks(section.blocks, 'practice', section.purpose).map(block => block.type)).toEqual(['practice'])
    expect(readerBlocks(section.blocks, 'all', section.purpose)).toEqual(section.blocks)
    expect(readerBlocks(section.blocks, 'study')).toHaveLength(1)
    expect(JSON.stringify(pkg)).toBe(before)
  })
})

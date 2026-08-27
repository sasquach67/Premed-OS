import { describe, expect, it } from 'vitest'
import { isDuplicateOf, parseTranscriptText } from '@/lib/academics/transcriptParser'

const UNC = `University of North Carolina at Chapel Hill
Fall 2026
BIOL 252 NEUROBIOLOGY 3.000 A-
CHEM 261 ORGANIC CHEMISTRY I 3.000 B+
Spring 2027
BIOL 205 CELL BIOLOGY 4.000 A`

describe('parseTranscriptText', () => {
  it('reads institution, term and year context down onto each course line', () => {
    const { candidates } = parseTranscriptText(UNC)
    expect(candidates).toHaveLength(3)
    expect(candidates[0]).toMatchObject({
      institution: 'University of North Carolina at Chapel Hill',
      courseNumberExact: 'BIOL 252',
      creditsExact: '3.000',
      gradeExact: 'A-',
      term: 'Fall',
      year: '2026',
    })
    // the later header must re-scope the rows beneath it, not the whole file
    expect(candidates[2]).toMatchObject({ term: 'Spring', year: '2027', courseNumberExact: 'BIOL 205' })
  })

  it('preserves the exact credit and grade strings rather than coercing them', () => {
    const { candidates } = parseTranscriptText(UNC)
    expect(candidates[0].creditsExact).toBe('3.000')
    expect(candidates[1].gradeExact).toBe('B+')
  })

  it('keeps an unreadable field blank and names it, instead of guessing', () => {
    const { candidates } = parseTranscriptText('Wake Tech Community College\nFall 2025\nCHM 151 GENERAL CHEMISTRY I B')
    expect(candidates).toHaveLength(1)
    expect(candidates[0].creditsExact).toBe('')
    expect(candidates[0].missing).toContain('creditsExact')
    expect(candidates[0].gradeExact).toBe('B')
  })

  it('carries the exact source line as evidence for every row', () => {
    const { candidates } = parseTranscriptText(UNC)
    expect(candidates[0].evidenceQuote).toBe('BIOL 252 NEUROBIOLOGY 3.000 A-')
  })

  it('reads an inline registrar term code such as FA26', () => {
    const { candidates } = parseTranscriptText('Duke University\nBIOL 252 NEUROBIOLOGY 3.000 A- FA26')
    expect(candidates[0]).toMatchObject({ term: 'Fall', year: '2026', gradeExact: 'A-' })
  })

  it('preserves the printed title exactly, including all-caps registrar lines', () => {
    // Was: title-cased "NEUROBIOLOGY" to "Neurobiology". A transcript record's
    // whole promise is that the printed string survives unchanged.
    const shouting = parseTranscriptText('Duke University\nFall 2026\nBIOL 252 NEUROBIOLOGY 3.000 A-')
    expect(shouting.candidates[0].titleExact).toBe('NEUROBIOLOGY')
    const mixed = parseTranscriptText('Duke University\nFall 2026\nBIOL 252 Neurobiology of Disease 3.000 A-')
    expect(mixed.candidates[0].titleExact).toBe('Neurobiology of Disease')
  })

  it('reports text that contains no course line as unrecognized', () => {
    const proposal = parseTranscriptText('Dear student,\nYour enrollment deposit has been received.')
    expect(proposal.candidates).toHaveLength(0)
    expect(proposal.unrecognized).toBe(true)
  })

  it('does not report a scan as unrecognized — the bytes were a picture', () => {
    const proposal = parseTranscriptText('', 'scan.png', 'image', true)
    expect(proposal.scanDetected).toBe(true)
    expect(proposal.unrecognized).toBe(false)
  })

  it('ignores a bare heading that has no title and no grade', () => {
    const { candidates } = parseTranscriptText('Duke University\nFall 2026\nBIOL 252\nBIOL 205 CELL BIOLOGY 4.000 A')
    expect(candidates.map((c) => c.courseNumberExact)).toEqual(['BIOL 205'])
  })
})

describe('isDuplicateOf', () => {
  const existing = [{ institution: 'UNC Chapel Hill', courseNumberExact: 'BIOL 252', term: 'Fall', year: '2026' }]

  it('matches on institution, number, term and year regardless of spacing or case', () => {
    expect(isDuplicateOf({ institution: 'unc  chapel hill', courseNumberExact: 'biol 252', term: 'fall', year: '2026' }, existing)).toBe(true)
  })

  it('treats a different term as a separate attempt, not a duplicate', () => {
    expect(isDuplicateOf({ institution: 'UNC Chapel Hill', courseNumberExact: 'BIOL 252', term: 'Spring', year: '2027' }, existing)).toBe(false)
  })
})

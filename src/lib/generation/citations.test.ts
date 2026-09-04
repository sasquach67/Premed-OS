import { describe, expect, it } from 'vitest'
import {
  blocksMissingCitation, citationKey, closedCitationSet, verifyStructuredCitations,
} from '@/lib/generation/citations'
import { conceptIdFor } from '@/lib/generation/conceptId'
import { isPersistable, runDeterministicChecks } from '@/lib/generation/quality/deterministic'
import { REQUIRED_SECTION_IDS } from '@/lib/generation/artifacts/studyGuide.v1'
import type {
  ContentBlock, SourceRef, StudyGuideArtifact,
} from '@/lib/generation/schemas/studyGuide.v1'

const chunks = [
  { chunkId: 'c1', fileId: 'f1', content: 'Phosphofructokinase-1 is the committed step of glycolysis.' },
  { chunkId: 'c2', fileId: 'f1', content: 'ATP inhibits PFK-1 allosterically.' },
]
const ref = (patch: Partial<SourceRef> = {}): SourceRef =>
  ({ chunkId: 'c1', fileId: 'f1', start: 0, end: 20, ...patch })

const block = (patch: Partial<ContentBlock> = {}): ContentBlock => ({
  id: 'b1', type: 'prose', provenance: 'source', sourceRef: ref(),
  text: { content: 'PFK-1 commits glucose to glycolysis.' }, ...patch,
})
const guide = (blocks: ContentBlock[]): StudyGuideArtifact => ({
  specId: 'study-guide-v1', specHash: 'abc', courseId: 'c1', topicId: 't1',
  sections: [{ id: 's1', title: 'Core concepts', blocks }],
})

describe('the closed citation set — pass 1 to pass 2', () => {
  it('keeps a citation whose offsets fall inside its real chunk', () => {
    const { survivors, dropped } = closedCitationSet([ref()], chunks)
    expect(survivors).toHaveLength(1)
    expect(dropped).toEqual([])
  })

  it('drops an offset past the end of the chunk rather than clamping it', () => {
    // Clamping would invent a quotation the source does not contain.
    const { survivors, dropped } = closedCitationSet([ref({ end: 9_999 })], chunks)
    expect(survivors).toEqual([])
    expect(dropped).toHaveLength(1)
  })

  it('drops a citation to a chunk the server does not own', () => {
    expect(closedCitationSet([ref({ chunkId: 'not-mine' })], chunks).survivors).toEqual([])
  })

  it('drops a citation whose file does not match its chunk', () => {
    expect(closedCitationSet([ref({ fileId: 'other-file' })], chunks).survivors).toEqual([])
  })

  it('rejects an inverted or zero-width range', () => {
    expect(closedCitationSet([ref({ start: 10, end: 10 })], chunks).survivors).toEqual([])
    expect(closedCitationSet([ref({ start: 10, end: 4 })], chunks).survivors).toEqual([])
  })
})

describe('pass 2 may carry a citation, never mint one', () => {
  it('accepts an artifact citing only the closed set', () => {
    const { keys } = closedCitationSet([ref()], chunks)
    expect(verifyStructuredCitations(guide([block()]), keys).ok).toBe(true)
  })

  it('REJECTS an artifact citing anything else, and names what was minted', () => {
    // The invariant made mechanical: rejected, never repaired. Repairing would
    // mean choosing a citation on the model's behalf.
    const { keys } = closedCitationSet([ref()], chunks)
    const minted = block({ sourceRef: ref({ chunkId: 'c2', start: 0, end: 5 }) })
    const verdict = verifyStructuredCitations(guide([minted]), keys)
    expect(verdict.ok).toBe(false)
    expect(verdict.minted).toHaveLength(1)
    expect(verdict.minted[0].chunkId).toBe('c2')
  })

  it('treats a shifted offset on a real chunk as minted', () => {
    // The subtle failure: right chunk, wrong span. Still a fabricated quote.
    const { keys } = closedCitationSet([ref()], chunks)
    const shifted = block({ sourceRef: ref({ start: 3, end: 21 }) })
    expect(verifyStructuredCitations(guide([shifted]), keys).ok).toBe(false)
  })

  it('identifies a citation by chunk and span together', () => {
    expect(citationKey(ref())).toBe('c1:0:20')
    expect(citationKey(ref({ start: 1 }))).not.toBe(citationKey(ref()))
  })
})

describe('citation-required blocks', () => {
  it('flags a prose block with no citation', () => {
    expect(blocksMissingCitation(guide([block({ sourceRef: undefined })]))).toHaveLength(1)
  })

  it('exempts background, which has no citation by definition', () => {
    const bg = block({ sourceRef: undefined, provenance: 'background' })
    expect(blocksMissingCitation(guide([bg]))).toEqual([])
  })

  it('does not demand one from a gap or contradiction block', () => {
    const gap = block({ type: 'gap', sourceRef: undefined })
    expect(blocksMissingCitation(guide([gap]))).toEqual([])
  })
})

describe('deterministic quality checks', () => {
  const ok = { mode: 'SOURCE_PLUS_CLARIFICATION' as const }

  it('blocks an empty section', () => {
    const empty: StudyGuideArtifact = { ...guide([]), sections: [{ id: 's1', title: 'Core', blocks: [] }] }
    const findings = runDeterministicChecks(empty, ok)
    expect(findings.some((f) => f.check === 'Empty sections' && f.severity === 'blocking')).toBe(true)
    expect(isPersistable(findings)).toBe(false)
  })

  it('blocks bullet nesting deeper than two levels', () => {
    const findings = runDeterministicChecks(guide([block({ type: 'bullets', depth: 3 })]), ok)
    expect(findings.some((f) => f.check === 'Bullet nesting' && f.severity === 'blocking')).toBe(true)
  })

  it('blocks emphasis over 8% of body words', () => {
    const heavy = block({
      text: {
        content: 'one two three four five six seven eight nine ten',
        emphasis: [{ text: 'one two three', emphasis: 'key_term' }],
      },
    })
    expect(runDeterministicChecks(guide([heavy]), ok).some((f) => f.check === 'Emphasis density')).toBe(true)
  })

  it('blocks a high-yield claim with no basis, and background marked high-yield', () => {
    const noBasis = block({ conceptLabel: 'PFK-1', highYield: true })
    const bg = block({ id: 'b2', conceptLabel: 'context', highYield: true, provenance: 'background', sourceRef: undefined })
    const findings = runDeterministicChecks(guide([noBasis, bg]), ok)
    expect(findings.some((f) => f.check === 'High-yield basis')).toBe(true)
    expect(findings.some((f) => f.check === 'Background as high-yield')).toBe(true)
  })

  it('blocks a block whose provenance the resolved mode forbids', () => {
    const bg = block({ provenance: 'background', sourceRef: undefined })
    const findings = runDeterministicChecks(guide([bg]), { mode: 'SOURCE_ONLY' })
    expect(findings.some((f) => f.check === 'Source-mode compliance' && f.severity === 'blocking')).toBe(true)
  })

  it('permits the same block under a mode that admits it', () => {
    const bg = block({ provenance: 'background', sourceRef: undefined })
    const findings = runDeterministicChecks(guide([bg]), { mode: 'SOURCE_PLUS_BACKGROUND' })
    expect(findings.some((f) => f.check === 'Source-mode compliance')).toBe(false)
  })

  it('flags a prose run and an oversized section as advisory, not blocking', () => {
    const many = Array.from({ length: 9 }, (_, i) => block({ id: `b${i}` }))
    const findings = runDeterministicChecks(guide(many), ok)
    expect(findings.some((f) => f.check === 'Prose run' && f.severity === 'advisory')).toBe(true)
    expect(findings.some((f) => f.check === 'Oversized section' && f.severity === 'advisory')).toBe(true)
    // Advisory findings never stop an artifact being persisted.
    expect(isPersistable(findings.filter((f) => f.severity === 'advisory'))).toBe(true)
  })

  it('blocks a citation outside the verified set', () => {
    const { keys } = closedCitationSet([ref()], chunks)
    const minted = block({ sourceRef: ref({ start: 5, end: 25 }) })
    const findings = runDeterministicChecks(guide([minted]), { ...ok, closedCitationKeys: keys })
    expect(findings.some((f) => f.check === 'Citation integrity' && f.severity === 'blocking')).toBe(true)
  })
})

describe('study-guide-v1 structure', () => {
  it('blocks an artifact missing a section the skeleton requires', () => {
    const partial = guide([block()])
    const findings = runDeterministicChecks(partial, {
      mode: 'SOURCE_PLUS_CLARIFICATION', checkRequiredSections: true,
    })
    const missing = findings.filter((f) => f.check === 'Required sections present')
    expect(missing.length).toBeGreaterThan(0)
    expect(missing.every((f) => f.severity === 'blocking')).toBe(true)
    expect(missing.some((f) => f.detail.includes('AT A GLANCE'))).toBe(true)
  })

  it('does not demand them mid-pipeline, where a partial artifact is normal', () => {
    const findings = runDeterministicChecks(guide([block()]), { mode: 'SOURCE_PLUS_CLARIFICATION' })
    expect(findings.some((f) => f.check === 'Required sections present')).toBe(false)
  })

  it('keeps conditional sections out of the required set', () => {
    // "An empty section rendered as a heading with nothing under it is worse
    // than no section" — so conditional ones must never be demanded.
    expect(REQUIRED_SECTION_IDS).not.toContain('clinical')
    expect(REQUIRED_SECTION_IDS).not.toContain('objectives')
    expect(REQUIRED_SECTION_IDS).toContain('at-a-glance')
    expect(REQUIRED_SECTION_IDS).toContain('active-recall')
  })

  it('blocks a detailed section that repeats an At a glance statement verbatim', () => {
    const repeated = 'PFK-1 commits glucose to glycolysis and responds to the energy state.'
    const artifact: StudyGuideArtifact = {
      ...guide([]),
      sections: [
        { id: 'at-a-glance', title: 'AT A GLANCE', blocks: [block({ id: 'opening', text: { content: repeated } })] },
        { id: 'core-concepts', title: 'CORE CONCEPTS', blocks: [block({ id: 'detail', text: { content: repeated } })] },
      ],
    }
    const findings = runDeterministicChecks(artifact, { mode: 'SOURCE_PLUS_CLARIFICATION' })
    expect(findings.some((f) => f.check === 'Duplicate overview detail' && f.severity === 'blocking')).toBe(true)
  })
})

describe('conceptId is derived, never generated', () => {
  it('is stable for the same label whatever its casing or punctuation', () => {
    const base = { courseId: 'c1', topicId: 't1' }
    const a = conceptIdFor({ ...base, conceptLabel: 'Phosphofructokinase-1 regulation' })
    const b = conceptIdFor({ ...base, conceptLabel: '  phosphofructokinase-1   REGULATION ' })
    expect(a).toBe(b)
    expect(a.startsWith('c1:t1:')).toBe(true)
  })

  it('separates different concepts and different topics', () => {
    const base = { courseId: 'c1', topicId: 't1' }
    expect(conceptIdFor({ ...base, conceptLabel: 'glycolysis' }))
      .not.toBe(conceptIdFor({ ...base, conceptLabel: 'gluconeogenesis' }))
    expect(conceptIdFor({ ...base, conceptLabel: 'glycolysis' }))
      .not.toBe(conceptIdFor({ courseId: 'c1', topicId: 't2', conceptLabel: 'glycolysis' }))
  })
})

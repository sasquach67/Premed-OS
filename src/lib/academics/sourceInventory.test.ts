/**
 * Source readiness and the transfer dedupe.
 *
 * The rule these protect: nothing the student selected is lost, shortened, or
 * quietly dropped to make a request fit. Identical passage text is transferred
 * once — a wire saving — but every passage keeps its own id, and repetition
 * stays visible, because an instructor repeating a point is telling you it
 * matters and a silent collapse would delete that signal.
 */
import { describe, expect, it } from 'vitest'
import {
  assertSourceReadiness,
  buildSourceInventory,
  coverageBriefing,
  deduplicatedSources,
  repetitionNotice,
  SourceReadinessError,
} from '../../../supabase/functions/_shared/sourceInventory'

const chunk = (chunk_id: string, file_id: string, content: string) => ({ chunk_id, file_id, content })

describe('source readiness', () => {
  it('names what is missing rather than generating from less', () => {
    try {
      assertSourceReadiness(['a', 'b', 'c'], [chunk('a', 'f1', 'x')])
      throw new Error('should have refused')
    } catch (error) {
      expect(error).toBeInstanceOf(SourceReadinessError)
      const readiness = error as SourceReadinessError
      expect(readiness.code).toBe('source-sync-incomplete')
      expect(readiness.missingChunkIds).toEqual(['b', 'c'])
      expect(readiness.message).toContain('2 of 3')
    }
  })

  it('refuses an empty selection instead of building from nothing', () => {
    expect(() => assertSourceReadiness([], [])).toThrow(SourceReadinessError)
  })

  it('passes when the stored mirror still holds everything selected', () => {
    expect(() => assertSourceReadiness(['a'], [chunk('a', 'f1', 'x')])).not.toThrow()
  })
})

describe('coverage inventory', () => {
  const corpus = [
    chunk('c1', 'lecture', 'Encoding transforms information.'),
    chunk('c2', 'lecture', 'Retrieval reconstructs a trace.'),
    chunk('c3', 'slides', 'Encoding transforms information.'),
    chunk('c4', 'reading', '   '),
  ]

  it('counts every source, and lists passages that cannot ground a claim', () => {
    const inventory = buildSourceInventory(corpus)
    expect(inventory.totalChunks).toBe(4)
    expect(inventory.files.map((file) => file.fileId)).toEqual(['lecture', 'slides', 'reading'])
    expect(inventory.emptyChunkIds).toEqual(['c4'])
    // An unusable passage is reported, never silently discarded.
    expect(inventory.files.find((file) => file.fileId === 'reading')?.emptyChunkIds).toEqual(['c4'])
  })

  it('groups identical text and says whether the repeat is emphasis or boilerplate', () => {
    const inventory = buildSourceInventory(corpus)
    expect(inventory.uniqueTexts).toBe(3)
    expect(inventory.duplicateGroups).toHaveLength(1)
    const [group] = inventory.duplicateGroups
    expect(group.chunkIds).toEqual(['c1', 'c3'])
    // Across two files: usually a running header, not the instructor insisting.
    expect(group.withinOneFile).toBe(false)
    expect(group.fileIds).toEqual(['lecture', 'slides'])
  })

  it('marks repetition inside one source as that source’s own emphasis', () => {
    const inventory = buildSourceInventory([
      chunk('c1', 'lecture', 'This will be on the exam.'),
      chunk('c2', 'lecture', 'This will be on the exam.'),
    ])
    expect(inventory.duplicateGroups[0].withinOneFile).toBe(true)
  })
})

describe('transfer dedupe', () => {
  const corpus = [
    chunk('c1', 'lecture', 'Shared sentence.'),
    chunk('c2', 'lecture', 'Distinct sentence.'),
    chunk('c3', 'slides', 'Shared sentence.'),
  ]

  it('sends each distinct text once while every passage stays addressable', () => {
    const inventory = buildSourceInventory(corpus)
    const { canonical, aliasesFor, canonicalOf } = deduplicatedSources(corpus, inventory)
    expect(canonical.map((entry) => entry.chunk_id)).toEqual(['c1', 'c2'])
    // c3 is not transferred, but it is not lost: it resolves to c1's text.
    expect(canonicalOf.get('c3')).toBe('c1')
    expect(aliasesFor.get('c1')).toEqual(['c1', 'c3'])
    expect(inventory.transferSavedCharacters).toBe('Shared sentence.'.length)
  })

  it('is a no-op when nothing repeats', () => {
    const distinct = [chunk('c1', 'f', 'one'), chunk('c2', 'f', 'two')]
    const inventory = buildSourceInventory(distinct)
    expect(deduplicatedSources(distinct, inventory).canonical).toHaveLength(2)
    expect(inventory.transferSavedCharacters).toBe(0)
  })

  it('tells the model about the repetition rather than hiding it', () => {
    const inventory = buildSourceInventory(corpus)
    const notice = repetitionNotice(inventory, (id) => id.toUpperCase())
    expect(notice).toContain('Repeated passages')
    expect(notice).toContain('C1')
    expect(notice).toContain('×2')
    // Factual, not a conclusion: the artifact's rules weigh emphasis, not this.
    expect(notice).not.toMatch(/important|prioriti|emphasis(?!\b.*own)/i)
  })

  it('says nothing when there is nothing to say', () => {
    const distinct = [chunk('c1', 'f', 'one')]
    expect(repetitionNotice(buildSourceInventory(distinct), (id) => id)).toBe('')
  })
})

describe('coverage briefing', () => {
  it('states the corpus and requires every source to be planned or explained', () => {
    const inventory = buildSourceInventory([chunk('c1', 'lecture', 'abc'), chunk('c2', 'reading', 'de')])
    const briefing = coverageBriefing(inventory, (fileId) => (fileId === 'lecture' ? 'F1' : 'F2'))
    expect(briefing).toContain('2 passages across 2 sources')
    expect(briefing).toContain('F1 = 1 passages')
    expect(briefing).toContain('must be represented in the plan')
  })
})

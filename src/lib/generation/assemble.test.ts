import { describe, expect, it } from 'vitest'
// The spec document is checked in, so importing it raw keeps the drift test
// honest without adding a Node types dependency for one read.
import specDocument from '../../../premed-hq-documentation/specifications/generation/02-global-rules-and-source-modes.md?raw'
import { assembleGenerationRequest, specHashOf } from '@/lib/generation/assemble'
import { GLOBAL_RULES, INVARIANT_RULE_IDS } from '@/lib/generation/layers/global'
import { DEFAULT_CONTROLS } from '@/lib/generation/layers/presets'

const base = { specId: 'gap-check-v1', chunkIds: ['c1', 'c2'] }

describe('L1 drift against the specification', () => {
  const spec = specDocument
  const specIds = [...spec.matchAll(/^\| `(G-[A-Z]+-\d+)` \|/gm)].map((match) => match[1])

  it('carries every rule the spec defines, and defines none the spec does not', () => {
    // The document is checked in, so this stays honest as the spec moves: a
    // rule added there and forgotten here fails the suite rather than silently
    // vanishing from every prompt.
    const ours = GLOBAL_RULES.map((rule) => rule.id)
    expect(new Set(ours)).toEqual(new Set(specIds))
    expect(ours).toHaveLength(specIds.length)
  })

  it('transcribes rule text rather than paraphrasing it', () => {
    const purpose = GLOBAL_RULES.find((rule) => rule.id === 'G-PURPOSE-1')!
    expect(spec).toContain(purpose.text)
  })

  it('classifies the load-bearing fidelity block as invariant', () => {
    for (const id of ['G-FID-1', 'G-FID-2', 'G-FID-3', 'G-FID-7']) {
      expect(INVARIANT_RULE_IDS.has(id)).toBe(true)
    }
  })
})

describe('the assembler is pure', () => {
  it('produces the same prompt and hash for the same inputs', () => {
    const first = assembleGenerationRequest(base)
    const second = assembleGenerationRequest(base)
    expect(first.specHash).toBe(second.specHash)
    expect(first.systemPrompt).toBe(second.systemPrompt)
  })

  it('changes the hash when a preset changes a control', () => {
    const standard = assembleGenerationRequest(base)
    const cloze = assembleGenerationRequest({ ...base, preset: 'concise-cloze' })
    expect(cloze.specHash).not.toBe(standard.specHash)
  })

  it('keeps the hash stable across different topics of the same configuration', () => {
    // The hash identifies the CONFIGURATION, so two runs over different
    // material stay comparable.
    const glycolysis = assembleGenerationRequest({ ...base, request: 'Topic: Glycolysis' })
    const krebs = assembleGenerationRequest({ ...base, request: 'Topic: Krebs cycle' })
    expect(glycolysis.specHash).toBe(krebs.specHash)
    expect(glycolysis.systemPrompt).not.toBe(krebs.systemPrompt)
  })

  it('hashes deterministically without depending on key order', () => {
    expect(specHashOf(['a', 'b'])).toBe(specHashOf(['a', 'b']))
    expect(specHashOf(['a', 'b'])).not.toBe(specHashOf(['b', 'a']))
  })
})

describe('layer precedence', () => {
  it('resolves default then preset then preference then request', () => {
    const assembled = assembleGenerationRequest({
      ...base,
      preset: 'concise-cloze',
      preferences: { explanation_depth: 'deep' },
      controls: { difficulty: 'challenging' },
    })
    expect(assembled.resolvedControls.preferred_card_type).toBe('cloze')
    expect(assembled.resolvedControls.explanation_depth).toBe('deep')
    expect(assembled.resolvedControls.difficulty).toBe('challenging')
    expect(assembled.resolvedControls.use_tables).toBe(DEFAULT_CONTROLS.use_tables)
  })

  it('records which layer set each control, so a misbehaving preset is findable', () => {
    const assembled = assembleGenerationRequest({
      ...base,
      preset: 'concise-cloze',
      preferences: { explanation_depth: 'deep' },
      controls: { difficulty: 'challenging' },
    })
    expect(assembled.controlProvenance.preferred_card_type).toBe('preset')
    expect(assembled.controlProvenance.explanation_depth).toBe('preference')
    expect(assembled.controlProvenance.difficulty).toBe('request')
    expect(assembled.controlProvenance.use_tables).toBe('default')
  })
})

describe('invariants cannot be overridden', () => {
  it('throws when a preference targets an invariant rule', () => {
    expect(() => assembleGenerationRequest({ ...base, targets: ['G-FID-2'] }))
      .toThrow(/G-FID-2, which is invariant/)
  })

  it('names the layer that tried, so the error is actionable', () => {
    expect(() => assembleGenerationRequest({ ...base, targets: ['G-FID-2'] }))
      .toThrow(/A user preference targets/)
  })

  it('allows a layer to target a tunable rule', () => {
    const tunable = GLOBAL_RULES.find((rule) => rule.kind === 'tunable')!
    expect(() => assembleGenerationRequest({ ...base, targets: [tunable.id] })).not.toThrow()
  })
})

describe('the assembled request', () => {
  it('carries the source-mode instruction matching the resolved mode', () => {
    const strict = assembleGenerationRequest({ ...base, controls: { source_mode: 'SOURCE_ONLY' } })
    expect(strict.sourceMode).toBe('SOURCE_ONLY')
    expect(strict.systemPrompt).toContain('introduce no fact that the supplied sources do not support')
  })

  it('passes chunk ids through untouched, and no source text', () => {
    const assembled = assembleGenerationRequest(base)
    expect(assembled.chunkIds).toEqual(['c1', 'c2'])
    expect(assembled.systemPrompt).not.toContain('c1')
  })

  it('refuses an unregistered artifact rather than inventing a prompt', () => {
    // flashcards-v1 is specified in `04` and unbuilt until Phase 4. Registering
    // a spec whose engine does not exist would let the assembler produce a
    // prompt for an artifact nothing can generate.
    expect(() => assembleGenerationRequest({ ...base, specId: 'flashcards-v1' }))
      .toThrow(/No generator registered/)
  })

  it('now assembles the study guide, which registered in Phase 3', () => {
    const guide = assembleGenerationRequest({ ...base, specId: 'study-guide-v1' })
    expect(guide.specId).toBe('study-guide-v1')
    expect(guide.systemPrompt).toContain('Reorganize the supplied source material')
    // Its own L2 rules ride alongside the global ones.
    expect(guide.systemPrompt).toContain('SG-SPLIT')
  })
})

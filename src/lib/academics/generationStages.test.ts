/**
 * Pipelines are shaped by the artifact, and artifacts do not share one shape.
 *
 * A Study Guide is a document with sections; a Mastery Map is a set of
 * objectives; a Question Bank is a single grounded pass with required research
 * and no cross-provider audit. Flattening those into one pipeline would be the
 * same mistake as slicing the material into equal batches, just moved.
 */
import { describe, expect, it } from 'vitest'
import {
  firstStage,
  nextStage,
  pipelineFor,
  pipelineProgress,
  stageSpec,
} from '../../../supabase/functions/_shared/generationStages'

describe('pipelines differ by artifact', () => {
  it('gives a document sections, and a mastery map objectives', () => {
    const guide = pipelineFor('study-guide-v1').map((stage) => stage.id)
    const mastery = pipelineFor('unit-mastery-outline-v1').map((stage) => stage.id)
    expect(guide).toEqual(['inventory', 'outline', 'sections', 'verify', 'repair', 'audit', 'assemble'])
    expect(mastery).toEqual(guide)
    // Same stage names, different work: the labels say what is being produced.
    expect(stageSpec('study-guide-v1', 'sections')?.label).toBe('Writing each section')
    expect(stageSpec('unit-mastery-outline-v1', 'sections')?.label).toBe('Developing each objective')
  })

  it('keeps a question bank as one grounded pass with no cross-provider audit', () => {
    const bank = pipelineFor('unit-question-bank-v1')
    expect(bank.map((stage) => stage.id)).toEqual(['inventory', 'draft', 'verify', 'assemble'])
    expect(bank.find((stage) => stage.id === 'draft')?.provider).toBe('anthropic')
    expect(bank.some((stage) => stage.id === 'audit')).toBe(false)
  })

  it('does not invent seams in a small artifact', () => {
    for (const specId of ['flashcards-v1', 'reading-summary-v1', 'revised-notes-v1', 'class-full-mock-v1', 'term-report-v1']) {
      const stages = pipelineFor(specId).map((stage) => stage.id)
      expect(stages).toContain('draft')
      expect(stages).not.toContain('sections')
    }
  })

  it('falls back to the single-pass shape for an unknown spec rather than guessing', () => {
    expect(pipelineFor('something-new-v9').map((stage) => stage.id)).toContain('draft')
  })
})

describe('every stage declares its contract', () => {
  it('names inputs, outputs, dependencies and a completion criterion', () => {
    for (const specId of ['study-guide-v1', 'unit-mastery-outline-v1', 'unit-question-bank-v1', 'flashcards-v1']) {
      for (const stage of pipelineFor(specId)) {
        expect(stage.inputs.length).toBeGreaterThan(20)
        expect(stage.outputs.length).toBeGreaterThan(20)
        expect(stage.completion.length).toBeGreaterThan(20)
        expect(stage.label.length).toBeGreaterThan(0)
        expect(stage.maxAttempts).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('leaves substantial headroom under the free-plan worker lifetime', () => {
    // 150s wall clock, 20s held back to persist and answer. No stage may plan a
    // request that could not finish inside what a fresh worker actually has.
    for (const specId of ['study-guide-v1', 'unit-mastery-outline-v1', 'unit-question-bank-v1', 'flashcards-v1']) {
      for (const stage of pipelineFor(specId)) {
        expect(stage.maxProviderMs).toBeLessThanOrEqual(115_000)
        if (stage.provider === 'none') expect(stage.maxProviderMs).toBe(0)
      }
    }
  })

  it('only reaches a provider from the stages that need one', () => {
    const guide = pipelineFor('study-guide-v1')
    expect(guide.find((stage) => stage.id === 'inventory')?.provider).toBe('none')
    expect(guide.find((stage) => stage.id === 'verify')?.provider).toBe('none')
    expect(guide.find((stage) => stage.id === 'assemble')?.provider).toBe('none')
    expect(guide.find((stage) => stage.id === 'audit')?.provider).toBe('anthropic')
  })

  it('fans out only where the work is genuinely per-piece', () => {
    const guide = pipelineFor('study-guide-v1')
    expect(guide.find((stage) => stage.id === 'sections')?.fanOut).toBe(true)
    expect(guide.find((stage) => stage.id === 'outline')?.fanOut).toBe(false)
    expect(pipelineFor('flashcards-v1').find((stage) => stage.id === 'draft')?.fanOut).toBe(false)
  })
})

describe('stage ordering', () => {
  it('starts at inventory and walks to the end', () => {
    expect(firstStage('study-guide-v1')).toBe('inventory')
    expect(nextStage('study-guide-v1', 'inventory')).toBe('outline')
    expect(nextStage('study-guide-v1', 'assemble')).toBeUndefined()
  })

  it('reads as one continuous fraction, never reaching 1 before the end', () => {
    expect(pipelineProgress('study-guide-v1', 'inventory', 0, 1)).toBeLessThan(0.2)
    const early = pipelineProgress('study-guide-v1', 'sections', 1, 9)
    const late = pipelineProgress('study-guide-v1', 'sections', 8, 9)
    // A nine-section stage must visibly move rather than sitting still.
    expect(late).toBeGreaterThan(early)
    expect(pipelineProgress('study-guide-v1', 'assemble', 1, 1)).toBeLessThan(1)
  })
})

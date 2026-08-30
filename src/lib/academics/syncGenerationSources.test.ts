import { describe, expect, it } from 'vitest'
import {
  CLASS_MATERIAL_SCOPE,
  generationSourceInputs,
  generationSourceLimitMessage,
  sourceScopeForGeneration,
} from './syncGenerationSources'
import type { SourceChunk } from '@/lib/types'

function chunk(overrides: Partial<SourceChunk> = {}): SourceChunk {
  return {
    id: 'chunk-1', fileId: 'file-1', courseId: 'course-1', content: 'A source sentence.',
    coveredByKeyPoint: false, createdAt: 1, updatedAt: 1, order: 0,
    ...overrides,
  }
}

describe('generation source preparation', () => {
  it('keeps a single topic as the retrieval scope', () => {
    expect(sourceScopeForGeneration([chunk({ topicId: 'topic-1' }), chunk({ id: 'chunk-2', topicId: 'topic-1' })])).toBe('topic-1')
  })

  it('uses a class-material scope for unassigned or mixed course material', () => {
    expect(sourceScopeForGeneration([chunk(), chunk({ id: 'chunk-2', topicId: 'topic-2' })])).toBe(CLASS_MATERIAL_SCOPE)
  })

  it('syncs exact whole-chunk spans when imported material lacks offsets', () => {
    expect(generationSourceInputs([chunk()])).toEqual([{
      chunkId: 'chunk-1', fileId: 'file-1', content: 'A source sentence.', start: 0, end: 18,
    }])
  })

  it('allows 24 passages and explains how to reduce a larger request', () => {
    expect(generationSourceLimitMessage(24)).toBeUndefined()
    expect(generationSourceLimitMessage(25)).toBe(
      'Choose fewer source files or add a shorter excerpt. This selection contains 25 passages, and AI study tools can use up to 24 at a time.',
    )
  })
})

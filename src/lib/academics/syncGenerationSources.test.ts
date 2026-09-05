import { describe, expect, it, vi } from 'vitest'
import {
  CLASS_MATERIAL_SCOPE,
  generateWithSourceRecovery,
  generationSourceInputs,
  generationSourceLimitMessage,
  selectGenerationSourceChunks,
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

  it('allows a full 2,000-passage corpus and explains how to reduce a larger request', () => {
    expect(generationSourceLimitMessage(2000)).toBeUndefined()
    expect(generationSourceLimitMessage(2001)).toBe(
      'Choose fewer source files or add a shorter excerpt. This selection contains 2001 passages, and AI study tools can use up to 2000 at a time.',
    )
  })

  it('allows a question bank to review a full selected corpus', () => {
    expect(generationSourceLimitMessage(549, 'unit-question-bank')).toBeUndefined()
  })

  it('repairs a missing server mirror and retries generation once', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const source = chunk()
    const request = {
      action: 'generate' as const,
      courseId: 'course-1',
      topicId: CLASS_MATERIAL_SCOPE,
      chunkIds: ['chunk-1'],
      specId: 'study-guide-v1',
      specHash: 'spec-hash',
      systemPrompt: 'Use only the supplied source.',
      request: 'Build the lecture guide.',
    }
    const tools = {
      syncSources: vi.fn().mockResolvedValue({ ok: true, data: { synced: 1 } }),
      generate: vi.fn()
        .mockResolvedValueOnce({ ok: false, code: 'no-sources', message: 'No synced source material is available for this topic.' })
        .mockResolvedValueOnce({ ok: true, data: { artifact: {}, citations: [], auditStatus: 'approved' } }),
    }

    localStorage.setItem('unrelated', 'keep')
    const outcome = await generateWithSourceRecovery('course-1', [source], request, {}, tools)

    expect(outcome.ok).toBe(true)
    expect(tools.syncSources).toHaveBeenCalledTimes(1)
    expect(tools.generate).toHaveBeenCalledTimes(2)
    expect(tools.generate.mock.calls[1][0]).toMatchObject({
      topicId: CLASS_MATERIAL_SCOPE,
      chunkIds: ['chunk-1'],
    })
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })

  it('retries a transient citation mismatch once without resyncing sources', async () => {
    const source = chunk()
    const request = {
      action: 'generate' as const,
      courseId: 'course-1',
      topicId: CLASS_MATERIAL_SCOPE,
      chunkIds: ['chunk-1'],
      specId: 'study-guide-v1',
      specHash: 'spec-hash',
      systemPrompt: 'Use only the supplied source.',
      request: 'Build the lecture guide.',
    }
    const tools = {
      syncSources: vi.fn(),
      generate: vi.fn()
        .mockResolvedValueOnce({ ok: false, code: 'citation-not-carried', message: 'A citation could not be traced.' })
        .mockResolvedValueOnce({ ok: true, data: { artifact: {}, citations: [], auditStatus: 'approved' } }),
    }

    const outcome = await generateWithSourceRecovery('course-1', [source], request, {}, tools)

    expect(outcome.ok).toBe(true)
    expect(tools.generate).toHaveBeenCalledTimes(2)
    expect(tools.generate).toHaveBeenNthCalledWith(2, request)
    expect(tools.syncSources).not.toHaveBeenCalled()
  })

  it('does not retry unrelated generation failures', async () => {
    const source = chunk()
    const request = {
      action: 'generate' as const,
      courseId: 'course-1',
      topicId: CLASS_MATERIAL_SCOPE,
      chunkIds: ['chunk-1'],
      specId: 'study-guide-v1',
      specHash: 'spec-hash',
      systemPrompt: 'Use only the supplied source.',
      request: 'Build the lecture guide.',
    }
    const tools = {
      syncSources: vi.fn(),
      generate: vi.fn().mockResolvedValue({ ok: false, code: 'audit-rejected', message: 'The audit rejected the output.' }),
    }

    const outcome = await generateWithSourceRecovery('course-1', [source], request, {}, tools)

    expect(outcome).toMatchObject({ ok: false, code: 'audit-rejected' })
    expect(tools.generate).toHaveBeenCalledTimes(1)
    expect(tools.syncSources).not.toHaveBeenCalled()
  })

  it('selects a context-safe, source-balanced pass while leaving the full packet untouched', () => {
    const chunks = [
      ...Array.from({ length: 120 }, (_, index) => chunk({ id: `transcript-${index}`, fileId: 'transcript', order: index, content: `Transcription passage ${index} connects DNA RNA and translation.` })),
      ...Array.from({ length: 2003 }, (_, index) => chunk({ id: `textbook-${index}`, fileId: 'textbook', order: 120 + index, content: `Textbook passage ${index} explains transcription regulation and evidence.` })),
    ]

    const selected = selectGenerationSourceChunks(chunks, { preferredFileIds: ['transcript'] })

    expect(selected).toHaveLength(2000)
    expect(selected.some((item) => item.fileId === 'transcript')).toBe(true)
    expect(selected.some((item) => item.fileId === 'textbook')).toBe(true)
    expect(chunks).toHaveLength(2123)
    expect(chunks[0].id).toBe('transcript-0')
  })
})

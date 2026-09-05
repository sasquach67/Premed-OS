import { describe, expect, it } from 'vitest'
import {
  canonicalizeOpenAIGenerationSourceRefs,
  OPENAI_GENERATION_CITATION_INSTRUCTION,
  openAIGenerationSources,
} from '../../../supabase/functions/_shared/openAIGenerationGrounding'

describe('OpenAI generation grounding contract', () => {
  it('supplies a canonical full-chunk sourceRef so the model never calculates offsets', () => {
    const content = 'DNA → RNA → protein'

    expect(openAIGenerationSources([{
      file_id: 'file-1',
      chunk_id: 'chunk-1',
      content,
    }])).toEqual([{
      fileId: 'file-1',
      chunkId: 'chunk-1',
      content,
      sourceRef: {
        fileId: 'file-1',
        chunkId: 'chunk-1',
        start: 0,
        end: content.length,
      },
    }])
  })

  it('requires exact copying rather than offset reconstruction', () => {
    expect(OPENAI_GENERATION_CITATION_INSTRUCTION).toContain('provenance source must include sourceRef')
    expect(OPENAI_GENERATION_CITATION_INSTRUCTION).toContain('copy the exact supplied sourceRef')
    expect(OPENAI_GENERATION_CITATION_INSTRUCTION).toContain('Never calculate')
  })

  it('canonicalizes only the range of a source identity selected by the model', () => {
    const chunks = [{ file_id: 'file-1', chunk_id: 'chunk-1', content: 'DNA becomes RNA' }]
    const artifact = {
      blocks: [{
        provenance: 'source',
        sourceRef: { fileId: 'file-1', chunkId: 'chunk-1', start: 4, end: 9 },
      }],
    }

    expect(canonicalizeOpenAIGenerationSourceRefs(artifact, chunks)).toEqual({
      blocks: [{
        provenance: 'source',
        sourceRef: { fileId: 'file-1', chunkId: 'chunk-1', start: 0, end: 15 },
      }],
    })
  })

  it('canonicalizes arrays of references without inventing missing citations', () => {
    const chunks = [{ file_id: 'file-1', chunk_id: 'chunk-1', content: 'source text' }]
    const artifact = {
      cited: { sourceRefs: [{ fileId: 'file-1', chunkId: 'chunk-1', start: 'bad', end: null }] },
      missing: { provenance: 'source' },
    }

    expect(canonicalizeOpenAIGenerationSourceRefs(artifact, chunks)).toEqual({
      cited: { sourceRefs: [{ fileId: 'file-1', chunkId: 'chunk-1', start: 0, end: 11 }] },
      missing: { provenance: 'source' },
    })
  })

  it('does not repair an unknown or mismatched source identity', () => {
    const chunks = [{ file_id: 'file-1', chunk_id: 'chunk-1', content: 'source text' }]
    const unknown = { sourceRef: { fileId: 'file-2', chunkId: 'chunk-1', start: 0, end: 4 } }

    expect(canonicalizeOpenAIGenerationSourceRefs(unknown, chunks)).toEqual(unknown)
  })
})

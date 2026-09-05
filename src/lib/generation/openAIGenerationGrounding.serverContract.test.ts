import { describe, expect, it } from 'vitest'
import {
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
    expect(OPENAI_GENERATION_CITATION_INSTRUCTION).toContain('copy the exact supplied sourceRef')
    expect(OPENAI_GENERATION_CITATION_INSTRUCTION).toContain('Never calculate')
  })
})

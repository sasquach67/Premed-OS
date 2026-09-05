import { describe, expect, it } from 'vitest'
import { createOpenAICitationWire } from '../../../supabase/functions/_shared/openAICitationWire'

const chunks = [
  { file_id: 'original-file-a', chunk_id: 'original-chunk-a', content: 'DNA is transcribed into RNA.' },
  { file_id: 'original-file-a', chunk_id: 'original-chunk-b', content: 'RNA is translated into protein.' },
  { file_id: 'original-file-b', chunk_id: 'original-chunk-c', content: 'Compare transcription and translation.' },
]

describe('OpenAI citation wire identities', () => {
  it('round trips model-selected references to the exact original identities', () => {
    const wire = createOpenAICitationWire(chunks)
    expect(wire.sources.map(s => [s.fileId, s.chunkId])).toEqual([['F1','S1'],['F1','S2'],['F2','S3']])
    expect(wire.sources.map(s => s.content)).toEqual(chunks.map(s => s.content))
    expect(wire.decode({ sourceRef: wire.sources[1].sourceRef })).toEqual({ sourceRef: {
      fileId: chunks[1].file_id, chunkId: chunks[1].chunk_id, start: 0, end: chunks[1].content.length,
    } })
  })

  it('decodes all supported citation fields but never rewrites prose or record IDs', () => {
    const wire = createOpenAICitationWire(chunks)
    expect(wire.decode({ id: 'S1', text: 'S1 and F1', sourceChunkIds: ['S1','S3'], evidenceIds: ['S2'], nested: { sourceChunkId: 'S1', evidenceId: 'S3', sourceRefs: [wire.sources[0].sourceRef] } })).toEqual({
      id: 'S1', text: 'S1 and F1', sourceChunkIds: ['original-chunk-a','original-chunk-c'], evidenceIds: ['original-chunk-b'], nested: { sourceChunkId: 'original-chunk-a', evidenceId: 'original-chunk-c', sourceRefs: [{ fileId: 'original-file-a', chunkId: 'original-chunk-a', start: 0, end: chunks[0].content.length }] },
    })
  })

  it('preserves invalid pairs, unknown references, and missing citations for rejection', () => {
    const wire = createOpenAICitationWire(chunks)
    const invalid = { sourceRef: { fileId: 'F2', chunkId: 'S1', start: 0, end: 1 }, sourceRefs: [{ chunkId: 'S1' }, { fileId: 'F1', chunkId: 'S999' }], sourceChunkIds: ['S999'], blocks: [{ provenance: 'source', type: 'prose' }] }
    expect(wire.decode(invalid)).toEqual(invalid)
  })

  it('rewrites exact source identifiers in the request without overlapping ID corruption', () => {
    const wire = createOpenAICitationWire([{ file_id: 'file', chunk_id: 'chunk', content: 'x' }, { file_id: 'file2', chunk_id: 'chunk2', content: 'y' }])
    expect(wire.encodePrompt('Selected: chunk2, chunk; file2, file.')).toBe('Selected: S2, S1; F2, F1.')
  })
})

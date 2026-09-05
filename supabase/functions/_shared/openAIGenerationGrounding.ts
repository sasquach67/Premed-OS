export interface OpenAIGenerationChunk {
  file_id: string
  chunk_id: string
  content: string
}

export const OPENAI_GENERATION_CITATION_INSTRUCTION = [
  'Use only the supplied source IDs.',
  'For sourceRef/sourceRefs, copy the exact supplied sourceRef object from the chosen source document.',
  'Never calculate, shorten, expand, or otherwise alter sourceRef offsets.',
  'For sourceChunkId/sourceChunkIds/evidenceIds, copy the exact supplied chunkId. Never invent an ID or range.',
].join(' ')

/**
 * Give the model a citation identity computed from server-owned text. Character
 * offsets are mechanical metadata, so the model should select a source and
 * copy its identity rather than count characters in a serialized document.
 */
export function openAIGenerationSources(chunks: readonly OpenAIGenerationChunk[]) {
  return chunks.map((chunk) => ({
    fileId: chunk.file_id,
    chunkId: chunk.chunk_id,
    content: chunk.content,
    sourceRef: {
      fileId: chunk.file_id,
      chunkId: chunk.chunk_id,
      start: 0,
      end: chunk.content.length,
    },
  }))
}

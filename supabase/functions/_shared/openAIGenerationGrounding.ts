export interface OpenAIGenerationChunk {
  file_id: string
  chunk_id: string
  content: string
}

interface SourceRefRecord {
  fileId?: unknown
  chunkId?: unknown
  start?: unknown
  end?: unknown
}

const SOURCE_REF_REQUIRED_BLOCK_TYPES = new Set([
  'prose',
  'bullets',
  'numbered',
  'table',
  'must_memorize',
  'must_understand',
])

export function openAIGenerationSourceRefRequired(record: Record<string, unknown>) {
  return record.provenance === 'source'
    && typeof record.type === 'string'
    && SOURCE_REF_REQUIRED_BLOCK_TYPES.has(record.type)
}

export const OPENAI_GENERATION_CITATION_INSTRUCTION = [
  'Use only the supplied source IDs.',
  'Every source-backed prose, bullets, numbered, table, must_memorize, or must_understand block must include sourceRef.',
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

/**
 * The model chooses the source identity; the server owns the text and therefore
 * owns its mechanical full-chunk range. Normalize only references whose file
 * and chunk IDs already match a supplied source. Missing or unknown identities
 * are deliberately left untouched so the citation validator still rejects
 * them instead of guessing a source on the model's behalf.
 */
export function canonicalizeOpenAIGenerationSourceRefs(
  value: unknown,
  chunks: readonly OpenAIGenerationChunk[],
): unknown {
  const byChunkId = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]))

  function canonicalRef(candidate: unknown): unknown {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return candidate
    const ref = candidate as SourceRefRecord
    if (typeof ref.fileId !== 'string' || typeof ref.chunkId !== 'string') return candidate
    const chunk = byChunkId.get(ref.chunkId)
    if (!chunk || chunk.file_id !== ref.fileId || !chunk.content.length) return candidate
    return {
      fileId: chunk.file_id,
      chunkId: chunk.chunk_id,
      start: 0,
      end: chunk.content.length,
    }
  }

  function visit(candidate: unknown): unknown {
    if (Array.isArray(candidate)) return candidate.map(visit)
    if (!candidate || typeof candidate !== 'object') return candidate
    return Object.fromEntries(Object.entries(candidate as Record<string, unknown>).map(([key, item]) => {
      if (key === 'sourceRef') return [key, canonicalRef(item)]
      if (key === 'sourceRefs' && Array.isArray(item)) return [key, item.map(canonicalRef)]
      return [key, visit(item)]
    }))
  }

  return visit(value)
}

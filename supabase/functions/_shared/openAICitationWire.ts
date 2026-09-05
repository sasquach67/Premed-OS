import { openAIGenerationSources, type OpenAIGenerationChunk } from './openAIGenerationGrounding.ts'

/** Request-local aliases reduce copying errors without guessing source identity.
 * Only exact known file/passage pairs are decoded; all other references reach
 * the existing citation validator unchanged and remain rejectable.
 */
export function createOpenAICitationWire(chunks: readonly OpenAIGenerationChunk[]) {
  const fileAliases = new Map<string, string>()
  const originals = new Map<string, OpenAIGenerationChunk>()
  const promptAliases = new Map<string, string>()
  const aliased = chunks.map((chunk, index) => {
    let fileAlias = fileAliases.get(chunk.file_id)
    if (!fileAlias) {
      fileAlias = `F${fileAliases.size + 1}`
      fileAliases.set(chunk.file_id, fileAlias)
      promptAliases.set(chunk.file_id, fileAlias)
    }
    const chunkAlias = `S${index + 1}`
    originals.set(chunkAlias, chunk)
    promptAliases.set(chunk.chunk_id, chunkAlias)
    return { file_id: fileAlias, chunk_id: chunkAlias, content: chunk.content }
  })

  function decodeRef(candidate: unknown): unknown {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return candidate
    const ref = candidate as Record<string, unknown>
    if (typeof ref.citationId === 'string') {
      // The passage ID is the entire wire citation. Conflicting metadata is
      // rejected rather than silently repaired or guessed.
      if (Object.keys(ref).some(key => key !== 'citationId')) return candidate
      const selected = originals.get(ref.citationId)
      return selected ? { fileId: selected.file_id, chunkId: selected.chunk_id, start: 0, end: selected.content.length } : candidate
    }
    const original = typeof ref.chunkId === 'string' ? originals.get(ref.chunkId) : undefined
    if (!original || ref.fileId !== fileAliases.get(original.file_id)) return candidate
    return { fileId: original.file_id, chunkId: original.chunk_id, start: 0, end: original.content.length }
  }

  function decodeId(id: unknown) {
    return typeof id === 'string' ? originals.get(id)?.chunk_id ?? id : id
  }

  function decode(candidate: unknown): unknown {
    if (Array.isArray(candidate)) return candidate.map(decode)
    if (!candidate || typeof candidate !== 'object') return candidate
    return Object.fromEntries(Object.entries(candidate as Record<string, unknown>).map(([key, value]) => {
      if (key === 'sourceRef') return [key, decodeRef(value)]
      if (key === 'sourceRefs' && Array.isArray(value)) return [key, value.map(decodeRef)]
      if (key === 'sourceChunkId' || key === 'evidenceId') return [key, decodeId(value)]
      if ((key === 'sourceChunkIds' || key === 'evidenceIds') && Array.isArray(value)) return [key, value.map(decodeId)]
      return [key, decode(value)]
    }))
  }

  function encodePrompt(prompt: string) {
    const ids = [...promptAliases.keys()].sort((a, b) => b.length - a.length)
    if (!ids.length) return prompt
    const escaped = ids.map(id => Array.from(id).map(char => /[a-zA-Z0-9_-]/.test(char) ? char : `\\${char}`).join(''))
    const pattern = new RegExp(`(?<![a-zA-Z0-9_-])(?:${escaped.join('|')})(?![a-zA-Z0-9_-])`, 'g')
    return prompt.replace(pattern, id => promptAliases.get(id)!)
  }

  return {
    sources: openAIGenerationSources(aliased).map(source => ({ ...source, sourceRef: { citationId: source.chunkId } })),
    decode, encodePrompt,
  }
}

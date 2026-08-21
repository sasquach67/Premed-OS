import type { LectureEvidenceFinding, SourceChunk } from '@/lib/types'

/**
 * Storage segmentation is only for source references. Analysis consumes this
 * complete source-order join; no ranking or top-N selection is possible here.
 */
export function assembleFullLectureTranscript(chunks: readonly SourceChunk[]) {
  return [...chunks]
    .sort((a, b) => a.order - b.order)
    .map((chunk) => ({
      chunkId: chunk.id,
      timestamp: chunk.sourcePosition?.label,
      content: chunk.content,
    }))
}

export function validateLectureFinding(
  finding: Pick<LectureEvidenceFinding, 'sourceChunkId' | 'quote' | 'timestamp' | 'label' | 'detail'>,
  chunks: readonly SourceChunk[],
) {
  if (!finding.quote.trim() || !finding.timestamp.trim() || !finding.label.trim() || !finding.detail.trim()) return false
  const chunk = chunks.find((item) => item.id === finding.sourceChunkId)
  if (!chunk || !chunk.sourcePosition?.label) return false
  return chunk.sourcePosition.label === finding.timestamp && chunk.content.includes(finding.quote)
}

/** Deterministic retrieval only: it returns stored quotes, never an explanation. */
export function searchLectureFindings(
  query: string,
  findings: readonly LectureEvidenceFinding[],
  chunks: readonly SourceChunk[],
) {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return []
  const chunkById = new Map(chunks.map((chunk) => [chunk.id, chunk]))
  return findings.filter((finding) => (
    finding.quote.toLocaleLowerCase().includes(needle)
    || finding.label.toLocaleLowerCase().includes(needle)
    || chunkById.get(finding.sourceChunkId)?.content.toLocaleLowerCase().includes(needle)
  ))
}

/** Source-only retrieval for the lecture index. It deliberately returns the
 * original timestamped segment instead of an AI-written interpretation. */
export function searchLectureSourceChunks(query: string, chunks: readonly SourceChunk[]) {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return []
  return chunks.filter((chunk) => (
    chunk.content.toLocaleLowerCase().includes(needle)
    || chunk.sourcePosition?.label?.toLocaleLowerCase().includes(needle)
  ))
}

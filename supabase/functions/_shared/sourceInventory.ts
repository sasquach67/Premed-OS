/**
 * Source readiness and the coverage inventory — stage one of every pipeline.
 *
 * Two jobs, and they pull in opposite directions if you are careless:
 *
 *  1. **Nothing is lost.** Every selected passage stays stored, citable and
 *     addressable by its own id. No passage is dropped, shortened or summarised
 *     to make a request fit; if the material does not fit a stage, the stage is
 *     wrong, not the material.
 *  2. **Nothing is sent twice.** Byte-identical passage text is transferred
 *     once. That is a transfer optimisation and nothing else — it does not
 *     shrink the corpus the model reasons over, and it must not erase the fact
 *     that a passage recurred.
 *
 * Repetition carries meaning. An instructor who says a thing in the lecture,
 * the slides and the review sheet is telling you it matters, and collapsing
 * that to one silent copy would delete the signal. So a repeated passage is
 * sent once *and reported*: how many times it occurred, under which passage
 * ids, and whether the repeats sit inside one file (emphasis) or across files
 * (usually extraction boilerplate — a running header, a footer).
 */

export interface InventoryChunk {
  chunk_id: string
  file_id: string
  content: string
}

export interface InventoryFile {
  fileId: string
  chunkIds: string[]
  characters: number
  /** Passages with no usable text. They cannot ground a claim. */
  emptyChunkIds: string[]
}

export interface DuplicateGroup {
  /** The passage whose text is transferred; the others reference it. */
  canonicalChunkId: string
  chunkIds: string[]
  /** True when every repeat sits inside one file — emphasis, not boilerplate. */
  withinOneFile: boolean
  fileIds: string[]
}

export interface SourceInventory {
  files: InventoryFile[]
  totalChunks: number
  totalCharacters: number
  /** Distinct passage texts. What actually crosses the wire. */
  uniqueTexts: number
  duplicateGroups: DuplicateGroup[]
  /** Passages that cannot support a citation, listed rather than silently cut. */
  emptyChunkIds: string[]
  /** Bytes the dedupe saves on transfer. Reported, never used as a quality lever. */
  transferSavedCharacters: number
}

export class SourceReadinessError extends Error {
  readonly code: 'source-sync-incomplete' | 'no-sources'
  readonly missingChunkIds: string[]
  constructor(code: 'source-sync-incomplete' | 'no-sources', message: string, missingChunkIds: string[] = []) {
    super(message)
    this.name = 'SourceReadinessError'
    this.code = code
    this.missingChunkIds = missingChunkIds
  }
}

/**
 * Prove the stored mirror still holds every passage this job selected.
 *
 * This runs before any provider work, so a corpus that has lost a passage since
 * the job was queued fails here — cheaply, and naming what is missing — rather
 * than producing an artifact that silently covers less than the student chose.
 */
export function assertSourceReadiness(selectedChunkIds: readonly string[], stored: readonly InventoryChunk[]) {
  if (!selectedChunkIds.length) {
    throw new SourceReadinessError('no-sources', 'No source material was selected for this build.')
  }
  const present = new Set(stored.map((chunk) => chunk.chunk_id))
  const missing = selectedChunkIds.filter((id) => !present.has(id))
  if (missing.length) {
    throw new SourceReadinessError(
      'source-sync-incomplete',
      `${missing.length} of ${selectedChunkIds.length} selected passages are missing from the stored copy. Nothing was generated, and your material is unchanged.`,
      missing.slice(0, 20),
    )
  }
}

export function buildSourceInventory(chunks: readonly InventoryChunk[]): SourceInventory {
  const byFile = new Map<string, InventoryFile>()
  const byText = new Map<string, string[]>()

  for (const chunk of chunks) {
    let file = byFile.get(chunk.file_id)
    if (!file) {
      file = { fileId: chunk.file_id, chunkIds: [], characters: 0, emptyChunkIds: [] }
      byFile.set(chunk.file_id, file)
    }
    file.chunkIds.push(chunk.chunk_id)
    file.characters += chunk.content.length
    if (!chunk.content.trim()) file.emptyChunkIds.push(chunk.chunk_id)
    const shared = byText.get(chunk.content)
    if (shared) shared.push(chunk.chunk_id)
    else byText.set(chunk.content, [chunk.chunk_id])
  }

  const fileOf = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk.file_id]))
  const lengthOf = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk.content.length]))
  const duplicateGroups: DuplicateGroup[] = []
  let transferSavedCharacters = 0

  for (const ids of byText.values()) {
    if (ids.length < 2) continue
    const fileIds = [...new Set(ids.map((id) => fileOf.get(id)!))]
    duplicateGroups.push({
      canonicalChunkId: ids[0],
      chunkIds: ids,
      withinOneFile: fileIds.length === 1,
      fileIds,
    })
    transferSavedCharacters += (ids.length - 1) * (lengthOf.get(ids[0]) ?? 0)
  }

  return {
    files: [...byFile.values()],
    totalChunks: chunks.length,
    totalCharacters: chunks.reduce((total, chunk) => total + chunk.content.length, 0),
    uniqueTexts: byText.size,
    duplicateGroups,
    emptyChunkIds: chunks.filter((chunk) => !chunk.content.trim()).map((chunk) => chunk.chunk_id),
    transferSavedCharacters,
  }
}

/**
 * The passages to transfer, one per distinct text.
 *
 * Every original passage id remains citable: `aliasesFor` maps a canonical
 * passage to the full set of ids that carry that text, and the wire keeps
 * decoding all of them. The model is told about the repetition rather than
 * shielded from it.
 */
export function deduplicatedSources(chunks: readonly InventoryChunk[], inventory: SourceInventory) {
  const canonicalOf = new Map<string, string>()
  const aliasesFor = new Map<string, string[]>()
  for (const group of inventory.duplicateGroups) {
    aliasesFor.set(group.canonicalChunkId, group.chunkIds)
    for (const id of group.chunkIds) canonicalOf.set(id, group.canonicalChunkId)
  }
  const canonical = chunks.filter((chunk) => (canonicalOf.get(chunk.chunk_id) ?? chunk.chunk_id) === chunk.chunk_id)
  return { canonical, aliasesFor, canonicalOf }
}

/**
 * What the model is told about repetition, so emphasis survives the dedupe.
 *
 * Deliberately factual. It reports that a passage recurred and where; it does
 * not tell the model what to conclude, because "the instructor said it three
 * times" is evidence the artifact's own rules already know how to weigh.
 */
export function repetitionNotice(inventory: SourceInventory, aliasOf: (chunkId: string) => string): string {
  const emphasis = inventory.duplicateGroups.filter((group) => group.withinOneFile)
  const across = inventory.duplicateGroups.filter((group) => !group.withinOneFile)
  if (!emphasis.length && !across.length) return ''
  const lines = ['Repeated passages: identical text is supplied once and every passage ID that carries it is listed. Repetition is preserved information, not a transfer artefact to ignore.']
  if (emphasis.length) {
    lines.push(`Repeated within a single source (treat as that source's own emphasis): ${
      emphasis.slice(0, 40).map((group) => `${aliasOf(group.canonicalChunkId)} ×${group.chunkIds.length} (also ${group.chunkIds.slice(1).map(aliasOf).join(', ')})`).join('; ')
    }.`)
  }
  if (across.length) {
    lines.push(`Repeated across different sources (often a running header or footer; weigh accordingly): ${
      across.slice(0, 40).map((group) => `${aliasOf(group.canonicalChunkId)} ×${group.chunkIds.length}`).join('; ')
    }.`)
  }
  return lines.join(' ')
}

/**
 * A compact statement of what the corpus contains, for the planning stage.
 * Counts and identifiers only — the passages themselves are supplied in full.
 */
export function coverageBriefing(inventory: SourceInventory, fileAlias: (fileId: string) => string): string {
  return [
    `Selected corpus: ${inventory.totalChunks} passages across ${inventory.files.length} sources, ${inventory.totalCharacters} characters.`,
    `Per source: ${inventory.files.map((file) => `${fileAlias(file.fileId)} = ${file.chunkIds.length} passages`).join(', ')}.`,
    'Every source listed here must be represented in the plan unless its passages genuinely cannot support any part of this artifact, in which case name it and say why.',
  ].join(' ')
}

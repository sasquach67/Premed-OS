import {
  acceptStudySourceDisclosure,
  hasAcceptedStudySourceDisclosure,
  studySourceFingerprint,
  studySourceSyncKey,
  studyTools,
  type GeneratedStudyToolArtifact,
  type GenerateRequest,
  type StudyToolResponse,
  type StudySourceInput,
} from '@/lib/intelligence/studyTools'
import type { SourceChunk } from '@/lib/types'

/**
 * A source scope is a retrieval boundary, not a user-facing topic. Imported
 * transcripts and mixed material sets often have no single lesson assignment,
 * but generation still needs one stable server-side bucket.
 */
export const CLASS_MATERIAL_SCOPE = '__class_material__'
export const MAX_GENERATION_SOURCE_CHUNKS = 2_000
export const MAX_GENERATION_SOURCE_CHARACTERS = 700_000

const COMMON_SOURCE_WORDS = new Set([
  'about', 'after', 'also', 'because', 'before', 'being', 'between', 'could', 'does', 'each', 'from', 'have', 'into',
  'more', 'most', 'other', 'over', 'same', 'should', 'than', 'that', 'their', 'there', 'these', 'they', 'this', 'through',
  'under', 'using', 'were', 'what', 'when', 'where', 'which', 'while', 'with', 'would',
])

function sourceTerms(chunks: readonly SourceChunk[]) {
  const terms = new Set<string>()
  for (const chunk of chunks) {
    for (const token of chunk.content.toLowerCase().match(/[a-z][a-z0-9'-]{3,}/g) ?? []) {
      if (!COMMON_SOURCE_WORDS.has(token)) terms.add(token)
    }
  }
  return terms
}

function evenlyChosenGroups<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items]
  return Array.from({ length: count }, (_, index) => items[Math.floor(((index + 0.5) * items.length) / count)])
}

function sampleGroup(
  chunks: readonly SourceChunk[],
  count: number,
  focusTerms: ReadonlySet<string>,
  priorityChunkIds: ReadonlySet<string>,
) {
  if (chunks.length <= count) return [...chunks]
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * chunks.length) / count)
    const end = Math.max(start + 1, Math.floor(((index + 1) * chunks.length) / count))
    let best = chunks[start]
    let bestScore = -1
    for (const candidate of chunks.slice(start, end)) {
      const terms = new Set(candidate.content.toLowerCase().match(/[a-z][a-z0-9'-]{3,}/g) ?? [])
      const overlap = [...terms].reduce((total, term) => total + (focusTerms.has(term) ? 1 : 0), 0)
      const score = overlap + (priorityChunkIds.has(candidate.id) ? 10_000 : 0)
      if (score > bestScore) {
        best = candidate
        bestScore = score
      }
    }
    return best
  })
}

/**
 * Keep a large local packet intact while preparing one context-safe provider
 * pass. The selection is deterministic, spans every included file when space
 * allows, gives the lecture transcript extra weight, and prefers supporting
 * passages whose terms overlap the transcript. Nothing is deleted or detached.
 */
export function selectGenerationSourceChunks(
  chunks: readonly SourceChunk[],
  options: {
    preferredFileIds?: readonly string[]
    priorityChunkIds?: readonly string[]
    maxChunks?: number
    maxCharacters?: number
  } = {},
): SourceChunk[] {
  const maxChunks = Math.max(1, options.maxChunks ?? MAX_GENERATION_SOURCE_CHUNKS)
  const maxCharacters = Math.max(1, options.maxCharacters ?? MAX_GENERATION_SOURCE_CHARACTERS)
  const usable = chunks.filter((chunk) => Boolean(chunk.content.trim()) && chunk.content.length <= maxCharacters)
  if (usable.length <= maxChunks && usable.reduce((total, chunk) => total + chunk.content.length, 0) <= maxCharacters) return [...usable]

  const preferredFileIds = new Set(options.preferredFileIds ?? [])
  const priorityChunkIds = new Set(options.priorityChunkIds ?? [])
  const preferredChunks = usable.filter((chunk) => preferredFileIds.has(chunk.fileId))
  const focusTerms = sourceTerms(preferredChunks)
  const grouped = new Map<string, SourceChunk[]>()
  for (const chunk of usable) {
    const group = grouped.get(chunk.fileId) ?? []
    group.push(chunk)
    grouped.set(chunk.fileId, group)
  }

  const allGroups = [...grouped.entries()]
  const preferredGroups = allGroups.filter(([fileId]) => preferredFileIds.has(fileId))
  const supportingGroups = allGroups.filter(([fileId]) => !preferredFileIds.has(fileId))
  const includedGroups = preferredGroups.length >= maxChunks
    ? evenlyChosenGroups(preferredGroups, maxChunks)
    : [
        ...preferredGroups,
        ...evenlyChosenGroups(supportingGroups, maxChunks - preferredGroups.length),
      ]
  const quotas = new Map(includedGroups.map(([fileId]) => [fileId, 1]))
  let assigned = quotas.size
  while (assigned < maxChunks) {
    const candidate = includedGroups
      .filter(([fileId, group]) => (quotas.get(fileId) ?? 0) < group.length)
      .sort(([leftId, left], [rightId, right]) => {
        const leftWeight = Math.sqrt(left.length) * (preferredFileIds.has(leftId) ? 3 : 1) / ((quotas.get(leftId) ?? 0) + 1)
        const rightWeight = Math.sqrt(right.length) * (preferredFileIds.has(rightId) ? 3 : 1) / ((quotas.get(rightId) ?? 0) + 1)
        return rightWeight - leftWeight
      })[0]
    if (!candidate) break
    quotas.set(candidate[0], (quotas.get(candidate[0]) ?? 0) + 1)
    assigned += 1
  }

  const sampled = includedGroups.flatMap(([fileId, group]) => sampleGroup(group, quotas.get(fileId) ?? 0, focusTerms, priorityChunkIds))
  const originalOrder = new Map(usable.map((chunk, index) => [chunk.id, index]))
  const ordered = sampled.sort((left, right) => (originalOrder.get(left.id) ?? 0) - (originalOrder.get(right.id) ?? 0))
  const withinCharacterLimit: SourceChunk[] = []
  let characters = 0
  for (const chunk of ordered) {
    if (characters + chunk.content.length > maxCharacters) continue
    withinCharacterLimit.push(chunk)
    characters += chunk.content.length
  }
  return withinCharacterLimit
}

export interface GenerationSourcePreparation {
  ok: boolean
  scopeId?: string
  chunkIds?: string[]
  message?: string
}

export interface GenerationSourceOptions {
  artifact?: string
  forceSync?: boolean
}

interface GenerationSourceTools {
  syncSources(request: Parameters<typeof studyTools.syncSources>[0]): ReturnType<typeof studyTools.syncSources>
  generate(request: GenerateRequest): Promise<StudyToolResponse<GeneratedStudyToolArtifact>>
}

export function sourceScopeForGeneration(chunks: readonly SourceChunk[]): string {
  const topicIds = [...new Set(chunks.map((chunk) => chunk.topicId).filter((id): id is string => Boolean(id)))]
  return topicIds.length === 1 && chunks.every((chunk) => chunk.topicId === topicIds[0])
    ? topicIds[0]
    : CLASS_MATERIAL_SCOPE
}

export function generationSourceInputs(chunks: readonly SourceChunk[]): StudySourceInput[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    fileId: chunk.fileId,
    content: chunk.content,
    // Whole-chunk spans are exact. Never invent a narrower range when import
    // metadata is incomplete.
    start: chunk.characterStart ?? 0,
    end: chunk.characterEnd ?? chunk.content.length,
  }))
}

export function generationSourceLimitMessage(chunkCount: number, artifact?: string): string | undefined {
  // A Question Bank deliberately reviews the complete selected corpus. Its
  // larger, Anthropic-only server path enforces its own context-safe ceiling.
  if (artifact === 'unit-question-bank') return undefined
  if (chunkCount <= MAX_GENERATION_SOURCE_CHUNKS) return undefined
  return `Choose fewer source files or add a shorter excerpt. This selection contains ${chunkCount} passages, and AI study tools can use up to ${MAX_GENERATION_SOURCE_CHUNKS} at a time.`
}

/**
 * The local store remains canonical. This creates or refreshes only the
 * selected material's private server mirror, after the same disclosure used
 * by recall gap-checks. No model call receives client text directly.
 */
export async function prepareGenerationSources(
  courseId: string,
  chunks: readonly SourceChunk[],
  options: GenerationSourceOptions = {},
  tools: GenerationSourceTools = studyTools,
): Promise<GenerationSourcePreparation> {
  const sources = generationSourceInputs(chunks)
  if (!sources.length) return { ok: false, message: 'Select processed course material first.' }
  const limitMessage = generationSourceLimitMessage(sources.length, options.artifact)
  if (limitMessage) return { ok: false, message: limitMessage }

  if (!hasAcceptedStudySourceDisclosure()) {
    if (typeof window === 'undefined') return { ok: false, message: 'AI study tools must be opened in the app.' }
    const accepted = window.confirm(
      'AI study tools copy only the material selected for this request to your private Premed OS server workspace. '
      + (options.artifact === 'unit-question-bank'
        ? 'For a question bank, temporary compressed copies of selected image pages are also sent directly to Claude for visual inspection; they are not stored in the server source mirror. '
        : '')
      + 'Your local data remains canonical, and you can delete the server copy at any time in Settings. Continue?',
    )
    if (!accepted) return { ok: false, message: 'No material was copied, so nothing was generated.' }
    acceptStudySourceDisclosure()
  }

  const scopeId = sourceScopeForGeneration(chunks)
  const key = studySourceSyncKey(courseId, scopeId)
  const fingerprint = studySourceFingerprint(sources)
  if (options.forceSync || typeof localStorage === 'undefined' || localStorage.getItem(key) !== fingerprint) {
    const result = await tools.syncSources({
      action: 'sync-sources',
      courseId,
      topicId: scopeId,
      sources,
      ...(options.artifact === 'unit-question-bank' ? { purpose: 'unit-question-bank' as const } : {}),
    })
    if (!result.ok) return { ok: false, message: result.message }
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, fingerprint)
  }

  return { ok: true, scopeId, chunkIds: sources.map((source) => source.chunkId) }
}

/**
 * A browser receipt can outlive its private server mirror (for example after
 * source deletion, a database reset, or expiry). If generation proves the
 * mirror is missing, rebuild it once from the still-canonical local passages
 * and replay the exact request. Other failures are never retried here.
 */
export async function generateWithSourceRecovery(
  courseId: string,
  chunks: readonly SourceChunk[],
  request: GenerateRequest,
  options: GenerationSourceOptions = {},
  tools: GenerationSourceTools = studyTools,
): Promise<StudyToolResponse<GeneratedStudyToolArtifact>> {
  const first = await tools.generate(request)
  if (first.ok || first.code !== 'no-sources') return first

  const refreshed = await prepareGenerationSources(courseId, chunks, { ...options, forceSync: true }, tools)
  if (!refreshed.ok || !refreshed.scopeId || !refreshed.chunkIds) {
    return { ok: false, code: 'unavailable', message: refreshed.message ?? 'Source material could not be restored.' }
  }

  return tools.generate({
    ...request,
    topicId: refreshed.scopeId,
    chunkIds: refreshed.chunkIds,
  })
}

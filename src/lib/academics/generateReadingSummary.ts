import { assembleGenerationRequest } from '@/lib/generation'
import type { StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import type { AcademicFile, SourceChunk } from '@/lib/types'
import { assertGenerationAllowed, generatedTitle } from './generationPolicy'
import { generateWithSourceRecovery, prepareGenerationSources, MAX_GENERATION_SOURCE_CHARACTERS, MAX_GENERATION_SOURCE_CHUNKS } from './syncGenerationSources'
import { renderGuide } from './generateStudyGuide'

export const READING_KINDS = {
  'assigned-reading': 'Assigned reading · arguments and discussion',
  'primary-research': 'Research paper · question, evidence, and limits',
  'textbook-chapter': 'Textbook chapter · concepts and mechanisms',
} as const
export type ReadingKind = keyof typeof READING_KINDS
export const READING_SECTIONS: Record<ReadingKind, string[]> = {
  'assigned-reading': ['citation', 'argument', 'how-it-argues', 'discussion'],
  'primary-research': ['citation', 'question', 'methods', 'findings', 'limitations', 'recall'],
  'textbook-chapter': ['big-picture', 'core-claims', 'must-memorize', 'recall'],
}
const genericHeadings = /^(citation|the question|what they did|what they found|what it does not establish|terms and techniques|how it connects|active recall|big picture|core claims|mechanisms|where students go wrong|must memorize|the argument|how it argues|what it assumes|where it sits|discussion prep|introduction|summary|conclusion)$/i

export interface ReadingSummaryInput {
  courseId: string
  courseLabel: string
  reading: AcademicFile
  kind: ReadingKind
  focus?: string
  contextFileIds: string[]
  files: AcademicFile[]
  chunks: SourceChunk[]
}

/** Validate output structure and exact evidence identity before saving. Semantic coverage needs evaluation. */
export function readingSummaryIssues(value: unknown, kind: ReadingKind, chunks: SourceChunk[], readingId: string): string[] {
  const artifact = value as StudyGuideArtifact | undefined
  if (!artifact || !Array.isArray(artifact.sections) || !artifact.sections.length) return ['Missing reading sections']
  const issues: string[] = []
  const sectionIds = new Set<string>(), headings = new Set<string>(), blockIds = new Set<string>()
  const evidence = new Map(chunks.map(chunk => [chunk.id, chunk]))
  let citesReading = false
  for (const section of artifact.sections) {
    if (!section || typeof section.id !== 'string' || typeof section.title !== 'string' || !section.title.trim() || !Array.isArray(section.blocks)) { issues.push('Malformed section'); continue }
    if (sectionIds.has(section.id) || headings.has(section.title.trim().toLowerCase())) issues.push('Duplicate heading or section ID')
    sectionIds.add(section.id); headings.add(section.title.trim().toLowerCase())
    if (genericHeadings.test(section.title.trim())) issues.push('Replace generic headings with reading-specific claims or questions')
    if (!section.blocks.length) issues.push('Empty section')
    for (const block of section.blocks) {
      if (!block || typeof block.id !== 'string' || !block.id || blockIds.has(block.id)) { issues.push('Invalid or duplicate block ID'); continue }
      blockIds.add(block.id)
      if (!['prose', 'bullets', 'numbered', 'table', 'callout', 'gap', 'contradiction', 'must_memorize', 'must_understand', 'recall'].includes(block.type)) issues.push('Unknown content type')
      if (!['source', 'clarification'].includes(block.provenance)) issues.push('Unsupported provenance')
      if ((block.depth ?? 0) > 2) issues.push('Heading/list depth exceeds two levels')
      if (!(typeof block.text?.content === 'string' && block.text.content.trim()) && !(Array.isArray(block.items) && block.items.some(item => item && typeof item.content === 'string' && item.content.trim()))) issues.push('Empty content block')
      if (block.text !== undefined && typeof block.text?.content !== 'string') issues.push('Malformed text content')
      if (block.items !== undefined && (!Array.isArray(block.items) || block.items.some(item => !item || typeof item.content !== 'string'))) issues.push('Malformed list items')
      const ref = block.sourceRef, source = ref && evidence.get(ref.chunkId)
      if (!source || !ref || source.fileId !== ref.fileId || !Number.isFinite(ref.start) || !Number.isFinite(ref.end) || ref.start < (source.characterStart ?? 0) || ref.end > (source.characterEnd ?? source.content.length) || ref.end <= ref.start) issues.push('Missing or invalid selected-source reference')
      else if (source.fileId === readingId) citesReading = true
    }
  }
  for (const id of READING_SECTIONS[kind]) if (!sectionIds.has(id)) issues.push(`Missing required section ID: ${id}`)
  if (!citesReading) issues.push('The summary does not cite the designated reading')
  return [...new Set(issues)]
}

export async function generateReadingSummary(input: ReadingSummaryInput) {
  const { courseId, courseLabel, reading, kind, focus, contextFileIds, files } = input
  if (!Object.hasOwn(READING_KINDS, kind) || reading.courseId !== courseId) return { ok: false as const, message: 'Choose a reading type and a reading from this class.' }
  const ids = new Set([reading.id, ...contextFileIds])
  const chunks = input.chunks.filter(chunk => chunk.courseId === courseId && ids.has(chunk.fileId) && chunk.content.trim())
  if ([...ids].some(id => !chunks.some(chunk => chunk.fileId === id))) return { ok: false as const, message: 'Every selected source needs readable text. Add a clearer copy or remove unreadable context; nothing was generated.' }
  if (new Set(chunks.map(chunk => chunk.id)).size !== chunks.length) return { ok: false as const, message: 'Some selected passages have duplicate identifiers. Re-import the affected material before generating.' }
  if (chunks.length > MAX_GENERATION_SOURCE_CHUNKS || chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) > MAX_GENERATION_SOURCE_CHARACTERS) return { ok: false as const, message: 'This reading and context exceed the current build limit. Choose a smaller excerpt or less context. Nothing was sampled or truncated.' }
  assertGenerationAllowed({ scope: 'academics', artifact: 'summary', courseId, groundedIn: chunks.map(chunk => chunk.id) })
  const prepared = await prepareGenerationSources(courseId, chunks)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) return { ok: false as const, message: prepared.message ?? 'Could not prepare selected sources.' }
  if (prepared.chunkIds.length !== chunks.length || chunks.some(chunk => !prepared.chunkIds!.includes(chunk.id))) return { ok: false as const, message: 'The complete selected packet was not prepared. Nothing was generated.' }
  const metadata = files.filter(file => ids.has(file.id) && file.courseId === courseId).map(file => ({ id: file.id, title: file.title, type: file.type, sourceType: file.sourceType }))
  const requestText = [
    `Student-selected reading kind: ${kind}. Required section IDs: ${READING_SECTIONS[kind].join(', ')}. Use reading-specific claims/questions as titles, not these role names.`,
    'Address each selected reading question with source-supported reasoning or an explicit missing-evidence label. Include additional sections for supported themes, assumptions, terms, mechanisms, course connections, and disagreements where useful. No unsupported filler. Optional roles may be omitted; required roles must explicitly explain missing source information.',
    `Designated reading file ID: ${reading.id}. Reading chunk IDs: ${chunks.filter(chunk => chunk.fileId === reading.id).map(chunk => chunk.id).join(', ')}.`,
    `Selected course context chunk IDs: ${chunks.filter(chunk => chunk.fileId !== reading.id).map(chunk => chunk.id).join(', ') || 'none'}. Do not retrieve or assume unselected class material.`,
    `Course label and student focus (orientation, not source evidence): ${JSON.stringify({ courseLabel, focus: focus?.trim() || 'No focus supplied' })}.`,
    `Selected source metadata (labels only): ${JSON.stringify(metadata)}. Source positions: ${JSON.stringify(chunks.map(chunk => ({ id: chunk.id, position: chunk.sourcePosition?.label ?? 'Saved passage offsets; no page label' })))}.`,
    'Read the complete supplied packet; connect the reading to the selected context without displacing its argument. Produce the full reading summary with exact sourceRef identities and offsets.',
  ].join('\n\n')
  const assembled = assembleGenerationRequest({ specId: 'reading-summary-v1', chunkIds: prepared.chunkIds, controls: { source_mode: 'SOURCE_ONLY' }, request: requestText })
  const request = { action: 'generate' as const, courseId, topicId: prepared.scopeId, chunkIds: assembled.chunkIds, specId: assembled.specId, specHash: assembled.specHash, systemPrompt: assembled.systemPrompt, request: requestText }
  let result = await generateWithSourceRecovery(courseId, chunks, request)
  if (!result.ok) return { ok: false as const, message: result.message }
  let issues = readingSummaryIssues(result.data.artifact, kind, chunks, reading.id)
  if (issues.length) {
    result = await generateWithSourceRecovery(courseId, chunks, { ...request, request: `${requestText}\n\nRebuild the full artifact, preserving reading kind, course focus, selected context, and all argument/rhetoric requirements. Correct: ${issues.join('; ')}.` })
    if (!result.ok) return { ok: false as const, message: result.message }
    issues = readingSummaryIssues(result.data.artifact, kind, chunks, reading.id)
  }
  if (issues.length) return { ok: false as const, message: `The reading summary did not pass its checks. Nothing was saved. ${issues.join('; ')}` }
  const artifact: StudyGuideArtifact = { ...(result.data.artifact as StudyGuideArtifact), specId: assembled.specId, specHash: assembled.specHash, courseId, topicId: prepared.scopeId }
  return { ok: true as const, artifact, title: generatedTitle(`${reading.title} · Reading summary`), content: renderGuide(artifact), auditStatus: result.data.auditStatus, fileIds: [...ids] }
}

import { lectureSourcePriorityInstruction } from './lectureSourcePriority'
/**
 * Generate a study guide from a class's own material.
 *
 * This is the path §6.2's "generate study guide" always meant, and the first
 * thing in the app that actually reaches the generation engine. Everything
 * before it — the layer stack, the closed citation set, the deterministic
 * checks — was reachable only from tests.
 *
 * The order matters and is not incidental:
 *   1. `assertGenerationAllowed` — the scope gate, which refuses an artifact
 *      Academics does not permit and refuses generation grounded in nothing.
 *   2. `assembleGenerationRequest` — the versioned prompt, stamped with a
 *      `specHash` so a later artifact can be traced to the spec that made it.
 *   3. The two-pass call, where the server verifies citations and rejects an
 *      artifact whose structuring pass minted one.
 *   4. `generatedTitle` — guardrail 3, so the result never reads as the
 *      genuine article.
 *
 * ⚠️ Every failure below is a real outcome with its own message. A generation
 * that quietly produces nothing is worse than one that says why it stopped.
 */
import { assembleGenerationRequest } from '@/lib/generation'
import { assertGenerationAllowed, GenerationNotAllowedError, generatedTitle } from '@/lib/academics/generationPolicy'
import { generateWithSourceRecovery, prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import type { SourceChunk } from '@/lib/types'
import { courseLensInstruction, type CourseLensGenerationContext } from '@/lib/academics/courseLens'
import type { StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import type { GenerationAuditStatus } from '@/lib/intelligence/studyTools'

export type GenerateFailure =
  | 'not-allowed' | 'no-sources' | 'sign-in-required' | 'provider-unavailable'
  | 'citation-not-carried' | 'invalid-response' | 'unknown'

export interface GenerateOutcome {
  ok: boolean
  failure?: GenerateFailure
  message?: string
  title?: string
  content?: string
  artifact?: StudyGuideArtifact
  auditStatus?: GenerationAuditStatus
  specHash?: string
  fileIds?: string[]
  courseLens?: CourseLensGenerationContext
  /** A short provider-authored lecture label taken from the guide's TITLE section. */
  suggestedTitle?: string
}

/** The chunks this class has, optionally narrowed to one file. */
export function sourcesFor(chunks: SourceChunk[], courseId: string, fileId?: string): SourceChunk[] {
  return chunks.filter((chunk) =>
    chunk.courseId === courseId && (fileId == null || chunk.fileId === fileId))
}

/**
 * Render the structured artifact into the text a `ClassNote` can hold.
 *
 * Deliberately plain: the guide's value is its structure, and a renderer that
 * invents styling would be making a design decision the drawing did not.
 */
export function renderGuide(artifact: unknown): string {
  const sections = (artifact as { sections?: Array<{ title?: string; blocks?: Array<{ text?: { content?: string }; items?: Array<{ content?: string }> }> }> })?.sections
  if (!Array.isArray(sections)) return ''
  const lines: string[] = []
  for (const section of sections) {
    if (section.title) lines.push(`## ${section.title}`)
    for (const block of section.blocks ?? []) {
      if (block.text?.content) lines.push(block.text.content)
      for (const item of block.items ?? []) if (item.content) lines.push(`- ${item.content}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim()
}

function isStudyGuideContent(value: unknown): value is Pick<StudyGuideArtifact, 'sections'> {
  if (!value || typeof value !== 'object') return false
  const artifact = value as Partial<StudyGuideArtifact>
  return Array.isArray(artifact.sections)
    && artifact.sections.length > 0
    && artifact.sections.every((section) => Boolean(
      section && typeof section.id === 'string' && typeof section.title === 'string'
      && Array.isArray(section.blocks) && section.blocks.length > 0,
    ))
}

export function conciseStudyGuideTitle(artifact: Pick<StudyGuideArtifact, 'sections'>): string | undefined {
  const titleSection = artifact.sections.find((section) => section.id.toLocaleLowerCase() === 'title')
  const raw = titleSection?.blocks
    .flatMap((block) => [block.text?.content, ...(block.items?.map((item) => item.content) ?? [])])
    .find((value) => value?.trim())
    // Older completed guides may omit TITLE. Reuse a provider-authored topic
    // heading so they gain a descriptive label without rerunning generation.
    ?? artifact.sections.find((section) => !/^(?:title|at a glance|overview|core concepts|must understand|must memorize|examples and applications|section[ _-]*\d+)$/i.test(section.title.trim()))?.title
  if (!raw) return undefined
  const cleaned = raw
    .replace(/^\s*#+\s*/, '')
    .replace(/^\s*title\s*:?\s*/i, '')
    .replace(/^(?:\s*(?:lesson|lecture)\s*#?\d+\s*(?:[·:—–-]\s*)?)+/i, '')
    .replace(/\b(?:auto[- ]generated|ai[- ]generated|generated)\b/gi, '')
    .replace(/\b(?:study guide|mastery map|transcript|script)\b/gi, '')
    .replace(/[|·:—–-]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned || /^(?:title|lecture)$/i.test(cleaned)) return undefined
  const words = cleaned.split(' ').slice(0, 6).join(' ')
  return words.length > 56 ? `${words.slice(0, 55).trimEnd()}…` : words
}

export async function generateStudyGuide({ courseId, chunks, label, courseLens, practiceQuestionChunkIds = [], primarySourceChunkIds = [] }: {
  courseId: string
  topicId?: string
  chunks: SourceChunk[]
  /** What the student pointed at — used for the artifact's title. */
  label: string
  /** Optional, reviewed course context; its sources must already be selected. */
  courseLens?: CourseLensGenerationContext
  /** Selected passages containing supplied question examples. */
  practiceQuestionChunkIds?: readonly string[]
  primarySourceChunkIds?: readonly string[]
}): Promise<GenerateOutcome> {
  const sources = chunks
  if (!sources.length) {
    return {
      ok: false,
      failure: 'no-sources',
      message: 'This material has no processed text yet, so there is nothing to build from. '
        + 'Premed OS will not fill the gap with general course content.',
    }
  }

  try {
    assertGenerationAllowed({
      scope: 'academics',
      artifact: 'study-guide',
      courseId,
      groundedIn: sources.map((chunk) => chunk.id),
    })
  } catch (error) {
    return {
      ok: false,
      failure: 'not-allowed',
      message: error instanceof GenerationNotAllowedError ? error.message : 'Generation is not permitted here.',
    }
  }

  const prepared = await prepareGenerationSources(courseId, sources)
  if (!prepared.ok || !prepared.scopeId || !prepared.chunkIds) {
    return { ok: false, failure: 'provider-unavailable', message: prepared.message ?? 'Source material could not be prepared.' }
  }
  const preparedIds = new Set(prepared.chunkIds)
  const sourcePriority = lectureSourcePriorityInstruction(primarySourceChunkIds.filter((id) => preparedIds.has(id)))
  const questionReferenceIds = [...new Set(practiceQuestionChunkIds.filter((id) => preparedIds.has(id)))]

  const syncedAssembly = assembleGenerationRequest({
    specId: 'study-guide-v1',
    chunkIds: prepared.chunkIds,
    request: [
      sourcePriority,
      `Topic: ${label}. Action: generate one canonical study guide from the attached sources. Begin with AT A GLANCE, then preserve the full source-supported teaching depth in the detailed sections without repeating the opening.`,
      'AI lecture naming: include a section with id "title" and title "TITLE", containing one cited text block with a concise 3–6 word title describing the central topic across the lecture. Do not echo the upload filename, lesson number, auto-generated transcript label, or "Study Guide". This title becomes the completed lecture name. Keep AT A GLANCE as the opening teaching section after this title metadata.',
      courseLensInstruction(courseLens),
      questionReferenceIds.length
        ? `Reference-question chunk IDs: ${questionReferenceIds.join(', ')}. Use their source-supported scenarios, representations, and reasoning moves as teaching examples where they clarify a concept. Explain the lesson without copying stems or answer choices, and never treat a distractor as fact.`
        : '',
    ].filter(Boolean).join('\n\n'),
  })

  const result = await generateWithSourceRecovery(courseId, sources, {
    action: 'generate',
    courseId,
    topicId: prepared.scopeId,
    chunkIds: syncedAssembly.chunkIds,
    specId: syncedAssembly.specId,
    specHash: syncedAssembly.specHash,
    systemPrompt: syncedAssembly.systemPrompt,
    request: [
      sourcePriority,
      `Topic: ${label}.`,
      'Return one complete Study Guide: AT A GLANCE is its opening layer, not a separate brief and not a substitute for the full explanation.',
      courseLens ? 'Apply the supplied Course lens only within its selected evidence trace.' : '',
      questionReferenceIds.length ? 'Use the marked question passages as source-backed explanatory examples, without copying their assessment wording.' : '',
    ].filter(Boolean).join(' '),
  })

  if (!result.ok) {
    // Every server code maps to an outcome the student can act on. `unknown`
    // exists only so a future code cannot silently become a success.
    const BY_CODE: Record<string, GenerateFailure> = {
      'sign-in-required': 'sign-in-required',
      'citation-not-carried': 'citation-not-carried',
      'no-sources': 'no-sources',
      'invalid-response': 'invalid-response',
      unavailable: 'provider-unavailable',
      unconfigured: 'provider-unavailable',
      'rate-limited': 'provider-unavailable',
      'request-too-large': 'provider-unavailable',
    }
    return { ok: false, failure: BY_CODE[result.code] ?? 'unknown', message: result.message }
  }

  if (!isStudyGuideContent(result.data.artifact)) {
    return {
      ok: false,
      failure: 'invalid-response',
      message: 'The generator returned an incomplete study guide. Nothing was saved.',
    }
  }
  // Stable identity belongs to the runtime, not the model. Stamp the exact
  // assembled values after the server has closed the artifact's citations.
  const artifact: StudyGuideArtifact = {
    specId: 'study-guide-v1',
    specHash: syncedAssembly.specHash,
    courseId,
    topicId: prepared.scopeId,
    sections: result.data.artifact.sections,
  }
  const content = renderGuide(artifact)
  if (!content) return { ok: false, failure: 'invalid-response', message: 'The generator returned nothing renderable. Nothing was saved.' }

  return {
    ok: true,
    title: generatedTitle(`${label} study guide`),
    content,
    artifact,
    auditStatus: result.data.auditStatus,
    specHash: syncedAssembly.specHash,
    fileIds: [...new Set(sources.map((chunk) => chunk.fileId))],
    courseLens,
    suggestedTitle: conciseStudyGuideTitle(artifact),
  }
}

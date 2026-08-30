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
import { prepareGenerationSources } from '@/lib/academics/syncGenerationSources'
import { studyTools } from '@/lib/intelligence/studyTools'
import type { SourceChunk } from '@/lib/types'
import { courseLensInstruction, type CourseLensGenerationContext } from '@/lib/academics/courseLens'

export type GenerateFailure =
  | 'not-allowed' | 'no-sources' | 'sign-in-required' | 'provider-unavailable'
  | 'citation-not-carried' | 'invalid-response' | 'unknown'

export interface GenerateOutcome {
  ok: boolean
  failure?: GenerateFailure
  message?: string
  title?: string
  content?: string
  specHash?: string
  fileIds?: string[]
  courseLens?: CourseLensGenerationContext
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

export async function generateStudyGuide({ courseId, chunks, label, courseLens }: {
  courseId: string
  topicId?: string
  chunks: SourceChunk[]
  /** What the student pointed at — used for the artifact's title. */
  label: string
  /** Optional, reviewed course context; its sources must already be selected. */
  courseLens?: CourseLensGenerationContext
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

  const syncedAssembly = assembleGenerationRequest({
    specId: 'study-guide-v1',
    chunkIds: prepared.chunkIds,
    request: [
      `Topic: ${label}. Action: generate a study guide from the attached sources.`,
      courseLensInstruction(courseLens),
    ].filter(Boolean).join('\n\n'),
  })

  const result = await studyTools.generate({
    action: 'generate',
    courseId,
    topicId: prepared.scopeId,
    chunkIds: syncedAssembly.chunkIds,
    specId: syncedAssembly.specId,
    specHash: syncedAssembly.specHash,
    systemPrompt: syncedAssembly.systemPrompt,
    request: [
      `Topic: ${label}.`,
      courseLens ? 'Apply the supplied Course lens only within its selected evidence trace.' : '',
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

  const content = renderGuide(result.data.artifact)
  if (!content) {
    return {
      ok: false,
      failure: 'invalid-response',
      message: 'The generator returned nothing renderable. Nothing was saved.',
    }
  }

  return {
    ok: true,
    title: generatedTitle(`${label} study guide`),
    content,
    specHash: syncedAssembly.specHash,
    fileIds: [...new Set(sources.map((chunk) => chunk.fileId))],
    courseLens,
  }
}

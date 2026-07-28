/* The single allow-list for generated practice material.
 *
 * The locked decision is narrow: the app may generate practice items ONLY for
 * missed-to-mastery drills and flashcards. Everything else — full practice
 * exams, "generate a study guide", legacy one-off generators — is outside the
 * allow-list and must either be removed or routed through here.
 *
 * This module is the proof. Generation paths call `assertGenerationAllowed`
 * (or check `isGenerationAllowed`) so the boundary is enforced in one place
 * rather than re-argued at each call site, and so a new generator cannot be
 * added without either appearing in this list or throwing.
 */

/** Contexts permitted to produce generated practice items. */
export const ALLOWED_GENERATION_CONTEXTS = ['missed-to-mastery', 'flashcards'] as const

export type GenerationContext = (typeof ALLOWED_GENERATION_CONTEXTS)[number]

/** Contexts that previously generated content and are deliberately closed.
 *  Kept named (rather than deleted silently) so the audit stays legible. */
export const RETIRED_GENERATION_CONTEXTS = ['practice-exam', 'study-guide'] as const

export type RetiredGenerationContext = (typeof RETIRED_GENERATION_CONTEXTS)[number]

export function isGenerationAllowed(context: string): context is GenerationContext {
  return (ALLOWED_GENERATION_CONTEXTS as readonly string[]).includes(context)
}

export class GenerationNotAllowedError extends Error {
  readonly context: string

  constructor(context: string) {
    super(
      `Generated practice is limited to ${ALLOWED_GENERATION_CONTEXTS.join(' and ')}. `
      + `"${context}" is outside the allow-list — route it through an approved `
      + 'context or remove it.',
    )
    this.name = 'GenerationNotAllowedError'
    this.context = context
  }
}

/** Throws unless `context` is on the allow-list. Call at the top of any path
 *  that produces generated study material. */
export function assertGenerationAllowed(context: string): asserts context is GenerationContext {
  if (!isGenerationAllowed(context)) throw new GenerationNotAllowedError(context)
}

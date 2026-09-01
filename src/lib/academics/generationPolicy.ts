/* Generation policy — SCOPED. Read this before adding any generator.
 *
 * There are two different rules in this app, and they were previously
 * conflated into one app-wide restriction. They are not the same rule and
 * they exist for different reasons:
 *
 *   ACADEMICS (tabs/01-academics.md §6.3) — PERMISSIVE.
 *     AI may generate ANY study artifact for a specific class. Coursework has
 *     no standardized-exam constraint, so the old blanket ban was simply wrong
 *     here and is lifted.
 *
 *   MCAT (tabs/02-mcat.md §2a) — RESTRICTED, and unchanged.
 *     MCAT practice must mirror a real standardized exam, so QBank questions
 *     and CARS passages must be externally sourced, never generated. AI there
 *     stays limited to missed-to-mastery drills and flashcards.
 *
 * The scope is therefore part of every request. A generator cannot be written
 * without saying which world it lives in, which is what stops the two rules
 * being merged again.
 */
import type { AcademicFile, AcademicFileOwner } from '@/lib/types'

export type GenerationScope = 'academics' | 'mcat'

/** Academics: any study artifact, for a specific class. */
export const ACADEMICS_ARTIFACTS = [
  'practice-exam', 'practice-problems', 'problem-set', 'quiz', 'worksheet',
  'study-guide', 'revised-notes', 'summary', 'explanation', 'flashcards', 'recall-prompts',
  'unit-mastery-outline', 'unit-question-bank',
] as const

/** MCAT: unchanged — drills and flashcards only. */
export const MCAT_ARTIFACTS = ['missed-to-mastery', 'flashcards'] as const

/** Named so the boundary is legible, and so a test can assert they stay out. */
export const MCAT_FORBIDDEN_ARTIFACTS = ['qbank-questions', 'cars-passages'] as const

export type AcademicsArtifact = (typeof ACADEMICS_ARTIFACTS)[number]
export type McatArtifact = (typeof MCAT_ARTIFACTS)[number]
export type GenerationArtifact = AcademicsArtifact | McatArtifact

const ALLOWED_BY_SCOPE: Record<GenerationScope, readonly string[]> = {
  academics: ACADEMICS_ARTIFACTS,
  mcat: MCAT_ARTIFACTS,
}

/** Generated artifacts always carry this ownership marker (guardrail 2). */
export const GENERATED_OWNER: AcademicFileOwner = 'generated'

export interface GenerationRequest {
  scope: GenerationScope
  artifact: string
  /** Academics only: generation is always for ONE class. */
  courseId?: string
  /** Ids of student-supplied materials/topics or the student's own missed
   *  questions. Empty means "invented from thin air", which is refused in
   *  both Academics and MCAT. */
  groundedIn?: readonly string[]
}

export function isGenerationAllowed(scope: GenerationScope, artifact: string): boolean {
  return ALLOWED_BY_SCOPE[scope]?.includes(artifact) ?? false
}

export class GenerationNotAllowedError extends Error {
  readonly scope: GenerationScope
  readonly artifact: string

  constructor(scope: GenerationScope, artifact: string, detail: string) {
    super(detail)
    this.name = 'GenerationNotAllowedError'
    this.scope = scope
    this.artifact = artifact
  }
}

/** Phrases that would present generated work as the genuine article
 *  (guardrail 3). Deliberately narrow: it targets claims of authenticity,
 *  not ordinary words like "exam" or "midterm". */
const PRESENTED_AS_REAL = /\b(past paper|previous exam|actual exam|real exam|official exam|the upcoming exam|last year'?s exam|professor'?s exam)\b/i

export function presentsAsRealExam(title: string): boolean {
  return PRESENTED_AS_REAL.test(title)
}

/** The one gate. Throws unless the request satisfies its scope's rule and the
 *  shared source boundary; Academics also requires one specific class. */
export function assertGenerationAllowed(request: GenerationRequest): void {
  const { scope, artifact } = request

  if (!isGenerationAllowed(scope, artifact)) {
    const allowed = ALLOWED_BY_SCOPE[scope]?.join(', ') ?? '(unknown scope)'
    const why = scope === 'mcat'
      ? `MCAT practice must mirror a real standardized exam, so "${artifact}" has to be externally sourced. Generation here is limited to: ${allowed}.`
      : `"${artifact}" is not a recognised study artifact. Academics generation covers: ${allowed}.`
    throw new GenerationNotAllowedError(scope, artifact, why)
  }

  // Guardrail 1 — every generated artifact begins with material the student
  // supplied. Background may later elaborate a source-backed concept under
  // generation/02 §2.6; it can never replace this grounding.
  if (!request.groundedIn?.length) {
    const sourceDescription = scope === 'mcat'
      ? "the student's own missed questions or supplied study material"
      : "this class's own materials (syllabus, slides, readings, notes, or topics)"
    throw new GenerationNotAllowedError(scope, artifact,
      `Generated work must derive from ${sourceDescription}; select what it should be built from.`)
  }

  if (scope === 'academics' && !request.courseId) {
    throw new GenerationNotAllowedError(scope, artifact,
      'Academics generation is always for one specific class; no course was given.')
  }
}

/** Guardrail 2 — stamp the ownership marker on a generated artifact. */
export function markGenerated<T extends Partial<AcademicFile>>(file: T): T & { owner: AcademicFileOwner } {
  return { ...file, owner: GENERATED_OWNER }
}

/** Guardrail 3 — a generated title never claims to be the genuine article.
 *  Returns a safe title rather than throwing, so a user's wording can't block
 *  their own work; the claim is simply removed and the label made explicit. */
export function generatedTitle(title: string): string {
  const cleaned = presentsAsRealExam(title) ? title.replace(PRESENTED_AS_REAL, 'practice material') : title
  return /^generated\b/i.test(cleaned) ? cleaned : `Generated · ${cleaned}`
}

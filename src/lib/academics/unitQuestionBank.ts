import type { UnitMasteryOutlineArtifact, MasteryStandard } from '@/lib/generation/artifacts/unitMasteryOutline.v1'
import type { CourseQuestionStyle, QuestionMove, UnitQuestion, UnitQuestionBankArtifact } from '@/lib/generation/artifacts/unitQuestionBank.v1'

export interface CourseQuestionBlueprint {
  courseStyle: CourseQuestionStyle
  defaultCurrentUnitPercent: number
  defaultIntegrationPercent: number
  moves: QuestionMove[]
  instruction: string
}

export const BIOLOGY_QUESTION_BLUEPRINT: CourseQuestionBlueprint = {
  courseStyle: 'biology', defaultCurrentUnitPercent: 70, defaultIntegrationPercent: 30,
  moves: ['application', 'integration', 'method-and-controls', 'interpretation', 'recall'],
  instruction: 'Use biological scenarios, data or diagrams, methods and controls, and deliberate links between current and prior standards. Ask what follows, not only for a definition.',
}
export const PSYCHOLOGY_QUESTION_BLUEPRINT: CourseQuestionBlueprint = {
  courseStyle: 'psychology', defaultCurrentUnitPercent: 100, defaultIntegrationPercent: 0,
  moves: ['situational', 'application', 'interpretation', 'recall'],
  instruction: 'Use short situations and careful concept identification. Keep the answer tied to the supplied course language and do not turn a vignette into generic advice.',
}
export const GENERAL_QUESTION_BLUEPRINT: CourseQuestionBlueprint = {
  courseStyle: 'general', defaultCurrentUnitPercent: 100, defaultIntegrationPercent: 0,
  moves: ['application', 'interpretation', 'recall'],
  instruction: 'Vary recall and source-grounded application in proportion to the supplied material and course goals.',
}

export function blueprintForCourse(course: { code?: string; title?: string; type?: string }): CourseQuestionBlueprint {
  const label = `${course.code ?? ''} ${course.title ?? ''}`.toLowerCase()
  if (/\b(biol|biology|cell|genetics|neuroscience|chem|physics)\b/.test(label)) return BIOLOGY_QUESTION_BLUEPRINT
  if (/\b(psyc|psychology|cognitive|behavior)\b/.test(label)) return PSYCHOLOGY_QUESTION_BLUEPRINT
  return GENERAL_QUESTION_BLUEPRINT
}

function text(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function clean(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ')
}

function allClosed(ids: unknown, closed: ReadonlySet<string>) {
  return Array.isArray(ids) && ids.length > 0 && ids.every((id) => typeof id === 'string' && closed.has(id))
}

function unique(values: readonly string[]) {
  return new Set(values.map(clean)).size === values.length
}

const AMBIGUOUS_PROMPT = /\b(all of the above|none of the above|it depends|what do you think|which (?:one|statement) is true)\b/i

function hasActionablePrompt(value: string) {
  const normalized = clean(value)
  return normalized.split(' ').length >= 5
    && !AMBIGUOUS_PROMPT.test(value)
    && /\b(what|which|how|why|explain|identify|predict|interpret|compare|describe|select|calculate|determine|evaluate|apply)\b/i.test(value)
}

function validStringList(value: unknown) {
  return Array.isArray(value) && value.every(text)
}

/**
 * A small, deterministic similarity guard for private assessment material.
 * It compares word trigrams, not answers or semantic labels, so it can reject
 * copied stems without pretending that a model's concept choice is plagiarism.
 */
export function privateAssessmentSimilarity(candidate: string, reference: string): number {
  const grams = (value: string) => {
    const words = clean(value).split(' ').filter(Boolean)
    return new Set(words.slice(0, Math.max(0, words.length - 2)).map((_, index) => words.slice(index, index + 3).join(' ')))
  }
  const left = grams(candidate)
  const right = grams(reference)
  if (!left.size || !right.size) return 0
  let overlap = 0
  for (const gram of left) if (right.has(gram)) overlap += 1
  return overlap / Math.min(left.size, right.size)
}

export function validateMasteryOutline(value: unknown, closedChunkIds: readonly string[]): UnitMasteryOutlineArtifact | null {
  if (!value || typeof value !== 'object') return null
  const artifact = value as Partial<UnitMasteryOutlineArtifact>
  if (!text(artifact.title) || !text(artifact.unit) || !Array.isArray(artifact.standards) || !artifact.standards.length) return null
  const closed = new Set(closedChunkIds)
  const seen = new Set<string>()
  for (const raw of artifact.standards) {
    if (!raw || typeof raw !== 'object') return null
    const standard = raw as Partial<MasteryStandard>
    if (!text(standard.id) || !text(standard.title) || seen.has(standard.id)) return null
    if (!validStringList(standard.understand) || !validStringList(standard.beAbleToDo) || !validStringList(standard.watchFor)) return null
    if (!standard.understand.length && !standard.beAbleToDo.length && !standard.watchFor.length) return null
    if (!allClosed(standard.sourceChunkIds, closed) || !unique(standard.sourceChunkIds!)) return null
    seen.add(standard.id)
  }
  return artifact as UnitMasteryOutlineArtifact
}

function validQuestion(raw: unknown, closed: ReadonlySet<string>, privatePhrases: readonly string[], expectedStandardIds?: ReadonlySet<string>): raw is UnitQuestion {
  if (!raw || typeof raw !== 'object') return false
  const question = raw as Partial<UnitQuestion>
  if (!text(question.id) || !text(question.prompt) || !hasActionablePrompt(question.prompt) || !text(question.answer) || !text(question.rationale)
    || !text(question.unit) || !text(question.primaryStandardId) || !allClosed(question.sourceChunkIds, closed)
    || (question.scope !== 'current-unit' && question.scope !== 'prior-unit-integration')
    || !['application', 'integration', 'situational', 'recall', 'interpretation', 'method-and-controls'].includes(question.move as string)
    || !['foundational', 'standard', 'challenging'].includes(question.difficulty as string)) return false
  if (question.secondaryStandardIds != null && (!Array.isArray(question.secondaryStandardIds) || !question.secondaryStandardIds.every(text) || !unique(question.secondaryStandardIds))) return false
  if (question.secondaryStandardIds?.some((id) => clean(id) === clean(question.primaryStandardId as string))) return false
  if (expectedStandardIds && (!expectedStandardIds.has(question.primaryStandardId as string) || question.secondaryStandardIds?.some((id) => !expectedStandardIds.has(id)))) return false
  if (question.scope === 'prior-unit-integration' && !(question.secondaryStandardIds?.length)) return false
  if (question.options != null) {
    if (!Array.isArray(question.options) || question.options.length < 2 || !question.options.every(text) || !unique(question.options)) return false
    if (!question.options.some((option) => clean(option) === clean(question.answer as string))) return false
  }
  const candidateText = [question.prompt, question.answer, question.rationale, ...(question.options ?? [])].join(' ')
  if (privatePhrases.some((phrase) => text(phrase) && (clean(candidateText).includes(clean(phrase)) || privateAssessmentSimilarity(candidateText, phrase) >= 0.75))) return false
  return true
}

export function validateUnitQuestionBank(
  value: unknown,
  closedChunkIds: readonly string[],
  privateAssessmentPhrases: readonly string[] = [],
  expectedStandardIds?: readonly string[],
): UnitQuestionBankArtifact | null {
  if (!value || typeof value !== 'object') return null
  const artifact = value as Partial<UnitQuestionBankArtifact>
  if (!text(artifact.title) || !text(artifact.unit)
    || !['biology', 'psychology', 'general'].includes(artifact.courseStyle as string)
    || !Number.isFinite(artifact.currentUnitPercent) || !Number.isFinite(artifact.integrationPercent)
    || Number(artifact.currentUnitPercent) < 0 || Number(artifact.currentUnitPercent) > 100
    || Number(artifact.integrationPercent) < 0 || Number(artifact.integrationPercent) > 100
    || Math.round(Number(artifact.currentUnitPercent) + Number(artifact.integrationPercent)) !== 100
    || !Array.isArray(artifact.questions) || !artifact.questions.length) return null
  const closed = new Set(closedChunkIds)
  const expectedSet = expectedStandardIds?.length ? new Set(expectedStandardIds) : undefined
  const questions = artifact.questions
  const ids = questions.map((question) => question && typeof question === 'object' ? String((question as { id?: unknown }).id ?? '') : '')
  const prompts = questions.map((question) => question && typeof question === 'object' ? String((question as { prompt?: unknown }).prompt ?? '') : '')
  if (!unique(ids) || !unique(prompts) || !questions.every((question) => validQuestion(question, closed, privateAssessmentPhrases, expectedSet))) return null
  if (expectedSet) {
    const covered = new Set(questions.flatMap((question) => {
      const item = question as UnitQuestion
      return [item.primaryStandardId, ...(item.secondaryStandardIds ?? [])]
    }))
    if ([...expectedSet].some((id) => !covered.has(id))) return null
  }
  const current = questions.filter((question) => (question as UnitQuestion).scope === 'current-unit').length / questions.length * 100
  const expectedPercent = Number(artifact.currentUnitPercent)
  // Small banks cannot hit an exact percentage. A two-question bank may be
  // 50/50; at normal sizes the declared mix is kept within a 20-point band.
  if (artifact.courseStyle === 'biology' && Math.abs(current - expectedPercent) > Math.max(20, 100 / questions.length)) return null
  if (artifact.courseStyle === 'biology' && Number(artifact.integrationPercent) > 0 && !questions.some((question) => (question as UnitQuestion).scope === 'prior-unit-integration')) return null
  return artifact as UnitQuestionBankArtifact
}

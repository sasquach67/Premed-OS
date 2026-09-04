import type { UnitMasteryOutlineArtifact, MasteryStandard } from '@/lib/generation/artifacts/unitMasteryOutline.v1'
import type { CourseQuestionStyle, QuestionMove, QuestionStimulus, UnitQuestion, UnitQuestionBankArtifact } from '@/lib/generation/artifacts/unitQuestionBank.v1'

export interface CourseQuestionBlueprint {
  courseStyle: CourseQuestionStyle
  defaultCurrentUnitPercent: number
  defaultIntegrationPercent: number
  moves: QuestionMove[]
  instruction: string
}

export const BIOLOGY_QUESTION_BLUEPRINT: CourseQuestionBlueprint = {
  courseStyle: 'biology', defaultCurrentUnitPercent: 70, defaultIntegrationPercent: 30,
  moves: ['application', 'integration', 'method-and-controls', 'interpretation'],
  instruction: 'Build linked stimulus sets around biological scenarios, experiments, data, or diagrams. Every question must require application; at least half must depend on a visual or quantitative representation. Progress across interpretation, comparison or calculation, prediction, justification, and experimental design.',
}
export const PSYCHOLOGY_QUESTION_BLUEPRINT: CourseQuestionBlueprint = {
  courseStyle: 'psychology', defaultCurrentUnitPercent: 100, defaultIntegrationPercent: 0,
  moves: ['situational', 'application', 'interpretation'],
  instruction: 'Use evidence-rich situations and careful concept application. Every question must depend on its scenario; keep the answer tied to the supplied course language and do not turn a vignette into generic advice.',
}
export const GENERAL_QUESTION_BLUEPRINT: CourseQuestionBlueprint = {
  courseStyle: 'general', defaultCurrentUnitPercent: 100, defaultIntegrationPercent: 0,
  moves: ['application', 'interpretation'],
  instruction: 'Use source-grounded passages, examples, or representations that require interpretation and application. Direct recall belongs in flashcards, not the question bank.',
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

function validStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(text)
}

const FREE_RECALL_ACTION = /\b(explain|reconstruct|draw|trace|compare|predict|describe|organize|outline|design|interpret|derive|label|map)\b/i
const GENERIC_FREE_RECALL = /\b(?:this|the)\s+(?:topic|objective|concept)\b/i

function validFreeRecallCues(value: unknown): value is string[] {
  return validStringList(value)
    && value.length >= 1
    && value.length <= 3
    && value.some((cue) => /\bwithout notes\b/i.test(cue))
    && value.every((cue) => clean(cue).split(' ').length >= 5
      && FREE_RECALL_ACTION.test(cue)
      && !GENERIC_FREE_RECALL.test(cue))
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
  const seenApplications = new Set<string>()
  const seenRecallCues = new Set<string>()
  for (const raw of artifact.standards) {
    if (!raw || typeof raw !== 'object') return null
    const standard = raw as Partial<MasteryStandard>
    if (!text(standard.id) || !text(standard.title) || seen.has(standard.id)) return null
    if (!validFreeRecallCues(standard.freeRecallCues) || !validStringList(standard.understand) || !validStringList(standard.beAbleToDo) || !validStringList(standard.watchFor)) return null
    if (standard.understand.length < 5 || standard.beAbleToDo.length < 2 || standard.watchFor.length < 1) return null
    if (!unique(standard.freeRecallCues) || !unique(standard.understand) || !unique(standard.beAbleToDo) || !unique(standard.watchFor)) return null
    for (const cue of standard.freeRecallCues) {
      const normalized = clean(cue)
      if (seenRecallCues.has(normalized)) return null
      seenRecallCues.add(normalized)
    }
    for (const application of standard.beAbleToDo) {
      const normalized = clean(application)
      if (seenApplications.has(normalized)) return null
      seenApplications.add(normalized)
    }
    if (!allClosed(standard.sourceChunkIds, closed) || !unique(standard.sourceChunkIds!)) return null
    seen.add(standard.id)
  }
  return artifact as UnitMasteryOutlineArtifact
}

function numericValues(value: string) {
  return (value.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number).filter(Number.isFinite)
}

function validStimulus(raw: unknown, closed: ReadonlySet<string>, sourceContent?: ReadonlyMap<string, string>): raw is QuestionStimulus {
  if (!raw || typeof raw !== 'object') return false
  const stimulus = raw as Partial<QuestionStimulus>
  if (!text(stimulus.id) || !text(stimulus.title) || !text(stimulus.context) || !text(stimulus.caption) || !text(stimulus.altText)
    || !['passage', 'data-table', 'line-graph', 'bar-graph', 'diagram'].includes(stimulus.kind as string)
    || !['source-derived', 'generated-schematic', 'simulated-data'].includes(stimulus.basis as string)
    || !allClosed(stimulus.sourceChunkIds, closed)) return false
  if (clean(stimulus.altText).split(' ').length < 5) return false
  if (stimulus.basis === 'generated-schematic' && stimulus.kind !== 'diagram') return false
  if (stimulus.basis === 'simulated-data') {
    if (!['data-table', 'line-graph', 'bar-graph'].includes(stimulus.kind as string)) return false
    if (!/\b(simulated|hypothetical)\b/i.test(stimulus.caption)) return false
  }
  if (stimulus.kind === 'data-table') {
    if (!stimulus.table || !validStringList(stimulus.table.columns) || stimulus.table.columns.length < 2
      || !Array.isArray(stimulus.table.rows) || stimulus.table.rows.length < 2
      || stimulus.table.rows.some((row) => !validStringList(row) || row.length !== stimulus.table!.columns.length)) return false
  }
  if (stimulus.kind === 'line-graph' || stimulus.kind === 'bar-graph') {
    if (!stimulus.graph || !text(stimulus.graph.xLabel) || !text(stimulus.graph.yLabel)
      || !Array.isArray(stimulus.graph.series) || !stimulus.graph.series.length) return false
    for (const series of stimulus.graph.series) {
      if (!text(series?.label) || !Array.isArray(series.points) || series.points.length < 2
        || series.points.some((point) => !text(point?.x) || !Number.isFinite(point?.y))) return false
    }
  }
  if (stimulus.basis === 'source-derived' && sourceContent && (stimulus.kind === 'data-table' || stimulus.kind === 'line-graph' || stimulus.kind === 'bar-graph')) {
    const sourceNumbers = new Set(stimulus.sourceChunkIds!.flatMap((id) => numericValues(sourceContent.get(id) ?? '')))
    const stimulusNumbers = stimulus.kind === 'data-table'
      ? numericValues(stimulus.table!.rows.flat().join(' '))
      : stimulus.graph!.series.flatMap((series) => series.points.map((point) => point.y))
    if (stimulusNumbers.some((value) => !sourceNumbers.has(value))) return false
  }
  if (stimulus.kind === 'diagram') {
    if (!stimulus.diagram || !Array.isArray(stimulus.diagram.nodes) || stimulus.diagram.nodes.length < 2
      || !Array.isArray(stimulus.diagram.edges) || !stimulus.diagram.edges.length) return false
    const nodeIds = stimulus.diagram.nodes.map((node) => node?.id ?? '')
    if (!nodeIds.every(text) || !unique(nodeIds) || stimulus.diagram.nodes.some((node) => !text(node.label)
      || !Number.isFinite(node.x) || !Number.isFinite(node.y) || node.x < 0 || node.x > 100 || node.y < 0 || node.y > 100
      || (node.shape != null && !['box', 'circle'].includes(node.shape)))) return false
    const nodeSet = new Set(nodeIds)
    if (stimulus.diagram.edges.some((edge) => !text(edge?.from) || !text(edge?.to) || edge.from === edge.to
      || !nodeSet.has(edge.from) || !nodeSet.has(edge.to) || (edge.label != null && !text(edge.label)))) return false
  }
  return true
}

function validQuestion(raw: unknown, closed: ReadonlySet<string>, stimulusIds: ReadonlySet<string>, privatePhrases: readonly string[], expectedStandardIds?: ReadonlySet<string>): raw is UnitQuestion {
  if (!raw || typeof raw !== 'object') return false
  const question = raw as Partial<UnitQuestion>
  if (!text(question.id) || !text(question.prompt) || !hasActionablePrompt(question.prompt) || !text(question.answer) || !text(question.rationale)
    || !text(question.unit) || !text(question.primaryStandardId) || !allClosed(question.sourceChunkIds, closed)
    || (question.scope !== 'current-unit' && question.scope !== 'prior-unit-integration')
    || !['application', 'integration', 'situational', 'interpretation', 'method-and-controls'].includes(question.move as string)
    || !['foundational', 'standard', 'challenging'].includes(question.difficulty as string)) return false
  if (!Array.isArray(question.stimulusIds) || !question.stimulusIds.length || !question.stimulusIds.every((id) => text(id) && stimulusIds.has(id)) || !unique(question.stimulusIds)) return false
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
  sourceContents?: ReadonlyMap<string, string>,
): UnitQuestionBankArtifact | null {
  if (!value || typeof value !== 'object') return null
  const artifact = value as Partial<UnitQuestionBankArtifact>
  if (!text(artifact.title) || !text(artifact.unit)
    || !['biology', 'psychology', 'general'].includes(artifact.courseStyle as string)
    || !Number.isFinite(artifact.currentUnitPercent) || !Number.isFinite(artifact.integrationPercent)
    || Number(artifact.currentUnitPercent) < 0 || Number(artifact.currentUnitPercent) > 100
    || Number(artifact.integrationPercent) < 0 || Number(artifact.integrationPercent) > 100
    || Math.round(Number(artifact.currentUnitPercent) + Number(artifact.integrationPercent)) !== 100
    || !Array.isArray(artifact.stimuli) || !artifact.stimuli.length
    || !Array.isArray(artifact.questions) || !artifact.questions.length) return null
  const closed = new Set(closedChunkIds)
  const stimulusIds = artifact.stimuli.map((stimulus) => stimulus && typeof stimulus === 'object' ? String((stimulus as { id?: unknown }).id ?? '') : '')
  if (!unique(stimulusIds) || !artifact.stimuli.every((stimulus) => validStimulus(stimulus, closed, sourceContents))) return null
  const stimulusIdSet = new Set(stimulusIds)
  const expectedSet = expectedStandardIds?.length ? new Set(expectedStandardIds) : undefined
  const questions = artifact.questions
  const ids = questions.map((question) => question && typeof question === 'object' ? String((question as { id?: unknown }).id ?? '') : '')
  const prompts = questions.map((question) => question && typeof question === 'object' ? String((question as { prompt?: unknown }).prompt ?? '') : '')
  if (!unique(ids) || !unique(prompts) || !questions.every((question) => validQuestion(question, closed, stimulusIdSet, privateAssessmentPhrases, expectedSet))) return null
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
  if (artifact.courseStyle === 'biology') {
    const visualIds = new Set(artifact.stimuli.filter((stimulus) => stimulus.kind !== 'passage').map((stimulus) => stimulus.id))
    const visualQuestions = questions.filter((question) => (question as UnitQuestion).stimulusIds.some((id) => visualIds.has(id))).length
    if (visualQuestions < Math.ceil(questions.length / 2)) return null
  }
  if (questions.length >= 4) {
    const uses = new Map<string, number>()
    questions.forEach((question) => (question as UnitQuestion).stimulusIds.forEach((id) => uses.set(id, (uses.get(id) ?? 0) + 1)))
    if (![...uses.values()].some((count) => count >= 2)) return null
  }
  return artifact as UnitQuestionBankArtifact
}

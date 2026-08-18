/**
 * Study method · UNPATCHED 2026 — §4.1-K.
 *
 * The nine-step cycle of §6.6, rendered as three placements. This module owns
 * only the derivation; the components draw it.
 *
 * ⚠️ The surface outruns its engine. Four of the nine steps — pretest, predict,
 * connect, mock — are specced (§6.6, marked ✗ new) and NOT BUILT. Steps without
 * an engine can never be marked done, and groups whose action has no engine are
 * not offered at all. Advertising a study step the app cannot perform, on the
 * surface whose job is "what do I do right now?", would be worse than omitting
 * it. As each §6.6 feature lands, its step and group turn on here.
 */
import type { ClassWorkspaceType, ReviewEvent, Topic, TopicStatus } from '@/lib/types'

export type CycleStage = 'before' | 'after' | 'retain'
export type CycleStep =
  | 'prime' | 'pretest' | 'predict'
  | 'recall' | 'feynman' | 'connect'
  | 'spaced' | 'practice' | 'mock'

export interface StepDefinition {
  step: CycleStep
  stage: CycleStage
  /** Named on hover. */
  label: string
  /** False where §6.6 marks the step ✗ new. Such a step renders hollow forever. */
  hasEngine: boolean
}

/** Nine steps, three stages of three — the order is the cycle's own. */
export const CYCLE: StepDefinition[] = [
  { step: 'prime', stage: 'before', label: 'Prime — skim before the lecture', hasEngine: true },
  { step: 'pretest', stage: 'before', label: 'Pretest — guess before you’re taught', hasEngine: false },
  { step: 'predict', stage: 'before', label: 'Predict — what will this lecture cover?', hasEngine: false },
  { step: 'recall', stage: 'after', label: 'Recall — retrieve it without looking', hasEngine: true },
  { step: 'feynman', stage: 'after', label: 'Feynman — explain it plainly', hasEngine: true },
  { step: 'connect', stage: 'after', label: 'Connect — link it to what you know', hasEngine: false },
  { step: 'spaced', stage: 'retain', label: 'Spaced — review just before you’d forget', hasEngine: true },
  { step: 'practice', stage: 'retain', label: 'Practice — work problems on it', hasEngine: true },
  { step: 'mock', stage: 'retain', label: 'Mock — test it under exam conditions', hasEngine: false },
]

export const STAGE_LABEL: Record<CycleStage, string> = { before: 'before', after: 'after', retain: 'retain' }

const COVERED_STATUSES: TopicStatus[] = ['seen', 'notes-made']
const SEVEN_DAYS = 7 * 86_400_000

/**
 * Which of the nine steps this topic has actually done.
 *
 * A step with no engine is NEVER returned, whatever the topic's state — the
 * app has no way to record it, so claiming it would be an invented signal.
 */
export function completedSteps(topic: Topic, events: ReviewEvent[]): Set<CycleStep> {
  const done = new Set<CycleStep>()
  const reviews = events.filter((event) => event.topicId === topic.id)
  if (topic.sourceNoteIds.length > 0 || (topic.linkedNoteIds?.length ?? 0) > 0) done.add('prime')
  if (reviews.length > 0 || topic.fsrs.reps > 0) { done.add('recall'); done.add('feynman') }
  if (topic.fsrs.reps > 1) done.add('spaced')
  if (reviews.length > 2) done.add('practice')
  for (const step of done) if (!CYCLE.find((entry) => entry.step === step)?.hasEngine) done.delete(step)
  return done
}

export type GroupId = 'just-covered' | 'due-to-review'

export interface StudyGroup {
  id: GroupId
  title: string
  action: string
  topics: Topic[]
}

/**
 * The groups the panel may offer TODAY.
 *
 * Deliberately two, not five. `before-class`, `needs-connecting` and
 * `exam-ready` are omitted because Pretest/Predict, TopicLink and Full mock do
 * not exist. They are added here when their engines land — no rework in the
 * component, which renders whatever this returns.
 */
export function studyGroups(topics: Topic[], events: ReviewEvent[], now = Date.now()): StudyGroup[] {
  const reviewedSince = (topic: Topic, at: number) =>
    events.some((event) => event.topicId === topic.id && event.timestamp >= at)

  const justCovered = topics.filter((topic) => {
    if (!COVERED_STATUSES.includes(topic.status)) return false
    const at = topic.updatedAt ?? topic.createdAt ?? 0
    if (!at || now - at > SEVEN_DAYS) return false
    return !reviewedSince(topic, at)
  })

  // Mutually exclusive with the above: a topic freshly covered and never
  // recalled belongs in "just covered", not in the review queue.
  const dueToReview = topics.filter((topic) =>
    topic.fsrs.reps > 0 && topic.fsrs.due <= now && !justCovered.includes(topic))

  return [
    { id: 'just-covered' as const, title: 'Just covered', action: 'Recall it', topics: justCovered },
    { id: 'due-to-review' as const, title: 'Due to review', action: 'Start review', topics: dueToReview },
  ].filter((group) => group.topics.length > 0)
}

/**
 * §4.1-K: when every group is empty the panel is not rendered at all — the
 * absence is the congratulation, never an "all caught up" placeholder.
 *
 * §4.1-N: General classes have no third study tab and therefore no panel —
 * not a disabled one. Both rules live here so neither can drift into a
 * component and be forgotten.
 */
export function panelShouldRender(groups: StudyGroup[], classType?: ClassWorkspaceType): boolean {
  if (classType === 'general') return false
  return groups.length > 0
}

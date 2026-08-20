/**
 * Study method · UNPATCHED 2026 — §4.1-K.
 *
 * The nine-step cycle of §6.6, rendered as three placements. This module owns
 * only the derivation; the components draw it.
 *
 * ⚠️ One of the nine steps — **Full mock** — is specced (§6.6, marked ✗ new)
 * and NOT BUILT; it needs a generated exam. Connect, Predict and Pretest all
 * landed Aug 19 2026, so the before-class group is now offered too. Steps without
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
  // Engine landed Aug 19 2026: the class's own KeyPoints are the questions.
  { step: 'pretest', stage: 'before', label: 'Pretest — guess before you’re taught', hasEngine: true },
  // Engine landed Aug 19 2026 with `TopicPrediction`.
  { step: 'predict', stage: 'before', label: 'Predict — what will this lecture cover?', hasEngine: true },
  { step: 'recall', stage: 'after', label: 'Recall — retrieve it without looking', hasEngine: true },
  { step: 'feynman', stage: 'after', label: 'Feynman — explain it plainly', hasEngine: true },
  // Engine landed Aug 19 2026 with `TopicLink` (§6.6 Connect).
  { step: 'connect', stage: 'after', label: 'Connect — link it to what you know', hasEngine: true },
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
export function completedSteps(
  topic: Topic,
  events: ReviewEvent[],
  /** §6.6 Connect. Absent means the caller has no graph — the step stays
   *  hollow rather than being claimed done on no evidence. */
  linkedTopicIds?: ReadonlySet<string>,
  /** §6.6 Predict — topics with a recorded expectation. */
  predictedTopicIds?: ReadonlySet<string>,
): Set<CycleStep> {
  const done = new Set<CycleStep>()
  const reviews = events.filter((event) => event.topicId === topic.id)
  if (topic.sourceNoteIds.length > 0 || (topic.linkedNoteIds?.length ?? 0) > 0) done.add('prime')
  if (reviews.length > 0 || topic.fsrs.reps > 0) { done.add('recall'); done.add('feynman') }
  if (topic.fsrs.reps > 1) done.add('spaced')
  if (reviews.length > 2) done.add('practice')
  if (linkedTopicIds?.has(topic.id)) done.add('connect')
  if (topic.pretestedAt != null) done.add('pretest')
  if (predictedTopicIds?.has(topic.id)) done.add('predict')
  for (const step of done) if (!CYCLE.find((entry) => entry.step === step)?.hasEngine) done.delete(step)
  return done
}

export type GroupId = 'before-class' | 'just-covered' | 'needs-connecting' | 'due-to-review'

export interface StudyGroup {
  id: GroupId
  title: string
  action: string
  topics: Topic[]
}

/**
 * The groups the panel may offer TODAY.
 *
 * Four, not five. Only `exam-ready` is still omitted, because Full mock has no
 * engine. `needs-connecting` turned on with `TopicLink`, and `before-class`
 * with Pretest and Predict. They are added here when their engines land — no rework in the
 * component, which renders whatever this returns.
 */
export function studyGroups(
  topics: Topic[],
  events: ReviewEvent[],
  now = Date.now(),
  /** §6.6 Connect. Absent means the caller has no graph yet, and the
   *  needs-connecting group stays off rather than claiming everything is
   *  unconnected. */
  linkedTopicIds?: ReadonlySet<string>,
  /** Topics with material behind them. Priming a topic the class has published
   *  nothing for is an instruction with no object, so before-class is offered
   *  only where there is something to prime from. */
  primableTopicIds?: ReadonlySet<string>,
): StudyGroup[] {
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

  // §6.6 before-class: an uncovered topic that has not been primed yet. Offered
  // now that Prime, Pretest and Predict all have engines.
  const beforeClass = primableTopicIds
    ? topics.filter((topic) =>
      !COVERED_STATUSES.includes(topic.status)
      && topic.status !== 'ready'
      && topic.status !== 'reviewing'
      && topic.pretestedAt == null
      && topic.fsrs.reps === 0
      && primableTopicIds.has(topic.id))
    : []

  // §6.6: recalled, but no TopicLink. Only offered once a graph exists —
  // without one, every topic would look unconnected and the group would be a
  // false accusation rather than a prompt.
  const needsConnecting = linkedTopicIds
    ? topics.filter((topic) =>
      topic.fsrs.reps > 0
      && !linkedTopicIds.has(topic.id)
      && !justCovered.includes(topic))
    : []

  return [
    { id: 'before-class' as const, title: 'Before class', action: 'Prime it', topics: beforeClass },
    { id: 'just-covered' as const, title: 'Just covered', action: 'Recall it', topics: justCovered },
    { id: 'needs-connecting' as const, title: 'Needs connecting', action: 'Connect it', topics: needsConnecting },
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

/**
 * Learning signals — the class-page surface (§4.1).
 *
 * A STEM class Overview panel answering one question: is there a specific part
 * of how I am learning THIS class that needs a different next move? At most
 * three rows, each cause → consequence → exactly one route to an owner that
 * already exists. This module owns the derivation and every discipline rule;
 * `LearningSignalsPanel` only draws what it returns.
 *
 * ⚠️ Two rules that must never move into the component:
 *   1. A signal is DORMANT until the record it reads exists. Nothing here is
 *      simulated, defaulted, or approximated — a missing input means no row,
 *      never a zero, an empty chart, or a "you may be behind" warning (U-5).
 *   2. Nothing computes a score, composite, rank, or readiness figure (U-9).
 *      Ordering below is a fixed list, not a ranking.
 *
 * ⚠️ It must also not restate `studyMethod.ts`. `just-covered` already says
 * "covered, not yet recalled" and `due-to-review` already says "FSRS says due";
 * a signal repeating either is a duplicate surface, not a signal.
 *
 * Most of §4.1's catalogue is deliberately absent because its input records do
 * not exist yet — `TopicLink` (#22, #39), prerequisite links (#21, #64),
 * material instrumentation (#26, #30), the lab schedule (#36), and the session
 * timer (#16, #25). Each turns on here when its entity lands; no component
 * changes when it does.
 */
import { fmtDate } from '@/lib/date'
import { isolatedTopics, linksForTopic, otherEnd } from '@/lib/academics/topicGraph'
import { examDayReading } from '@/lib/academics/forgettingCurve'
import type { ClassAssignment, ClassWorkspaceType, ReviewEvent, Topic, TopicLink } from '@/lib/types'

/**
 * What KIND of thing the row is — never a severity, never a rank. `proposal`
 * exists for the cross-class `TopicLink` row, which stays dormant until that
 * entity exists; no code path constructs one today.
 */
export type SignalKind = 'routine' | 'timing' | 'proposal'

export type SignalType =
  | 'assignment-topic-link' | 'post-exam-decay' | 'topic-difficulty-outlier'
  | 'concept-map-gap' | 'prerequisite-decay'

export interface LearningSignal {
  id: string
  type: SignalType
  kind: SignalKind
  /** The cause, in one line. */
  title: string
  /** The consequence — why the cause is worth a different next move. */
  cause: string
  actionLabel: string
  /**
   * The owner that resolves this signal — a route to another page, or a tab on
   * the class hub the student is already looking at. The panel never repairs
   * anything inline, so every signal has exactly one of these and no more.
   */
  action: { type: 'route'; to: string } | { type: 'tab'; tab: string }
  /** The record the signal read, named structurally. */
  evidenceLabel: string
  evidenceDetail: string
}

export interface LearningSignalInput {
  courseId: string
  topics: Topic[]
  events: ReviewEvent[]
  assignments: ClassAssignment[]
  /** §6.6 Connect. Absent means no graph yet — see `conceptMapGap`. */
  topicLinks?: TopicLink[]
  /** Every topic the student has, across courses — #21 reads backwards out of
   *  this class into the ones that came before it. */
  allTopics?: Topic[]
}

/** §4.1: "Show at most three items at once." */
export const MAX_SIGNALS = 3

const DAY = 86_400_000
/** An assignment is near enough to change this week's work, not a whole term of them. */
const LINKAGE_WINDOW_DAYS = 14
/** §4.1 #41 measures decay two weeks after the exam. */
const POST_EXAM_DAYS = 14
const DONE: ClassAssignment['status'][] = ['submitted', 'graded', 'dropped']

const dueAt = (item: ClassAssignment) => (item.dueDate ? new Date(item.dueDate).getTime() : undefined)
const titleList = (items: Topic[]) => items.map((item) => item.title).join(', ')

/**
 * #37 — a dated assignment arrives before the topics it names have had any
 * practice. Evidence is the assignment's own linked-topic record; the action
 * opens the assignment rather than scheduling anything on the student's behalf.
 */
function assignmentTopicLink(input: LearningSignalInput, now: number): LearningSignal | undefined {
  const byId = new Map(input.topics.map((topic) => [topic.id, topic]))
  const upcoming = input.assignments
    .filter((item) => !DONE.includes(item.status) && item.linkedTopicIds.length > 0)
    .map((item) => ({ item, at: dueAt(item) }))
    .filter((entry): entry is { item: ClassAssignment; at: number } => entry.at != null
      && entry.at >= now && entry.at - now <= LINKAGE_WINDOW_DAYS * DAY)
    .sort((a, b) => a.at - b.at)

  for (const { item } of upcoming) {
    const unpractised = item.linkedTopicIds
      .map((id) => byId.get(id))
      .filter((topic): topic is Topic => topic != null && topic.fsrs.reps === 0)
    if (!unpractised.length) continue
    return {
      id: `assignment-topic-link:${item.id}`,
      type: 'assignment-topic-link',
      kind: 'timing',
      title: `${item.title} arrives before its linked topics.`,
      cause: `It names ${titleList(unpractised)}, with no recorded practice yet.`,
      actionLabel: 'Open linked assignment',
      action: { type: 'tab', tab: 'assignments' },
      evidenceLabel: 'Assignment record',
      evidenceDetail: `${item.title} lists ${item.linkedTopicIds.length} linked ${item.linkedTopicIds.length === 1 ? 'topic' : 'topics'}.`,
    }
  }
  return undefined
}

/**
 * #41 — two weeks after an exam, was the tested material retrieved again? The
 * question is whether it was learned or rented; it matters because this content
 * returns on the MCAT. Dormant until an exam has both a past date and a scope.
 */
function postExamDecay(input: LearningSignalInput, now: number): LearningSignal | undefined {
  const byId = new Map(input.topics.map((topic) => [topic.id, topic]))
  const past = input.assignments
    .filter((item) => item.type === 'exam' && (item.coveredTopicIds?.length ?? 0) > 0)
    .map((item) => ({ item, at: dueAt(item) }))
    .filter((entry): entry is { item: ClassAssignment; at: number } => entry.at != null
      && now - entry.at >= POST_EXAM_DAYS * DAY)
    .sort((a, b) => b.at - a.at)

  for (const { item, at } of past) {
    const covered = (item.coveredTopicIds ?? [])
      .map((id) => byId.get(id))
      .filter((topic): topic is Topic => topic != null)
    if (!covered.length) continue
    const revisited = covered.filter((topic) =>
      input.events.some((event) => event.topicId === topic.id && event.timestamp > at))
    if (revisited.length > 0) continue
    return {
      id: `post-exam-decay:${item.id}`,
      type: 'post-exam-decay',
      kind: 'routine',
      title: `Nothing ${item.title} tested has been retrieved since.`,
      cause: `Its ${covered.length} scoped ${covered.length === 1 ? 'topic has' : 'topics have'} no review recorded after the exam date.`,
      actionLabel: 'Review the tested topics',
      action: { type: 'route', to: `/academics/review/${input.courseId}` },
      evidenceLabel: 'Exam record',
      evidenceDetail: `${item.title}${item.dueDate ? ` on ${fmtDate(item.dueDate, { month: 'short', day: 'numeric' })}` : ''} lists ${covered.length} covered ${covered.length === 1 ? 'topic' : 'topics'}.`,
    }
  }
  return undefined
}

/**
 * #27 — one topic is lapsing in a way none of its neighbours are. Stated as the
 * counts actually recorded; the row deliberately carries no difficulty figure,
 * because a number here would be the readiness score §4.1 forbids.
 */
function topicDifficultyOutlier(input: LearningSignalInput): LearningSignal | undefined {
  const reviewCount = (topic: Topic) =>
    input.events.filter((event) => event.topicId === topic.id).length
  const eligible = input.topics.filter((topic) => reviewCount(topic) >= 3 && topic.fsrs.lapses >= 2)
  if (!eligible.length) return undefined

  const worst = eligible.reduce((a, b) => (b.fsrs.lapses > a.fsrs.lapses ? b : a))
  // "Outlier" means strictly alone at the top. A tie is two topics behaving the
  // same way, which is a pattern for the study cycle, not a signal about one.
  if (input.topics.some((topic) => topic.id !== worst.id && topic.fsrs.lapses >= worst.fsrs.lapses)) return undefined

  return {
    id: `topic-difficulty-outlier:${worst.id}`,
    type: 'topic-difficulty-outlier',
    kind: 'routine',
    title: `${worst.title} keeps slipping back.`,
    cause: `It has lapsed ${worst.fsrs.lapses} times across ${reviewCount(worst)} reviews — more than any other topic in this class.`,
    actionLabel: 'Review this topic',
    action: { type: 'route', to: `/academics/review/${input.courseId}?topicId=${worst.id}` },
    evidenceLabel: 'Review record',
    evidenceDetail: `${reviewCount(worst)} reviews recorded, ${worst.fsrs.lapses} of them lapses.`,
  }
}

/**
 * #39 — topics with no `TopicLink` at all. "Isolated knowledge is fragile; this
 * is the Connect step's own coverage meter."
 *
 * ⚠️ Dormant until the student has authored at least one link. Before that,
 * every topic is isolated and the signal would fire on a class that has simply
 * never used the feature — an accusation, not an observation. It also stays
 * silent while a class is small enough that a graph would be noise.
 */
function conceptMapGap(input: LearningSignalInput): LearningSignal | undefined {
  const links = input.topicLinks ?? []
  if (!links.length) return undefined
  const isolated = isolatedTopics(input.topics, links)
  if (isolated.length < 2) return undefined
  return {
    id: `concept-map-gap:${input.courseId}`,
    type: 'concept-map-gap',
    kind: 'routine',
    title: `${isolated.length} topics are not connected to anything yet.`,
    cause: `You have started linking topics in this class, and ${isolated.map((topic) => topic.title).slice(0, 2).join(' and ')}${isolated.length > 2 ? ' among others' : ''} still stand alone.`,
    actionLabel: 'Connect a topic',
    action: { type: 'tab', tab: 'topics' },
    evidenceLabel: 'Topic graph',
    evidenceDetail: `${links.length} ${links.length === 1 ? 'link' : 'links'} recorded, ${isolated.length} topics with none.`,
  }
}

/**
 * #21 — prerequisite decay. The spec calls it "the strongest one here": you are
 * in CHEM 262 while your CHEM 261 topics have quietly rotted, which is exactly
 * why sequence courses go wrong.
 *
 * Only prior topics the student EXPLICITLY marked as prerequisites are read —
 * `TopicLink` with relation `prerequisite`. Inferring the dependency from
 * course numbering would put words in their mouth about what this unit rests
 * on.
 *
 * ⚠️ Reports the band label, never the retrievability figure. C1 rules that
 * the number never ships without its label, and a learning signal carries no
 * numbers at all — so the label alone is the honest half.
 */
function prerequisiteDecay(input: LearningSignalInput, now: number): LearningSignal | undefined {
  const links = input.topicLinks ?? []
  if (!links.length) return undefined
  const everyTopic = input.allTopics ?? input.topics
  const mine = new Set(input.topics.map((topic) => topic.id))

  const decayed: Topic[] = []
  for (const topic of input.topics) {
    for (const link of linksForTopic(links, topic.id)) {
      if (link.relation !== 'prerequisite') continue
      const priorId = otherEnd(link, topic.id)
      if (mine.has(priorId)) continue // same class: not a prerequisite course
      const prior = everyTopic.find((item) => item.id === priorId)
      // No review history means no decay to measure, not decay of zero.
      if (!prior || prior.fsrs.reps === 0) continue
      const reading = examDayReading(prior.fsrs, now)
      if (reading.band === 'should-hold') continue
      if (!decayed.some((item) => item.id === prior.id)) decayed.push(prior)
    }
  }
  if (!decayed.length) return undefined

  const worst = examDayReading(decayed[0].fsrs, now)
  return {
    id: `prerequisite-decay:${decayed[0].id}`,
    type: 'prerequisite-decay',
    kind: 'routine',
    title: `${decayed.map((topic) => topic.title).slice(0, 2).join(' and ')} ${decayed.length === 1 ? 'is' : 'are'} fading underneath this class.`,
    cause: `You marked ${decayed.length === 1 ? 'it' : 'them'} as a prerequisite for work you are doing now, and the reading is "${worst.label.toLowerCase()}"${worst.clause ? ` — ${worst.clause}` : ''}.`,
    actionLabel: 'Review the prerequisite',
    action: { type: 'route', to: `/academics/review/${decayed[0].courseId}?topicId=${decayed[0].id}` },
    evidenceLabel: 'Prerequisite link',
    evidenceDetail: `You linked ${decayed.length === 1 ? 'this topic' : 'these topics'} as a prerequisite from this class.`,
  }
}

/**
 * The signals this class has earned, in a FIXED order — timing first because it
 * is the only one with a deadline attached, then the two routine kinds in
 * catalogue order. This is not a ranking and nothing is scored.
 */
export function learningSignals(input: LearningSignalInput, now = Date.now()): LearningSignal[] {
  return [
    assignmentTopicLink(input, now),
    postExamDecay(input, now),
    prerequisiteDecay(input, now),
    topicDifficultyOutlier(input),
    conceptMapGap(input),
  ].filter((signal): signal is LearningSignal => signal != null).slice(0, MAX_SIGNALS)
}

/**
 * §4.1: the panel is STEM-only — Writing has its own draft/readings/feedback
 * layer and General renders no pretend study-intelligence panel — and a class
 * with no eligible evidence renders NO panel at all. Both rules live here so
 * neither can drift into a component and be forgotten.
 */
export function signalsShouldRender(signals: LearningSignal[], classType?: ClassWorkspaceType): boolean {
  if (classType !== 'stem') return false
  return signals.length > 0
}

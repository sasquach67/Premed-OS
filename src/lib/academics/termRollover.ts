/**
 * End-of-term rollover (§4.1) — the December handoff.
 *
 * Drawing:   mockup-lab/01-academics/academics-term-rollover.html
 * Decisions: academics-term-rollover.md — a transition map with three fates,
 *            a reversible bulk exit, and exactly one January re-offer.
 *
 * ⚠️ Two invariants this module exists to protect:
 *   1. **Nothing is ever deleted.** `retired` stops a topic being scheduled and
 *      leaves it searchable. There is no code path here that removes a topic, a
 *      review event, or a course.
 *   2. **Carrying preserves study state exactly.** This flow decides where a
 *      topic is offered next, never what it knows — `fsrs` is copied by
 *      reference and never rebuilt, so a carried topic keeps its stability,
 *      due date, reps and lapses byte-for-byte.
 *
 * Every fate is a proposal until confirmed, and every one is reversible after.
 */
import type { Course, Topic, TopicTermFate } from '@/lib/types'

export interface RolloverState {
  courses: Course[]
  topics: Topic[]
}

/**
 * Completed courses still owed a transition — excluding any dismissed for the
 * term being asked about. One re-offer per term, then silence.
 */
export function pendingRollovers(courses: Course[], currentTerm?: string): Course[] {
  return courses.filter((course) =>
    course.status === 'completed'
    && course.rolloverAt == null
    && !(currentTerm != null && course.rolloverDismissedTerm === currentTerm))
}

export interface FateProposal {
  topicId: string
  fate: TopicTermFate
  /** Why this default was proposed — shown so the student can disagree. */
  reason: string
}

/**
 * The pre-sorted defaults. Proposals only: nothing is applied until confirmed.
 *
 * A topic that supports a planned course is a prerequisite; a topic the student
 * actually built retention in is worth carrying to the MCAT; everything else
 * retires. Retiring is the honest default, not a judgement.
 */
export function defaultFate(topic: Topic, plannedCourses: Course[]): FateProposal {
  const supports = plannedCourses.find((course) => {
    const needle = `${course.title} ${course.code} ${course.prereqOf ?? ''}`.toLowerCase()
    const words = `${topic.title} ${topic.unit ?? ''}`.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 4)
    return words.some((word) => needle.includes(word))
  })
  if (supports) {
    return { topicId: topic.id, fate: 'prerequisite', reason: `Supports ${supports.code}` }
  }
  if (topic.fsrs.reps > 1) {
    return { topicId: topic.id, fate: 'mcat', reason: 'You built retention here' }
  }
  return { topicId: topic.id, fate: 'retired', reason: 'Default' }
}

export function defaultFates(topics: Topic[], plannedCourses: Course[]): FateProposal[] {
  return topics.map((topic) => defaultFate(topic, plannedCourses))
}

/**
 * Write the confirmed fates and close the ritual.
 *
 * Deliberately conservative: it maps over the existing arrays, so no topic is
 * removed and no field other than `termFate`/`updatedAt` is written. `fsrs` is
 * carried across untouched.
 */
export function applyFates(
  state: RolloverState,
  { courseId, fates, now = Date.now() }: { courseId: string; fates: FateProposal[]; now?: number },
): RolloverState {
  const byTopic = new Map(fates.map((fate) => [fate.topicId, fate.fate]))
  const topics = state.topics.map((topic) => {
    const fate = byTopic.get(topic.id)
    if (!fate || topic.courseId !== courseId) return topic
    return { ...topic, termFate: fate, updatedAt: now }
  })
  const courses = state.courses.map((course) =>
    course.id === courseId ? { ...course, rolloverAt: now } : course)
  return { courses, topics }
}

/** The reversible bulk exit: everything retires, nothing is lost. */
export function pauseEverything(state: RolloverState, courseId: string, now = Date.now()): RolloverState {
  const fates = state.topics
    .filter((topic) => topic.courseId === courseId)
    .map((topic): FateProposal => ({ topicId: topic.id, fate: 'retired', reason: 'Paused' }))
  return applyFates(state, { courseId, fates, now })
}

/** One quiet re-offer per term. Dismissing is for this term only. */
export function dismissUntilNextTerm(state: RolloverState, courseId: string, term: string): RolloverState {
  return {
    ...state,
    courses: state.courses.map((course) =>
      course.id === courseId ? { ...course, rolloverDismissedTerm: term } : course),
  }
}

/** A retired topic is out of the scheduling queue — and still findable. */
export function isScheduled(topic: Topic): boolean {
  return topic.termFate !== 'retired'
}

export const FATE_LABEL: Record<TopicTermFate, string> = {
  retired: 'Retire',
  mcat: 'Carry for MCAT',
  prerequisite: 'Carry as prerequisite',
}

export const FATE_DETAIL: Record<TopicTermFate, string> = {
  retired: 'Stops scheduling; remains searchable.',
  mcat: 'Transfers with its study state.',
  prerequisite: 'Appears only when a planned course needs it.',
}

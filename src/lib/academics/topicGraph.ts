/**
 * The topic graph — §6.6 Connect.
 *
 * Spec: `01-academics.md` line 55 and §6.6. "This is the largest missing piece
 * — every current feature treats topics as independent islands."
 *
 * ⚠️ **Nothing here writes a link on its own.** `connectCandidates` suggests;
 * the student authors. §6.6 rules propose-then-confirm, and #22 spells out the
 * cost of getting it wrong: a bad automatic merge "corrupts two classes' review
 * schedules at once".
 *
 * ⚠️ A link is stored with a direction but read in both. `from`/`to` records
 * who authored it from where; it does not mean the relation only runs one way.
 */
import { courseSections } from '@/lib/academics/mcatTiming'
import { uid } from '@/lib/id'
import type { Course, Topic, TopicLink, TopicLinkRelation } from '@/lib/types'

export const TOPIC_LINK_RELATIONS: TopicLinkRelation[] = [
  'builds-on', 'contrasts-with', 'same-mechanism', 'prerequisite', 'shared-mcat-category',
]

export const RELATION_LABEL: Record<TopicLinkRelation, string> = {
  'builds-on': 'Builds on',
  'contrasts-with': 'Contrasts with',
  'same-mechanism': 'Same mechanism',
  prerequisite: 'Prerequisite',
  'shared-mcat-category': 'Shared MCAT category',
}

/** Both directions — a link authored from either topic is a link on both. */
export function linksForTopic(links: TopicLink[], topicId: string): TopicLink[] {
  return links.filter((link) => link.fromTopicId === topicId || link.toTopicId === topicId)
}

export function otherEnd(link: TopicLink, topicId: string): string {
  return link.fromTopicId === topicId ? link.toTopicId : link.fromTopicId
}

export function areLinked(links: TopicLink[], a: string, b: string): boolean {
  return links.some((link) =>
    (link.fromTopicId === a && link.toTopicId === b)
    || (link.fromTopicId === b && link.toTopicId === a))
}

/**
 * Author a link. Refuses a self-link, and refuses a duplicate **in either
 * direction** — the same relation recorded twice would double-count in every
 * consumer that reads the graph.
 */
export function linkTopics(
  links: TopicLink[],
  { fromTopicId, toTopicId, relation, note, now = Date.now() }: {
    fromTopicId: string
    toTopicId: string
    relation: TopicLinkRelation
    note?: string
    now?: number
  },
): TopicLink[] {
  if (fromTopicId === toTopicId) return links
  if (areLinked(links, fromTopicId, toTopicId)) return links
  return [...links, {
    id: uid(),
    fromTopicId,
    toTopicId,
    relation,
    note,
    createdAt: now,
    updatedAt: now,
    order: links.length,
  }]
}

/** Removes one statement. It never deletes a topic and never touches FSRS. */
export function unlinkTopics(links: TopicLink[], linkId: string): TopicLink[] {
  return links.filter((link) => link.id !== linkId)
}

export interface ConnectCandidate {
  topic: Topic
  /** Why it is being suggested — shown, so the student can disagree. */
  reason: string
}

/**
 * §6.6's suggestion set, in the spec's own order: topics in the same course,
 * then in a prerequisite course, then sharing an **MCAT content category**.
 *
 * Suggesting writes nothing. Already-linked topics and the topic itself are
 * excluded so the list only ever contains an act the student can still take.
 */
export function connectCandidates(
  topic: Topic,
  topics: Topic[],
  courses: Course[],
  links: TopicLink[],
): ConnectCandidate[] {
  const available = topics.filter((other) =>
    other.id !== topic.id && !areLinked(links, topic.id, other.id))

  const ownCourse = courses.find((course) => course.id === topic.courseId)
  const sameCourse = available.filter((other) => other.courseId === topic.courseId)

  const prereqCourseIds = new Set(
    courses
      .filter((course) => (course.prereqOf ?? '').trim() && ownCourse
        && course.prereqOf!.toUpperCase().includes(ownCourse.code.toUpperCase()))
      .map((course) => course.id),
  )
  const prereq = available.filter((other) =>
    other.courseId !== topic.courseId && prereqCourseIds.has(other.courseId))

  const ownSections = ownCourse ? courseSections(ownCourse).map((section) => section.id) : []
  const sharedMcat = ownSections.length
    ? available.filter((other) => {
      if (other.courseId === topic.courseId || prereqCourseIds.has(other.courseId)) return false
      const course = courses.find((item) => item.id === other.courseId)
      if (!course) return false
      return courseSections(course).some((section) => ownSections.includes(section.id))
    })
    : []

  return [
    ...sameCourse.map((other) => ({ topic: other, reason: 'Same course' })),
    ...prereq.map((other) => ({ topic: other, reason: 'Prerequisite course' })),
    ...sharedMcat.map((other) => ({ topic: other, reason: 'Shared MCAT content area' })),
  ]
}

/**
 * #39 — topics with no link at all. "Isolated knowledge is fragile; this is the
 * Connect step's own coverage meter." Returned as a list of topics, never as a
 * percentage: a count of islands is a fact, a connectedness score is not.
 */
export function isolatedTopics(topics: Topic[], links: TopicLink[]): Topic[] {
  return topics.filter((topic) => linksForTopic(links, topic.id).length === 0)
}

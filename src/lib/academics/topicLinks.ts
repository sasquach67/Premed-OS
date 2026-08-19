/**
 * Topic ↔ assignment linking — the writer (§4.1 #37, exam scope).
 *
 * Drawing:   mockup-lab/01-academics/academics-topic-linking.html
 * Decisions: academics-topic-linking.md — **A + C ruled Aug 18 2026**, with a
 *            six-point handoff between the chips and the picker.
 *
 * This module owns every rule; the components draw what it returns.
 *
 * ⚠️ Three things that must never move into a component:
 *   1. **Coverage and scope are two fields.** `linkedTopicIds` is what a piece
 *      of work covers; `coveredTopicIds` is what an exam TESTS. Merging them
 *      would silently widen exam prep and the forgetting curve.
 *   2. **One call writes both directions.** `Topic.linkedAssignmentIds` is a
 *      mirror of coverage, updated in the same operation, so the two sides can
 *      never drift into disagreeing about the same link.
 *   3. **The picker threshold** — below it, the overlay is a heavier path to
 *      the same two chips and is not offered at all.
 *
 * A link is a STUDENT STATEMENT. Nothing here infers one from a title, a unit
 * name, or a similarity score, and nothing writes a link as a side effect of
 * import. A future proposal flow shows its evidence and calls this module only
 * after the student confirms.
 */
import type { ClassAssignment, Topic } from '@/lib/types'

/** `coverage` → `linkedTopicIds` · `scope` → `coveredTopicIds`. Never merged. */
export type LinkField = 'coverage' | 'scope'

export interface LinkState {
  assignments: ClassAssignment[]
  topics: Topic[]
}

/**
 * Above this many topics, linking one at a time through a typeahead is the
 * wrong shape and the picker is offered beside it. At or below it, the picker
 * is not offered — the ruling ties the escape hatch to this number, so it lives
 * here rather than in a component.
 */
export const PICKER_THRESHOLD = 5

export function shouldOfferPicker(topicCount: number): boolean {
  return topicCount > PICKER_THRESHOLD
}

export function linkedIds(assignment: ClassAssignment, field: LinkField): string[] {
  return field === 'scope' ? assignment.coveredTopicIds ?? [] : assignment.linkedTopicIds
}

export function isLinked(assignment: ClassAssignment, field: LinkField, topicId: string): boolean {
  return linkedIds(assignment, field).includes(topicId)
}

/** Order-preserving, duplicate-free. */
const unique = (ids: string[]) => [...new Set(ids)]

/**
 * Write one record's field, and keep the topic mirror in step.
 *
 * **Scope deliberately does not write the mirror.** Being tested by an exam is
 * a property of the exam, not a claim that the topic's own work covers it; the
 * topic side derives its scope chips through `assignmentsForTopic` instead. If
 * scope wrote the mirror, unlinking coverage would silently strip scope too.
 */
export function setLinks(
  state: LinkState,
  { assignmentId, field, topicIds }: { assignmentId: string; field: LinkField; topicIds: string[] },
): LinkState {
  const next = unique(topicIds)
  const assignments = state.assignments.map((assignment) => {
    if (assignment.id !== assignmentId) return assignment
    return field === 'scope'
      ? { ...assignment, coveredTopicIds: next, updatedAt: Date.now() }
      : { ...assignment, linkedTopicIds: next, updatedAt: Date.now() }
  })

  if (field === 'scope') return { assignments, topics: state.topics }

  const topics = state.topics.map((topic) => {
    const mirror = topic.linkedAssignmentIds ?? []
    const shouldHold = next.includes(topic.id)
    const holds = mirror.includes(assignmentId)
    if (shouldHold === holds) return topic
    return {
      ...topic,
      linkedAssignmentIds: shouldHold
        ? unique([...mirror, assignmentId])
        : mirror.filter((id) => id !== assignmentId),
      updatedAt: Date.now(),
    }
  })
  return { assignments, topics }
}

/** Toggle one link from either side. The same call serves the chip `×` and the picker checkbox. */
export function toggleLink(
  state: LinkState,
  { assignmentId, field, topicId }: { assignmentId: string; field: LinkField; topicId: string },
): LinkState {
  const assignment = state.assignments.find((item) => item.id === assignmentId)
  if (!assignment) return state
  const current = linkedIds(assignment, field)
  const next = current.includes(topicId)
    ? current.filter((id) => id !== topicId)
    : [...current, topicId]
  return setLinks(state, { assignmentId, field, topicIds: next })
}

/**
 * What a topic is linked to, from the assignment records — one source of truth,
 * so the topic side can draw a coverage chip and a scope chip without holding
 * two lists of its own.
 */
export function assignmentsForTopic(
  state: LinkState,
  topicId: string,
): Array<{ assignment: ClassAssignment; field: LinkField }> {
  const out: Array<{ assignment: ClassAssignment; field: LinkField }> = []
  for (const assignment of state.assignments) {
    if (assignment.linkedTopicIds.includes(topicId)) out.push({ assignment, field: 'coverage' })
    if ((assignment.coveredTopicIds ?? []).includes(topicId)) out.push({ assignment, field: 'scope' })
  }
  return out
}

export function topicsForAssignment(state: LinkState, assignment: ClassAssignment, field: LinkField): Topic[] {
  const ids = linkedIds(assignment, field)
  return ids.map((id) => state.topics.find((topic) => topic.id === id)).filter((topic): topic is Topic => topic != null)
}

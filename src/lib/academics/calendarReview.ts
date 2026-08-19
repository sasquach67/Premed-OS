/**
 * Calendar review (§4.1 materials extensions) — read-only Canvas context.
 *
 * Drawing:   mockup-lab/01-academics/academics-materials-extensions.html
 * Decisions: academics-materials-extensions.md — "Canvas is read-only calendar
 *            context: no Canvas token, no write action, and no silent
 *            overwrite. A connected course with no items is ordinary."
 *
 * ⚠️ The indirection is the feature. Canvas publishes a personal calendar
 * feed; the student subscribes to it in Google Calendar; Premed OS reads
 * Google. Premed OS never holds a Canvas credential and never calls Canvas.
 *
 * ⚠️ This module PROPOSES. `proposedDateChanges` has no writer behind it, and
 * `applyProposedDate` exists only to be called from an explicit accept. A
 * calendar that disagrees with the student's record is a question, not an
 * instruction — the instructor's record and the student's are both fallible,
 * and only the student knows which is right.
 */
import type { ClassAssignment, NormalizedScheduleEvent } from '@/lib/types'

/** Lowercased, punctuation-stripped, collapsed — enough to match a title, not to score one. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * The assignment an event plausibly refers to.
 *
 * Containment in either direction, because a calendar entry is usually the
 * assignment title with a course code bolted on. **No match is the common
 * answer** — most calendar events are not coursework — and a near-miss returns
 * nothing rather than a guess.
 */
export function matchEventToAssignment(
  event: NormalizedScheduleEvent,
  assignments: ClassAssignment[],
): ClassAssignment | undefined {
  const title = normalise(event.title)
  if (title.length < 4) return undefined
  return assignments.find((assignment) => {
    const other = normalise(assignment.title)
    if (other.length < 4) return false
    return title.includes(other) || other.includes(title)
  })
}

const dateOf = (iso: string) => iso.slice(0, 10)

export interface ProposedDateChange {
  assignment: ClassAssignment
  /** What the class record says today. */
  recordedDate: string
  /** What the subscribed calendar says. */
  calendarDate: string
  event: NormalizedScheduleEvent
}

/** Every event whose date disagrees with its matched assignment. Proposals only. */
export function proposedDateChanges(
  events: NormalizedScheduleEvent[],
  assignments: ClassAssignment[],
): ProposedDateChange[] {
  const out: ProposedDateChange[] = []
  const seen = new Set<string>()
  for (const event of events) {
    if (event.status === 'cancelled') continue
    const assignment = matchEventToAssignment(event, assignments)
    if (!assignment?.dueDate || seen.has(assignment.id)) continue
    const calendarDate = dateOf(event.start)
    if (!calendarDate || calendarDate === assignment.dueDate) continue
    seen.add(assignment.id)
    out.push({ assignment, recordedDate: assignment.dueDate, calendarDate, event })
  }
  return out
}

/**
 * The explicit accept. Writes `dueDate` and nothing else — a calendar knows a
 * date and knows nothing about status, weight, points, or topic links.
 */
export function applyProposedDate(
  assignments: ClassAssignment[],
  { assignmentId, date, now = Date.now() }: { assignmentId: string; date: string; now?: number },
): ClassAssignment[] {
  return assignments.map((assignment) =>
    assignment.id === assignmentId ? { ...assignment, dueDate: date, updatedAt: now } : assignment)
}

export type FeedState = 'disconnected' | 'unavailable' | 'connected-empty' | 'connected'

/**
 * `connected-empty` is deliberately its own state and deliberately **not an
 * error**: a subscribed calendar with no course dates yet is ordinary, and
 * styling it as a failure would send the student hunting for a problem that
 * does not exist.
 */
export function feedState({ connected, events, lastError }: {
  connected: boolean
  events: NormalizedScheduleEvent[]
  lastError?: string
}): FeedState {
  if (!connected) return 'disconnected'
  if (lastError) return 'unavailable'
  return events.length ? 'connected' : 'connected-empty'
}

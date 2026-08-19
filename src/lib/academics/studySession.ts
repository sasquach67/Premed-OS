/**
 * The FSRS study-session planner (§4.1 item 8).
 *
 * > "you have 90 minutes" → an optimal, interleaved mix of what's due across
 * > classes (**interleaving beats blocking for retention**).
 *
 * The interleaving is the feature, not a presentation choice: reviewing one
 * class to exhaustion and then the next is precisely the blocked practice the
 * spec says loses to interleaving.
 *
 * ⚠️ The per-topic estimate is a **stated assumption, never a measurement.**
 * `ReviewEvent` records no duration, so this cannot know how long a topic takes
 * the student. §4.1-J's session timer is what would make it measurable, and it
 * is not built — so the plan says what it assumed rather than implying it timed
 * anything.
 */
import type { Course, Topic } from '@/lib/types'

/** Stated, not measured. Named so the UI can quote the same number. */
export const ASSUMED_MINUTES_PER_TOPIC = 5

export interface SessionBlock {
  topic: Topic
  courseCode: string
  /** 1-based position in the queue. */
  position: number
}

export interface SessionPlan {
  blocks: SessionBlock[]
  minutes: number
  /** Due topics that did not fit in the time available. */
  deferred: number
  /** The assumption the plan rests on, in the plan's own words. */
  assumption: string
}

/**
 * Round-robin across classes, so no two adjacent blocks share a course while
 * another course still has due work.
 */
export function interleaveByCourse(topics: Topic[]): Topic[] {
  const byCourse = new Map<string, Topic[]>()
  for (const topic of topics) {
    byCourse.set(topic.courseId, [...(byCourse.get(topic.courseId) ?? []), topic])
  }
  const queues = [...byCourse.values()]
  const out: Topic[] = []
  let index = 0
  while (out.length < topics.length) {
    const queue = queues[index % queues.length]
    const next = queue.shift()
    if (next) out.push(next)
    index += 1
    // Drop exhausted queues so the rotation stays even rather than stalling.
    if (queues.every((entry) => entry.length === 0)) break
    if (queue.length === 0 && queues.length > 1) {
      const position = queues.indexOf(queue)
      if (position >= 0 && queues[position].length === 0) {
        queues.splice(position, 1)
        if (position <= index % Math.max(queues.length, 1)) index = Math.max(index - 1, 0)
      }
    }
  }
  return out
}

export function studySessionPlan(
  topics: Topic[],
  courses: Course[],
  { minutes, perTopic = ASSUMED_MINUTES_PER_TOPIC, now = Date.now() }: {
    minutes: number
    perTopic?: number
    now?: number
  },
): SessionPlan {
  const due = topics.filter((topic) => topic.fsrs.reps > 0 && topic.fsrs.due <= now)
  const capacity = Math.floor(minutes / perTopic)
  const ordered = interleaveByCourse(due)
  const chosen = capacity > 0 ? ordered.slice(0, capacity) : []
  const codeOf = (courseId: string) => courses.find((course) => course.id === courseId)?.code ?? 'Class'

  return {
    blocks: chosen.map((topic, index) => ({
      topic,
      courseCode: codeOf(topic.courseId),
      position: index + 1,
    })),
    minutes,
    deferred: Math.max(due.length - chosen.length, 0),
    assumption: `Assumes about ${perTopic} minutes per topic. Premed OS does not time your reviews, so this is an estimate rather than a measurement.`,
  }
}

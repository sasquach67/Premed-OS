/**
 * Forgetting curve — the read model behind the §4.1-L sawtooth panel.
 *
 * Renders the decay that already ships in fsrs.ts. It does NOT define a second
 * model: `topicRetrievability` is the single source of the shape.
 *
 * Drawing:   mockup-lab/01-academics/academics-forgetting-curve.html
 * Decisions: academics-forgetting-curve.md — C1 ruled Aug 18 2026.
 */
import { createTopicFsrsState, reviewTopic, topicRetrievability } from '@/lib/academics/fsrs'
import { REVIEW_RATINGS } from '@/lib/academics/activeRecall'
import type { ReviewEvent, TopicFsrsState } from '@/lib/types'

/** §4.1-L: fewer than two reviews is a dot, not a curve. Never fabricate a shape. */
export const MIN_REVIEWS_FOR_CURVE = 2

export interface CurvePoint { t: number; retention: number }
export interface CurveSegment { from: number; to: number; points: CurvePoint[] }

/**
 * C1 (ruled): the exam-day figure NEVER travels alone. The band label is
 * returned with it, from one function, so no caller can render one without
 * the other. Bands are computed, never authored per case.
 */
export type RetentionBand = 'should-hold' | 'fading' | 'likely-gone'
export interface ExamDayReading {
  /** 0..1 — render as a percentage. */
  retention: number
  band: RetentionBand
  /** The plain-language reading. Always shown beside the figure. */
  label: string
  /** One short consequence clause. Never a scold. */
  clause: string
}

const BANDS: Array<{ min: number; band: RetentionBand; label: string; clause: string }> = [
  { min: 0.8, band: 'should-hold', label: 'Should hold', clause: '' },
  { min: 0.55, band: 'fading', label: 'Fading', clause: 'one more pass would hold it' },
  { min: 0, band: 'likely-gone', label: 'Likely gone by then', clause: 'worth rebuilding before the exam' },
]

/** The only way to obtain the exam-day number. Returns the label with it, by construction. */
export function examDayReading(state: TopicFsrsState, examDate: number): ExamDayReading {
  const retention = topicRetrievability(state, examDate)
  const band = BANDS.find((entry) => retention >= entry.min) ?? BANDS[BANDS.length - 1]
  return { retention, band: band.band, label: band.label, clause: band.clause }
}

export function reviewsForTopic(events: ReviewEvent[], topicId: string): ReviewEvent[] {
  return events.filter((event) => event.topicId === topicId).sort((a, b) => a.timestamp - b.timestamp)
}

export function reviewTimestamps(events: ReviewEvent[]): number[] {
  return events.map((event) => event.timestamp)
}

/**
 * The memory state produced by each review, reconstructed by replaying the log
 * through the shipped scheduler.
 *
 * This matters for honesty, not neatness: a topic stores only its CURRENT
 * stability, so drawing every past interval with today's value would make all
 * the teeth identical — and the widening of the gaps, which is the entire
 * argument of §4.1-L, would vanish from the picture. Replaying recovers the
 * stability that actually governed each interval.
 */
export function replayStates(reviews: ReviewEvent[]): TopicFsrsState[] {
  let state = createTopicFsrsState(reviews[0]?.timestamp ?? Date.now())
  const after: TopicFsrsState[] = []
  for (const review of reviews) {
    state = reviewTopic(state, REVIEW_RATINGS[review.grade], review.timestamp)
    after.push(state)
  }
  return after
}

export function hasEnoughHistory(reviewTimestamps: number[]): boolean {
  return reviewTimestamps.length >= MIN_REVIEWS_FOR_CURVE
}

/**
 * Solid history segments, one per interval between successive reviews.
 * Each segment starts at 100% — a review resets retention — and decays to the
 * next review, which is why the sawtooth has teeth.
 */
export function historySegments(reviews: ReviewEvent[], steps = 24): CurveSegment[] {
  const after = replayStates(reviews)
  const segments: CurveSegment[] = []
  for (let index = 0; index < reviews.length - 1; index += 1) {
    const from = reviews[index].timestamp
    const to = reviews[index + 1].timestamp
    const governing = after[index]
    const points: CurvePoint[] = []
    for (let step = 0; step <= steps; step += 1) {
      const t = from + ((to - from) * step) / steps
      points.push({ t, retention: retentionSince(governing, from, t) })
    }
    segments.push({ from, to, points })
  }
  return segments
}

/**
 * The dashed projection. It begins EXACTLY at the last real review — the seam
 * between what happened and what is predicted must never be blurred.
 */
export function projectionSegment(reviews: ReviewEvent[], until: number, steps = 48): CurveSegment | null {
  const last = reviews[reviews.length - 1]?.timestamp
  if (last === undefined || until <= last) return null
  const governing = replayStates(reviews).at(-1)!
  const points: CurvePoint[] = []
  for (let step = 0; step <= steps; step += 1) {
    const t = last + ((until - last) * step) / steps
    points.push({ t, retention: retentionSince(governing, last, t) })
  }
  return { from: last, to: until, points }
}

/** The state the exam-day reading must be measured from: the one the last review left. */
export function stateAfterLastReview(reviews: ReviewEvent[]): TopicFsrsState | null {
  return replayStates(reviews).at(-1) ?? null
}

/** Retention at `at`, measured from a review at `since`, using the shipped model. */
function retentionSince(state: TopicFsrsState, since: number, at: number): number {
  // topicRetrievability measures from the state's own lastReview, so shift the
  // clock rather than reimplementing the decay.
  const shifted: TopicFsrsState = { ...state, lastReview: since }
  return Math.max(0, Math.min(1, topicRetrievability(shifted, at)))
}

/** The widening gaps, in whole days — the visible argument for spaced repetition. */
export function reviewGapsInDays(timestamps: number[]): number[] {
  const gaps: number[] = []
  for (let index = 0; index < timestamps.length - 1; index += 1) {
    gaps.push(Math.round((timestamps[index + 1] - timestamps[index]) / 86_400_000))
  }
  return gaps
}

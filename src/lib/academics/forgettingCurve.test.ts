import { describe, expect, it } from 'vitest'
import { createTopicFsrsState } from '@/lib/academics/fsrs'
import {
  examDayReading, hasEnoughHistory, historySegments, projectionSegment,
  replayStates, reviewGapsInDays, reviewTimestamps, reviewsForTopic, MIN_REVIEWS_FOR_CURVE,
} from '@/lib/academics/forgettingCurve'
import type { ReviewEvent, TopicFsrsState } from '@/lib/types'

const DAY = 86_400_000
const t0 = Date.UTC(2026, 8, 1)
const state = (patch: Partial<TopicFsrsState> = {}): TopicFsrsState => ({ ...createTopicFsrsState(t0), state: 2, stability: 20, difficulty: 5, reps: 4, lastReview: t0, ...patch })
const event = (topicId: string, timestamp: number, order: number): ReviewEvent =>
  ({ id: `r${order}`, topicId, timestamp, grade: 'good', confidence: 3, order })

describe('forgetting curve — history vs projection', () => {
  const stamps = [t0, t0 + 2 * DAY, t0 + 7 * DAY, t0 + 19 * DAY]
  const reviews = stamps.map((at, index) => event('a', at, index))

  it('needs two reviews before there is a curve at all', () => {
    expect(MIN_REVIEWS_FOR_CURVE).toBe(2)
    expect(hasEnoughHistory([])).toBe(false)
    expect(hasEnoughHistory([t0])).toBe(false)
    expect(hasEnoughHistory([t0, t0 + DAY])).toBe(true)
  })

  it('emits no history segments from a single review — never a fabricated shape', () => {
    expect(historySegments([event('a', t0, 0)])).toEqual([])
  })

  it('starts every history segment at full retention, which is what makes the teeth', () => {
    const segments = historySegments(reviews)
    expect(segments).toHaveLength(3)
    for (const segment of segments) expect(segment.points[0].retention).toBeCloseTo(1, 5)
  })

  it('decays within a segment rather than holding flat', () => {
    const [first] = historySegments(reviews)
    expect(first.points.at(-1)!.retention).toBeLessThan(first.points[0].retention)
  })

  it('begins the dashed projection exactly at the last real review', () => {
    const segments = historySegments(reviews)
    const projection = projectionSegment(reviews, t0 + 60 * DAY)!
    expect(projection.from).toBe(stamps.at(-1))
    expect(projection.from).toBe(segments.at(-1)!.to)
    expect(projection.points[0].retention).toBeCloseTo(1, 5)
  })

  it('has no projection when the window ends at the last review', () => {
    expect(projectionSegment(reviews, stamps.at(-1)!)).toBeNull()
  })

  it('reports the widening gaps the panel argues from', () => {
    expect(reviewGapsInDays(stamps)).toEqual([2, 5, 12])
  })

  it('replays the log so each interval uses the stability that governed it', () => {
    const after = replayStates(reviews)
    expect(after).toHaveLength(reviews.length)
    // Successful reviews build stability, so later intervals decay more slowly.
    // Drawing every tooth with today's single value would erase exactly this.
    expect(after.at(-1)!.stability).toBeGreaterThan(after[0].stability)
  })

  it('reads a topic’s reviews in chronological order', () => {
    const events = [event('b', t0, 0), event('a', t0 + 5 * DAY, 1), event('a', t0, 2)]
    expect(reviewTimestamps(reviewsForTopic(events, 'a'))).toEqual([t0, t0 + 5 * DAY])
  })
})

describe('C1 — the exam-day figure never travels alone', () => {
  it('always returns a label and band beside the number', () => {
    const reading = examDayReading(state(), t0 + 19 * DAY)
    expect(reading.retention).toBeGreaterThan(0)
    expect(reading.label.length).toBeGreaterThan(0)
    expect(reading.band).toBeTruthy()
  })

  it('bands are computed, and match the ruling exactly', () => {
    // Thresholds probed against the shipped FSRS curve, not an assumed exponential:
    // it decays far more slowly than exp(-t/S).
    expect(examDayReading(state({ stability: 4000 }), t0 + DAY).band).toBe('should-hold')
    expect(examDayReading(state({ stability: 2 }), t0 + 9 * DAY).band).toBe('fading')
    expect(examDayReading(state({ stability: 0.5 }), t0 + 60 * DAY).band).toBe('likely-gone')
  })

  it('gives every band a label, and a clause on the two that imply action', () => {
    const hold = examDayReading(state({ stability: 4000 }), t0 + DAY)
    const fading = examDayReading(state({ stability: 2 }), t0 + 9 * DAY)
    const gone = examDayReading(state({ stability: 0.5 }), t0 + 60 * DAY)
    expect(hold.label).toBe('Should hold')
    expect(hold.clause).toBe('')
    expect(fading.clause).toBe('one more pass would hold it')
    expect(gone.clause).toBe('worth rebuilding before the exam')
  })
})

import type { ID, RetrievabilityBand, RetrievabilityOutcome, RetrievabilityPrediction, ReviewGrade, TopicFsrsState } from '@/lib/types'
import { topicRetrievability } from '@/lib/academics/fsrs'

export const FORECAST_MODEL_VERSION = 'fsrs-v1' as const
/** Named, conservative evidence gate. Below it, calibration remains silent. */
export const MIN_RESOLVED_FORECAST_CALLS = 20
/** A band needs enough calls of its own before the app names its calibration. */
export const MIN_BAND_FORECAST_CALLS = 5

export const FORECAST_BANDS: Array<{ id: RetrievabilityBand; label: string; range: RetrievabilityPrediction['predictedRange']; floor: number; ceiling: number }> = [
  { id: 'solid', label: 'Solid', range: '80–100%', floor: .8, ceiling: 1 },
  { id: 'fading', label: 'Fading', range: '55–79%', floor: .55, ceiling: .8 },
  { id: 'likely-gone', label: 'Likely gone', range: '0–54%', floor: 0, ceiling: .55 },
]

export type ForecastVerdict = 'holding-up' | 'runs-optimistic' | 'runs-pessimistic'

export type ForecastBandReading = {
  band: RetrievabilityBand
  label: string
  resolved: number
  recalled: number
  blanked: number
  verdict: ForecastVerdict | null
}

export type ForecastAccuracy = {
  resolved: number
  remainingUntilGate: number
  ready: boolean
  bands: ForecastBandReading[]
  calls: RetrievabilityPrediction[]
}

export function forecastBandFor(state: TopicFsrsState, now: number): Pick<RetrievabilityPrediction, 'predictedBand' | 'predictedRange' | 'modelVersion'> {
  const retrievability = topicRetrievability(state, now)
  const band = FORECAST_BANDS.find((candidate) => retrievability >= candidate.floor && retrievability <= candidate.ceiling)
    ?? FORECAST_BANDS.at(-1)!
  return { predictedBand: band.id, predictedRange: band.range, modelVersion: FORECAST_MODEL_VERSION }
}

export function outcomeForReview(grade: 'again' | 'hard' | 'good' | 'easy'): RetrievabilityOutcome {
  return grade === 'again' ? 'blanked' : 'recalled'
}

/** Builds the one audit record alongside the review event that resolved it. */
export function createRetrievabilityPrediction({
  id, courseId, topicId, reviewEventId, state, grade, now, order,
}: {
  id: ID
  courseId: ID
  topicId: ID
  reviewEventId: ID
  state: TopicFsrsState
  grade: ReviewGrade
  now: number
  order: number
}): RetrievabilityPrediction {
  return {
    id,
    courseId,
    topicId,
    reviewEventId,
    predictedAt: now,
    ...forecastBandFor(state, now),
    outcome: outcomeForReview(grade),
    resolvedAt: now,
    order,
  }
}

function verdictFor(band: RetrievabilityBand, resolved: number, recalled: number): ForecastVerdict | null {
  if (resolved < MIN_BAND_FORECAST_CALLS) return null
  const rate = recalled / resolved
  const expectation = FORECAST_BANDS.find((item) => item.id === band)!
  if (rate < expectation.floor) return 'runs-optimistic'
  if (rate > expectation.ceiling) return 'runs-pessimistic'
  return 'holding-up'
}

/** Pure aggregation. It never derives a call for a review that was not recorded. */
export function summarizeForecastAccuracy(predictions: RetrievabilityPrediction[] | undefined): ForecastAccuracy {
  const calls = [...(predictions ?? [])].filter((item) => item.outcome && item.reviewEventId).sort((a, b) => b.predictedAt - a.predictedAt)
  const bands = FORECAST_BANDS.map(({ id, label }) => {
    const inBand = calls.filter((item) => item.predictedBand === id)
    const recalled = inBand.filter((item) => item.outcome === 'recalled').length
    return {
      band: id,
      label,
      resolved: inBand.length,
      recalled,
      blanked: inBand.length - recalled,
      verdict: verdictFor(id, inBand.length, recalled),
    }
  })
  return {
    calls,
    resolved: calls.length,
    remainingUntilGate: Math.max(0, MIN_RESOLVED_FORECAST_CALLS - calls.length),
    ready: calls.length >= MIN_RESOLVED_FORECAST_CALLS && bands.some((band) => band.resolved >= MIN_BAND_FORECAST_CALLS),
    bands,
  }
}

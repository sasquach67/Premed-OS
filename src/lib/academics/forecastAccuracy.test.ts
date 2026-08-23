import { describe, expect, it } from 'vitest'
import { createRetrievabilityPrediction, forecastBandFor, MIN_RESOLVED_FORECAST_CALLS, outcomeForReview, summarizeForecastAccuracy } from './forecastAccuracy'
import { createTopicFsrsState } from './fsrs'
import type { RetrievabilityPrediction } from '@/lib/types'

const call = (index: number, band: RetrievabilityPrediction['predictedBand'], outcome: RetrievabilityPrediction['outcome'] = 'recalled'): RetrievabilityPrediction => ({
  id: `call-${index}`, courseId: 'course', topicId: `topic-${index}`, reviewEventId: `event-${index}`,
  predictedAt: index, predictedBand: band,
  predictedRange: band === 'solid' ? '80–100%' : band === 'fading' ? '55–79%' : '0–54%',
  modelVersion: 'fsrs-v1', outcome, resolvedAt: index, order: index,
})

describe('forecast accuracy', () => {
  it('records a bounded FSRS band without storing a retrievability number', () => {
    const prediction = forecastBandFor(createTopicFsrsState(1), 1)
    expect(prediction.modelVersion).toBe('fsrs-v1')
    expect(prediction).not.toHaveProperty('retrievability')
    expect(['solid', 'fading', 'likely-gone']).toContain(prediction.predictedBand)
  })

  it('maps a self-rated lapse to blanked and all other review grades to recalled', () => {
    expect(outcomeForReview('again')).toBe('blanked')
    expect(outcomeForReview('hard')).toBe('recalled')
    expect(outcomeForReview('good')).toBe('recalled')
    expect(outcomeForReview('easy')).toBe('recalled')
  })

  it('links each future-only prediction to the exact review that resolved it', () => {
    const prediction = createRetrievabilityPrediction({
      id: 'prediction', courseId: 'course', topicId: 'topic', reviewEventId: 'review',
      state: createTopicFsrsState(1), grade: 'again', now: 10, order: 0,
    })
    expect(prediction).toMatchObject({ reviewEventId: 'review', predictedAt: 10, resolvedAt: 10, outcome: 'blanked' })
  })

  it('stays silent below its named evidence gate', () => {
    const reading = summarizeForecastAccuracy(Array.from({ length: MIN_RESOLVED_FORECAST_CALLS - 1 }, (_, index) => call(index, 'solid')))
    expect(reading.ready).toBe(false)
    expect(reading.remainingUntilGate).toBe(1)
  })

  it('groups only recorded, resolved calls and names a band verdict after its own floor', () => {
    const calls = [
      ...Array.from({ length: 9 }, (_, index) => call(index, 'solid')),
      call(9, 'solid', 'blanked'),
      ...Array.from({ length: 10 }, (_, index) => call(index + 10, 'fading')),
    ]
    const reading = summarizeForecastAccuracy(calls)
    const solid = reading.bands.find((band) => band.band === 'solid')!
    expect(reading.ready).toBe(true)
    expect(solid).toMatchObject({ resolved: 10, recalled: 9, blanked: 1, verdict: 'holding-up' })
  })
})

import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateRetrievabilityPredictionsV33 } from './retrievabilityPredictionsV33'

describe('migrateRetrievabilityPredictionsV33', () => {
  it('adds an empty, future-only home without changing frozen legacy review history', () => {
    const data = createSeedData()
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).retrievabilityPredictions
    const before = structuredClone(data)
    Object.freeze(data)
    Object.freeze(data.academics)
    Object.freeze(data.academics.classCenter)

    const out = migrateRetrievabilityPredictionsV33(data)

    expect(out.academics.classCenter.retrievabilityPredictions).toEqual([])
    expect(out.academics.classCenter.reviewEvents).toEqual(before.academics.classCenter.reviewEvents)
    expect(data).toEqual(before)
  })

  it('is a no-op once predictions exist', () => {
    const data = structuredClone(createSeedData())
    data.academics.classCenter.retrievabilityPredictions = []
    expect(migrateRetrievabilityPredictionsV33(data)).toBe(data)
  })
})

import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import type { AppData } from '@/lib/types'
import { migrateGeneratedUnitResourcesV39 } from './generatedUnitResourcesV39'

describe('migrateGeneratedUnitResourcesV39', () => {
  it('adds empty homes without changing existing class-center data', () => {
    const legacy = structuredClone(createSeedData()) as AppData
    const center = legacy.academics.classCenter as unknown as Record<string, unknown>
    delete center.generatedMasteryOutlines
    delete center.generatedUnitQuestionBanks
    const out = migrateGeneratedUnitResourcesV39(legacy)
    expect(out.academics.classCenter.generatedMasteryOutlines).toEqual([])
    expect(out.academics.classCenter.generatedUnitQuestionBanks).toEqual([])
    expect(migrateGeneratedUnitResourcesV39(out)).toBe(out)
  })
})

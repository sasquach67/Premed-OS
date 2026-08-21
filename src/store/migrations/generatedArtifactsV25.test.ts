import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateGeneratedArtifactsV25 } from './generatedArtifactsV25'

describe('migrateGeneratedArtifactsV25', () => {
  it('adds only empty generated-artifact homes without touching existing data', () => {
    const before = createSeedData()
    const legacy = structuredClone(before) as any
    delete legacy.academics.classCenter.generatedFlashcardDecks
    delete legacy.academics.classCenter.generatedMockAttempts
    Object.freeze(legacy)
    const out = migrateGeneratedArtifactsV25(legacy)
    expect(out.academics.classCenter.generatedFlashcardDecks).toEqual([])
    expect(out.academics.classCenter.generatedMockAttempts).toEqual([])
    expect({ ...out.academics.classCenter, generatedFlashcardDecks: undefined, generatedMockAttempts: undefined }).toEqual({ ...legacy.academics.classCenter, generatedFlashcardDecks: undefined, generatedMockAttempts: undefined })
  })

  it('is a no-op once both homes exist', () => {
    const data = createSeedData()
    expect(migrateGeneratedArtifactsV25(data)).toBe(data)
  })
})

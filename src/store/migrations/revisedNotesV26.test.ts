import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateRevisedNotesV26 } from './revisedNotesV26'

describe('migrateRevisedNotesV26', () => {
  it('adds only the empty revised-notes home without changing legacy data', () => {
    const before = createSeedData()
    const legacy = structuredClone(before) as any
    delete legacy.academics.classCenter.generatedRevisedNotes
    Object.freeze(legacy)
    const out = migrateRevisedNotesV26(legacy)
    expect(out.academics.classCenter.generatedRevisedNotes).toEqual([])
    expect({ ...out.academics.classCenter, generatedRevisedNotes: undefined }).toEqual({ ...legacy.academics.classCenter, generatedRevisedNotes: undefined })
  })

  it('is idempotent when the home already exists', () => {
    const data = createSeedData()
    expect(migrateRevisedNotesV26(data)).toBe(data)
    expect(migrateRevisedNotesV26(migrateRevisedNotesV26(data))).toBe(data)
  })
})

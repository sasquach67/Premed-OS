import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { migrateGradeDecisionsV19 } from '@/store/migrations/gradeDecisionsV19'
import type { AppData } from '@/lib/types'

describe('v19 — the mistake store', () => {
  it('adds the array when it is missing, without touching anything else', () => {
    const before = createSeedData()
    const stripped = structuredClone(before) as AppData
    delete (stripped.academics.classCenter as { mistakes?: unknown }).mistakes
    const after = migrateGradeDecisionsV19(stripped)
    expect(after.academics.classCenter.mistakes).toEqual([])
    expect(after.academics.classCenter.topics).toEqual(before.academics.classCenter.topics)
    expect(after.academics.classCenter.assignments).toEqual(before.academics.classCenter.assignments)
  })

  it('is idempotent and never invents a mistake', () => {
    const seeded = createSeedData()
    const once = migrateGradeDecisionsV19(seeded)
    const twice = migrateGradeDecisionsV19(once)
    expect(twice).toEqual(once)
    expect(twice.academics.classCenter.mistakes).toEqual([])
  })
})

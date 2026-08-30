import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { migratePlanningLibraryV36 } from './planningLibraryV36'

describe('migratePlanningLibraryV36', () => {
  it('adds only an empty planning context, accepts frozen input, and is idempotent', () => {
    const legacy = createPersonalInitialData()
    delete (legacy.academics.classCenter as { planningProgramContext?: unknown }).planningProgramContext
    const before = JSON.parse(JSON.stringify(legacy))
    const frozen = Object.freeze(legacy)
    const migrated = migratePlanningLibraryV36(frozen)
    expect(migrated.academics.classCenter.planningProgramContext).toEqual({})
    expect(migratePlanningLibraryV36(migrated)).toBe(migrated)
    expect({ ...migrated.academics.classCenter, planningProgramContext: undefined }).toEqual({
      ...before.academics.classCenter,
      planningProgramContext: undefined,
    })
  })

  it('retains an existing context object byte-for-byte', () => {
    const current = createPersonalInitialData()
    current.academics.classCenter.planningProgramContext = {
      selectedProgramId: 'neuroscience-bs',
      ideasCatalogYear: '2026-2027',
      updatedAt: 123,
    }
    expect(migratePlanningLibraryV36(current)).toBe(current)
  })

  it('recovers malformed non-object context without touching other records', () => {
    const malformed = createPersonalInitialData()
    malformed.courses.push({
      id: 'course-1', code: 'BIOL 101', title: 'Biology', credits: 4,
      status: 'completed', term: 'Fall 2025', grade: 'A', bcpm: true,
      inResidence: true, satisfies: [], order: 0,
    })
    ;(malformed.academics.classCenter as unknown as { planningProgramContext: unknown }).planningProgramContext = []
    const migrated = migratePlanningLibraryV36(malformed)
    expect(migrated.academics.classCenter.planningProgramContext).toEqual({})
    expect(migrated.courses).toEqual(malformed.courses)
  })
})

import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { migrateProfileMinorsV40 } from '@/store/migrations/profileMinorsV40'

describe('profile minors v40 migration', () => {
  it('adds an empty minors list without changing the existing profile', () => {
    const data = createPersonalInitialData()
    data.profile.name = 'Existing student'
    delete data.profile.minors

    const migrated = migrateProfileMinorsV40(data)

    expect(migrated.profile).toMatchObject({ name: 'Existing student', minors: [] })
    expect(data.profile.minors).toBeUndefined()
  })

  it('preserves an existing minors list and returns the original tree', () => {
    const data = createPersonalInitialData()
    data.profile.minors = ['Chemistry']

    expect(migrateProfileMinorsV40(data)).toBe(data)
  })
})

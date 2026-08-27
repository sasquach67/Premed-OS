import { describe, expect, it } from 'vitest'
import { createInitialDataForMode, useStore } from '@/store/store'
import { migrateAcademicsV4 } from '@/store/migrations/academicsV4'
import type { AppData, Course } from '@/lib/types'

const course = (over: Partial<Course> = {}): Course => ({
  id: 'c1', term: 'Fall 2026', code: 'BIOL 101', title: 'Biology', credits: 3,
  grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0, ...over,
})

const pending = () => useStore.getState().academics.migrationJournal.filter((e) => e.status === 'pending')

describe('first course on a new profile', () => {
  it('does not raise a migration banner for a record the user just created', () => {
    useStore.getState().replaceAll(createInitialDataForMode(false))
    useStore.getState().update((draft) => { draft.profile.startTerm = '' })
    expect(pending()).toHaveLength(0)

    // The exact reproduction: `addItem` pushes the course, THEN syncs. Before the
    // fix, `courses.length` was already 1 and the record-count guard passed.
    useStore.getState().addItem('courses', course())

    expect(useStore.getState().courses).toHaveLength(1)
    expect(pending()).toHaveLength(0)
  })

  it('does not re-raise the banner on ordinary reload (the merge/migrateAll path)', () => {
    // `merge` runs migrateAll on EVERY rehydration, so this is what a normal
    // reload of a normal local profile looks like: already on the v4 shape,
    // one real course, no confirmed start term.
    const base = createInitialDataForMode(false)
    const rehydrated = {
      ...base,
      profile: { ...base.profile, startTerm: '' },
      courses: [course()],
    } as AppData
    expect(Array.isArray(rehydrated.academics.classCenter.workspaces)).toBe(true)

    const migrated = migrateAcademicsV4(rehydrated)
    expect(migrated.academics.migrationJournal.filter((e) => e.status === 'pending')).toHaveLength(0)
  })

  it('still reconciles a genuinely legacy profile carrying pre-v4 classes', () => {
    const base = createInitialDataForMode(false)
    const legacy = {
      ...base,
      profile: { ...base.profile, startTerm: '' },
      courses: [course()],
      academics: {
        ...base.academics,
        // pre-v4 shape: `classes`, and crucially no `workspaces` array
        classCenter: { classes: [{ id: 'w1', courseCode: 'BIOL 101', courseTitle: 'Biology' }] },
      },
    } as unknown as AppData

    const migrated = migrateAcademicsV4(legacy)
    expect(migrated.academics.migrationJournal.some((e) =>
      e.kind === 'current-term-confirmation' && e.status === 'pending')).toBe(true)
  })
})

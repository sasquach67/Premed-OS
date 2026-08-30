import { beforeEach, describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { dependencyImpacts } from '@/lib/dependencies'
import type { ListViewState, Organization, Person } from '@/lib/types'
import { snapshotData, useStore } from '@/store/store'

describe('foundation safety nets', () => {
  beforeEach(() => useStore.getState().replaceAll(createSeedData()))

  it('soft-deletes into Trash and restores without losing record data', () => {
    const course = useStore.getState().courses[0]
    const recoveryId = useStore.getState().softDeleteItems('courses', [course.id])

    const deleted = useStore.getState()
    expect(deleted.courses.some((item) => item.id === course.id)).toBe(false)
    expect(deleted.trash).toHaveLength(1)
    expect(deleted.trash[0].record).toMatchObject({ id: course.id, code: course.code })
    expect(deleted.trash[0].record.deletedAt).toEqual(expect.any(Number))
    expect(recoveryId).toBeTruthy()

    useStore.getState().restoreTrashItems([deleted.trash[0].id])
    const restored = useStore.getState()
    expect(restored.trash).toHaveLength(0)
    expect(restored.courses.find((item) => item.id === course.id)).toMatchObject({ code: course.code })
  })

  it('keeps permanent deletion separate from soft-delete', () => {
    const course = useStore.getState().courses[0]
    useStore.getState().softDeleteItems('courses', [course.id])
    const trashId = useStore.getState().trash[0].id
    useStore.getState().permanentlyDeleteTrashItems([trashId])
    expect(useStore.getState().trash).toHaveLength(0)
    expect(useStore.getState().courses.some((item) => item.id === course.id)).toBe(false)
  })

  it('records bulk changes and can undo them after the mutation', () => {
    const ids = useStore.getState().courses.slice(0, 2).map((course) => course.id)
    const recoveryId = useStore.getState().bulkPatchItems('courses', ids, { archived: true }, 'Archived records')
    expect(useStore.getState().courses.filter((course) => ids.includes(course.id)).every((course) => course.archived)).toBe(true)

    expect(recoveryId).toBeTruthy()
    useStore.getState().undoRecovery(recoveryId!)
    expect(useStore.getState().courses.filter((course) => ids.includes(course.id)).every((course) => !course.archived)).toBe(true)
  })

  it('persists view state independently for each list with two densities only', () => {
    const comfortable: ListViewState = { filters: { status: 'planned' }, visibleColumns: ['code'], density: 'comfortable' }
    const compact: ListViewState = { filters: {}, visibleColumns: ['name', 'status'], density: 'compact', view: 'board' }
    useStore.getState().update((draft) => {
      draft.settings.listPreferences['academics.planner'] = comfortable
      draft.settings.listPreferences['schools.list'] = compact
    })

    expect(useStore.getState().settings.listPreferences['academics.planner']).toEqual(comfortable)
    expect(useStore.getState().settings.listPreferences['schools.list']).toEqual(compact)
    expect(new Set(Object.values(useStore.getState().settings.listPreferences).map((view) => view.density))).toEqual(new Set(['comfortable', 'compact']))
  })

  it('reports real dependencies for canonical entities', () => {
    const organization: Organization = {
      id: 'org-canonical', name: 'Community Clinic', createdAt: 1, updatedAt: 1,
      archived: false, source: { type: 'manual' }, order: 0,
    }
    const person: Person = {
      id: 'person-canonical', name: 'Dr. Rivera', organizationId: organization.id,
      createdAt: 1, updatedAt: 1, archived: false, source: { type: 'manual' }, order: 0,
    }
    useStore.getState().addItem('organizations', organization)
    useStore.getState().addItem('persons', person)

    const [impact] = dependencyImpacts(snapshotData(), 'organizations', [organization.id])
    expect(impact.recordLabel).toBe('Community Clinic')
    expect(impact.dependents).toEqual([
      expect.objectContaining({ id: person.id, relationship: 'Person organization' }),
    ])
  })
})

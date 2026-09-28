import { beforeEach, describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import type { AppData, ExperienceEntry, ResearchMembership } from '@/lib/types'
import { validateAppData } from '@/lib/validateAppData'
import { reconcileResearchRelations, trashResearchRecord } from '@/lib/researchLifecycle'
import { migrateExperienceHoursV15 } from './migrations/experienceHoursV15'
import { migrateResearchV51 } from './migrations/researchV51'
import { migrateAll, snapshotData, useStore } from './store'
import { dataForRemote } from '@/lib/storyPrivacy'

const envelope = { createdAt: 1, updatedAt: 1, archived: false, order: 0 }
const lab: ExperienceEntry = { id: 'lab', category: 'research', org: 'Same name', role: '', description: 'Legacy text '.repeat(1000), hours: 60, tags: [], status: 'active', order: 0 }
function fixture(): AppData {
  const data = createPersonalInitialData()
  data.experiences = [{ ...lab }, { ...lab, id: 'other', hours: undefined }]
  data.persons = [{ ...envelope, id: 'p', name: 'Same name', bio: 'bio' }, { ...envelope, id: 'p2', name: 'Same name' }]
  data.researchUpcomingItems = [{ ...envelope, id: 'u', experienceId: 'lab', date: '2026-09-24', title: 'Meeting' }]
  data.researchReminders = [{ ...envelope, id: 'r', experienceId: 'lab', text: 'Read protocol' }]
  data.researchTimelineNotes = [{ ...envelope, id: 't', experienceId: 'lab', date: '2026-09-24', text: 'Joined' }]
  data.researchMemberships = [{ ...envelope, id: 'm', experienceId: 'lab', personId: 'p', projectText: 'Project' }]
  data.experienceHourEntries = [{ ...envelope, id: 'zero', experienceId: 'lab', kind: 'logged', date: '2026-09-24', hours: 0, note: 'Watched', thoughts: 'A question' }]
  data.notePages = [{ id: 'old', title: 'Earlier note', body: 'Unassigned legacy note', pillar: 'research', order: 0, updatedAt: 1 }]
  return data
}

beforeEach(() => useStore.getState().replaceAll(fixture()))

describe('Research data foundation', () => {
  it('adds only empty containers to a legacy workspace; preserves whole records and nullable optionals', () => {
    const data = fixture()
    const legacy = { ...data, researchUpcomingItems: undefined, researchReminders: undefined, researchTimelineNotes: undefined, researchMemberships: undefined } as unknown as AppData
    legacy.experiences[0] = { ...lab, supervisor: undefined, startDate: null } as unknown as ExperienceEntry
    const before = JSON.stringify(legacy)
    const result = migrateResearchV51(legacy)
    expect(JSON.stringify(legacy)).toBe(before)
    expect(result).toEqual({ ...legacy, researchUpcomingItems: [], researchReminders: [], researchTimelineNotes: [], researchMemberships: [] })
    expect(migrateResearchV51(result)).toEqual(result)
  })

  it('retains pre-v51 orphaned ledger history with explicit additive provenance', () => {
    const data = fixture()
    data.experienceHourEntries[0].experienceId = 'previously-deleted'
    const legacy = { ...data, researchUpcomingItems: undefined, researchReminders: undefined, researchTimelineNotes: undefined, researchMemberships: undefined } as unknown as AppData
    expect(validateAppData(legacy)).toEqual([])
    const result = migrateResearchV51(legacy)
    expect(result.experienceHourEntries[0]).toEqual({ ...legacy.experienceHourEntries[0], parentDeletedAt: 0 })
    expect(validateAppData(result)).toEqual([])
  })

  it('registers all fields in snapshot, JSON and outgoing cloud data, including zero-hour Thoughts', () => {
    const snapshot = snapshotData()
    const result = migrateAll(JSON.parse(JSON.stringify(dataForRemote(snapshot))))
    for (const key of ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships', 'persons', 'notePages', 'experienceHourEntries'] as const) expect(result[key]).toEqual(snapshot[key])
    expect(validateAppData(result)).toEqual([])
  })

  it('delete → purge → export/import → migrate twice does not resurrect an estimate', () => {
    const id = 'experience-hour-legacy-lab'
    useStore.getState().removeItem('experienceHourEntries', id)
    const trash = useStore.getState().trash.find((item) => item.record.id === id)!
    useStore.getState().permanentlyDeleteTrashItems([trash.id])
    const imported = JSON.parse(JSON.stringify(snapshotData()))
    const once = migrateAll(imported)
    const twice = migrateAll(once)
    expect(twice.experienceHourEntries.some((item) => item.id === id)).toBe(false)
    expect(twice.experiences[0].estimatedHoursDeletedAt).toEqual(expect.any(Number))
    expect(twice).toEqual(once)
  })

  it('restoring the estimate before purge clears the marker and restores exactly once', () => {
    const id = 'experience-hour-legacy-lab'
    useStore.getState().removeItem('experienceHourEntries', id)
    const trashId = useStore.getState().trash[0].id
    useStore.getState().restoreTrashItems([trashId])
    useStore.getState().restoreTrashItems([trashId])
    const result = migrateAll(snapshotData())
    expect(result.experienceHourEntries.filter((item) => item.id === id)).toHaveLength(1)
    expect(result.experiences[0].estimatedHoursDeletedAt).toBeUndefined()
  })

  it.each([true, false])('restores parent/child in either order (parent first = %s)', (parentFirst) => {
    useStore.getState().removeItem('experiences', 'lab')
    useStore.getState().removeItem('researchReminders', 'r')
    const parentTrash = useStore.getState().trash.find((item) => item.record.id === 'lab')!.id
    const childTrash = useStore.getState().trash.find((item) => item.record.id === 'r')!.id
    for (const id of parentFirst ? [parentTrash, childTrash] : [childTrash, parentTrash]) {
      useStore.getState().restoreTrashItems([id])
      expect(validateAppData(snapshotData())).toEqual([])
    }
    expect(useStore.getState().researchReminders[0].parentDeletedAt).toBeUndefined()
    expect(useStore.getState().researchReminders).toHaveLength(1)
  })

  it('preserves historical children after parent purge and unlinks a person without deleting it', () => {
    useStore.getState().removeItem('experiences', 'lab')
    useStore.getState().permanentlyDeleteTrashItems([useStore.getState().trash[0].id])
    expect(validateAppData(snapshotData())).toEqual([])
    expect(useStore.getState().researchReminders[0].parentDeletedAt).toEqual(expect.any(Number))
    useStore.getState().removeItem('researchMemberships', 'm')
    expect(useStore.getState().persons).toHaveLength(2)
  })

  it('keeps estimate deletion durable when its parent is already in Trash', () => {
    useStore.getState().removeItem('experiences', 'lab')
    const parentTrash = useStore.getState().trash[0].id
    useStore.getState().removeItem('experienceHourEntries', 'experience-hour-legacy-lab')
    useStore.getState().permanentlyDeleteTrashItems([useStore.getState().trash[0].id])
    useStore.getState().restoreTrashItems([parentTrash])
    expect(migrateAll(snapshotData()).experienceHourEntries.some((item) => item.id === 'experience-hour-legacy-lab')).toBe(false)
  })

  it('durable transaction helper has the same tombstone and provenance behavior', () => {
    const data = migrateAll(fixture())
    expect(trashResearchRecord(data, 'experienceHourEntries', 'experience-hour-legacy-lab', 42)).toBe(true)
    expect(data.experiences[0].estimatedHoursDeletedAt).toBe(42)
    expect(trashResearchRecord(data, 'experiences', 'lab', 43)).toBe(true)
    expect(data.researchMemberships[0].parentDeletedAt).toBe(43)
    expect(validateAppData(data)).toEqual([])
    expect(trashResearchRecord(data, 'experiences', 'lab')).toBe(false)
  })

  it('v15 does not recreate estimates already in old Trash; v51 preserves the durable marker', () => {
    const data = fixture()
    data.trash.push({ id: 'trash', collection: 'experienceHourEntries', deletedAt: 7, record: { id: 'experience-hour-legacy-lab', experienceId: 'lab', deletedAt: 7 } })
    const migrated = migrateResearchV51(migrateExperienceHoursV15(data))
    expect(migrated.experiences[0].estimatedHoursDeletedAt).toBe(7)
    expect(migrated.experienceHourEntries.some((item) => item.kind === 'estimated')).toBe(false)
  })

  it('backfills a deleted estimate marker on a parent already in legacy Trash', () => {
    const data = fixture()
    data.experiences = data.experiences.filter((row) => row.id !== 'lab')
    data.trash.push(
      { id: 'parent', collection: 'experiences', deletedAt: 6, record: { ...lab, deletedAt: 6 } },
      { id: 'estimate', collection: 'experienceHourEntries', deletedAt: 7, record: { id: 'experience-hour-legacy-lab', experienceId: 'lab', deletedAt: 7 } },
    )
    const result = migrateResearchV51(data)
    expect(result.trash.find((item) => item.id === 'parent')!.record.estimatedHoursDeletedAt).toBe(7)
    expect(migrateResearchV51(result)).toEqual(result)
  })

  it('rejects a restore that would duplicate an active membership without losing Trash', () => {
    useStore.getState().removeItem('researchMemberships', 'm')
    const trashId = useStore.getState().trash[0].id
    useStore.getState().addItem('researchMemberships', { ...envelope, id: 'another', experienceId: 'lab', personId: 'p' })
    expect(() => useStore.getState().restoreTrashItems([trashId])).toThrow('duplicate lab membership')
    expect(useStore.getState().trash.some((item) => item.id === trashId)).toBe(true)
    expect(useStore.getState().researchMemberships.map((item) => item.id)).toEqual(['another'])
  })

  it('person deletion/restore records provenance without merging same-name people', () => {
    const data = fixture()
    trashResearchRecord(data, 'persons', 'p', 50)
    expect(data.researchMemberships[0].personDeletedAt).toBe(50)
    expect(validateAppData(data)).toEqual([])
    data.persons.push({ ...envelope, id: 'p', name: 'Same name' })
    reconcileResearchRelations(data)
    expect(data.researchMemberships[0].personDeletedAt).toBeUndefined()
    expect(data.persons).toHaveLength(2)
  })
})

describe('Research ingress validation', () => {
  it.each([
    ['researchUpcomingItems', { date: '2026-02-30' }],
    ['researchReminders', { experienceId: 'missing' }],
    ['researchMemberships', { personId: 'missing' }],
    ['researchTimelineNotes', { text: 4 }],
    ['experienceHourEntries', { hours: -1 }],
    ['experienceHourEntries', { experienceId: 'missing' }],
    ['experienceHourEntries', { thoughts: {} }],
    ['persons', { bio: {} }],
  ])('rejects malformed %s records', (key, patch) => {
    const data = fixture()
    Object.assign((data[key as keyof AppData] as object[])[0], patch)
    expect(validateAppData(data).length).toBeGreaterThan(0)
  })
  it('rejects duplicate active memberships, accepts distinct same-name identities', () => {
    const data = fixture()
    data.researchMemberships.push({ ...data.researchMemberships[0], id: 'duplicate' })
    expect(validateAppData(data).join()).toContain('duplicate lab membership')
    data.researchMemberships[1].personId = 'p2'
    expect(validateAppData(data)).toEqual([])
  })
  it('preserves archived/deleted historical links without accepting malformed active links', () => {
    const data = fixture()
    data.researchMemberships[0] = { ...data.researchMemberships[0], personId: 'historical', experienceId: 'old', archived: true } satisfies ResearchMembership
    expect(validateAppData(data)).toEqual([])
  })
})

import { Blob as NodeBlob } from 'node:buffer'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import type { AppData } from '@/lib/types'
import { dataForRemote } from '@/lib/storyPrivacy'
import { validateAppData } from '@/lib/validateAppData'
import { createWorkspaceBackup, prepareWorkspaceBackup } from '@/lib/workspaceBackup'
import { CURRENT_STORE_VERSION } from './workspaceVersion'

const accountA = 'synthetic-research-a', accountB = 'synthetic-research-b'
const keyA = `hq:app-data:account:${accountA}`, keyB = `hq:app-data:account:${accountB}`
const envelope = { createdAt: 1, updatedAt: 1, archived: false, order: 0 }
const sourceText = `  Observed only; no independent experiment claimed.\n${'Raw student wording; '.repeat(3000)}\n  `
function fixture(): AppData {
  const data = createPersonalInitialData()
  data.experiences = [
    { id: 'lab-a', category: 'research', org: 'Same lab name', role: 'Observer', description: sourceText, hours: 60, estimatedHoursDeletedAt: 42, tags: [], status: 'active', order: 0, research: { department: 'Biology', institution: 'Synthetic institution', researchType: 'Cell biology', since: '2026-09-01', lastPiContact: '2026-09-23', current: true } },
    { id: 'lab-b', category: 'research', org: 'Same lab name', role: '', description: 'Distinct identity', tags: [], status: 'active', order: 1 },
  ]
  data.persons = [
    { ...envelope, id: 'person-a', name: 'Same name', bio: sourceText },
    { ...envelope, id: 'person-b', name: 'Same name' },
  ]
  data.organizations = [{ ...envelope, id: 'organization', name: 'Unlinked organization', type: 'lab' }]
  data.researchUpcomingItems = [{ ...envelope, id: 'upcoming', experienceId: 'lab-a', date: '2026-09-25', title: 'Training', note: sourceText }]
  data.researchReminders = [{ ...envelope, id: 'reminder', experienceId: 'lab-b', text: 'Ask before handling samples' }]
  data.researchTimelineNotes = [{ ...envelope, id: 'timeline', experienceId: 'lab-a', date: '2026-09-24', text: sourceText }]
  data.researchMemberships = [{ ...envelope, id: 'membership', experienceId: 'lab-a', personId: 'person-a', roleInLab: 'Mentor', projectText: 'Student supplied project description' }]
  data.experienceHourEntries = [
    { ...envelope, id: 'zero', experienceId: 'lab-a', kind: 'logged', date: '2026-09-24', hours: 0, note: sourceText, thoughts: '  Why did the signal change?\nUnresolved.  ' },
    { ...envelope, id: 'positive', experienceId: 'lab-b', kind: 'logged', date: '2026-09-24', hours: 1.5, note: 'Observed supervised work' },
    { ...envelope, id: 'estimate', experienceId: 'lab-b', kind: 'estimated', hours: 20, note: 'Student estimate; no date' },
  ]
  data.notePages = [{ id: 'earlier', title: 'Earlier notes', body: sourceText, pillar: 'research', order: 0, updatedAt: 1 }]
  return data
}

function research(data: AppData) {
  return {
    experiences: data.experiences, persons: data.persons, organizations: data.organizations,
    experienceHourEntries: data.experienceHourEntries, notePages: data.notePages,
    researchUpcomingItems: data.researchUpcomingItems, researchReminders: data.researchReminders,
    researchTimelineNotes: data.researchTimelineNotes, researchMemberships: data.researchMemberships,
  }
}

beforeEach(() => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear()
  vi.stubGlobal('Blob', NodeBlob); vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  localStorage.setItem('hq:workspace-owner', `account:${accountA}`)
  localStorage.setItem(keyA, JSON.stringify({ state: createPersonalInitialData(), version: CURRENT_STORE_VERSION }))
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function boot() {
  const bootstrap = await import('./workspaceBootstrap')
  await bootstrap.initializeDurableWorkspaces()
  const store = await import('./store')
  expect(store.useStore.persist.hasHydrated()).toBe(true)
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  const persistence = (await import('./workspacePersistence')).workspacePersistence()!
  await persistence.flush(store.captureWorkspaceIdentity().key!)
  return { ...store, ...bootstrap, persistence, commit: (await import('./workspaceTransaction')).commitWorkspaceMutation }
}

it('keeps exact Research content, zero-hour Thoughts, distinct identities and deletion tombstone through durable save and cold reload', async () => {
  const s = await boot(), expected = fixture()
  expect(validateAppData(expected)).toEqual([])
  await s.commit(draft => Object.assign(draft, expected))
  expect(research(JSON.parse((await s.persistence.repository.read(keyA))!.raw).state)).toEqual(research(expected))
  s.persistence.repository.close(); vi.resetModules()
  const reloaded = await boot()
  expect(reloaded.activeAccountWorkspaceId()).toBe(accountA)
  expect(research(reloaded.snapshotData())).toEqual(research(expected))
  expect(reloaded.snapshotData().experienceHourEntries.some(row => row.id === 'experience-hour-legacy-lab-a')).toBe(false)
  reloaded.persistence.repository.close()
})

it.each(['JSON', 'ZIP'] as const)('preserves Research in a %s export/import, repeated migration and durable reload', async format => {
  const s = await boot()
  await s.commit(draft => Object.assign(draft, fixture()))
  const before = s.snapshotData()
  const imported: AppData = format === 'JSON'
    ? JSON.parse(JSON.stringify(before))
    : (await prepareWorkspaceBackup(await createWorkspaceBackup(before, { images: { read: async () => undefined }, file: async () => undefined }))).data
  expect(validateAppData(imported)).toEqual([])
  const migrated = s.migrateAll(s.migrateAll(imported))
  expect(research(migrated)).toEqual(research(before))
  await s.loadDurableWorkspace(keyB)
  s.activateAccountWorkspace(accountB)
  await s.persistence.flush(keyB)
  await s.commit(draft => Object.assign(draft, migrated))
  s.persistence.repository.close(); vi.resetModules()
  const reloaded = await boot()
  expect(reloaded.activeAccountWorkspaceId()).toBe(accountB)
  expect(research(reloaded.snapshotData())).toEqual(research(before))
  expect(reloaded.snapshotData().experienceHourEntries.some(row => row.id === 'experience-hour-legacy-lab-a')).toBe(false)
  reloaded.persistence.repository.close()
})

it('preserves Research in the real outgoing serializer and cloud-load entry point while keeping account edits separate', async () => {
  const s = await boot()
  await s.commit(draft => Object.assign(draft, fixture()))
  // Simulated transport bytes; no network or real account access. These are the
  // serializer, validation and activation functions used by cloud sync.
  const wire = JSON.parse(JSON.stringify(dataForRemote(s.snapshotData())))
  const { validateRemoteWorkspace } = await import('./accountSyncSafety')
  expect(() => validateRemoteWorkspace(wire)).not.toThrow()
  await s.loadDurableWorkspace(keyB)
  s.activateAccountWorkspace(accountB, wire)
  await s.persistence.flush(keyB)
  expect(research(s.snapshotData())).toEqual(research(fixture()))
  await s.commit(draft => { draft.researchReminders[0].text = 'Only account B changed' })
  s.activateAccountWorkspace(accountA)
  await s.persistence.flush(keyA)
  expect(research(s.snapshotData())).toEqual(research(fixture()))
  s.persistence.repository.close(); vi.resetModules()
  const reloaded = await boot()
  await reloaded.loadDurableWorkspace(keyB)
  reloaded.activateAccountWorkspace(accountB)
  await reloaded.persistence.flush(keyB)
  expect(reloaded.snapshotData().researchReminders[0].text).toBe('Only account B changed')
  expect(reloaded.snapshotData().experienceHourEntries[0].thoughts).toBe(fixture().experienceHourEntries[0].thoughts)
  reloaded.persistence.repository.close()
})

it('does not publish or acknowledge a rejected Research commit and preserves its prior durable copy', async () => {
  const s = await boot()
  await s.commit(draft => Object.assign(draft, fixture()))
  const before = s.snapshotData()
  vi.spyOn(s.persistence.repository, 'commit').mockRejectedValueOnce(new DOMException('Synthetic Research quota', 'QuotaExceededError'))
  await expect(s.commit(draft => { draft.experienceHourEntries[0].thoughts = 'Unsaved edit' })).rejects.toThrow('Synthetic Research quota')
  expect(research(s.snapshotData())).toEqual(research(before))
  expect(research(JSON.parse((await s.persistence.repository.read(keyA))!.raw).state)).toEqual(research(before))
  expect(s.persistence.status(keyA).phase).toBe('error')
  s.persistence.repository.close()
})

it('keeps an acknowledged pending Research write in account A when account B opens mid-write', async () => {
  const s = await boot()
  await s.commit(draft => Object.assign(draft, fixture()))
  await s.loadDurableWorkspace(keyB)
  const original = s.persistence.repository.commit.bind(s.persistence.repository)
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  vi.spyOn(s.persistence.repository, 'commit').mockImplementation(async (key, ...args) => {
    if (key === keyA) await pending
    return original(key, ...args)
  })
  const saving = s.commit(draft => { draft.experienceHourEntries[0].thoughts = 'Saved for account A only' })
  const rejected = expect(saving).rejects.toThrow('open workspace changed')
  await vi.waitFor(() => expect(s.persistence.status(keyA).phase).toBe('saving'))
  s.activateAccountWorkspace(accountB)
  release(); await rejected; await s.persistence.flush(keyB)
  expect(s.activeAccountWorkspaceId()).toBe(accountB)
  expect(s.snapshotData().experienceHourEntries).toEqual([])
  expect(s.snapshotData().researchUpcomingItems).toEqual([])
  const savedA: AppData = JSON.parse((await s.persistence.repository.read(keyA))!.raw).state
  expect(savedA.experienceHourEntries[0].thoughts).toBe('Saved for account A only')
  expect(savedA.researchMemberships).toEqual(fixture().researchMemberships)
  expect(JSON.parse((await s.persistence.repository.read(keyB))!.raw).state.experienceHourEntries).toEqual([])
  s.persistence.repository.close()
})

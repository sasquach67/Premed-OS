// Copied into the pinned old-client archive by the runner. It is deliberately
// outside src so the new app's normal test suite does not assert legacy loss.
import { it, expect } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { validateRemoteWorkspace } from './accountSyncSafety'
import { activateAccountWorkspace, activeAccountWorkspaceId, snapshotData, useStore } from './store'
import { dataForRemote } from '@/lib/storyPrivacy'

it('the pinned production client accepts a valid Research parent, permits an unrelated edit, and drops its new child collections', () => {
  localStorage.clear()
  sessionStorage.clear()
  const data = createPersonalInitialData()
  const lab = { id: 'synthetic-t4-lab', category: 'research' as const, org: 'Synthetic compatibility lab', role: 'Student researcher', description: 'Synthetic fixture only', status: 'active' as const, tags: [], order: 0 }
  data.experiences.push(lab)
  const envelope = { createdAt: 1, updatedAt: 1, archived: false, order: 0 }
  data.persons.push({ ...envelope, id: 'synthetic-person', name: 'Synthetic mentor' })
  const nextSchema = {
    ...data,
    researchUpcomingItems: [{ ...envelope, id: 'upcoming', experienceId: lab.id, date: '2026-09-25', title: 'Meeting' }],
    researchReminders: [{ ...envelope, id: 'reminder', experienceId: lab.id, text: 'Bring lab notes' }],
    researchTimelineNotes: [{ ...envelope, id: 'timeline', experienceId: lab.id, date: '2026-09-24', text: 'Started training' }],
    researchMemberships: [{ ...envelope, id: 'membership', experienceId: lab.id, personId: 'synthetic-person', roleInLab: 'Mentor', projectText: 'Synthetic project' }],
  }
  // Active links are valid: this proof does not depend on historical orphans.
  for (const collection of ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships'] as const) {
    expect(nextSchema[collection][0].experienceId).toBe(lab.id)
  }
  expect(nextSchema.experiences.find(row => row.id === lab.id)).toEqual(lab)
  expect(nextSchema.persons.some(row => row.id === nextSchema.researchMemberships[0].personId)).toBe(true)

  // Explicitly establish that the old client does not safely refuse loading or
  // the unrelated edit. Everything runs against jsdom's synthetic local store.
  expect(() => validateRemoteWorkspace(nextSchema)).not.toThrow()
  expect(() => activateAccountWorkspace('synthetic-t4-compatibility', nextSchema)).not.toThrow()
  expect(activeAccountWorkspaceId()).toBe('synthetic-t4-compatibility')
  expect(() => useStore.getState().update(d => { d.notes.unrelated = 'Unrelated old-client edit' })).not.toThrow()
  const outgoing = dataForRemote(snapshotData()) as unknown as Record<string, unknown>
  expect(outgoing.notes).toMatchObject({ unrelated: 'Unrelated old-client edit' })
  expect(snapshotData().experiences.find(row => row.id === lab.id)).toEqual(lab)
  const disk = JSON.parse(localStorage.getItem('hq:app-data:account:synthetic-t4-compatibility')!).state
  expect(disk.notes.unrelated).toBe('Unrelated old-client edit')
  for (const collection of ['researchUpcomingItems', 'researchReminders', 'researchTimelineNotes', 'researchMemberships']) {
    expect(outgoing).not.toHaveProperty(collection)
    expect(disk).not.toHaveProperty(collection)
  }
})

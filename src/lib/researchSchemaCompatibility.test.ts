import { expect, it } from 'vitest'
import { assertSupportedRemote as oldRemote, assertSupportedWorkspace as oldPortable, CURRENT_CLOUD_SCHEMA as OLD_SCHEMA } from '../../scripts/s1/fixtures/schema1-workspaceSchema'
import { assertSupportedRemote, CURRENT_CLOUD_SCHEMA, prepareWorkspaceData } from './workspaceSchema'
import { createPersonalInitialData } from '@/data/personalInitialData'

// This imports the actual schema-1 gate pinned at 0846aee, not a reimplementation.
it('the pinned schema-1 client refuses schema-2 columns and portable documents', () => {
  expect(OLD_SCHEMA).toBe(1)
  expect(CURRENT_CLOUD_SCHEMA).toBe(2)
  const data = prepareWorkspaceData(createPersonalInitialData())
  expect(() => oldRemote(data, { cloudSchema: 2, writeRev: 1 })).toThrow('newer version')
  expect(() => oldPortable(JSON.parse(JSON.stringify(data)))).toThrow('newer version')
  expect(() => assertSupportedRemote(data, { cloudSchema: 2, writeRev: 1 })).not.toThrow()
})

it.each([
  { researchUpcomingItems: [] }, { researchReminders: [] }, { researchTimelineNotes: [] }, { researchMemberships: [] },
  { experiences: [{ research: { lastPiContact: '2026-09-24' } }] },
  { experiences: [{ estimatedHoursDeletedAt: 123 }] },
  { experienceHourEntries: [{ thoughts: 'exact text' }] },
  { experienceHourEntries: [{ parentDeletedAt: 0 }] },
  { persons: [{ bio: 'exact bio' }] },
  { trash: [{ collection: 'researchMemberships', record: {} }] },
  { meta: { recoveryStack: [{ collection: 'experienceHourEntries', before: [{ thoughts: 'saved' }] }] } },
])('schema 1 refuses evidenced unmarked T4 data without changing it: %j', signature => {
  const before = JSON.stringify(signature)
  expect(() => oldRemote(signature, null)).toThrow('Research data')
  expect(() => oldPortable(signature)).toThrow('Research data')
  expect(() => assertSupportedRemote(signature, null)).not.toThrow()
  expect(JSON.stringify(signature)).toBe(before)
})

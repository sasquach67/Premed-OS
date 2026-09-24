import { expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { assertSupportedRemote, assertSupportedWorkspace, cloudClaim, CloudColumnsMissingError, hasResearchSignatures, isMissingCloudColumnsError, isSchemaGuardError, MAX_WRITE_REV, prepareWorkspaceData, WorkspaceSchemaError } from './workspaceSchema'

const doc = () => createPersonalInitialData() as unknown as Record<string, unknown>

it('reads row metadata: both NULL is unclaimed, a valid pair is claimed, anything else fails closed', () => {
  expect(cloudClaim({ cloud_schema: null, write_rev: null })).toBeNull()
  expect(cloudClaim({ cloud_schema: 1, write_rev: MAX_WRITE_REV })).toEqual({ cloudSchema: 1, writeRev: MAX_WRITE_REV })
  for (const [cloud_schema, write_rev] of [[1, null], [null, 1], [0, 1], [1, 0], [-1, 1], [1.5, 1], ['1', 1], [1, 2 ** 53], [2147483648, 1]]) {
    expect(() => cloudClaim({ cloud_schema, write_rev })).toThrow(WorkspaceSchemaError)
  }
  // A select that did not return the columns is never read as "unclaimed".
  expect(() => cloudClaim({ data: {}, updated_at: 'x' })).toThrow(CloudColumnsMissingError)
})

it('applies the Revision 3 column/marker cases before any hydration', () => {
  const legacy = doc(), marked = { ...doc(), _schema: 1 }
  expect(() => assertSupportedRemote(legacy, null)).not.toThrow()               // legacy candidate
  expect(() => assertSupportedRemote(marked, null)).not.toThrow()               // unclaimed versioned
  expect(() => assertSupportedRemote({ ...doc(), _schema: 2 }, null)).toThrow('newer version')
  expect(() => assertSupportedRemote(marked, { cloudSchema: 1, writeRev: 9 })).not.toThrow()
  expect(() => assertSupportedRemote(legacy, { cloudSchema: 1, writeRev: 9 })).toThrow('disagree') // missing marker never means legacy
  expect(() => assertSupportedRemote(marked, { cloudSchema: 2, writeRev: 9 })).toThrow('newer version')
  expect(() => assertSupportedRemote({ ...doc(), _schema: 2 }, { cloudSchema: 1, writeRev: 9 })).toThrow('newer version')
})

it('detects only the evidenced Research (T4) signatures', () => {
  expect(hasResearchSignatures(doc())).toBe(false)
  expect(hasResearchSignatures({ ...doc(), researchUpcomingItems: [] })).toBe(true)
  expect(hasResearchSignatures({ ...doc(), experiences: [{ id: 'e', estimatedHoursDeletedAt: 1 }] })).toBe(true)
  expect(hasResearchSignatures({ ...doc(), experienceHourEntries: [{ id: 'h', parentDeletedAt: 1 }] })).toBe(true)
  expect(hasResearchSignatures({ ...doc(), trash: [{ id: 't', collection: 'persons', record: { id: 'p', bio: 'x' } }] })).toBe(true)
  const withRecovery = doc(); (withRecovery.meta as { recoveryStack: unknown[] }).recoveryStack = [{ id: 'r', collection: 'experienceHourEntries', before: [{ id: 'h', thoughts: 'x' }], after: [] }]
  expect(hasResearchSignatures(withRecovery)).toBe(true)
  // A same-named field in an unrelated collection is not a signature.
  expect(hasResearchSignatures({ ...doc(), tasks: [{ id: 't', bio: 'x', thoughts: 'x' }] })).toBe(false)
  expect(() => assertSupportedWorkspace({ ...doc(), persons: [{ id: 'p', bio: 'x' }] })).toThrow('Research data')
  expect(() => prepareWorkspaceData({ ...doc(), researchMemberships: [] } as never)).toThrow('Research data')
})

it('recognises the server guard and missing-column errors through wrappers', () => {
  expect(isSchemaGuardError({ code: 'P0001', details: 'S1_SCHEMA_GUARD' })).toBe(true)
  expect(isSchemaGuardError(new Error('wrapped', { cause: { code: 'P0001', details: 'S1_SCHEMA_GUARD' } }))).toBe(true)
  expect(isSchemaGuardError({ code: 'P0001', details: 'other' })).toBe(false)
  expect(isMissingCloudColumnsError({ code: '42703', message: 'column dashboards.cloud_schema does not exist' })).toBe(true)
  expect(isMissingCloudColumnsError({ code: 'PGRST204', message: "Could not find the 'write_rev' column of 'dashboards' in the schema cache" })).toBe(true)
  expect(isMissingCloudColumnsError({ code: '42703', message: 'column dashboards.other does not exist' })).toBe(false)
})

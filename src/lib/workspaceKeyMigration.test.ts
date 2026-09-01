import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ACTIVE_WORKSPACE_OWNER_KEY, workspaceScopedKey } from '@/lib/demoMode'
import { migrateLegacyWorkspaceKeys } from '@/lib/workspaceKeyMigration'

const RECENTS = 'premed_hq_command_recents'
const DISCLOSURE = 'premed-os:ai-study-source-disclosure:v1'
const CAPABILITIES = 'premedos.shared-syllabus.capabilities.v1'
const SYNC_PREFIX = 'premed-os:ai-study-source-sync:v1:'

function signInAs(userId: string) {
  localStorage.setItem(ACTIVE_WORKSPACE_OWNER_KEY, `account:${userId}`)
}

describe('legacy workspace key adoption', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('adopts pre-namespacing caches into the guest workspace that opens first', () => {
    localStorage.setItem(RECENTS, JSON.stringify(['academics']))
    localStorage.setItem(DISCLOSURE, 'accepted')
    localStorage.setItem(CAPABILITIES, JSON.stringify({ version: 1, records: [{ candidateId: 'c1', capability: 'read' }] }))

    const result = migrateLegacyWorkspaceKeys()

    expect(result.adopted).toEqual([RECENTS, CAPABILITIES, DISCLOSURE])
    expect(localStorage.getItem(workspaceScopedKey(DISCLOSURE))).toBe('accepted')
    expect(localStorage.getItem(workspaceScopedKey(RECENTS))).toBe(JSON.stringify(['academics']))
    expect(JSON.parse(localStorage.getItem(workspaceScopedKey(CAPABILITIES))!).records).toHaveLength(1)
  })

  it('adopts into the signed-in account namespace when an account is active', () => {
    signInAs('user-a')
    localStorage.setItem(DISCLOSURE, 'accepted')

    migrateLegacyWorkspaceKeys()

    expect(localStorage.getItem('premed-os:ai-study-source-disclosure:v1:account:user-a')).toBe('accepted')
  })

  it('removes the legacy key so a second account cannot inherit the first one’s consent', () => {
    signInAs('user-a')
    localStorage.setItem(DISCLOSURE, 'accepted')
    migrateLegacyWorkspaceKeys()
    expect(localStorage.getItem(DISCLOSURE)).toBeNull()

    signInAs('user-b')
    migrateLegacyWorkspaceKeys()

    expect(localStorage.getItem('premed-os:ai-study-source-disclosure:v1:account:user-b')).toBeNull()
  })

  it('never overwrites a choice already made in the scoped workspace', () => {
    // The student used this workspace after the upgrade and declined. A stale
    // pre-upgrade "accepted" must not silently re-grant that consent.
    localStorage.setItem(DISCLOSURE, 'accepted')
    localStorage.setItem(workspaceScopedKey(DISCLOSURE), 'declined')

    migrateLegacyWorkspaceKeys()

    expect(localStorage.getItem(workspaceScopedKey(DISCLOSURE))).toBe('declined')
    expect(localStorage.getItem(DISCLOSURE)).toBeNull()
  })

  it('is idempotent and leaves unrelated keys alone', () => {
    localStorage.setItem(RECENTS, JSON.stringify(['mcat']))
    localStorage.setItem('hq:app-data', '{"state":{}}')

    expect(migrateLegacyWorkspaceKeys().adopted).toEqual([RECENTS])
    expect(migrateLegacyWorkspaceKeys().adopted).toEqual([])

    expect(localStorage.getItem(workspaceScopedKey(RECENTS))).toBe(JSON.stringify(['mcat']))
    expect(localStorage.getItem('hq:app-data')).toBe('{"state":{}}')
  })

  it('purges unreachable old-shape sync entries without touching scoped ones', () => {
    // The sync cache key changed shape as well as prefix, so old entries are
    // invisible to `clearStudySourceSyncCache` and would accumulate forever.
    const legacyEntry = `${SYNC_PREFIX}course-1:topic-1`
    const scopedEntry = `${workspaceScopedKey(SYNC_PREFIX)}:course-1:topic-1`
    localStorage.setItem(legacyEntry, 'fingerprint-old')
    localStorage.setItem(scopedEntry, 'fingerprint-new')

    expect(migrateLegacyWorkspaceKeys().purgedSyncEntries).toBe(1)

    expect(localStorage.getItem(legacyEntry)).toBeNull()
    expect(localStorage.getItem(scopedEntry)).toBe('fingerprint-new')
  })
})

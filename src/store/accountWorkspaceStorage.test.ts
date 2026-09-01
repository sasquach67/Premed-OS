import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import {
  ACCOUNT_STORAGE_PREFIX,
  ACTIVE_WORKSPACE_OWNER_KEY,
  GUEST_STORAGE_KEY,
  REAL_STORAGE_KEY,
  activeWorkspaceOwner,
} from '@/lib/demoMode'
import {
  activateAccountWorkspace,
  activateGuestWorkspace,
  snapshotData,
  useStore,
} from '@/store/store'

function workspace(name: string, courseId: string) {
  const data = createPersonalInitialData()
  data.profile.name = name
  data.courses.push({
    id: courseId,
    term: 'Fall 2026',
    code: courseId.toUpperCase(),
    title: `${name}'s course`,
    credits: 3,
    grade: '',
    bcpm: false,
    status: 'planned',
    inResidence: true,
    satisfies: [],
    order: 0,
  })
  return data
}

describe('account-scoped browser workspaces', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.persist.setOptions({ name: GUEST_STORAGE_KEY })
    activateGuestWorkspace()
  })

  afterEach(() => {
    localStorage.clear()
    useStore.persist.setOptions({ name: GUEST_STORAGE_KEY })
    activateGuestWorkspace()
  })

  it('restores Account A after switching A → B → A and keeps Guest separate', () => {
    const guest = workspace('Guest student', 'guest-101')
    useStore.getState().replaceAll(guest)

    activateAccountWorkspace('account-a', workspace('Account A', 'a-101'))
    expect(snapshotData().profile.name).toBe('Account A')

    activateAccountWorkspace('account-b', workspace('Account B', 'b-101'))
    expect(snapshotData().profile.name).toBe('Account B')
    expect(snapshotData().courses.map((course) => course.id)).toEqual(['b-101'])

    activateAccountWorkspace('account-a')
    expect(snapshotData().profile.name).toBe('Account A')
    expect(snapshotData().courses.map((course) => course.id)).toEqual(['a-101'])

    activateGuestWorkspace()
    expect(snapshotData().profile.name).toBe('Guest student')
    expect(snapshotData().courses.map((course) => course.id)).toEqual(['guest-101'])
  })

  it('does not assign the legacy hq:app-data workspace to a new account', () => {
    localStorage.removeItem(ACTIVE_WORKSPACE_OWNER_KEY)
    localStorage.setItem(REAL_STORAGE_KEY, JSON.stringify({ state: workspace('Legacy owner', 'legacy-101'), version: 39 }))
    expect(activeWorkspaceOwner()).toEqual({ kind: 'legacy' })

    activateAccountWorkspace('new-account', workspace('New account', 'new-101'))

    expect(localStorage.getItem(REAL_STORAGE_KEY)).toContain('Legacy owner')
    expect(localStorage.getItem(`${ACCOUNT_STORAGE_PREFIX}new-account`)).toContain('New account')
  })
})

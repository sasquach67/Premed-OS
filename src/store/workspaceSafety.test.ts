/* Dangerous-path coverage: the flows that can lose a student's work.
 *
 * Every test here stands in for a way somebody's records could quietly
 * disappear — a workspace switch adopting the wrong tree, a reset clearing
 * more than the open namespace, a migration re-running on data it already
 * transformed, or a class delete taking prior credit with it. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import {
  ACTIVE_WORKSPACE_OWNER_KEY, GUEST_STORAGE_KEY,
  accountStorageKey, activeWorkspaceOwner, workspaceScopedKey,
} from '@/lib/demoMode'
import { removeCourseCascade } from '@/lib/academics/removeCourseCascade'
import {
  CURRENT_STORE_VERSION, activateAccountWorkspace, activateGuestWorkspace,
  snapshotData, useStore,
} from '@/store/store'
import type { AppData } from '@/lib/types'

const DISCLOSURE = 'premed-os:ai-study-source-disclosure:v1'

function workspace(name: string, courseId: string): AppData {
  const data = createPersonalInitialData()
  data.profile.name = name
  data.courses.push({
    id: courseId, term: 'Fall 2026', code: courseId.toUpperCase(), title: `${name}'s course`,
    credits: 3, grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0,
  })
  return data
}

/** Write a persisted blob the way zustand's `persist` does, at a chosen version. */
function persistAt(storageKey: string, data: AppData, version: number) {
  localStorage.setItem(storageKey, JSON.stringify({ state: data, version }))
}

describe('workspace switching keeps each namespace whole', () => {
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

  it('round-trips Account A → B → A without leaking records between them', () => {
    activateAccountWorkspace('account-a', workspace('Account A', 'a-101'))
    activateAccountWorkspace('account-b', workspace('Account B', 'b-101'))
    activateAccountWorkspace('account-a')

    expect(snapshotData().profile.name).toBe('Account A')
    expect(snapshotData().courses.map((course) => course.id)).toEqual(['a-101'])
  })

  it('keeps Guest work out of an account and the account out of Guest', () => {
    useStore.getState().replaceAll(workspace('Guest student', 'guest-101'))
    activateAccountWorkspace('account-a', workspace('Account A', 'a-101'))

    expect(snapshotData().courses.map((course) => course.id)).toEqual(['a-101'])

    activateGuestWorkspace()

    expect(snapshotData().profile.name).toBe('Guest student')
    expect(snapshotData().courses.map((course) => course.id)).toEqual(['guest-101'])
    expect(activeWorkspaceOwner()).toEqual({ kind: 'guest' })
  })

  it('opens a record-free workspace for an account this browser has never seen', () => {
    useStore.getState().replaceAll(workspace('Guest student', 'guest-101'))
    activateAccountWorkspace('brand-new-account')

    // The signed-out tree must not appear under a signed-in identity.
    expect(snapshotData().courses).toEqual([])
    expect(snapshotData().profile.name).toBe('')
  })

  it('adopts a legacy unscoped cache into whichever workspace opens first, once', () => {
    localStorage.setItem(DISCLOSURE, 'accepted')

    activateAccountWorkspace('account-a', workspace('Account A', 'a-101'))
    expect(localStorage.getItem(workspaceScopedKey(DISCLOSURE))).toBe('accepted')

    activateAccountWorkspace('account-b', workspace('Account B', 'b-101'))
    expect(localStorage.getItem(workspaceScopedKey(DISCLOSURE))).toBeNull()
  })
})

describe('persisted workspace version gates migrations', () => {
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

  /** `termReports` is added by a migration, so its presence shows whether the
   *  migration chain ran on this read. */
  function withoutTermReports(name: string) {
    const data = workspace(name, 'x-101')
    delete (data.academics.classCenter as Partial<typeof data.academics.classCenter>).termReports
    return data
  }

  it('runs the migration chain when the stored workspace is behind', () => {
    persistAt(accountStorageKey('old-account'), withoutTermReports('Old'), 1)

    activateAccountWorkspace('old-account')

    expect(snapshotData().academics.classCenter.termReports).toEqual([])
  })

  it('does not re-run migrations on a workspace already at the current version', () => {
    persistAt(accountStorageKey('current-account'), withoutTermReports('Current'), CURRENT_STORE_VERSION)

    activateAccountWorkspace('current-account')

    // Untouched: the gate skipped a chain that had already been applied.
    expect(snapshotData().academics.classCenter.termReports).toBeUndefined()
    expect(snapshotData().profile.name).toBe('Current')
  })

  it('migrates a pre-versioning workspace that stored no version at all', () => {
    const data = withoutTermReports('Unversioned')
    localStorage.setItem(accountStorageKey('unversioned'), JSON.stringify({ state: data }))

    activateAccountWorkspace('unversioned')

    expect(snapshotData().academics.classCenter.termReports).toEqual([])
  })

  it('reads a workspace from a newer build as-is rather than migrating backwards', () => {
    persistAt(accountStorageKey('future'), withoutTermReports('Future'), CURRENT_STORE_VERSION + 5)

    activateAccountWorkspace('future')

    expect(snapshotData().profile.name).toBe('Future')
    expect(snapshotData().academics.classCenter.termReports).toBeUndefined()
  })
})

describe('reset all data', () => {
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

  it('empties the open workspace', () => {
    useStore.getState().replaceAll(workspace('Guest student', 'guest-101'))

    useStore.getState().resetToSeed()

    expect(snapshotData().courses).toEqual([])
    expect(snapshotData().profile.name).toBe('')
  })

  it('does not reach into another account’s stored workspace', () => {
    activateAccountWorkspace('account-a', workspace('Account A', 'a-101'))
    activateGuestWorkspace()
    useStore.getState().replaceAll(workspace('Guest student', 'guest-101'))

    useStore.getState().resetToSeed()

    expect(snapshotData().courses).toEqual([])
    // Account A's namespace is a different key and must survive the reset.
    activateAccountWorkspace('account-a')
    expect(snapshotData().courses.map((course) => course.id)).toEqual(['a-101'])
  })

  it('leaves the active-owner pointer intact so reset is not a sign-out', () => {
    activateAccountWorkspace('account-a', workspace('Account A', 'a-101'))

    useStore.getState().resetToSeed()

    expect(localStorage.getItem(ACTIVE_WORKSPACE_OWNER_KEY)).toBe('account:account-a')
  })
})

describe('class deletion and what can be recovered', () => {
  function centerWithCourse() {
    const data = createPersonalInitialData()
    const center = data.academics.classCenter
    center.workspaces.push({
      id: 'ws-1', courseId: 'course-1', type: 'stem', instructor: '', meetingDays: '', meetingTime: '',
      location: '', createdAt: 1, updatedAt: 1,
    } as unknown as (typeof center.workspaces)[number])
    center.topics.push({
      id: 'topic-1', courseId: 'course-1', title: 'Transcription', status: 'not-started',
      createdAt: 1, updatedAt: 1, order: 0,
    } as unknown as (typeof center.topics)[number])
    center.transcriptRecords.push({
      id: 'prior-credit', institution: 'UNC', courseNumberExact: 'AP', titleExact: 'Prior credit',
      creditsExact: '3', gradeExact: 'TR', term: '', year: '', courseType: 'transfer',
      createdAt: 1, updatedAt: 1, order: 0,
    })
    return { data, center }
  }

  it('archiving is the reversible path and keeps every record', () => {
    const { center } = centerWithCourse()
    const target = center.workspaces.find((item) => item.courseId === 'course-1')!

    target.status = 'archived'
    expect(center.topics.filter((item) => item.courseId === 'course-1')).toHaveLength(1)

    target.status = 'active'
    expect(center.workspaces.find((item) => item.courseId === 'course-1')?.status).toBe('active')
    expect(center.topics.filter((item) => item.courseId === 'course-1')).toHaveLength(1)
  })

  it('deleting is irreversible in the model and returns the device blobs to clean up', () => {
    const { center } = centerWithCourse()
    center.files.push({
      id: 'file-1', courseId: 'course-1', title: 'Syllabus', type: 'syllabus', sourceType: 'upload',
      url: '', blobRef: 'idb://academics/syllabus/file-1', notes: '', linkedTopicIds: [],
      owner: 'course', createdAt: 1, updatedAt: 1, order: 0,
    })

    const removed = removeCourseCascade(center, 'course-1')

    expect(removed.blobRefs).toContain('idb://academics/syllabus/file-1')
    expect(center.workspaces.some((item) => item.courseId === 'course-1')).toBe(false)
    expect(center.topics.some((item) => item.courseId === 'course-1')).toBe(false)
    // There is no undo buffer and no soft-delete: nothing in the model can
    // bring this class back. Archive is the only reversible path, which is why
    // the delete control must stay behind an explicit confirmation.
    expect(center.workspaces).toHaveLength(0)
  })

  it('never takes prior transcript credit with the deleted class', () => {
    const { center } = centerWithCourse()

    removeCourseCascade(center, 'course-1')

    expect(center.transcriptRecords.map((item) => item.id)).toEqual(['prior-credit'])
  })
})

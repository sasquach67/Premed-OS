import { describe, expect, it } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import {
  ACCOUNT_WORKSPACE_READY_EVENT,
  applyFirstLoginSetup,
  buildFirstAccountWorkspace,
  decideAccountRoute,
  decideCloudReconcile,
  destinationAfterFirstLogin,
  FIRST_LOGIN_STUDY_ROUTE,
  hasCompletedAccountSetup,
  notifyAccountWorkspaceReady,
  profileDefaultsFromIdentity,
} from '@/lib/accountWorkspace'
import { hasLocalWork } from '@/lib/publicLayer'

describe('account workspace isolation', () => {
  it('never treats a missing cloud row as permission to seed from the open device workspace', () => {
    expect(decideCloudReconcile({ hasRemote: false, knownAt: 0, remoteAt: 0 })).toBe('requires-setup')
  })

  it('builds Eric from a clean root rather than inheriting Andy or Andy records', () => {
    const unrelatedLocal = createPersonalInitialData()
    unrelatedLocal.profile.name = 'Andy Quach'
    unrelatedLocal.profile.email = 'andy@example.com'
    unrelatedLocal.courses.push({
      id: 'andy-course', term: 'Fall 2026', code: 'BIOL 101', title: 'Biology', credits: 3,
      grade: '', bcpm: true, status: 'planned', inResidence: true, satisfies: [], order: 0,
    })

    const account = buildFirstAccountWorkspace({
      identity: { email: 'eric@example.com', metadata: { full_name: 'Eric Quach' } },
      setup: { name: 'Eric Quach', school: 'UNC Chapel Hill', major: 'Neuroscience', classYear: '2030' },
    })

    expect(account.profile).toMatchObject({
      name: 'Eric Quach', email: 'eric@example.com', school: 'UNC Chapel Hill',
      major: 'Neuroscience', classYear: '2030',
    })
    expect(account.courses).toEqual([])
    expect(account.tasks).toEqual([])
    expect(account).not.toEqual(unrelatedLocal)
  })

  it('prefills identity from OAuth metadata without trusting it for authorization', () => {
    expect(profileDefaultsFromIdentity({
      email: 'eric.quach@example.com',
      metadata: { full_name: 'Eric Quach', avatar_url: 'https://example.com/eric.png' },
    })).toEqual({ name: 'Eric Quach', email: 'eric.quach@example.com' })
  })

  it('routes a new account through setup before any local merge decision', () => {
    expect(decideAccountRoute({
      pathname: '/', hasRemote: false, hasLocalWork: true, hasSeenMerge: false,
    })).toBe('/auth/setup')
    expect(decideAccountRoute({
      pathname: '/', hasRemote: true, hasLocalWork: true, hasSeenMerge: false,
    })).toBe('/auth/merge')
  })

  it('routes an existing but unpersonalized account through first-login setup', () => {
    expect(decideAccountRoute({
      pathname: '/', hasRemote: true, hasCompletedSetup: false,
      hasLocalWork: false, hasSeenMerge: false,
    })).toBe('/auth/setup')
  })

  it('recognizes setup only when the profile belongs to the signed-in identity', () => {
    const account = createPersonalInitialData()
    account.profile = { ...account.profile, name: 'Andy', email: 'andy@example.com' }
    expect(hasCompletedAccountSetup(account, { email: 'andy@example.com' })).toBe(true)
    expect(hasCompletedAccountSetup(account, { email: 'eric@example.com' })).toBe(false)
    account.profile.name = ''
    expect(hasCompletedAccountSetup(account, { email: 'andy@example.com' })).toBe(false)
  })

  it('personalizes an existing account without deleting its records', () => {
    const existing = createPersonalInitialData()
    existing.tasks.push({
      id: 'keep-me', title: 'Keep this task', type: 'Personal', progress: 'Not started',
      kanban: 'todo', archived: false, order: 0,
    })
    const result = applyFirstLoginSetup({
      existing,
      identity: { email: 'elephon08@gmail.com' },
      setup: { name: 'Andy Quach', school: 'UNC Chapel Hill', major: 'Neuroscience', classYear: '2030' },
    })
    expect(result.profile).toMatchObject({ name: 'Andy Quach', email: 'elephon08@gmail.com' })
    expect(result.tasks).toEqual(existing.tasks)
  })

  it('opens How to study after first login, including after a merge review', () => {
    expect(destinationAfterFirstLogin(true, '/')).toBe(FIRST_LOGIN_STUDY_ROUTE)
    expect(destinationAfterFirstLogin(false, '/settings?tab=data')).toBe('/settings?tab=data')
  })

  it('protects profile-only guest work instead of treating it as an empty browser', () => {
    const local = createPersonalInitialData()
    expect(hasLocalWork(local)).toBe(false)
    local.profile.name = 'Local student'
    expect(hasLocalWork(local)).toBe(true)
  })

  it('announces exactly which account finished setup or reviewed merge', () => {
    let readyFor = ''
    const listener = (event: Event) => {
      readyFor = (event as CustomEvent<{ userId: string }>).detail.userId
    }
    window.addEventListener(ACCOUNT_WORKSPACE_READY_EVENT, listener)
    notifyAccountWorkspaceReady('account-eric')
    window.removeEventListener(ACCOUNT_WORKSPACE_READY_EVENT, listener)
    expect(readyFor).toBe('account-eric')
  })
})

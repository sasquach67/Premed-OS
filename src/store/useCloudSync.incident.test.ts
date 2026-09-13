// Isolated synthetic incident probe. No real browser or remote connections.
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

const transport = vi.hoisted(() => ({
  listener: undefined as undefined | ((event: string, session: unknown) => void),
  remote: undefined as unknown,
  upsert: vi.fn(async () => ({ error: null })),
}))
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  authRedirectTo: 'http://localhost/#/auth',
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (listener: typeof transport.listener) => {
        transport.listener = listener
        return { data: { subscription: { unsubscribe() {} } } }
      },
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: transport.remote, error: null }) }) }),
      upsert: transport.upsert,
    }),
  },
}))
vi.mock('@/store/workspaceRecoveryRepository', () => {
  const copies = new Map<string, unknown>()
  return { workspaceRecoveryRepository: () => ({ latest: async () => null, save: async (value: { id: string }) => { copies.set(value.id, value) }, read: async (_key: string, id: string) => copies.get(id) }) }
})
vi.mock('@/lib/academics/sharedMaterialFiles', () => ({ syncAcademicOriginals: vi.fn(async () => undefined) }))

import { createPersonalInitialData } from '@/data/personalInitialData'
import { accountStorageKey, activeWorkspaceOwner } from '@/lib/demoMode'
import { activateAccountWorkspace, activateGuestWorkspace, snapshotData, useStore } from '@/store/store'
import { readStoredWorkspace } from '@/store/storageHealth'
import { useCloudSync } from '@/store/useCloudSync'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

it('retains newer account work through gate sign-out then same-account re-login against an older sparse cloud row', async () => {
  localStorage.clear()
  const account = 'synthetic-incident-account-a'
  const local = createPersonalInitialData()
  local.profile.name = 'Synthetic student'
  local.profile.email = 'synthetic@example.invalid'
  local.notes['synthetic-newer-note'] = 'Newer work saved only on this device'
  local.courses.push({ id: 'synthetic-course', term: 'Fall 2026', code: 'TEST101', title: 'Synthetic class', credits: 3, grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0 })
  activateAccountWorkspace(account, local)
  localStorage.setItem('premed_hq_cloud_meta', JSON.stringify({ userId: account, lastSyncAt: Date.parse('2026-09-12T22:00:00Z') }))
  const savedBefore = localStorage.getItem(accountStorageKey(account))
  const remote = createPersonalInitialData()
  remote.profile = { ...remote.profile, name: local.profile.name, email: local.profile.email }
  transport.remote = { data: remote, updated_at: '2026-09-11T22:00:00Z' }

  // AuthPage gate's successful Sign out calls exactly this store action.
  activateGuestWorkspace()
  expect(activeWorkspaceOwner()).toEqual({ kind: 'guest' })
  expect(localStorage.getItem(accountStorageKey(account))).toBe(savedBefore)

  const container = document.createElement('div')
  const root = createRoot(container)
  let latestCloud: ReturnType<typeof useCloudSync>
  function Probe() { latestCloud = useCloudSync(); return null }
  try {
    await act(async () => root.render(createElement(Probe)))
    await act(async () => transport.listener?.('SIGNED_IN', { user: { id: account, email: local.profile.email } }))
    await vi.waitFor(async () => { await act(async () => {}); expect(latestCloud.status).not.toBe('syncing') }, { interval: 1 })
    const durable = JSON.parse(readStoredWorkspace(localStorage, accountStorageKey(account))!).state
    expect.soft(snapshotData().courses.map(c => c.id)).toContain('synthetic-course')
    expect.soft(durable.courses.map((c: { id: string }) => c.id)).toContain('synthetic-course')
    expect(durable.notes['synthetic-newer-note']).toBe('Newer work saved only on this device')
  } finally {
    await act(async () => root.unmount())
    useStore.persist.setOptions({ name: 'synthetic-cleanup' })
  }
})

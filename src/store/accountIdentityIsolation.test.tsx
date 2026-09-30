import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { accountStorageKey, activeWorkspaceOwner } from '@/lib/demoMode'
import { decideAccountRoute } from '@/lib/accountWorkspace'
import { claimedRow } from '@/test/fakeDashboards'

// These tests characterize app behavior after Auth supplies a UUID. They do not
// simulate or assert Supabase's server-side identity-linking decision.
const wire = vi.hoisted(() => ({
  listeners: new Set<(event: string, session: unknown) => void>(),
  rows: new Map<string, unknown>(),
  writes: vi.fn(),
}))
vi.mock('@/lib/supabase', async () => {
  const { fakeDashboardsTable } = await import('@/test/fakeDashboards')
  return {
    isSupabaseConfigured: true,
    authRedirectTo: 'https://synthetic.invalid/',
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
          wire.listeners.add(listener)
          return { data: { subscription: { unsubscribe: () => wire.listeners.delete(listener) } } }
        },
      },
      from: () => fakeDashboardsTable(wire),
    },
  }
})
vi.mock('@/lib/academics/sharedMaterialFiles', () => ({ syncAcademicOriginals: vi.fn(async () => undefined) }))

let root: Root
let cloud: ReturnType<typeof import('./useCloudSync').useCloudSync>
let store: typeof import('./store')
let disk: ReturnType<typeof import('./workspacePersistence').workspacePersistence>

beforeEach(async () => {
  vi.resetModules()
  localStorage.clear(); sessionStorage.clear()
  wire.listeners.clear(); wire.rows.clear(); wire.writes.mockClear()
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('No network is allowed in synthetic identity tests') }))
  const browser = new Proxy(navigator, {
    get: (target, property) => property === 'storage'
      ? { persisted: async () => true, persist: vi.fn() }
      : Reflect.get(target, property, target),
  })
  vi.stubGlobal('navigator', browser)
  await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
  disk = (await import('./workspacePersistence')).workspacePersistence()
  store = await import('./store')
  await disk!.flush('hq:app-data:guest')
  root = createRoot(document.createElement('div'))
  const { useCloudSync } = await import('./useCloudSync')
  function Probe() {
    const value = useCloudSync()
    useEffect(() => { cloud = value }, [value])
    return null
  }
  await act(async () => root.render(<Probe />))
})

afterEach(async () => {
  await act(async () => root.unmount())
  disk?.repository.close()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function session(id: string | null, provider = 'email') {
  await act(async () => {
    for (const listener of wire.listeners) listener(id ? 'SIGNED_IN' : 'SIGNED_OUT', id ? {
      user: { id, email: 'synthetic@example.invalid', app_metadata: { provider } },
    } : null)
  })
  await vi.waitFor(async () => {
    await act(async () => {})
    expect(cloud.status).not.toBe('syncing')
  }, { interval: 1 })
}

function remoteWorkspace(note: string) {
  const data = createPersonalInitialData()
  data.profile.name = 'Synthetic student'
  data.profile.email = 'synthetic@example.invalid'
  data.notes.example = note
  return claimedRow(data as unknown as Record<string, unknown>, '2026-09-30T12:00:00.000Z')
}

it('keeps a different Google UUID empty and restores the email UUID without writing either cloud row', async () => {
  const emailId = 'synthetic-email-owner', googleId = 'synthetic-google-owner'
  const remote = remoteWorkspace('Saved under the email account')
  wire.rows.set(emailId, remote)
  await session(googleId, 'google')

  expect(cloud.user?.id).toBe(googleId)
  expect(cloud.accountReady).toBe(false)
  expect(store.snapshotData().notes.example).toBeUndefined()
  expect(disk!.read(accountStorageKey(googleId))).toBeNull()
  expect(wire.rows.has(googleId)).toBe(false)
  expect(decideAccountRoute({ pathname: '/', hasRemote: false, hasLocalWork: false, hasSeenMerge: false })).toBe('/onboarding')
  await act(async () => { expect(await cloud.pushNow()).toBe(false) })
  expect(wire.writes).not.toHaveBeenCalled()

  await session(null)
  await session(emailId, 'email')
  await disk!.flush(accountStorageKey(emailId))
  expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: emailId })
  expect(store.snapshotData().notes.example).toBe('Saved under the email account')
  expect(JSON.parse(disk!.read(accountStorageKey(emailId))!).state.notes.example).toBe('Saved under the email account')
  expect(cloud.accountReady).toBe(true)
  expect(wire.rows.get(emailId)).toEqual(remote)
  expect(wire.writes).not.toHaveBeenCalled()
})

it('reopens the same IndexedDB workspace when Google and email sessions share one UUID', async () => {
  const id = 'synthetic-linked-owner'
  wire.rows.set(id, remoteWorkspace('One account shared by both methods'))
  await session(id, 'google')
  await disk!.flush(accountStorageKey(id))
  const pointer = localStorage.getItem(accountStorageKey(id))
  expect(cloud.accountReady).toBe(true)
  await session(null)
  await session(id, 'email')
  await disk!.flush(accountStorageKey(id))

  expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: id })
  expect(localStorage.getItem(accountStorageKey(id))).toBe(pointer)
  expect(store.snapshotData().notes.example).toBe('One account shared by both methods')
  expect(cloud.accountReady).toBe(true)
  expect(wire.writes).not.toHaveBeenCalled()
})

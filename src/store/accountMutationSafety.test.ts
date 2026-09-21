import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import type { AppData } from '@/lib/types'
import type { WorkspaceRecoverySnapshot } from './workspaceRecoveryRepository'
import { accountStorageKey } from '@/lib/demoMode'
import { ACCOUNT_WORKSPACE_READY_EVENT } from '@/lib/accountWorkspace'
import { activateAccountWorkspace, activateGuestWorkspace, CURRENT_STORE_VERSION, snapshotData, useStore } from './store'
import { allowAccountSync, getAccountConflict, isAccountSyncReady, observeSyncSession, preserveAccountConflict, pauseAccountSync } from './accountSyncSafety'
import { accountMutationFailure, prepareAccountMutation, restoreWorkspaceFromSource, prepareAccountConflictResolution } from './accountMutationSafety'

const fake = vi.hoisted(() => ({
  userId: null as string | null,
  remote: null as AppData | null,
  revision: '2026-09-12T00:00:00.000Z',
  writes: [] as Array<{ user_id: string; data: AppData; updated_at: string }>,
  listeners: new Set<(event: string, session: { user: { id: string } } | null) => void>(),
  snapshots: new Map<string, WorkspaceRecoverySnapshot>(),
  failArchive: false,
  transientWrites: 0,
  corruptRead: false,
  afterArchive: undefined as (() => void) | undefined,
  beforeWrite: undefined as (() => void) | undefined,
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: fake.userId ? { user: { id: fake.userId } } : null }, error: null }),
      onAuthStateChange: (listener: (event: string, session: { user: { id: string } } | null) => void) => {
        fake.listeners.add(listener)
        return { data: { subscription: { unsubscribe: () => fake.listeners.delete(listener) } } }
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: fake.remote ? { data: fake.remote, updated_at: fake.revision } : null, error: null }) }) }),
      update: (row: { user_id: string; data: AppData; updated_at: string }) => {
        const filters: Record<string, string> = {}
        const query = {
          eq: (key: string, value: string) => { filters[key] = value; return query },
          select: () => query,
          maybeSingle: async () => {
            if (fake.transientWrites > 0) { fake.transientWrites--; return { data: null, status: 500, error: { message: 'Temporary server failure' } } }
            if (filters.updated_at !== fake.revision) return { data: null, error: null }
            fake.beforeWrite?.()
            fake.writes.push(row); fake.remote = row.data; fake.revision = row.updated_at.replace('Z', '+00:00')
            return { data: { user_id: row.user_id }, error: null }
          },
        }
        return query
      },
      insert: async (row: { user_id: string; data: AppData; updated_at: string }) => {
        if (fake.remote) return { error: new Error('Account already exists') }
        fake.beforeWrite?.()
        fake.writes.push(row); fake.remote = row.data; fake.revision = row.updated_at.replace('Z', '+00:00')
        return { error: null }
      },
    }),
  },
  isSupabaseConfigured: true,
}))
vi.mock('./workspaceRecoveryRepository', () => ({
  workspaceRecoveryRepository: () => ({
    save: async (snapshot: WorkspaceRecoverySnapshot) => {
      if (fake.failArchive) throw new Error('Recovery storage unavailable')
      fake.snapshots.set(`${snapshot.workspaceKey}:${snapshot.id}`, structuredClone(snapshot))
      fake.afterArchive?.()
    },
    read: async (key: string, id: string) => {
      const saved = fake.snapshots.get(`${key}:${id}`)
      return saved ? { ...saved, stored: fake.corruptRead ? 'corrupt' : saved.stored } : null
    },
  }),
}))

let sequence = 0
function data(name: string) { const value = createPersonalInitialData(); value.profile.name = name; return value }
function setAuth(id: string | null) {
  fake.userId = id
  for (const listener of fake.listeners) listener(id ? 'SIGNED_IN' : 'SIGNED_OUT', id ? { user: { id } } : null)
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto)
  localStorage.clear(); sessionStorage.clear()
  fake.userId = `mutation-synthetic-${++sequence}`
  fake.remote = data('Reviewed cloud')
  fake.revision = '2026-09-12T00:00:00.000Z'
  fake.writes.length = 0; fake.snapshots.clear(); fake.listeners.clear()
  fake.failArchive = false; fake.corruptRead = false; fake.transientWrites = 0
  fake.afterArchive = undefined; fake.beforeWrite = undefined
  observeSyncSession(null)
  activateGuestWorkspace()
  useStore.getState().replaceAll(data('Guest copy'))
  await useStore.persist.rehydrate()
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); fake.listeners.clear() })

it('preserves divergent cached account and cloud before rejecting a public-page write', async () => {
  const id = fake.userId!, local = data('Newer account data')
  activateAccountWorkspace(id, local); activateGuestWorkspace()
  const key = accountStorageKey(id), raw = localStorage.getItem(key)
  await expect(prepareAccountMutation(id, fake.remote)).rejects.toThrow('copies need review')
  expect(fake.writes).toHaveLength(0)
  expect(localStorage.getItem(key)).toBe(raw)
  expect(getAccountConflict(id)).toMatchObject({ localRaw: raw, saved: true })
  expect(fake.snapshots.size).toBe(2)
  expect(fake.listeners.size).toBe(0)
})

it('does not treat a missing remote row as permission to replace an existing account', async () => {
  const id = fake.userId!
  activateAccountWorkspace(id, data('Saved account')); activateGuestWorkspace()
  fake.remote = null
  await expect(prepareAccountMutation(id, null)).rejects.toThrow('copies need review')
  expect(fake.writes).toHaveLength(0)
  expect(getAccountConflict(id)?.saved).toBe(true)
})

it.each(['archive', 'readback'] as const)('blocks all writes on failed recovery %s', async failure => {
  fake.failArchive = failure === 'archive'; fake.corruptRead = failure === 'readback'
  const before = JSON.stringify(snapshotData())
  await expect(prepareAccountMutation(fake.userId!, fake.remote)).rejects.toThrow()
  expect(fake.writes).toHaveLength(0)
  expect(JSON.stringify(snapshotData())).toBe(before)
})

it('keeps unresolved conflicts blocked on subsequent attempts', async () => {
  const id = fake.userId!
  activateAccountWorkspace(id, data('Local')); activateGuestWorkspace()
  await expect(prepareAccountMutation(id, fake.remote)).rejects.toThrow()
  const load = vi.fn(async () => data('Restore'))
  await expect(restoreWorkspaceFromSource(load)).rejects.toThrow('copies need review')
  expect(load).not.toHaveBeenCalled()
})

it('preserves verified copies and accepts a reviewed conditional update durably', async () => {
  const mutation = await prepareAccountMutation(fake.userId!, fake.remote, snapshotData())
  expect(fake.snapshots.size).toBe(2)
  for (const copy of fake.snapshots.values()) {
    if (copy.workspaceKey.endsWith(':before-explicit-cloud-write')) expect(JSON.parse(copy.stored)).not.toHaveProperty('version')
  }
  expect(fake.writes).toHaveLength(0)
  const next = data('Explicit reviewed result')
  await mutation.write(next)
  mutation.activate(next)
  expect(mutation.serverSaved).toBe(true)
  expect(snapshotData().profile.name).toBe(next.profile.name)
  expect(JSON.parse(localStorage.getItem(accountStorageKey(fake.userId!))!).state.profile.name).toBe(next.profile.name)
  mutation.dispose()
})

it('rejects a cloud revision that changed after preservation', async () => {
  const mutation = await prepareAccountMutation(fake.userId!, fake.remote)
  fake.revision = '2026-09-13T00:00:00.000Z'
  await expect(mutation.write(data('Proposal'))).rejects.toThrow('changed before saving')
  expect(fake.writes).toHaveLength(0)
  expect(mutation.serverSaved).toBe(false)
  mutation.dispose()
})

it('rejects account and same-account signout/relogin changes after preservation', async () => {
  const id = fake.userId!, mutation = await prepareAccountMutation(id, fake.remote)
  setAuth(null); setAuth(id)
  await expect(mutation.write(data('Proposal'))).rejects.toThrow('changed')
  expect(fake.writes).toHaveLength(0)
  mutation.dispose()
})

it('fences disk changes while an immutable recovery copy is being saved', async () => {
  fake.afterArchive = () => useStore.getState().update(state => { state.profile.name = 'Concurrent edit' })
  await expect(prepareAccountMutation(fake.userId!, fake.remote)).rejects.toThrow('changed')
  expect(fake.writes).toHaveLength(0)
  expect(snapshotData().profile.name).toBe('Concurrent edit')
})

it('reports a confirmed server write honestly when the account changes before local adoption', async () => {
  const mutation = await prepareAccountMutation(fake.userId!, fake.remote)
  fake.beforeWrite = () => { setAuth('different-synthetic-account'); activateGuestWorkspace() }
  let failure: unknown
  try { await mutation.write(data('Proposal')) } catch (error) { failure = error }
  expect(mutation.serverSaved).toBe(true)
  expect(fake.writes).toHaveLength(1)
  expect(accountMutationFailure(failure, mutation)).toContain('cloud accepted')
  expect(snapshotData().profile.name).toBe('Guest copy')
  mutation.dispose()
})

it('keeps invalid target-account bytes instead of seeding over them', async () => {
  const key = accountStorageKey(fake.userId!), raw = JSON.stringify({ state: {}, version: CURRENT_STORE_VERSION })
  localStorage.setItem(key, raw)
  await expect(prepareAccountMutation(fake.userId!, fake.remote)).rejects.toThrow()
  expect(localStorage.getItem(key)).toBe(raw)
  expect(fake.writes).toHaveLength(0)
})

it.each([false, true])('Settings restore fences a delayed loader (Drive-style: %s)', async keepPrivate => {
  const pending = deferred<AppData>(), entered = deferred<void>()
  const restoring = restoreWorkspaceFromSource(() => { entered.resolve(); return pending.promise }, keepPrivate)
  await entered.promise
  const id = 'other-synthetic-owner'
  setAuth(id); activateAccountWorkspace(id, data('Other owner'))
  pending.resolve(data('Wrong destination'))
  await expect(restoring).rejects.toThrow('changed')
  expect(snapshotData().profile.name).toBe('Other owner')
  expect(fake.writes).toHaveLength(0)
})

it('Settings restore saves only after preserving the previous workspace and input', async () => {
  const owner = useStore.persist.getOptions().name!, before = localStorage.getItem(owner)
  await restoreWorkspaceFromSource(async () => data('Intentional restore'))
  expect(snapshotData().profile.name).toBe('Intentional restore')
  expect([...fake.snapshots.values()].some(copy => copy.workspaceKey === owner && copy.stored === before)).toBe(true)
  expect(fake.snapshots.size).toBe(2)
  expect(fake.writes).toHaveLength(0)
  await useStore.persist.rehydrate()
  expect(snapshotData().profile.name).toBe('Intentional restore')
})

it('a durable Settings account restore requests reconciliation only after saving', async () => {
  activateAccountWorkspace(fake.userId!, data('Account before restore'))
  const ready = vi.fn((event: Event) => {
    expect((event as CustomEvent<{ userId: string }>).detail.userId).toBe(fake.userId)
    const disk = JSON.parse(localStorage.getItem(accountStorageKey(fake.userId!))!)
    expect(disk.state.profile.name).toBe('Confirmed restore')
  })
  window.addEventListener(ACCOUNT_WORKSPACE_READY_EVENT, ready)
  try {
    await restoreWorkspaceFromSource(async () => data('Confirmed restore'))
    expect(ready).toHaveBeenCalledTimes(1)
  } finally { window.removeEventListener(ACCOUNT_WORKSPACE_READY_EVENT, ready) }
})

it('Settings restore does not report success when local persistence rejects the replacement', async () => {
  activateAccountWorkspace(fake.userId!, data('Existing account'))
  allowAccountSync(observeSyncSession(fake.userId!))
  expect(isAccountSyncReady(fake.userId!)).toBe(true)
  const key = useStore.persist.getOptions().name!, before = localStorage.getItem(key), previous = snapshotData()
  const setItem = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name, value) {
    if (this === localStorage && name === key && value.includes('Rejected restore')) throw new DOMException('Synthetic quota', 'QuotaExceededError')
    setItem.call(this, name, value)
  })
  await expect(restoreWorkspaceFromSource(async () => data('Rejected restore'))).rejects.toThrow('could not be confirmed')
  expect(localStorage.getItem(key)).toBe(before)
  expect(snapshotData()).toEqual(previous)
  expect(fake.writes).toHaveLength(0)
  expect(isAccountSyncReady(fake.userId!)).toBe(false)
})

async function pausedReview() {
  const id = fake.userId!
  activateAccountWorkspace(id, data('Device with newer work'))
  const token = observeSyncSession(id)
  await preserveAccountConflict(id, localStorage.getItem(accountStorageKey(id)), fake.remote, token)
  return prepareAccountConflictResolution(id, getAccountConflict(id)!)
}
it('offers a reviewed way out of a conflict and resumes only after device choice is saved', async () => {
  const review = await pausedReview()
  expect(isAccountSyncReady(fake.userId!)).toBe(false)
  expect(fake.writes).toHaveLength(0)
  await review.apply('device')
  expect(fake.remote?.profile.name).toBe('Device with newer work')
  expect(snapshotData().profile.name).toBe('Device with newer work')
  expect(getAccountConflict(fake.userId!)).toBeUndefined()
  expect(isAccountSyncReady(fake.userId!)).toBe(true)
  expect(fake.snapshots.size).toBeGreaterThanOrEqual(4)
  review.dispose()
})
it('uses a reviewed cloud choice without uploading the device copy', async () => {
  const review = await pausedReview()
  await review.apply('cloud')
  expect(fake.writes).toHaveLength(0)
  expect(snapshotData().profile.name).toBe('Reviewed cloud')
  expect(isAccountSyncReady(fake.userId!)).toBe(true)
  review.dispose()
})
it.each(['device', 'cloud'] as const)('rejects stale cloud review for %s choice', async choice => {
  const review = await pausedReview()
  fake.revision = '2026-09-22T00:00:00.000Z'
  await expect(review.apply(choice)).rejects.toThrow('changed')
  expect(fake.writes).toHaveLength(0)
  expect(snapshotData().profile.name).toBe('Device with newer work')
  expect(isAccountSyncReady(fake.userId!)).toBe(false)
  review.dispose()
})
it('rejects edits or a new session after the conflict comparison opened', async () => {
  const review = await pausedReview()
  useStore.getState().update(draft => { draft.profile.name = 'Edited after review' })
  await expect(review.apply('cloud')).rejects.toThrow('changed')
  expect(fake.writes).toHaveLength(0)
  expect(snapshotData().profile.name).toBe('Edited after review')
  review.dispose()
})
it('never replaces either copy when recovery verification fails', async () => {
  fake.failArchive = true
  await expect(pausedReview()).rejects.toThrow()
  expect(fake.writes).toHaveLength(0)
  expect(isAccountSyncReady(fake.userId!)).toBe(false)
})

it('keeps review paused when a sign-out or a newer pause supersedes it', async () => {
  const review = await pausedReview()
  pauseAccountSync(fake.userId!)
  await expect(review.apply('device')).rejects.toThrow('paused')
  expect(fake.writes).toHaveLength(0)
  review.dispose()
  const fresh = await prepareAccountConflictResolution(fake.userId!, getAccountConflict(fake.userId!)!)
  const id = fake.userId!
  setAuth(null); setAuth(id)
  await expect(fresh.apply('cloud')).rejects.toThrow()
  expect(fake.writes).toHaveLength(0)
  fresh.dispose()
})
it('reports server success but does not touch a different active account after a session switch', async () => {
  const review = await pausedReview()
  fake.beforeWrite = () => { setAuth('another-user'); activateGuestWorkspace() }
  await expect(review.apply('device')).rejects.toThrow('cloud accepted')
  expect(fake.writes).toHaveLength(1)
  expect(snapshotData().profile.name).toBe('Guest copy')
  review.dispose()
})
it('can reopen a comparison with fresh cloud data without treating the old review as approval', async () => {
  const old = await pausedReview()
  old.dispose()
  fake.remote = data('New cloud content')
  fake.revision = '2026-09-23T00:00:00.000Z'
  const fresh = await prepareAccountConflictResolution(fake.userId!, getAccountConflict(fake.userId!)!)
  expect(fresh.cloud.profile.name).toBe('New cloud content')
  expect(fake.writes).toHaveLength(0)
  expect(isAccountSyncReady(fake.userId!)).toBe(false)
  fresh.dispose()
})


it('retries the already approved device choice after a temporary server rejection', async () => {
  const review = await pausedReview()
  fake.transientWrites = 1
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const applying = review.apply('device')
  await vi.advanceTimersByTimeAsync(3000)
  await applying
  expect(fake.writes).toHaveLength(1)
  expect(fake.remote?.profile.name).toBe('Device with newer work')
  expect(getAccountConflict(fake.userId!)).toBeUndefined()
  expect(isAccountSyncReady(fake.userId!)).toBe(true)
})

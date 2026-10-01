import { act } from 'react'
import { webcrypto } from 'node:crypto'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import type { AppData } from '@/lib/types'

const wire = vi.hoisted(() => ({
  userId: 'synthetic-refresh', rows: new Map<string, unknown>(), pending: new Map<string, Promise<unknown>>(),
  reads: vi.fn(), writes: vi.fn(), navigate: vi.fn(), readError: undefined as string | undefined,
  listeners: new Set<(event: string, session: { user: { id: string } } | null) => void>(),
}))
vi.mock('@/lib/supabase', async () => {
  const { fakeDashboardsTable } = await import('@/test/fakeDashboards')
  return { isSupabaseConfigured: true, authRedirectTo: 'http://localhost/', supabase: {
    auth: {
      getSession: async () => ({ data: { session: wire.userId ? { user: { id: wire.userId } } : null }, error: null }),
      onAuthStateChange: (listener: (event: string, session: { user: { id: string } } | null) => void) => {
        wire.listeners.add(listener); return { data: { subscription: { unsubscribe: () => wire.listeners.delete(listener) } } }
      },
    },
    from: () => {
      const table = fakeDashboardsTable(wire)
      return { ...table, select: (columns: string) => {
        wire.reads(columns)
        if (wire.readError) return { eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: wire.readError } }) }) }
        return table.select(columns)
      } }
    },
  } }
})
vi.mock('@/components/public/PublicNav', () => ({ PublicNav: () => null }))
vi.mock('@/components/public/PublicShell', () => ({ PublicShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock('react-router-dom', async importOriginal => ({ ...await importOriginal<typeof import('react-router-dom')>(), useNavigate: () => wire.navigate }))

const accountKey = 'hq:app-data:account:synthetic-refresh', guestKey = 'hq:app-data:guest'
const actions = ['Apply and continue', 'Use my account workspace and review this later'] as const
const refreshed = 'Review refreshed. Choose again before continuing.'
let root: Root, container: HTMLDivElement, reviewed: AppData, latest: AppData
let store: typeof import('@/store/store'), disk: NonNullable<ReturnType<typeof import('@/store/workspacePersistence').workspacePersistence>>
let archive: ReturnType<typeof vi.spyOn>, commits: ReturnType<typeof vi.spyOn>
let mutations: Promise<unknown>[]

beforeEach(async () => {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear()
  vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  wire.userId = 'synthetic-refresh'; wire.rows.clear(); wire.pending.clear(); wire.reads.mockClear(); wire.writes.mockClear(); wire.navigate.mockClear(); wire.listeners.clear(); wire.readError = undefined; mutations = []
  const seed = createPersonalInitialData(); seed.meta.lastOpenedAt = 1; seed.profile.name = 'Synthetic device profile'
  seed.tasks = [{ id: 'synthetic-task', title: 'Synthetic device task', type: 'Task', progress: 'Not started', kanban: 'todo', archived: false, order: 0 }]
  seed.notePages = [{ id: 'synthetic-note', title: 'Synthetic note', body: 'Synthetic text', pillar: 'research', updatedAt: 1, order: 0 }]
  seed.mcat.goalScore = 500
  localStorage.setItem('hq:workspace-owner', 'guest')
  localStorage.setItem(guestKey, JSON.stringify({ state: seed, version: 0 }))
  await (await import('@/store/workspaceBootstrap')).initializeDurableWorkspaces()
  store = await import('@/store/store')
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  disk = (await import('@/store/workspacePersistence')).workspacePersistence()!
  await disk.flush(guestKey)
  reviewed = structuredClone(store.snapshotData()); reviewed.profile.name = 'Synthetic earlier account'
  reviewed.requirements = [{ id: 'synthetic-requirement', group: 'Synthetic', label: 'Synthetic prerequisite', done: false, order: 0 }]
  reviewed.experiences = [{ id: 'synthetic-experience', category: 'research', org: 'Synthetic lab', role: 'Synthetic role', description: '', status: 'active', tags: [], order: 0 }]
  reviewed.notePages = []; reviewed.tasks = []; reviewed.mcat.goalScore = 510
  reviewed.schools = [{ id: 'synthetic-school', name: 'Synthetic school', type: 'MD', category: 'target', status: 'researching', order: 0 }]
  latest = structuredClone(reviewed); latest.profile.name = 'Synthetic refreshed account'; latest.meta.lastOpenedAt = 2
  localStorage.setItem(accountKey, JSON.stringify({ state: latest, version: store.CURRENT_STORE_VERSION }))
  await (await import('@/store/workspaceBootstrap')).loadDurableWorkspace(accountKey)
  const { claimedRow } = await import('@/test/fakeDashboards')
  wire.rows.set(wire.userId, claimedRow(reviewed as unknown as Record<string, unknown>, '2026-10-01T00:00:00Z', 1))
  commits = vi.spyOn(disk.repository, 'commit')
  archive = vi.spyOn((await import('@/store/workspaceRecoveryRepository')).workspaceRecoveryRepository(), 'save')
  const safety = await import('@/store/accountMutationSafety'), prepare = safety.prepareAccountMutation
  vi.spyOn(safety, 'prepareAccountMutation').mockImplementation((...args) => {
    const mutation = prepare(...args); mutations.push(mutation); return mutation
  })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  const { MergePage } = await import('@/pages/public/MergePage')
  await act(async () => root.render(<MemoryRouter initialEntries={['/auth/merge']}><MergePage /></MemoryRouter>))
  await waitFor(() => expect(button(actions[0])?.disabled).toBe(false))
})
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); disk.repository.close()
  vi.restoreAllMocks(); vi.unstubAllGlobals()
})
function button(label: string) { return [...container.querySelectorAll('button')].find(element => element.textContent?.trim() === label) }
async function waitFor(assertion: () => void) { await vi.waitFor(async () => { await act(async () => {}); assertion() }, { interval: 1 }) }
async function click(label: string) {
  expect(button(label)).toBeDefined()
  const pending = mutations.length
  await act(async () => { button(label)!.click(); await Promise.allSettled(mutations.slice(pending)) })
}
async function publish(data: AppData, revision = 2) {
  const { claimedRow } = await import('@/test/fakeDashboards')
  wire.rows.set(wire.userId, claimedRow(data as unknown as Record<string, unknown>, `2026-10-01T00:0${revision}:00Z`, revision))
}
async function stale(action: typeof actions[number] = actions[0]) {
  await publish(latest)
  await click(action)
  await waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('cloud copy changed after this review opened'))
}
async function snapshots() { return { account: (await disk.repository.read(accountKey))!.raw, guest: (await disk.repository.read(guestKey))!.raw } }
function options(label: string) { return [...container.querySelectorAll<HTMLButtonElement>('button')].filter(element => element.textContent?.trim() === label) }
async function refresh() { await click('Refresh review'); await waitFor(() => expect(container.textContent).toContain(refreshed)) }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done }); return { promise, resolve } }

it.each(actions)('requires explicit Refresh review after %s becomes stale', async action => {
  const saved = await snapshots()
  await stale(action)
  expect(button(actions[0])?.disabled).toBe(true)
  expect(button(actions[1])?.disabled).toBe(true)
  expect(button('Refresh review')?.disabled).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(await snapshots()).toEqual(saved)
})

it.each(actions)('refreshes both snapshots, resets every choice, and requires a new explicit %s', async action => {
  expect(options("Use this device's")).toHaveLength(7)
  await act(async () => { for (const option of options("Use this device's")) option.click() })
  expect(options("Use this device's").every(option => option.dataset.on === 'true')).toBe(true)
  await stale(action)
  await act(async () => store.useStore.getState().update(data => {
    data.tasks.push({ id: 'synthetic-new-task', title: 'New device work', type: 'Task', progress: 'Not started', kanban: 'todo', archived: false, order: 1 })
  }))
  await disk.flush(guestKey)
  const saved = await snapshots(); commits.mockClear()
  await refresh()
  expect(options("Keep my account's")).toHaveLength(7)
  expect(options("Keep my account's").every(option => option.dataset.on === 'true')).toBe(true)
  expect(options("Use this device's").every(option => option.dataset.on === 'false')).toBe(true)
  const assignmentCount = [...container.querySelectorAll('.pl-frow')].find(row => row.querySelector('.fn')?.textContent === 'Assignments & deadlines')
  expect(assignmentCount?.querySelector('.fv')?.textContent).toBe('2')
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(await snapshots()).toEqual(saved)
  await click(action)
  await waitFor(() => expect(wire.navigate).toHaveBeenCalled())
  expect(wire.writes).toHaveBeenCalledTimes(action === actions[0] ? 1 : 0)
  expect(store.snapshotData().profile.name).toBe('Synthetic refreshed account')
  expect(store.snapshotData().tasks).toEqual(latest.tasks)
  expect((await disk.repository.read(guestKey))!.raw).toBe(saved.guest)
  if (action === actions[0]) expect(wire.writes.mock.calls[0][0]).toMatchObject({ write_rev: 3, data: { profile: { name: 'Synthetic refreshed account' } } })
})

it('keeps exact cloud freshness after a successful refresh', async () => {
  await stale()
  await act(async () => store.useStore.getState().adoptPreparedWorkspace(structuredClone(latest)))
  await disk.flush(guestKey)
  await refresh()
  expect(container.textContent).toContain("Both copies look the same. There's nothing to resolve.")
  const changed = structuredClone(latest); changed.meta.lastOpenedAt = 3
  await disk.write(accountKey, JSON.stringify({ state: changed, version: store.CURRENT_STORE_VERSION }))
  await publish(changed, 3)
  await click(actions[0])
  await waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('cloud copy changed after this review opened'))
  expect(button('Refresh review')?.disabled).toBe(false)
  expect(button(actions[0])?.disabled).toBe(true)
  expect(container.textContent).not.toContain("Both copies look the same. There's nothing to resolve.")
  expect(wire.writes).not.toHaveBeenCalled()
})

it('leaves failed refresh retryable while both stale actions remain disabled', async () => {
  await stale(); const saved = await snapshots()
  wire.readError = 'Synthetic refresh connection failure'
  await click('Refresh review')
  await waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('Could not read your account.'))
  expect(button('Refresh review')?.disabled).toBe(false)
  for (const action of actions) expect(button(action)?.disabled).toBe(true)
  expect(await snapshots()).toEqual(saved)
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  wire.readError = undefined; await refresh()
  for (const action of actions) expect(button(action)?.disabled).toBe(false)
})

it.each(['local edit', 'workspace switch', 'account change'] as const)('rejects a late refresh response after a %s', async change => {
  await stale()
  const pending = deferred<unknown>(); wire.pending.set(wire.userId, pending.promise)
  const reads = wire.reads.mock.calls.length
  await click('Refresh review')
  await waitFor(() => expect(wire.reads.mock.calls.length).toBeGreaterThan(reads))
  if (change === 'local edit') {
    await act(async () => store.useStore.getState().update(data => { data.profile.name = 'Synthetic newer local work' }))
    await disk.flush(guestKey)
  } else if (change === 'workspace switch') {
    await act(async () => store.activateAccountWorkspace(wire.userId)); await disk.flush(accountKey)
  } else {
    await act(async () => {
      wire.userId = 'synthetic-other-account'
      for (const listener of wire.listeners) listener('SIGNED_IN', { user: { id: wire.userId } })
    })
  }
  const changedSnapshot = store.snapshotData(), saved = await snapshots(), commitsBefore = commits.mock.calls.length
  await act(async () => pending.resolve(wire.rows.get('synthetic-refresh')))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)) })
  expect(container.textContent).not.toContain(refreshed)
  for (const action of actions) expect(button(action)?.disabled ?? true).toBe(true)
  expect(store.snapshotData()).toEqual(changedSnapshot); expect(await snapshots()).toEqual(saved)
  expect(commits).toHaveBeenCalledTimes(commitsBefore)
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled()
})

it('does not publish a pending review after the account changes away and back', async () => {
  await stale()
  const pending = deferred<unknown>(); wire.pending.set(wire.userId, pending.promise)
  const reads = wire.reads.mock.calls.length, saved = await snapshots(), device = store.snapshotData()
  await click('Refresh review')
  await waitFor(() => expect(wire.reads.mock.calls.length).toBeGreaterThan(reads))
  await act(async () => {
    for (const id of ['synthetic-other-account', 'synthetic-refresh']) {
      wire.userId = id
      for (const listener of wire.listeners) listener('SIGNED_IN', { user: { id } })
    }
    pending.resolve(wire.rows.get('synthetic-refresh'))
  })
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Your sign-in changed.')
  expect(container.textContent).not.toContain(refreshed)
  for (const action of actions) expect(button(action)?.disabled).toBe(true)
  expect(store.snapshotData()).toEqual(device); expect(await snapshots()).toEqual(saved)
  expect(wire.navigate).not.toHaveBeenCalled(); expect(wire.writes).not.toHaveBeenCalled()
  expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
})

it('ignores a late initial read after unmount instead of navigating to account setup', async () => {
  await act(async () => root.unmount())
  const pending = deferred<unknown>(); wire.pending.set(wire.userId, pending.promise)
  const reads = wire.reads.mock.calls.length, saved = await snapshots(), device = store.snapshotData()
  root = createRoot(container)
  const { MergePage } = await import('@/pages/public/MergePage')
  await act(async () => root.render(<MemoryRouter initialEntries={['/auth/merge']}><MergePage /></MemoryRouter>))
  await waitFor(() => expect(wire.reads.mock.calls.length).toBeGreaterThan(reads))
  await act(async () => root.unmount())
  expect(wire.listeners.size).toBe(0)
  // A live initial request with no row would navigate to /auth/setup.
  await act(async () => pending.resolve(undefined))
  expect(container.textContent).toBe('')
  expect(wire.navigate).not.toHaveBeenCalled(); expect(wire.writes).not.toHaveBeenCalled()
  expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(store.snapshotData()).toEqual(device); expect(await snapshots()).toEqual(saved)
})

it('rejects an obsolete initial signed-out response after a sign-in event', async () => {
  await act(async () => root.unmount())
  const pending = deferred<{ data: { session: null }; error: null }>()
  const { supabase } = await import('@/lib/supabase')
  const sessionRead = vi.spyOn(supabase!.auth, 'getSession').mockImplementationOnce(() => pending.promise)
  const reads = wire.reads.mock.calls.length, saved = await snapshots(), device = store.snapshotData()
  root = createRoot(container)
  const { MergePage } = await import('@/pages/public/MergePage')
  await act(async () => root.render(<MemoryRouter initialEntries={['/auth/merge']}><MergePage /></MemoryRouter>))
  await waitFor(() => expect(sessionRead).toHaveBeenCalledTimes(1))
  await act(async () => {
    for (const listener of wire.listeners) listener('SIGNED_IN', { user: { id: wire.userId } })
    pending.resolve({ data: { session: null }, error: null })
  })
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Your sign-in changed.')
  for (const action of actions) expect(button(action)?.disabled).toBe(true)
  expect(wire.reads).toHaveBeenCalledTimes(reads)
  expect(wire.navigate).not.toHaveBeenCalled(); expect(wire.writes).not.toHaveBeenCalled()
  expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(store.snapshotData()).toEqual(device); expect(await snapshots()).toEqual(saved)
})

it.each(['durable copy', 'legacy storage bytes'] as const)('rejects a pending refresh when only the %s changes', async change => {
  await stale()
  const pending = deferred<unknown>(); wire.pending.set(wire.userId, pending.promise)
  const reads = wire.reads.mock.calls.length, device = store.snapshotData()
  await click('Refresh review')
  await waitFor(() => expect(wire.reads.mock.calls.length).toBeGreaterThan(reads))
  const changed = structuredClone(device); changed.profile.name = 'Synthetic saved-only change'
  const changedRaw = JSON.stringify({ state: changed, version: store.CURRENT_STORE_VERSION })
  if (change === 'durable copy') await disk.write(guestKey, changedRaw)
  else localStorage.setItem(guestKey, changedRaw)
  const saved = await snapshots(), commitsBefore = commits.mock.calls.length
  // No store update or workspace switch occurred: only the saved-copy fence can see this.
  expect(store.snapshotData()).toEqual(device)
  await act(async () => pending.resolve(wire.rows.get(wire.userId)))
  await waitFor(() => expect(button('Refresh review')?.disabled).toBe(false))
  expect(container.querySelector('[role="alert"]')?.textContent).toBeTruthy()
  expect(container.textContent).not.toContain(refreshed)
  for (const action of actions) expect(button(action)?.disabled).toBe(true)
  expect(store.snapshotData()).toEqual(device); expect(await snapshots()).toEqual(saved)
  if (change === 'legacy storage bytes') expect(localStorage.getItem(guestKey)).toBe(changedRaw)
  expect(commits).toHaveBeenCalledTimes(commitsBefore)
  expect(wire.navigate).not.toHaveBeenCalled(); expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled()
})

it('does not expose review refresh while an explicit write is running or after uncertain completion', async () => {
  await stale(); await refresh()
  const mutationSafety = await import('@/store/accountMutationSafety')
  const prepare = vi.mocked(mutationSafety.prepareAccountMutation).getMockImplementation()!
  const writing = deferred<void>(), entered = vi.fn()
  vi.mocked(mutationSafety.prepareAccountMutation).mockImplementation(async (...args) => {
    const mutation = await prepare(...args)
    return { ...mutation,
      get serverSaved() { return mutation.serverSaved },
      async write(data: AppData) { entered(); await writing.promise; await mutation.write(data) },
      activate() { throw new Error('Synthetic post-write activation uncertainty') },
    }
  })
  await act(async () => button(actions[0])!.click())
  await waitFor(() => expect(entered).toHaveBeenCalled())
  expect(button('Refresh review')?.disabled ?? true).toBe(true)
  expect(button('Applying…')?.disabled).toBe(true)
  expect(button(actions[1])?.disabled).toBe(true)
  await act(async () => writing.resolve())
  await waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('The cloud accepted the change, but local completion was not confirmed'))
  expect(wire.writes).toHaveBeenCalledTimes(1)
  expect(button('Refresh review')).toBeUndefined()
})

async function initialLoad(workspace: 'guest' | 'demo' | 'other account', account: 'signed out' | 'missing' | 'existing') {
  await act(async () => root.unmount())
  disk.repository.close()
  vi.restoreAllMocks(); vi.resetModules()
  localStorage.clear(); sessionStorage.clear()
  vi.stubGlobal('indexedDB', new IDBFactory())
  wire.userId = account === 'signed out' ? '' : 'synthetic-refresh'
  wire.rows.clear(); wire.pending.clear(); wire.reads.mockClear(); wire.writes.mockClear(); wire.navigate.mockClear(); wire.listeners.clear()
  const namespace = await import('@/lib/demoMode')
  const key = workspace === 'demo' ? namespace.DEMO_STORAGE_KEY
    : workspace === 'other account' ? namespace.accountStorageKey('synthetic-initial-other-owner') : namespace.GUEST_STORAGE_KEY
  localStorage.setItem(namespace.ACTIVE_WORKSPACE_OWNER_KEY, workspace === 'other account' ? 'account:synthetic-initial-other-owner' : 'guest')
  if (workspace === 'demo') {
    localStorage.setItem(namespace.DEMO_MODE_FLAG, 'on')
    // Invented fixture bytes exercise the real demo-mode boot/activation path.
    localStorage.setItem(namespace.DEMO_STAMP_KEY, namespace.DEMO_STAMP_VALUE)
  }
  const seed = createPersonalInitialData(); seed.meta.lastOpenedAt = 1; seed.profile.name = 'Synthetic initial device'
  localStorage.setItem(key, JSON.stringify({ state: seed, version: 0 }))
  await (await import('@/store/workspaceBootstrap')).initializeDurableWorkspaces()
  store = await import('@/store/store')
  store.useStore.getState().adoptPreparedWorkspace(store.snapshotData())
  disk = (await import('@/store/workspacePersistence')).workspacePersistence()!
  await disk.flush(key)
  const device = structuredClone(store.snapshotData()), saved = (await disk.repository.read(key))!.raw
  const remote = structuredClone(device); remote.profile.name = 'Synthetic initial account'
  if (account === 'existing') {
    const { claimedRow } = await import('@/test/fakeDashboards')
    wire.rows.set(wire.userId, claimedRow(remote as unknown as Record<string, unknown>, '2026-10-01T01:00:00Z', 1))
  }
  commits = vi.spyOn(disk.repository, 'commit')
  archive = vi.spyOn((await import('@/store/workspaceRecoveryRepository')).workspaceRecoveryRepository(), 'save')
  root = createRoot(container)
  const { MergePage } = await import('@/pages/public/MergePage')
  await act(async () => root.render(<MemoryRouter initialEntries={['/auth/merge?firstLogin=1']}><MergePage /></MemoryRouter>))
  return { key, device, saved, remote }
}

it.each(['guest', 'demo'] as const)('initial %s review still requires an authenticated account', async workspace => {
  const before = await initialLoad(workspace, 'signed out')
  await waitFor(() => expect(wire.navigate).toHaveBeenCalledWith('/auth', { replace: true }))
  expect(wire.reads).not.toHaveBeenCalled()
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(store.snapshotData()).toEqual(before.device)
  expect((await disk.repository.read(before.key))!.raw).toBe(before.saved)
})

it.each(['guest', 'demo'] as const)('initial %s first-login review with no cloud row goes to account setup without creating a row', async workspace => {
  const before = await initialLoad(workspace, 'missing')
  await waitFor(() => expect(wire.navigate).toHaveBeenCalledWith('/auth/setup', { replace: true }))
  expect(wire.reads).toHaveBeenCalledTimes(1)
  expect(wire.rows.has(wire.userId)).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(store.snapshotData()).toEqual(before.device)
  expect((await disk.repository.read(before.key))!.raw).toBe(before.saved)
})

it.each(['guest', 'demo'] as const)('initial %s first-login review with an existing cloud row opens an explicit review without saving', async workspace => {
  const before = await initialLoad(workspace, 'existing')
  await waitFor(() => expect(button(actions[0])?.disabled).toBe(false))
  expect(button(actions[1])?.disabled).toBe(false)
  expect(container.textContent).toContain('Your account already has data.')
  expect(wire.navigate).not.toHaveBeenCalled()
  expect(wire.reads).toHaveBeenCalledTimes(1)
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(store.captureWorkspaceIdentity().key).toBe(before.key)
  expect(store.snapshotData()).toEqual(before.device)
  expect((await disk.repository.read(before.key))!.raw).toBe(before.saved)
})

it('initial review refuses another account-prefixed workspace before reading the signed-in account', async () => {
  const before = await initialLoad('other account', 'existing')
  await waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('The open workspace belongs to a different account.'))
  for (const action of actions) expect(button(action)?.disabled).toBe(true)
  expect(wire.navigate).not.toHaveBeenCalled(); expect(wire.reads).not.toHaveBeenCalled()
  expect(wire.writes).not.toHaveBeenCalled(); expect(archive).not.toHaveBeenCalled(); expect(commits).not.toHaveBeenCalled()
  expect(store.captureWorkspaceIdentity().key).toBe(before.key)
  expect(store.snapshotData()).toEqual(before.device)
  expect((await disk.repository.read(before.key))!.raw).toBe(before.saved)
})

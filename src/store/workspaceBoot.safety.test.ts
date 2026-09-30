import { act, createElement, type ReactNode } from 'react'
import type { Root } from 'react-dom/client'
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { assertSupportedRemote, assertSupportedWorkspace, cloudClaim } from '@/lib/workspaceSchema'
import { validateAppData } from '@/lib/validateAppData'

// Some boot cases wait for more than one asynchronous UI transition.
vi.setConfig({ testTimeout: 15_000 })

const guest = 'hq:app-data:guest', legacy = 'premed_hq_v1', rootKey = 'hq:app-data'
const owner = 'synthetic-boot-owner', accountKey = `hq:app-data:account:${owner}`
const pointer = 'premed-os:workspace:idb:v1:synthetic-missing'
let mounted: Root | undefined
let persisted: ReturnType<typeof vi.fn>, persist: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()
  localStorage.clear(); sessionStorage.clear()
  document.body.innerHTML = '<div id="root"></div>'
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network is forbidden in synthetic boot tests') }))
  persisted = vi.fn().mockResolvedValue(true); persist = vi.fn().mockResolvedValue(true)
  const browser = new Proxy(navigator, { get: (target, property) => property === 'storage' ? { persisted, persist } : Reflect.get(target, property, target) })
  vi.stubGlobal('navigator', browser)
  vi.doMock('@/lib/supabase', () => ({ supabase: null, authRedirectTo: 'https://synthetic.invalid/' }))
})
afterEach(async () => {
  if (mounted) { await act(async () => mounted!.unmount()); mounted = undefined }
  ;(await import('./workspacePersistence')).workspacePersistence()?.repository.close()
  for (const name of ['react-dom/client', '@/lib/supabase', './workspaceBootstrap', './workspaceRepository', './store', './useCloudSync', '../App', '@/components/layout/AppErrorBoundary', '@/components/providers/MotionProvider', '@/components/layout/WorkspacePersistenceStatus', '@/lib/workspaceKeyMigration']) vi.doUnmock(name)
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetModules()
})

async function until(check: () => void) {
  // Real IndexedDB and dynamic imports can settle slowly under parallel CI load.
  // Return immediately when ready; leave five seconds for each transition.
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)) })
    try { check(); return } catch { /* Allow real IndexedDB and React work to finish. */ }
  }
  check()
}
async function mountMain() {
  vi.doMock('react-dom/client', async () => {
    const original = await vi.importActual<typeof import('react-dom/client')>('react-dom/client')
    return { ...original, createRoot: (...args: Parameters<typeof original.createRoot>) => { mounted = original.createRoot(...args); return mounted } }
  })
  await act(async () => { await import('../main') })
}
function button(label: string) {
  const found = [...document.querySelectorAll('button')].find(node => node.textContent === label)
  expect(found, label).toBeDefined()
  return found!
}

it('does not download an empty diagnostic envelope as a recovery copy', async () => {
  vi.stubGlobal('URL', class extends URL { static createObjectURL = vi.fn().mockReturnValue('blob:synthetic'); static revokeObjectURL = vi.fn() })
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  const { downloadWorkspaceRecovery } = await import('./workspaceRecoveryExport')
  await expect(downloadWorkspaceRecovery('synthetic-missing')).rejects.toThrow('empty')
  expect(click).not.toHaveBeenCalled()
})

it('keeps main fenced through magic-link sign-in and SIGNED_IN, with no live-store, App, sync import or cloud access', async () => {
  localStorage.setItem('hq:workspace-owner', `account:${owner}`)
  localStorage.setItem(accountKey, pointer)
  const storeImport = vi.fn(), appImport = vi.fn(), syncImport = vi.fn()
  vi.doMock('./store', () => { storeImport(); throw new Error('Live store imported through recovery fence') })
  vi.doMock('../App', () => { appImport(); throw new Error('App imported through recovery fence') })
  vi.doMock('./useCloudSync', () => { syncImport(); throw new Error('Sync imported through recovery fence') })
  let notify!: (event: AuthChangeEvent, session: Session | null) => void
  const writes = Object.fromEntries(['insert', 'upsert', 'update', 'delete'].map(name => [name, vi.fn()]))
  const from = vi.fn(() => writes), signInWithOtp = vi.fn(async () => ({ data: {}, error: null }))
  vi.doMock('@/lib/supabase', () => ({ authRedirectTo: 'https://synthetic.invalid/', supabase: { from, auth: {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })), signInWithOtp,
    onAuthStateChange: vi.fn((callback: typeof notify) => { notify = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } }),
  } } }))
  await mountMain()
  await until(() => expect(document.querySelector('input[type="email"]')).not.toBeNull())
  const disk = (await import('./workspacePersistence')).workspacePersistence()!
  expect(disk.status(accountKey).phase).toBe('error')
  expect(button('Restore from my account').disabled).toBe(true)
  const email = document.querySelector<HTMLInputElement>('input[type="email"]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(email, 'synthetic@example.invalid')
    email.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => button('Send sign-in link').click())
  await until(() => expect(signInWithOtp).toHaveBeenCalledWith({ email: 'synthetic@example.invalid', options: { emailRedirectTo: 'https://synthetic.invalid/', shouldCreateUser: false } }))
  await act(async () => notify('SIGNED_IN', { user: { id: owner } } as Session))
  await until(() => expect(button('Restore from my account').disabled).toBe(false))
  expect(disk.status(accountKey).phase).toBe('error')
  expect(localStorage.getItem(accountKey)).toBe(pointer)
  expect(await disk.repository.read(accountKey)).toBeNull()
  expect(await disk.repository.originals(accountKey)).toEqual([])
  for (const observer of [storeImport, appImport, syncImport, from, ...Object.values(writes)]) expect(observer).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})

it('retains the signed-out main boot sequence with real hydration, verified persistence and the same guest data', async () => {
  localStorage.setItem('hq:workspace-owner', 'guest')
  const fixture = createPersonalInitialData()
  fixture.notes.synthetic = 'Guest data survives normal boot'
  const raw = JSON.stringify({ state: fixture, version: 52 })
  localStorage.setItem(guest, raw)
  const appImport = vi.fn()
  vi.doMock('../App', () => { appImport(); return { default: () => createElement('p', { 'data-test-app': true }, 'Synthetic app mounted') } })
  const Pass = ({ children }: { children: ReactNode }) => children
  vi.doMock('@/components/layout/AppErrorBoundary', () => ({ AppErrorBoundary: Pass }))
  vi.doMock('@/components/providers/MotionProvider', () => ({ AppMotionProvider: Pass }))
  vi.doMock('@/components/layout/WorkspacePersistenceStatus', () => ({ WorkspacePersistenceStatus: Pass }))
  // Namespace migration is independent of the boot fence; keep this assertion on
  // the real durable guest load/adopt/flush path and its original raw snapshot.
  const migrateKeys = vi.fn()
  vi.doMock('@/lib/workspaceKeyMigration', () => ({ migrateLegacyWorkspaceKeys: migrateKeys }))
  await mountMain()
  await until(() => expect(document.querySelector('[data-test-app]')).not.toBeNull())
  const store = await import('./store'), disk = (await import('./workspacePersistence')).workspacePersistence()!
  expect(store.useStore.persist.hasHydrated()).toBe(true)
  expect(store.activeAccountWorkspaceId()).toBeNull()
  expect(store.snapshotData()).toEqual(store.migrateAll(fixture))
  expect(disk.status(guest)).toMatchObject({ phase: 'ready', pending: 0 })
  const saved = (await disk.repository.read(guest))!
  expect(JSON.parse(saved.raw).state).toEqual(store.snapshotData())
  expect(saved.phase).toBe('active')
  expect(localStorage.getItem(guest)).toBe(`premed-os:workspace:idb:v1:${saved.migrationId}`)
  expect((await disk.repository.originals(guest)).some(copy => copy.raw === raw)).toBe(true)
  expect(appImport).toHaveBeenCalledTimes(1); expect(migrateKeys).toHaveBeenCalledTimes(1)
  expect(persisted).toHaveBeenCalled(); expect(persist).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})

it('rechecks the real browser persistence grant on every cold signed-out boot without requesting before a save', async () => {
  localStorage.setItem('hq:workspace-owner', 'guest')
  persisted.mockResolvedValue(false)
  for (let boot = 1; boot <= 2; boot++) {
    await (await import('./workspaceBootstrap')).initializeDurableWorkspaces()
    await vi.waitFor(() => expect(persisted).toHaveBeenCalledTimes(boot))
    expect(persist).not.toHaveBeenCalled()
    const disk = (await import('./workspacePersistence')).workspacePersistence()!
    expect(disk.status(guest).phase).toBe('ready')
    expect((await import('@/lib/persistentStorage')).persistentStorage.getSnapshot()).toBe('not-granted')
    disk.repository.close(); vi.resetModules()
  }
})

it.each(['decode', 'stage'] as const)('routes a direct legacy %s failure to the root namespace rather than the active account', async failure => {
  localStorage.setItem('hq:workspace-owner', `account:${owner}`)
  const previous = failure === 'decode' ? 'premed-os:workspace:gzip:v1:not-base64!' : JSON.stringify({ state: createPersonalInitialData(), version: 52 })
  localStorage.setItem(legacy, previous)
  if (failure === 'stage') {
    vi.doMock('./workspaceRepository', async () => {
      const original = await vi.importActual<typeof import('./workspaceRepository')>('./workspaceRepository')
      return { ...original, createWorkspaceRepository: (...args: Parameters<typeof original.createWorkspaceRepository>) => ({ ...original.createWorkspaceRepository(...args), stage: vi.fn(async () => { throw new Error('Synthetic stage failure') }) }) }
    })
  }
  const { initializeDurableWorkspaces, WorkspaceBootError } = await import('./workspaceBootstrap')
  const caught = await initializeDurableWorkspaces().catch(error => error)
  expect(caught).toBeInstanceOf(WorkspaceBootError)
  expect(caught.workspaceKey).toBe(rootKey)
  expect(caught.workspaceKey).not.toBe(accountKey)
  expect(localStorage.getItem(legacy)).toBe(previous)
  expect(localStorage.getItem(rootKey)).toBeNull()
  expect(localStorage.getItem(accountKey)).toBeNull()
})

// Frozen parser/read contract from dashboardRows.ts at 2a8d745 (before extraction).
// This deliberately does not call the extracted parser or import the live store.
function baselineParse(row: Record<string, unknown>) {
  const claim = cloudClaim(row)
  if (typeof row.updated_at !== 'string' || !row.updated_at) throw new Error('The cloud copy has no usable revision. Nothing was replaced.')
  assertSupportedRemote(row.data, claim)
  assertSupportedWorkspace(row.data)
  if (validateAppData(row.data).length) throw new Error('The cloud copy has an invalid structure. Nothing was replaced and sync is paused.')
  return { data: row.data, updatedAt: row.updated_at, claim }
}
function parserOutcome(parse: typeof baselineParse, row: Record<string, unknown>) {
  try { return { bytes: JSON.stringify(parse(row)) } }
  catch (error) { return { error: error instanceof Error ? { name: error.name, message: error.message } : String(error) } }
}
function readFixture(result: { data: Record<string, unknown> | null; error: unknown; status?: number }) {
  const trace: unknown[][] = []
  const query = {
    select: (fields: string) => { trace.push(['select', fields]); return query },
    eq: (column: string, value: string) => { trace.push(['eq', column, value]); return query },
    maybeSingle: async () => { trace.push(['maybeSingle']); return result },
  }
  const client = { from: (table: string) => { trace.push(['from', table]); return query } } as unknown as SupabaseClient
  return { client, trace }
}

describe('extracted dashboard reader compatibility', () => {
  it('returns byte-identical parsed data or the same named error for fixed legacy/schema fixtures', async () => {
    const { parseDashboardRow } = await import('./dashboardRead')
    const data = createPersonalInitialData(), stamp = '2026-09-29T12:00:00Z'
    const base = { data, updated_at: stamp, cloud_schema: null, write_rev: null }
    const cases = [
      base,
      { ...base, data: { ...data, _schema: 2, opaqueFuture: { preserved: ['exact', 2] } }, cloud_schema: 2, write_rev: 7 },
      { data, updated_at: stamp }, // Missing S1 columns.
      { ...base, updated_at: '' },
      { ...base, cloud_schema: 2, write_rev: null },
      { ...base, cloud_schema: 2, write_rev: 0 },
      { ...base, data: { ...data, _schema: 3 }, cloud_schema: 3, write_rev: 1 },
      { ...base, data: { ...data, _schema: 1 }, cloud_schema: 2, write_rev: 1 },
      { ...base, data: { ...data, courses: null } },
      { ...base, data: null },
    ]
    for (const row of cases) expect(parserOutcome(parseDashboardRow, row)).toEqual(parserOutcome(baselineParse, row))
    expect(parserOutcome(parseDashboardRow, cases[1]).bytes).toContain('opaqueFuture')
  })

  it('retains the exact SELECT/filter, response bytes and freshness calls from the pre-extraction read', async () => {
    const { readDashboardRow, readDashboardForBootRecovery } = await import('./dashboardRead')
    const { cloudRequest } = await import('./cloudRequest')
    const row = { data: createPersonalInitialData(), updated_at: '2026-09-29T12:00:00Z', cloud_schema: null, write_rev: null }
    for (const data of [row, null]) {
      const response = { data, error: null }
      const old = readFixture(response), extracted = readFixture(response)
      const oldFresh = vi.fn(), extractedFresh = vi.fn()
      const before = await cloudRequest(() => old.client.from('dashboards').select('data, updated_at, cloud_schema, write_rev').eq('user_id', owner).maybeSingle(), oldFresh)
      const after = await readDashboardRow(extracted.client, owner, extractedFresh)
      expect(JSON.stringify(after)).toBe(JSON.stringify(before))
      expect(extracted.trace).toEqual(old.trace)
      expect(extractedFresh.mock.calls).toEqual(oldFresh.mock.calls)
      expect(await readDashboardForBootRecovery(readFixture(response).client, owner, vi.fn())).toEqual(data ? baselineParse(data) : null)
    }
  })

  it('keeps transport failures and freshness rejection identical and never queries after a stale context', async () => {
    const { readDashboardRow } = await import('./dashboardRead'), { cloudRequest } = await import('./cloudRequest')
    const response = { data: null, error: { code: 'PGRST204', message: 'Synthetic missing column' }, status: 400 }
    const old = readFixture(response), extracted = readFixture(response)
    const outcome = async (request: Promise<unknown>) => { try { await request; return null } catch (error) { const value = error as Error & { code?: string; retryable?: boolean }; return { name: value.name, message: value.message, code: value.code, retryable: value.retryable } } }
    const oldResult = await outcome(cloudRequest(() => old.client.from('dashboards').select('data, updated_at, cloud_schema, write_rev').eq('user_id', owner).maybeSingle(), vi.fn()))
    const newResult = await outcome(readDashboardRow(extracted.client, owner, vi.fn()))
    expect(newResult).toEqual(oldResult); expect(extracted.trace).toEqual(old.trace)
    const stale = readFixture({ data: null, error: null })
    await expect(readDashboardRow(stale.client, owner, () => { throw new Error('Synthetic stale session') })).rejects.toThrow('stale session')
    expect(stale.trace).toEqual([])
  })
})

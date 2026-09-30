import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { ACTIVE_WORKSPACE_OWNER_KEY } from '@/lib/demoMode'
import { createWorkspaceRepository, type WorkspaceRepository } from '@/store/workspaceRepository'
import { createWorkspacePersistence, WORKSPACE_IDB_PREFIX, type WorkspacePersistence } from '@/store/workspacePersistence'
import { DASHBOARD_SELECT } from '@/store/dashboardRead'
import { WorkspaceBootRecovery } from './WorkspaceBootRecovery'

const holder = vi.hoisted(() => ({ disk: undefined as WorkspacePersistence | undefined }))
vi.mock('@/store/workspacePersistence', async importOriginal => ({
  ...await importOriginal<typeof import('@/store/workspacePersistence')>(),
  workspacePersistence: () => holder.disk,
}))
vi.mock('@/lib/supabase', () => ({ supabase: null, authRedirectTo: 'https://synthetic.invalid/' }))
// These factories fail the entire suite if recovery gains a live-store/sync dependency.
vi.mock('@/store/store', () => { throw new Error('Boot recovery must not import the live store') })
vi.mock('@/store/useCloudSync', () => { throw new Error('Boot recovery must not import account sync') })

const userId = 'synthetic-recovery-owner', key = `hq:app-data:account:${userId}`
const pointer = WORKSPACE_IDB_PREFIX + 'synthetic-missing-record'
let root: Root, container: HTMLDivElement, repository: WorkspaceRepository
function button(label: string) {
  const found = [...container.querySelectorAll('button')].find(node => node.textContent === label)
  expect(found, `button ${label}`).toBeDefined()
  return found!
}
async function until(check: () => void) {
  for (let attempt = 0; attempt < 100; attempt++) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)) })
    try { check(); return } catch { /* Continue while IndexedDB and React settle. */ }
  }
  check()
}
function clientFixture(initialId: string | null = null) {
  const data = createPersonalInitialData()
  data.notes.synthetic = 'Account-only synthetic recovery note'
  const row = { data, updated_at: '2026-09-29T12:00:00Z', cloud_schema: null, write_rev: null }
  const maybeSingle = vi.fn(async () => ({ data: row, error: null }))
  const mutations = Object.fromEntries(['insert', 'upsert', 'update', 'delete'].map(name => [name, vi.fn(() => { throw new Error('Recovery attempted a cloud write') })]))
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle, ...mutations }
  const from = vi.fn(() => query)
  let notify!: (event: AuthChangeEvent, session: Session | null) => void
  const session = (id: string | null) => id ? { user: { id } } as Session : null
  const unsubscribe = vi.fn()
  const client = { from, auth: {
    getSession: vi.fn(async () => ({ data: { session: session(initialId) }, error: null })),
    signInWithOtp: vi.fn(async () => ({ data: {}, error: null })),
    onAuthStateChange: vi.fn((callback: typeof notify) => { notify = callback; return { data: { subscription: { unsubscribe } } } }),
  } } as unknown as SupabaseClient
  return { client, from, query, maybeSingle, data, mutations,
    emit: (id: string | null) => notify(id ? 'SIGNED_IN' : 'SIGNED_OUT', session(id)),
    noCloudWrites: () => Object.values(mutations).forEach(fn => expect(fn).not.toHaveBeenCalled()),
  }
}
async function mount(client: SupabaseClient) {
  await act(async () => root.render(<WorkspaceBootRecovery error={new Error('Synthetic missing IndexedDB record')} workspaceKey={key} client={client} />))
  await until(() => expect(container.textContent).toContain('This copy is empty.'))
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  localStorage.setItem(ACTIVE_WORKSPACE_OWNER_KEY, `account:${userId}`)
  localStorage.setItem(key, pointer)
  repository = createWorkspaceRepository(new IDBFactory())
  holder.disk = createWorkspacePersistence(repository, localStorage)
  await expect(holder.disk.load(key, () => { throw new Error('Missing pointer must never seed defaults') })).rejects.toThrow('missing IndexedDB')
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); repository.close(); holder.disk = undefined; vi.unstubAllGlobals() })

it('mounts signed out without a dashboard request or writes, and observes SIGNED_IN without syncing', async () => {
  const fixture = clientFixture()
  await mount(fixture.client)
  expect(button('Restore from my account').disabled).toBe(true)
  expect(button('Restore from a backup file').disabled).toBe(false)
  expect(container.textContent).not.toContain('Download verified local recovery copy')
  await act(async () => fixture.emit(userId))
  expect(button('Restore from my account').disabled).toBe(false)
  expect(fixture.from).not.toHaveBeenCalled()
  fixture.noCloudWrites()
  expect(await repository.read(key)).toBeNull()
  expect(await repository.originals(key)).toEqual([])
  expect(localStorage.getItem(key)).toBe(pointer)
})

it('previews through the real cloud read and changes only local storage after explicit confirmation', async () => {
  const fixture = clientFixture(userId)
  await mount(fixture.client)
  await act(async () => button('Restore from my account').click())
  await until(() => expect(container.querySelector('[aria-label="Review this copy"]')).not.toBeNull())
  expect(fixture.from).toHaveBeenCalledWith('dashboards')
  expect(fixture.query.select).toHaveBeenCalledWith(DASHBOARD_SELECT)
  expect(fixture.query.eq).toHaveBeenCalledWith('user_id', userId)
  expect(fixture.maybeSingle).toHaveBeenCalledTimes(1)
  expect(container.textContent).toContain('Source: My account')
  expect(await repository.read(key)).toBeNull()
  expect(await repository.originals(key)).toEqual([])
  expect(localStorage.getItem(key)).toBe(pointer)
  fixture.noCloudWrites()
  await act(async () => button('Restore this copy').click())
  await until(() => expect(container.textContent).toContain('Your restored copy is saved and checked'))
  expect(fixture.maybeSingle).toHaveBeenCalledTimes(2)
  expect(button('Download a full backup now')).toBeDefined()
  fixture.noCloudWrites()
  const saved = await repository.read(key)
  expect(saved?.phase).toBe('active')
  expect(JSON.parse(saved!.raw).state).toEqual(fixture.data)
  expect(localStorage.getItem(key)).toBe(WORKSPACE_IDB_PREFIX + saved!.migrationId)
  expect((await repository.originals(key)).some(copy => copy.raw === pointer)).toBe(true)
})

it('invalidates a displayed account review when the signed-in account changes', async () => {
  const fixture = clientFixture(userId)
  await mount(fixture.client)
  await act(async () => button('Restore from my account').click())
  await until(() => expect(container.querySelector('[aria-label="Review this copy"]')).not.toBeNull())
  await act(async () => fixture.emit('synthetic-other-owner'))
  expect(container.querySelector('[aria-label="Review this copy"]')).toBeNull()
  expect(button('Restore from my account').disabled).toBe(true)
  expect(await repository.read(key)).toBeNull()
  expect(localStorage.getItem(key)).toBe(pointer)
  fixture.noCloudWrites()
})

it('rejects a cloud response that completes after sign-out instead of presenting a stale review', async () => {
  const fixture = clientFixture(userId)
  let release!: () => void
  const response = { data: { data: fixture.data, updated_at: '2026-09-29T12:00:00Z', cloud_schema: null, write_rev: null }, error: null }
  fixture.maybeSingle.mockImplementation(() => new Promise(resolve => { release = () => resolve(response) }))
  await mount(fixture.client)
  await act(async () => button('Restore from my account').click())
  await until(() => expect(release).toBeDefined())
  await act(async () => { fixture.emit(null); release() })
  await until(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('sign-in changed'))
  expect(container.querySelector('[aria-label="Review this copy"]')).toBeNull()
  expect(await repository.read(key)).toBeNull()
  expect(localStorage.getItem(key)).toBe(pointer)
  fixture.noCloudWrites()
})

it('rejects an uploaded empty recovery diagnostic without offering confirmation or writing data', async () => {
  const fixture = clientFixture()
  await mount(fixture.client)
  const input = container.querySelector('input[type="file"]')!
  const file = new File([JSON.stringify({ format: 'premed-os-storage-recovery', version: 1, workspace: null, originals: [] })], 'synthetic-empty.json')
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))
  await until(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('Your data is not in this file'))
  expect(container.querySelector('[aria-label="Review this copy"]')).toBeNull()
  expect(await repository.read(key)).toBeNull()
  expect(localStorage.getItem(key)).toBe(pointer)
  expect(fixture.from).not.toHaveBeenCalled()
  fixture.noCloudWrites()
})

it('sends the existing magic-link sign-in from the fence without starting sync', async () => {
  const fixture = clientFixture()
  await mount(fixture.client)
  const email = container.querySelector<HTMLInputElement>('input[type="email"]')!
  expect(email).not.toBeNull()
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(email, 'synthetic@example.invalid')
    email.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => button('Send sign-in link').click())
  expect(fixture.client.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'synthetic@example.invalid', options: { emailRedirectTo: 'https://synthetic.invalid/', shouldCreateUser: false } })
  await act(async () => fixture.emit(userId))
  expect(button('Restore from my account').disabled).toBe(false)
  expect(fixture.from).not.toHaveBeenCalled()
  fixture.noCloudWrites()
  expect(await repository.read(key)).toBeNull()
  expect(localStorage.getItem(key)).toBe(pointer)
})

it('downloads clearly named diagnostics when only a missing pointer remains', async () => {
  const fixture = clientFixture()
  await mount(fixture.client)
  const created = vi.fn().mockReturnValue('blob:synthetic-diagnostics'), revoke = vi.fn()
  vi.stubGlobal('URL', { createObjectURL: created, revokeObjectURL: revoke })
  let filename = ''
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { filename = this.download })
  try {
    await act(async () => button('Download diagnostics (not a backup)').click())
    await until(() => expect(filename).toBe('premedos-storage-diagnostics.json'))
    const contents = JSON.parse(await (created.mock.calls[0][0] as Blob).text())
    expect(contents.workspace).toBeNull()
    expect(contents.legacy).toBe(pointer)
    fixture.noCloudWrites()
  } finally { click.mockRestore() }
})
it('offers a real full ZIP backup after verified restore without opening the app or writing cloud data', async () => {
  const fixture = clientFixture(userId)
  await mount(fixture.client)
  await act(async () => button('Restore from my account').click())
  await until(() => expect(container.querySelector('[aria-label="Review this copy"]')).not.toBeNull())
  await act(async () => button('Restore this copy').click())
  await until(() => expect(container.textContent).toContain('Your restored copy is saved'))
  const created = vi.fn().mockReturnValue('blob:synthetic-full'), revoke = vi.fn()
  vi.stubGlobal('URL', { createObjectURL: created, revokeObjectURL: revoke })
  let filename = ''
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { filename = this.download })
  try {
    await act(async () => button('Download a full backup now').click())
    await until(() => expect(filename).toBe('premedos-full-workspace-backup.zip'))
    const { prepareWorkspaceBackup } = await import('@/lib/workspaceBackup')
    const prepared = await prepareWorkspaceBackup(created.mock.calls[0][0] as Blob)
    expect(prepared.data).toEqual(fixture.data)
    fixture.noCloudWrites()
  } finally { click.mockRestore() }
})

it('does not call the browser copy empty when its remaining originals cannot be read', async () => {
  const fixture = clientFixture()
  vi.spyOn(repository, 'originals').mockRejectedValue(new Error('Synthetic unreadable originals'))
  await act(async () => root.render(<WorkspaceBootRecovery error={new Error('Storage failed')} workspaceKey={key} client={fixture.client} />))
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)) })
  expect(container.textContent).not.toContain('Your data is not in this browser')
  expect(container.textContent).toContain('This browser couldn’t open your saved work')
  expect(button('Download diagnostics (not a backup)')).toBeDefined()
})

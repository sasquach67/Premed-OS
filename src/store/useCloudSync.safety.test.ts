import { Blob as NodeBlob } from 'node:buffer'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const wire = vi.hoisted(() => ({ listeners: new Set<(event: string, session: unknown) => void>(), rows: new Map<string, unknown>(), pending: new Map<string, Promise<unknown>>(), snapshots: new Map<string, unknown>(), writes: vi.fn(), archiveFails: false, failures: [] as Array<{ status: number; error: { message: string } }>, attempts: vi.fn(), imageDownload: vi.fn() }))
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true, authRedirectTo: 'http://localhost/#/auth',
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: (cb: (event: string, session: unknown) => void) => { wire.listeners.add(cb); return { data: { subscription: { unsubscribe: () => wire.listeners.delete(cb) } } } } },
    storage: { from: () => ({ download: wire.imageDownload }) },
    from: () => ({
      select: () => ({ eq: (_: string, id: string) => ({ maybeSingle: async () => ({ data: await (wire.pending.get(id) ?? wire.rows.get(id)), error: null }) }) }),
      update: (value: unknown) => ({ eq: (_: string, id: string) => ({ eq: (_: string, at: string) => ({ select: () => ({ maybeSingle: async () => {
        wire.attempts()
        const failed = wire.failures.shift()
        if (failed) return { data: null, ...failed }
        const row = wire.rows.get(id) as { updated_at: string } | undefined
        if (row?.updated_at !== at) return { data: null, error: null }
        wire.writes(value); wire.rows.set(id, value); return { data: value, error: null }
      } }) }) }) }),
    }),
  },
}))
vi.mock('@/lib/academics/notebook/notebookAssetStore', () => ({ notebookAssetRepository: () => ({ read: async () => undefined }) }))
vi.mock('@/lib/academics/sharedMaterialFiles', () => ({ MATERIAL_BUCKET: 'academic-originals', syncAcademicOriginals: vi.fn(async () => undefined) }))
vi.mock('./workspaceRecoveryRepository', () => ({ workspaceRecoveryRepository: () => ({
  latest: async () => null,
  save: async (snapshot: { workspaceKey: string; id: string }) => { if (wire.archiveFails) throw new Error('Synthetic archive quota'); wire.snapshots.set(snapshot.workspaceKey + snapshot.id, snapshot) },
  read: async (key: string, id: string) => wire.snapshots.get(key + id),
}) }))

import { createPersonalInitialData } from '@/data/personalInitialData'
import { accountStorageKey, activeWorkspaceOwner } from '@/lib/demoMode'
import { activateAccountWorkspace, activateGuestWorkspace, snapshotData, useStore } from './store'
import { getAccountConflict, allowAccountSync, pauseAccountSync, observeSyncSession, readSyncBaseline, recordSyncBaseline, isAccountSyncReady } from './accountSyncSafety'
import { useCloudSync } from './useCloudSync'
import { visualFixture } from '@/lib/academics/notebook/visual.test-fixtures'
import { binaryDigest } from '@/lib/workspaceAssets'
import { captureFolderFence } from '@/lib/academics/materialFolder/controller'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root, cloud: ReturnType<typeof useCloudSync>, counter = 0
const older = '2026-09-10T12:00:00Z', newer = '2026-09-11T12:00:00Z'
function workspace(note: string) { const d = createPersonalInitialData(); d.profile.name = 'Synthetic'; d.profile.email = 'synthetic@example.invalid'; d.notes.example = note; return d }
function account() { return `synthetic-safety-${++counter}` }
async function render(count = 1) {
  function Probe() { cloud = useCloudSync(); return null }
  await act(async () => root.render(createElement('div', null, Array.from({ length: count }, (_, key) => createElement(Probe, { key })))))
}
async function session(id: string | null, settle = true) {
  await act(async () => { for (const fn of wire.listeners) fn(id ? 'SIGNED_IN' : 'SIGNED_OUT', id ? { user: { id, email: 'synthetic@example.invalid' } } : null) })
  if (settle) await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).not.toBe('syncing') }, { interval: 1 })
}
beforeEach(() => {
  vi.stubGlobal('Blob', NodeBlob); wire.imageDownload.mockReset()
  localStorage.clear(); wire.rows.clear(); wire.pending.clear(); wire.snapshots.clear(); wire.writes.mockClear(); wire.archiveFails = false; wire.failures = []; wire.attempts.mockClear()
  observeSyncSession(null); useStore.persist.setOptions({ name: 'hq:app-data:guest' }); activateGuestWorkspace()
  root = createRoot(document.createElement('div'))
})
afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers(); vi.unstubAllGlobals() })

it('pauses every mounted coordinator for divergence and preserves both copies before any write', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('local newer')); const raw = localStorage.getItem(accountStorageKey(id))
  wire.rows.set(id, { data: workspace('remote older'), updated_at: older })
  await render(3); await session(id)
  expect(getAccountConflict(id)?.saved).toBe(true)
  expect(() => captureFolderFence(true)).toThrow('Resolve the account sync notice')
  expect(wire.snapshots.size).toBe(2)
  expect(snapshotData().notes.example).toBe('local newer')
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(isAccountSyncReady(id)).toBe(false)
  await act(async () => { await cloud.pushNow() })
  expect(wire.writes).not.toHaveBeenCalled()
})
it('keeps originals and downloadable copies when recovery storage fails', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('device')); const raw = localStorage.getItem(accountStorageKey(id))
  wire.rows.set(id, { data: workspace('cloud'), updated_at: older }); wire.archiveFails = true
  await render(); await session(id)
  expect(getAccountConflict(id)).toMatchObject({ localRaw: raw, saved: false })
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(isAccountSyncReady(id)).toBe(false); expect(wire.writes).not.toHaveBeenCalled()
})
it('accepts equal copies and records an account baseline without uploading', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('equal')); const actual = snapshotData()
  wire.rows.set(id, { data: actual, updated_at: older })
  await render(2); await session(id)
  expect(isAccountSyncReady(id)).toBe(true); expect(readSyncBaseline(id)?.updatedAt).toBe(older)
  expect(wire.writes).not.toHaveBeenCalled()
})
it('allows ordinary local edits with a trusted unchanged remote baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  wire.rows.set(id, { data: base, updated_at: older })
  await recordSyncBaseline(id, base, older, observeSyncSession(id))
  useStore.getState().update(d => { d.notes.example = 'dirty local' })
  await render(); await session(id)
  expect(getAccountConflict(id)).toBeUndefined(); expect(snapshotData().notes.example).toBe('dirty local')
  await act(async () => { expect(await cloud.pushNow()).toBe(true) })
  expect(wire.writes).toHaveBeenCalledTimes(1)
})
it('pulls a newer remote when the local copy exactly matches its trusted baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  await recordSyncBaseline(id, base, older, observeSyncSession(id))
  wire.rows.set(id, { data: { ...base, notes: { ...base.notes, example: 'remote changed' } }, updated_at: newer })
  await render(); await session(id)
  expect(snapshotData().notes.example).toBe('remote changed'); expect(isAccountSyncReady(id)).toBe(true)
})
it('loads a valid cloud account on a new device without seeding over another account', async () => {
  const id = account(); wire.rows.set(id, { data: workspace('remote only'), updated_at: older })
  await render(); await session(id)
  expect(snapshotData().notes.example).toBe('remote only'); expect(isAccountSyncReady(id)).toBe(true)
})
it('does not upload or erase local work when no cloud row exists', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('only local')); const raw = localStorage.getItem(accountStorageKey(id))
  await render(); await session(id)
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw); expect(wire.writes).not.toHaveBeenCalled(); expect(isAccountSyncReady(id)).toBe(false)
})
it('rejects a delayed account response after signout and another login', async () => {
  const a = account(), b = account(); let resolve!: (value: unknown) => void
  wire.pending.set(a, new Promise(r => { resolve = r }))
  wire.rows.set(b, { data: workspace('B owned'), updated_at: newer })
  await render(); await session(a, false); await session(null); await session(b)
  await act(async () => resolve({ data: workspace('stale A'), updated_at: older }))
  expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: b }); expect(snapshotData().notes.example).toBe('B owned')
  expect(localStorage.getItem(accountStorageKey(a))).toBeNull()
})
it('blocks cloud upload when durable account storage rejects an edit', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved')); wire.rows.set(id, { data: snapshotData(), updated_at: older })
  await render(); await session(id)
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota', 'QuotaExceededError') })
  try { await act(async () => { useStore.getState().update(d => { d.notes.example = 'unsaved' }); expect(await cloud.pushNow()).toBe(false) }) } finally { set.mockRestore() }
  expect(wire.writes).not.toHaveBeenCalled()
})
it('preserves both sides when both changed since a trusted baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  await recordSyncBaseline(id, base, older, observeSyncSession(id))
  useStore.getState().update(d => { d.notes.example = 'local changed' })
  wire.rows.set(id, { data: { ...base, notes: { ...base.notes, example: 'remote changed' } }, updated_at: newer })
  await render(); await session(id)
  expect(getAccountConflict(id)?.saved).toBe(true)
  expect(snapshotData().notes.example).toBe('local changed'); expect(wire.writes).not.toHaveBeenCalled()
})
it('rejects the first A response after A signs out and signs in again', async () => {
  const id = account(); let finish!: (value: unknown) => void
  wire.pending.set(id, new Promise(r => { finish = r }))
  await render(); await session(id, false); await session(null)
  wire.pending.delete(id); wire.rows.set(id, { data: workspace('current A'), updated_at: newer })
  await session(id)
  const current = localStorage.getItem(accountStorageKey(id))
  await act(async () => finish({ data: workspace('stale A'), updated_at: older }))
  expect(localStorage.getItem(accountStorageKey(id))).toBe(current)
  expect(snapshotData().notes.example).toBe('current A')
})
it('refuses a cloud update if another device changed the row since the baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  wire.rows.set(id, { data: base, updated_at: older }); await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'local edit' }))
  wire.rows.set(id, { data: { ...base, notes: { ...base.notes, example: 'concurrent cloud edit' } }, updated_at: newer })
  await act(async () => { expect(await cloud.pushNow()).toBe(false) })
  expect(wire.writes).not.toHaveBeenCalled()
  expect(getAccountConflict(id)?.saved).toBe(true)
})
it('keeps first-login Guest work visible for review before opening a new account cache', async () => {
  const id = account()
  useStore.getState().update(d => {
    d.notes.example = 'Guest work awaiting review'
    d.courses.push({ id: 'synthetic-guest-course', term: 'Fall 2026', code: 'TEST101', title: 'Guest class', credits: 3, grade: '', bcpm: false, status: 'planned', inResidence: true, satisfies: [], order: 0 })
  })
  wire.rows.set(id, { data: workspace('existing cloud'), updated_at: older })
  await render(); await session(id)
  expect(activeWorkspaceOwner()).toEqual({ kind: 'guest' })
  expect(snapshotData().notes.example).toBe('Guest work awaiting review')
  expect(localStorage.getItem(accountStorageKey(id))).toBeNull()
  expect(wire.writes).not.toHaveBeenCalled()
})
it('preserves unreadable account bytes for download without loading or uploading defaults', async () => {
  const id = account(), raw = JSON.stringify({ state: {}, version: 50 })
  localStorage.setItem(accountStorageKey(id), raw)
  wire.rows.set(id, { data: workspace('cloud'), updated_at: older })
  await render(); await session(id)
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(getAccountConflict(id)).toMatchObject({ localRaw: raw, saved: true })
  expect(isAccountSyncReady(id)).toBe(false); expect(wire.writes).not.toHaveBeenCalled()
})
it('keeps a readable returning-account cache visible when the cloud copy is invalid', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('device content')); const raw = localStorage.getItem(accountStorageKey(id))
  wire.rows.set(id, { data: {}, updated_at: older })
  await render(); await session(id)
  expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: id })
  expect(snapshotData().notes.example).toBe('device content')
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(isAccountSyncReady(id)).toBe(false); expect(wire.writes).not.toHaveBeenCalled()
})
it('does not discard volatile account edits when a save failed before reconciliation', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved')); wire.rows.set(id, { data: snapshotData(), updated_at: older })
  await render(); await session(id)
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota', 'QuotaExceededError') })
  try {
    await act(async () => useStore.getState().update(d => { d.notes.example = 'volatile unsaved edit' }))
    await act(async () => cloud.pullNow())
    expect(snapshotData().notes.example).toBe('volatile unsaved edit')
    expect(isAccountSyncReady(id)).toBe(false)
    expect(wire.writes).not.toHaveBeenCalled()
  } finally { set.mockRestore() }
})

it('keeps volatile Guest work open when signing into a returning account', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved account')); const accountRaw = localStorage.getItem(accountStorageKey(id))
  activateGuestWorkspace()
  wire.rows.set(id, { data: workspace('cloud account'), updated_at: newer })
  await render()
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota', 'QuotaExceededError') })
  await act(async () => useStore.getState().update(d => { d.notes.example = 'unsaved Guest work' }))
  set.mockRestore()
  await session(id)
  expect(activeWorkspaceOwner()).toEqual({ kind: 'guest' })
  expect(snapshotData().notes.example).toBe('unsaved Guest work')
  expect(getAccountConflict(id)?.open?.data.notes.example).toBe('unsaved Guest work')
  expect(localStorage.getItem(accountStorageKey(id))).toBe(accountRaw)
  expect(wire.writes).not.toHaveBeenCalled()
})
it('does not replace open work edited while the cloud read is pending', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('old device'))
  let finish!: (value: unknown) => void
  wire.pending.set(id, new Promise(r => { finish = r }))
  await render(); await session(id, false)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'new edit while waiting' }))
  await act(async () => finish({ data: workspace('cloud'), updated_at: newer }))
  await vi.waitFor(() => expect(cloud.status).toBe('error'))
  expect(snapshotData().notes.example).toBe('new edit while waiting')
  expect(isAccountSyncReady(id)).toBe(false)
})
it('a stale lease cannot reopen sync after another operation pauses it', () => {
  const id = account(); observeSyncSession(id)
  const lease = pauseAccountSync(id)
  pauseAccountSync(id)
  expect(() => allowAccountSync(lease)).toThrow('newer operation')
  expect(isAccountSyncReady(id)).toBe(false)
})
it('does not record a baseline after a newer pause while its digest is pending', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved')); observeSyncSession(id)
  const lease = pauseAccountSync(id)
  let finish!: (value: ArrayBuffer) => void
  const digest = vi.spyOn(crypto.subtle, 'digest').mockImplementationOnce(() => new Promise(r => { finish = r }))
  try {
    const work = recordSyncBaseline(id, snapshotData(), newer, lease)
    const rejected = expect(work).rejects.toThrow('newer operation')
    pauseAccountSync(id); finish(new ArrayBuffer(32))
    await rejected
    expect(readSyncBaseline(id)).toBeNull()
    expect(isAccountSyncReady(id)).toBe(false)
  } finally { digest.mockRestore() }
})

it('hides a signed-out account while retaining its unsaved edits for that owner', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved')); wire.rows.set(id, { data: snapshotData(), updated_at: older })
  await render(); await session(id)
  const raw = localStorage.getItem(accountStorageKey(id))
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota', 'QuotaExceededError') })
  await act(async () => useStore.getState().update(d => { d.notes.example = 'retained signed-out edit' }))
  set.mockRestore()
  await session(null)
  expect(activeWorkspaceOwner()).toEqual({ kind: 'guest' })
  expect(snapshotData().notes.example).not.toBe('retained signed-out edit')
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  const other = account(); wire.rows.set(other, { data: workspace('other account'), updated_at: older })
  await session(other)
  expect(getAccountConflict(other)?.open).toBeUndefined()
  await session(null); await session(id)
  expect(getAccountConflict(id)?.open?.data.notes.example).toBe('retained signed-out edit')
  expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled()
})


it('automatically retries a temporary cloud save failure without another edit or click', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base'))
  wire.rows.set(id, { data: snapshotData(), updated_at: older })
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'latest edit' }))
  wire.failures.push({ status: 500, error: { message: 'Temporary server failure' } })
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  await act(async () => {
    const saving = cloud.pushNow()
    await vi.advanceTimersByTimeAsync(3000)
    expect(await saving).toBe(true)
  })
  expect(wire.attempts).toHaveBeenCalledTimes(2)
  expect(wire.writes).toHaveBeenCalledTimes(1)
  expect((wire.rows.get(id) as { data: ReturnType<typeof snapshotData> }).data.notes.example).toBe('latest edit')
  expect(cloud.status).toBe('synced')
})

it.each([false, true])('stops a save retry after another pause, even if it resumes (%s)', async resume => {
  const id = account(); activateAccountWorkspace(id, workspace('base'))
  wire.rows.set(id, { data: snapshotData(), updated_at: older })
  await render(); await session(id)
  wire.failures.push({ status: 500, error: { message: 'Temporary' } })
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  await act(async () => {
    const saving = cloud.pushNow()
    await vi.advanceTimersByTimeAsync(1)
    expect(wire.attempts).toHaveBeenCalledTimes(1)
    const newerLease = pauseAccountSync(id)
    if (resume) allowAccountSync(newerLease)
    await vi.advanceTimersByTimeAsync(3000)
    expect(await saving).toBe(false)
  })
  expect(wire.attempts).toHaveBeenCalledTimes(1)
  expect(wire.writes).not.toHaveBeenCalled()
})

it('asks for review if the cloud changes while an automatic retry is waiting', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  wire.rows.set(id, { data: base, updated_at: older })
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'local edit' }))
  wire.failures.push({ status: 500, error: { message: 'Temporary' } })
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  await act(async () => {
    const saving = cloud.pushNow()
    await vi.advanceTimersByTimeAsync(1)
    wire.rows.set(id, { data: { ...base, notes: { ...base.notes, example: 'other device edit' } }, updated_at: newer })
    await vi.advanceTimersByTimeAsync(3000)
    expect(await saving).toBe(false)
  })
  expect(getAccountConflict(id)?.saved).toBe(true)
  await act(async () => { window.dispatchEvent(new Event('online')); await vi.advanceTimersByTimeAsync(120_000) })
  expect(wire.writes).not.toHaveBeenCalled()
  expect(snapshotData().notes.example).toBe('local edit')
})

it('resumes automatically when the connection returns after bounded retries', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base'))
  wire.rows.set(id, { data: snapshotData(), updated_at: older })
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'offline edit' }))
  wire.failures.push(...Array.from({ length: 4 }, () => ({ status: 503, error: { message: 'Unavailable' } })))
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  await act(async () => {
    const saving = cloud.pushNow()
    await vi.advanceTimersByTimeAsync(15_000)
    expect(await saving).toBe(false)
  })
  expect(cloud.status).toBe('error')
  expect(wire.writes).not.toHaveBeenCalled()
  await act(async () => { window.dispatchEvent(new Event('online')) })
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).toBe('synced') }, { interval: 1 })
  await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
  expect(wire.writes).toHaveBeenCalledTimes(1)
  expect((wire.rows.get(id) as { data: ReturnType<typeof snapshotData> }).data.notes.example).toBe('offline edit')
})

async function imageWorkspace() {
  const data = workspace('with image'), pkg = visualFixture(), blob = new Blob(['Synthetic image bytes'], { type: 'image/png' }), hash = await binaryDigest(blob)
  data.academics.classCenter.lectures.push({ id: 'image-lecture', courseId: 'example', title: pkg.entries[0].title, inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0,
    importedNotebook: { original: pkg, current: pkg, originalRaw: JSON.stringify(pkg), entryId: pkg.entries[0].id, fingerprint: 'synthetic', importedAt: 1, progress: {}, notes: '', assetBindings: [{ assetId: pkg.assets[0].id, sha256: hash, byteLength: blob.size, mimeType: 'image/png', width: 1, height: 1 }] } })
  return { data, blob }
}
it.each([503, 403])('only retries a retryable image failure in the background (%s)', async status => {
  const id = account(), f = await imageWorkspace()
  activateAccountWorkspace(id, f.data); wire.rows.set(id, { data: snapshotData(), updated_at: older })
  wire.imageDownload.mockResolvedValue({ error: { status, statusCode: status === 503 ? 'SlowDown' : 'AccessDenied', message: 'Image request failed' } })
  await render()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  await session(id, false)
  await vi.waitFor(() => expect(wire.imageDownload).toHaveBeenCalled(), { interval: 1 })
  await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
  expect(cloud.status).toBe('error'); expect(cloud.error).toContain(`HTTP ${status}`)
  expect(isAccountSyncReady(id)).toBe(false); expect(getAccountConflict(id)).toBeUndefined()
  expect(readSyncBaseline(id)).toBeNull(); expect(wire.writes).not.toHaveBeenCalled()
  expect(() => captureFolderFence(true)).toThrow('Account sync has not finished checking')
  const attempts = wire.imageDownload.mock.calls.length
  expect(attempts).toBe(status === 503 ? 4 : 1)
  wire.imageDownload.mockResolvedValue({ data: f.blob, error: null })
  await act(async () => { await vi.advanceTimersByTimeAsync(60000) })
  if (status === 503) {
    await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).toBe('synced') }, { interval: 1 })
    expect(cloud.status).toBe('synced'); expect(isAccountSyncReady(id)).toBe(true)
    expect(readSyncBaseline(id)?.updatedAt).toBe(older)
    expect(() => captureFolderFence(true)).not.toThrow()
    expect(wire.imageDownload).toHaveBeenCalledTimes(attempts + 1)
  } else {
    expect(cloud.status).toBe('error'); expect(isAccountSyncReady(id)).toBe(false)
    expect(wire.imageDownload).toHaveBeenCalledTimes(attempts)
  }
  expect(wire.writes).not.toHaveBeenCalled()
})
it('keeps the current review stable when another sync check runs during a conflict', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('device edit'))
  wire.rows.set(id, { data: workspace('cloud edit'), updated_at: older })
  await render(); await session(id)
  const conflict = getAccountConflict(id), copies = wire.snapshots.size
  expect(conflict?.saved).toBe(true)
  await act(async () => { await cloud.pullNow() })
  expect(getAccountConflict(id)).toBe(conflict)
  expect(wire.snapshots.size).toBe(copies)
  expect(wire.writes).not.toHaveBeenCalled()
  expect(cloud.status).toBe('error')
})

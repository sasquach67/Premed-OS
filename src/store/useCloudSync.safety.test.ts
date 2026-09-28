import { CURRENT_CLOUD_SCHEMA } from '@/lib/workspaceSchema'
import { Blob as NodeBlob } from 'node:buffer'
import { act, createElement, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const wire = vi.hoisted(() => ({ sessionUser: null as string | null, listeners: new Set<(event: string, session: unknown) => void>(), rows: new Map<string, unknown>(), pending: new Map<string, Promise<unknown>>(), snapshots: new Map<string, unknown>(), writes: vi.fn(), archiveFails: false, failures: [] as Array<{ status: number; error: Record<string, unknown> }>, attempts: vi.fn(), imageDownload: vi.fn(), loseResponses: 0, missingColumns: false }))
vi.mock('@/lib/supabase', async () => {
  const { fakeDashboardsTable } = await import('@/test/fakeDashboards')
  return {
    isSupabaseConfigured: true, authRedirectTo: 'http://localhost/#/auth',
    supabase: {
      auth: { getSession: async () => ({ data: { session: wire.sessionUser ? { user: { id: wire.sessionUser } } : null } }), onAuthStateChange: (cb: (event: string, session: unknown) => void) => { wire.listeners.add(cb); return { data: { subscription: { unsubscribe: () => wire.listeners.delete(cb) } } } } },
      storage: { from: () => ({ download: wire.imageDownload }) },
      from: () => fakeDashboardsTable(wire),
    },
  }
})
vi.mock('@/lib/academics/notebook/notebookAssetStore', () => ({ notebookAssetRepository: () => ({ read: async () => undefined }) }))
vi.mock('@/lib/academics/sharedMaterialFiles', () => ({ MATERIAL_BUCKET: 'academic-originals', syncAcademicOriginals: vi.fn(async () => undefined) }))
vi.mock('./workspaceRecoveryRepository', () => ({ workspaceRecoveryRepository: () => ({
  latest: async () => null,
  save: async (snapshot: { workspaceKey: string; id: string }) => { if (wire.archiveFails) throw new Error('Synthetic archive quota'); wire.snapshots.set(snapshot.workspaceKey + snapshot.id, snapshot) },
  read: async (key: string, id: string) => wire.snapshots.get(key + id),
}) }))

import { createPersonalInitialData } from '@/data/personalInitialData'
import { claimedRow } from '@/test/fakeDashboards'
import legacyFixture from './__fixtures__/s1-d60f682-baseline.json'
import { accountStorageKey, activeWorkspaceOwner } from '@/lib/demoMode'
import { activateAccountWorkspace, activateGuestWorkspace, snapshotData, useStore } from './store'
import { getAccountConflict, allowAccountSync, pauseAccountSync, observeSyncSession, readSyncBaseline, recordSyncBaseline, isAccountSyncReady, getAccountRecoveryNotice, ADDITIVE_RECOVERY_NOTICE } from './accountSyncSafety'
import { useCloudSync } from './useCloudSync'
import { AccountCloudContext, useAccountCloud } from './AccountCloudContext'
import { visualFixture } from '@/lib/academics/notebook/visual.test-fixtures'
import { binaryDigest } from '@/lib/workspaceAssets'
import * as storageHealth from './storageHealth'
import { captureFolderFence } from '@/lib/academics/materialFolder/controller'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root, cloud: ReturnType<typeof useCloudSync>, counter = 0
const older = '2026-09-10T12:00:00Z', newer = '2026-09-11T12:00:00Z'
function workspace(note: string) { const d = createPersonalInitialData(); d.profile.name = 'Synthetic'; d.profile.email = 'synthetic@example.invalid'; d.notes.example = note; return d }
/** Rows and baselines for an account a current app has already protected. */
function claimed(data: object, updatedAt: string, writeRev = 1) { return claimedRow(data as Record<string, unknown>, updatedAt, writeRev) }
function revision(updatedAt: string, writeRev = 1) { return { updatedAt, claim: { cloudSchema: CURRENT_CLOUD_SCHEMA, writeRev } } }
function account() { return `synthetic-safety-${++counter}` }
function Probe() { const value = useCloudSync(); useEffect(() => { cloud = value }, [value]); return null }
async function render(count = 1) {
  await act(async () => root.render(createElement('div', null, Array.from({ length: count }, (_, key) => createElement(Probe, { key })))))
}
async function session(id: string | null, settle = true) {
  await act(async () => { for (const fn of wire.listeners) fn(id ? 'SIGNED_IN' : 'SIGNED_OUT', id ? { user: { id, email: 'synthetic@example.invalid' } } : null) })
  if (settle) await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).not.toBe('syncing') }, { interval: 1 })
}
beforeEach(() => {
  vi.stubGlobal('Blob', NodeBlob); wire.imageDownload.mockReset()
  localStorage.clear(); wire.sessionUser = null; wire.rows.clear(); wire.pending.clear(); wire.snapshots.clear(); wire.writes.mockClear(); wire.archiveFails = false; wire.failures = []; wire.attempts.mockClear(); wire.loseResponses = 0; wire.missingColumns = false
  observeSyncSession(null); useStore.persist.setOptions({ name: 'hq:app-data:guest' }); activateGuestWorkspace()
  root = createRoot(document.createElement('div'))
})
afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers(); vi.unstubAllGlobals() })

it('pauses every mounted coordinator for divergence and preserves both copies before any write', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('local newer')); const raw = localStorage.getItem(accountStorageKey(id))
  wire.rows.set(id, claimed(workspace('remote older'), older))
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
  wire.rows.set(id, claimed(workspace('cloud'), older)); wire.archiveFails = true
  await render(); await session(id)
  expect(getAccountConflict(id)).toMatchObject({ localRaw: raw, saved: false })
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(isAccountSyncReady(id)).toBe(false); expect(wire.writes).not.toHaveBeenCalled()
})
it('accepts equal copies and records an account baseline without uploading', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('equal')); const actual = snapshotData()
  wire.rows.set(id, claimed(actual, older))
  await render(2); await session(id)
  expect(isAccountSyncReady(id)).toBe(true); expect(readSyncBaseline(id)?.updatedAt).toBe(older)
  expect(wire.writes).not.toHaveBeenCalled()
})
it('allows ordinary local edits with a trusted unchanged remote baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  wire.rows.set(id, claimed(base, older))
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  useStore.getState().update(d => { d.notes.example = 'dirty local' })
  await render(); await session(id)
  expect(getAccountConflict(id)).toBeUndefined(); expect(snapshotData().notes.example).toBe('dirty local')
  await act(async () => { expect(await cloud.pushNow()).toBe(true) })
  expect(wire.writes).toHaveBeenCalledTimes(1)
})
it('pulls a newer remote when the local copy exactly matches its trusted baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  wire.rows.set(id, claimed({ ...base, notes: { ...base.notes, example: 'remote changed' } }, newer))
  await render(); await session(id)
  expect(snapshotData().notes.example).toBe('remote changed'); expect(isAccountSyncReady(id)).toBe(true)
})
it('loads a valid cloud account on a new device without seeding over another account', async () => {
  const id = account(); wire.rows.set(id, claimed(workspace('remote only'), older))
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
  wire.rows.set(b, claimed(workspace('B owned'), newer))
  await render(); await session(a, false); await session(null); await session(b)
  await act(async () => resolve(claimed(workspace('stale A'), older)))
  expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: b }); expect(snapshotData().notes.example).toBe('B owned')
  expect(localStorage.getItem(accountStorageKey(a))).toBeNull()
})
it('blocks cloud upload when durable account storage rejects an edit', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved')); wire.rows.set(id, claimed(snapshotData(), older))
  await render(); await session(id)
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota', 'QuotaExceededError') })
  try { await act(async () => { useStore.getState().update(d => { d.notes.example = 'unsaved' }); expect(await cloud.pushNow()).toBe(false) }) } finally { set.mockRestore() }
  expect(wire.writes).not.toHaveBeenCalled()
})
it('preserves both sides when both changed since a trusted baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  useStore.getState().update(d => { d.notes.example = 'local changed' })
  wire.rows.set(id, claimed({ ...base, notes: { ...base.notes, example: 'remote changed' } }, newer))
  await render(); await session(id)
  expect(getAccountConflict(id)?.saved).toBe(true)
  expect(snapshotData().notes.example).toBe('local changed'); expect(wire.writes).not.toHaveBeenCalled()
})
it('rejects the first A response after A signs out and signs in again', async () => {
  const id = account(); let finish!: (value: unknown) => void
  wire.pending.set(id, new Promise(r => { finish = r }))
  await render(); await session(id, false); await session(null)
  wire.pending.delete(id); wire.rows.set(id, claimed(workspace('current A'), newer))
  await session(id)
  const current = localStorage.getItem(accountStorageKey(id))
  await act(async () => finish(claimed(workspace('stale A'), older)))
  expect(localStorage.getItem(accountStorageKey(id))).toBe(current)
  expect(snapshotData().notes.example).toBe('current A')
})
it('refuses a cloud update if another device changed the row since the baseline', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  wire.rows.set(id, claimed(base, older)); await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'local edit' }))
  wire.rows.set(id, claimed({ ...base, notes: { ...base.notes, example: 'concurrent cloud edit' } }, newer))
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
  wire.rows.set(id, claimed(workspace('existing cloud'), older))
  await render(); await session(id)
  expect(activeWorkspaceOwner()).toEqual({ kind: 'guest' })
  expect(snapshotData().notes.example).toBe('Guest work awaiting review')
  expect(localStorage.getItem(accountStorageKey(id))).toBeNull()
  expect(wire.writes).not.toHaveBeenCalled()
})
it('preserves unreadable account bytes for download without loading or uploading defaults', async () => {
  const id = account(), raw = JSON.stringify({ state: {}, version: 50 })
  localStorage.setItem(accountStorageKey(id), raw)
  wire.rows.set(id, claimed(workspace('cloud'), older))
  await render(); await session(id)
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(getAccountConflict(id)).toMatchObject({ localRaw: raw, saved: true })
  expect(isAccountSyncReady(id)).toBe(false); expect(wire.writes).not.toHaveBeenCalled()
})
it('keeps a readable returning-account cache visible when the cloud copy is invalid', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('device content')); const raw = localStorage.getItem(accountStorageKey(id))
  wire.rows.set(id, claimed({}, older))
  await render(); await session(id)
  expect(activeWorkspaceOwner()).toEqual({ kind: 'account', userId: id })
  expect(snapshotData().notes.example).toBe('device content')
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(isAccountSyncReady(id)).toBe(false); expect(wire.writes).not.toHaveBeenCalled()
})
it('does not discard volatile account edits when a save failed before reconciliation', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved')); wire.rows.set(id, claimed(snapshotData(), older))
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
  wire.rows.set(id, claimed(workspace('cloud account'), newer))
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
  await act(async () => finish(claimed(workspace('cloud'), newer)))
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
    const work = recordSyncBaseline(id, snapshotData(), revision(newer), lease)
    const rejected = expect(work).rejects.toThrow('newer operation')
    pauseAccountSync(id); finish(new ArrayBuffer(32))
    await rejected
    expect(readSyncBaseline(id)).toBeNull()
    expect(isAccountSyncReady(id)).toBe(false)
  } finally { digest.mockRestore() }
})

it('hides a signed-out account while retaining its unsaved edits for that owner', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('saved')); wire.rows.set(id, claimed(snapshotData(), older))
  await render(); await session(id)
  const raw = localStorage.getItem(accountStorageKey(id))
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota', 'QuotaExceededError') })
  await act(async () => useStore.getState().update(d => { d.notes.example = 'retained signed-out edit' }))
  set.mockRestore()
  await session(null)
  expect(activeWorkspaceOwner()).toEqual({ kind: 'guest' })
  expect(snapshotData().notes.example).not.toBe('retained signed-out edit')
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  const other = account(); wire.rows.set(other, claimed(workspace('other account'), older))
  await session(other)
  expect(getAccountConflict(other)?.open).toBeUndefined()
  await session(null); await session(id)
  expect(getAccountConflict(id)?.open?.data.notes.example).toBe('retained signed-out edit')
  expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled()
})


it('automatically retries a temporary cloud save failure without another edit or click', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base'))
  wire.rows.set(id, claimed(snapshotData(), older))
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
  wire.rows.set(id, claimed(snapshotData(), older))
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
  wire.rows.set(id, claimed(base, older))
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'local edit' }))
  wire.failures.push({ status: 500, error: { message: 'Temporary' } })
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  await act(async () => {
    const saving = cloud.pushNow()
    await vi.advanceTimersByTimeAsync(1)
    wire.rows.set(id, claimed({ ...base, notes: { ...base.notes, example: 'other device edit' } }, newer))
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
  wire.rows.set(id, claimed(snapshotData(), older))
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

async function imageWorkspace(suffix = '') {
  const data = workspace('with image'), pkg = visualFixture(), blob = new Blob(['Synthetic image bytes' + suffix], { type: 'image/png' }), hash = await binaryDigest(blob)
  data.academics.classCenter.lectures.push({ id: 'image-lecture', courseId: 'example', title: pkg.entries[0].title, inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0,
    importedNotebook: { original: pkg, current: pkg, originalRaw: JSON.stringify(pkg), entryId: pkg.entries[0].id, fingerprint: 'synthetic', importedAt: 1, progress: {}, notes: '', assetBindings: [{ assetId: pkg.assets[0].id, sha256: hash, byteLength: blob.size, mimeType: 'image/png', width: 1, height: 1 }] } })
  return { data, blob }
}
it.each([503, 403])('only retries a retryable image failure in the background (%s)', async status => {
  const id = account(), f = await imageWorkspace()
  activateAccountWorkspace(id, f.data); wire.rows.set(id, claimed(snapshotData(), older))
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
  wire.rows.set(id, claimed(workspace('cloud edit'), older))
  await render(); await session(id)
  const conflict = getAccountConflict(id), copies = wire.snapshots.size
  expect(conflict?.saved).toBe(true)
  await act(async () => { await cloud.pullNow() })
  expect(getAccountConflict(id)).toBe(conflict)
  expect(wire.snapshots.size).toBe(copies)
  expect(wire.writes).not.toHaveBeenCalled()
  expect(cloud.status).toBe('error')
})


it('keeps folder connection ready across Settings observer mounts and navigation', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('verified device'))
  const row = claimed(snapshotData(), older)
  wire.rows.set(id, row)
  let observed: ReturnType<typeof useAccountCloud> | undefined
  function SettingsObserver() { const value = useAccountCloud(); useEffect(() => { observed = value }, [value]); return null }
  function Shell({ settings }: { settings: boolean }) {
    const value = useCloudSync()
    useEffect(() => { cloud = value }, [value])
    return createElement(AccountCloudContext.Provider, { value }, settings
      ? createElement('div', null, createElement(SettingsObserver), createElement(SettingsObserver)) : null)
  }
  await act(async () => root.render(createElement(Shell, { settings: false })))
  await session(id)
  expect(() => captureFolderFence(true)).not.toThrow()
  // A slow cloud read would keep a newly started controller paused indefinitely.
  // Settings must share the already verified shell controller instead.
  wire.pending.set(id, new Promise(() => {})); wire.sessionUser = id
  for (const settings of [true, false, true]) {
    await act(async () => root.render(createElement(Shell, { settings })))
    expect(() => captureFolderFence(true)).not.toThrow()
    expect(wire.listeners.size).toBe(1)
    if (settings) expect(observed).toBe(cloud)
  }
  await act(async () => pauseAccountSync(id))
  expect(observed?.accountReady).toBe(false)
  expect(() => captureFolderFence(true)).toThrow('Account sync has not finished checking')
})

it('checks workspace durability once per image batch instead of revalidating the whole notebook tree for every image', async () => {
  const id = account(), data = workspace('image batch')
  const images = new Map<string, Blob>()
  for (let n = 0; n < 20; n++) {
    const f = await imageWorkspace(String(n))
    const lecture = f.data.academics.classCenter.lectures[0]
    lecture.id = `image-${n}`
    data.academics.classCenter.lectures.push(lecture)
    images.set(lecture.importedNotebook!.assetBindings![0].sha256, f.blob)
  }
  activateAccountWorkspace(id, data); wire.rows.set(id, claimed(snapshotData(), older))
  wire.imageDownload.mockImplementation(async (path: string) => ({ data: images.get(path.split('/').at(-1)!), error: null }))
  const reads = vi.spyOn(storageHealth, 'readStoredWorkspace')
  try {
    await render(); await session(id, false)
    await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).not.toBe('syncing') }, { timeout: 5000, interval: 1 })
    expect(cloud.status).toBe('synced')
    expect(wire.imageDownload).toHaveBeenCalledTimes(20)
    expect(() => captureFolderFence(true)).not.toThrow()
    expect(reads.mock.calls.length).toBeLessThan(20)
  } finally { reads.mockRestore() }
})

it.each(['memory', 'disk', 'account', 'pause'])('stops image verification if %s changes during a download', async change => {
  const id = account(), f = await imageWorkspace()
  activateAccountWorkspace(id, f.data); wire.rows.set(id, claimed(snapshotData(), older))
  let release!: (value: unknown) => void
  wire.imageDownload.mockImplementation(() => new Promise(resolve => { release = resolve }))
  await render(); await session(id, false)
  await vi.waitFor(async () => { await act(async () => {}); expect(wire.imageDownload).toHaveBeenCalled() }, { interval: 1 })
  expect(cloud.progress).toBe('Checking notebook images (0 of 1)…')
  await act(async () => {
    if (change === 'memory') useStore.getState().update(d => { d.notes.example = 'new edit while checking' })
    if (change === 'disk') {
      const raw = JSON.parse(localStorage.getItem(accountStorageKey(id))!)
      raw.state.notes.example = 'another tab edit'
      localStorage.setItem(accountStorageKey(id), JSON.stringify(raw))
    }
    if (change === 'account') activateGuestWorkspace()
    if (change === 'pause') pauseAccountSync(id)
    release({ data: f.blob, error: null })
  })
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).toBe('error') }, { interval: 1 })
  expect(isAccountSyncReady(id)).toBe(false)
  expect(readSyncBaseline(id)).toBeNull()
  expect(wire.writes).not.toHaveBeenCalled()
  if (change === 'memory') expect(snapshotData().notes.example).toBe('new edit while checking')
})

it('does not revalidate the entire workspace per image when pushing an ordinary metadata edit', async () => {
  const id = account(), data = workspace('image push batch'), images = new Map<string, Blob>()
  for (let n = 0; n < 20; n++) {
    const f = await imageWorkspace(String(n)), lecture = f.data.academics.classCenter.lectures[0]
    lecture.id = `push-image-${n}`; data.academics.classCenter.lectures.push(lecture)
    images.set(lecture.importedNotebook!.assetBindings![0].sha256, f.blob)
  }
  activateAccountWorkspace(id, data); wire.rows.set(id, claimed(snapshotData(), older))
  wire.imageDownload.mockImplementation(async (path: string) => ({ data: images.get(path.split('/').at(-1)!), error: null }))
  await render(); await session(id, false)
  await vi.waitFor(async () => { await act(async () => {}); expect(cloud.status).toBe('synced') }, { timeout: 5000, interval: 1 })
  await act(async () => useStore.getState().update(d => { d.notes.example = 'ordinary metadata edit' }))
  wire.imageDownload.mockClear()
  const reads = vi.spyOn(storageHealth, 'readStoredWorkspace')
  try {
    await act(async () => { expect(await cloud.pushNow()).toBe(true) })
    expect(wire.imageDownload).toHaveBeenCalledTimes(20)
    expect(wire.writes).toHaveBeenCalledTimes(1)
    expect(reads.mock.calls.length).toBeLessThan(20)
    expect(cloud.status).toBe('synced')
  } finally { reads.mockRestore() }
})

it.each(['memory', 'disk', 'account', 'pause'])('does not push stale metadata when %s changes during an image download', async change => {
  const id = account(), f = await imageWorkspace()
  activateAccountWorkspace(id, f.data); wire.rows.set(id, claimed(snapshotData(), older))
  wire.imageDownload.mockResolvedValue({ data: f.blob, error: null })
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'metadata ready to push' }))
  let release!: (value: unknown) => void
  wire.imageDownload.mockImplementation(() => new Promise(resolve => { release = resolve }))
  let saving!: Promise<boolean>
  await act(async () => { saving = cloud.pushNow() })
  await vi.waitFor(() => expect(release).toBeTypeOf('function'), { interval: 1 })
  await act(async () => {
    if (change === 'memory') useStore.getState().update(d => { d.notes.example = 'newer edit during push' })
    if (change === 'disk') {
      const raw = JSON.parse(localStorage.getItem(accountStorageKey(id))!)
      raw.state.notes.example = 'another tab edit during push'
      localStorage.setItem(accountStorageKey(id), JSON.stringify(raw))
    }
    if (change === 'account') activateGuestWorkspace()
    if (change === 'pause') pauseAccountSync(id)
    release({ data: f.blob, error: null })
    expect(await saving).toBe(false)
  })
  expect(wire.writes).not.toHaveBeenCalled()
  expect(readSyncBaseline(id)?.updatedAt).toBe(older)
  if (change === 'memory') expect(snapshotData().notes.example).toBe('newer edit during push')
  if (change === 'pause') expect(isAccountSyncReady(id)).toBe(false)
})

it('S1 retains a future cloud document for recovery without hydrating it or allowing replacement', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('device copy'))
  const raw = localStorage.getItem(accountStorageKey(id))
  const remote = { ...workspace('future cloud'), _schema: CURRENT_CLOUD_SCHEMA + 1, futureResearch: [{ id: 'future-only', nested: { intact: true } }] }
  const row = claimedRow(remote, older, 1, CURRENT_CLOUD_SCHEMA + 1)
  wire.rows.set(id, row)
  await render(); await session(id)
  expect(getAccountConflict(id)).toMatchObject({ schemaBlocked: true, saved: true, remote })
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(snapshotData().notes.example).toBe('device copy')
  expect(() => useStore.getState().setNote('blocked', 'must not apply')).toThrow('newer version')
  expect(isAccountSyncReady(id)).toBe(false)
  await act(async () => { await cloud.pullNow(); expect(await cloud.pushNow()).toBe(false) })
  expect(wire.attempts).not.toHaveBeenCalled()
  expect(() => allowAccountSync(observeSyncSession(id))).toThrow()
  await session(null); await session(id)
  expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.rows.get(id)).toEqual(row)
})

it('S1 terminal schema rejection fences uploads and Drive readiness across reconnect and explicit pulls', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base'))
  const original = claimed(snapshotData(), older)
  wire.rows.set(id, original)
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'recent edit' }))
  wire.failures.push({ status: 400, error: { message: 'This tab is out of date. Export your changes, then reopen Premed OS.', code: 'P0001', details: 'S1_SCHEMA_GUARD' } } as typeof wire.failures[number])
  await act(async () => { expect(await cloud.pushNow()).toBe(false) })
  expect(isAccountSyncReady(id)).toBe(false)
  expect(cloud.error).toContain('out of date')
  expect(snapshotData().notes.example).toBe('recent edit')
  expect(wire.rows.get(id)).toEqual(original)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'another device edit' }))
  expect(snapshotData().notes.example).toBe('another device edit')
  await act(async () => { await cloud.pullNow(); expect(await cloud.pushNow()).toBe(false) })
  await session(null); await session(id)
  expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.attempts).toHaveBeenCalledTimes(1)
})

it('S1 carries supported opaque data through an ordinary upload with the current marker', async () => {
  const id = account(), opaque = { samples: [{ id: 'synthetic', values: [1, 2, 3] }] }
  const original = { ...workspace('base'), _schema: CURRENT_CLOUD_SCHEMA, futureCollection: opaque }
  wire.rows.set(id, claimed(original, older))
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'edited' }))
  await act(async () => { expect(await cloud.pushNow()).toBe(true) })
  expect(wire.rows.get(id)).toMatchObject({ data: { _schema: CURRENT_CLOUD_SCHEMA, futureCollection: opaque, notes: { example: 'edited' } } })
})

// ---- S1 revision 3: row metadata, claim on load, compare-and-set on write_rev ----
type StoredRow = { data: Record<string, unknown>; updated_at: string; cloud_schema: number | null; write_rev: number | null }
const stored = (id: string) => wire.rows.get(id) as StoredRow
const withoutMarker = (data: Record<string, unknown>) => { const { _schema: _, ...rest } = data; return rest }

it('S1 claims an unclaimed row on load with exactly the reviewed cloud document and only then reports protection', async () => {
  const id = account(), legacy = { ...workspace('legacy cloud'), futureCollection: { nested: { kept: ['exact'] } }, stories: [{ id: 'story', title: 'Kept as stored' }] }
  wire.rows.set(id, { data: structuredClone(legacy), updated_at: older })
  await render()
  expect(cloud.protection).toBe('unknown')
  await session(id)
  expect(wire.writes).toHaveBeenCalledTimes(1)
  const row = stored(id)
  expect(row).toMatchObject({ cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 1 })
  expect(row.updated_at).not.toBe(older)
  // Only the portable marker was added: no privacy rewrite, defaults or local content.
  expect(withoutMarker(row.data)).toEqual(legacy)
  expect(row.data._schema).toBe(CURRENT_CLOUD_SCHEMA)
  expect(readSyncBaseline(id)).toMatchObject({ updatedAt: row.updated_at, claim: { cloudSchema: CURRENT_CLOUD_SCHEMA, writeRev: 1 } })
  expect(cloud.protection).toBe('on')
  expect(isAccountSyncReady(id)).toBe(true)
})

// Pre-S1 upgrade: a baseline recorded by the deployed app (d60f682). The fixture's
// digest was computed by that revision's own syncContent/syncDigest (scripts/s1 hook
// fixture), never by this branch, so a changed digest algorithm cannot hide here.
function legacyAccount() {
  const id = account()
  activateAccountWorkspace(id, structuredClone(legacyFixture.snapshot) as unknown as ReturnType<typeof snapshotData>)
  localStorage.setItem(`premed-os:sync-baseline:v1:${id}`, JSON.stringify({ digest: legacyFixture.digest, updatedAt: older }))
  return id
}
it('S1 hashes the d60f682 fixture exactly as d60f682 did, with or without the portable marker', async () => {
  const { syncContent, syncDigest } = await import('./accountSyncSafety')
  const snapshot = structuredClone(legacyFixture.snapshot) as unknown as ReturnType<typeof snapshotData>
  expect(await syncDigest(syncContent(snapshot))).toBe(legacyFixture.digest)
  expect(await syncDigest(syncContent({ ...snapshot, _schema: 1 } as typeof snapshot))).toBe(legacyFixture.digest)
  const id = legacyAccount()
  const { matchesSyncBaseline } = await import('./accountSyncSafety')
  expect(await matchesSyncBaseline(snapshotData(), legacyFixture.digest)).toBe(true)
  expect(readSyncBaseline(id)).toEqual({ digest: legacyFixture.digest, updatedAt: older })
})

it('S1 upgrade, dirty local + unchanged cloud under a d60f682 baseline: claims, keeps the edit, then saves it', async () => {
  const id = legacyAccount()
  const cloudCopy = structuredClone(legacyFixture.snapshot)
  wire.rows.set(id, { data: structuredClone(cloudCopy), updated_at: older })
  useStore.getState().update(d => { d.notes.example = 'dirty local' })
  await render(); await session(id)
  expect(getAccountConflict(id)).toBeUndefined()
  expect(withoutMarker(stored(id).data)).toEqual(cloudCopy) // the claim carried the cloud copy, not the local edit
  expect(stored(id)).toMatchObject({ cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 1 })
  expect(readSyncBaseline(id)).toMatchObject({ digest: legacyFixture.digest, updatedAt: stored(id).updated_at, claim: { writeRev: 1 } })
  expect(snapshotData().notes.example).toBe('dirty local')
  await act(async () => { expect(await cloud.pushNow()).toBe(true) })
  expect(stored(id)).toMatchObject({ cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 2, data: { notes: { example: 'dirty local' } } })
})

it('S1 upgrade, clean local + newer cloud under a d60f682 baseline: pulls the cloud copy and claims it', async () => {
  const id = legacyAccount()
  const newer_ = { ...structuredClone(legacyFixture.snapshot), notes: { ...legacyFixture.snapshot.notes, example: 'newer on another device' } }
  wire.rows.set(id, { data: structuredClone(newer_), updated_at: newer })
  await render(); await session(id)
  expect(getAccountConflict(id)).toBeUndefined()
  expect(snapshotData().notes.example).toBe('newer on another device')
  expect(stored(id)).toMatchObject({ cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 1 })
  expect(withoutMarker(stored(id).data)).toEqual(newer_)
  expect(wire.snapshots.size).toBeGreaterThan(0) // the replaced device copy was archived first
  expect(isAccountSyncReady(id)).toBe(true)
})

it('S1 upgrade does not weaken conflicts: dirty local + newer cloud under a d60f682 baseline still pauses for review', async () => {
  const id = legacyAccount()
  wire.rows.set(id, { data: { ...structuredClone(legacyFixture.snapshot), notes: { ...legacyFixture.snapshot.notes, example: 'cloud changed' } }, updated_at: newer })
  useStore.getState().update(d => { d.notes.example = 'local changed' })
  await render(); await session(id)
  expect(getAccountConflict(id)).toMatchObject({ saved: true, schemaBlocked: false, cloudSavedAt: newer })
  expect(snapshotData().notes.example).toBe('local changed')
  expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.writes).toHaveBeenCalledTimes(1) // only the claim of the cloud copy, never a replacement
  expect(stored(id).data).toMatchObject({ notes: { example: 'cloud changed' } })
})

it('S1 a workspace section named "digest" is data, never a trusted baseline digest', async () => {
  const id = account(), forged = 'f'.repeat(64)
  activateAccountWorkspace(id, { ...workspace('base'), digest: forged } as unknown as ReturnType<typeof snapshotData>)
  wire.rows.set(id, claimed({ ...snapshotData() }, older))
  await render(); await session(id)
  const { syncContent, syncDigest } = await import('./accountSyncSafety')
  expect(readSyncBaseline(id)?.digest).toBe(await syncDigest(syncContent(snapshotData())))
  expect(readSyncBaseline(id)?.digest).not.toBe(forged)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'edit' }))
  await act(async () => { expect(await cloud.pushNow()).toBe(true) })
  expect(readSyncBaseline(id)?.digest).not.toBe(forged)
  expect(stored(id).data).toMatchObject({ digest: forged, notes: { example: 'edit' } })
})

it('S1 claim loses a race to an old writer, rereads and claims the newer content', async () => {
  const id = account(), first = workspace('before old write'), oldWrite = workspace('old tab wrote this')
  wire.rows.set(id, { data: first, updated_at: older })
  let raced = false
  wire.attempts.mockImplementation(() => {
    // A deployed app saves {data, updated_at} between our read and our claim.
    if (!raced) { raced = true; wire.rows.set(id, { data: oldWrite, updated_at: newer }) }
  })
  await render(); await session(id)
  expect(wire.attempts).toHaveBeenCalledTimes(2)
  expect(stored(id)).toMatchObject({ cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 1 })
  expect(withoutMarker(stored(id).data)).toEqual(oldWrite)
  expect(snapshotData().notes.example).toBe('old tab wrote this')
  expect(cloud.protection).toBe('on')
})

it('S1 treats a write_rev miss from another current app as ordinary concurrency, not a permanent pause', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  wire.rows.set(id, claimed(base, older, 4)); await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'local edit' }))
  // Another current tab saved: same content, next counter, new timestamp.
  wire.rows.set(id, claimed(base, newer, 5))
  await act(async () => { expect(await cloud.pushNow()).toBe(false) })
  expect(wire.writes).not.toHaveBeenCalled()
  // It went back to reconciliation: both copies moved since the baseline, so the
  // ordinary two-copy review opens. It is not the out-of-date (schema) block.
  expect(getAccountConflict(id)).toMatchObject({ schemaBlocked: false, saved: true })
  expect(cloud.error).not.toContain('out of date')
  expect(stored(id)).toMatchObject({ write_rev: 5 })
  expect(snapshotData().notes.example).toBe('local edit')
})

it('S1 confirms a committed save whose response was lost without incrementing again', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base'))
  wire.rows.set(id, claimed(snapshotData(), older, 7))
  await render(); await session(id)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'sent once' }))
  wire.loseResponses = 1
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  await act(async () => {
    const saving = cloud.pushNow()
    await vi.advanceTimersByTimeAsync(3000)
    expect(await saving).toBe(true)
  })
  // The retry resent the same counter and predicate; it matched nothing, and
  // the reread proved the committed row is exactly this save.
  expect(wire.attempts).toHaveBeenCalledTimes(2)
  expect(wire.writes).toHaveBeenCalledTimes(1)
  expect(stored(id)).toMatchObject({ write_rev: 8, data: { notes: { example: 'sent once' } } })
  expect(readSyncBaseline(id)).toMatchObject({ claim: { writeRev: 8 } })
  expect(getAccountConflict(id)).toBeUndefined()
})

it('S1 fails closed without the columns: no fallback writer, edits stay on the device', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('device'))
  wire.rows.set(id, { data: workspace('device'), updated_at: older }); wire.missingColumns = true
  await render(); await session(id)
  expect(cloud.status).toBe('error')
  expect(cloud.error).toContain('server has not been updated')
  expect(cloud.protection).toBe('unavailable')
  expect(isAccountSyncReady(id)).toBe(false)
  await act(async () => useStore.getState().update(d => { d.notes.example = 'kept locally' }))
  await act(async () => { expect(await cloud.pushNow()).toBe(false) })
  expect(wire.attempts).not.toHaveBeenCalled(); expect(wire.writes).not.toHaveBeenCalled()
  expect(JSON.parse(localStorage.getItem(accountStorageKey(id))!).state.notes.example).toBe('kept locally')
})

it.each([
  ['claimed row without a marker', (data: Record<string, unknown>) => ({ data: withoutMarker(data), updated_at: older, cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 3 })],
  ['marker and column disagree', (data: Record<string, unknown>) => ({ data: { ...data, _schema: CURRENT_CLOUD_SCHEMA }, updated_at: older, cloud_schema: CURRENT_CLOUD_SCHEMA + 1, write_rev: 3 })],
  ['future marker on an unclaimed row', (data: Record<string, unknown>) => ({ data: { ...data, _schema: CURRENT_CLOUD_SCHEMA + 1 }, updated_at: older, cloud_schema: null, write_rev: null })],
  ['half-claimed metadata', (data: Record<string, unknown>) => ({ data: { ...data, _schema: CURRENT_CLOUD_SCHEMA }, updated_at: older, cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: null })],
  ['counter beyond the safe range', (data: Record<string, unknown>) => ({ data: { ...data, _schema: CURRENT_CLOUD_SCHEMA }, updated_at: older, cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 2 ** 53 })],
])('S1 blocks before hydration: %s', async (_label, make) => {
  const id = account(); activateAccountWorkspace(id, workspace('device copy')); const raw = localStorage.getItem(accountStorageKey(id))
  const row = make(workspace('cloud copy') as unknown as Record<string, unknown>)
  wire.rows.set(id, structuredClone(row))
  await render(); await session(id)
  expect(getAccountConflict(id)).toMatchObject({ schemaBlocked: true, remote: row.data })
  expect(snapshotData().notes.example).toBe('device copy')
  expect(localStorage.getItem(accountStorageKey(id))).toBe(raw)
  expect(wire.attempts).not.toHaveBeenCalled()
  expect(wire.rows.get(id)).toEqual(row)
  expect(cloud.protection).not.toBe('on')
})

it('schema 2 claims the exact unmarked T4 document, including nested and opaque fields', async () => {
  const id = account()
  const data = { ...workspace('T4 cloud'), persons: [{ id: 'p', name: 'Synthetic', bio: '  Synthetic bio  ' }],
    futureCollection: { nested: ['opaque preserved'] } }
  const envelope = { createdAt: 1, updatedAt: 1, archived: false, order: 0 }
  Object.assign(data, {
    experiences: [{ id: 'lab', category: 'research', org: 'Synthetic lab', role: 'Observer', description: '', tags: [], status: 'active', order: 0,
      estimatedHoursDeletedAt: 42, research: { current: true, lastPiContact: '2026-09-23', institution: 'Synthetic' } }],
    experienceHourEntries: [{ ...envelope, id: 'hour', experienceId: 'lab', kind: 'logged', date: '2026-09-24', hours: 0, note: '  Exact note  ', thoughts: '  Exact thoughts  ' },
      { ...envelope, id: 'historical', experienceId: 'deleted-lab', kind: 'logged', date: '2026-09-22', hours: 1, note: 'Historical', parentDeletedAt: 2 }],
    researchUpcomingItems: [{ ...envelope, id: 'upcoming', experienceId: 'lab', date: '2026-09-25', title: 'Synthetic item' }],
    researchReminders: [{ ...envelope, id: 'reminder', experienceId: 'lab', text: 'Reminder' }],
    researchTimelineNotes: [{ ...envelope, id: 'timeline', experienceId: 'lab', date: '2026-09-24', text: 'Timeline' }],
    researchMemberships: [{ ...envelope, id: 'membership', experienceId: 'lab', personId: 'p', roleInLab: 'Mentor', projectText: 'Synthetic project' }],
  })
  wire.rows.set(id, { data: structuredClone(data), updated_at: older })
  await render(); await session(id)
  expect(getAccountConflict(id)).toBeUndefined()
  expect(stored(id)).toMatchObject({ cloud_schema: CURRENT_CLOUD_SCHEMA, write_rev: 1 })
  expect(stored(id).data).toEqual({ ...data, _schema: CURRENT_CLOUD_SCHEMA })
  expect(snapshotData().persons).toEqual(data.persons)
  expect(cloud.protection).toBe('on')
})


it('T4 baseline compatibility never hides Research records, nested edits, or opaque changes', async () => {
  const { matchesSyncBaseline, syncContent, syncDigest } = await import('./accountSyncSafety')
  const old = structuredClone(legacyFixture.snapshot) as unknown as ReturnType<typeof snapshotData>
  const migrated = { ...old, researchUpcomingItems: [], researchReminders: [], researchTimelineNotes: [], researchMemberships: [] }
  expect(await matchesSyncBaseline(migrated, legacyFixture.digest)).toBe(true)
  const t4Digest = await syncDigest(syncContent(migrated))
  expect(await matchesSyncBaseline(migrated, t4Digest)).toBe(true)
  const nonempty = { ...migrated, researchReminders: [{ id: 'r', experienceId: 'e', text: 'Real change', createdAt: 1, updatedAt: 1, archived: false, order: 0 }] }
  expect(await matchesSyncBaseline(nonempty, legacyFixture.digest)).toBe(false)
  expect(await matchesSyncBaseline(migrated, await syncDigest(syncContent(nonempty)))).toBe(false)
  expect(await matchesSyncBaseline({ ...migrated, persons: [{ id: 'p', name: 'Synthetic', bio: 'New bio', createdAt: 1, updatedAt: 1, archived: false, order: 0 }] }, legacyFixture.digest)).toBe(false)
  expect(await matchesSyncBaseline({ ...migrated, unknownSection: [] } as typeof migrated, legacyFixture.digest)).toBe(false)
})

function addedTask(id: string) { return { id, title: id, type: 'Task', progress: 'Not started' as const, kanban: 'todo' as const, archived: false, order: 0 } }
it.each(['device', 'cloud'] as const)('S2 preserves recovery before silently keeping additions on %s', async side => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  const fuller = structuredClone(base); fuller.tasks.push(addedTask('addition'))
  if (side === 'device') useStore.getState().update(d => { d.tasks.push(addedTask('addition')) })
  wire.rows.set(id, claimed(side === 'cloud' ? fuller : base, side === 'cloud' ? newer : older))
  await render(); await session(id)
  expect(getAccountConflict(id)).toBeUndefined()
  expect(wire.snapshots.size).toBe(2)
  expect(snapshotData().tasks.some(t => t.id === 'addition')).toBe(true)
  expect(getAccountRecoveryNotice(id)).toContain('newest work')
  if (side === 'device') { await act(async () => { expect(await cloud.pushNow()).toBe(true) }); expect(wire.writes).toHaveBeenCalledTimes(1) }
})
it.each(['device', 'cloud'] as const)('S2 never silently restores an intentional deletion on %s', async side => {
  const id = account(); const initial = workspace('base'); initial.tasks.push(addedTask('deleted'))
  activateAccountWorkspace(id, initial); const base = snapshotData()
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  const reduced = structuredClone(base); reduced.tasks = reduced.tasks.filter(t => t.id !== 'deleted')
  if (side === 'device') useStore.getState().update(d => { d.tasks = d.tasks.filter(t => t.id !== 'deleted') })
  wire.rows.set(id, claimed(side === 'cloud' ? reduced : base, side === 'cloud' ? newer : older))
  await render(); await session(id)
  expect(getAccountConflict(id)?.saved).toBe(true); expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled()
})
it('S2 leaves an unproven superset and independent additions for review', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  useStore.getState().update(d => { d.tasks.push(addedTask('device-add')) })
  const remote = structuredClone(base); remote.tasks.push(addedTask('cloud-add'))
  wire.rows.set(id, claimed(remote, newer)); await render(); await session(id)
  expect(getAccountConflict(id)?.saved).toBe(true); expect(wire.writes).not.toHaveBeenCalled()
})
it('S2 cannot resume the local-additions path when recovery fails', async () => {
  const id = account(); activateAccountWorkspace(id, workspace('base')); const base = snapshotData()
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  useStore.getState().update(d => { d.tasks.push(addedTask('addition')) })
  wire.rows.set(id, claimed(base, older)); wire.archiveFails = true
  await render(); await session(id)
  expect(getAccountConflict(id)?.saved).toBe(false); expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled(); expect(getAccountRecoveryNotice(id)).toBeUndefined()
})

it.each(['device', 'cloud'] as const)('S2 asks before accepting a missing note-map record on %s', async side => {
  const id = account(); activateAccountWorkspace(id, workspace('keep this note')); const base = snapshotData()
  await recordSyncBaseline(id, base, revision(older), observeSyncSession(id))
  const reduced = structuredClone(base); delete reduced.notes.example
  if (side === 'device') useStore.getState().update(d => { delete d.notes.example })
  wire.rows.set(id, claimed(side === 'cloud' ? reduced : base, side === 'cloud' ? newer : older))
  await render(); await session(id)
  expect(getAccountConflict(id)?.saved).toBe(true)
  expect(isAccountSyncReady(id)).toBe(false)
  expect(wire.writes).not.toHaveBeenCalled()
})

it('S2 pairs the conflict timestamp with the cloud document reread after a claim race', async () => {
  const id=account();activateAccountWorkspace(id,workspace('device copy'))
  wire.rows.set(id,{data:workspace('first cloud'),updated_at:older})
  let raced=false
  wire.attempts.mockImplementation(()=>{if(!raced){raced=true;wire.rows.set(id,{data:workspace('new cloud'),updated_at:newer})}})
  await render();await session(id)
  expect(getAccountConflict(id)).toMatchObject({saved:true,cloudSavedAt:newer,remote:{notes:{example:'new cloud'}}})
  expect(snapshotData().notes.example).toBe('device copy')
})

it('S2 resumes matching authored work despite per-device housekeeping without changing the baseline format', async () => {
  const id=account();activateAccountWorkspace(id,workspace('same work'));const local=snapshotData(), remote=structuredClone(local)
  remote.meta.lastOpenedAt=123;remote.meta.recentRoutes=['/research'];remote.settings.calendar.lastSyncedAt=456
  wire.rows.set(id,claimed(remote,newer));await render();await session(id)
  expect(getAccountConflict(id)).toBeUndefined();expect(isAccountSyncReady(id)).toBe(true)
  expect(wire.snapshots.size).toBeGreaterThanOrEqual(2)
  expect(snapshotData().notes.example).toBe('same work')
})
it('S2 still identifies additions when shared record content matches but housekeeping differs', async () => {
  const id=account();activateAccountWorkspace(id,workspace('base'));const base=snapshotData()
  await recordSyncBaseline(id,base,revision(older),observeSyncSession(id))
  useStore.getState().update(d=>{d.tasks.push(addedTask('new'));d.meta.recentRoutes=['/research'];d.settings.calendar.lastSyncedAt=789})
  wire.rows.set(id,claimed(base,older));await render();await session(id)
  expect(getAccountConflict(id)).toBeUndefined();expect(getAccountRecoveryNotice(id)).toBe(ADDITIVE_RECOVERY_NOTICE)
  expect(wire.snapshots.size).toBeGreaterThanOrEqual(2)
})

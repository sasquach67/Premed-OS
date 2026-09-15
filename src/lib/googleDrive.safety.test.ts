import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import * as drive from './googleDrive'
import { Blob as NodeBlob } from 'node:buffer'
let nextToken = 'synthetic-drive-a'
beforeEach(async () => {
  vi.stubGlobal('Blob', NodeBlob)
  window.google = { accounts: { oauth2: { revoke: vi.fn(), initTokenClient: config => ({ requestAccessToken: () => config.callback({ access_token: nextToken }) }) } } }
  drive.disconnect(); nextToken = 'synthetic-drive-a'
  await drive.connect('synthetic-client')
})
afterEach(() => { vi.unstubAllGlobals(); drive.disconnect() })
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r }); return { promise, resolve } }
const listing = () => ({ ok: true, status: 200, json: async () => ({ files: [{ id: 'synthetic-backup' }] }) })
const uploaded = () => ({ ok: true, status: 200, json: async () => ({ id: 'synthetic-backup' }) })
const initiated = () => ({ ok: true, status: 200, headers: new Headers({ Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=synthetic' }) })
it('creates an immutable versioned complete backup and verifies the exact downloaded bytes', async () => {
  const blob = new Blob(['Synthetic ZIP bytes'])
  let publication: Record<string, unknown> = {}
  const fetch = vi.fn().mockResolvedValueOnce(initiated()).mockResolvedValueOnce(uploaded()).mockResolvedValueOnce({ ok: true, blob: async () => blob }).mockImplementationOnce(async (_url, init) => { publication = JSON.parse(init.body); return { ok: true } }).mockImplementationOnce(async () => ({ ok: true, json: async () => ({ id: 'synthetic-backup', ...publication }) }))
  vi.stubGlobal('fetch', fetch)
  expect(await drive.uploadCompleteBackup(blob, () => {}, 'hq:app-data:account:synthetic-a')).toBe('synthetic-backup')
  expect(fetch.mock.calls[0][1].method).toBe('POST')
  expect(fetch.mock.calls[0][1].body).toContain('premed-os-workspace-backup-candidate-v1.zip')
  expect(fetch.mock.calls[1][1].method).toBe('PUT')
  expect(fetch.mock.calls[1][1].body).toBe(blob)
  expect(fetch.mock.calls[3][1].method).toBe('PATCH')
  expect(fetch.mock.calls[3][1].body).toContain('premed-os-workspace-backup-v1.zip')
})
it('does not acknowledge a complete backup whose cloud bytes differ', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(initiated()).mockResolvedValueOnce(uploaded()).mockResolvedValueOnce({ ok: true, blob: async () => new Blob(['wrong']) })
  vi.stubGlobal('fetch', fetch)
  await expect(drive.uploadCompleteBackup(new Blob(['expected']), () => {}, 'hq:app-data:account:synthetic-a')).rejects.toThrow('integrity')
})
it('stops a complete upload when the account changes after session creation', async () => {
  const gate = deferred<ReturnType<typeof initiated>>()
  const fetch = vi.fn().mockReturnValueOnce(gate.promise)
  vi.stubGlobal('fetch', fetch)
  const upload = drive.uploadCompleteBackup(new Blob(['synthetic']), () => {}, 'hq:app-data:account:synthetic-a')
  const rejected = expect(upload).rejects.toThrow('Drive connection changed')
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  drive.clearDriveSession(); gate.resolve(initiated()); await rejected
  expect(fetch).toHaveBeenCalledTimes(1)
})
it('stops a complete backup acknowledgement after credentials change during readback', async () => {
  const gate = deferred<{ ok: boolean; blob: () => Promise<Blob> }>()
  const blob = new Blob(['synthetic'])
  const fetch = vi.fn().mockResolvedValueOnce(initiated()).mockResolvedValueOnce(uploaded()).mockReturnValueOnce(gate.promise)
  vi.stubGlobal('fetch', fetch)
  const upload = drive.uploadCompleteBackup(blob, () => {}, 'hq:app-data:account:synthetic-a')
  const rejected = expect(upload).rejects.toThrow('Drive connection changed')
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))
  drive.clearDriveSession(); gate.resolve({ ok: true, blob: async () => blob }); await rejected
})
it('rechecks workspace permission immediately before the backup write after listing', async () => {
  const pending = deferred<ReturnType<typeof listing>>()
  const fetch = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(uploaded())
  vi.stubGlobal('fetch', fetch)
  let allowed = true
  const work = drive.uploadBackup({ synthetic: true }, undefined, () => { if (!allowed) throw new Error('Workspace changed') })
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  allowed = false; pending.resolve(listing())
  await expect(work).rejects.toThrow('Workspace changed')
  expect(fetch).toHaveBeenCalledTimes(1)
})
it('does not write an old snapshot after Drive credentials change during listing', async () => {
  const pending = deferred<ReturnType<typeof listing>>()
  const fetch = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(uploaded())
  vi.stubGlobal('fetch', fetch)
  const work = drive.uploadBackup({ synthetic: true }, undefined, () => {})
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  nextToken = 'synthetic-drive-b'; await drive.connect('synthetic-client')
  pending.resolve(listing())
  await expect(work).rejects.toThrow('Drive connection changed')
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('serializes backup writes across callers so an older write cannot finish last', async () => {
  const first = deferred<ReturnType<typeof uploaded>>()
  const fetch = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(uploaded())
  vi.stubGlobal('fetch', fetch)
  const a = drive.uploadBackup({ revision: 1 }, 'synthetic-backup', () => {})
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
  const b = drive.uploadBackup({ revision: 2 }, 'synthetic-backup', () => {})
  await Promise.resolve(); await Promise.resolve()
  expect(fetch).toHaveBeenCalledTimes(1)
  first.resolve(uploaded()); await Promise.all([a, b])
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(fetch.mock.calls[1][1].body).toContain('"revision":2')
})
it('does not return a restore from credentials replaced during media download', async () => {
  const pending = deferred<{ ok: boolean; json: () => Promise<unknown> }>()
  const fetch = vi.fn().mockResolvedValueOnce(listing()).mockReturnValueOnce(pending.promise)
  vi.stubGlobal('fetch', fetch)
  const work = drive.downloadBackup()
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  nextToken = 'synthetic-drive-b'; await drive.connect('synthetic-client')
  pending.resolve({ ok: true, json: async () => ({ oldAccount: true }) })
  await expect(work).rejects.toThrow('Drive connection changed')
})

it('drops Drive authorization when the app account changes and requires an interactive reconnect', async () => {
  drive.clearDriveSession()
  expect(drive.isConnected()).toBe(false)
  await expect(drive.connectSilent('synthetic-client')).rejects.toThrow('Reconnect Google Drive')
  await drive.connect('synthetic-client')
  expect(drive.isConnected()).toBe(true)
})
it('ignores an OAuth callback that completes after the app workspace closed', async () => {
  let callback!: (response: { access_token?: string }) => void
  window.google!.accounts.oauth2.initTokenClient = config => { callback = config.callback; return { requestAccessToken() {} } }
  const work = drive.connect('synthetic-client')
  await Promise.resolve()
  drive.clearDriveSession()
  callback({ access_token: 'synthetic-stale-token' })
  await expect(work).rejects.toThrow('Drive connection changed')
  expect(drive.isConnected()).toBe(false)
})

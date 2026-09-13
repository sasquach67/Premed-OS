import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import * as drive from './googleDrive'
let nextToken = 'synthetic-drive-a'
beforeEach(async () => {
  window.google = { accounts: { oauth2: { revoke: vi.fn(), initTokenClient: config => ({ requestAccessToken: () => config.callback({ access_token: nextToken }) }) } } }
  drive.disconnect(); nextToken = 'synthetic-drive-a'
  await drive.connect('synthetic-client')
})
afterEach(() => { vi.unstubAllGlobals(); drive.disconnect() })
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r }); return { promise, resolve } }
const listing = () => ({ ok: true, status: 200, json: async () => ({ files: [{ id: 'synthetic-backup' }] }) })
const uploaded = () => ({ ok: true, status: 200, json: async () => ({ id: 'synthetic-backup' }) })
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

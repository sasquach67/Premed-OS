import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const drive = vi.hoisted(() => ({ uploadCompleteBackup: vi.fn(async () => 'synthetic-file'), isConnected: () => true, connect: vi.fn(), connectSilent: vi.fn(), disconnect: vi.fn(), clearDriveSession: vi.fn(), downloadLatestBackup: vi.fn() }))
vi.mock('@/lib/googleDrive', () => drive)
import { createPersonalInitialData } from '@/data/personalInitialData'
import { activateAccountWorkspace, activateGuestWorkspace, snapshotData, useStore } from './store'
import { allowAccountSync, observeSyncSession, pauseAccountSync } from './accountSyncSafety'
import { useBackup } from './useBackup'
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root, backup: ReturnType<typeof useBackup>, n = 0
beforeEach(() => { localStorage.clear(); useStore.persist.setOptions({ name: 'hq:app-data:guest' }); activateGuestWorkspace(); drive.uploadCompleteBackup.mockReset().mockResolvedValue('synthetic-file'); drive.connectSilent.mockReset().mockResolvedValue(undefined); root = createRoot(document.createElement('div')) })
afterEach(async () => { await act(async () => root.unmount()) })
async function prepare() {
  const id = `synthetic-drive-${++n}`
  activateAccountWorkspace(id, createPersonalInitialData()); allowAccountSync(observeSyncSession(id))
  function Probe() { backup = useBackup(); return null }
  await act(async () => root.render(createElement(Probe)))
  return id
}
it('blocks Drive before network when account sync is unresolved', async () => {
  const id = await prepare(); pauseAccountSync(id)
  await act(async () => backup.backupNow())
  expect(drive.uploadCompleteBackup).not.toHaveBeenCalled()
  expect(backup.status).toBe('error')
})
it('blocks Drive when open edits have no durable saved copy', async () => {
  await prepare()
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota', 'QuotaExceededError') })
  try { await act(async () => { useStore.getState().update(d => { d.notes.example = 'unsaved' }); await backup.backupNow() }) } finally { set.mockRestore() }
  expect(drive.uploadCompleteBackup).not.toHaveBeenCalled()
})
it('does not write A backup metadata into B after an awaited upload', async () => {
  await prepare(); let finish!: (value: string) => void
  drive.uploadCompleteBackup.mockImplementationOnce(() => new Promise(r => { finish = r }))
  let work!: Promise<void>
  await act(async () => { work = backup.backupNow() })
  await vi.waitFor(async () => { await act(async () => {}); expect(backup.error).toBe(''); expect(finish).toBeTypeOf('function') })
  await act(async () => { observeSyncSession('synthetic-drive-B'); activateAccountWorkspace('synthetic-drive-B', createPersonalInitialData()) })
  const before = JSON.stringify(snapshotData())
  await act(async () => { finish('A-file'); await work })
  expect(JSON.stringify(snapshotData())).toBe(before)
})
it('waits for verified account readiness before the daily backup and then resumes it', async () => {
  const id = `synthetic-drive-${++n}`, data = createPersonalInitialData()
  data.settings.backup.enabled = true; data.settings.backup.googleClientId = 'synthetic-client'
  activateAccountWorkspace(id, data)
  const token = observeSyncSession(id)
  function Probe() { backup = useBackup(); return null }
  await act(async () => root.render(createElement(Probe)))
  expect(drive.connectSilent).not.toHaveBeenCalled(); expect(drive.uploadCompleteBackup).not.toHaveBeenCalled()
  await act(async () => allowAccountSync(token))
  await vi.waitFor(async () => { await act(async () => {}); expect(backup.error).toBe(''); expect(backup.status).toBe('saved') })
  expect(drive.connectSilent).toHaveBeenCalledTimes(1)
  expect(drive.uploadCompleteBackup).toHaveBeenCalledTimes(1)
  expect(backup.status).toBe('saved')
})

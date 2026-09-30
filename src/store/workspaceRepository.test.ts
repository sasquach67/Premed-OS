import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { createWorkspaceRepository, verifyWorkspaceRecord } from './workspaceRepository'
import { createWorkspacePersistence, WORKSPACE_IDB_PREFIX } from './workspacePersistence'
import { createBootRecovery } from './workspaceBootRecovery'
const key = 'hq:app-data:guest'
const raw = () => JSON.stringify({ state: createPersonalInitialData(), version: 52 })
beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())
it('keeps a corrupt predecessor exactly while replacing only after explicit confirmation', async () => {
  const repository = createWorkspaceRepository(new IDBFactory())
  const initial = await repository.stage(key, raw(), raw()); await repository.activate(key, initial.revision)
  // Deliberately inject corruption into synthetic IDB, never a browser profile.
  const put = IDBObjectStore.prototype.put
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function(this: IDBObjectStore, value, k) {
    return put.call(this, { ...value, digest: 'bad' }, k)
  })
  await repository.commit(key, initial.revision, raw())
  vi.restoreAllMocks()
  const corrupt = (await repository.read(key))!
  localStorage.setItem(key, WORKSPACE_IDB_PREFIX + initial.migrationId)
  await expect(createWorkspacePersistence(repository, localStorage).load(key, raw)).rejects.toThrow('verified')
  const recovery = createBootRecovery({ key, repository, storage: localStorage })
  const preview = await recovery.fromFile(new File([raw()], 'backup.json'))
  expect((await repository.read(key))!.digest).toBe('bad')
  await recovery.confirm(preview)
  await verifyWorkspaceRecord((await repository.read(key))!)
  expect((await repository.originals(key)).some(copy => copy.raw === JSON.stringify(corrupt))).toBe(true)
})
it('transaction abort preserves both the original record and pointer', async () => {
  const repository = createWorkspaceRepository(new IDBFactory()), pointer = WORKSPACE_IDB_PREFIX + 'gone'
  localStorage.setItem(key, pointer)
  const recovery = createBootRecovery({ key, repository, storage: localStorage })
  const preview = await recovery.fromFile(new File([raw()], 'backup.json'))
  const put = IDBObjectStore.prototype.put
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function(this: IDBObjectStore, value, k) {
    const request = put.call(this, value, k); request.addEventListener('success', () => this.transaction.abort()); return request
  })
  await expect(recovery.confirm(preview)).rejects.toThrow('did not commit')
  expect(await repository.read(key)).toBeNull()
  expect(localStorage.getItem(key)).toBe(pointer)
})
it('resumes the verified staged recovery after pointer publication fails', async () => {
  const repository = createWorkspaceRepository(new IDBFactory()), pointer = WORKSPACE_IDB_PREFIX + 'gone'
  localStorage.setItem(key, pointer)
  const recovery = createBootRecovery({ key, repository, storage: localStorage })
  const preview = await recovery.fromFile(new File([raw()], 'backup.json'))
  const failure = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Synthetic quota') })
  await expect(recovery.confirm(preview)).rejects.toThrow('quota')
  expect(localStorage.getItem(key)).toBe(pointer)
  expect((await repository.read(key))!.phase).toBe('staged')
  failure.mockRestore()
  const disk = createWorkspacePersistence(repository, localStorage)
  await disk.load(key, vi.fn())
  expect(disk.read(key)).toBe(preview.raw)
})
it('rechecks identity inside the recovery transaction, after hashing', async () => {
  const repository = createWorkspaceRepository(new IDBFactory())
  let calls = 0
  await expect(repository.recover(key, null, null, raw(), () => { if (++calls === 2) throw new Error('Signed out') })).rejects.toThrow('Signed out')
  expect(await repository.read(key)).toBeNull()
})

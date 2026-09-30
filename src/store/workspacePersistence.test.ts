import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersistentStorage, persistentStorage } from '@/lib/persistentStorage'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { createWorkspaceRepository, type WorkspaceRepository } from './workspaceRepository'
import { createWorkspacePersistence, WORKSPACE_IDB_PREFIX } from './workspacePersistence'

class LegacyStorage implements Storage {
  values = new Map<string, string>(); maxBytes = Infinity
  get length() { return this.values.size }
  key(i: number) { return [...this.values.keys()][i] ?? null }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { if (value.length * 2 > this.maxBytes) throw new DOMException('Synthetic quota', 'QuotaExceededError'); this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  clear() { this.values.clear() }
}
const key = 'hq:app-data:account:synthetic-a'
const raw = (note: string) => { const state = createPersonalInitialData(); state.meta.lastOpenedAt = 0; state.notes.example = note; return JSON.stringify({ state, version: 50 }) }
const seed = () => raw('')
let factory: IDBFactory, legacy: LegacyStorage, repo: WorkspaceRepository
beforeEach(() => {
  factory = new IDBFactory(); legacy = new LegacyStorage(); repo = createWorkspaceRepository(factory)
  // Existing persistence cases must never access the host browser's permission.
  vi.spyOn(persistentStorage, 'requestAfterSave').mockResolvedValue(undefined)
})
afterEach(() => { repo.close(); vi.restoreAllMocks() })
it('refuses a future schema before replacing its legacy value or seeding defaults', async () => {
  const future = JSON.stringify({ ...JSON.parse(raw('future content')), version: 999 })
  legacy.setItem(key, future)
  const disk = createWorkspacePersistence(repo, legacy)
  await expect(disk.load(key, seed)).rejects.toThrow('newer app version')
  expect(legacy.getItem(key)).toBe(future)
  expect(await repo.read(key)).toBeNull()
})
it('blocks later autosaves after a hydration error is recorded', async () => {
  const original = raw('saved'); legacy.setItem(key, original)
  const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed)
  disk.block(key, new Error('Hydration failed'))
  await expect(disk.write(key, raw('defaults'))).rejects.toThrow('Hydration failed')
  expect((await repo.read(key))!.raw).toBe(original)
})

it('rejects an actual transaction abort even after its put request succeeds', async () => {
  const original = raw('original'); legacy.setItem(key, original)
  const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed)
  const put = IDBObjectStore.prototype.put
  const injected = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function(this: IDBObjectStore, value, k) {
    const request = put.call(this, value, k)
    request.addEventListener('success', () => this.transaction.abort())
    return request
  })
  try { await expect(disk.write(key, raw('rejected'))).rejects.toThrow('did not commit') }
  finally { injected.mockRestore() }
  expect(disk.status(key).phase).toBe('error')
  expect((await repo.read(key))!.raw).toBe(original)
  expect(disk.read(key)).toBe(original)
})

it('moves a workspace into verified transactions and saves >5MiB without growing localStorage', async () => {
  const original = raw('original'); legacy.setItem(key, original)
  const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed)
  const marker = legacy.getItem(key)!
  expect(marker.startsWith(WORKSPACE_IDB_PREFIX)).toBe(true)
  expect((await repo.originals(key))[0].raw).toBe(original)
  legacy.maxBytes = 1024
  const large = raw('Notebook content '.repeat(450_000))
  expect(large.length).toBeGreaterThan(5 * 1024 * 1024)
  const saving = disk.write(key, large)
  expect(disk.status(key).phase).toBe('saving')
  await saving; await disk.flush(key)
  expect(disk.read(key)).toBe(large)
  expect(legacy.getItem(key)).toBe(marker)
  repo.close()
  const reloaded = createWorkspacePersistence(createWorkspaceRepository(factory), legacy)
  await reloaded.load(key, seed)
  expect(reloaded.read(key)).toBe(large)
})
it('resumes after the original and staged snapshot commit but before pointer publication', async () => {
  const original = raw('original'); legacy.setItem(key, original)
  await repo.stage(key, original, original)
  const disk = createWorkspacePersistence(createWorkspaceRepository(factory), legacy)
  await disk.load(key, seed)
  expect(disk.read(key)).toBe(original)
  expect((await repo.read(key))?.phase).toBe('active')
  expect(await repo.originals(key)).toHaveLength(1)
})
it('resumes after pointer publication but before activation', async () => {
  const original = raw('original'); legacy.setItem(key, original)
  const record = await repo.stage(key, original, original)
  legacy.setItem(key, WORKSPACE_IDB_PREFIX + record.migrationId)
  const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed)
  expect(disk.read(key)).toBe(original)
  expect((await repo.read(key))?.phase).toBe('active')
})
it('retains original data if publishing the migration pointer fails', async () => {
  const original = raw('original'); legacy.setItem(key, original); legacy.maxBytes = 1
  const disk = createWorkspacePersistence(repo, legacy)
  await expect(disk.load(key, seed)).rejects.toThrow('quota')
  expect(legacy.getItem(key)).toBe(original)
  expect((await repo.originals(key))[0].raw).toBe(original)
  expect((await repo.read(key))?.phase).toBe('staged')
  legacy.maxBytes = Infinity
  await disk.load(key, seed)
  expect(disk.read(key)).toBe(original)
})
it('quarantines a changed legacy copy during migration instead of choosing a winner', async () => {
  const original = raw('original'), newer = raw('other tab'); legacy.setItem(key, original)
  await repo.stage(key, original, original); legacy.setItem(key, newer)
  const disk = createWorkspacePersistence(repo, legacy)
  await expect(disk.load(key, seed)).rejects.toThrow('changed during migration')
  expect(legacy.getItem(key)).toBe(newer)
  expect((await repo.originals(key)).map(c => c.raw)).toEqual(expect.arrayContaining([original, newer]))
  expect((await repo.read(key))?.raw).toBe(original)
})
it('permits only one concurrent writer for an acknowledged revision', async () => {
  legacy.setItem(key, raw('base'))
  const a = createWorkspacePersistence(repo, legacy), b = createWorkspacePersistence(createWorkspaceRepository(factory), legacy)
  await a.load(key, seed); await b.load(key, seed)
  const outcomes = await Promise.allSettled([a.write(key, raw('A')), b.write(key, raw('B'))])
  expect(outcomes.filter(x => x.status === 'fulfilled')).toHaveLength(1)
  expect(outcomes.filter(x => x.status === 'rejected')).toHaveLength(1)
  expect([raw('A'), raw('B')]).toContain((await repo.read(key))?.raw)
  const loser = outcomes[0].status === 'rejected' ? a : b
  expect(loser.status(key).phase).toBe('error')
  await expect(loser.flush(key)).rejects.toThrow()
})
it('fences an old client replacing the pointer and preserves its late copy', async () => {
  legacy.setItem(key, raw('base')); const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed); await disk.write(key, raw('new IndexedDB content'))
  const late = raw('late old tab'); legacy.setItem(key, late)
  await expect(disk.write(key, raw('must not overwrite'))).rejects.toThrow('older tab')
  expect((await repo.read(key))?.raw).toBe(raw('new IndexedDB content'))
  expect((await repo.originals(key)).map(x => x.raw)).toContain(late)
  expect(legacy.getItem(key)).toBe(late)
})
it('keeps later queued writes unacknowledged after a failed commit', async () => {
  legacy.setItem(key, raw('base')); const disk = createWorkspacePersistence(repo, legacy); await disk.load(key, seed)
  vi.spyOn(repo, 'commit').mockRejectedValueOnce(new DOMException('Synthetic IDB quota', 'QuotaExceededError'))
  const results = await Promise.allSettled([disk.write(key, raw('first')), disk.write(key, raw('second'))])
  expect(results.every(x => x.status === 'rejected')).toBe(true)
  expect((await repo.read(key))?.raw).toBe(raw('base'))
  expect(disk.status(key).phase).toBe('error')
})
it('does not seed an empty workspace when a pointer has no database record', async () => {
  legacy.setItem(key, WORKSPACE_IDB_PREFIX + 'missing')
  await expect(createWorkspacePersistence(repo, legacy).load(key, seed)).rejects.toThrow('missing IndexedDB data')
  expect(await repo.read(key)).toBeNull()
})
it('keeps separate account snapshots and revisions during overlapping saves', async () => {
  const b = 'hq:app-data:account:synthetic-b'; legacy.setItem(key, raw('A')); legacy.setItem(b, raw('B'))
  const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed); await disk.load(b, seed)
  await Promise.all([disk.write(key, raw('A edited')), disk.write(b, raw('B edited'))])
  expect(disk.read(key)).toBe(raw('A edited')); expect(disk.read(b)).toBe(raw('B edited'))
  expect((await repo.originals(b))[0].raw).toBe(raw('B'))
})
it('distinguishes a missing account cache from an existing empty account', async () => {
  const disk = createWorkspacePersistence(repo, legacy); await disk.load(key, seed)
  expect(disk.read(key)).toBeNull()
  await disk.write(key, seed())
  expect(disk.read(key)).toBe(seed())
})


it.each(['hq:app-data', key])('requests browser persistence only after a confirmed normal save of %s', async workspaceKey => {
  const original = raw('before permission'), saved = raw('confirmed normal save')
  legacy.setItem(workspaceKey, original)
  const disk = createWorkspacePersistence(repo, legacy)
  const observedAtRequest: string[] = []
  const persist = vi.fn(async () => {
    expect(disk.status(workspaceKey).phase).toBe('ready')
    expect(disk.status(workspaceKey).pending).toBe(0)
    observedAtRequest.push((await repo.read(workspaceKey))!.raw)
    return false
  })
  const permission = createPersistentStorage(() => ({ persisted: async () => false, persist }))
  vi.mocked(persistentStorage.requestAfterSave).mockImplementation(permission.requestAfterSave)

  // Boot checks report the browser's state without asking for permission.
  await permission.recheck()
  await disk.load(workspaceKey, seed)
  await disk.flush(workspaceKey)
  expect(persist).not.toHaveBeenCalled()
  expect(persistentStorage.requestAfterSave).not.toHaveBeenCalled()

  const commit = repo.commit.bind(repo)
  let releaseCommit!: () => void, reachedCommit!: () => void
  const commitReached = new Promise<void>(resolve => { reachedCommit = resolve })
  const committed = new Promise<void>(resolve => { releaseCommit = resolve })
  vi.spyOn(repo, 'commit').mockImplementation(async (...args) => {
    const result = await commit(...args)
    reachedCommit()
    await committed
    return result
  })
  const writing = disk.write(workspaceKey, saved)
  await commitReached
  expect(persistentStorage.requestAfterSave).not.toHaveBeenCalled()
  expect(persist).not.toHaveBeenCalled()
  expect(disk.status(workspaceKey).phase).toBe('saving')
  releaseCommit()
  await writing
  await permission.requestAfterSave()
  expect(observedAtRequest).toEqual([saved])
  expect(persist).toHaveBeenCalledTimes(1)
  expect(permission.getSnapshot()).toBe('denied')
})

it.each(['rejected', 'unverified'] as const)('does not request permission for a %s normal write', async failure => {
  legacy.setItem(key, raw('saved before failed write'))
  const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed)
  const persist = vi.fn().mockResolvedValue(true)
  const permission = createPersistentStorage(() => ({ persisted: async () => false, persist }))
  vi.mocked(persistentStorage.requestAfterSave).mockImplementation(permission.requestAfterSave)
  if (failure === 'rejected') vi.spyOn(repo, 'commit').mockRejectedValueOnce(new Error('Synthetic transaction rejection'))
  else {
    const commit = repo.commit.bind(repo)
    vi.spyOn(repo, 'commit').mockImplementationOnce(async (...args) => ({ ...await commit(...args), digest: 'unverified-digest' }))
  }
  await expect(disk.write(key, raw('unacknowledged'))).rejects.toThrow(failure === 'rejected' ? 'transaction rejection' : 'could not be verified')
  await expect(disk.flush(key)).rejects.toThrow()
  expect(disk.status(key).phase).toBe('error')
  expect(persistentStorage.requestAfterSave).not.toHaveBeenCalled()
  expect(persist).not.toHaveBeenCalled()
})

it('does not let a pending permission prompt delay flush or repeat on later confirmed saves', async () => {
  const disk = createWorkspacePersistence(repo, legacy)
  await disk.load(key, seed)
  let finishPermission!: (granted: boolean) => void
  let granted = false
  const persist = vi.fn(() => new Promise<boolean>(resolve => { finishPermission = resolve }))
  const permission = createPersistentStorage(() => ({ persisted: async () => granted, persist }))
  vi.mocked(persistentStorage.requestAfterSave).mockImplementation(permission.requestAfterSave)
  await disk.write(key, raw('first normal save'))
  await disk.flush(key)
  expect(persist).toHaveBeenCalledTimes(1)
  expect(permission.getSnapshot()).toBe('checking')
  expect(disk.status(key)).toMatchObject({ phase: 'ready', pending: 0 })
  await disk.write(key, raw('second normal save'))
  await disk.write(key, raw('second normal save')) // Same-byte acknowledged save.
  await disk.flush(key)
  expect((await repo.read(key))!.raw).toBe(raw('second normal save'))
  expect(persist).toHaveBeenCalledTimes(1)
  expect(permission.getSnapshot()).toBe('checking')

  // The request's result alone is not evidence of a real browser grant.
  finishPermission(true)
  await permission.requestAfterSave()
  expect(permission.getSnapshot()).toBe('denied')
  granted = true
  await permission.recheck()
  expect(permission.getSnapshot()).toBe('granted')
  granted = false
  await permission.recheck()
  expect(permission.getSnapshot()).toBe('denied')
  expect(persist).toHaveBeenCalledTimes(1)
})

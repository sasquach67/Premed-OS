import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import { beforeEach, expect, it, vi } from 'vitest'
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
beforeEach(() => { factory = new IDBFactory(); legacy = new LegacyStorage(); repo = createWorkspaceRepository(factory) })

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

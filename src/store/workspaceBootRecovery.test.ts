import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { createWorkspaceRepository } from './workspaceRepository'
import { WORKSPACE_IDB_PREFIX, createWorkspacePersistence } from './workspacePersistence'
import { createWorkspaceBackup } from '@/lib/workspaceBackup'
import { unzipSync, zipSync } from 'fflate'
import * as localFiles from '@/lib/localBlobStore'
import { prepareRecoveryFile, createBootRecovery } from './workspaceBootRecovery'

const key = 'hq:app-data:account:synthetic'
const fixture = () => { const data = createPersonalInitialData(); data.notes.test = 'Synthetic preserved note'; return data }
beforeEach(() => { localStorage.clear() })
afterEach(() => { vi.restoreAllMocks() })
it('rejects the empty diagnostic file instead of treating it as a backup', async () => {
  const file = new File([JSON.stringify({ format: 'premed-os-storage-recovery', version: 1, workspace: null, originals: [] })], 'empty.json')
  await expect(prepareRecoveryFile(file)).rejects.toThrow('empty')
})
it('requires explicit confirmation after preview, keeping the pointer and missing row untouched', async () => {
  const repo = createWorkspaceRepository(new IDBFactory())
  const oldPointer = WORKSPACE_IDB_PREFIX + 'missing'
  localStorage.setItem(key, oldPointer)
  const disk = createWorkspacePersistence(repo, localStorage)
  await expect(disk.load(key, () => '')).rejects.toThrow('missing IndexedDB')
  const reader = vi.fn().mockResolvedValue({ data: fixture(), updatedAt: '2026-09-29T12:00:00Z', claim: null })
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  const preview = await recovery.fromAccount('synthetic', reader)
  expect(reader).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem(key)).toBe(oldPointer)
  expect(await repo.read(key)).toBeNull()
  await recovery.confirm(preview)
  const saved = await repo.read(key)
  expect(JSON.parse(saved!.raw).state.notes.test).toBe('Synthetic preserved note')
  expect((await repo.originals(key)).some(copy => copy.raw === oldPointer)).toBe(true)
})
it('restores a JSON file locally, preserves opaque sections, and reloads without seeding', async () => {
  const repo = createWorkspaceRepository(new IDBFactory()), pointer = WORKSPACE_IDB_PREFIX + 'gone'
  localStorage.setItem(key, pointer)
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  const data = { ...fixture(), futureExtra: { retained: true } }
  const preview = await recovery.fromFile(new File([JSON.stringify(data)], 'backup.json'))
  expect(preview.savedAt).toBeNull()
  await recovery.confirm(preview)
  const disk = createWorkspacePersistence(repo, localStorage), seed = vi.fn()
  await disk.load(key, seed)
  expect(JSON.parse(disk.read(key)!).state).toEqual(data)
  expect(seed).not.toHaveBeenCalled()
})
it('refuses a changed cloud revision without replacing the browser pointer', async () => {
  const repo = createWorkspaceRepository(new IDBFactory())
  localStorage.setItem(key, WORKSPACE_IDB_PREFIX + 'missing')
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  const reader = vi.fn().mockResolvedValueOnce({ data: fixture(), updatedAt: '2026-09-29T12:00:00Z', claim: null }).mockResolvedValueOnce(null)
  const preview = await recovery.fromAccount('synthetic', reader)
  await expect(recovery.confirm(preview)).rejects.toThrow('account copy changed')
  expect(await repo.read(key)).toBeNull()
  expect(localStorage.getItem(key)).toBe(WORKSPACE_IDB_PREFIX + 'missing')
})
it('refuses another account and a changed sign-in during confirmation', async () => {
  const repo = createWorkspaceRepository(new IDBFactory()); let session = 'synthetic'
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage, context: () => session })
  const reader = vi.fn().mockResolvedValue({ data: fixture(), updatedAt: '2026-09-29T12:00:00Z', claim: null })
  await expect(recovery.fromAccount('other', reader)).rejects.toThrow('owns')
  expect(reader).not.toHaveBeenCalled()
  const preview = await recovery.fromAccount('synthetic', reader)
  session = 'other'
  await expect(recovery.confirm(preview)).rejects.toThrow('changed')
  expect(await repo.read(key)).toBeNull()
})
it('does not replace a newly saved record or pointer from another tab', async () => {
  const repo = createWorkspaceRepository(new IDBFactory())
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  const preview = await recovery.fromFile(new File([JSON.stringify(fixture())], 'backup.json'))
  const other = await repo.stage(key, null, JSON.stringify({ state: fixture(), version: 52 }))
  await expect(recovery.confirm(preview)).rejects.toThrow('changed')
  expect((await repo.read(key))!.revision).toBe(other.revision)
})
it('requires the real reviewed object, not a fabricated or modified preview', async () => {
  const repo = createWorkspaceRepository(new IDBFactory()), recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  const preview = await recovery.fromFile(new File([JSON.stringify(fixture())], 'backup.json'))
  await expect(recovery.confirm({ ...preview, raw: '{}' })).rejects.toThrow('Review this copy')
  expect(await repo.read(key)).toBeNull()
})
it('retains a present record with a missing pointer until an explicit recovery', async () => {
  const repo = createWorkspaceRepository(new IDBFactory()), raw = JSON.stringify({ state: fixture(), version: 52 })
  const initial = await repo.stage(key, raw, raw); await repo.activate(key, initial.revision)
  const disk = createWorkspacePersistence(repo, localStorage)
  await expect(disk.load(key, vi.fn())).rejects.toThrow()
  expect(localStorage.getItem(key)).toBeNull()
  expect((await repo.read(key))!.raw).toBe(raw)
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  const preview = await recovery.fromFile(new File([raw], 'backup.json'))
  await recovery.confirm(preview)
  expect((await repo.originals(key)).some(copy => copy.raw?.includes(initial.revision))).toBe(true)
})
it('rejects future versions, malformed structure and an altered recovery digest', async () => {
  await expect(prepareRecoveryFile(new File([JSON.stringify({ ...fixture(), _schema: 999 })], 'future.json'))).rejects.toThrow('newer')
  await expect(prepareRecoveryFile(new File([JSON.stringify({ state: fixture(), version: 999 })], 'future.json'))).rejects.toThrow('version')
  await expect(prepareRecoveryFile(new File(['{"courses":null,"profile":{},"settings":{}}'], 'bad.json'))).rejects.toThrow('valid workspace')
  const repo = createWorkspaceRepository(new IDBFactory()), raw = JSON.stringify({ state: fixture(), version: 52 })
  const record = await repo.stage(key, raw, raw)
  const file = new File([JSON.stringify({ format: 'premed-os-storage-recovery', version: 1, workspace: { ...record, raw: raw + ' ' } })], 'tampered.json')
  await expect(prepareRecoveryFile(file)).rejects.toThrow('verified')
})

it('rejects malformed nested academic rows before publishing a reviewed backup', async () => {
  const data = fixture()
  data.academics.classCenter.sourceChunks = [null] as never
  await expect(prepareRecoveryFile(new File([JSON.stringify(data)], 'broken.json'))).rejects.toThrow('sourceChunks')
})
it('counts native notebook entries and labels the reviewed source', async () => {
  const data = fixture()
  data.academics.classCenter.lectures = [{ id: 'synthetic-native', courseId: 'synthetic-course', title: 'Native note', order: 0, createdAt: 1, updatedAt: 1, inputPath: 'pasted', processingState: 'ready' }]
  const result = await prepareRecoveryFile(new File([JSON.stringify(data)], 'backup.json'))
  expect(result.notebooks).toBe(1)
  expect(result.source).toBe('file')
})

async function zippedFixture() {
  const data = fixture()
  data.academics.classCenter.files.push({ id: 'synthetic-original', sourceType: 'upload', owner: 'course', createdAt: 1, updatedAt: 1, order: 0, title: 'Synthetic source', type: 'reading', blobRef: 'idb://academics/synthetic-original', linkedTopicIds: [] })
  const original = new Blob(['Synthetic original bytes'], { type: 'text/plain' })
  const zip = await createWorkspaceBackup(data, { images: { read: async () => undefined }, file: async () => original })
  return { data, original, file: new File([zip], 'complete.zip') }
}
it('restores a verified ZIP and stages originals only after confirmation', async () => {
  const repo = createWorkspaceRepository(new IDBFactory()), pointer = WORKSPACE_IDB_PREFIX + 'missing'
  localStorage.setItem(key, pointer)
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage })
  const f = await zippedFixture(), bytes = new Map<string, Blob>()
  const retain = vi.spyOn(localFiles, 'retainLocalBlob').mockImplementation(async (ref, blob) => { bytes.set(ref, blob); return ref })
  const preview = await recovery.fromFile(f.file)
  expect(preview.includesFiles).toBe(true)
  expect(retain).not.toHaveBeenCalled()
  expect(await repo.read(key)).toBeNull()
  await recovery.confirm(preview)
  const restored = JSON.parse((await repo.read(key))!.raw).state
  const ref = restored.academics.classCenter.files[0].blobRef
  expect(ref).not.toBe(f.data.academics.classCenter.files[0].blobRef)
  expect(await bytes.get(ref)!.text()).toBe(await f.original.text())
  expect((await repo.originals(key)).some(copy => copy.raw === pointer)).toBe(true)
})
it('rejects a corrupt ZIP digest and leaves its target unchanged when original staging fails', async () => {
  const repo = createWorkspaceRepository(new IDBFactory()), pointer = WORKSPACE_IDB_PREFIX + 'missing'
  localStorage.setItem(key, pointer)
  const recovery = createBootRecovery({ key, repository: repo, storage: localStorage }), f = await zippedFixture()
  const members = unzipSync(new Uint8Array(await f.file.arrayBuffer()))
  members[Object.keys(members).find(path => path.startsWith('assets/'))!][0] ^= 1
  await expect(recovery.fromFile(new File([zipSync(members).slice().buffer], 'corrupt.zip'))).rejects.toThrow('integrity')
  const preview = await recovery.fromFile(f.file)
  vi.spyOn(localFiles, 'retainLocalBlob').mockRejectedValue(new Error('Synthetic asset quota'))
  await expect(recovery.confirm(preview)).rejects.toThrow('asset quota')
  expect(await repo.read(key)).toBeNull()
  expect(localStorage.getItem(key)).toBe(pointer)
})

it.each([null, undefined, 42])('rejects unusable notebook titles before reviewing a restore (%s)', async title => {
  const data = fixture()
  data.academics.classCenter.lectures = [{ id: 'synthetic-entry', courseId: 'synthetic-course', title }] as never
  await expect(prepareRecoveryFile(new File([JSON.stringify(data)], 'broken.json'))).rejects.toThrow('notebook')
})

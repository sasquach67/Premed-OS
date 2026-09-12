// @vitest-environment jsdom
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { activateAccountWorkspace, activateGuestWorkspace, captureWorkspaceIdentity, createInitialDataForMode, snapshotData, useStore } from './store'
import { commitWorkspaceOptimization, prepareWorkspaceOptimization, workspaceRecoveryExport } from './workspaceOptimization'
import type { WorkspaceRecoveryRepository, WorkspaceRecoverySnapshot } from './workspaceRecoveryRepository'
import { decodeWorkspaceStorage, WORKSPACE_CHUNKS_PREFIX } from './workspaceStorageCodec'
import { plainVisualFixture } from '@/lib/academics/notebook/visual.test-fixtures'

class RecoveryCopies implements WorkspaceRecoveryRepository {
  copies: WorkspaceRecoverySnapshot[] = []
  afterSave?: () => void
  afterRead?: () => void
  failSave = false
  corruptRead = false
  async save(snapshot: WorkspaceRecoverySnapshot) {
    if (this.failSave) throw new DOMException('Recovery quota exceeded', 'QuotaExceededError')
    this.copies.push(structuredClone(snapshot)); this.afterSave?.()
  }
  async read(key: string, id: string) {
    const stored = this.copies.find(copy => copy.workspaceKey === key && copy.id === id)
    const result = stored ? structuredClone(stored) : null
    if (result && this.corruptRead) result.stored += 'corrupt'
    this.afterRead?.(); return result
  }
  async latest(key: string) { return structuredClone(this.copies.filter(copy => copy.workspaceKey === key).at(-1) ?? null) }
}

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto)
  localStorage.clear(); sessionStorage.clear(); activateGuestWorkspace()
  const data = createInitialDataForMode(false), pkg = plainVisualFixture()
  let seed = 12345
  pkg.sources[0].excerpts[0].text = Array.from({ length: 100_000 }, () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return String.fromCharCode(65 + (seed >>> 0) % 26) }).join('')
  const raw = ' \n' + JSON.stringify(pkg, null, 2) + '\n'
  const progress = { practice: { response: 'Retain this response', complete: true } }
  data.academics.classCenter.lectures = [{ id: 'recovery-notebook', courseId: 'recovery-course', title: pkg.entries[0].title, inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0, importedNotebook: { current: pkg, original: structuredClone(pkg), originalRaw: raw, acceptedRaw: raw, entryId: pkg.entries[0].id, fingerprint: 'recovery-test', importedAt: 1, notes: 'Keep my notes', progress, history: [{ id: 'old-version', savedAt: 1, reason: 'edit', current: structuredClone(pkg), notes: 'Earlier notes', progress: structuredClone(progress), acceptedRaw: raw }], assetBindings: [] } }]
  activateAccountWorkspace('recovery-a', data)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('requires closing other tabs, verifies a durable exact recovery copy, and keeps optimization through edits and reload', async () => {
  const repository = new RecoveryCopies(), beforeState = structuredClone(snapshotData()), plan = prepareWorkspaceOptimization(), key = plan.owner.key!
  expect(plan.after.startsWith(WORKSPACE_CHUNKS_PREFIX)).toBe(true)
  expect(plan.bytesAfter).toBeLessThan(plan.bytesBefore)
  await expect(commitWorkspaceOptimization(plan, { otherTabsClosed: false, repository })).rejects.toThrow('close every other')
  expect(repository.copies).toHaveLength(0)
  expect(localStorage.getItem(key)).toBe(plan.before)
  await commitWorkspaceOptimization(plan, { otherTabsClosed: true, repository })
  expect(repository.copies).toHaveLength(1)
  expect(repository.copies[0].stored).toBe(plan.before)
  expect(decodeWorkspaceStorage(localStorage.getItem(key)!)).toBe(decodeWorkspaceStorage(plan.before))
  expect(snapshotData()).toEqual(beforeState)
  useStore.getState().update(state => { state.academics.classCenter.lectures[0].importedNotebook!.notes = 'A new manual edit' })
  expect(localStorage.getItem(key)!.startsWith(WORKSPACE_CHUNKS_PREFIX)).toBe(true)
  await useStore.persist.rehydrate()
  const saved = useStore.getState().academics.classCenter.lectures[0].importedNotebook!
  expect(saved.notes).toBe('A new manual edit')
  expect(saved.originalRaw).toBe(beforeState.academics.classCenter.lectures[0].importedNotebook!.originalRaw)
  expect(saved.history).toEqual(beforeState.academics.classCenter.lectures[0].importedNotebook!.history)
  expect(saved.progress).toEqual(beforeState.academics.classCenter.lectures[0].importedNotebook!.progress)
  const exported = await workspaceRecoveryExport(repository)
  expect(JSON.parse(exported.text)).toEqual(beforeState)
  await expect(commitWorkspaceOptimization(plan, { otherTabsClosed: true, repository })).rejects.toThrow('close every other')
  expect(repository.copies).toHaveLength(1)
})

it.each(['quota', 'corrupt-read', 'missing-read'])('does not convert when the recovery copy fails (%s)', async failure => {
  const repository = new RecoveryCopies(), plan = prepareWorkspaceOptimization(), state = structuredClone(snapshotData())
  if (failure === 'quota') repository.failSave = true
  if (failure === 'corrupt-read') repository.corruptRead = true
  if (failure === 'missing-read') vi.spyOn(repository, 'read').mockResolvedValue(null)
  await expect(commitWorkspaceOptimization(plan, { otherTabsClosed: true, repository })).rejects.toThrow()
  expect(localStorage.getItem(plan.owner.key!)).toBe(plan.before)
  expect(snapshotData()).toEqual(state)
})

it('retains the verified recovery copy and old durable workspace when replacement hits quota', async () => {
  const repository = new RecoveryCopies(), plan = prepareWorkspaceOptimization(), key = plan.owner.key!, originalSet = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(this: Storage, name, value) {
    if (this === localStorage && name === key && value === plan.after) throw new DOMException('Quota exceeded', 'QuotaExceededError')
    originalSet.call(this, name, value)
  })
  await expect(commitWorkspaceOptimization(plan, { otherTabsClosed: true, repository })).rejects.toThrow('could not make room')
  expect(localStorage.getItem(key)).toBe(plan.before)
  expect(repository.copies[0].stored).toBe(plan.before)
  expect(JSON.parse((await workspaceRecoveryExport(repository)).text)).toEqual(snapshotData())
})

it.each([false, true])('rejects an account switch during backup even for identical graphs (switch back: %s)', async switchBack => {
  const repository = new RecoveryCopies(), plan = prepareWorkspaceOptimization(), data = structuredClone(snapshotData())
  repository.afterSave = () => { activateAccountWorkspace('recovery-b', data); if (switchBack) activateAccountWorkspace('recovery-a') }
  await expect(commitWorkspaceOptimization(plan, { otherTabsClosed: true, repository })).rejects.toThrow('active workspace changed')
  expect(localStorage.getItem(plan.owner.key!)).toBe(plan.before)
  expect(repository.copies).toHaveLength(1)
  expect(repository.copies[0].workspaceKey).toBe(plan.owner.key)
})

it('rejects a changed disk baseline after backup without replacing the newer work', async () => {
  const repository = new RecoveryCopies(), plan = prepareWorkspaceOptimization(), key = plan.owner.key!
  const newer = JSON.parse(decodeWorkspaceStorage(plan.before)); newer.state.academics.classCenter.lectures[0].importedNotebook.notes = 'Newer work from another tab'
  const raw = JSON.stringify(newer)
  repository.afterRead = () => localStorage.setItem(key, raw)
  await expect(commitWorkspaceOptimization(plan, { otherTabsClosed: true, repository })).rejects.toThrow('Saved work changed')
  expect(localStorage.getItem(key)).toBe(raw)
  expect(repository.copies[0].stored).toBe(plan.before)
})

it('will not export another account recovery copy or finish an export after account switching', async () => {
  const repository = new RecoveryCopies(), plan = prepareWorkspaceOptimization()
  await commitWorkspaceOptimization(plan, { otherTabsClosed: true, repository })
  activateAccountWorkspace('recovery-b', createInitialDataForMode(false))
  await expect(workspaceRecoveryExport(repository)).rejects.toThrow('No storage recovery copy')
  vi.spyOn(repository, 'latest').mockResolvedValue(repository.copies[0])
  await expect(workspaceRecoveryExport(repository)).rejects.toThrow('could not be verified')
  activateAccountWorkspace('recovery-a')
  vi.spyOn(repository, 'latest').mockImplementation(async () => { const snapshot = repository.copies[0]; activateGuestWorkspace(); return snapshot })
  await expect(workspaceRecoveryExport(repository)).rejects.toThrow('active workspace changed')
  expect(captureWorkspaceIdentity().key).not.toBe(plan.owner.key)
})

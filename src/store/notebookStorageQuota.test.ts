// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { afterEach, expect, it, vi } from 'vitest'
import type { LectureRecord } from '@/lib/types'
import { notebookTransaction } from '@/components/academics/ExternalNotebookView'
import { exportNotebook, saveNotebookEdits } from '@/lib/academics/notebook/import'
import { plainVisualFixture } from '@/lib/academics/notebook/visual.test-fixtures'
import { activateAccountWorkspace, activateGuestWorkspace, createInitialDataForMode, CURRENT_STORE_VERSION, snapshotData, useStore } from './store'
import { guardedStorage } from './storageHealth'

// Optional local reproduction input is never required by the committed suite.
const realRecord = process.env.NOTEBOOK_QUOTA_RECORD
  ? JSON.parse(readFileSync(process.env.NOTEBOOK_QUOTA_RECORD, 'utf8')) as LectureRecord
  : undefined

function notebookRecord(): LectureRecord {
  if (realRecord) return structuredClone(realRecord)
  const pkg = plainVisualFixture()
  pkg.entries[0].title = 'Scientific Thinking'
  const raw = JSON.stringify(pkg)
  return {
    id: 'quota-notebook', courseId: 'quota-course', title: pkg.entries[0].title,
    inputPath: 'materials', processingState: 'ready', workspaceState: 'complete', createdAt: 1, updatedAt: 1, order: 0,
    importedNotebook: {
      current: pkg, original: structuredClone(pkg), originalRaw: raw,
      entryId: pkg.entries[0].id, fingerprint: 'quota-fixture', importedAt: 1,
      notes: 'Retain every archived note, including \u2014 and \ud83e\udde0.\n'.repeat(12_000),
      progress: {}, history: [], assetBindings: [],
    },
  }
}

function quotaStorage() {
  const values = new Map<string, string>(), originalGet = Storage.prototype.getItem
  const originalSet = Storage.prototype.setItem, originalRemove = Storage.prototype.removeItem
  let limit = Infinity, rejectWrites = false
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key) {
    return this === localStorage ? values.get(key) ?? null : originalGet.call(this, key)
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (this !== localStorage) return originalSet.call(this, key, value)
    const size = [...values].reduce((sum, [name, text]) => sum + (name === key ? 0 : name.length + text.length), key.length + value.length)
    if (rejectWrites || size > limit) throw new DOMException('Quota exceeded', 'QuotaExceededError')
    values.set(key, value)
  })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) {
    if (this !== localStorage) return originalRemove.call(this, key)
    values.delete(key)
  })
  return {
    values,
    constrain: () => { limit = [...values].reduce((sum, [key, value]) => sum + key.length + value.length, 128) },
    reject: () => { rejectWrites = true },
  }
}

afterEach(() => vi.restoreAllMocks())

it('saves a title edit at the existing raw workspace quota, retaining exact notebook history through reload and account switching', async () => {
  const disk = quotaStorage(), data = createInitialDataForMode(false), record = notebookRecord()
  data.academics.classCenter.lectures = [record]
  activateGuestWorkspace()
  useStore.setState(data)
  // A portable notebook lacks its outer LectureRecord wrapper. The existing
  // migration adds selectedSourceFileIds and a missing workspaceState; establish
  // those defaults before comparing the complete saved record on later reloads.
  await useStore.persist.rehydrate()
  expect(useStore.getState().academics.classCenter.lectures[0].importedNotebook).toEqual(record.importedNotebook)
  const key = useStore.persist.getOptions().name
  if (!key) throw new Error('Expected an active guest persistence key')
  const before = structuredClone(useStore.getState().academics.classCenter.lectures[0].importedNotebook!)
  const rawBefore = JSON.stringify({ state: snapshotData(), version: CURRENT_STORE_VERSION })
  // Begin with the exact legacy plain-JSON encoding already on the device.
  disk.values.set(key, rawBefore)
  disk.values.set('unrelated-user-data', 'Keep this byte for byte')
  disk.constrain()
  const edited = structuredClone(before.current)
  edited.entries.find(entry => entry.id === before.entryId)!.title = 'Lesson 1 \u2014 Scientific Thinking'

  expect(() => notebookTransaction(state => {
    saveNotebookEdits(state.academics.classCenter.lectures[0], edited, before.notes)
  })).not.toThrow()

  const savedRecord = structuredClone(useStore.getState().academics.classCenter.lectures[0])
  const saved = savedRecord.importedNotebook!
  expect(savedRecord.id).toBe(record.id)
  expect(savedRecord.courseId).toBe(record.courseId)
  expect(saved.entryId).toBe(before.entryId)
  expect(savedRecord.title).toBe('Lesson 1 \u2014 Scientific Thinking')
  expect(saved.current).toEqual(edited)
  expect(saved.original).toEqual(before.original)
  expect(saved.originalRaw).toBe(before.originalRaw)
  expect(saved.acceptedRaw).toBe(before.acceptedRaw)
  expect(saved.notes).toBe(before.notes)
  expect(saved.progress).toEqual(before.progress)
  expect(saved.assetBindings).toEqual(before.assetBindings)
  expect(saved.history!.slice(0, -1)).toEqual(before.history)
  expect(saved.history!.at(-1)?.current).toEqual(before.current)
  expect(saved.history!.at(-1)?.notes).toBe(before.notes)
  expect(saved.history!.at(-1)?.progress).toEqual(before.progress)
  expect(disk.values.get('unrelated-user-data')).toBe('Keep this byte for byte')
  const persisted = disk.values.get(key)!
  expect(persisted.length).toBeLessThan(rawBefore.length)
  const decoded = await guardedStorage(localStorage).getItem(key)
  expect(JSON.parse(decoded!).state.academics.classCenter.lectures[0]).toEqual(savedRecord)
  expect(JSON.parse(exportNotebook(savedRecord, 'current')).entries[0].title).toBe(savedRecord.title)

  const newer = JSON.parse(decoded!)
  newer.state.academics.classCenter.lectures[0].importedNotebook.notes = 'Newer work from another tab'
  guardedStorage(localStorage).setItem(key, JSON.stringify(newer))
  const newerStored = disk.values.get(key)
  expect(newerStored?.startsWith('premed-os:workspace:gzip:v1:')).toBe(true)
  expect(() => notebookTransaction(state => { state.academics.classCenter.lectures[0].title = 'Stale overwrite' })).toThrow('another tab')
  expect(useStore.getState().academics.classCenter.lectures[0]).toEqual(savedRecord)
  expect(disk.values.get(key)).toBe(newerStored)

  useStore.setState(createInitialDataForMode(false))
  disk.values.set(key, persisted)
  await useStore.persist.rehydrate()
  expect(useStore.getState().academics.classCenter.lectures[0]).toEqual(savedRecord)

  activateAccountWorkspace('compressed-owner', snapshotData())
  notebookTransaction(state => { state.academics.classCenter.lectures[0].importedNotebook!.notes = 'Account-only note' })
  const accountRecord = structuredClone(useStore.getState().academics.classCenter.lectures[0])
  activateGuestWorkspace()
  expect(useStore.getState().academics.classCenter.lectures[0]).toEqual(savedRecord)
  activateAccountWorkspace('compressed-owner')
  expect(useStore.getState().academics.classCenter.lectures[0]).toEqual(accountRecord)
  expect(disk.values.get('unrelated-user-data')).toBe('Keep this byte for byte')

  const activeKey = useStore.persist.getOptions().name
  if (!activeKey) throw new Error('Expected an active account persistence key')
  const activeRaw = disk.values.get(activeKey)
  const memoryBeforeFailure = structuredClone(useStore.getState().academics)
  disk.reject()
  expect(() => notebookTransaction(state => { state.academics.classCenter.lectures[0].title = 'Must not save' })).toThrow('Browser storage could not save')
  expect(useStore.getState().academics).toEqual(memoryBeforeFailure)
  expect(disk.values.get(activeKey)).toBe(activeRaw)
})

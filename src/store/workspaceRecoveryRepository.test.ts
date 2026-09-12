// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { createWorkspaceRecoveryRepository, type WorkspaceRecoverySnapshot } from './workspaceRecoveryRepository'

function request() {
  return { onerror: null as (() => void) | null, onblocked: null as (() => void) | null, onsuccess: null as (() => void) | null, error: null as DOMException | null, result: {} as unknown }
}
const snapshot: WorkspaceRecoverySnapshot = { format: 'premed-os-workspace-recovery', version: 1, workspaceKey: 'account-a', id: 'snapshot-a', createdAt: 1, stored: '{}', sha256: 'test-repository-boundary' }

it('rejects a blocked database and closes a connection that arrives after the failure', async () => {
  const opening = request(), close = vi.fn()
  const factory = { open: () => { queueMicrotask(() => opening.onblocked?.()); return opening } } as unknown as IDBFactory
  const repository = createWorkspaceRecoveryRepository(factory)
  await expect(repository.save(snapshot)).rejects.toThrow('Another tab is blocking')
  opening.result = { close }
  opening.onsuccess?.()
  expect(close).toHaveBeenCalledTimes(1)
})

it('rejects database open errors without publishing a recovery success', async () => {
  const opening = request()
  const factory = { open: () => { queueMicrotask(() => { opening.error = new DOMException('Unavailable storage', 'UnknownError'); opening.onerror?.() }); return opening } } as unknown as IDBFactory
  await expect(createWorkspaceRecoveryRepository(factory).save(snapshot)).rejects.toThrow('Unavailable storage')
})

it('requires transaction completion and strict durability; a quota abort rejects the snapshot', async () => {
  const opening = request()
  const tx = { oncomplete: null as (() => void) | null, onabort: null as (() => void) | null, onerror: null as (() => void) | null, error: null as DOMException | null, objectStore: () => ({ add: () => queueMicrotask(() => { tx.error = new DOMException('Quota', 'QuotaExceededError'); tx.onabort?.() }) }), abort() {} }
  const transaction = vi.fn(() => tx)
  opening.result = { transaction, close() {} }
  const factory = { open: () => { queueMicrotask(() => opening.onsuccess?.()); return opening } } as unknown as IDBFactory
  await expect(createWorkspaceRecoveryRepository(factory).save(snapshot)).rejects.toThrow('not enough browser space')
  expect(transaction).toHaveBeenCalledWith('snapshots', 'readwrite', { durability: 'strict' })
})

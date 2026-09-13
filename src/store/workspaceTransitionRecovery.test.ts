import { beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import type { WorkspaceRecoverySnapshot } from './workspaceRecoveryRepository'
const fake = vi.hoisted(() => ({ copies: new Map<string, WorkspaceRecoverySnapshot>(), fail: false }))
vi.mock('./workspaceRecoveryRepository', () => ({ workspaceRecoveryRepository: () => ({
  async save(copy: WorkspaceRecoverySnapshot) { if (fake.fail) throw new Error('Synthetic quota'); fake.copies.set(copy.workspaceKey, copy) },
  async read(key: string) { return fake.copies.get(key) ?? null },
  async latest(key: string) { return fake.copies.get(key) ?? null },
}) }))
beforeEach(() => { vi.resetModules(); fake.copies.clear(); fake.fail = false })
it('recovers outgoing unsaved work after a fresh module load without adopting it', async () => {
  const first = await import('./workspaceTransitionRecovery')
  const data = createPersonalInitialData(); data.notes.example = 'Unsaved exact note'
  first.retainOutgoingWorkspace('synthetic-account-a', data, 'original raw bytes')
  await vi.waitFor(() => expect(fake.copies.size).toBe(1))
  vi.resetModules()
  const reloaded = await import('./workspaceTransitionRecovery')
  expect(reloaded.hasRetainedOutgoingWorkspace()).toBe(false)
  expect(await reloaded.readOutgoingWorkspace('synthetic-account-a')).toEqual({ key: 'synthetic-account-a', data, raw: 'original raw bytes' })
  expect(await reloaded.readOutgoingWorkspace('synthetic-account-b')).toBeNull()
})
it('retains the original open copy in memory when the archive cannot save', async () => {
  fake.fail = true
  const recovery = await import('./workspaceTransitionRecovery')
  const data = createPersonalInitialData(); data.notes.example = 'Only in this tab'
  recovery.retainOutgoingWorkspace('synthetic-account-a', data, null)
  data.notes.example = 'later unrelated mutation'
  expect((await recovery.readOutgoingWorkspace('synthetic-account-a'))?.data.notes.example).toBe('Only in this tab')
  expect(fake.copies.size).toBe(0)
})

import { Blob as NodeBlob } from 'node:buffer'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const wire = vi.hoisted(() => ({ id: 'synthetic-a', generation: 1, download: vi.fn() }))
vi.mock('@/store/accountSyncSafety', () => ({ captureSyncSession: () => ({ id: wire.id, generation: wire.generation }) }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: wire.id } } }, error: null }) }, storage: { from: () => ({ download: wire.download }) } } }))
import { readSharedNotebookImage } from './sharedNotebookAssets'
import { binaryDigest } from '@/lib/workspaceAssets'
beforeEach(() => { localStorage.clear(); localStorage.setItem('hq:workspace-owner', 'account:synthetic-a'); wire.id = 'synthetic-a'; wire.generation++; wire.download.mockReset(); vi.stubGlobal('Blob', NodeBlob) })
afterEach(() => vi.unstubAllGlobals())
function switchAccount() { wire.id = 'synthetic-b'; wire.generation++; localStorage.setItem('hq:workspace-owner', 'account:synthetic-b') }
it('uses the current account folder even when another account has the same image hash', async () => {
  const blob = new Blob(['Synthetic bytes']), hash = await binaryDigest(blob)
  wire.download.mockImplementation(async (path: string) => path.startsWith('synthetic-a/') ? { data: blob, error: null } : { data: null, error: { statusCode: '404' } })
  expect(await readSharedNotebookImage(hash)).toBe(blob)
  switchAccount()
  expect(await readSharedNotebookImage(hash)).toBeUndefined()
  expect(wire.download.mock.calls.map(call => call[0])).toEqual([`synthetic-a/notebook-assets/${hash}`, `synthetic-b/notebook-assets/${hash}`])
})
it('does not return A bytes after an account change during download', async () => {
  const blob = new Blob(['Synthetic bytes']), hash = await binaryDigest(blob)
  wire.download.mockImplementation(async () => { switchAccount(); return { data: blob, error: null } })
  await expect(readSharedNotebookImage(hash)).rejects.toThrow('account changed')
})
it('does not return A bytes after an account change during local cache retention', async () => {
  const blob = new Blob(['Synthetic bytes']), hash = await binaryDigest(blob)
  wire.download.mockResolvedValue({ data: blob, error: null })
  await expect(readSharedNotebookImage(hash, async () => { switchAccount() })).rejects.toThrow('account changed')
})

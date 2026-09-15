import { Blob as NodeBlob } from 'node:buffer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { syncNotebookImages, type NotebookCloudTransport } from './sharedNotebookAssets'
import { binaryDigest } from '@/lib/workspaceAssets'
import type { ImportedNotebook } from './types'
import { visualFixture } from './visual.test-fixtures'

beforeEach(() => vi.stubGlobal('Blob', NodeBlob))
afterEach(() => vi.unstubAllGlobals())
async function fixture() {
  const data = createPersonalInitialData(), blob = new Blob(['Synthetic image bytes'], { type: 'image/png' }), hash = await binaryDigest(blob)
  const pkg = visualFixture()
  data.academics.classCenter.lectures.push({ id: 'example', importedNotebook: { original: pkg, current: pkg, originalRaw: JSON.stringify(pkg), entryId: pkg.entries[0].id, fingerprint: 'synthetic', importedAt: 1, progress: {}, notes: '', assetBindings: [{ assetId: pkg.assets[0].id, sha256: hash, byteLength: blob.size, mimeType: 'image/png', width: 1, height: 1 }] } as unknown as ImportedNotebook } as typeof data.academics.classCenter.lectures[number])
  const cloud = new Map<string, Blob>(), upload = vi.fn(async (owner: string, digest: string, bytes: Blob) => { cloud.set(`${owner}/${digest}`, bytes) })
  const remote: NotebookCloudTransport = { upload, download: async (owner, digest) => cloud.get(`${owner}/${digest}`) }
  return { data, blob, hash, cloud, remote, upload }
}
it('uploads and reads back every referenced image before acknowledging cloud completeness', async () => {
  const f = await fixture()
  expect(await syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {}, f.remote)).toEqual({ verified: 1 })
  expect(f.upload).toHaveBeenCalledTimes(1)
  expect(await syncNotebookImages(f.data, 'owner-a', { read: async () => undefined }, () => {}, f.remote)).toEqual({ verified: 1 })
  await expect(syncNotebookImages(f.data, 'owner-b', { read: async () => undefined }, () => {}, f.remote)).rejects.toThrow('missing locally and in your account')
})
it('rejects damaged cloud bytes without replacing them or claiming success', async () => {
  const f = await fixture(); f.cloud.set(`owner-a/${f.hash}`, new Blob(['wrong']))
  await expect(syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {}, f.remote)).rejects.toThrow('could not be verified')
  expect(f.upload).not.toHaveBeenCalled()
})
it('stops before upload when the workspace changes during a preceding read', async () => {
  const f = await fixture(); let fresh = true
  const reader = { read: async () => { fresh = false; return f.blob } }
  await expect(syncNotebookImages(f.data, 'owner-a', reader, () => { if (!fresh) throw new Error('Workspace changed') }, f.remote)).rejects.toThrow('Workspace changed')
  expect(f.upload).not.toHaveBeenCalled()
})

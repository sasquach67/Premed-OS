import { Blob as NodeBlob } from 'node:buffer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { createPersonalInitialData } from '@/data/personalInitialData'
import { syncNotebookImages, type NotebookCloudTransport } from './sharedNotebookAssets'
import { binaryDigest } from '@/lib/workspaceAssets'
import type { ImportedNotebook } from './types'
import { visualFixture } from './visual.test-fixtures'
import { createNotebookAssetRepository } from './notebookAssetStore'
import { CloudRequestError } from '@/store/cloudRequest'

const wire = vi.hoisted(() => ({ download: vi.fn(), upload: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { storage: { from: () => wire } } }))

beforeEach(() => { vi.stubGlobal('Blob', NodeBlob); wire.download.mockReset(); wire.upload.mockReset() })
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
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
it('verifies intact cloud bytes without depending on a readable local image cache', async () => {
  const f = await fixture(), read = vi.fn(async () => { throw new Error('Local image storage could not be opened.') })
  f.cloud.set(`owner-a/${f.hash}`, f.blob)
  await expect(syncNotebookImages(f.data, 'owner-a', { read }, () => {}, f.remote)).resolves.toEqual({ verified: 1 })
  expect(read).toHaveBeenCalledTimes(1); expect(f.upload).not.toHaveBeenCalled()
})
it('keeps a missing IndexedDB image and missing cloud object unresolved', async () => {
  const f = await fixture(), repository = createNotebookAssetRepository(new IDBFactory()), progress = vi.fn()
  await expect(syncNotebookImages(f.data, 'owner-a', repository, () => {}, f.remote, progress)).rejects.toThrow('missing locally and in your account')
  expect(f.upload).not.toHaveBeenCalled(); expect(progress.mock.calls).toEqual([[0, 1]])
})
it('preserves the local read failure when the account image is also absent', async () => {
  const f = await fixture(), failure = new Error('Local image storage is unavailable.')
  await expect(syncNotebookImages(f.data, 'owner-a', { read: async () => { throw failure } }, () => {}, f.remote)).rejects.toBe(failure)
  expect(f.upload).not.toHaveBeenCalled()
})
it('times out a stalled image upload and fences its late completion before cloud readback', async () => {
  const f = await fixture(), progress = vi.fn()
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const download = vi.fn(async () => f.cloud.get(`owner-a/${f.hash}`))
  const upload = vi.fn(async () => { await gate; f.cloud.set(`owner-a/${f.hash}`, f.blob) })
  vi.useFakeTimers()
  let failure: unknown
  const work = syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {}, { download, upload }, progress).catch(error => { failure = error })
  try {
    await vi.waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(120_001)
    expect(failure).toBeInstanceOf(CloudRequestError)
    expect(failure).toMatchObject({ retryable: true, message: expect.stringContaining('stopped making progress') })
  } finally { release(); await work; await vi.advanceTimersByTimeAsync(1) }
  expect(download).toHaveBeenCalledTimes(1)
  expect(progress.mock.calls).toEqual([[0, 1]])
})
it('times out a stalled cloud read and ignores its late verified bytes', async () => {
  const f = await fixture(), progress = vi.fn(), read = vi.fn(async () => f.blob)
  let release!: (blob: Blob) => void
  const gate = new Promise<Blob>(resolve => { release = resolve })
  const download = vi.fn(() => gate)
  vi.useFakeTimers()
  let failure: unknown
  const work = syncNotebookImages(f.data, 'owner-a', { read }, () => {}, { download, upload: f.upload }, progress).catch(error => { failure = error })
  try {
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(120_001)
    expect(failure).toMatchObject({ retryable: true, message: expect.stringContaining('stopped making progress') })
  } finally { release(f.blob); await work; await vi.advanceTimersByTimeAsync(1) }
  expect(read).toHaveBeenCalledTimes(1); expect(f.upload).not.toHaveBeenCalled()
  expect(progress.mock.calls).toEqual([[0, 1]])
})
it('does not upload local bytes that arrive after the image check timed out', async () => {
  const f = await fixture(), progress = vi.fn()
  let release!: (blob: Blob) => void
  const gate = new Promise<Blob>(resolve => { release = resolve }), read = vi.fn(() => gate)
  vi.useFakeTimers()
  let failure: unknown
  const work = syncNotebookImages(f.data, 'owner-a', { read }, () => {}, f.remote, progress).catch(error => { failure = error })
  try {
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(120_001)
    expect(failure).toMatchObject({ retryable: true })
  } finally { release(f.blob); await work; await vi.advanceTimersByTimeAsync(1) }
  expect(f.upload).not.toHaveBeenCalled(); expect(progress.mock.calls).toEqual([[0, 1]])
})
it('stops before upload when the workspace changes during a preceding read', async () => {
  const f = await fixture(); let fresh = true
  const reader = { read: async () => { fresh = false; return f.blob } }
  await expect(syncNotebookImages(f.data, 'owner-a', reader, () => { if (!fresh) throw new Error('Workspace changed') }, f.remote)).rejects.toThrow('Workspace changed')
  expect(f.upload).not.toHaveBeenCalled()
})

it('retries a storage 503 and verifies bytes before acknowledging the image', async () => {
  const f = await fixture(); vi.useFakeTimers()
  wire.download.mockResolvedValueOnce({ error: { status: 503, statusCode: 'SlowDown', message: 'Busy' } }).mockResolvedValue({ data: f.blob, error: null })
  const guard = vi.fn()
  const work = syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, guard)
  const result = expect(work).resolves.toEqual({ verified: 1 })
  await vi.advanceTimersByTimeAsync(2000); await result
  expect(wire.download).toHaveBeenCalledTimes(2)
  expect(guard.mock.calls.length).toBeGreaterThan(4)
})
it('retains authorization status and original failure without retrying', async () => {
  const f = await fixture(), error = { status: 403, statusCode: 'AccessDenied', message: 'Access denied' }
  wire.download.mockResolvedValue({ error })
  await expect(syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {})).rejects.toMatchObject({ retryable: false, status: 403, cause: error })
  expect(wire.download).toHaveBeenCalledTimes(1); expect(wire.upload).not.toHaveBeenCalled()
})
it('stops image retries after the account changes during backoff', async () => {
  const f = await fixture(); vi.useFakeTimers(); let fresh = true
  wire.download.mockResolvedValue({ error: { status: 503, message: 'Busy' } })
  const work = syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => { if (!fresh) throw new Error('Account changed') })
  const failed = expect(work).rejects.toThrow('Account changed')
  await vi.advanceTimersByTimeAsync(1); fresh = false
  await vi.advanceTimersByTimeAsync(2000); await failed
  expect(wire.download).toHaveBeenCalledTimes(1)
})
it('rejects corrupted bytes returned after a retry without uploading replacements', async () => {
  const f = await fixture(); vi.useFakeTimers()
  wire.download.mockResolvedValueOnce({ error: { status: 500, message: 'Busy' } }).mockResolvedValue({ data: new Blob(['wrong']), error: null })
  const failed = expect(syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {})).rejects.toThrow('could not be verified')
  await vi.advanceTimersByTimeAsync(2000); await failed
  expect(wire.download).toHaveBeenCalledTimes(2); expect(wire.upload).not.toHaveBeenCalled()
})
it.each([null, { status: 409, statusCode: 'KeyAlreadyExists' }])('recognizes missing objects and verifies uploaded or concurrently saved copies (%j)', async error => {
  const f = await fixture()
  wire.download.mockResolvedValueOnce({ error: { status: 404, statusCode: 'NoSuchKey', message: 'Missing' } }).mockResolvedValue({ data: f.blob, error: null })
  wire.upload.mockResolvedValue({ error })
  expect(await syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {})).toEqual({ verified: 1 })
  expect(wire.upload).toHaveBeenCalledTimes(1); expect(wire.download).toHaveBeenCalledTimes(2)
})
it.each([503, 403])('preserves upload HTTP %s retryability after bounded guarded attempts', async status => {
  const f = await fixture(), error = { status, statusCode: status === 503 ? 'SlowDown' : 'AccessDenied', message: 'Synthetic upload failure' }
  wire.download.mockResolvedValue({ error: { status: 404, message: 'Missing' } })
  wire.upload.mockResolvedValue({ error })
  vi.useFakeTimers()
  let failure: unknown
  const work = syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {}).catch(error => { failure = error })
  await vi.waitFor(() => expect(wire.upload).toHaveBeenCalled())
  await vi.advanceTimersByTimeAsync(15_000); await work
  expect(failure).toBeInstanceOf(CloudRequestError)
  expect(failure).toMatchObject({ retryable: status === 503, status, cause: error })
  expect(wire.upload).toHaveBeenCalledTimes(status === 503 ? 4 : 1)
  expect(wire.download).toHaveBeenCalledTimes(1)
  for (const call of wire.upload.mock.calls) expect(call[2]).toMatchObject({ upsert: false })
})
it('stops upload retries when the account or sync lease changes during backoff', async () => {
  const f = await fixture(); let fresh = true, failure: unknown
  wire.download.mockResolvedValue({ error: { status: 404, message: 'Missing' } })
  wire.upload.mockResolvedValue({ error: { status: 503, message: 'Busy' } })
  vi.useFakeTimers()
  const work = syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => { if (!fresh) throw new Error('Account sync paused') }).catch(error => { failure = error })
  await vi.waitFor(() => expect(wire.upload).toHaveBeenCalledTimes(1))
  fresh = false
  await vi.advanceTimersByTimeAsync(2000); await work
  expect(failure).toMatchObject({ message: 'Account sync paused' })
  expect(wire.upload).toHaveBeenCalledTimes(1); expect(wire.download).toHaveBeenCalledTimes(1)
})
it.each([true, false])('verifies immutable readback after an upload retry finds a concurrent object (valid: %s)', async valid => {
  const f = await fixture(), progress = vi.fn()
  wire.download.mockResolvedValueOnce({ error: { status: 404, message: 'Missing' } }).mockResolvedValue({ data: valid ? f.blob : new Blob(['wrong']), error: null })
  wire.upload.mockResolvedValueOnce({ error: { status: 503, message: 'Response lost' } }).mockResolvedValue({ error: { status: 409, message: 'Already exists' } })
  vi.useFakeTimers()
  let failure: unknown, result: unknown
  const work = syncNotebookImages(f.data, 'owner-a', { read: async () => f.blob }, () => {}, undefined, progress).then(value => { result = value }).catch(error => { failure = error })
  await vi.waitFor(() => expect(wire.upload).toHaveBeenCalledTimes(1))
  await vi.advanceTimersByTimeAsync(2000); await work
  expect(wire.upload).toHaveBeenCalledTimes(2); expect(wire.download).toHaveBeenCalledTimes(2)
  for (const call of wire.upload.mock.calls) expect(call[2]).toMatchObject({ upsert: false })
  if (valid) { expect(failure).toBeUndefined(); expect(result).toEqual({ verified: 1 }); expect(progress).toHaveBeenLastCalledWith(1, 1) }
  else { expect(failure).toMatchObject({ message: expect.stringContaining('could not be verified') }); expect(progress.mock.calls).toEqual([[0, 1]]) }
})

it('reports verified progress for 80 distinct fixture images with a slowed repository', async () => {
  const f=await fixture(), blobs=new Map<string,Blob>()
  const template=structuredClone(f.data.academics.classCenter.lectures[0])
  f.data.academics.classCenter.lectures=[]
  for(let notebook=0;notebook<2;notebook++) {
    const lecture=structuredClone(template), pkg=visualFixture()
    const asset=pkg.assets[0], candidate=pkg.visualReview!.candidates[0]
    const figure=pkg.entries[0].sections.flatMap(section=>section.blocks).find(block=>block.type==='figure')!
    const bindings=[]
    for(let image=0;image<40;image++) {
      const blob=new Blob([`Synthetic image ${notebook}-${image}`],{type:'image/png'}), hash=await binaryDigest(blob)
      const assetId=image===0?asset.id:`image-${image}`
      blobs.set(hash,blob);bindings.push({assetId,sha256:hash,byteLength:blob.size,mimeType:'image/png',width:1,height:1})
      if(image>0) {
        pkg.assets.push({...asset,id:assetId,fileName:`image-${image}.png`})
        pkg.visualReview!.candidates.push({...candidate,id:`candidate-${image}`,assetId})
        pkg.entries[0].sections[0].blocks.push({...figure,id:`figure-${image}`,assetId} as typeof figure)
      }
    }
    lecture.id=`fixture-${notebook}`
    Object.assign(lecture.importedNotebook!,{original:pkg,current:pkg,originalRaw:JSON.stringify(pkg),assetBindings:bindings})
    f.data.academics.classCenter.lectures.push(lecture)
  }
  const progress=vi.fn()
  const reader={read:async(hash:string)=>{await new Promise(resolve=>setTimeout(resolve,1));return blobs.get(hash)}}
  expect(await syncNotebookImages(f.data,'owner-a',reader,()=>{},f.remote,progress)).toEqual({verified:80})
  expect(progress).toHaveBeenCalledTimes(81)
  expect(progress).toHaveBeenNthCalledWith(1,0,80);expect(progress).toHaveBeenLastCalledWith(80,80)
  expect(f.upload).toHaveBeenCalledTimes(80)
}, 30_000)

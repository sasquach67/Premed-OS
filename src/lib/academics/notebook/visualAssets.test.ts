// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import { commitNotebookAssets } from './notebookAssetStore'
import { notebookCrc32 } from './notebookZip'
import { assertRasterDimensions, getPreparedAssetBytes, prepareNotebookAssets, validateNotebookRaster } from './visualAssets'
import { changedPngBlob, headerDecoder, MemoryNotebookAssets, pngBlob, pngBytes, visualFixture } from './visual.test-fixtures'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))
const prepare = (blob = pngBlob()) => { const p = visualFixture(); return prepareNotebookAssets(p, [{ name: p.assets[0].fileName, blob }], { decode: headerDecoder }) }
it('validates real fixed PNG bytes and records app-owned hash/dimensions without rewriting the author manifest', async () => {
  const p = visualFixture(), raw = JSON.stringify(p), result = await prepareNotebookAssets(p, [{ name: p.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  expect(result.bindings[0].sha256).toMatch(/^[a-f0-9]{64}$/); expect(result.bindings[0].byteLength).toBe(pngBytes().length)
  expect(result.bindings[0].width).toBeGreaterThan(1); expect(getPreparedAssetBytes(result).size).toBe(1)
  expect(JSON.stringify(p)).toBe(raw); expect(Object.isFrozen(result.bindings[0])).toBe(true)
})
it('does not treat signature checks or a supplied MIME as actual decode success', async () => {
  await expect(validateNotebookRaster('a', pngBlob(), 'image/png', async () => { throw new Error('decoder rejected pixels') })).rejects.toThrow('could not be decoded')
  await expect(validateNotebookRaster('a', pngBlob(), 'image/jpeg', headerDecoder)).rejects.toThrow('MIME')
  await expect(validateNotebookRaster('a', new Blob(['<svg/>'], { type: 'image/png' }), 'image/png', headerDecoder)).rejects.toThrow('Actual bytes')
  await expect(validateNotebookRaster('a', pngBlob(), 'image/png', async () => ({ width: 1, height: 1 }))).rejects.toThrow('dimensions disagree')
})
it('rejects corrupt PNG chunks and oversized dimensions before decoding', async () => {
  const corrupt = pngBytes(); corrupt[40] ^= 1
  await expect(validateNotebookRaster('a', new Blob([corrupt]), 'image/png', headerDecoder)).rejects.toThrow('checksum')
  const huge = pngBytes(), view = new DataView(huge.buffer); view.setUint32(16, 8192); view.setUint32(20, 8192); view.setUint32(29, notebookCrc32(huge.subarray(12, 29)))
  const decode = vi.fn(headerDecoder)
  await expect(validateNotebookRaster('a', new Blob([huge]), 'image/png', decode)).rejects.toThrow('Decoded image pixels')
  expect(decode).not.toHaveBeenCalled(); expect(() => assertRasterDimensions(8193, 1)).toThrow('width')
})
it('rejects missing, ambiguous, unrelated and conflicting mapped files before any persistence', async () => {
  const p = visualFixture(), name = p.assets[0].fileName, blob = pngBlob()
  await expect(prepareNotebookAssets(p, [], { decode: headerDecoder })).rejects.toThrow('Missing image')
  await expect(prepareNotebookAssets(p, [{ name, blob }, { name, blob }], { decode: headerDecoder })).rejects.toThrow('Ambiguous')
  await expect(prepareNotebookAssets(p, [{ name: 'unrelated.png', blob }], { decode: headerDecoder })).rejects.toThrow('not declared')
  await expect(prepareNotebookAssets(p, [{ name, blob }], { mappedFiles: new Map([[p.assets[0].id, changedPngBlob()]]), decode: headerDecoder })).rejects.toThrow('Conflicting')
})
it('refuses a changed image under an existing ID, even when the visible pixels can be the same', async () => {
  const before = await prepare(), p = visualFixture()
  await expect(prepareNotebookAssets(p, [{ name: p.assets[0].fileName, blob: changedPngBlob() }], { previousBindings: before.bindings, decode: headerDecoder })).rejects.toThrow('already bound')
})
it('stages bytes before synchronous commit and then retires only its own journal', async () => {
  const repo = new MemoryNotebookAssets(), prepared = await prepare(), receipt = await commitNotebookAssets({ repository: repo, prepared, assertFresh: () => undefined, commit: state => { expect(repo.bytes.size).toBe(1); expect(repo.leases.size).toBe(1); expect(state.assetBindings).toEqual(prepared.bindings); return { committed: true } } })
  expect(receipt).toMatchObject({ committed: true, journalPending: false }); expect(repo.leases.size).toBe(0); expect(repo.bytes.size).toBe(1)
})
it('keeps original state on quota failure and on a concurrent edit after asynchronous staging', async () => {
  const repo = new MemoryNotebookAssets(), prepared = await prepare(), commit = vi.fn(() => ({ committed: true as const }))
  repo.failStage = true
  await expect(commitNotebookAssets({ repository: repo, prepared, assertFresh: () => undefined, commit })).rejects.toThrow('quota')
  expect(commit).not.toHaveBeenCalled(); expect(repo.bytes.size).toBe(0)
  repo.failStage = false; let changed = false; repo.afterStage = () => { changed = true }
  await expect(commitNotebookAssets({ repository: repo, prepared, assertFresh: () => { if (changed) throw new Error('Newer manual edit') }, commit })).rejects.toThrow('Newer manual edit')
  expect(commit).not.toHaveBeenCalled(); expect(repo.leases.size).toBe(1); expect(repo.bytes.size).toBe(1)
})
it('keeps recoverable bytes/journal after JSON commit failure and reports cleanup failure separately from saved state', async () => {
  const repo = new MemoryNotebookAssets(), prepared = await prepare()
  await expect(commitNotebookAssets({ repository: repo, prepared, assertFresh: () => undefined, commit: () => { throw new Error('JSON quota failure') } })).rejects.toThrow('JSON quota')
  expect(repo.leases.size).toBe(1); expect(repo.bytes.size).toBe(1)
  repo.failFinish = true
  const receipt = await commitNotebookAssets({ repository: repo, prepared, assertFresh: () => undefined, commit: () => ({ committed: true }) })
  expect(receipt).toMatchObject({ committed: true, journalPending: true }); expect(repo.leases.size).toBe(2)
})
it('enforces per-lineage binding identity while allowing unrelated notebooks to use the same asset ID', async () => {
  const repo = new MemoryNotebookAssets(), prepared = await prepare(), changed = await prepare(changedPngBlob()), commit = () => ({ committed: true as const })
  await commitNotebookAssets({ repository: repo, prepared, lineageId: 'one', assertFresh: () => undefined, commit })
  await expect(commitNotebookAssets({ repository: repo, prepared: changed, lineageId: 'one', assertFresh: () => undefined, commit })).rejects.toThrow('Immutable')
  await expect(commitNotebookAssets({ repository: repo, prepared: changed, lineageId: 'unrelated', assertFresh: () => undefined, commit })).resolves.toMatchObject({ committed: true })
  expect(repo.bytes.size).toBe(2)
})
it('requires historical bytes to remain available before accepting a new package', async () => {
  const current = await prepare(), next = await prepare(changedPngBlob()), historical = { ...current.bindings[0], assetId: 'old-history-asset' }, repo = new MemoryNotebookAssets(), commit = vi.fn(() => ({ committed: true as const }))
  await expect(commitNotebookAssets({ repository: repo, prepared: next, retainedBindings: [historical], assertFresh: () => undefined, commit })).rejects.toThrow('Historical image')
  expect(commit).not.toHaveBeenCalled(); expect(repo.leases.size).toBe(0)
})

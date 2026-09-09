// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import { assertNotebookBackupFits, exportNotebookBackupBundle, exportNotebookPackageBundle, prepareNotebookBundle } from './notebookBundle'
import { readNotebookZip, writeNotebookZip } from './notebookZip'
import { getPreparedAssetBytes, prepareNotebookAssets } from './visualAssets'
import { headerDecoder, MemoryNotebookAssets, plainVisualFixture, pngBlob, visualFixture } from './visual.test-fixtures'
import type { PortableImportedNotebook } from './visualTypes'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))
async function setup() {
  const p = visualFixture(), raw = `${JSON.stringify(p, null, 2)}\n`, repo = new MemoryNotebookAssets()
  const prepared = await prepareNotebookAssets(p, [{ name: p.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  repo.bytes = getPreparedAssetBytes(prepared)
  const original = plainVisualFixture(), n: PortableImportedNotebook = {
    original, current: structuredClone(p), originalRaw: `${JSON.stringify(original, null, 2)}\n`, entryId: p.entries[0].id,
    fingerprint: 'authored-fixture', importedAt: 1, notes: 'Keep my personal note.', progress: { question: { response: 'My old attempt', complete: true } },
    acceptedRaw: raw, assetLineageId: 'local-only-lineage', assetBindings: prepared.bindings.map(b => ({ ...b })),
    history: [{ id: 'history-one', savedAt: 2, reason: 'edit', current: structuredClone(p), notes: 'Historical note', progress: { question: { response: 'Earlier attempt', complete: false } }, acceptedRaw: raw }],
    updateSession: { id: 'update-one', localId: 'local-entry', createdAt: 3, baseline: structuredClone(p) },
  }
  n.current.entries[0].title = 'My manually edited title'
  return { p, raw, repo, prepared, n }
}
it('round-trips exact author JSON with actual byte files and computed bindings', async () => {
  const s = await setup(), bundle = await exportNotebookPackageBundle(s.raw, s.prepared.bindings, s.repo, headerDecoder), decoded = await prepareNotebookBundle(bundle, headerDecoder)
  expect(decoded.kind).toBe('package')
  if (decoded.kind !== 'package') throw new Error('Expected package')
  expect(decoded.raw).toBe(s.raw); expect(decoded.package).toEqual(s.p); expect(decoded.assets.bindings).toEqual(s.prepared.bindings)
  const outputBytes = getPreparedAssetBytes(decoded.assets)
  expect([...new Uint8Array(await outputBytes.values().next().value!.arrayBuffer())]).toEqual([...new Uint8Array(await pngBlob().arrayBuffer())])
})
it('round-trips complete original/current/history/notes/progress/pending update without exporting local lineage keys', async () => {
  const s = await setup(), bundle = await exportNotebookBackupBundle(s.n, 'demo-course', s.repo, headerDecoder), members = await readNotebookZip(bundle)
  expect(new TextDecoder().decode(members.get('notebook.json'))).not.toContain('local-only-lineage')
  const decoded = await prepareNotebookBundle(bundle, headerDecoder)
  if (decoded.kind !== 'backup') throw new Error('Expected full backup')
  const { assetLineageId: _lineage, ...expected } = s.n
  expect(decoded.notebook).toEqual(expected); expect(decoded.notebook.originalRaw).toBe(s.n.originalRaw)
  expect(decoded.notebook.history![0].progress.question.response).toBe('Earlier attempt')
  expect(decoded.notebook.current.entries[0].title).toBe('My manually edited title')
  expect(getPreparedAssetBytes(decoded.assets).size).toBe(1)
})
it('includes an image retained only by earlier versions and refuses complete export when those bytes are missing', async () => {
  const s = await setup(); s.n.current = plainVisualFixture(); delete s.n.updateSession; delete s.n.acceptedRaw
  const decoded = await prepareNotebookBundle(await exportNotebookBackupBundle(s.n, 'demo', s.repo, headerDecoder), headerDecoder)
  expect(getPreparedAssetBytes(decoded.assets).size).toBe(1)
  s.repo.bytes.clear()
  await expect(exportNotebookBackupBundle(s.n, 'demo', s.repo, headerDecoder)).rejects.toThrow('unavailable on this device')
})
it('rejects missing, extra, altered or ambiguously declared bundle assets atomically', async () => {
  const s = await setup(), complete = await readNotebookZip(await exportNotebookPackageBundle(s.raw, s.prepared.bindings, s.repo, headerDecoder)), image = [...complete.keys()].find(n => n.startsWith('assets/'))!
  const missing = new Map(complete); missing.delete(image)
  const recovery = 'Re-export a complete notebook ZIP, or import the notebook JSON together with all of its referenced original PNG/JPEG files.'
  await expect(prepareNotebookBundle(writeNotebookZip(missing), headerDecoder)).rejects.toThrow(`This ZIP is missing required images. ${recovery}`)
  const extra = new Map(complete); extra.set(`assets/${'a'.repeat(64)}.png`, new Uint8Array(await pngBlob().arrayBuffer()))
  await expect(prepareNotebookBundle(writeNotebookZip(extra), headerDecoder)).rejects.toThrow(`This ZIP includes unrecognized extra files. ${recovery}`)
  const missingAndExtra = new Map(extra); missingAndExtra.delete(image)
  await expect(prepareNotebookBundle(writeNotebookZip(missingAndExtra), headerDecoder)).rejects.toThrow(`This ZIP is missing required images and includes unrecognized extra files. ${recovery}`)
  const changed = new Map(complete), index = JSON.parse(new TextDecoder().decode(changed.get('bindings.json'))); index.bindings[0].width++
  changed.set('bindings.json', new TextEncoder().encode(JSON.stringify(index)))
  await expect(prepareNotebookBundle(writeNotebookZip(changed), headerDecoder)).rejects.toThrow('binding digest')
  index.bindings.push({ ...index.bindings[0] }); changed.set('bindings.json', new TextEncoder().encode(JSON.stringify(index)))
  await expect(prepareNotebookBundle(writeNotebookZip(changed), headerDecoder)).rejects.toThrow('Duplicate image ID')
})
it('rejects fabricated original provenance and refuses oversized prospective backup without pruning history', async () => {
  const s = await setup(), original = s.n.originalRaw
  s.n.originalRaw = s.raw
  expect(() => assertNotebookBackupFits(s.n, 'demo')).toThrow('Original JSON bytes')
  s.n.originalRaw = original; s.n.notes = 'x'.repeat(8 * 1024 * 1024)
  expect(() => assertNotebookBackupFits(s.n, 'demo')).toThrow('Full original/current/history/update backup JSON bytes')
  expect(s.n.history).toHaveLength(1); expect(s.n.notes.length).toBe(8 * 1024 * 1024)
})
it('preserves v2 originals byte-for-byte inside portable text-only bundles', async () => {
  const p = plainVisualFixture(), { assets: _assets, visualReview: _review, ...base } = p
  const raw = `${JSON.stringify({ ...base, version: 2, instructionsVersion: 'notebook-workflows-draft-2' }, null, 2)}\n`
  const decoded = await prepareNotebookBundle(await exportNotebookPackageBundle(raw, [], new MemoryNotebookAssets(), headerDecoder), headerDecoder)
  if (decoded.kind !== 'package') throw new Error('Expected package')
  expect(decoded.raw).toBe(raw); expect(decoded.package.version).toBe(2); expect(decoded.assets.bindings).toEqual([])
})

// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import { acceptNotebookUpdate, exportNotebook, importNotebook, inspectNotebookImport, restoreCompleteNotebookBackup, saveNotebookEdits } from './import'
import { canonical, prepareNotebook } from './package'
import { commitNotebookAssets } from './notebookAssetStore'
import { getPreparedAssetBytes, prepareNotebookAssets } from './visualAssets'
import { exportNotebookBackupBundle, prepareNotebookBundle } from './notebookBundle'
import { createNotebookUpdateSession, notebookContentKey } from './revision'
import { layoutNotebookDiagram } from './notebookDiagram'
import { parsePortableNotebook } from './visualPackage'
import { changedPngBlob, headerDecoder, MemoryNotebookAssets, plainVisualFixture, pngBlob, visualFixture } from './visual.test-fixtures'
import type { ClassCenterData } from '@/lib/types'
import type { NotebookStudyDiagramBlock } from './visualTypes'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))
const center = () => ({ lectures: [] }) as unknown as ClassCenterData
async function setup() {
  const pkg = visualFixture(), prepared = await prepareNotebook(JSON.stringify(pkg)), data = center(), course = { id: 'visual-test', ...pkg.course, term: pkg.course.term ?? undefined }, repo = new MemoryNotebookAssets()
  const assets = await prepareNotebookAssets(pkg, [{ name: pkg.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  let ids: string[] = []
  await commitNotebookAssets({ prepared: assets, repository: repo, lineageId: 'original-lineage', assertFresh: () => undefined, commit: () => { ids = importNotebook(data, course, prepared); return { committed: true } } })
  return { pkg, prepared, data, course, repo, assets, ids }
}
it('cannot save structurally valid v3 JSON without a live, validated binary stage', async () => {
  const p = await prepareNotebook(JSON.stringify(visualFixture())), data = center()
  expect(() => importNotebook(data, { id: 'test', code: p.package.course.code }, p)).toThrow('Validate and stage')
  expect(data.lectures).toEqual([])
})
it('rejects changed-byte duplicate JSON staged under a new lineage without touching the existing entry', async () => {
  const s = await setup(), before = canonical(s.data)
  const changed = await prepareNotebookAssets(s.pkg, [{ name: s.pkg.assets[0].fileName, blob: changedPngBlob() }], { decode: headerDecoder })
  await expect(commitNotebookAssets({ prepared: changed, repository: s.repo, lineageId: 'new-lineage', assertFresh: () => undefined, commit: () => { importNotebook(s.data, s.course, s.prepared); return { committed: true } } })).rejects.toThrow('already bound')
  expect(canonical(s.data)).toBe(before)
  await commitNotebookAssets({ prepared: s.assets, repository: s.repo, lineageId: 'original-lineage', assertFresh: () => undefined, commit: () => { expect(importNotebook(s.data, s.course, s.prepared)).toEqual(s.ids); return { committed: true } } })
  expect(canonical(s.data)).toBe(before)
})
it('recognizes an unchanged single-entry export after projection excludes another entry image', async () => {
  const pkg = visualFixture(), template = plainVisualFixture().entries[0], replacements = new Map<string, string>()
  function collect(value: unknown) { if (!value || typeof value !== 'object') return; if ('id' in value && typeof value.id === 'string') replacements.set(value.id, `second-${value.id}`); Object.values(value).forEach(collect) }
  function remap(value: unknown): unknown { return typeof value === 'string' ? replacements.get(value) ?? value : Array.isArray(value) ? value.map(remap) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remap(child)])) : value }
  collect(template); pkg.entries.push(remap(template) as typeof template)
  const p = await prepareNotebook(JSON.stringify(pkg)), data = center(), repo = new MemoryNotebookAssets(), course = { id: 'multi', ...pkg.course, term: pkg.course.term ?? undefined }, images = await prepareNotebookAssets(pkg, [{ name: pkg.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  await commitNotebookAssets({ prepared: images, repository: repo, lineageId: 'multi', assertFresh: () => undefined, commit: () => { importNotebook(data, course, p); return { committed: true } } })
  const target = data.lectures.find(l => l.importedNotebook?.entryId === pkg.entries[1].id)!, incoming = await prepareNotebook(exportNotebook(target, 'current'))
  expect(incoming.package.version === 3 && incoming.package.assets).toEqual([])
  expect(inspectNotebookImport(data, course.id, incoming)[0].duplicate?.id).toBe(target.id)
})
it('starts dependent practice fresh for a changed stimulus while preserving notes, independent records and history', async () => {
  const s = await setup(), lecture = s.data.lectures[0], n = lecture.importedNotebook!, entryId = n.entryId
  const question = s.pkg.entries[0].sections.flatMap(section => section.blocks).find(b => b.type === 'practice' && b.stimulusBlockIds?.length)!
  const independent = s.pkg.entries[0].sections.flatMap(section => section.blocks).find(b => b.type === 'practice' && b.id !== question.id)!
  n.notes = 'Protected notes'; n.progress = { [question.id]: { response: 'Earlier figure answer', complete: true }, [independent.id]: { response: 'Independent answer', complete: true } }
  const next = structuredClone(n.current), figure = next.entries[0].sections.flatMap(section => section.blocks).find(b => b.type === 'figure')!
  if (figure.type !== 'figure') throw new Error('Expected figure')
  figure.caption = 'Changed neutral setup caption'
  saveNotebookEdits(lecture, next, n.notes)
  const saved = lecture.importedNotebook!
  expect(saved.progress[question.id]).toBeUndefined(); expect(saved.progress[independent.id]?.response).toBe('Independent answer')
  expect(saved.notes).toBe('Protected notes'); expect(saved.history![0].progress[question.id].response).toBe('Earlier figure answer')
  expect(saved.entryId).toBe(entryId); expect(saved.assetBindings).toEqual(s.assets.bindings)
})
it('blocks v3-to-v2 updates and preserves a newer manual edit after the baseline was exported', async () => {
  const s = await setup(), n = s.data.lectures[0].importedNotebook!, session = n.updateSession = createNotebookUpdateSession(n, s.ids[0]), baseline = notebookContentKey(n)
  const proposal = structuredClone(s.pkg); proposal.entries[0].revision++; proposal.entries[0].baseRevision = 1
  n.current.entries[0].title = 'Newer manual edit'; const snapshot = canonical(s.data)
  const prepared = await prepareNotebook(JSON.stringify(proposal)), assets = await prepareNotebookAssets(proposal, [], { previousBindings: n.assetBindings, reader: s.repo, decode: headerDecoder })
  await expect(commitNotebookAssets({ prepared: assets, repository: s.repo, lineageId: 'original-lineage', retainedBindings: n.assetBindings, assertFresh: () => undefined, commit: () => { acceptNotebookUpdate(s.data, s.course, prepared, session, true); return { committed: true } } })).rejects.toThrow('Saved content changed')
  expect(canonical(s.data)).toBe(snapshot); expect(notebookContentKey(n)).not.toBe(baseline)
  const plain = plainVisualFixture(), { assets: _assets, visualReview: _review, ...base } = plain, old = await prepareNotebook(JSON.stringify({ ...base, version: 2, instructionsVersion: 'notebook-workflows-draft-2' }))
  expect(() => acceptNotebookUpdate(s.data, s.course, old, session, true)).toThrow('downgrade')
})
it('restores a complete personal-record backup into a fresh local store and dedupes the same backup', async () => {
  const s = await setup(), n = s.data.lectures[0].importedNotebook!
  n.notes = 'Personal note'; n.progress = { ['constructor']: { response: 'Legacy ID record', complete: true } }
  const edited = structuredClone(n.current); edited.entries[0].title = 'Edited visual notebook'; saveNotebookEdits(s.data.lectures[0], edited, n.notes)
  const saved = s.data.lectures[0].importedNotebook!; saved.updateSession = createNotebookUpdateSession(saved, s.ids[0])
  const bundle = await exportNotebookBackupBundle(saved, s.course.id, s.repo, headerDecoder), restored = await prepareNotebookBundle(bundle, headerDecoder)
  if (restored.kind !== 'backup') throw new Error('Expected complete backup')
  const fresh = center(), repo = new MemoryNotebookAssets(), original = await prepareNotebook(restored.notebook.originalRaw); let ids: string[] = []
  await commitNotebookAssets({ prepared: restored.assets, repository: repo, assertFresh: () => undefined, commit: () => { ids = restoreCompleteNotebookBackup(fresh, s.course, restored.notebook, original, true); return { committed: true } } })
  expect(fresh.lectures).toHaveLength(1); expect(fresh.lectures[0].importedNotebook!.notes).toBe('Personal note')
  expect(Object.entries(fresh.lectures[0].importedNotebook!.progress).find(([id]) => id === 'constructor')?.[1].response).toBe('Legacy ID record')
  expect(fresh.lectures[0].importedNotebook!.history).toEqual(saved.history); expect(fresh.lectures[0].importedNotebook!.originalRaw).toBe(saved.originalRaw)
  expect(fresh.lectures[0].importedNotebook!.updateSession!.localId).toBe(ids[0]); expect(repo.bytes.size).toBe(getPreparedAssetBytes(restored.assets).size)
  const current = fresh.lectures[0].importedNotebook!, before = canonical(fresh)
  await commitNotebookAssets({ prepared: restored.assets, repository: repo, lineageId: current.assetLineageId, retainedBindings: current.assetBindings, assertFresh: () => undefined, commit: () => { expect(restoreCompleteNotebookBackup(fresh, s.course, restored.notebook, original, true)).toEqual(ids); return { committed: true } } })
  expect(canonical(fresh)).toBe(before)
})
it('gives parallel schema-valid diagram connections distinct visible label positions', () => {
  const p = visualFixture(), diagram = p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'study-diagram') as NotebookStudyDiagramBlock
  diagram.edges.push({ ...diagram.edges[0], id: 'parallel', label: 'Also uses this response mapping' })
  expect(() => parsePortableNotebook(JSON.stringify(p))).not.toThrow()
  const layout = layoutNotebookDiagram(diagram)
  expect(new Set(layout.edges.map(e => `${e.labelX},${e.labelY}`)).size).toBe(2)
  expect(layout.edges.every(e => e.path.startsWith('M '))).toBe(true)
})

// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import type { ClassCenterData } from '@/lib/types'
import fixture from './visual-fixtures/valid-v4-repertoire.json'
import type { NotebookBlock, NotebookPackage } from './types'
import type { VisualNotebookPackage } from './visualTypes'
import { canonical, prepareNotebook } from './package'
import { acceptNotebookUpdate, exportNotebook, importNotebook, restoreCompleteNotebookBackup, restoreNotebookVersion, saveNotebookEdits } from './import'
import { commitNotebookAssets } from './notebookAssetStore'
import { prepareNotebookAssets } from './visualAssets'
import { exportNotebookBackupBundle, exportNotebookPackageBundle, prepareNotebookBundle } from './notebookBundle'
import { createNotebookUpdateSession, notebookStateKey } from './revision'
import { headerDecoder, MemoryNotebookAssets } from './visual.test-fixtures'
import { parsePortableNotebook } from './visualPackage'

vi.stubGlobal('crypto', webcrypto)
const center = () => ({ lectures: [] }) as unknown as ClassCenterData
function blocks(pkg: NotebookPackage) { return pkg.entries[0].sections.flatMap(section => section.blocks) }
function get<T extends NotebookBlock['type']>(pkg: NotebookPackage, type: T): Extract<NotebookBlock, { type: T }> {
  const found = blocks(pkg).find(block => block.type === type)
  if (!found) throw new Error(`Missing fixture ${type}`)
  return found as Extract<NotebookBlock, { type: T }>
}

it('preserves v3 edits, notes, independent practice, all history and exact image bytes through a same-entry v4 update, edit, backup reload and explicit v3 restore', async () => {
  const next = structuredClone(fixture) as VisualNotebookPackage
  const independent = structuredClone(get(next, 'practice'))
  independent.id = 'independent-question'; independent.stimulusBlockIds = []
  independent.sourceIds = ['independent-source']; independent.excerptIds = ['independent-excerpt']; independent.assetIds = []
  independent.prompt = 'What label is named in the independent authored passage?'
  independent.answer = 'BLUE'; independent.rationale = 'The independent authored passage names BLUE.'
  next.sources.push({ ...structuredClone(next.sources[0]), id: 'independent-source', title: 'Independent authored test passage', inspected: 'Only the independent authored test passage.', used: true, excerpts: [{ id: 'independent-excerpt', location: 'Authored test passage', text: 'The independent demonstration label is BLUE.' }] })
  next.visualReview.sources.push({ sourceId: 'independent-source', discovery: 'complete', imageState: 'none-found', inspectedPortions: ['Entire independent authored test passage'], unprocessedPortions: [], limitations: [] })
  next.entries[0].sections.push({ ...structuredClone(next.entries[0].sections.at(-1)!), id: 'independent-section', title: 'Independent authored check', blocks: [
    { id: 'independent-teaching', type: 'paragraph', text: 'The independent demonstration label is BLUE.', provenance: 'source', sourceIds: independent.sourceIds, excerptIds: independent.excerptIds, assetIds: [] }, independent,
  ] })
  const baseline = { ...structuredClone(next), version: 3 as const, instructionsVersion: 'notebook-workflows-draft-3' as const }
  for (const section of baseline.entries[0].sections) section.blocks = section.blocks.map(block => {
    if (block.type === 'study-diagram') return { ...block, kind: 'flowchart' as const }
    if (block.type === 'annotated-figure') {
      const { annotations: _annotations, title: _title, ...figure } = block
      return { ...figure, type: 'figure' as const }
    }
    if (['timeline', 'continuum', 'venn', 'sequence-strip', 'worked-example'].includes(block.type)) return {
      id: block.id, type: 'paragraph' as const, text: 'Earlier authored demonstration placeholder; this is not empirical teaching.',
      provenance: block.provenance, sourceIds: block.sourceIds, excerptIds: block.excerptIds, assetIds: block.assetIds,
    }
    return block
  })
  const prepared = await prepareNotebook(JSON.stringify(baseline)), data = center()
  const course = { id: 'v4-lifecycle-demo', ...baseline.course, term: baseline.course.term ?? undefined }
  const repo = new MemoryNotebookAssets()
  const bytes = readFileSync(new URL('./visual-fixtures/authored-classroom-task.png', import.meta.url))
  const image = new Blob([new Uint8Array(bytes)], { type: 'image/png' })
  const assets = await prepareNotebookAssets(baseline, [{ name: baseline.assets[0].fileName, blob: image }], { decode: headerDecoder })
  await commitNotebookAssets({ prepared: assets, repository: repo, lineageId: 'v4-lifecycle-image', assertFresh: () => undefined, commit: () => { importNotebook(data, course, prepared); return { committed: true } } })
  const localId = data.lectures[0].id, originalRaw = data.lectures[0].importedNotebook!.originalRaw
  const edited = structuredClone(data.lectures[0].importedNotebook!.current)
  edited.entries[0].title = 'Lesson 1 - Authored visual demonstration with my saved edit'
  get(edited, 'figure').caption = 'My saved neutral caption'
  saveNotebookEdits(data.lectures[0], edited, 'Keep my personal note exactly.')
  const before = data.lectures[0].importedNotebook!
  before.progress = { 'source-question': { response: 'My earlier image response', complete: true }, 'independent-question': { response: 'My independent response', complete: true } }
  const priorCurrent = canonical(before.current), priorHistory = structuredClone(before.history), priorProgress = structuredClone(before.progress)
  const session = before.updateSession = createNotebookUpdateSession(before, localId)
  next.entries[0].title = before.current.entries[0].title
  next.entries[0].revision = before.current.entries[0].revision + 1
  next.entries[0].baseRevision = before.current.entries[0].revision
  get(next, 'annotated-figure').caption = get(before.current, 'figure').caption
  const update = await prepareNotebook(JSON.stringify(next))
  const nextAssets = await prepareNotebookAssets(next, [], { previousBindings: before.assetBindings, reader: repo, decode: headerDecoder })
  await commitNotebookAssets({ prepared: nextAssets, repository: repo, lineageId: before.assetLineageId, retainedBindings: before.assetBindings, assertFresh: () => undefined, commit: () => { expect(acceptNotebookUpdate(data, course, update, session, true)).toEqual([localId]); return { committed: true } } })
  const saved = data.lectures[0].importedNotebook!
  expect(data.lectures).toHaveLength(1); expect(saved.current.version).toBe(4)
  expect(saved.originalRaw).toBe(originalRaw); expect(saved.notes).toBe('Keep my personal note exactly.')
  expect(saved.current.entries[0].title).toBe(edited.entries[0].title)
  expect(get(saved.current, 'annotated-figure').caption).toBe('My saved neutral caption')
  expect(saved.progress['source-question']).toBeUndefined()
  expect(saved.progress['independent-question']).toEqual(priorProgress['independent-question'])
  for (const historical of priorHistory ?? []) expect(saved.history!.find(version => version.id === historical.id)).toEqual(historical)
  const retainedV3 = saved.history!.find(version => canonical(version.current) === priorCurrent)!
  expect(retainedV3.progress).toEqual(priorProgress); expect(saved.assetBindings).toEqual(assets.bindings)
  const cleared = structuredClone(saved.current)
  get(cleared, 'annotated-figure').caption = null
  get(cleared, 'timeline').events[0].timeLabel = null
  get(cleared, 'worked-example').check = null
  saveNotebookEdits(data.lectures[0], cleared, saved.notes)
  const afterEdit = data.lectures[0].importedNotebook!
  const exported = await prepareNotebookBundle(await exportNotebookPackageBundle(exportNotebook(data.lectures[0], 'current'), afterEdit.assetBindings!, repo, headerDecoder), headerDecoder)
  if (exported.kind !== 'package') throw new Error('Expected current package')
  const reloadedPackage = parsePortableNotebook(exportNotebook(data.lectures[0], 'current'))
  expect(get(reloadedPackage, 'annotated-figure').caption).toBeNull()
  expect(get(reloadedPackage, 'timeline').events[0].timeLabel).toBeNull()
  expect(get(reloadedPackage, 'worked-example').check).toBeNull()
  const backup = await prepareNotebookBundle(await exportNotebookBackupBundle(afterEdit, course.id, repo, headerDecoder), headerDecoder)
  if (backup.kind !== 'backup') throw new Error('Expected complete backup')
  const fresh = center(), restoredRepo = new MemoryNotebookAssets(), original = await prepareNotebook(backup.notebook.originalRaw)
  await commitNotebookAssets({ prepared: backup.assets, repository: restoredRepo, assertFresh: () => undefined, commit: () => { restoreCompleteNotebookBackup(fresh, course, backup.notebook, original, true); return { committed: true } } })
  const restored = fresh.lectures[0].importedNotebook!
  expect(restored.current).toEqual(afterEdit.current); expect(restored.history).toEqual(afterEdit.history)
  expect(restored.progress).toEqual(afterEdit.progress); expect(restored.notes).toBe(afterEdit.notes)
  expect(restored.originalRaw).toBe(originalRaw); expect(restored.assetBindings).toEqual(assets.bindings)
  const retainedImage = await restoredRepo.read(assets.bindings[0].sha256)
  expect(new Uint8Array(await retainedImage!.arrayBuffer())).toEqual(new Uint8Array(bytes))
  restoreNotebookVersion(fresh.lectures[0], retainedV3.id, notebookStateKey(restored))
  const recovered = fresh.lectures[0].importedNotebook!
  expect(recovered.current.version).toBe(3); expect(canonical(recovered.current)).toBe(priorCurrent)
  expect(recovered.progress).toEqual(priorProgress); expect(recovered.notes).toBe('Keep my personal note exactly.')
  expect(recovered.history!.some(version => canonical(version.current) === canonical(afterEdit.current))).toBe(true)
})

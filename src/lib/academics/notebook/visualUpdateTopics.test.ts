// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { expect, it, vi } from 'vitest'
import { canonical, prepareNotebook, parseNotebookPackage } from './package'
import { importNotebook, acceptNotebookUpdate, exportNotebook } from './import'
import { createNotebookUpdateSession } from './revision'
import { commitNotebookAssets } from './notebookAssetStore'
import { prepareNotebookAssets } from './visualAssets'
import { exportNotebookBackupBundle, prepareNotebookBundle } from './notebookBundle'
import { visualFixture, plainVisualFixture, pngBlob, headerDecoder, MemoryNotebookAssets } from './visual.test-fixtures'
import type { ClassCenterData } from '@/lib/types'

vi.stubGlobal('crypto', webcrypto)

it.each(['text-only', 'visual'] as const)('atomically accepts a complete visual update and a new %s topic without widening the asset grant', async kind => {
  const pkg = visualFixture(), prepared = await prepareNotebook(JSON.stringify(pkg)), center = { lectures: [] } as unknown as ClassCenterData
  const course = { id: 'qa', code: pkg.course.code, title: pkg.course.title, term: pkg.course.term ?? undefined }, repo = new MemoryNotebookAssets()
  const assets = await prepareNotebookAssets(pkg, [{ name: pkg.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  await commitNotebookAssets({ prepared: assets, repository: repo, lineageId: 'update-topic-lineage', assertFresh: () => undefined, commit: () => { importNotebook(center, course, prepared); return { committed: true } } })
  const originalId = center.lectures[0].id, n = center.lectures[0].importedNotebook!, session = createNotebookUpdateSession(n, originalId)
  n.updateSession = session; n.notes = 'Keep the original personal note'
  const proposal = structuredClone(pkg)
  proposal.entries[0].revision = 2; proposal.entries[0].baseRevision = 1; proposal.entries[0].title += ' revised'
  const template = (kind === 'visual' ? visualFixture() : plainVisualFixture()).entries[0], ids = new Map<string, string>()
  const collect = (value: unknown) => { if (!value || typeof value !== 'object') return; if ('id' in value && typeof value.id === 'string') ids.set(value.id, `new-topic-${value.id}`); Object.values(value).forEach(collect) }
  collect(template)
  const remap = (value: unknown): unknown => typeof value === 'string' ? ids.get(value) ?? value : Array.isArray(value) ? value.map(remap) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remap(child)])) : value
  const extra = remap(template) as typeof template
  extra.revision = 1; extra.baseRevision = null; proposal.entries.push(extra)
  const raw = JSON.stringify(proposal, null, 2), incoming = await prepareNotebook(raw)
  const nextAssets = await prepareNotebookAssets(proposal, [{ name: pkg.assets[0].fileName, blob: pngBlob() }], { decode: headerDecoder })
  const before = canonical(center)
  expect(() => acceptNotebookUpdate(center, course, incoming, session, true)).toThrow('Validate and stage')
  expect(canonical(center)).toBe(before)
  let accepted: string[] = []
  const accept = () => commitNotebookAssets({ prepared: nextAssets, repository: repo, lineageId: 'update-topic-lineage', retainedBindings: n.assetBindings, assertFresh: () => undefined, commit: () => { accepted = acceptNotebookUpdate(center, course, incoming, session, true); return { committed: true } } })
  await accept()
  expect(accepted[0]).toBe(originalId); expect(accepted).toHaveLength(2); expect(center.lectures).toHaveLength(2)
  const target = center.lectures.find(l => l.id === originalId)!.importedNotebook!, added = center.lectures.find(l => l.id === accepted[1])!
  expect(target.current.entries[0].revision).toBe(2); expect(target.acceptedRaw).toBe(raw)
  expect(target.originalRaw).toBe(prepared.raw); expect(target.notes).toBe('Keep the original personal note'); expect(target.history).toHaveLength(1)
  expect(target.updateSession).toBeUndefined(); expect(added.importedNotebook!.entryId).toBe(extra.id)
  expect(added.importedNotebook!.originalRaw).toBe(raw); expect(added.importedNotebook!.original).toEqual(proposal)
  const projected = parseNotebookPackage(exportNotebook(added, 'current'))
  expect(projected.entries.map(e => e.id)).toEqual([extra.id])
  if (projected.version !== 3) throw new Error('Expected visual contract')
  expect(projected.assets).toHaveLength(kind === 'visual' ? 1 : 0)
  expect(projected.visualReview.candidates).toHaveLength(proposal.visualReview.candidates.length)
  const bundle = await exportNotebookBackupBundle(added.importedNotebook!, course.id, repo, headerDecoder), restored = await prepareNotebookBundle(bundle, headerDecoder)
  if (restored.kind !== 'backup') throw new Error('Expected complete backup')
  expect(restored.notebook.originalRaw).toBe(raw)
  const after = canonical(center); await accept(); expect(canonical(center)).toBe(after)
})

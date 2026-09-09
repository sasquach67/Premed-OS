// @vitest-environment node
import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import fixtureJson from './visual-fixtures/valid-v4-repertoire.json'
import { NotebookValidationError, parseNotebookPackage, prepareNotebook } from './package'
import { learningAxisPositions } from './learningVisuals'
import { collectReaderEvidence } from './readerPresentation'
import { notebookEntryAssetIds, notebookVisualPracticeKey, projectNotebookEntry } from './visualProjection'
import { notebookPracticePolicy } from './revision'
import { exportNotebookPackageBundle, prepareNotebookBundle } from './notebookBundle'
import { getPreparedAssetBytes, prepareNotebookAssets } from './visualAssets'
import { headerDecoder, MemoryNotebookAssets, plainVisualFixture } from './visual.test-fixtures'
import type { NotebookBlock } from './types'
import type { VisualNotebookPackage } from './visualTypes'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))
const fixture = () => structuredClone(fixtureJson) as unknown as VisualNotebookPackage
function block<T extends NotebookBlock['type']>(pkg: VisualNotebookPackage, id: string, type: T): Extract<NotebookBlock, { type: T }> {
  const item = pkg.entries[0].sections.flatMap(section => section.blocks).find(item => item.id === id)
  if (item?.type !== type) throw new Error(`Expected fixture ${id} to be ${type}`)
  return item as Extract<NotebookBlock, { type: T }>
}

it('accepts the exact corrected all-family v4 fixture and preserves its complete object and asset closure', () => {
  const p = fixture()
  expect(parseNotebookPackage(JSON.stringify(p))).toEqual(p)
  expect(projectNotebookEntry(p, p.entries[0].id)).toEqual(p)
  expect([...notebookEntryAssetIds(p, p.entries[0].id)]).toEqual(['source-image'])
  expect(parseNotebookPackage(JSON.stringify(plainVisualFixture())).version).toBe(3)
})

it('accepts optional empty parent assetIds without inventing missing arrays in current JSON', () => {
  const p = fixture()
  for (const item of p.entries[0].sections.flatMap(section => section.blocks)) if (!item.assetIds?.length) delete item.assetIds
  expect(parseNotebookPackage(JSON.stringify(p))).toEqual(p)
})

const invalid: [string, (p: VisualNotebookPackage) => void][] = [
  ['out-of-image annotation', p => { block(p, 'label-source-image', 'annotated-figure').annotations[0].x = 1.01 }],
  ['annotation missing exact image evidence', p => { block(p, 'label-source-image', 'annotated-figure').annotations[0].assetIds = [] }],
  ['annotation invented position basis', p => { block(p, 'label-source-image', 'annotated-figure').annotations[0].positionBasis = ' ' }],
  ['ordinal timeline with numeric coordinates', p => { block(p, 'schedule-ordinal', 'timeline').events[0].value = 0 }],
  ['ordinal continuum with units', p => { block(p, 'readiness-scale', 'continuum').axis.unit = 'points' }],
  ['numeric timeline missing unit', p => { block(p, 'schedule-numeric', 'timeline').axis.unit = null }],
  ['degenerate numeric domain', p => { block(p, 'test-score-scale', 'continuum').axis.maximum = 0 }],
  ['out-of-domain value', p => { block(p, 'test-score-scale', 'continuum').points[0].value = -1 }],
  ['descending chronology', p => { block(p, 'schedule-numeric', 'timeline').events.reverse() }],
  ['descending scale', p => { block(p, 'test-score-scale', 'continuum').points.reverse() }],
  ['finite endpoints with infinite span', p => { const axis = block(p, 'schedule-numeric', 'timeline').axis; axis.minimum = -1e308; axis.maximum = 1e308 }],
  ['missing worked problem evidence', p => { block(p, 'elapsed-worked', 'worked-example').problemEvidence = { sourceIds: [], excerptIds: [], assetIds: [] } }],
  ['solution step escaping solution evidence', p => { block(p, 'elapsed-worked', 'worked-example').solutionEvidence.excerptIds = ['ref-6'] }],
  ['worked answer as initial stimulus', p => { block(p, 'source-question', 'practice').stimulusBlockIds = ['elapsed-worked'] }],
  ['timeline as initial stimulus', p => { block(p, 'source-question', 'practice').stimulusBlockIds = ['schedule-numeric'] }],
  ['indirect worked solution stimulus', p => { block(p, 'elapsed-worked', 'worked-example').stimulusBlockIds = ['source-question'] }],
  ['duplicate Venn membership', p => { const venn = block(p, 'card-membership', 'venn'); venn.regions[1].setIds = [...venn.regions[0].setIds] }],
  ['empty decorative Venn overlap', p => { block(p, 'card-membership', 'venn').regions.find(region => region.setIds.length === 2)!.items = [] }],
  ['unknown Venn set', p => { block(p, 'card-membership', 'venn').regions[0].setIds = ['missing-set'] }],
  ['sequence image without alt', p => { block(p, 'task-strip', 'sequence-strip').steps.find(step => step.assetId)!.alt = null }],
  ['sequence text-only with image alt', p => { block(p, 'task-strip', 'sequence-strip').steps[0].alt = 'Invented image' }],
  ['blank sequence detail', p => { block(p, 'task-strip', 'sequence-strip').steps[0].detail = ' ' }],
  ['causal chain using sequence', p => { block(p, 'access-chain', 'study-diagram').edges[0].relation = 'sequence' }],
  ['hierarchy using causality', p => { block(p, 'collection-tree', 'study-diagram').edges[0].relation = 'causes' }],
  ['tree with self loop', p => { const diagram = block(p, 'route-card', 'study-diagram'); diagram.edges[0].to = diagram.edges[0].from }],
  ['repeated decision condition', p => { const diagram = block(p, 'route-card', 'study-diagram'); diagram.edges[1].label = diagram.edges[0].label }],
]
it.each(invalid)('rejects %s with a normal validation error', (_, change) => {
  const p = fixture(); change(p)
  expect(() => parseNotebookPackage(JSON.stringify(p))).toThrow(NotebookValidationError)
})

it.each(['timeline', 'continuum'] as const)('rejects serialized huge numeric tokens and integer-span overflow in %s', family => {
  const p = fixture(), item = family === 'timeline' ? block(p, 'schedule-numeric', 'timeline') : block(p, 'test-score-scale', 'continuum')
  item.axis.maximum = 987654321
  const huge = JSON.stringify(p).replace('987654321', '1' + '0'.repeat(400))
  expect(() => parseNotebookPackage(huge)).toThrow('finite')
  item.axis.minimum = -987654321; item.axis.maximum = 987654321
  const span = JSON.stringify(p).replace('-987654321', '-1' + '0'.repeat(308)).replace('987654321', '1' + '0'.repeat(308))
  expect(() => parseNotebookPackage(span)).toThrow('finite')
})

it('uses actual unequal numeric spacing while giving equal values separate label lanes', () => {
  const p = fixture(), timeline = block(p, 'schedule-numeric', 'timeline')
  const positions = learningAxisPositions(timeline.axis, timeline.events)
  expect(positions.map(point => point.fraction)).toEqual([0, .4, 1])
  timeline.events[1].value = timeline.events[0].value
  expect(parseNotebookPackage(JSON.stringify(p))).toEqual(p)
  const tied = learningAxisPositions(timeline.axis, timeline.events)
  expect(tied[0].fraction).toBe(tied[1].fraction)
  expect(tied[0].lane).not.toBe(tied[1].lane)
})

it('keeps all worked solution evidence out of initial section summaries and neutral source-figure evidence free of the corrected leak', () => {
  const p = fixture(), worked = block(p, 'elapsed-worked', 'worked-example'), annotation = block(p, 'label-source-image', 'annotated-figure')
  expect(collectReaderEvidence([worked], p, 'section')).toEqual([])
  expect(collectReaderEvidence([worked], p, 'item').flatMap(source => source.excerpts).some(excerpt => excerpt.id === 'ref-9')).toBe(true)
  expect(collectReaderEvidence([annotation], p, 'section').flatMap(source => source.excerpts).map(excerpt => excerpt.text).join('\n')).not.toMatch(/correct response is LEFT/)
})

it('includes edited annotations and nested sequence assets in dependency and closure checks, keeping reset consistent', () => {
  const before = fixture(), after = fixture(), entry = before.entries[0]
  block(after, 'label-source-image', 'annotated-figure').annotations[0].label += ' (student clarification)'
  expect(notebookVisualPracticeKey(before, entry.id, 'source-question')).not.toBe(notebookVisualPracticeKey(after, entry.id, 'source-question'))
  const policy = notebookPracticePolicy(before, after, entry.id)
  expect(policy.affectedIds).toContain('source-question')
  expect(policy.reset).toBe(true)
  expect([...notebookEntryAssetIds(after, entry.id)]).toContain('source-image')
})

it('round-trips the corrected v4 package with exact actual image bytes through the app portable exporter', async () => {
  const p = fixture(), raw = JSON.stringify(p), prepared = await prepareNotebook(raw)
  const bytes = readFileSync(new URL('./visual-fixtures/authored-classroom-task.png', import.meta.url))
  const image = new Blob([bytes], { type: 'image/png' })
  const assets = await prepareNotebookAssets(prepared.package, [{ name: p.assets[0].fileName, blob: image }], { decode: headerDecoder })
  const repo = new MemoryNotebookAssets()
  for (const [sha, blob] of getPreparedAssetBytes(assets)) repo.bytes.set(sha, blob)
  const zip = await exportNotebookPackageBundle(raw, assets.bindings, repo, headerDecoder)
  const restored = await prepareNotebookBundle(zip, headerDecoder)
  expect(restored.kind).toBe('package')
  if (restored.kind !== 'package') throw new Error('Expected notebook package')
  expect(restored.raw).toBe(raw)
  expect(restored.package).toEqual(p)
  expect(restored.assets.bindings).toEqual(assets.bindings)
  expect(new Uint8Array(await getPreparedAssetBytes(restored.assets).get(assets.bindings[0].sha256)!.arrayBuffer())).toEqual(new Uint8Array(bytes))
})

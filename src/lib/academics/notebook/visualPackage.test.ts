// @vitest-environment node
import { expect, it } from 'vitest'
import legacy from './revision-fixtures/baseline-current.json'
import { parseNotebookPackage } from './package'
import { parsePortableNotebook } from './visualPackage'
import { missingPracticeImages, notebookVisualPracticeKey, projectNotebookEntry } from './visualProjection'
import { plainVisualFixture, visualFixture } from './visual.test-fixtures'
import type { NotebookFigureBlock, NotebookStudyDiagramBlock, VisualNotebookPackage } from './visualTypes'

const figure = (p: VisualNotebookPackage) => p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'figure') as NotebookFigureBlock
const diagram = (p: VisualNotebookPackage) => p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'study-diagram') as NotebookStudyDiagramBlock
const practice = (p: VisualNotebookPackage) => p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice' && b.stimulusBlockIds?.length)!
it('keeps exact v2 parsing and separately accepts frozen v3 text and visual fixtures', () => {
  const raw = JSON.stringify(legacy)
  expect(parsePortableNotebook(raw)).toEqual(parseNotebookPackage(raw))
  expect(parsePortableNotebook(JSON.stringify(plainVisualFixture())).version).toBe(3)
  expect(parsePortableNotebook(JSON.stringify(visualFixture()))).toEqual(visualFixture())
  expect(() => parseNotebookPackage(JSON.stringify(visualFixture()))).toThrow()
})
const mutations: [string, (p: VisualNotebookPackage) => void][] = [
  ['source review missing', p => { p.visualReview.sources = [] }],
  ['asset missing', p => { p.assets = [] }],
  ['duplicate asset', p => { p.assets.push({ ...p.assets[0] }) }],
  ['path filename', p => { p.assets[0].fileName = '../question.png' }],
  ['URL filename', p => { p.assets[0].fileName = 'https://example.invalid/question.png' }],
  ['raw SVG field', p => { Object.assign(diagram(p), { svg: '<svg />' }) }],
  ['arbitrary layout', p => { Object.assign(diagram(p).nodes[0], { x: 3 }) }],
  ['AI hash', p => { Object.assign(p.assets[0], { sha256: 'fake' }) }],
  ['SVG mime', p => { Object.assign(p.assets[0], { mimeType: 'image/svg+xml' }) }],
  ['wrong asset source', p => { p.assets[0].sourceId = 'absent' }],
  ['wrong asset owner', p => { figure(p).sourceIds = [] }],
  ['derivative without alteration', p => { p.assets[0].originalAssetId = 'parent' }],
  ['derivative without original', p => { p.assets[0].originalAssetId = 'parent'; p.assets[0].alteration = 'Crop' }],
  ['derivative cycle', p => { p.assets[0].originalAssetId = p.assets[0].id; p.assets[0].alteration = 'Crop' }],
  ['selected but uninspected', p => { p.visualReview.candidates[0].inspection = 'not-inspected' }],
  ['inspected but undiscovered', p => { p.visualReview.candidates[0].discovered = false }],
  ['false sweep complete', p => { p.visualReview.sources[0].unprocessedPortions = ['Remaining pages'] }],
  ['false no images', p => { p.visualReview.sources[0].imageState = 'none-found' }],
  ['unresolved without next step', p => { Object.assign(p.visualReview.candidates[0], { decision: 'pending', assetId: null, nextStep: null }) }],
  ['unclosed candidate relation', p => { p.visualReview.candidates[0].duplicateOf = 'absent' }],
  ['candidate self cycle', p => { p.visualReview.candidates[0].changedFrom = p.visualReview.candidates[0].id }],
  ['unclosed stimulus', p => { Object.assign(practice(p), { stimulusBlockIds: ['absent'] }) }],
  ['practice as stimulus', p => { const b = practice(p); Object.assign(b, { stimulusBlockIds: [b.id] }) }],
  ['whole section as stimulus', p => { Object.assign(practice(p), { stimulusBlockIds: [p.entries[0].sections[0].id] }) }],
  ['unclosed diagram endpoint', p => { diagram(p).edges[0].to = 'absent' }],
  ['diagram without node evidence', p => { Object.assign(diagram(p).nodes[0], { sourceIds: [], excerptIds: [], assetIds: [] }) }],
  ['diagram evidence outside envelope', p => { diagram(p).assetIds = []; diagram(p).nodes[0].assetIds = [p.assets[0].id] }],
  ['too many diagram nodes', p => { diagram(p).nodes = Array.from({ length: 41 }, (_, i) => ({ ...diagram(p).nodes[0], id: `n${i}` })) }],
  ['duplicate visual evidence', p => { figure(p).assetIds = [p.assets[0].id, p.assets[0].id] }],
]
it.each(mutations)('rejects %s without modifying the package', (_, mutate) => {
  const p = visualFixture(); mutate(p); const raw = JSON.stringify(p)
  expect(() => parsePortableNotebook(raw)).toThrow(); expect(JSON.stringify(p)).toBe(raw)
})
it('rejects duplicate JSON fields before last-key-wins parsing', () => {
  const raw = JSON.stringify(visualFixture()).replace('"version":3', '"version":2,"version":3')
  expect(() => parsePortableNotebook(raw)).toThrow('Duplicate field')
})
it('retains original asset bytes as derivative dependencies and detects their absence for practice', () => {
  const p = visualFixture(), original = { ...p.assets[0], id: 'original-figure', fileName: 'original.png' }
  p.assets[0].originalAssetId = original.id; p.assets[0].alteration = 'Reviewed crop of authored figure'; p.assets.push(original)
  p.visualReview.candidates.push({ ...p.visualReview.candidates[0], id: 'original-candidate', assetId: original.id })
  expect(() => parsePortableNotebook(JSON.stringify(p))).not.toThrow()
  expect(projectNotebookEntry(p, p.entries[0].id).version).toBe(3)
  expect(missingPracticeImages(p, p.entries[0].id, practice(p).id, new Set([p.assets[0].id]))).toEqual(['original-figure'])
})
it('projects one entry with closed assets while preserving every source-review and candidate relation', () => {
  const p = visualFixture(), a = { ...p.assets[0], id: 'other-asset', fileName: 'other.png' }, sourceId = a.sourceId
  p.assets.push(a); p.visualReview.candidates.push({ ...p.visualReview.candidates[0], id: 'other-candidate', assetId: a.id, duplicateOf: p.visualReview.candidates[0].id })
  p.entries.push({ ...structuredClone(p.entries[0]), id: 'other-entry', goal: 'assignment', objectives: [], sections: [{ id: 'other-section', title: 'Other topic', purpose: 'workspace', blocks: [{ ...figure(p), id: 'other-figure', assetId: a.id }] }], requirements: [{ id: 'other-requirement', kind: 'student-request', text: 'Study other topic', authority: 'student-request', status: 'supported', sourceIds: [sourceId], excerptIds: [], assetIds: [a.id], basis: 'Authored test', sectionIds: ['other-section'], nextStep: null }] })
  const raw = JSON.stringify(p), projected = projectNotebookEntry(p, p.entries[0].id)
  if (projected.version !== 3) throw new Error('Expected v3')
  expect(projected.assets.map(a => a.id)).toEqual([p.assets[0].id]); expect(projected.visualReview.sources).toEqual(p.visualReview.sources)
  expect(projected.visualReview.candidates[1]).toMatchObject({ decision: 'skipped', assetId: null, duplicateOf: p.visualReview.candidates[0].id, inspection: 'inspected' })
  expect(projected.visualReview.candidates[1].reason).toContain('original package selected asset other-asset')
  expect(JSON.stringify(p)).toBe(raw); expect(() => parsePortableNotebook(JSON.stringify(projected))).not.toThrow()
})
it('tracks stimulus figure/caption/alt/context and diagram relationships, without resetting for unrelated titles', () => {
  const before = visualFixture(), id = before.entries[0].id, question = practice(before).id, key = notebookVisualPracticeKey(before, id, question)
  const after = structuredClone(before); after.entries[0].title = 'My title'
  expect(notebookVisualPracticeKey(after, id, question)).toBe(key)
  figure(after).caption += ' Changed setup'; expect(notebookVisualPracticeKey(after, id, question)).not.toBe(key)
  Object.assign(practice(before), { stimulusBlockIds: [diagram(before).id] }); const diagramKey = notebookVisualPracticeKey(before, id, question)
  diagram(before).edges[0].label = 'May be associated with'
  expect(notebookVisualPracticeKey(before, id, question)).not.toBe(diagramKey)
  expect(missingPracticeImages(after, id, question, new Set())).toEqual([after.assets[0].id])
})

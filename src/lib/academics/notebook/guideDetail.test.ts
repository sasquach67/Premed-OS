// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import type { ClassCenterData } from '@/lib/types'
import { revisionFixture } from './revision.test-fixtures'
import type { NotebookBlock, NotebookPackage } from './types'
import { parseNotebookPackage, prepareNotebook } from './package'
import { exportNotebook, importNotebook, saveNotebookEdits } from './import'
import { commitNotebookAssets } from './notebookAssetStore'
import { prepareNotebookAssets } from './visualAssets'
import { MemoryNotebookAssets } from './visual.test-fixtures'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))
function fixture(): NotebookPackage {
  const p = revisionFixture()
  return { ...p, version: 4, instructionsVersion: 'notebook-workflows-draft-4', assets: [], visualReview: { candidates: [], sources: p.sources.map(s => ({ sourceId: s.id, discovery: 'complete', imageState: 'none-found', inspectedPortions: ['Entire fictional test passage'], unprocessedPortions: [], limitations: [] })) } }
}
function detailBlock(p: NotebookPackage, type: 'paragraph' | 'bullets') {
  const original = p.entries[0].sections[0].blocks[0]
  const block: NotebookBlock = type === 'paragraph' ? { ...original, type, text: 'A triangle means choose left.' } : { ...original, type, items: ['A triangle means choose left.'] }
  if ('text' in block && type === 'bullets') delete (block as unknown as { text?: string }).text
  p.entries[0].sections[0].blocks[0] = block
  return block as Extract<NotebookBlock, { type: 'paragraph' | 'bullets' }>
}
it.each(['paragraph', 'bullets'] as const)('preserves optional, null, and meaningful %s detail without normalizing it', type => {
  const p = fixture(), b = detailBlock(p, type)
  for (const more of [undefined, null, '  The fictional mapping is a rule, not a direction inferred from the shape.\nUse that rule.  ']) {
    if (more === undefined) delete b.more; else b.more = more
    expect(parseNotebookPackage(JSON.stringify(p))).toEqual(p)
  }
})
it.each(['paragraph', 'bullets'] as const)('rejects malformed %s detail and keeps older contracts exact', type => {
  const p = fixture(), b = detailBlock(p, type)
  for (const more of ['', ' ', '\t', '\n', ' \n\t', '\u00a0', 'x'.repeat(1201), 42, ['nested detail'], { more: 'nested' }]) {
    Object.assign(b, { more })
    expect(() => parseNotebookPackage(JSON.stringify(p))).toThrow(/more/)
  }
  b.more = 'A supported explanation.'
  const v3 = { ...p, version: 3, instructionsVersion: 'notebook-workflows-draft-3' }
  expect(() => parseNotebookPackage(JSON.stringify(v3))).toThrow(/more/)
  delete b.more
  expect(parseNotebookPackage(JSON.stringify(v3))).toEqual(v3)
  const v2 = revisionFixture(), legacyBlock = detailBlock(v2, type)
  expect(parseNotebookPackage(JSON.stringify(v2))).toEqual(v2)
  legacyBlock.more = 'This field belongs only to v4.'
  expect(() => parseNotebookPackage(JSON.stringify(v2))).toThrow(/more/)
})
it('does not extend steps or tables with detail', () => {
  const p = fixture(), b = p.entries[0].sections[0].blocks[0]
  for (const replacement of [{ ...b, type: 'steps', items: ['First step'], more: 'Extra' }, { ...b, type: 'table', columns: ['Label'], rows: [['Value']], more: 'Extra' }]) {
    delete (replacement as { text?: string }).text
    p.entries[0].sections[0].blocks[0] = replacement as NotebookBlock
    expect(() => parseNotebookPackage(JSON.stringify(p))).toThrow(/more/)
  }
})
it('retains detail through import, edits, history and current/original export without changing notes or progress', async () => {
  const p = fixture(); detailBlock(p, 'bullets').more = 'Keep the fictional rule in mind.'
  const prepared = await prepareNotebook(JSON.stringify(p)), center = { lectures: [] } as unknown as ClassCenterData
  const repo = new MemoryNotebookAssets()
  await commitNotebookAssets({ prepared: await prepareNotebookAssets(p, []), repository: repo, assertFresh: () => undefined, commit: () => { importNotebook(center, { id: 'demo', code: p.course.code }, prepared); return { committed: true } } })
  const lecture = center.lectures[0], n = lecture.importedNotebook!
  n.notes = 'My note'; n.progress = { 'question-timing': { response: '100 milliseconds', complete: true } }
  const edited = structuredClone(n.current)
  detailBlock(edited, 'bullets').more = 'Edited explanation with the same fictional mapping.'
  saveNotebookEdits(lecture, edited, n.notes)
  const saved = lecture.importedNotebook!
  expect(parseNotebookPackage(exportNotebook(lecture, 'current'))).toEqual(edited)
  expect(parseNotebookPackage(exportNotebook(lecture, 'original'))).toEqual(p)
  expect(saved.history?.some(h => JSON.stringify(h.current) === JSON.stringify(p))).toBe(true)
  expect(saved.notes).toBe('My note')
  expect(saved.progress['question-timing']).toEqual({ response: '100 milliseconds', complete: true })
})

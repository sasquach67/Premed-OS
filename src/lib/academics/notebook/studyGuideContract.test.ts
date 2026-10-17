// @vitest-environment node
import { expect, it } from 'vitest'
import { visualFixture } from './visual.test-fixtures'
import { parseNotebookPackage } from './package'
import type { NotebookBlock } from './types'

function fixture() {
  const pkg = visualFixture()
  Object.assign(pkg, { version: 4, instructionsVersion: 'notebook-workflows-draft-4' })
  const section = pkg.entries[0].sections[0]
  const base = { id: 'study-callout', provenance: 'background' as const, sourceIds: [], excerptIds: [] }
  section.blocks.push({ ...base, type: 'callout', tone: 'one-thing', text: '**Cyclin** regulates Cdk activity.', stressed: true, definedTerms: [{ term: 'Cyclin', definition: 'A protein that regulates Cdk activity.' }] })
  section.blocks.push({ ...base, id: 'study-bullets', type: 'bullets', items: ['Cell-cycle regulators'], nestedItems: [{ parentIndex: 0, items: ['Cyclin'] }] })
  section.learningObjectiveIds = [pkg.entries[0].objectives[0].id]
  const map = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'study-diagram')!
  if (map.type === 'study-diagram') {
    map.nodes[0].tone = 'stimulatory'
    map.nodes[0].targetBlockId = pkg.entries[0].sections.find(s => s.blocks.includes(map))!.blocks[0].id
  }
  return pkg
}
it('round-trips additive v4 study guide fields without changing content', () => {
  const pkg = fixture()
  expect(parseNotebookPackage(JSON.stringify(pkg))).toEqual(pkg)
})
it.each([
  ['nested parent', (p: ReturnType<typeof fixture>) => { const b = p.entries[0].sections[0].blocks.find(b => b.id === 'study-bullets')!; if (b.type === 'bullets') b.nestedItems![0].parentIndex = 99 }],
  ['objective reference', (p: ReturnType<typeof fixture>) => { p.entries[0].sections[0].learningObjectiveIds = ['missing'] }],
  ['map target', (p: ReturnType<typeof fixture>) => { const b = p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'study-diagram')!; if (b.type === 'study-diagram') b.nodes[0].targetBlockId = 'missing' }],
  ['conflicting definition', (p: ReturnType<typeof fixture>) => { const block = p.entries[0].sections[0].blocks.find(b => b.id === 'study-bullets') as NotebookBlock; block.definedTerms = [{ term: 'cyclin', definition: 'A contradictory definition.' }] }],
] as const)('rejects invalid %s', (_, mutate) => {
  const pkg = fixture(); mutate(pkg)
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow()
})

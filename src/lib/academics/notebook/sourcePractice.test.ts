import { expect, it } from 'vitest'
import { plainVisualFixture } from './visual.test-fixtures'
import { revisionFixture } from './revision.test-fixtures'
import { parseNotebookPackage } from './package'

it.each(['source', 'generated-practice'] as const)('allows v3 %s questions with exact source evidence', provenance => {
  const pkg = plainVisualFixture(), block = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  block.provenance = provenance
  expect(parseNotebookPackage(JSON.stringify(pkg))).toEqual(pkg)
})
it.each(['clarification', 'student-work', 'unsupported'] as const)('does not silently reinterpret %s as a source question', provenance => {
  const pkg = plainVisualFixture(), block = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  Object.assign(block, { provenance })
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow()
})
it('still requires precise source evidence for retained course questions', () => {
  const pkg = plainVisualFixture(), block = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  block.provenance = 'source'; block.excerptIds = []; block.assetIds = []
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow()
})
it('leaves v2 practice provenance semantics unchanged', () => {
  const pkg = revisionFixture(), block = pkg.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!
  block.provenance = 'source'
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow('generated-practice')
})

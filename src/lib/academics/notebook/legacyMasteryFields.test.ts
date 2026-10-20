// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import legacy from './revision-fixtures/baseline-current.json'
import { parseNotebookPackage, prepareNotebook } from './package'
import { validateSchema, type Schema } from './schemaValidator'
import { visualFixture } from './visual.test-fixtures'

const v4Fixture = () => {
  const pkg = visualFixture()
  Object.assign(pkg, { version: 4, instructionsVersion: 'notebook-workflows-draft-4' })
  return pkg
}
it('prepares v4 objectives with empty retired fields through the real import preparation path', async () => {
  const pkg = v4Fixture()
  for (const objective of pkg.entries[0].objectives) { objective.freeRecallCues = []; objective.watchFor = [] }
  const raw = JSON.stringify(pkg), prepared = await prepareNotebook(raw)
  expect(prepared.package).toEqual(pkg)
  expect(prepared.raw).toBe(raw)
  expect(prepared.fingerprints).toHaveLength(pkg.entries.length)
})
it('preserves existing non-empty v4 retired content without rewriting it', () => {
  const pkg = v4Fixture(), objective = pkg.entries[0].objectives[0]
  objective.freeRecallCues = ['A previously saved retrieval cue.']
  objective.watchFor = ['A previously saved instructor caution.']
  expect(parseNotebookPackage(JSON.stringify(pkg))).toEqual(pkg)
})
it.each([
  ['app runtime v4', './notebook-package-v4.schema.json'],
  ['canonical portable v4', '../../../../premed-hq-documentation/specifications/generation/portable-notebooks/notebook-package-v4.schema.json'],
  ['embedded prompt v4', '../../../../premed-hq-documentation/specifications/generation/portable-notebooks/notebook-prompt-v4.schema.json'],
])('%s accepts both empty and retained retired-field arrays', (_, path) => {
  const schema = JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as Schema
  const objective = v4Fixture().entries[0].objectives[0]
  for (const values of [[], ['Previously saved text.']]) {
    objective.freeRecallCues = [...values]; objective.watchFor = [...values]
    expect(() => validateSchema(objective, schema.$defs!.objective, schema)).not.toThrow()
  }
})
it('keeps v3 empty-cue rejection unchanged', () => {
  const pkg = visualFixture()
  pkg.entries[0].objectives[0].freeRecallCues = []
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow(/at least 1/)
})
it('keeps v2 empty-cue rejection unchanged', () => {
  const pkg = structuredClone(legacy)
  pkg.entries[0].objectives[0].freeRecallCues = []
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow(/at least 1/)
})

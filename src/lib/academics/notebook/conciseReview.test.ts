import { expect, it } from 'vitest'
import { parseNotebookPackage } from './package'
import { plainVisualFixture } from './visual.test-fixtures'
import { revisionFixture } from './revision.test-fixtures'

// Parser regressions, not a claim that structural validation proves mastery.
function conciseReview() {
  const pkg = plainVisualFixture(), objective = pkg.entries[0].objectives[0]
  pkg.entries[0].goal = 'review'
  objective.understand = ['Explain the supplied relationship in your own words.']
  objective.beAbleToDo = ['Use the supplied evidence to compare the two conditions.']
  objective.watchFor = []; objective.evidenceLimit = null
  return pkg
}
it('accepts concise supported review objectives without caution or practice-link quotas', () => {
  const pkg = conciseReview(); pkg.entries[0].objectives[0].practiceBlockIds = []
  const raw = JSON.stringify(pkg)
  expect(parseNotebookPackage(raw)).toEqual(pkg); expect(JSON.stringify(pkg)).toBe(raw)
})
it('allows two objectives to reuse the same evidenced supplied question', () => {
  const pkg = conciseReview(), entry = pkg.entries[0], objective = entry.objectives[0]
  const question = entry.sections.flatMap(section => section.blocks).find(block => block.id === objective.practiceBlockIds[0])!
  question.provenance = 'source'; objective.practiceBlockIds = [question.id]
  entry.objectives.push({ ...structuredClone(objective), id: 'objective-reusing-source-question' })
  expect(parseNotebookPackage(JSON.stringify(pkg))).toEqual(pkg)
})
it.each(['understand', 'freeRecallCues'] as const)('still rejects an empty objective %s array', field => {
  const pkg = conciseReview(); pkg.entries[0].objectives[0][field] = []
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow()
})
it('still rejects unsupported objective evidence and dangling practice links', () => {
  const unsupported = conciseReview(), objective = unsupported.entries[0].objectives[0]
  objective.sourceIds = []; objective.excerptIds = []; objective.assetIds = []
  expect(() => parseNotebookPackage(JSON.stringify(unsupported))).toThrow('evidence')
  const dangling = conciseReview(); dangling.entries[0].objectives[0].practiceBlockIds = ['removed-question']
  expect(() => parseNotebookPackage(JSON.stringify(dangling))).toThrow('practice blocks in this entry')
})
it.each(['assessment', 'assignment'] as const)('leaves existing v3 %s parser semantics unchanged', goal => {
  const pkg = conciseReview(); pkg.entries[0].goal = goal
  expect(() => parseNotebookPackage(JSON.stringify(pkg))).toThrow('at most 0 items')
  pkg.entries[0].objectives = []
  expect(parseNotebookPackage(JSON.stringify(pkg))).toEqual(pkg)
})
it('keeps the v2 baseline contract unchanged', () => {
  const pkg = revisionFixture()
  expect(parseNotebookPackage(JSON.stringify(pkg))).toEqual(pkg)
})

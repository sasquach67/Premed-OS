import { describe, expect, it } from 'vitest'
import { buildRevisedNotesPrompt, validateRevisedNotesAddition } from './prompt'
import { revisionFixture } from '../notebook/revision.test-fixtures'
import type { NotebookPackage } from '../notebook/types'

function fixture() {
  const baseline = revisionFixture(), proposed = structuredClone(baseline)
  const entry = proposed.entries[0]
  entry.baseRevision = entry.revision; entry.revision++
  entry.sections.push({ id: 'revised-notes', title: 'Revised notes — Mapping', purpose: 'workspace', blocks: [{ id: 'revised-mapping', type: 'paragraph', provenance: 'student-work', sourceIds: ['source-mapping'], excerptIds: ['excerpt-mapping'], text: 'My clarified note about the mapping task.' }] })
  return { baseline, proposed }
}
describe('revised notes prompt', () => {
  it('includes the full notebook contract, explicit authored-notes input and focused correction instructions', () => {
    const { baseline } = fixture()
    const prompt = buildRevisedNotesPrompt({ courseLabel: 'DEMO', revision: { id: 'session', localId: 'lecture', createdAt: 1, baseline }, notesDescription: 'My handwritten notes {{COURSE_CODE}}', additionalInstructions: 'Explain simply.' })
    expect(prompt).toContain('END NOTEBOOK INSTRUCTIONS')
    expect(prompt).toContain('My handwritten notes {{COURSE_CODE}}')
    expect(prompt).toContain('Pankow')
    expect(prompt).toContain('exact saved notebook JSON')
    expect(prompt).toContain('purpose "workspace"')
    expect(prompt).toContain('Explain simply.')
    expect(prompt).not.toContain('My private personal notes')
  })
  it.each([2, 3, 4] as const)('embeds a matching version %s schema without requiring migration', version => {
    const baseline = revisionFixture()
    Object.assign(baseline, { version, instructionsVersion: `notebook-workflows-draft-${version}` })
    const prompt = buildRevisedNotesPrompt({ courseLabel: 'DEMO', revision: { id: 'session', localId: 'lecture', createdAt: 1, baseline }, notesDescription: 'My notes' })
    const schemaPart = prompt.slice(prompt.lastIndexOf('\n## Exact JSON Schema\n'))
    const schema = JSON.parse(schemaPart.split('```json\n')[1].split('\n```')[0])
    expect(schema.properties.version.const).toBe(version)
    expect(prompt).toContain(`Selected baseline version: ${version}`)
  })
  it('asks the external AI to identify student notes when no description was supplied', () => {
    expect(buildRevisedNotesPrompt({ courseLabel: 'DEMO', revision: { id: 'session', localId: 'lecture', createdAt: 1, baseline: revisionFixture() }, notesDescription: ' ' })).toContain('ask which accessible file contains my own authored notes')
  })
})
describe('additive revised-notes import boundary', () => {
  it('accepts appended notes preserving the existing notebook', () => { const { baseline, proposed } = fixture(); expect(() => validateRevisedNotesAddition(baseline, proposed)).not.toThrow() })
  it.each([
    ['replacing existing teaching', (p: NotebookPackage) => { p.entries[0].sections[0].title = 'Changed' }],
    ['changing objectives', (p: NotebookPackage) => { p.entries[0].objectives = [] }],
    ['changing source evidence', (p: NotebookPackage) => { p.sources[0].excerpts[0].text = 'Invented replacement' }],
    ['wrong target', (p: NotebookPackage) => { p.entries[0].id = 'another-entry' }],
    ['wrong revision', (p: NotebookPackage) => { p.entries[0].baseRevision = 0 }],
    ['no added notes', (p: NotebookPackage) => { p.entries[0].sections.pop() }],
    ['adding a study guide', (p: NotebookPackage) => { p.entries[0].sections.at(-1)!.purpose = 'study-guide' }],
  ])('rejects %s', (_, mutate) => { const { baseline, proposed } = fixture(); mutate(proposed); expect(() => validateRevisedNotesAddition(baseline, proposed)).toThrow('Revised notes:') })
})

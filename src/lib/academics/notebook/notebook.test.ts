import { webcrypto } from 'node:crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import review from './fixtures/fixture-review.json'
import assessment from './fixtures/fixture-assessment.json'
import assignment from './fixtures/fixture-assignment.json'
import { canonical, parseNotebookPackage, prepareNotebook } from './package'
import { exportNotebook, importNotebook, saveNotebookEdits } from './import'
import { composeNotebookPrompt, PROMPT_KEYS, type PromptValues } from './prompt'
import type { NotebookPackage } from './types'
beforeAll(() => vi.stubGlobal('crypto', webcrypto))
const raw = JSON.stringify(review)
const course = { id: 'destination', code: review.course.code }
const center = () => createInitialDataForMode(false).academics.classCenter
const mutate = (fn: (p: NotebookPackage) => void) => { const p = JSON.parse(raw) as NotebookPackage; fn(p); return JSON.stringify(p) }
describe('lossless notebook package contract', () => {
  it.each([['review', review], ['assessment', assessment], ['assignment', assignment]])('accepts the shared %s fixture without dropping or normalizing any field', (_name, fixture) => { expect(parseNotebookPackage(JSON.stringify(fixture))).toEqual(fixture) })
  it('keeps exact content whitespace, tables, sources and complete JSON blocks', () => {
    const text = mutate(p => { p.sources[0].excerpts[0].text = '  original\n\nsource  '; p.entries[0].title = '  Exact title  ' })
    expect(parseNotebookPackage('```json\n' + text + '\n```')).toEqual(JSON.parse(text))
  })
  it('rejects duplicate object keys instead of silently losing content', () => { expect(() => parseNotebookPackage(raw.replace('"format":', '"format":"lost original","format":'))).toThrow('Duplicate field') })
  it('rejects unknown fields instead of silently dropping them', () => { expect(() => parseNotebookPackage(raw.replace('"format":', '"additionalContent":"preserve me","format":'))).toThrow('$.additionalContent') })
  it('rejects invalid statuses with the precise requirement path', () => { expect(() => parseNotebookPackage(raw.replace('"status":"supported"', '"status":"complete"'))).toThrow('$.entries[0].requirements[0].status') })
  it('rejects missing source references, repeated refs, and excerpt/source mismatch', () => {
    expect(() => parseNotebookPackage(mutate(p => { p.entries[0].sections[0].blocks[0].sourceIds = ['missing'] }))).toThrow('sourceIds')
    expect(() => parseNotebookPackage(mutate(p => { const b = p.entries[0].sections[0].blocks[0]; b.sourceIds.push(...b.sourceIds) }))).toThrow('References must be unique')
    expect(() => parseNotebookPackage(mutate(p => { p.entries[0].sections[0].blocks[0].sourceIds = [] }))).toThrow('Excerpt must belong')
  })
  it('rejects malformed tables and cross-entry practice references', () => {
    expect(() => parseNotebookPackage(mutate(p => { p.entries[0].sections[0].blocks.push({ id: 'bad-table', type: 'table', provenance: 'student-work', sourceIds: [], excerptIds: [], columns: ['A', 'B'], rows: [['one']] }) }))).toThrow('column count')
    expect(() => parseNotebookPackage(mutate(p => { p.entries[0].objectives[0].practiceBlockIds = ['foreign-practice'] }))).toThrow('practiceBlockIds')
  })
  it('rejects ungrounded practice and fabricated unreadable source evidence', () => {
    expect(() => parseNotebookPackage(mutate(p => { const b = p.entries[0].sections.flatMap(s => s.blocks).find(b => b.type === 'practice')!; b.sourceIds = []; b.excerptIds = [] }))).toThrow('excerptIds')
    expect(() => parseNotebookPackage(mutate(p => { p.sources[0].access = 'unreadable' }))).toThrow('cannot be used')
  })
  it('rejects revision skipping and mastery of a missing requirement', () => {
    expect(() => parseNotebookPackage(mutate(p => { p.entries[0].revision = 3; p.entries[0].baseRevision = 1 }))).toThrow('baseRevision')
    expect(() => parseNotebookPackage(mutate(p => { p.entries[0].requirements[0].status = 'missing'; p.entries[0].requirements[0].nextStep = 'Attach evidence' }))).toThrow('requirementId')
  })
  it('accepts a gap-only result when no source is readable', () => {
    const text = mutate(p => { p.sources = [{ ...p.sources[0], access: 'unreadable', inspected: '', used: false, limitations: ['Labels not readable'], excerpts: [] }]; const e = p.entries[0]; e.objectives = []; e.sections = [{ id: 'gaps', title: 'Missing source', purpose: 'next-steps', blocks: [{ id: 'gap', type: 'gap', provenance: 'clarification', sourceIds: [], excerptIds: [], text: 'No readable material', nextStep: 'Attach a clearer copy' }] }]; e.requirements = [{ ...e.requirements[0], status: 'missing', sourceIds: [], excerptIds: [], sectionIds: ['gaps'], nextStep: 'Attach readable source' }] })
    expect(parseNotebookPackage(text).entries[0].objectives).toEqual([])
  })
})
describe('transactional notebook retention', () => {
  it('requires explicit destination confirmation and makes no partial changes', async () => {
    const c = center(); const p = await prepareNotebook(raw); const before = JSON.stringify(c)
    expect(() => importNotebook(c, { ...course, code: 'WRONG101' }, p)).toThrow('Confirm saving')
    expect(JSON.stringify(c)).toBe(before)
    expect(importNotebook(c, { ...course, code: 'WRONG101' }, p, { confirmDestination: true })).toHaveLength(1)
  })
  it('validates the entire package again before any save', async () => {
    const c = center(); const p = await prepareNotebook(raw); p.raw = raw.replace('"status":"supported"', '"status":"bad"')
    expect(() => importNotebook(c, course, p)).toThrow('status')
    expect(c.lectures).toHaveLength(0)
  })
  it('preserves original, edited text, notes and progress through reload/export and identical dedupe', async () => {
    const c = center(); const prepared = await prepareNotebook(raw); const [id] = importNotebook(c, course, prepared)
    const lecture = c.lectures.find(l => l.id === id)!
    const edited = structuredClone(lecture.importedNotebook!.current); edited.entries[0].title = 'My own title'
    saveNotebookEdits(lecture, edited, 'My personal note')
    lecture.importedNotebook!.progress['practice'] = { response: 'My attempt', complete: true }
    const restored = JSON.parse(JSON.stringify(c)) as typeof c
    const existing = restored.lectures[0]
    expect(importNotebook(restored, course, prepared)).toEqual([id]); expect(restored.lectures).toHaveLength(1)
    expect(existing.importedNotebook!.progress.practice.response).toBe('My attempt')
    expect(existing.importedNotebook!.notes).toBe('My personal note')
    expect(exportNotebook(existing, 'original')).toBe(raw)
    expect(parseNotebookPackage(exportNotebook(existing, 'current')).entries[0].title).toBe('My own title')
    expect(JSON.parse(exportNotebook(existing, 'backup')).notebook.original).toEqual(review)
  })
  it('dedupes different object key order but never replaces edits on revised or conflicting content', async () => {
    const c = center(); const prepared = await prepareNotebook(raw); const [id] = importNotebook(c, course, prepared)
    const sorted = await prepareNotebook(canonical(review)); expect(importNotebook(c, course, sorted)).toEqual([id])
    const revised = await prepareNotebook(mutate(p => { p.entries[0].revision = 2; p.entries[0].baseRevision = 1; p.entries[0].title = 'Revised content' }))
    const before = JSON.stringify(c)
    expect(() => importNotebook(c, course, revised)).toThrow('separate entries'); expect(JSON.stringify(c)).toBe(before)
    const [newId] = importNotebook(c, course, revised, { confirmRevisions: true }); expect(newId).not.toBe(id)
    expect(c.lectures[1].importedNotebook!.revisedFromLectureId).toBe(id)
    expect(c.lectures[0].importedNotebook!.originalRaw).toBe(raw)
    expect(importNotebook(c, course, revised)).toEqual([newId])
  })
})
describe('one exact customized prompt', () => {
  const values = Object.fromEntries(PROMPT_KEYS.map(key => [key, key === 'USER_REQUEST' ? 'literal $& {{COURSE_CODE}} and "quotes"\nnext line' : key])) as PromptValues
  it.each(['review', 'assessment', 'assignment'] as const)('composes full %s rules/schema and inserts values once', goal => {
    const prompt = composeNotebookPrompt(goal, values)
    expect(prompt).toContain(JSON.stringify(values.USER_REQUEST))
    expect(prompt).toContain('premed-os-notebook-package')
    expect(prompt).toContain('notebook-workflows-draft-3')
    expect(prompt.length).toBeGreaterThan(15000)
    expect(prompt).toContain('supported'); expect(prompt).toContain('out-of-scope')
    const request = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(prompt)![1])
    expect(request.userRequest).toBe(values.USER_REQUEST)
  })
})

const sharedFixtures = import.meta.glob('./fixtures/*.json', { eager: true, import: 'default' })
it.each(Object.entries(sharedFixtures))('preserves shared edge fixture %s', (_name, fixture) => { expect(parseNotebookPackage(JSON.stringify(fixture))).toEqual(fixture) })
it.each(['toString', 'valueOf', 'hasOwnProperty'])('rejects inherited extra property %s', key => { expect(() => parseNotebookPackage(raw.replace('"format":', `"${key}":"must not disappear","format":`))).toThrow(`$.${key}`) })
it('dedupes reimport of the edited current export while retaining original and progress', async () => {
  const c = center(); const [id] = importNotebook(c, course, await prepareNotebook(raw)); const lecture = c.lectures[0]
  const edited = structuredClone(lecture.importedNotebook!.current); edited.entries[0].title = 'Changed locally'
  saveNotebookEdits(lecture, edited, 'Retained note'); lecture.importedNotebook!.progress.p = { response: 'Retained response', complete: true }
  expect(importNotebook(c, course, await prepareNotebook(exportNotebook(lecture, 'current')))).toEqual([id])
  expect(importNotebook(c, course, await prepareNotebook(raw))).toEqual([id]); expect(c.lectures).toHaveLength(1)
  expect(lecture.importedNotebook!.progress.p.response).toBe('Retained response'); expect(exportNotebook(lecture, 'original')).toBe(raw)
})
it('requires confirmation for the same course code with a different title or term', async () => {
  const c = center(); const p = await prepareNotebook(raw)
  expect(() => importNotebook(c, { ...course, title: 'Different course title' }, p)).toThrow('Confirm saving')
  const withTerm = await prepareNotebook(mutate(p => { p.course.term = 'Fall 2026' }))
  expect(() => importNotebook(c, { ...course, term: 'Spring 2027' }, withTerm)).toThrow('Confirm saving')
  expect(c.lectures).toHaveLength(0)
})

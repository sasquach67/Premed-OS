import { webcrypto } from 'node:crypto'
import ownerBaseline from './revision-fixtures/baseline-current.json'
import ownerProposal from './revision-fixtures/expected-revised-with-new-topic.json'
import ownerAmbiguousBaseline from './revision-fixtures/ambiguous-linked-baseline.json'
import ownerAmbiguousProposal from './revision-fixtures/ambiguous-linked-proposal.json'
import { beforeAll, expect, it, vi } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import { acceptNotebookUpdate, exportNotebook, importNotebook, inspectNotebookUpdate, restoreNotebookVersion, saveNotebookEdits } from './import'
import { canonical, prepareNotebook } from './package'
import { compareNotebooks, createNotebookUpdateSession, notebookContentKey, notebookPracticePolicy, notebookStateKey, revisionInput } from './revision'
import { correctedFixture, revisionFixture, withNewTopic } from './revision.test-fixtures'
import type { NotebookPackage } from './types'
beforeAll(() => vi.stubGlobal('crypto', webcrypto))
async function setup() {
  const center = createInitialDataForMode(false).academics.classCenter, p = revisionFixture()
  const course = { id: 'demo-class', ...p.course, term: p.course.term! }
  const raw = JSON.stringify(p), [id] = importNotebook(center, course, await prepareNotebook(raw))
  const lecture = center.lectures.find(l => l.id === id)!, n = lecture.importedNotebook!
  n.notes = 'My protected note'; n.progress = { 'question-mapping': { response: 'Left, from my attempt.', complete: true }, 'question-timing': { response: '100, from my old attempt.', complete: true } }
  n.updateSession = createNotebookUpdateSession(n, id)
  return { center, course, id, lecture, n, session: n.updateSession, raw }
}
it('accepts into the same identity, preserves independent practice/notes and archives affected responses', async () => {
  const s = await setup(), before = structuredClone(s.n.current)
  expect(acceptNotebookUpdate(s.center, s.course, await prepareNotebook(JSON.stringify(correctedFixture())), s.session, true)).toEqual([s.id])
  const n = s.center.lectures[0].importedNotebook!
  expect(n.current.entries[0].revision).toBe(2); expect(n.notes).toBe('My protected note')
  expect(n.progress['question-mapping'].complete).toBe(true); expect(n.progress['question-timing']).toBeUndefined()
  expect(n.history).toHaveLength(1); expect(n.history![0].current).toEqual(before)
  expect(n.history![0].progress['question-timing'].response).toContain('100')
  expect(n.originalRaw).toBe(s.raw); expect(n.original).toEqual(revisionFixture()); expect(n.updateSession).toBeUndefined()
})
it('compares changed timing and not unchanged mapping using full available dependencies', () => {
  const policy = notebookPracticePolicy(revisionFixture(), correctedFixture(), 'topic-demo')
  expect(policy.affectedIds).toEqual(['question-timing'])
  const changes = compareNotebooks(revisionFixture(), correctedFixture(), 'topic-demo')
  expect(changes.some(c => c.kind === 'Source / excerpts')).toBe(true)
  expect(changes.some(c => c.kind === 'Objective')).toBe(true)
  expect(changes.some(c => c.kind === 'Content / practice' && c.label.includes('which response'))).toBe(false)
})
it('preserves linked practice when unrelated sources, excerpts, requirements or new topics are appended', () => {
  const before = revisionFixture(), after = withNewTopic(before)
  after.sources[0].excerpts.push({ id: 'unrelated-excerpt', location: null, text: 'Unrelated newly retained excerpt.' })
  after.sources.push({ id: 'unrelated-source', title: 'Not used', role: 'other', access: 'read', inspected: 'Read invented example.', limitations: [], used: false, excerpts: [] })
  after.entries[0].requirements.push({ ...after.entries[1].requirements[0], id: 'unrelated-requirement', sectionIds: [] })
  expect(notebookPracticePolicy(before, after, 'topic-demo').affectedIds).toEqual([])
})
it('broadens the reset visibly when dependency linkage cannot establish independence', () => {
  const before = revisionFixture(); before.entries[0].objectives = []
  before.sources[0].excerpts.push({ id: 'isolated-evidence', location: null, text: 'Invented independent question evidence without teaching links.' })
  before.entries[0].sections.find(s => s.id === 'practice-mapping')!.blocks[0].excerptIds = ['isolated-evidence']
  const after = structuredClone(before), block = after.entries[0].sections.find(s => s.id === 'teaching-timing')!.blocks[0]
  if (block.type === 'paragraph') block.text += ' Changed teaching context.'
  const policy = notebookPracticePolicy(before, after, 'topic-demo')
  expect(policy.affectedIds).toContain('question-mapping'); expect(policy.explanation).toContain('dependency links are missing')
})
it('detects stale content even with unchanged portable revision numbers, before any write', async () => {
  const s = await setup(); s.n.current.entries[0].title = 'Newer local title'
  const before = canonical(s.center), p = await prepareNotebook(JSON.stringify(correctedFixture()))
  expect(() => acceptNotebookUpdate(s.center, s.course, p, s.session, true)).toThrow('Saved content changed')
  expect(canonical(s.center)).toBe(before)
})
it('requires real app session, target, course, goal, next revision and explicit acceptance', async () => {
  const s = await setup(), p = await prepareNotebook(JSON.stringify(correctedFixture()))
  expect(() => acceptNotebookUpdate(s.center, s.course, p, s.session, false)).toThrow('explicitly accept')
  expect(() => inspectNotebookUpdate(s.center, s.course.id, p, { ...s.session, id: 'forged' })).toThrow('session is no longer current')
  expect(() => inspectNotebookUpdate(s.center, s.course.id, p, { ...s.session, localId: 'missing' })).toThrow('no longer exists')
  const wrong = correctedFixture(); wrong.course.title = 'Wrong course'
  expect(() => inspectNotebookUpdate(s.center, s.course.id, { ...p, package: wrong }, s.session)).toThrow('Course or goal')
  expect(() => inspectNotebookUpdate(s.center, s.course.id, { ...p, package: revisionFixture() }, { ...s.session, baseline: { ...s.session.baseline, entries: [] } })).toThrow('baseline')
  const old = revisionFixture(); old.entries[0].title = 'Different content at same revision'
  expect(() => inspectNotebookUpdate(s.center, s.course.id, { ...p, package: old }, s.session)).toThrow('next revision')
})
it('keeps study records changed since export and snapshots them at acceptance', async () => {
  const s = await setup(); s.n.notes = 'Newer saved note'; s.n.progress['question-timing'].response = 'A newer attempted answer'
  acceptNotebookUpdate(s.center, s.course, await prepareNotebook(JSON.stringify(correctedFixture())), s.session, true)
  const n = s.center.lectures[0].importedNotebook!
  expect(n.notes).toBe('Newer saved note'); expect(n.history![0].progress['question-timing'].response).toBe('A newer attempted answer')
})
it('dedupes an already applied proposal and original reimport without restoring old content', async () => {
  const s = await setup(), p = await prepareNotebook(JSON.stringify(correctedFixture()))
  acceptNotebookUpdate(s.center, s.course, p, s.session, true)
  expect(acceptNotebookUpdate(s.center, s.course, p, s.session, true)).toEqual([s.id])
  expect(importNotebook(s.center, s.course, await prepareNotebook(s.raw))).toEqual([s.id])
  expect(s.center.lectures).toHaveLength(1); expect(s.center.lectures[0].importedNotebook!.history).toHaveLength(1)
  expect(s.center.lectures[0].importedNotebook!.current.entries[0].revision).toBe(2)
})
it('adds an explicit new topic atomically and dedupes a repeated multi-entry proposal', async () => {
  const s = await setup(), p = await prepareNotebook(JSON.stringify(withNewTopic(correctedFixture())))
  const ids = acceptNotebookUpdate(s.center, s.course, p, s.session, true)
  expect(ids[0]).toBe(s.id); expect(ids).toHaveLength(2); expect(s.center.lectures).toHaveLength(2)
  expect(acceptNotebookUpdate(s.center, s.course, p, s.session, true)).toEqual(ids)
  expect(s.center.lectures).toHaveLength(2); expect(s.center.lectures[0].importedNotebook!.history).toHaveLength(1)
})
it('rejects extra revisions of unrelated identities without any partial target/history write', async () => {
  const s = await setup(), p = withNewTopic(correctedFixture())
  p.entries[1].revision = 2; p.entries[1].baseRevision = 1
  const before = canonical(s.center)
  expect(() => acceptNotebookUpdate(s.center, s.course, { package: p, raw: JSON.stringify(p), fingerprints: ['a', 'b'] }, s.session, true)).toThrow('genuinely new topics')
  expect(canonical(s.center)).toBe(before)
})
it('revalidates malformed or modified proposals before acceptance', async () => {
  const s = await setup(), p = await prepareNotebook(JSON.stringify(correctedFixture())), before = canonical(s.center)
  p.package.entries[0].title = 'Modified preview'
  expect(() => acceptNotebookUpdate(s.center, s.course, p, s.session, true)).toThrow('proposal changed')
  expect(canonical(s.center)).toBe(before)
})
it('allows edit-after-update with current revision, consistent practice policy and immutable import provenance', async () => {
  const s = await setup(); acceptNotebookUpdate(s.center, s.course, await prepareNotebook(JSON.stringify(correctedFixture())), s.session, true)
  const lecture = s.center.lectures[0], n = lecture.importedNotebook!, edited = structuredClone(n.current)
  edited.entries[0].title = 'My updated title'
  saveNotebookEdits(lecture, edited, n.notes)
  expect(n.current.entries[0].revision).toBe(2); expect(n.progress['question-mapping'].complete).toBe(true)
  const changed = structuredClone(n.current), question = changed.entries[0].sections.find(s => s.id === 'practice-mapping')!.blocks[0]
  if (question.type === 'practice') question.answer += ' My explanation.'
  saveNotebookEdits(lecture, changed, n.notes)
  expect(n.progress['question-mapping']).toBeUndefined(); expect(n.history).toHaveLength(3)
  expect(exportNotebook(lecture, 'original')).toBe(s.raw)
  expect(JSON.parse(exportNotebook(lecture, 'current')).entries[0].title).toBe('My updated title')
  expect(JSON.parse(exportNotebook(lecture, 'backup')).notebook.history).toHaveLength(3)
})
it('blocks stale manual content or note edits without replacing newer work', async () => {
  const s = await setup(), expected = { content: notebookContentKey(s.n), notes: s.n.notes }
  s.n.notes = 'Saved elsewhere'; const before = canonical(s.n)
  expect(() => saveNotebookEdits(s.lecture, revisionFixture(), 'Stale notes', Date.now(), expected)).toThrow('changed while you were editing')
  expect(canonical(s.n)).toBe(before)
})
it('restores recoverable content/notes/progress after reload and keeps the replaced version', async () => {
  const s = await setup(); acceptNotebookUpdate(s.center, s.course, await prepareNotebook(JSON.stringify(correctedFixture())), s.session, true)
  const lecture = JSON.parse(JSON.stringify(s.center.lectures[0])) as typeof s.lecture, n = lecture.importedNotebook!
  restoreNotebookVersion(lecture, n.history![0].id, notebookStateKey(n))
  expect(n.current.entries[0].revision).toBe(1); expect(n.progress['question-timing'].complete).toBe(true)
  expect(n.notes).toBe('My protected note'); expect(n.history).toHaveLength(2)
  expect(n.history![1].current.entries[0].revision).toBe(2); expect(n.originalRaw).toBe(s.raw)
})
it('rejects after-preview restore races including notes and practice changes', async () => {
  const s = await setup(); acceptNotebookUpdate(s.center, s.course, await prepareNotebook(JSON.stringify(correctedFixture())), s.session, true)
  const lecture = s.center.lectures[0], n = lecture.importedNotebook!, key = notebookStateKey(n)
  n.progress['question-mapping'].response = 'Newer response'; const before = canonical(n)
  expect(() => restoreNotebookVersion(lecture, n.history![0].id, key)).toThrow('after this restore preview')
  expect(canonical(n)).toBe(before)
})
it('keeps revision metadata app-local except the existing string revision input', async () => {
  const s = await setup(), input = JSON.parse(revisionInput(s.session))
  expect(input.mode).toBe('update-existing-entry'); expect(input.entryId).toBe('topic-demo'); expect(input.revision).toBe(1)
  expect(input.baselineFile).toBe('notebook-update-baseline.json'); expect(input.localId).toBeUndefined()
  expect(input.baseline).toContain('excludes independent notes, practice progress and unsaved drafts')
})
const ownerCase = (name: string) => structuredClone(({ 'baseline-current': ownerBaseline, 'expected-revised-with-new-topic': ownerProposal, 'ambiguous-linked-baseline': ownerAmbiguousBaseline, 'ambiguous-linked-proposal': ownerAmbiguousProposal } as Record<string, unknown>)[name]) as NotebookPackage
it('preserves owner authored mapping practice while correcting timing and adding Chapter 4 atomically', async () => {
  const baseline = ownerCase('baseline-current'), proposal = ownerCase('expected-revised-with-new-topic')
  const center = createInitialDataForMode(false).academics.classCenter, course = { id: 'owner-demo', code: baseline.course.code, title: baseline.course.title }
  const [id] = importNotebook(center, course, await prepareNotebook(JSON.stringify(baseline)))
  const n = center.lectures[0].importedNotebook!
  n.progress = { 'ch3-practice-mapping': { response: 'Left', complete: true }, 'ch3-practice-timing': { response: '100 milliseconds', complete: true } }
  n.notes = 'Personal note stays local'; const session = n.updateSession = createNotebookUpdateSession(n, id)
  expect(notebookPracticePolicy(baseline, proposal, 'psych-ch3').affectedIds).toEqual(['ch3-practice-timing'])
  const ids = acceptNotebookUpdate(center, course, await prepareNotebook(JSON.stringify(proposal)), session, true)
  expect(ids).toHaveLength(2); expect(ids[0]).toBe(id)
  expect(center.lectures[0].importedNotebook!.progress['ch3-practice-mapping'].complete).toBe(true)
  expect(center.lectures[0].importedNotebook!.progress['ch3-practice-timing']).toBeUndefined()
  expect(center.lectures[1].importedNotebook!.entryId).toBe('psych-ch4')
})
it('resets identical owner mapping question when its declared teaching dependency changes', () => {
  const policy = notebookPracticePolicy(ownerCase('ambiguous-linked-baseline'), ownerCase('ambiguous-linked-proposal'), 'psych-ch3')
  expect(policy.affectedIds).toContain('ch3-practice-mapping'); expect(policy.affectedIds).toContain('ch3-practice-timing')
})
it('recognizes accepted multi-entry proposal provenance after manual edits, later updates and restore', async () => {
  const s = await setup(), proposal = await prepareNotebook(JSON.stringify(withNewTopic(correctedFixture())))
  const ids = acceptNotebookUpdate(s.center, s.course, proposal, s.session, true)
  let target = s.center.lectures.find(l => l.id === s.id)!, n = target.importedNotebook!
  const edited = structuredClone(n.current); edited.entries[0].title = 'Manual title after accepting revision 2'
  saveNotebookEdits(target, edited, n.notes)
  expect(importNotebook(s.center, s.course, proposal)).toEqual(ids)
  expect(n.current.entries[0].title).toBe('Manual title after accepting revision 2'); expect(n.history).toHaveLength(2)
  const session = n.updateSession = createNotebookUpdateSession(n, target.id)
  const third = structuredClone(n.current); third.entries[0].revision = 3; third.entries[0].baseRevision = 2; third.entries[0].title = 'Accepted revision 3'
  acceptNotebookUpdate(s.center, s.course, await prepareNotebook(JSON.stringify(third)), session, true)
  target = s.center.lectures.find(l => l.id === s.id)!; n = target.importedNotebook!
  expect(importNotebook(s.center, s.course, proposal)).toEqual(ids)
  expect(n.current.entries[0].revision).toBe(3); expect(n.history).toHaveLength(3)
  restoreNotebookVersion(target, n.history![0].id, notebookStateKey(n))
  expect(importNotebook(s.center, s.course, proposal)).toEqual(ids)
  expect(n.current.entries[0].revision).toBe(1); expect(n.history).toHaveLength(4)
  expect(s.center.lectures).toHaveLength(2)
})

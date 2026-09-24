import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import { createInitialDataForMode } from '@/store/store'
import { acceptNotebookUpdate, importNotebook } from '../notebook/import'
import { prepareNotebook } from '../notebook/package'
import { createNotebookUpdateSession } from '../notebook/revision'
import { revisionFixture } from '../notebook/revision.test-fixtures'
import { validateRevisedNotesAddition } from './prompt'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))
it('imports appended revised notes into the same lecture, retaining originals and personal notes, with affected practice recoverable in history', async () => {
  const center = createInitialDataForMode(false).academics.classCenter
  const baseline = revisionFixture()
  const course = { id: 'demo-class', ...baseline.course, term: baseline.course.term! }
  const raw = JSON.stringify(baseline)
  const [id] = importNotebook(center, course, await prepareNotebook(raw))
  const original = center.lectures.find(lecture => lecture.id === id)!.importedNotebook!
  original.notes = 'Private handwritten thoughts not automatically shared.'
  original.progress = { 'question-mapping': { response: 'Choose left', complete: true } }
  const session = original.updateSession = createNotebookUpdateSession(original, id)
  const proposal = structuredClone(session.baseline)
  const entry = proposal.entries[0]
  entry.baseRevision = entry.revision; entry.revision++
  entry.sections.push({ id: 'notes-mapping', title: 'Revised notes — Mapping', purpose: 'workspace', blocks: [{ id: 'notes-mapping-explanation', type: 'paragraph', provenance: 'source', sourceIds: ['source-mapping'], excerptIds: ['excerpt-mapping'], text: 'A triangle is the cue to choose left in this invented task.' }] })
  const prepared = await prepareNotebook(JSON.stringify(proposal))
  validateRevisedNotesAddition(session.baseline, prepared.package)
  expect(acceptNotebookUpdate(center, course, prepared, session, true)).toEqual([id])
  const result = center.lectures.find(lecture => lecture.id === id)!.importedNotebook!
  expect(result.originalRaw).toBe(raw)
  expect(result.original).toEqual(baseline)
  expect(result.notes).toBe(original.notes)
  expect(result.history?.at(-1)?.progress['question-mapping']).toEqual({ response: 'Choose left', complete: true })
  // Added teaching shares this question's evidence, so the existing policy resets it.
  expect(result.progress['question-mapping']).toBeUndefined()
  expect(result.current.entries[0].sections.at(-1)?.title).toBe('Revised notes — Mapping')
  expect(result.history?.at(-1)?.current).toEqual(baseline)
})

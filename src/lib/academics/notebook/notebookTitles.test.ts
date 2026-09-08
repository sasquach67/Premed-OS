// @vitest-environment node
import { webcrypto } from 'node:crypto'
import { beforeAll, expect, it, vi } from 'vitest'
import type { ClassCenterData } from '@/lib/types'
import { acceptNotebookUpdate, exportNotebook, importNotebook, restoreNotebookVersion, saveNotebookEdits } from './import'
import { commitNotebookAssets } from './notebookAssetStore'
import { exportNotebookPackageBundle, prepareNotebookBundle } from './notebookBundle'
import { prepareNotebook } from './package'
import { createNotebookUpdateSession, notebookStateKey } from './revision'
import { prepareNotebookAssets } from './visualAssets'
import { headerDecoder, MemoryNotebookAssets, plainVisualFixture } from './visual.test-fixtures'

beforeAll(() => vi.stubGlobal('crypto', webcrypto))

async function setup(title: string) {
  const pkg = plainVisualFixture()
  pkg.entries[0].title = title
  const raw = JSON.stringify(pkg), prepared = await prepareNotebook(raw)
  const center = { lectures: [] } as unknown as ClassCenterData
  const course = { id: 'title-course', code: pkg.course.code }
  const repo = new MemoryNotebookAssets()
  const assets = await prepareNotebookAssets(pkg, [])
  let localId = ''
  await commitNotebookAssets({
    prepared: assets, repository: repo, assertFresh: () => undefined,
    commit: () => {
      localId = importNotebook(center, course, prepared)[0]
      return { committed: true }
    },
  })
  return { center, course, repo, raw, localId, lecture: () => center.lectures.find(item => item.id === localId)! }
}

it.each([
  'Lesson 1 \u2014 Scientific Thinking',
  'Lesson 12 \u2014 Gene regulation',
  'Scientific Thinking',
  'Exam 1 Review',
  'General course review',
  'Lessons 2\u20134 \u2014 Cells and genes',
  '2026-09-08 review',
])('keeps the reviewed title "%s" exact in the catalog/reader record and portable exports', async title => {
  const s = await setup(title), lecture = s.lecture(), n = lecture.importedNotebook!
  // Chronology is not evidence of a lesson number. The app must not prefix it.
  lecture.order = 73
  lecture.createdAt = Date.UTC(2026, 8, 8)
  expect(lecture.title).toBe(title)
  expect(n.current.entries.find(entry => entry.id === n.entryId)?.title).toBe(title)
  const raw = exportNotebook(lecture, 'current')
  expect(JSON.parse(raw).entries[0].title).toBe(title)
  const zip = await exportNotebookPackageBundle(raw, n.assetBindings ?? [], s.repo, headerDecoder)
  const portable = await prepareNotebookBundle(zip, headerDecoder)
  expect(portable.kind).toBe('package')
  if (portable.kind !== 'package') throw new Error('Expected a current notebook package')
  expect(portable.package.entries[0].title).toBe(title)
  expect(exportNotebook(lecture, 'original')).toBe(s.raw)
})

it('saves a verified lesson title through the editor without changing identity, teaching, notes or practice, and restores its earlier title', async () => {
  const s = await setup('Scientific Thinking'), lecture = s.lecture()
  const n = lecture.importedNotebook!, before = structuredClone(n.current)
  const practice = before.entries[0].sections.flatMap(section => section.blocks).find(block => block.type === 'practice')
  if (!practice) throw new Error('The title regression fixture needs a practice item')
  n.notes = 'Keep my own note'
  n.progress = { [practice.id]: { response: 'Keep my answer', complete: true } }
  const progress = structuredClone(n.progress), edited = structuredClone(before)
  edited.entries[0].title = 'Lesson 1 \u2014 Scientific Thinking'
  saveNotebookEdits(lecture, edited, n.notes)

  const saved = lecture.importedNotebook!
  expect(lecture.id).toBe(s.localId)
  expect(saved.entryId).toBe(n.entryId)
  expect(lecture.title).toBe(edited.entries[0].title)
  expect(saved.current).toEqual(edited)
  expect(saved.notes).toBe('Keep my own note')
  expect(saved.progress).toEqual(progress)
  expect(JSON.parse(exportNotebook(lecture, 'current')).entries[0].title).toBe(lecture.title)
  expect(exportNotebook(lecture, 'original')).toBe(s.raw)
  expect(saved.history).toHaveLength(1)
  expect(saved.history![0].current).toEqual(before)

  restoreNotebookVersion(lecture, saved.history![0].id, notebookStateKey(saved))
  expect(lecture.title).toBe('Scientific Thinking')
  expect(lecture.importedNotebook!.current).toEqual(before)
  expect(lecture.importedNotebook!.notes).toBe('Keep my own note')
  expect(lecture.importedNotebook!.progress).toEqual(progress)
  expect(lecture.importedNotebook!.history).toHaveLength(2)
  expect(lecture.importedNotebook!.history![1].current.entries[0].title).toBe(edited.entries[0].title)
  expect(JSON.parse(exportNotebook(lecture, 'current')).entries[0].title).toBe(lecture.title)
})

it('accepts a reviewed title on the same notebook and preserves its exact previous title in history', async () => {
  const s = await setup('Scientific Thinking'), n = s.lecture().importedNotebook!
  const session = createNotebookUpdateSession(n, s.localId)
  n.updateSession = session
  const proposal = structuredClone(session.baseline), entry = proposal.entries[0]
  entry.title = 'Lesson 1 \u2014 Scientific Thinking'
  entry.baseRevision = entry.revision
  entry.revision += 1
  const raw = JSON.stringify(proposal), prepared = await prepareNotebook(raw)
  const assets = await prepareNotebookAssets(proposal, [])
  await commitNotebookAssets({
    prepared: assets, repository: s.repo, lineageId: n.assetLineageId,
    retainedBindings: n.assetBindings, assertFresh: () => undefined,
    commit: () => {
      expect(acceptNotebookUpdate(s.center, s.course, prepared, session, true)).toEqual([s.localId])
      return { committed: true }
    },
  })
  const lecture = s.lecture(), saved = lecture.importedNotebook!
  expect(s.center.lectures).toHaveLength(1)
  expect(saved.entryId).toBe(n.entryId)
  expect(lecture.title).toBe(entry.title)
  expect(JSON.parse(exportNotebook(lecture, 'current')).entries[0]).toEqual(entry)
  expect(saved.history).toHaveLength(1)
  expect(saved.history![0].current.entries[0].title).toBe('Scientific Thinking')
  expect(saved.acceptedRaw).toBe(raw)
  expect(exportNotebook(lecture, 'original')).toBe(s.raw)
})

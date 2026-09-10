// @vitest-environment node
import { expect, it } from 'vitest'
import { canonical, parseNotebookPackage, prepareNotebook } from './package'
import { revisionFixture } from './revision.test-fixtures'
import { acceptNotebookUpdate, exportNotebook, importNotebook, restoreCompleteNotebookBackup, saveNotebookEdits } from './import'
import { createNotebookUpdateSession } from './revision'
import { commitNotebookAssets } from './notebookAssetStore'
import { prepareNotebookAssets } from './visualAssets'
import { exportNotebookBackupBundle, exportNotebookPackageBundle, prepareNotebookBundle } from './notebookBundle'
import { MemoryNotebookAssets, plainVisualFixture } from './visual.test-fixtures'
import { readNotebookZip, writeNotebookZip } from './notebookZip'
import type { NotebookBlock, NotebookPackage } from './types'
import type { ClassCenterData } from '@/lib/types'

const center = () => ({ lectures: [] }) as unknown as ClassCenterData
function tablePackage(version: 2 | 3 | 4 = 2): NotebookPackage {
  const pkg: NotebookPackage = version === 2 ? revisionFixture() : version === 3 ? plainVisualFixture() : { ...plainVisualFixture(), version: 4, instructionsVersion: 'notebook-workflows-draft-4' }
  const section = pkg.entries[0].sections[0]
  const { id, provenance, sourceIds, excerptIds } = section.blocks[0]
  section.blocks = [{ id, type: 'table', provenance, sourceIds, excerptIds, columns: ['', 'Response'], rows: [['Triangle', 'Left']] }]
  return pkg
}
const table = (pkg: NotebookPackage) => pkg.entries[0].sections[0].blocks[0] as Extract<NotebookBlock, { type: 'table' }>

it.each([2, 3, 4] as const)('imports v%s blank table headings with neutral labels and exact original input', async version => {
  const pkg = tablePackage(version), raw = `  ${JSON.stringify(pkg, null, 2)}\n`
  const prepared = await prepareNotebook(raw)
  expect(table(prepared.package)).toEqual({ ...table(pkg), columns: ['Column 1', 'Response'] })
  expect(prepared.raw).toBe(raw)
  expect(JSON.stringify(pkg, null, 2)).toBe(raw.trim())
  expect(prepared.tableHeadingAdjustments).toEqual([{ path: '$.entries[0].sections[0].blocks[0].columns[0]', original: '', replacement: 'Column 1' }])
  expect(parseNotebookPackage(raw)).toEqual(prepared.package)
  expect((await prepareNotebook(JSON.stringify(prepared.package))).fingerprints).toEqual(prepared.fingerprints)
})
it.each([2, 3, 4] as const)('handles multiple whitespace headings in v%s study and practice tables only', async version => {
  const pkg = tablePackage(version), first = table(pkg)
  first.columns = ['', ' \t\n', ' Keep exact ']; first.rows = [[' A ', ' B ', ' C ']]
  const practice = pkg.entries[0].sections.find(s => s.purpose === 'practice')!
  practice.blocks.unshift({ ...structuredClone(first), id: 'practice-table' })
  if (version !== 2) Object.assign(practice.blocks[1], { stimulusBlockIds: ['practice-table'] })
  const raw = `\`\`\`json\n${JSON.stringify(pkg)}\n\`\`\``
  const prepared = await prepareNotebook(raw)
  expect(prepared.tableHeadingAdjustments).toHaveLength(4)
  expect(table(prepared.package).columns).toEqual(['Column 1', 'Column 2', ' Keep exact '])
  expect(table(prepared.package).rows).toEqual(first.rows)
  expect(prepared.package.sources).toEqual(pkg.sources)
  expect(prepared.raw).toBe(raw)
  const again = await prepareNotebook(JSON.stringify(prepared.package))
  expect(again.tableHeadingAdjustments).toEqual([])
  expect(again.package).toEqual(prepared.package)
})
it.each([null, 0, false, {}, []])('does not repair a non-string heading %j', async heading => {
  const pkg = tablePackage(); Object.assign(table(pkg), { columns: [heading, 'Response'] })
  await expect(prepareNotebook(JSON.stringify(pkg))).rejects.toThrow('columns[0]')
})
it.each([
  ['missing columns', (p: NotebookPackage) => { delete (table(p) as Partial<ReturnType<typeof table>>).columns }],
  ['empty column list', (p: NotebookPackage) => { table(p).columns = [] }],
  ['ragged row', (p: NotebookPackage) => { table(p).rows[0] = ['Only one cell'] }],
  ['blank cell', (p: NotebookPackage) => { table(p).rows[0][0] = ' ' }],
  ['non-string cell', (p: NotebookPackage) => { Object.assign(table(p), { rows: [[null, 'Left']] }) }],
  ['blank source claim', (p: NotebookPackage) => { p.sources[0].inspected = ' ' }],
  ['blank source title', (p: NotebookPackage) => { p.sources[0].title = '' }],
  ['blank entry identity', (p: NotebookPackage) => { p.entries[0].id = '' }],
  ['unknown block shape', (p: NotebookPackage) => { Object.assign(table(p), { type: 'paragraph', text: 'Keep this' }) }],
] as const)('still rejects %s', async (_, mutate) => {
  const pkg = tablePackage(); mutate(pkg)
  await expect(prepareNotebook(JSON.stringify(pkg))).rejects.toThrow()
})
it('still rejects duplicate keys and contradictory complete discovery', async () => {
  const pkg = tablePackage(3)
  await expect(prepareNotebook(JSON.stringify(pkg).replace('"columns":', '"columns":["Discarded"],"columns":'))).rejects.toThrow('Duplicate field')
  if (pkg.version !== 2) pkg.visualReview.sources[0].unprocessedPortions = ['Unread pages']
  await expect(prepareNotebook(JSON.stringify(pkg))).rejects.toThrow('complete discovery')
})
it('preserves edits and progress on identical reimport and retains raw provenance through an accepted update', async () => {
  const pkg = tablePackage(), raw = JSON.stringify(pkg), prepared = await prepareNotebook(raw), data = center(), course = { id: 'test', ...pkg.course, term: undefined }
  const [id] = importNotebook(data, course, prepared), saved = data.lectures[0]
  const edited = structuredClone(saved.importedNotebook!.current); edited.entries[0].title = 'My title'
  saveNotebookEdits(saved, edited, 'My notes')
  saved.importedNotebook!.progress['question-mapping'] = { response: 'My response', complete: true }
  const before = canonical(saved)
  expect(importNotebook(data, course, await prepareNotebook(raw))).toEqual([id])
  expect(canonical(saved)).toBe(before)
  expect(exportNotebook(saved, 'original')).toBe(raw)
  expect(table(JSON.parse(exportNotebook(saved, 'current'))).columns[0]).toBe('Column 1')
  const session = createNotebookUpdateSession(saved.importedNotebook!, id)
  saved.importedNotebook!.updateSession = session
  const proposal = structuredClone(edited); proposal.entries[0].revision = 2; proposal.entries[0].baseRevision = 1; table(proposal).columns[0] = ' '
  const revisedRaw = JSON.stringify(proposal)
  acceptNotebookUpdate(data, course, await prepareNotebook(revisedRaw), session, true)
  const updated = data.lectures[0].importedNotebook!
  expect(updated.acceptedRaw).toBe(revisedRaw)
  expect(updated.notes).toBe('My notes')
  expect(updated.progress['question-mapping'].response).toBe('My response')
  expect(table(updated.current).columns[0]).toBe('Column 1')
  expect(updated.history?.length).toBeGreaterThan(0)
})
it('round-trips JSON inside package ZIPs and complete backups without losing raw input or personal records', async () => {
  const pkg = tablePackage(3), raw = JSON.stringify(pkg), prepared = await prepareNotebook(raw), repo = new MemoryNotebookAssets()
  const data = center(), course = { id: 'zip-test', ...pkg.course, term: undefined }
  const assets = await prepareNotebookAssets(prepared.package, [])
  await commitNotebookAssets({ prepared: assets, repository: repo, assertFresh: () => undefined, commit: () => { importNotebook(data, course, prepared); return { committed: true } } })
  const n = data.lectures[0].importedNotebook!; n.notes = 'Keep my note'
  const zip = await exportNotebookPackageBundle(raw, [], repo), decoded = await prepareNotebookBundle(zip)
  expect(decoded.kind).toBe('package')
  if (decoded.kind !== 'package') throw new Error('Expected package')
  expect(decoded.raw).toBe(raw); expect(decoded.package).toEqual(prepared.package)
  const backup = await exportNotebookBackupBundle(n, course.id, repo), restored = await prepareNotebookBundle(backup)
  expect(restored.kind).toBe('backup')
  if (restored.kind !== 'backup') throw new Error('Expected backup')
  expect(restored.notebook.originalRaw).toBe(raw)
  expect(restored.notebook.current).toEqual(n.current)
  expect(restored.notebook.notes).toBe(n.notes)
  const target = center(), original = await prepareNotebook(restored.notebook.originalRaw)
  await commitNotebookAssets({ prepared: restored.assets, repository: repo, assertFresh: () => undefined, commit: () => { restoreCompleteNotebookBackup(target, course, restored.notebook, original, true); return { committed: true } } })
  expect(exportNotebook(target.lectures[0], 'original')).toBe(raw)
  const members = await readNotebookZip(backup), envelope = JSON.parse(new TextDecoder().decode(members.get('notebook.json')))
  envelope.notebook.current.entries[0].sections[0].blocks[0].columns[0] = ''
  members.set('notebook.json', new TextEncoder().encode(JSON.stringify(envelope)))
  await expect(prepareNotebookBundle(writeNotebookZip(members))).rejects.toThrow('Stored notebook content differs')
})

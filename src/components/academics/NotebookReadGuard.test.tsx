import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ExternalNotebookView } from './ExternalNotebookView'
import { NotebookReadGuard } from './NotebookReadGuard'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import type { LectureRecord } from '@/lib/types'
import { createInitialDataForMode, snapshotData, useStore } from '@/store/store'

let root: Root, container: HTMLDivElement
function fixture(): LectureRecord {
  const legacy = revisionFixture()
  const pkg: NotebookPackage = { ...legacy, version: 4, instructionsVersion: 'notebook-workflows-draft-4', assets: [], visualReview: { candidates: [], sources: legacy.sources.map(s => ({ sourceId: s.id, discovery: 'complete', imageState: 'none-found', inspectedPortions: ['Fictional test'], unprocessedPortions: [], limitations: [] })) } }
  const paragraph = pkg.entries[0].sections[0].blocks[0]
  Object.assign(paragraph, { more: 'The full fictional explanation.' })
  const raw = JSON.stringify(pkg)
  return { id: 'guard-demo', courseId: 'demo', title: 'Fictional notebook', inputPath: 'materials', processingState: 'ready', createdAt: 1, updatedAt: 1, order: 0, importedNotebook: {
    current: pkg, original: structuredClone(pkg), originalRaw: raw, acceptedRaw: raw, entryId: pkg.entries[0].id, fingerprint: 'fictional', importedAt: 1, notes: 'Protected notes', progress: { question: { response: 'Protected answer', complete: true } },
    history: [{ id: 'history', current: structuredClone(pkg), savedAt: 1, reason: 'edit', notes: 'Historical note', progress: {}, acceptedRaw: raw }],
    updateSession: { id: 'session', localId: 'guard-demo', createdAt: 1, baseline: structuredClone(pkg) },
    assetLineageId: 'lineage', assetBindings: [{ assetId: 'retained-history-image', sha256: 'a'.repeat(64), byteLength: 42, mimeType: 'image/png', width: 1, height: 1 }],
  } }
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
it.each(['unknown optional field', 'missing required field'] as const)('keeps %s intact and offers recovery before mounting edit/update controls', async fault => {
  const lecture = fixture(), current = lecture.importedNotebook!.current
  const block = current.entries[0].sections[0].blocks[0]
  if (fault === 'unknown optional field') Object.assign(block, { futureDetail: 'Preserve this unsupported content.' })
  else delete (block as unknown as { text?: string }).text
  const state = createInitialDataForMode(false); state.academics.classCenter.lectures = [lecture]
  useStore.getState().replaceAll(state)
  const stored = useStore.getState().academics.classCenter.lectures[0]
  const before = JSON.stringify(snapshotData()), key = useStore.persist.getOptions().name!, disk = localStorage.getItem(key)
  await act(async () => root.render(<ExternalNotebookView lecture={stored} courseCode="DEMO" />))
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Nothing was changed')
  expect(container.textContent).toContain(fault === 'unknown optional field' ? 'Unrecognized field' : 'Required field is missing')
  expect(container.textContent).not.toContain('Update this notebook'); expect(container.textContent).not.toContain('Edit entry')
  const download = vi.fn()
  await act(async () => root.render(<NotebookReadGuard lecture={stored} downloadRecovery={download}><p>Must not mount</p></NotebookReadGuard>))
  await act(async () => container.querySelector<HTMLButtonElement>('button')!.click())
  expect(JSON.parse(download.mock.calls[0][0]).notebook).toEqual(stored.importedNotebook)
  expect(container.textContent).not.toContain('Must not mount')
  expect(JSON.stringify(snapshotData())).toBe(before); expect(localStorage.getItem(key)).toBe(disk)
})
it('renders supported detail normally and rechecks a replacement record after a blocked render', async () => {
  const lecture = fixture(), broken = structuredClone(lecture)
  Object.assign(broken.importedNotebook!.current.entries[0].sections[0].blocks[0], { futureDetail: 'Unsupported' })
  await act(async () => root.render(<ExternalNotebookView lecture={broken} courseCode="DEMO" />))
  expect(container.querySelector('[role="alert"]')).toBeTruthy()
  await act(async () => root.render(<ExternalNotebookView lecture={lecture} courseCode="DEMO" />))
  expect(container.querySelector('[aria-label="Notebook unavailable"]')).toBeNull()
  expect(container.textContent).toContain('The full fictional explanation.')
  expect(container.textContent).toContain('Update this notebook')
})

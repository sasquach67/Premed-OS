import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { ReadingSummaryDialog } from './ReadingSummaryDialog'
import { generateReadingSummary } from '@/lib/academics/generateReadingSummary'
import { createSeedData } from '@/data/seed'
import { snapshotData, useStore } from '@/store/store'
import type { AcademicFile, SourceChunk } from '@/lib/types'
vi.mock('@/lib/academics/generateReadingSummary', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/academics/generateReadingSummary')>(), generateReadingSummary: vi.fn() }))
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root, container: HTMLDivElement
let reading: AcademicFile
beforeEach(async () => {
  vi.clearAllMocks()
  const seed = structuredClone(createSeedData())
  const courseId = seed.courses[0].id
  reading = { id: 'selected-reading', courseId, title: 'A reading about care', type: 'reading', sourceType: 'paste', owner: 'mine', linkedTopicIds: [], createdAt: 1, updatedAt: 1, order: 0 }
  seed.academics.classCenter.files = [reading, { ...reading, id: 'lecture', title: 'Instructor notes', type: 'transcript' }]
  seed.academics.classCenter.sourceChunks = seed.academics.classCenter.files.map(file => ({ id: `${file.id}-chunk`, fileId: file.id, courseId, content: 'The author contrasts two understandings of care.', order: 0, coveredByKeyPoint: false, createdAt: 1, updatedAt: 1 } as SourceChunk))
  useStore.getState().replaceAll(seed)
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  await act(async () => root.render(<ReadingSummaryDialog reading={reading} courseLabel="ANTH" data={seed.academics.classCenter} open onOpenChange={() => {}} />))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove() })
const button = () => [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === 'Summarize for class')!
it('requires a reading kind, carries context and focus, then saves a reopenable summary', async () => {
  expect(button().disabled).toBe(true)
  await act(async () => document.querySelector<HTMLInputElement>('input[value="assigned-reading"]')!.click())
  await act(async () => {
    const textarea = document.querySelector('textarea')!
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, 'Compare forms of authority')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('summary')!.click()
  })
  await act(async () => document.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click())
  const artifact = { specId: 'reading-summary-v1', specHash: 'hash', courseId: reading.courseId!, topicId: 'scope', sections: [{ id: 'argument', title: 'Care depends on who defines it', blocks: [{ id: 'b1', type: 'prose' as const, provenance: 'source' as const, text: { content: 'A source-backed explanation.' } }] }] }
  vi.mocked(generateReadingSummary).mockResolvedValue({ ok: true, title: 'Generated reading summary', content: 'A source-backed explanation.', artifact, fileIds: [reading.id, 'lecture'], auditStatus: 'skipped' })
  await act(async () => button().click())
  expect(generateReadingSummary).toHaveBeenCalledWith(expect.objectContaining({ reading, kind: 'assigned-reading', focus: 'Compare forms of authority', contextFileIds: ['lecture'] }))
  const saved = useStore.getState().academics.classCenter.notes.find(note => note.readingSummary)
  expect(saved?.readingSummary?.artifact).toEqual(artifact)
  expect(saved?.linkedFileIds).toEqual([reading.id, 'lecture'])
  expect(document.body.textContent).toContain('Saved in Materials')
  const snapshot = snapshotData()
  await act(async () => useStore.getState().replaceAll(snapshot))
  expect(useStore.getState().academics.classCenter.notes.find(note => note.id === saved?.id)?.readingSummary?.focus).toBe('Compare forms of authority')
})
it('keeps the selection available without saving output after generation fails', async () => {
  const count = useStore.getState().academics.classCenter.notes.length
  await act(async () => document.querySelector<HTMLInputElement>('input[value="primary-research"]')!.click())
  vi.mocked(generateReadingSummary).mockResolvedValue({ ok: false, message: 'Provider unavailable' })
  await act(async () => button().click())
  expect(document.querySelector('[role="alert"]')?.textContent).toBe('Provider unavailable')
  expect(document.querySelector<HTMLInputElement>('input[value="primary-research"]')!.checked).toBe(true)
  expect(button().disabled).toBe(false)
  expect(useStore.getState().academics.classCenter.notes).toHaveLength(count)
})

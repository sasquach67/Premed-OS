import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { changedNotebookSections, changedTextParts, NotebookComparison } from './NotebookComparison'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import { NotebookImportPreview } from './NotebookImportPreview'
let container: HTMLDivElement, root: Root
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(async () => { await act(async () => root.unmount()); container.remove() })
it('preserves every proposed word while distinguishing insertion from replacement', () => {
  const inserted = changedTextParts('A cell divides.', 'A normal cell divides.')
  expect(inserted.map(part => part.text).join('')).toBe('A normal cell divides.')
  expect(inserted.some(part => part.change === 'added' && part.text.includes('normal'))).toBe(true)
  const edited = changedTextParts('Cdk activates Rb.', 'Cdk inhibits Rb.')
  expect(edited.map(part => part.text).join('')).toBe('Cdk inhibits Rb.')
  expect(edited.some(part => part.change === 'edited' && part.text.includes('inhibits'))).toBe(true)
})
it('shows a precise change list and section statuses without side-by-side JSON', async () => {
  const before = revisionFixture(), after = structuredClone(before), entry = after.entries[0]
  const first = entry.sections[0].blocks[0]
  if (first.type !== 'paragraph') throw Error('Fixture changed')
  first.text += ' Additional supported detail.'
  entry.sections.push({ id: 'new-section', title: 'New source detail', purpose: 'study-guide', blocks: [{ ...structuredClone(first), id: 'new-source-detail', text: 'Additional supported detail.' }] })
  const statuses = changedNotebookSections(before, after, entry.id)
  expect(statuses[entry.sections[0].id]).toBe('changed'); expect(statuses['new-section']).toBe('added')
  await act(async () => root.render(<NotebookComparison before={before} after={after} entryId={entry.id} />))
  expect(container.querySelector('.nr-change-list')).not.toBeNull()
  expect(container.querySelectorAll('.en-diff-columns')).toHaveLength(0)
  expect(container.querySelector('mark[data-change="added"]')).not.toBeNull()
  expect(container.querySelector('[data-status="Added"]')?.textContent).toContain('New source detail')
})
it('opens the full preview without mutating its content', async () => {
  await act(async () => root.render(<NotebookImportPreview><p>Complete notebook content.</p></NotebookImportPreview>))
  await act(async () => container.querySelector<HTMLButtonElement>('button')!.click())
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Complete notebook content.')
  const description=document.querySelector('[role="dialog"]')?.getAttribute('aria-describedby')
  expect(description).toBeTruthy();expect(document.getElementById(description!)?.textContent).toContain('close this preview to save')
  expect(container.querySelector('.en-notebook-preview-scroll')?.textContent).toBe('Complete notebook content.')
})
it('highlights updated preview text and matches records by ID after reordering', async () => {
  const before = revisionFixture(), after = structuredClone(before), section = after.entries[0].sections[0]
  const block = section.blocks[0]
  if (block.type !== 'paragraph') throw Error('Fixture changed')
  block.text += ' New supported wording.'
  after.entries[0].sections.reverse()
  const { NotebookTextChanges } = await import('./NotebookTextChanges')
  const { NotebookPackageView } = await import('./ExternalNotebookView')
  await act(async () => root.render(<NotebookTextChanges before={before} after={after}><NotebookPackageView pkg={after} sectionChanges={changedNotebookSections(before, after, after.entries[0].id)} /></NotebookTextChanges>))
  expect(container.querySelector('[data-change-status="changed"]')).not.toBeNull()
  expect([...container.querySelectorAll('mark[data-change="added"]')].some(mark => mark.textContent?.includes('New supported wording.'))).toBe(true)
})

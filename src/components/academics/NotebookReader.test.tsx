import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NotebookPackageView } from './ExternalNotebookView'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
let container: HTMLDivElement, root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function show(pkg: NotebookPackage, mode: 'study' | 'practice' | 'sources' | 'all' = 'study', change?: (path: (string | number)[], value: string | null) => void) {
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={pkg.entries[0].id} mode={mode} reader={!change} change={change} />))
}
it('groups sources once per teaching section and reveals inline markers only for that section', async () => {
  const pkg = revisionFixture()
  for (const section of pkg.entries[0].sections) for (const block of section.blocks) if (block.type === 'paragraph') block.text = `[Source: ${block.sourceIds[0]} p.3.] ${block.text}`
  const original = JSON.stringify(pkg)
  await show(pkg)
  expect(container.querySelectorAll('.nbr-srcpanel')).toHaveLength(2)
  expect(container.querySelectorAll('.en-section>.en-eyebrow')).toHaveLength(0)
  const sections = [...container.querySelectorAll('.en-section')]
  expect(sections.every(section => section.querySelector('.nbr-prov') === null)).toBe(true)
  const disclosure = sections[0].querySelector<HTMLDetailsElement>('.nbr-srcpanel')!
  expect(disclosure.open).toBe(false)
  const toggle = disclosure.querySelector<HTMLButtonElement>('.nbr-provtoggle')!
  expect(toggle.closest('details')).toBe(disclosure)
  await act(async () => { disclosure.querySelector('summary')!.click(); toggle.click() })
  expect(sections[0].querySelector('.nbr-prov')!.textContent).toContain('[Source: source-mapping p.3.]')
  expect(sections[1].querySelector('.nbr-prov')).toBeNull()
  await act(async () => sections[0].querySelector<HTMLButtonElement>('.nbr-cite')!.click())
  expect(disclosure.open).toBe(true)
  expect(disclosure.querySelectorAll('[data-highlight=true]')).toHaveLength(1)
  expect(JSON.parse(disclosure.querySelector('blockquote')!.getAttribute('data-blocks')!)).toEqual(['explain-mapping'])
  expect(JSON.stringify(pkg)).toBe(original)
})
it('keeps unknown brackets, consequential limits and annotation-only notes visible', async () => {
  const pkg = revisionFixture(), block = pkg.entries[0].sections[0].blocks[0]
  if (block.type !== 'paragraph') throw new Error('Fixture changed')
  block.text = '[An unrecognized bracket note.] Teaching stays visible.'
  await show(pkg); expect(container.querySelector('.en-block-paragraph>p.en-text')!.textContent).toBe(block.text)
  block.text = '[Source: source-mapping p.3; this is uncertain.] Teaching stays visible.'
  await show(pkg)
  expect(container.querySelector('.nbr-qualification')!.textContent).toContain('This is uncertain.')
  expect(container.querySelector('.en-block-paragraph>p.en-text')!.textContent).toBe('Teaching stays visible.')
  expect(container.querySelector('.nbr-reference-notes')!.textContent).toContain('[Source: source-mapping p.3; this is uncertain.]')
  block.text = '[Evidence limit: source-mapping p.3.] Teaching stays visible.'
  await show(pkg); expect(container.querySelector('.nbr-qualification')!.textContent).toContain('The available source evidence is limited for this point.')
  expect(container.querySelector('.nbr-reference-notes')!.textContent).toContain('[Evidence limit: source-mapping p.3.]')
  block.text = '[Source: source-mapping p.3.]'
  await show(pkg)
  const section = container.querySelector('.en-section')!
  expect(section.querySelector('.en-block-paragraph')).toBeNull()
  expect(section.querySelector('.nbr-reference-notes')!.textContent).toContain(block.text)
  await act(async () => { section.querySelector<HTMLElement>('.nbr-srcpanel>summary')!.click(); section.querySelector<HTMLButtonElement>('.nbr-provtoggle')!.click() })
  expect(section.querySelector('.nbr-prov')!.textContent).toBe(block.text)
  expect(section.querySelector('.en-block-paragraph>p.en-text')).toBeNull()
})
it('keeps every practice source panel and answer annotation inside its own closed answer reveal', async () => {
  const pkg = revisionFixture()
  for (const section of pkg.entries[0].sections) for (const block of section.blocks) if (block.type === 'practice') {
    block.answer += ` [Source: ${block.sourceIds[0]} p.3.]`
    block.rationale += ' [The numerical inputs are hypothetical.]'
  }
  await show(pkg, 'practice')
  expect(container.querySelectorAll('.nbr-objectives')).toHaveLength(1)
  expect(container.querySelectorAll('.en-block-practice')).toHaveLength(2)
  expect(container.querySelectorAll('.nbr-srcpanel')).toHaveLength(0)
  expect(container.querySelectorAll('.nbr-srcpanel-practice')).toHaveLength(2)
  for (const panel of container.querySelectorAll('.nbr-srcpanel-practice,.en-block-practice .nbr-prov,.en-block-practice .nbr-qualification')) expect(panel.closest<HTMLDetailsElement>('.en-answer')!.open).toBe(false)
  const answer = container.querySelector<HTMLDetailsElement>('.en-answer')!
  await act(async () => answer.querySelector('summary')!.click())
  expect(answer.open).toBe(true)
  expect(answer.querySelector('[data-reader-role="reasoning"]')!.textContent).toContain('[The numerical inputs are hypothetical.]')
  expect(answer.querySelector('.nbr-reference-notes')!.textContent).toContain('[Source: source-mapping p.3.]')
})
it('preserves mixed section teaching and practice independently in every goal', async () => {
  for (const goal of ['review', 'assessment', 'assignment'] as const) {
    const pkg = revisionFixture(), entry = pkg.entries[0]
    entry.goal = goal; entry.sections[0].purpose = 'workspace'
    entry.sections[0].blocks.push(entry.sections[1].blocks[0]); entry.sections.splice(1, 1)
    await show(pkg, 'study')
    expect(container.querySelectorAll('.en-block-paragraph')).toHaveLength(2)
    expect(container.querySelectorAll('.en-block-practice')).toHaveLength(0)
    await show(pkg, 'practice')
    expect(container.querySelectorAll('.en-block-practice')).toHaveLength(2)
    expect(container.querySelectorAll('.en-block-paragraph')).toHaveLength(0)
    expect(container.querySelectorAll('.nbr-srcpanel')).toHaveLength(0)
  }
})
it('opens hidden source ancestors, focuses a real heading and updates the shared TOC', async () => {
  await show(revisionFixture(), 'sources')
  const sources = container.querySelector<HTMLDetailsElement>('.en-sources')!
  await act(async () => sources.querySelector('summary')!.click())
  expect(sources.open).toBe(false)
  const links = container.querySelectorAll<HTMLButtonElement>('.reading-contents-link')
  await act(async () => links[1].click())
  expect(sources.open).toBe(true)
  expect(document.activeElement).toBe(sources.querySelectorAll('h3')[1])
  expect(links[1].getAttribute('aria-current')).toBe('location')
  expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  expect(container.querySelector('[aria-label="Jump to a section"]')).toBeTruthy()
})
it('binds the exact raw annotation string to the editor and keeps a default preview untransformed', async () => {
  const pkg = revisionFixture(), block = pkg.entries[0].sections[0].blocks[0]
  if (block.type !== 'paragraph') throw new Error('Fixture changed')
  block.text = '  [Source: source-mapping p.3.] Exact\n\nbody  '
  const before = JSON.stringify(pkg)
  await show(pkg, 'all', vi.fn())
  expect([...container.querySelectorAll('textarea')].some(field => field.value === block.text)).toBe(true)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} />))
  expect(container.querySelector('.en-block-paragraph>p.en-text')!.textContent).toBe(block.text)
  expect(JSON.stringify(pkg)).toBe(before)
})

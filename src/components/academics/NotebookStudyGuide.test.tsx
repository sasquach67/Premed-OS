import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NotebookPackageView } from './ExternalNotebookView'
import { guideTerms, sectionPracticeIds, prepareNotebookSummaryPrint } from './NotebookStudyGuide'
import { revisionFixture } from '@/lib/academics/notebook/revision.test-fixtures'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
let container: HTMLDivElement, root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
function fixture() {
  const pkg = revisionFixture(), entry = pkg.entries[0], section = entry.sections[0]
  const identity = { sourceIds: section.blocks[0].sourceIds, excerptIds: section.blocks[0].excerptIds, provenance: 'source' as const }
  section.learningObjectiveIds = [entry.objectives[0].id]
  section.blocks = [
    { ...identity, id: 'question', type: 'callout', tone: 'question', text: 'How do cells divide?' },
    { ...identity, id: 'map', type: 'study-diagram', kind: 'hierarchy', title: 'Regulators', nodes: [{ ...identity, id: 'root', label: 'Regulators', assetIds: [], tone: 'neutral' }, { ...identity, id: 'cyclin', label: 'Cyclin', assetIds: [], tone: 'stimulatory', targetBlockId: 'terms' }], edges: [{ ...identity, id: 'edge', label: 'contains', assetIds: [], from: 'root', to: 'cyclin', relation: 'contains' }] },
    { ...identity, id: 'terms', type: 'bullets', items: ['**Cyclin** is a cell-cycle regulator.'], nestedItems: [{ parentIndex: 0, items: ['**Cdk** phosphorylates a target.'] }], definedTerms: [{ term: 'Cyclin', definition: 'A protein that activates a Cdk.' }, { term: 'Cdk', definition: 'A cyclin-dependent kinase.' }], stressed: true },
    { ...identity, id: 'one', type: 'callout', tone: 'one-thing', text: 'Cyclin controls Cdk activity.' },
  ]
  return pkg
}
async function show(pkg: NotebookPackage, options = {}) { await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={pkg.entries[0].id} mode="study" reader {...options} />)) }
it('renders defined terms safely, nests children, opens a definition and builds a deduplicated glossary', async () => {
  const pkg = fixture(), before = JSON.stringify(pkg)
  await show(pkg)
  expect(container.querySelector('.en-block-bullets ul ul')?.textContent).toContain('Cdk')
  expect(container.querySelector('.nsg-stressed')?.textContent).toBe('Professor stressed')
  expect(container.querySelectorAll('.nsg-glossary dt')).toHaveLength(2)
  const term = container.querySelector<HTMLButtonElement>('[aria-label="Define Cyclin"]')!
  await act(async () => term.click())
  expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain('A protein that activates a Cdk.')
  await act(async () => term.click())
  expect(JSON.stringify(pkg)).toBe(before)
  expect(guideTerms(pkg.entries[0]).map(term => term.term)).toEqual(['Cdk', 'Cyclin'])
})
it('jumps a map target to its local block, shows official objective wording and links only available practice', async () => {
  const pkg = fixture(), onCheckPractice = vi.fn()
  await show(pkg, { onCheckPractice })
  const target = container.querySelector<HTMLElement>('[data-guide-block="terms"]')!
  await act(async () => container.querySelector<HTMLAnchorElement>('.nsg-node[href]')!.click())
  expect(document.activeElement).toBe(target)
  expect(target.scrollIntoView).toHaveBeenCalled()
  expect(container.querySelector('.nsg-lo-chips')?.textContent).toContain(pkg.entries[0].objectives[0].title)
  await act(async () => container.querySelector<HTMLButtonElement>('.nsg-check')!.click())
  expect(onCheckPractice).toHaveBeenCalledWith(sectionPracticeIds(pkg.entries[0], pkg.entries[0].sections[0]))
  expect(container.querySelectorAll('.en-block-practice')).toHaveLength(0)
})
it('summary includes maps, one-thing lines and glossary without teaching paragraphs or practice answers', async () => {
  const pkg = fixture()
  await show(pkg, { summary: true })
  expect(container.querySelectorAll('.nsg-summary .nsg-map')).toHaveLength(1)
  expect(container.querySelector('.nsg-summary')?.textContent).toContain('Cyclin controls Cdk activity.')
  expect(container.querySelectorAll('.nsg-summary .nsg-glossary dt')).toHaveLength(2)
  expect(container.querySelectorAll('.en-block-bullets,.en-block-practice,.nbr-aside')).toHaveLength(0)
})
it('legacy fixtures retain plain text and old contents with no new guide surfaces', async () => {
  const pkg = revisionFixture()
  await show(pkg)
  expect(container.querySelector('.nsg-map,.nsg-callout,.nsg-glossary,.nsg-term,.nsg-lo-chips')).toBeNull()
  expect(container.querySelector('.nbr-aside')?.textContent).toContain("What's covered and missing")
})
it('filters practice to selected block IDs while retaining the original package', async () => {
  const pkg = revisionFixture(), before = JSON.stringify(pkg), ids = pkg.entries[0].sections.flatMap(section => section.blocks).filter(block => block.type === 'practice').map(block => block.id)
  await show(pkg, { mode: 'practice', practiceFilter: [ids[0]] })
  expect(container.querySelectorAll('.en-block-practice')).toHaveLength(1)
  expect(container.querySelector('[data-guide-block]')?.getAttribute('data-guide-block')).toBe(ids[0])
  expect(JSON.stringify(pkg)).toBe(before)
})
it('keeps unrelated practice sections out of filtered contents and preserves non-tree map relationships', async () => {
  const pkg = revisionFixture(), ids = pkg.entries[0].sections.flatMap(section => section.blocks).filter(block => block.type === 'practice').map(block => block.id)
  await show(pkg, { mode: 'practice', practiceFilter: [ids[0]] })
  const excluded = pkg.entries[0].sections.find(section => section.blocks.some(block => block.type === 'practice' && block.id === ids[1]))!
  expect(container.querySelector('.reading-contents-list')?.textContent).not.toContain(excluded.title)
  const guide = fixture(), map = guide.entries[0].sections[0].blocks[1]
  if (map.type !== 'study-diagram') throw new Error('Fixture changed')
  map.kind = 'concept-map'; map.edges.push({ ...map.edges[0], id: 'return', from: 'cyclin', to: 'root', label: 'feeds back', relation: 'association' })
  await show(guide, { summary: true })
  expect(container.querySelector('.nbr-diagram-relationships')?.textContent).toContain('feeds back')
  expect(container.querySelectorAll('.nbr-diagram-relationships li')).toHaveLength(2)
})

it('prepares a separate complete print sheet and leaves the on-screen summary unchanged', async () => {
  await show(fixture(), { summary: true })
  const original = container.innerHTML, page = prepareNotebookSummaryPrint()!
  expect(page.parentElement).toBe(document.body)
  expect(page.querySelectorAll('.nsg-glossary dt')).toHaveLength(2)
  expect(page.querySelectorAll('.nsg-map')).toHaveLength(1)
  expect(page.querySelector('[data-tone="one-thing"]')).not.toBeNull()
  expect(container.innerHTML).toBe(original)
  expect((page.firstElementChild as HTMLElement).style.transform).toBe('scale(1)')
  page.remove()
})

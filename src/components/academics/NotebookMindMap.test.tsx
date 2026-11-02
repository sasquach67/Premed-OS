import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import repertoire from '@/lib/academics/notebook/visual-fixtures/valid-v4-repertoire.json'
import type { NotebookBlock, NotebookEntry, NotebookPackage } from '@/lib/academics/notebook/types'
import { NotebookMindMap, mindMapSections } from './NotebookMindMap'
import { NotebookPackageView } from './ExternalNotebookView'

let host: HTMLDivElement, root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals() })

const common = { sourceIds: [], excerptIds: [], provenance: 'background' as const }
const blocks: NotebookBlock[] = [
  { ...common, id: 'q', type: 'callout', tone: 'question', text: 'Why does the route change?' },
  { ...common, id: 'l', type: 'paragraph', role: 'lede', text: 'Because the junction sorts arrivals.' },
  { ...common, id: 'w', type: 'walkthrough', items: [{ point: 'Arrivals are sorted.', paragraphs: ['Each carries a marker.'] }, { point: 'Branches differ.', paragraphs: ['They end apart.'], cards: [{ label: 'North', text: 'The depot.' }], note: { label: 'Easy to mix up', text: 'Easy to mix up: The marker is read once.' } }] },
  { ...common, id: 'k', type: 'callout', tone: 'one-thing', text: 'The marker sets the route.', definedTerms: [{ term: 'marker', definition: 'a type tag' }] },
] as NotebookBlock[]
const entry = (sections: unknown[]) => ({ id: 'e', title: 'Lesson', sections }) as unknown as NotebookEntry
const teach = entry([
  { id: 's1', title: 'The route', purpose: 'study-guide', blocks },
  { id: 'overview', title: 'Tie it together', purpose: 'study-guide', blocks: [{ ...common, id: 'st', type: 'steps', items: [{ text: 'First.', reason: 'Because.' }, 'Second.'] }, { ...common, id: 'g', type: 'gap', text: 'Figure missing.', nextStep: 'Upload it.' }] },
  { id: 'p', title: 'Practice only', purpose: 'practice', blocks: [{ ...common, id: 'pq', type: 'practice', prompt: 'x', answer: 'y', rationale: 'z' }] },
])

it('keeps every study block written out, and leaves practice to its own tab', async () => {
  await act(async () => root.render(<NotebookMindMap entry={teach} renderBlock={block => <div>{block.id}</div>} />))
  const text = host.textContent ?? ''
  for (const words of ['Why does the route change?', 'Because the junction sorts arrivals.', 'Arrivals are sorted.', 'Each carries a marker.', 'The depot.', 'The marker is read once.', 'The marker sets the route.', 'A type tag', 'First.', 'Because.', 'Second.', 'Figure missing. Upload it.']) expect(text).toContain(words)
  expect(text).not.toContain('Practice only')
  expect(host.querySelectorAll('.nmm-topic')).toHaveLength(2)
  expect(host.querySelector('.sg-note[data-label="Easy to mix up"]')).not.toBeNull()
})

it('numbers points across a section so reading order survives the columns', () => {
  const [section] = mindMapSections(teach, () => null)
  expect(section.items.map(item => item.kind).slice(0, 3)).toEqual(['question', 'lede', 'block'])
  expect(section.items.filter(item => item.key.startsWith('w-')).map(item => item.key)).toEqual(['w-0', 'w-1'])
})

it('keeps the written order in an older notebook with no walkthroughs', () => {
  const older = entry([{ id: 'old', title: 'Old', purpose: 'study-guide', blocks: [{ ...common, id: 'a', type: 'paragraph', text: 'One' }, { ...common, id: 'b', type: 'table', columns: ['x'], rows: [['y']] }, { ...common, id: 'c', type: 'paragraph', text: 'Two' }] }])
  const [section] = mindMapSections(older, () => null)
  expect(section.items.map(item => item.key)).toEqual(['a', 'b', 'c'])
  expect(section.hub).toBe(true)
})

it('blurs writing in recall until tapped, and counts what was revealed', async () => {
  await act(async () => root.render(<NotebookMindMap entry={teach} renderBlock={block => <div>{block.id}</div>} />))
  const button = (label: string) => host.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!
  await act(async () => button('Recall mode').click())
  expect(host.querySelector('.nmm')?.classList).toContain('nmm-recall')
  const block = host.querySelector<HTMLElement>('.nmm-block:not(.nmm-question)')!
  await act(async () => block.click())
  expect(block.classList).toContain('nmm-shown')
  expect(host.querySelector('.nmm-count')?.textContent?.startsWith('1/')).toBe(true)
  await act(async () => button('Recall mode').click())
  expect(host.querySelector('.nmm-shown')).toBeNull()
})

it('shows a new render on a parent update without moving the camera, and frames a new notebook', async () => {
  const plain = entry([{ id: 'old', title: 'Old', purpose: 'study-guide', blocks: [{ ...common, id: 'a', type: 'paragraph', text: 'One' }] }])
  await act(async () => root.render(<NotebookMindMap entry={plain} renderBlock={block => <div>before {block.id}</div>} />))
  const camera = () => host.querySelector<HTMLElement>('.nmm-world')!.style.transform
  const framed = camera()
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Zoom in"]')!.click())
  const zoomed = camera()
  expect(zoomed).not.toBe(framed)
  await act(async () => root.render(<NotebookMindMap entry={plain} renderBlock={block => <div>after {block.id}</div>} />))
  expect(host.textContent).toContain('after a')
  expect(host.textContent).not.toContain('before a')
  expect(camera()).toBe(zoomed)
  await act(async () => root.render(<NotebookMindMap entry={structuredClone(plain)} renderBlock={block => <div>after {block.id}</div>} />))
  expect(camera()).toBe(framed)
})

it('renders the real package in the reader only for the study guide', async () => {
  const pkg = structuredClone(repertoire) as unknown as NotebookPackage, id = pkg.entries[0].id
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={id} mode="study" reader guideView="map" />))
  expect(host.querySelector('.nmm')).not.toBeNull()
  expect(host.querySelector('.nbr-layout')).toBeNull()
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={id} mode="practice" reader guideView="map" />))
  expect(host.querySelector('.nmm')).toBeNull()
  await act(async () => root.render(<NotebookPackageView pkg={pkg} entryId={id} mode="study" reader guideView="standard" />))
  expect(host.querySelector('.nmm')).toBeNull()
})

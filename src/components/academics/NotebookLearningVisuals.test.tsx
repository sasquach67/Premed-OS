import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import fixture from '@/lib/academics/notebook/visual-fixtures/valid-v4-repertoire.json'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import { parsePortableNotebook } from '@/lib/academics/notebook/visualPackage'
import { NotebookPackageView } from './ExternalNotebookView'
import { readFileSync } from 'node:fs'
import { URL as NodeURL } from 'node:url'

const readerCss = readFileSync(new NodeURL('./externalNotebook.css', import.meta.url), 'utf8')
const visualCss = readFileSync(new NodeURL('./notebookLearningVisuals.css', import.meta.url), 'utf8')

let root: Root, container: HTMLDivElement
const fresh = () => structuredClone(fixture) as NotebookPackage
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks() })
async function show(pkg: NotebookPackage, change?: (path: (string | number)[], value: string | null) => void) {
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="study" change={change} />))
}

it('isolates native visual lists from ordinary prose rules in both saved reader and import preview', async () => {
  const pkg = fresh(), source = pkg.entries[0].sections[0].blocks[0]
  pkg.entries[0].sections[0].blocks.push(
    { id: 'style-prose-bullets', type: 'bullets', provenance: source.provenance, sourceIds: source.sourceIds, excerptIds: source.excerptIds, items: ['Ordinary prose bullet'] },
    { id: 'style-prose-steps', type: 'steps', provenance: source.provenance, sourceIds: source.sourceIds, excerptIds: source.excerptIds, items: ['Ordinary prose step'] },
  )
  const proseRules = [...readerCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector]) => /\.en-block\s+(ul|ol)\b|\.nbr-doc li.*::marker/.test(selector))
  expect(proseRules).toHaveLength(4)
  const selectors = proseRules.flatMap(([, selector]) => selector.trim().split(',').map(part => part.replace('::marker', '').trim()))
  const required = ['.nbr-tree ul', '.nbr-tree-children', '.nbr-axis-items', '.nbr-annotation-legend', '.nbr-sequence-steps', '.nbr-worked-example .nbr-worked-steps']
  const visualRules = [...visualCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const listRules = required.map(selector => visualRules.find(([, current]) => current.trim() === selector)!)
  const style = document.createElement('style')
  // Exercise the actual conflicting rules, without pretending JSDOM evaluates container layout.
  style.textContent = [...listRules, ...proseRules].map(rule => rule[0]).join('\n')
  document.head.append(style)
  try {
    for (const reader of [true, false]) {
      await act(async () => root.render(<NotebookPackageView pkg={pkg} reader={reader} mode="study" />))
      const lists = [...container.querySelectorAll<HTMLElement>('.nbr-learning-visual ul,.nbr-learning-visual ol')]
      expect(lists.length).toBeGreaterThan(10)
      for (const list of lists) for (const selector of selectors) expect(list.matches(selector), `${list.className} must not match ${selector}`).toBe(false)
      for (const item of container.querySelectorAll('.nbr-learning-visual li')) expect(item.matches('.nbr-doc li:not(:where(.nbr-learning-visual *))')).toBe(false)
      expect(selectors.some(selector => container.querySelector('.en-block-bullets ul')!.matches(selector))).toBe(true)
      expect(selectors.some(selector => container.querySelector('.en-block-steps ol')!.matches(selector))).toBe(true)
      for (const list of container.querySelectorAll<HTMLElement>('.nbr-axis-items,.nbr-annotation-legend,.nbr-sequence-steps')) {
        expect(getComputedStyle(list).display).toBe('grid')
        expect(getComputedStyle(list).listStyle).toBe('none')
        expect(getComputedStyle(list).paddingLeft).toBe('0px')
        expect(getComputedStyle(list).maxWidth).not.toBe('var(--nbr-measure)')
      }
      const branch = container.querySelector<HTMLElement>('.nbr-tree-decision-tree .nbr-tree-children')!
      expect(getComputedStyle(branch).display).toBe('grid')
      expect(getComputedStyle(branch).listStyle).toBe('none')
    }
    expect(visualCss).toContain('@container (max-width: 560px)')
    expect(visualCss).toContain('.nbr-tree-children { display: block;')
  } finally { style.remove() }
})

it('renders the full repertoire as native blocks with readable authored diagram relationships', async () => {
  const pkg = fresh(); await show(pkg)
  for (const type of ['table', 'annotated-figure', 'timeline', 'venn', 'sequence-strip', 'worked-example', 'continuum']) expect(container.querySelector(`.en-block-${type}`), type).not.toBeNull()
  const diagrams = pkg.entries[0].sections.flatMap(section => section.blocks).filter(block => block.type === 'study-diagram')
  const rendered = [...container.querySelectorAll('.en-block-study-diagram')]
  expect(rendered).toHaveLength(3)
  diagrams.forEach((diagram, index) => {
    expect(rendered[index].querySelector('ul,ol')).not.toBeNull()
    for (const node of diagram.nodes) expect(rendered[index].textContent).toContain(node.label)
    for (const edge of diagram.edges) expect(rendered[index].textContent).toContain(edge.label)
  })
  expect(container.querySelector('.nbr-worked-example h4 p')).toBeNull()
})

it('keeps worked steps, answer, check, and source evidence inside the closed solution reveal', async () => {
  const pkg = fresh(); await show(pkg)
  const worked = container.querySelector('.en-block-worked-example')!
  const reveal = worked.querySelector<HTMLDetailsElement>('.nbr-reveal')!
  expect(reveal.open).toBe(false)
  expect(reveal.querySelectorAll('.nbr-worked-steps li').length).toBeGreaterThan(0)
  expect(reveal.querySelector('.nbr-worked-answer')).not.toBeNull()
  expect(reveal.querySelector('.nbr-srcpanel-practice')).not.toBeNull()
  expect(worked.closest('.en-section')!.querySelector('.nbr-srcpanel')).toBeNull()
  expect(worked.querySelector('.nbr-block-foot')).toBeNull()
  await act(async () => reveal.querySelector('summary')!.click())
  expect(reveal.open).toBe(true)
})

it('keeps unavailable source images explicit and does not substitute a generated image', async () => {
  await show(fresh())
  const annotation = container.querySelector('.en-block-annotated-figure')!
  expect(annotation.querySelector('img')).toBeNull()
  expect(annotation.textContent).toMatch(/unavailable|missing|loading/i)
})

it('preserves null while clearing caption, time label, and worked check through the actual editor callbacks', async () => {
  const pkg = fresh(), changes: { path: (string | number)[]; value: string | null }[] = []
  await show(pkg, (path, value) => {
    changes.push({ path, value })
    let target: unknown = pkg
    for (const key of path.slice(0, -1)) target = (target as Record<string | number, unknown>)[key]
    ;(target as Record<string | number, unknown>)[path.at(-1)!] = value
  })
  const fields = [...container.querySelectorAll<HTMLTextAreaElement>('textarea')]
  const caption = fields.find(field => field.closest('.en-block-annotated-figure') && /caption/i.test(field.closest('label')!.textContent ?? ''))!
  const timeLabel = fields.find(field => field.closest('.en-block-timeline') && /time label/i.test(field.closest('label')!.textContent ?? ''))!
  const check = fields.find(field => field.closest('.en-block-worked-example') && /worked example check/i.test(field.closest('label')!.textContent ?? ''))!
  for (const field of [caption, timeLabel, check]) {
    expect(field).toBeTruthy()
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, '')
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  expect(changes).toHaveLength(3)
  expect(changes.map(change => change.path.at(-1))).toEqual(['caption', 'timeLabel', 'check'])
  expect(changes.every(change => change.value === null)).toBe(true)
  const reloaded = parsePortableNotebook(JSON.stringify(pkg))
  await show(reloaded)
  expect(container.querySelector('.en-block-worked-example')!.textContent).not.toContain('Worked example check')
})

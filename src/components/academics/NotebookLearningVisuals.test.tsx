import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import fixture from '@/lib/academics/notebook/visual-fixtures/valid-v4-repertoire.json'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import { parsePortableNotebook } from '@/lib/academics/notebook/visualPackage'
import { NotebookPackageView } from './ExternalNotebookView'

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

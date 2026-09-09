import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import fixture from '@/lib/academics/notebook/fixtures/fixture-review.json'
import { NotebookPackageView } from './ExternalNotebookView'

let root: Root, container: HTMLDivElement
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove() })

function titleFixture() {
  const pkg = structuredClone(fixture) as NotebookPackage, template = pkg.entries[0].objectives[0]
  // Deliberate display fixtures, not new authored course material or import-validation cases.
  pkg.entries[0].objectives = [
    { ...structuredClone(template), id: 'display-derived', origin: 'derived', title: 'Study objective: Explain how psychologists use evidence.' },
    { ...structuredClone(template), id: 'display-official', origin: 'official', title: "Study objective: Keep the instructor's exact wording." },
  ]
  return pkg
}
const headings = () => [...container.querySelectorAll('.nbr-objective-title')].map(element => element.textContent)
const titleFields = () => [...container.querySelectorAll('label')].filter(label => label.firstChild?.textContent === 'Objective title').map(label => label.querySelector('textarea')!)

it.each([true, false])('omits only the derived prefix in read-only reader=%s without changing any package text', async reader => {
  const pkg = titleFixture(), raw = JSON.stringify(pkg)
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader={reader} mode="all" />))
  expect(headings()).toEqual(['Explain how psychologists use evidence.', "Study objective: Keep the instructor's exact wording."])
  expect(JSON.stringify(pkg)).toBe(raw)
  expect(JSON.parse(raw).entries[0].objectives[0].title).toBe('Study objective: Explain how psychologists use evidence.')
})

it('preserves exact prefixed editor values through an edit and JSON roundtrip', async () => {
  const pkg = titleFixture(), originalTitles = pkg.entries[0].objectives.map(objective => objective.title)
  const change = (path: (string | number)[], value: string | null) => {
    let target: unknown = pkg
    for (const key of path.slice(0, -1)) target = (target as Record<string | number, unknown>)[key]
    ;(target as Record<string | number, unknown>)[path.at(-1)!] = value
  }
  await act(async () => root.render(<NotebookPackageView pkg={pkg} change={change} mode="all" />))
  expect(headings()).toEqual(originalTitles)
  expect(titleFields().map(field => field.value)).toEqual(originalTitles)
  const edited = `${originalTitles[0]} (my clarification)`
  await act(async () => {
    const field = titleFields()[0]
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(field, edited)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const roundtrip = JSON.parse(JSON.stringify(pkg)) as NotebookPackage
  expect(roundtrip.entries[0].objectives.map(objective => objective.title)).toEqual([edited, originalTitles[1]])
  await act(async () => root.render(<NotebookPackageView pkg={roundtrip} change={change} mode="all" />))
  expect(titleFields()[0].value).toBe(edited)
  expect(headings()[0]).toBe(edited)
  await act(async () => root.render(<NotebookPackageView pkg={roundtrip} reader mode="all" />))
  expect(headings()).toEqual([edited.replace(/^Study objective:\s*/, ''), originalTitles[1]])
  expect(roundtrip.entries[0].objectives[0].title).toBe(edited)
})

it('does not strip an internal phrase or turn a prefix-only saved title into a blank heading', async () => {
  const pkg = titleFixture()
  pkg.entries[0].objectives[0].title = 'Compare the phrase Study objective: with the instructor wording.'
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="all" />))
  expect(headings()[0]).toBe(pkg.entries[0].objectives[0].title)
  pkg.entries[0].objectives[0].title = 'Study objective:'
  await act(async () => root.render(<NotebookPackageView pkg={pkg} reader mode="all" />))
  expect(headings()[0]).toBe('Study objective:')
})

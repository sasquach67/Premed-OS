import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { NotebookStudyDiagram } from '@/components/academics/NotebookVisuals'
import { layoutNotebookDiagram } from './notebookDiagram'
import { graphChoiceDiagram, inquiryDiagram } from './notebookDiagram.test-fixtures'

it.each([inquiryDiagram, graphChoiceDiagram])('compacts the exact $id shape without changing its labels or connections', block => {
  const before = JSON.stringify(block), layout = layoutNotebookDiagram(block)
  expect(layout.width).toBeLessThanOrEqual(block.id === inquiryDiagram.id ? 440 : 600)
  expect(layout.nodes.map(n => n.id)).toEqual(block.nodes.map(n => n.id))
  expect(layout.edges.map(e => [e.id, e.from, e.to, e.label])).toEqual(block.edges.map(e => [e.id, e.from, e.to, e.label]))
  expect(new Set(layout.edges.map(e => `${e.labelX},${e.labelY}`)).size).toBe(block.edges.length)
  for (const [i, edge] of layout.edges.entries()) {
    expect(edge.marker).toBe(`R${i + 1}`)
    expect(edge.labelX + 22).toBeLessThanOrEqual(layout.width)
    expect(edge.lines.join('').replace(/\s/g, '')).toBe(edge.label.replace(/\s/g, ''))
    const numbers = edge.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    expect(numbers.every(n => Number.isFinite(n) && n >= 0 && n <= Math.max(layout.width, layout.height))).toBe(true)
  }
  expect(JSON.stringify(block)).toBe(before)
})
it('retains all three return paths and both decision branches', () => {
  const inquiry = layoutNotebookDiagram(inquiryDiagram), indices = new Map(inquiry.nodes.map((n, i) => [n.id, i]))
  expect(inquiry.edges.filter(e => indices.get(e.to)! < indices.get(e.from)!)).toHaveLength(3)
  const choice = layoutNotebookDiagram(graphChoiceDiagram)
  expect(choice.edges.filter(e => e.from === choice.nodes[0].id)).toHaveLength(2)
  expect(choice.nodes[1].y).toBe(choice.nodes[2].y)
  expect(choice.nodes[1].x).not.toBe(choice.nodes[2].x)
  expect(choice.nodes[3].x).toBe(choice.nodes[1].x)
  expect(choice.nodes[4].x).toBe(choice.nodes[2].x)
  expect(choice.nodes[3].y).toBe(choice.nodes[4].y)
})
it('keeps full long labels without widening routes and separates parallel and self connections', () => {
  const block = structuredClone(inquiryDiagram), width = layoutNotebookDiagram(block).width
  block.edges[0].label = 'Full relationship label remains available. '.repeat(80)
  expect(layoutNotebookDiagram(block).width).toBe(width)
  block.edges.push({ ...block.edges[0], id: 'parallel' }, { ...block.edges[0], id: 'self', to: block.edges[0].from })
  const layout = layoutNotebookDiagram(block)
  expect(new Set(layout.edges.map(e => e.path)).size).toBe(block.edges.length)
  expect(new Set(layout.edges.map(e => `${e.labelX},${e.labelY}`)).size).toBe(block.edges.length)
})
it.each([inquiryDiagram, graphChoiceDiagram])('renders every $id relationship outside collapsed details for compact readers', block => {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(createElement(NotebookStudyDiagram, { block }))
  const cards = [...host.querySelectorAll('.nbr-diagram-relationships li')]
  expect(cards).toHaveLength(block.edges.length)
  for (const [i, card] of cards.entries()) {
    const edge = block.edges[i]
    expect(card.closest('details')).toBeNull()
    expect(card.getAttribute('data-edge-id')).toBe(edge.id)
    expect(card.querySelector('b')?.textContent).toBe(`R${i + 1}`)
    expect(card.querySelectorAll('p')[0].textContent).toBe(`From: ${block.nodes.find(n => n.id === edge.from)!.label}`)
    expect(card.querySelectorAll('p')[1].textContent).toBe(`Relationship: ${edge.label}`)
    expect(card.querySelectorAll('p')[2].textContent).toBe(`To: ${block.nodes.find(n => n.id === edge.to)!.label}`)
  }
  const labels = [...host.querySelectorAll('svg text[font-size="13"]')].map(e => e.textContent?.replace(/\s/g, ''))
  expect(labels).toEqual(block.nodes.map(n => n.label.replace(/\s/g, '')))
  expect(host.querySelector('.nbr-diagram-scroll')?.getAttribute('tabindex')).toBe('0')
})

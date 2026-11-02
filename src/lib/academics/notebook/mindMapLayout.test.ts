import { expect, it } from 'vitest'
import { MIND_MAP, arrowPaths, boxEdge, columnCount, handOval, mapBounds, placeInColumns, placeSections } from './mindMapLayout'

const sizes = Array.from({ length: 11 }, (_, i) => ({ id: `section-${i}`, width: 1200 + (i % 3) * 400, height: 800 + (i % 4) * 300 }))

it('gives the same notebook the same positions every time', () => {
  expect(placeSections(sizes)).toEqual(placeSections(sizes))
  expect(handOval(460, 200, 42)).toBe(handOval(460, 200, 42))
})

it('never overlaps sections, even on the longest notebook', () => {
  const placed = placeSections(Array.from({ length: 19 }, (_, i) => ({ id: `s${i}`, width: 636 * (1 + i % 4), height: 500 + (i * 137) % 1600 })))
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
    const a = placed[i], b = placed[j]
    expect(a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height, `${a.id} and ${b.id}`).toBe(false)
  }
})

it('runs reading order along a row and back along the next', () => {
  const placed = placeSections(sizes.slice(0, 6), 3)
  expect(placed[0].x).toBeLessThan(placed[1].x)
  expect(placed[1].x).toBeLessThan(placed[2].x)
  expect(placed[3].x).toBeGreaterThan(placed[4].x)
  expect(placed[4].x).toBeGreaterThan(placed[5].x)
  expect(placed[3].y).toBeGreaterThan(placed[0].y)
})

it('fills columns in reading order without overlap', () => {
  const heights = [300, 120, 200, 90, 400]
  const { placed, height } = placeInColumns(heights, 2, 50)
  expect(placed[0]).toEqual({ column: 0, x: MIND_MAP.railInset, y: 50 })
  expect(placed[1].column).toBe(1)
  expect(placed[2].column).toBe(1)
  placed.forEach((block, i) => expect(block.y + heights[i]).toBeLessThanOrEqual(height))
})

it('uses more columns for more writing, within limits', () => {
  expect(columnCount([100])).toBe(1)
  expect(columnCount(Array(40).fill(300))).toBe(4)
  expect(columnCount(Array(6).fill(300))).toBeLessThan(columnCount(Array(20).fill(300)))
  expect(columnCount([])).toBe(1)
})

it('starts lines at the edge of a section', () => {
  const section = { id: 'a', width: 200, height: 100, x: 0, y: 0 }
  expect(boxEdge(section, 1100, 50)).toEqual([200, 50])
  expect(boxEdge(section, 100, 1050)).toEqual([100, 100])
  expect(boxEdge(section, 100, 50)).toEqual([100, 50])
})

it('frames an empty map safely and pads a real one', () => {
  expect(mapBounds([])).toEqual({ x0: 0, y0: 0, x1: 1, y1: 1 })
  expect(mapBounds([{ id: 'a', width: 10, height: 10, x: 0, y: 0 }], 5)).toEqual({ x0: -5, y0: -5, x1: 15, y1: 15 })
})

it('draws an arrow that ends at its target', () => {
  const { line, head } = arrowPaths([0, 0], [100, 0], .1, 10)
  expect(line.endsWith('100.0 0.0')).toBe(true)
  expect(head.startsWith('M100.0 0.0')).toBe(true)
})

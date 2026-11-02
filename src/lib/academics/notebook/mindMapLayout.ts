/** Pure geometry for the notebook mind map. The same notebook always gets the same positions. */
export const MIND_MAP = { blockWidth: 560, gutter: 76, sectionGap: 230, topGap: 56, blockGap: 36, railInset: 34, ovalBandGap: 60 } as const

export type Point = [number, number]
export type SectionSize = { id: string; width: number; height: number }
export type PlacedSection = SectionSize & { x: number; y: number }
export type Box = { x0: number; y0: number; x1: number; y1: number }

/** Roughly 3:2 columns for a section's writing: more writing, more columns. */
export function columnCount(heights: readonly number[], maxColumns = 4) {
  const { blockWidth, gutter, blockGap } = MIND_MAP
  const area = heights.reduce((sum, height) => sum + (blockWidth + gutter) * (height + blockGap), 0)
  return Math.max(1, Math.min(maxColumns, Math.round(Math.sqrt(area * 1.5) / (blockWidth + gutter))))
}

/** Each block joins the shortest column, in reading order. */
export function placeInColumns(heights: readonly number[], columns: number, top: number) {
  const { blockWidth, gutter, railInset, blockGap } = MIND_MAP
  const bottoms = Array<number>(columns).fill(top)
  const placed = heights.map(height => {
    const column = bottoms.indexOf(Math.min(...bottoms)), y = bottoms[column]
    bottoms[column] += height + blockGap
    return { column, x: column * (blockWidth + gutter) + railInset, y }
  })
  return { placed, height: Math.max(top, ...bottoms) }
}

export function stringSeed(value: string) {
  let hash = 7
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) % 2147483646
  return hash + 1
}
/** A fixed hand: the same wobble on every load. */
export function seededRandom(seed: number) {
  let state = seed
  return () => (state = (state * 16807) % 2147483647) / 2147483647
}

/** Reading order runs along a row, then back along the next, so neighbours stay close. */
export function placeSections(sizes: readonly SectionSize[], perRow = Math.max(2, Math.round(Math.sqrt(sizes.length * 1.8)))): PlacedSection[] {
  const { sectionGap } = MIND_MAP
  const placed: PlacedSection[] = []
  let top = 0
  for (let start = 0, row = 0; start < sizes.length; start += perRow, row++) {
    const items = sizes.slice(start, start + perRow), rowHeight = Math.max(...items.map(item => item.height))
    let x = 0
    const across = items.map(item => { const at = x; x += item.width + sectionGap; return { item, at } })
    const rowWidth = x - sectionGap
    for (const { item, at } of across) {
      const left = row % 2 === 0 ? at : rowWidth - at - item.width
      const lean = (seededRandom(stringSeed(item.id))() - .5) * Math.min(160, rowHeight - item.height)
      placed.push({ ...item, x: left, y: top + (rowHeight - item.height) / 2 + lean })
    }
    top += rowHeight + sectionGap
  }
  return placed
}

export function mapBounds(placed: readonly PlacedSection[], pad = 300): Box {
  if (!placed.length) return { x0: 0, y0: 0, x1: 1, y1: 1 }
  return { x0: Math.min(...placed.map(s => s.x)) - pad, y0: Math.min(...placed.map(s => s.y)) - pad, x1: Math.max(...placed.map(s => s.x + s.width)) + pad, y1: Math.max(...placed.map(s => s.y + s.height)) + pad }
}

/** Where a line toward (tx, ty) leaves a section's box. */
export function boxEdge(section: PlacedSection, tx: number, ty: number): Point {
  const cx = section.x + section.width / 2, cy = section.y + section.height / 2, dx = tx - cx, dy = ty - cy
  const scale = Math.min(dx ? section.width / 2 / Math.abs(dx) : Infinity, dy ? section.height / 2 / Math.abs(dy) : Infinity)
  return Number.isFinite(scale) ? [cx + dx * scale, cy + dy * scale] : [cx, cy]
}

const f = (value: number) => value.toFixed(1)
/** Catmull-Rom through the points, for lines that look drawn. */
export function smoothPath(points: readonly Point[]) {
  if (!points.length) return ''
  let d = `M${f(points[0][0])} ${f(points[0][1])}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], e = points[Math.min(points.length - 1, i + 2)]
    d += ` C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`
  }
  return d
}

/** A pen oval whose end overshoots its start, like the ones on a whiteboard. */
export function handOval(width: number, height: number, seed: number) {
  const random = seededRandom(seed), wobble = (size: number) => (random() - .5) * 2 * size
  const points: Point[] = []
  for (let i = 0; i <= 17; i++) {
    const t = -2.2 + i / 15 * Math.PI * 2, g = 1 + (i > 15 ? .035 : 0) + wobble(.012)
    points.push([width / 2 + Math.cos(t) * (width / 2 - 8) * g, height / 2 + Math.sin(t) * (height / 2 - 8) * g])
  }
  return smoothPath(points)
}

/** A gently curved line and its arrowhead. */
export function arrowPaths(from: Point, to: Point, bend: number, head: number) {
  const cx = (from[0] + to[0]) / 2 - (to[1] - from[1]) * bend, cy = (from[1] + to[1]) / 2 + (to[0] - from[0]) * bend, a = Math.atan2(to[1] - cy, to[0] - cx)
  return {
    line: `M${f(from[0])} ${f(from[1])} Q${f(cx)} ${f(cy)} ${f(to[0])} ${f(to[1])}`,
    head: `M${f(to[0])} ${f(to[1])} L${f(to[0] - head * Math.cos(a - .42))} ${f(to[1] - head * Math.sin(a - .42))} L${f(to[0] - head * .72 * Math.cos(a))} ${f(to[1] - head * .72 * Math.sin(a))} L${f(to[0] - head * Math.cos(a + .42))} ${f(to[1] - head * Math.sin(a + .42))}Z`,
  }
}

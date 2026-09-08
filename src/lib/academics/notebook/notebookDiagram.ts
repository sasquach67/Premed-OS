import type { NotebookStudyDiagramBlock } from './visualTypes'

function lines(text: string, width = 28): string[] {
  const output: string[] = []
  for (const paragraph of text.split('\n')) {
    let remaining = paragraph
    while (remaining.length > width) { let at = remaining.lastIndexOf(' ', width); if (at < width / 2) at = width; output.push(remaining.slice(0, at)); remaining = remaining.slice(at).trimStart() }
    output.push(remaining)
  }
  return output
}
/** Only a single-root, two-wide tree gets branch columns. Cycles and general
 * concept maps retain the source-ordered spine without inventing hierarchy. */
function branchRows(block: NotebookStudyDiagramBlock) {
  const incoming = new Map(block.nodes.map(node => [node.id, 0])), children = new Map(block.nodes.map(node => [node.id, [] as string[]]))
  for (const edge of block.edges) { incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1); children.get(edge.from)?.push(edge.to) }
  const roots = block.nodes.filter(node => incoming.get(node.id) === 0)
  if (roots.length !== 1 || block.edges.length !== block.nodes.length - 1 || [...incoming.values()].some(n => n > 1) || [...children.values()].some(nodes => nodes.length > 2) || ![...children.values()].some(nodes => nodes.length === 2)) return null
  const rows: string[][] = [], seen = new Set<string>(); let row = [roots[0].id]
  while (row.length) {
    if (row.length > 2 || row.some(id => seen.has(id))) return null
    rows.push(row); row.forEach(id => seen.add(id)); row = row.flatMap(id => children.get(id) ?? [])
  }
  return seen.size === block.nodes.length ? rows : null
}
/** App-owned, bounded layout. No positions, markup or styling enter from JSON.
 * Arrow keys refer to the complete, visible relationship list. Keeping prose
 * out of routing lanes prevents long labels from widening the whole diagram. */
export function layoutNotebookDiagram(block: NotebookStudyDiagramBlock) {
  const nodeLines = block.nodes.map(n => lines(n.label)), edgeLines = block.edges.map(e => lines(e.label))
  const nodeHeight = Math.max(70, ...nodeLines.map(l => l.length * 17 + 38)), gap = 72
  const rows = branchRows(block), positions = new Map(rows?.flatMap((row, ri) => row.map((id, ci) => [id, { row: ri, x: row.length === 1 ? 166 : 24 + ci * 284 }] as const)))
  const nodes = block.nodes.map((node, i) => ({ ...node, lines: nodeLines[i], x: positions.get(node.id)?.x ?? 24, y: 24 + (positions.get(node.id)?.row ?? i) * (nodeHeight + gap), width: 260, height: nodeHeight }))
  const indices = new Map(nodes.map((n, i) => [n.id, i])), directRoutes = new Set<string>(); let laneCount = 0
  const edges = block.edges.map((edge, i) => {
    const from = nodes[indices.get(edge.from)!], to = nodes[indices.get(edge.to)!], key = JSON.stringify([edge.from, edge.to]), direct = indices.get(edge.to) === indices.get(edge.from)! + 1 && !directRoutes.has(key)
    if (rows) {
      const x = from.x + from.width / 2, target = to.x + to.width / 2, start = from.y + from.height, middle = start + gap / 2
      return { ...edge, marker: `R${i + 1}`, lines: edgeLines[i], path: `M ${x} ${start} V ${middle} H ${target} V ${to.y - 5}`, labelX: x === target ? x + 18 : (x + target) / 2 + 6, labelY: middle - 8 }
    }
    if (direct) {
      directRoutes.add(key)
      const x = from.x + from.width / 2, start = from.y + from.height, end = to.y
      return { ...edge, marker: `R${i + 1}`, lines: edgeLines[i], path: `M ${x} ${start} L ${x} ${end - 5}`, labelX: x + 18, labelY: start + 25 }
    }
    const lane = 316 + laneCount++ * 32, x = from.x + from.width, start = from.y + from.height / 2, end = to.y + to.height / 2 + (from.id === to.id ? 22 : 0)
    return { ...edge, marker: `R${i + 1}`, lines: edgeLines[i], path: `M ${x} ${start} H ${lane} V ${end} H ${x + 5}`, labelX: lane + 6, labelY: Math.min(start, end) + 20 }
  })
  return { nodes, edges, width: rows ? 592 : Math.max(308, 316 + laneCount * 32), height: (rows?.length ?? nodes.length) * (nodeHeight + gap) + 48 }
}

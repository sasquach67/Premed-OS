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
/** App-owned, bounded layout. No positions, markup or styling enter from JSON.
 * Adjacent nodes get a direct labelled arrow. Other connections get separate
 * routing lanes so cycles and long labels do not obscure the node text. */
export function layoutNotebookDiagram(block: NotebookStudyDiagramBlock) {
  const nodeLines = block.nodes.map(n => lines(n.label)), edgeLines = block.edges.map(e => lines(e.label))
  const nodeHeight = Math.max(70, ...nodeLines.map(l => l.length * 17 + 38)), gap = Math.max(90, ...edgeLines.map(l => l.length * 17 + 36))
  const nodes = block.nodes.map((node, i) => ({ ...node, lines: nodeLines[i], x: 24, y: 24 + i * (nodeHeight + gap), width: 260, height: nodeHeight }))
  const indices = new Map(nodes.map((n, i) => [n.id, i])), directRoutes = new Set<string>(); let laneCount = 0
  const edges = block.edges.map((edge, i) => {
    const from = nodes[indices.get(edge.from)!], to = nodes[indices.get(edge.to)!], key = JSON.stringify([edge.from, edge.to]), direct = indices.get(edge.to) === indices.get(edge.from)! + 1 && !directRoutes.has(key)
    if (direct) {
      directRoutes.add(key)
      const x = from.x + from.width / 2, start = from.y + from.height, end = to.y
      return { ...edge, lines: edgeLines[i], path: `M ${x} ${start} L ${x} ${end - 5}`, labelX: x + 18, labelY: start + 25 }
    }
    const lane = 590 + laneCount++ * 270, x = from.x + from.width, start = from.y + from.height / 2, end = to.y + to.height / 2 + (from.id === to.id ? 22 : 0)
    return { ...edge, lines: edgeLines[i], path: `M ${x} ${start} H ${lane} V ${end} H ${x + 5}`, labelX: lane + 10, labelY: Math.min(start, end) + 20 }
  })
  return { nodes, edges, width: Math.max(590, 590 + laneCount * 270), height: nodes.length * (nodeHeight + gap) + 48 }
}

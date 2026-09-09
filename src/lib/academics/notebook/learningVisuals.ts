import { NotebookValidationError } from './schemaValidator'
import type { Evidence, NotebookBlock } from './types'
import type { NotebookStudyDiagramBlock } from './visualTypes'
import type { LearningAxis, LearningAxisPoint, LearningItem, LearningVisualBlock } from './learningVisualTypes'
import { isLearningVisualBlock } from './learningVisualTypes'

export function learningVisualItems(block: NotebookBlock): (LearningItem & { assetId?: string | null })[] {
  switch (block.type) {
    case 'study-diagram': return [...block.nodes, ...block.edges]
    case 'annotated-figure': return block.annotations
    case 'timeline': return block.events
    case 'continuum': return block.points
    case 'venn': return [...block.sets, ...block.regions.flatMap(region => region.items)]
    case 'sequence-strip': return block.steps
    case 'worked-example': return [
      { id: `${block.id}:problem-evidence`, ...block.problemEvidence },
      { id: `${block.id}:solution-evidence`, ...block.solutionEvidence }, ...block.steps,
    ]
    default: return []
  }
}

export function evidenceFits(child: Evidence, parent: Evidence): boolean {
  return (['sourceIds', 'excerptIds', 'assetIds'] as const).every(key => (child[key] ?? []).every(id => (parent[key] ?? []).includes(id)))
}

function fail(block: { id: string }, message: string): never { throw new NotebookValidationError(`$.visuals.${block.id}`, message) }

function validateAxis(block: LearningVisualBlock, axis: LearningAxis, points: LearningAxisPoint[]) {
  if (axis.mode === 'ordinal') {
    if ([axis.unit, axis.minimum, axis.maximum, ...points.map(point => point.value)].some(value => value !== null)) fail(block, 'Ordinal order must not declare numeric coordinates, bounds or measurement units.')
    return
  }
  if (!axis.unit?.trim() || axis.minimum === null || axis.maximum === null || !Number.isFinite(axis.minimum) || !Number.isFinite(axis.maximum) || !Number.isFinite(axis.maximum - axis.minimum) || axis.minimum >= axis.maximum) fail(block, 'A numeric axis needs explicit units and a finite increasing domain.')
  let previous = axis.minimum!
  for (const point of points) {
    if (point.value === null || !Number.isFinite(point.value) || point.value < axis.minimum! || point.value > axis.maximum! || point.value < previous) fail(block, 'Numeric positions must be finite, inside the inclusive domain, and nondecreasing; ties are allowed.')
    previous = point.value!
  }
}

export function isConstrainedDiagram(block: NotebookStudyDiagramBlock): boolean {
  return ['decision-tree', 'hierarchy', 'causal-chain'].includes(block.kind)
}

function validateTree(block: NotebookStudyDiagramBlock) {
  const ids = new Set(block.nodes.map(node => node.id)), incoming = new Map(block.nodes.map(node => [node.id, 0]))
  const outgoing = new Map(block.nodes.map(node => [node.id, [] as typeof block.edges]))
  if (block.nodes.length < 2 || block.nodes.length > 12 || block.edges.length !== block.nodes.length - 1) fail(block, 'This diagram kind needs 2-12 nodes and a connected tree or chain with one fewer edge.')
  for (const edge of block.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to) fail(block, 'Every relationship must connect distinct declared nodes.')
    incoming.set(edge.to, incoming.get(edge.to)! + 1); outgoing.get(edge.from)!.push(edge)
    if (block.kind === 'hierarchy' && edge.relation !== 'contains') fail(block, 'Hierarchy edges must declare evidenced containment.')
    if (block.kind === 'causal-chain' && !['causes', 'inhibits'].includes(edge.relation)) fail(block, 'A causal chain cannot turn sequence or association into causation.')
    if (block.kind === 'decision-tree' && !['other', 'sequence'].includes(edge.relation)) fail(block, 'Decision branches require condition labels, not causal or containment claims.')
  }
  const roots = block.nodes.filter(node => incoming.get(node.id) === 0)
  if (roots.length !== 1 || [...incoming.values()].some(count => count > 1)) fail(block, 'This diagram kind needs one root and at most one parent per node.')
  const maximum = block.kind === 'hierarchy' ? 4 : block.kind === 'decision-tree' ? 2 : 1
  for (const edges of outgoing.values()) {
    if (edges.length > maximum) fail(block, `This diagram kind supports at most ${maximum} outgoing relationships per node.`)
    if (block.kind === 'decision-tree' && new Set(edges.map(edge => edge.label.trim().replace(/\s+/g, ' ').toLowerCase())).size !== edges.length) fail(block, 'Decision branches from one node need distinct condition labels.')
  }
  const seen = new Set<string>(), pending = [roots[0].id]
  while (pending.length) {
    const id = pending.pop()!
    if (seen.has(id)) fail(block, 'Tree and linear-chain kinds cannot contain cycles; use a supported general graph instead.')
    seen.add(id); pending.push(...outgoing.get(id)!.map(edge => edge.to))
  }
  if (seen.size !== ids.size) fail(block, 'Every declared tree or chain node must be reachable from its root.')
}

/** Structural/evidence checks cannot prove an authored claim matches its source. */
export function validateLearningVisual(block: NotebookBlock) {
  if (block.type === 'study-diagram') {
    if (isConstrainedDiagram(block)) {
      if (new Set([...block.nodes, ...block.edges].map(item => item.id)).size !== block.nodes.length + block.edges.length) fail(block, 'Node and relationship IDs must be distinct within the diagram.')
      validateTree(block)
    }
    return
  }
  if (!isLearningVisualBlock(block)) return
  for (const item of learningVisualItems(block)) for (const key of ['label', 'detail', 'text', 'explanation']) {
    if (key in item && typeof (item as unknown as Record<string, unknown>)[key] === 'string' && !(item as unknown as Record<string, string>)[key].trim()) fail(block, 'Structured labels, details and explanations must contain meaningful text.')
  }
  if ('orderingBasis' in block && !block.orderingBasis.trim()) fail(block, 'Describe the evidenced ordering basis.')
  const ids = (block.type === 'worked-example' ? block.steps : learningVisualItems(block)).map(item => item.id)
  if (block.type === 'venn') ids.push(...block.regions.map(region => region.id))
  if (new Set(ids).size !== ids.length || ids.includes(block.id)) fail(block, 'Structured item IDs must be unique within the visual block and distinct from its parent block ID.')
  if (block.type === 'annotated-figure') for (const point of block.annotations) {
    if (![point.x, point.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1) || !point.positionBasis.trim()) fail(block, 'Annotations need finite normalized points on the inspected image and an explicit position basis.')
    if (!(point.assetIds ?? []).includes(block.assetId)) fail(block, 'Every annotation must cite its exact backing image asset.')
  }
  if (block.type === 'timeline' || block.type === 'continuum') validateAxis(block, block.axis, block.type === 'timeline' ? block.events : block.points)
  if (block.type === 'sequence-strip') for (const step of block.steps) {
    if (step.assetId === null ? step.alt !== null : !step.alt?.trim()) fail(block, 'Sequence images need their direct image asset and alternative text; text-only steps have null image and alt.')
  }
  if (block.type === 'venn') {
    if (block.sets.length !== 2 || block.regions.length !== 3) fail(block, 'This Venn contract supports exactly two sets and their three membership regions.')
    const known = new Set(block.sets.map(set => set.id)), signatures = new Set<string>()
    for (const region of block.regions) {
      if (!region.setIds.length || region.setIds.length > 2 || new Set(region.setIds).size !== region.setIds.length || region.setIds.some(id => !known.has(id))) fail(block, 'Every Venn region must name one or both declared sets exactly once.')
      const signature = JSON.stringify([...region.setIds].sort())
      if (signatures.has(signature)) fail(block, 'Each Venn membership region must appear exactly once.')
      signatures.add(signature)
      if (region.setIds.length === 2 && !region.items.length) fail(block, 'A Venn comparison needs at least one supported overlap example, not decorative empty overlap.')
    }
  }
  if (block.type === 'worked-example') {
    if (!block.problem.trim() || !block.answer.trim() || (block.check !== null && !block.check.trim())) fail(block, 'Worked problems, answers and any supplied check must contain meaningful text.')
    if (!evidenceFits(block.problemEvidence, block) || !evidenceFits(block.solutionEvidence, block)) fail(block, 'The worked-example parent evidence envelope must contain its problem and solution evidence.')
    for (const step of block.steps) if (!evidenceFits(step, block.solutionEvidence)) fail(block, 'Every worked solution step must remain inside the gated solution evidence envelope.')
  }
}

/** Conservative label lanes preserve equal numeric positions without collisions. */
export function learningAxisPositions(axis: LearningAxis, points: LearningAxisPoint[]) {
  const lanes: number[][] = []
  return points.map((point, index) => {
    const fraction = axis.mode === 'numeric' ? (point.value! - axis.minimum!) / (axis.maximum! - axis.minimum!) : index / (points.length - 1)
    let lane = lanes.findIndex(positions => positions.every(value => Math.abs(value - fraction) >= .16))
    if (lane < 0) { lane = lanes.length; lanes.push([]) }
    lanes[lane].push(fraction)
    return { id: point.id, fraction, lane }
  })
}

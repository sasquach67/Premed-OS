import { createElement, useId, type ReactNode } from 'react'
import { learningAxisPositions } from '@/lib/academics/notebook/learningVisuals'
import type { LearningAnnotation, LearningVisualBlock } from '@/lib/academics/notebook/learningVisualTypes'
import type { NotebookFigureBlock, NotebookStudyDiagramBlock } from '@/lib/academics/notebook/visualTypes'
import './notebookLearningVisuals.css'

export type LearningTextChange = (path: (string | number)[], value: string | null) => void
type DisplayBlock = Exclude<LearningVisualBlock, { type: 'worked-example' }>

export function NotebookLearningVisual({ block, change, renderFigure }: {
  block: DisplayBlock; change?: LearningTextChange
  renderFigure: (figure: NotebookFigureBlock, annotations?: LearningAnnotation[]) => ReactNode
}) {
  const uid = useId()
  const field = (value: string | null, path: (string | number)[], label: string, tag = 'p', nullable = false) => change
    ? <label className="nbr-learning-editor">{label}<textarea value={value ?? ''} onChange={event => change(path, nullable && !event.target.value ? null : event.target.value)} /></label>
    : value === null ? null : createElement(tag, { className: 'nbr-learning-text' }, value)
  const title = field(block.title, ['title'], 'Visual title', 'strong')
  if (block.type === 'annotated-figure') return <section className="nbr-learning-visual nbr-annotated-figure" aria-label={block.title} data-visual-type={block.type}>
    <h4>{title}</h4>{renderFigure({ ...block, type: 'figure' }, block.annotations)}
    {change && <div>{field(block.caption, ['caption'], 'Figure caption', 'p', true)}{field(block.alt, ['alt'], 'Figure alternative text')}{field(block.context, ['context'], 'Figure context')}</div>}
    <ol className="nbr-annotation-legend" aria-label="Figure annotations">{block.annotations.map((annotation, index) => <li key={annotation.id} data-annotation-id={annotation.id}><span className="nbr-visual-key">{index + 1}</span><div>{field(annotation.label, ['annotations', index, 'label'], `Annotation ${index + 1} label`)}<details><summary>Position evidence</summary>{field(annotation.positionBasis, ['annotations', index, 'positionBasis'], `Annotation ${index + 1} position evidence`)}<small>Normalized image point: {annotation.x}, {annotation.y}</small></details></div></li>)}</ol>
    {change && <small>Image identity and point coordinates stay protected. Review a new proposal to change the source image or its anchors.</small>}
  </section>
  if (block.type === 'timeline' || block.type === 'continuum') {
    const points = block.type === 'timeline' ? block.events : block.points, key = block.type === 'timeline' ? 'events' : 'points'
    const positions = learningAxisPositions(block.axis, points), lanes = Math.max(...positions.map(point => point.lane)) + 1
    return <figure className={`nbr-learning-visual nbr-${block.type}`} aria-label={block.title} data-visual-type={block.type} data-axis-mode={block.axis.mode}>
      <figcaption>{title}<small>{block.axis.mode === 'ordinal' ? block.type === 'timeline' ? 'Chronological order; spacing does not represent elapsed time.' : 'Order only; spacing does not represent measured intervals.' : `Numeric ${block.type === 'timeline' ? 'time axis' : 'scale'} (${block.axis.unit})`}</small></figcaption>
      {field(block.orderingBasis, ['orderingBasis'], 'Ordering evidence')}
      {block.axis.mode === 'numeric' && <><div className="nbr-numeric-axis" role="img" aria-label={`Numeric positions from ${block.axis.minimum} to ${block.axis.maximum} ${block.axis.unit}; exact values are listed below.`} style={{ height: `${lanes * 2 + 1.5}rem` }}>
        <div className="nbr-numeric-axis-line" />{positions.map((position, index) => <span className="nbr-numeric-axis-marker" key={position.id} data-position={position.fraction} data-lane={position.lane} aria-hidden="true" style={{ left: `${position.fraction * 100}%`, top: `${position.lane * 2}rem` }}><span>{String.fromCharCode(65 + index)}</span><i style={{ height: `${(lanes - position.lane) * 2 - .5}rem` }} /></span>)}
      </div><div className="nbr-axis-endpoints"><span>{block.axis.minimum} {block.axis.unit}</span><span>{block.axis.maximum} {block.axis.unit}</span></div>{lanes > 1 && <small>Labels are separated vertically for readability; horizontal position shows the value.</small>}</>}
      <ol className={`nbr-axis-items ${block.axis.mode === 'ordinal' ? 'nbr-axis-ordinal' : ''}`}>{points.map((point, index) => <li key={point.id} data-axis-item={point.id}>
        {block.axis.mode === 'numeric' && <span className="nbr-visual-key">{String.fromCharCode(65 + index)}</span>}
        <div>{block.type === 'timeline' && field(block.events[index].timeLabel, [key, index, 'timeLabel'], `Event ${index + 1} time label`, 'small', true)}{field(point.label, [key, index, 'label'], `Item ${index + 1} label`, 'strong')}{point.value !== null && <small className="nbr-axis-value">{point.value} {block.axis.unit}</small>}{field(point.detail, [key, index, 'detail'], `Item ${index + 1} detail`)}</div>
      </li>)}</ol>
    </figure>
  }
  if (block.type === 'venn') {
    const [a, b] = block.sets, names = new Map(block.sets.map(set => [set.id, set.label]))
    return <figure className="nbr-learning-visual nbr-venn" aria-label={block.title} data-visual-type={block.type}>
      <figcaption>{title}<small>Set membership only; circle and overlap areas are not quantities.</small></figcaption>
      <svg viewBox="0 0 480 230" className="nbr-venn-shape" role="img" aria-labelledby={`${uid}-venn-title ${uid}-venn-desc`}><title id={`${uid}-venn-title`}>{block.title}</title><desc id={`${uid}-venn-desc`}>Two overlapping sets. A is {a.label}; B is {b.label}. All membership examples are listed below.</desc><circle cx="180" cy="112" r="94" className="nbr-venn-a" /><circle cx="300" cy="112" r="94" className="nbr-venn-b" /><text x="140" y="117">A</text><text x="240" y="117">A &amp; B</text><text x="340" y="117">B</text></svg>
      <div className="nbr-venn-set-labels">{block.sets.map((set, index) => <div key={set.id}><span className="nbr-visual-key">{index === 0 ? 'A' : 'B'}</span>{field(set.label, ['sets', index, 'label'], `Set ${index + 1} label`, 'strong')}</div>)}</div>
      <div className="nbr-venn-regions">{[1, 2, 1].map((size, column) => {
        const ri = block.regions.findIndex(region => region.setIds.length === size && (size === 2 || region.setIds[0] === (column === 0 ? a.id : b.id))), region = block.regions[ri]
        return <section key={region.id} data-venn-region={region.id}><h5>{region.setIds.map(id => names.get(id)).join(' + ')}{size === 1 ? ' only' : ' overlap'}</h5>{region.items.length ? <ul>{region.items.map((item, index) => <li key={item.id}>{field(item.text, ['regions', ri, 'items', index, 'text'], `Region ${ri + 1}, item ${index + 1}`)}</li>)}</ul> : <p>No examples listed.</p>}</section>
      })}</div>
    </figure>
  }
  return <figure className="nbr-learning-visual nbr-sequence-strip" aria-label={block.title} data-visual-type={block.type}>
    <figcaption>{title}<small>Ordered steps, not a measured time scale or a causal claim.</small></figcaption>{field(block.orderingBasis, ['orderingBasis'], 'Sequence ordering evidence')}
    <ol className="nbr-sequence-steps">{block.steps.map((step, index) => <li key={step.id}><span className="nbr-visual-key">{index + 1}</span>{field(step.label, ['steps', index, 'label'], `Sequence step ${index + 1} label`, 'strong')}{field(step.detail, ['steps', index, 'detail'], `Sequence step ${index + 1} detail`)}{step.assetId && renderFigure({ ...step, type: 'figure', assetId: step.assetId, alt: step.alt!, caption: null, context: '', provenance: block.provenance })}{change && step.assetId && field(step.alt, ['steps', index, 'alt'], `Sequence step ${index + 1} image alternative text`)}</li>)}</ol>
  </figure>
}

export function NotebookConstrainedDiagram({ block, onChange }: { block: NotebookStudyDiagramBlock; onChange?: (block: NotebookStudyDiagramBlock) => void }) {
  const incoming = new Set(block.edges.map(edge => edge.to)), root = block.nodes.find(node => !incoming.has(node.id))
  const nodes = new Map(block.nodes.map((node, index) => [node.id, { node, index }]))
  const render = (id: string, parentEdge?: typeof block.edges[number], ancestors: string[] = []): ReactNode => {
    const current = nodes.get(id)
    if (!current || ancestors.includes(id)) return <li role="alert" key={id}>Invalid diagram relationship.</li>
    const { node, index } = current, children = block.edges.filter(edge => edge.from === id)
    return <li key={id} data-diagram-node={id}>{parentEdge && <div className="nbr-tree-link" data-relation={parentEdge.relation}>
      <svg viewBox="0 0 24 30" width="24" height="30" aria-hidden="true"><path d="M12 0V23" />{block.kind === 'causal-chain' && <path d={parentEdge.relation === 'inhibits' ? 'M4 23H20' : 'M6 17L12 24L18 17'} />}</svg>
      {onChange ? <label>Relationship {block.edges.indexOf(parentEdge) + 1}<textarea value={parentEdge.label} onChange={event => onChange({ ...block, edges: block.edges.map(edge => edge.id === parentEdge.id ? { ...edge, label: event.target.value } : edge) })} /></label> : <span>{parentEdge.label}</span>}
      {parentEdge.relation === 'inhibits' && <small>Inhibitory relationship</small>}
    </div>}<div className="nbr-tree-node">{onChange ? <label>Diagram node {index + 1}<textarea value={node.label} onChange={event => onChange({ ...block, nodes: block.nodes.map(item => item.id === id ? { ...item, label: event.target.value } : item) })} /></label> : <p>{node.label}</p>}</div>
      {children.length > 0 && <ul className="nbr-tree-children" style={{ gridTemplateColumns: `repeat(${children.length}, minmax(0, 1fr))` }}>{children.map(edge => render(edge.to, edge, [...ancestors, id]))}</ul>}
    </li>
  }
  return <figure className={`nbr-learning-visual nbr-tree nbr-tree-${block.kind}`} aria-label={block.title} data-diagram-kind={block.kind}>
    <figcaption>{onChange ? <label>Diagram title<input value={block.title} onChange={event => onChange({ ...block, title: event.target.value })} /></label> : <strong>{block.title}</strong>}<small>{block.kind === 'decision-tree' ? 'Follow the stated branch conditions.' : block.kind === 'hierarchy' ? 'Parent and child connections show containment.' : 'Causal and inhibitory links retain their stated qualifications.'}</small></figcaption>
    <ul className="nbr-tree-root">{root ? render(root.id) : <li role="alert">A diagram root is missing.</li>}</ul>
  </figure>
}

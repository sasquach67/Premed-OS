import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { canonical } from '@/lib/academics/notebook/package'
import { notebookAssetRepository } from '@/lib/academics/notebook/notebookAssetStore'
import { getPreparedAssetBytes, validateNotebookRaster, type PreparedNotebookAssets } from '@/lib/academics/notebook/visualAssets'
import { missingPracticeImages } from '@/lib/academics/notebook/visualProjection'
import { layoutNotebookDiagram } from '@/lib/academics/notebook/notebookDiagram'
import type { NotebookAssetBinding, NotebookFigureBlock, NotebookStudyDiagramBlock, PortableNotebookPackage, VisualNotebookBlock } from '@/lib/academics/notebook/visualTypes'

type ImageState = { status: 'loading' | 'ready' | 'missing'; url?: string; error?: string }
type VisualContext = { pkg?: PortableNotebookPackage; images: Map<string, ImageState>; fail: (id: string) => void }
const NotebookImages = createContext<VisualContext>({ images: new Map(), fail: () => undefined })
export function NotebookAssetsProvider({ pkg, bindings, prepared, children }: { pkg: PortableNotebookPackage; bindings?: readonly NotebookAssetBinding[]; prepared?: PreparedNotebookAssets; children: ReactNode }) {
  const inherited = useContext(NotebookImages), [images, setImages] = useState<Map<string, ImageState>>(new Map())
  const declared = pkg.version === 3 ? pkg.assets : [], bindingKey = canonical(bindings ?? prepared?.bindings ?? []), assetKey = canonical(declared)
  const inherit = bindings === undefined && prepared === undefined && inherited.pkg !== undefined
  useEffect(() => {
    if (inherit) return
    let stopped = false; const urls: string[] = [], listed = JSON.parse(assetKey) as typeof declared, indexed = JSON.parse(bindingKey) as NotebookAssetBinding[]
    setImages(new Map(listed.map(a => [a.id, { status: 'loading' }])))
    async function load() {
      const staged = prepared ? getPreparedAssetBytes(prepared) : undefined
      for (const asset of listed) {
        const binding = indexed.find(b => b.assetId === asset.id)
        try {
          if (!binding) throw new Error('No image binding is available for this entry on this device.')
          const blob = staged?.get(binding.sha256) ?? await notebookAssetRepository().read(binding.sha256)
          if (!blob) throw new Error('The local image file is missing. Restore the complete notebook bundle or map the original image file again.')
          const verified = await validateNotebookRaster(asset.id, blob, asset.mimeType)
          if (canonical(verified.binding) !== canonical(binding)) throw new Error('The local image does not match its saved byte binding.')
          if (stopped) return
          const url = URL.createObjectURL(verified.blob); urls.push(url)
          setImages(previous => new Map(previous).set(asset.id, { status: 'ready', url }))
        } catch (failure) { if (!stopped) setImages(previous => new Map(previous).set(asset.id, { status: 'missing', error: failure instanceof Error ? failure.message : 'Image unavailable.' })) }
      }
    }
    void load()
    return () => { stopped = true; for (const url of urls) URL.revokeObjectURL(url) }
  }, [assetKey, bindingKey, prepared, inherit])
  const context = useMemo<VisualContext>(() => inherit ? { ...inherited, pkg } : { pkg, images, fail: id => setImages(previous => new Map(previous).set(id, { status: 'missing', error: 'This browser could not display the saved image.' })) }, [inherit, inherited, pkg, images])
  return <NotebookImages.Provider value={context}>{children}</NotebookImages.Provider>
}
export function NotebookFigure({ block, onChange }: { block: NotebookFigureBlock; onChange?: (block: NotebookFigureBlock) => void }) {
  const { pkg, images, fail } = useContext(NotebookImages), state = images.get(block.assetId), dialog = useRef<HTMLDialogElement>(null)
  const restoreView = useRef<(() => void) | null>(null), [zoomError, setZoomError] = useState('')
  const asset = pkg?.version === 3 ? pkg.assets.find(a => a.id === block.assetId) : undefined
  useEffect(() => () => { restoreView.current?.(); restoreView.current = null }, [])
  function finishZoom() { const restore = restoreView.current; restoreView.current = null; restore?.() }
  function openZoom(opener: HTMLButtonElement) {
    if (!dialog.current || dialog.current.open) return
    setZoomError('')
    const parents: { element: HTMLElement; overflow: string; top: number; left: number }[] = []
    const scroll = { x: window.scrollX, y: window.scrollY }
    for (let element = opener.parentElement; element; element = element.parentElement) {
      if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth || /auto|scroll/.test(getComputedStyle(element).overflow) || element === document.body || element === document.documentElement) {
        parents.push({ element, overflow: element.style.overflow, top: element.scrollTop, left: element.scrollLeft }); element.style.overflow = 'hidden'
      }
    }
    restoreView.current = () => { for (const saved of parents) saved.element.style.overflow = saved.overflow; for (const saved of parents) { saved.element.scrollTop = saved.top; saved.element.scrollLeft = saved.left }; window.scrollTo(scroll.x, scroll.y); if (opener.isConnected) opener.focus({ preventScroll: true }) }
    try { dialog.current.showModal() } catch { finishZoom(); setZoomError('This browser could not open the enlarged figure. Your image and notebook are unchanged.') }
  }
  return <figure className="nbr-figure" data-asset-id={block.assetId}>
    {state?.status === 'ready' ? <button type="button" className="nbr-figure-open" aria-label={`Enlarge figure: ${block.caption ?? block.alt}`} onClick={event => openZoom(event.currentTarget)}><img src={state.url} alt={block.alt} onError={() => fail(block.assetId)} /><span>Enlarge figure</span></button> : <div className="en-notice" role="status"><b>{state?.status === 'loading' ? 'Loading figure' : 'Figure unavailable on this device'}</b><p>{state?.error ?? 'Select and validate this notebook image before saving.'}</p><p>{block.alt}</p></div>}
    {zoomError && <p role="status">{zoomError}</p>}
    <figcaption>{block.caption && <strong>{block.caption}</strong>}{asset && <small>{asset.sourceId} / {asset.location}</small>}</figcaption>
    <p className="nbr-figure-context">{block.context}</p>
    {onChange && <div className="nbr-figure-edit"><label>Figure caption<input value={block.caption ?? ''} onChange={e => onChange({ ...block, caption: e.target.value || null })} /></label><label>Figure alternative text<textarea value={block.alt} onChange={e => onChange({ ...block, alt: e.target.value })} /></label><label>Figure context<textarea value={block.context} onChange={e => onChange({ ...block, context: e.target.value })} /></label><p>Image identity and original bytes stay protected. Use an update with a new asset ID to replace an image.</p></div>}
    <dialog className="nbr-figure-dialog" ref={dialog} aria-label="Enlarged source figure" onClose={finishZoom} onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')], first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus({ preventScroll: true }) }
      else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus({ preventScroll: true }) }
    }} onClick={event => { const bounds = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.current?.close() }}><header><strong>Source figure</strong><button type="button" autoFocus onClick={() => dialog.current?.close()}>Close figure</button></header><div className="nbr-figure-stage">{state?.url && <img src={state.url} alt={block.alt} />}</div><div className="nbr-figure-description" tabIndex={0} aria-label="Figure caption and source">{block.caption && <p>{block.caption}</p>}{asset && <small>{asset.sourceId} / {asset.location}</small>}{block.context && <p>{block.context}</p>}</div></dialog>
  </figure>
}
export function NotebookStudyDiagram({ block, onChange }: { block: NotebookStudyDiagramBlock; onChange?: (block: NotebookStudyDiagramBlock) => void }) {
  const nodes = new Map(block.nodes.map(n => [n.id, n])), layout = layoutNotebookDiagram(block), id = useId().replaceAll(':', '')
  return <figure className={`nbr-diagram nbr-diagram-${block.kind}`} aria-label={block.title}><figcaption><strong>{block.title}</strong><small>Study representation, not an original source figure</small></figcaption>
    {onChange && <label>Diagram title<input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })} /></label>}
    <p className="nbr-diagram-mobile-note">Scroll the diagram sideways to see every branch and return arrow. The full relationship key follows below.</p>
    <div className="nbr-diagram-scroll" role="region" aria-label={`${block.title}: diagram`} tabIndex={0}><svg className="nbr-diagram-svg" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-labelledby={`${id}-title ${id}-description`}><title id={`${id}-title`}>{block.title}</title><desc id={`${id}-description`}>Directed connections between the supplied concepts. Each R number identifies a complete relationship in the visible key below.</desc><defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="currentColor" /></marker></defs>{layout.edges.map(edge => <g key={edge.id}><title>{`${nodes.get(edge.from)?.label}: ${edge.label}: ${nodes.get(edge.to)?.label}`}</title><path className="diagram-edge" d={edge.path} markerEnd={`url(#${id}-arrow)`} /><text className="diagram-edge-label" x={edge.labelX} y={edge.labelY}>{edge.marker}</text></g>)}{layout.nodes.map((node, index) => <g key={node.id}><rect className="diagram-node" x={node.x} y={node.y} width={node.width} height={node.height} rx="8" /><text x={node.x + 14} y={node.y + 18} fontSize="10">{index + 1}</text><text x={node.x + 14} y={node.y + 39} fontSize="13">{node.lines.map((line, i) => <tspan key={i} x={node.x + 14} dy={i ? 17 : 0}>{line}</tspan>)}</text></g>)}</svg></div>
    {block.edges.length > 0 && <section className="nbr-diagram-relationships" aria-label="Diagram relationships"><h4>Relationships</h4><ol>{block.edges.map((edge, index) => <li key={edge.id} data-edge-id={edge.id}><b>R{index + 1}</b><p><span>From: </span>{nodes.get(edge.from)?.label}</p><p><span>Relationship: </span>{edge.label}</p><p><span>To: </span>{nodes.get(edge.to)?.label}</p></li>)}</ol></section>}
    <details open={onChange ? true : undefined}><summary>Read or edit the diagram's text and relationships</summary>
    <ol className="nbr-diagram-nodes">{block.nodes.map((node, index) => <li key={node.id}><span>{index + 1}</span>{onChange ? <label>Diagram node {index + 1}<textarea value={node.label} onChange={e => onChange({ ...block, nodes: block.nodes.map(n => n.id === node.id ? { ...n, label: e.target.value } : n) })} /></label> : <p>{node.label}</p>}</li>)}</ol>
    {block.edges.length > 0 && <div className="nbr-diagram-edges"><h4>Connections</h4>{block.edges.map((edge, index) => <div key={edge.id}><span>{nodes.get(edge.from)?.label}</span><b aria-hidden="true"> / </b><span>{edge.label}</span><b aria-hidden="true"> / </b><span>{nodes.get(edge.to)?.label}</span>{onChange && <label>Diagram connection {index + 1}<textarea value={edge.label} onChange={e => onChange({ ...block, edges: block.edges.map(item => item.id === edge.id ? { ...item, label: e.target.value } : item) })} /></label>}</div>)}</div>}</details>
  </figure>
}
export function NotebookAssetThumbnail({ assetId }: { assetId: string }) {
  const { images } = useContext(NotebookImages), state = images.get(assetId)
  return state?.status === 'ready' ? <img src={state.url} alt="Selected source image preview" /> : <span>{state?.status === 'loading' ? 'Loading preview' : 'No validated image'}</span>
}
export function NotebookVisualBlock({ block, onChange }: { block: NotebookFigureBlock | NotebookStudyDiagramBlock; onChange?: (block: VisualNotebookBlock) => void }) {
  return block.type === 'figure' ? <NotebookFigure block={block} onChange={onChange} /> : <NotebookStudyDiagram block={block} onChange={onChange} />
}
export function useNotebookPracticeImages(block: VisualNotebookBlock) {
  const { pkg, images } = useContext(NotebookImages), entry = pkg?.entries.find(e => e.sections.some(s => s.blocks.some(b => b.id === block.id)))
  const missing = pkg && entry && block.type === 'practice' ? missingPracticeImages(pkg, entry.id, block.id, new Set([...images].filter(([, state]) => state.status === 'ready').map(([id]) => id))) : []
  return { pkg, entry, missing }
}
/** Only declared neutral bodies, never teaching sections, source panels or answers. */
export function NotebookPracticeStimulus({ block }: { block: Extract<VisualNotebookBlock, { type: 'practice' }> }) {
  const { entry } = useNotebookPracticeImages(block), blocks = entry?.sections.flatMap(s => s.blocks) as VisualNotebookBlock[] | undefined
  return <div className="nbr-practice-stimulus">{(block.stimulusBlockIds ?? []).map(id => {
    const item = blocks?.find(b => b.id === id)
    if (!item) return <p role="alert" key={id}>Required question setup is missing.</p>
    if (item.type === 'paragraph') return <p className="en-text" key={id}>{item.text}</p>
    if (item.type === 'table') return <div className="en-table-wrap" key={id} tabIndex={0} aria-label="Question data table"><table><thead><tr>{item.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead><tbody>{item.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
    if (item.type === 'figure' || item.type === 'study-diagram') return <NotebookVisualBlock key={id} block={item} />
    return <p role="alert" key={id}>Unsupported question setup. This item cannot be attempted.</p>
  })}</div>
}
export function NotebookVisualReview({ pkg }: { pkg: PortableNotebookPackage }) {
  if (pkg.version !== 3) return null
  return <details className="nbr-visual-review"><summary>Image discovery and inspection record</summary><p>This is the author's declared review record. A valid file or successful image upload does not prove the source was visually inspected.</p>{pkg.visualReview.sources.map(source => <section key={source.sourceId}><h4>{pkg.sources.find(s => s.id === source.sourceId)?.title ?? source.sourceId}</h4><p>Discovery: {source.discovery}. Image state: {source.imageState}.</p>{source.inspectedPortions.length > 0 && <p>Inspected: {source.inspectedPortions.join('; ')}</p>}{source.unprocessedPortions.length > 0 && <p>Not processed: {source.unprocessedPortions.join('; ')}</p>}{source.limitations.map((limit, i) => <p key={i}>{limit}</p>)}</section>)}<h4>Selected, skipped and unresolved candidates</h4>{pkg.visualReview.candidates.map(candidate => <details key={candidate.id}><summary>{candidate.sourceId} / {candidate.location}: {candidate.decision}</summary><p>Inspection: {candidate.inspection}</p><p>{candidate.reason}</p>{candidate.nextStep && <p>Next step: {candidate.nextStep}</p>}{candidate.duplicateOf && <p>Duplicate of: {candidate.duplicateOf}</p>}{candidate.changedFrom && <p>Changed from: {candidate.changedFrom}</p>}</details>)}</details>
}

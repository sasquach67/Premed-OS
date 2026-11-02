import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EyeOff, Home, List, Maximize2, Minimize2, Minus, Plus } from 'lucide-react'
import type { NotebookBlock, NotebookEntry } from '@/lib/academics/notebook/types'
import { MIND_MAP, arrowPaths, boxEdge, columnCount, handOval, mapBounds, placeInColumns, placeSections, seededRandom, smoothPath, stringSeed, type Box, type PlacedSection, type Point } from '@/lib/academics/notebook/mindMapLayout'
import { readerBlocks } from '@/lib/academics/notebook/readerPresentation'
import { NotebookInlineText } from './NotebookStudyGuide'
import { TeachFirstKeyIdea, TeachFirstLabeledNote, TeachFirstMap, TeachFirstPoint, TeachFirstTerms, isTeachFirstEntry, teachFirstParts } from './NotebookTeachFirst'
import './notebookMindMap.css'

type Section = NotebookEntry['sections'][number]
type Kind = 'question' | 'lede' | 'block'
type Item = { key: string; kind: Kind; node: ReactNode }
type MapSection = { id: string; title: string; hub: boolean; items: Item[] }
type RenderBlock = (block: NotebookBlock, section: Section) => ReactNode

const OVAL = { width: 460, height: 200, hubWidth: 640, hubHeight: 280 }
const MIN_ZOOM = .03, MAX_ZOOM = 2.5
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

function point(text: ReactNode, key: string): Item { return { key, kind: 'block', node: text } }

/** Everything in the section stays written out, in the order it is read. */
function teachFirstItems(section: Section, render: (block: NotebookBlock) => ReactNode): Item[] {
  const parts = teachFirstParts(section)
  const items: Item[] = [
    ...parts.questions.map(block => ({ key: block.id, kind: 'question' as const, node: <div data-q className="sg-q"><p><NotebookInlineText text={block.text} /></p></div> })),
    ...parts.ledes.map(block => ({ key: block.id, kind: 'lede' as const, node: <p className="sg-lede-big"><NotebookInlineText text={block.text} /></p> })),
  ]
  let number = 0
  for (const block of parts.walkthroughs) block.items.forEach((item, index) => { number++; items.push(point(<ol className="sg-walk" style={{ counterReset: `w ${number - 1}` }}><li><TeachFirstPoint item={item} byId={parts.byId} renderBlock={render} /></li></ol>, `${block.id}-${index}`)) })
  for (const block of parts.steps) block.items.forEach((item, index) => { number++; const text = typeof item === 'string' ? item : item.text, reason = typeof item === 'string' ? undefined : item.reason; items.push(point(<ol className="sg-walk" style={{ counterReset: `w ${number - 1}` }}><li><h4><NotebookInlineText text={text} /></h4>{reason && <p><NotebookInlineText text={reason} /></p>}</li></ol>, `${block.id}-${index}`)) })
  for (const block of parts.extras) items.push(point(<TeachFirstLabeledNote block={block} />, block.id))
  for (const block of parts.soWhat) items.push(point(<div className="lf-why"><p><NotebookInlineText text={block.text} /></p></div>, block.id))
  for (const block of parts.keyIdeas) items.push(point(<TeachFirstKeyIdea block={block} />, block.id))
  for (const block of parts.maps) items.push(point(<TeachFirstMap block={block} />, block.id))
  if (parts.terms.length) items.push(point(<TeachFirstTerms terms={parts.terms} />, `${section.id}-terms`))
  for (const block of parts.rest) items.push(point(<div className="sg-rest">{render(block)}</div>, block.id))
  for (const block of parts.gaps) items.push(point(<p className="sg-gap">{block.text} {block.nextStep}</p>, block.id))
  return items
}
/** Older notebooks keep the order their blocks were written in. */
function plainItems(section: Section, render: (block: NotebookBlock) => ReactNode): Item[] {
  return section.blocks.map(block => ({ key: block.id, kind: block.type === 'callout' && block.tone === 'question' ? 'question' as const : block.type === 'paragraph' && block.role === 'lede' ? 'lede' as const : 'block' as const, node: <div className="sg-rest">{render(block)}</div> }))
}

export function mindMapSections(entry: NotebookEntry, render: RenderBlock): MapSection[] {
  const teach = isTeachFirstEntry(entry)
  // The same blocks the Standard study guide shows; practice sections stay in their own tab.
  const sections = entry.sections.map(source => ({ source, section: { ...source, blocks: readerBlocks(source.blocks, 'study', source.purpose) } })).filter(({ section }) => section.blocks.length > 0)
  return sections.map(({ source, section }, index) => ({
    id: section.id, title: section.title,
    hub: index === 0 && !section.blocks.some(block => block.type === 'walkthrough'),
    items: teach ? teachFirstItems(section, block => render(block, source)) : plainItems(section, block => render(block, source)),
  }))
}

export function NotebookMindMap({ entry, renderBlock, intro }: { entry: NotebookEntry; renderBlock: RenderBlock; intro?: ReactNode }) {
  // Blocks only read the entry, so their elements can stay the same across camera and recall updates.
  const render = useRef(renderBlock)
  useLayoutEffect(() => { render.current = renderBlock })
  const sections = useMemo(() => mindMapSections(entry, (block, section) => render.current(block, section)), [entry])
  const view = useRef<HTMLDivElement>(null), world = useRef<HTMLDivElement>(null), ink = useRef<SVGGElement>(null), miniSvg = useRef<SVGSVGElement>(null), miniWindow = useRef<SVGRectElement>(null), percent = useRef<HTMLOutputElement>(null)
  const camera = useRef({ x: 0, y: 0, k: 1 }), bounds = useRef<Box>({ x0: 0, y0: 0, x1: 1, y1: 1 }), placed = useRef(new Map<string, PlacedSection>()), framed = useRef(false), signature = useRef('')
  const [outline, setOutline] = useState(false), [full, setFull] = useState(false), [recall, setRecall] = useState(false), [revealed, setRevealed] = useState(0)
  const dragged = useRef(false)
  const total = sections.reduce((sum, section) => sum + section.items.filter(item => item.kind !== 'question').length, 0)

  const apply = useCallback(() => {
    const host = view.current, inner = world.current; if (!host || !inner) return
    const { x, y, k } = camera.current
    inner.style.transform = `translate(${x}px, ${y}px) scale(${k})`
    inner.style.setProperty('--nmm-k', String(k))
    inner.style.setProperty('--nmm-tag', String(Math.max(1, (host.clientWidth < 640 ? .24 : .3) / k)))
    host.style.backgroundImage = k > .35 ? '' : 'none'
    host.style.backgroundSize = `${30 * k}px ${30 * k}px`
    host.style.backgroundPosition = `${x}px ${y}px`
    if (percent.current) percent.current.textContent = `${Math.round(k * 100)}%`
    const frame = miniWindow.current
    if (frame) { frame.setAttribute('x', String(-x / k)); frame.setAttribute('y', String(-y / k)); frame.setAttribute('width', String(host.clientWidth / k)); frame.setAttribute('height', String(host.clientHeight / k)) }
  }, [])
  const fitBox = useCallback((box: Box, limit = 1) => {
    const host = view.current; if (!host) return
    const width = host.clientWidth || 1, height = host.clientHeight || 1, k = clamp(Math.min(width / (box.x1 - box.x0), height / (box.y1 - box.y0)), MIN_ZOOM, limit)
    camera.current = { k, x: (width - (box.x0 + box.x1) * k) / 2, y: (height - (box.y0 + box.y1) * k) / 2 }
    apply()
  }, [apply])
  const home = useCallback(() => fitBox(bounds.current), [fitBox])
  const fitSection = useCallback((id: string) => {
    const s = placed.current.get(id); if (s) fitBox({ x0: s.x - 60, y0: s.y - 60, x1: s.x + s.width + 60, y1: s.y + s.height + 60 })
  }, [fitBox])
  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    const { x, y, k } = camera.current, next = clamp(k * factor, MIN_ZOOM, MAX_ZOOM), scale = next / k
    camera.current = { k: next, x: px - (px - x) * scale, y: py - (py - y) * scale }
    apply()
  }, [apply])

  const layout = useCallback(() => {
    const inner = world.current; if (!inner) return
    const { blockWidth, gutter, topGap, ovalBandGap } = MIND_MAP
    const elements = new Map([...inner.querySelectorAll<HTMLElement>('[data-nmm]')].map(el => [el.dataset.nmm, el])), element = (id: string) => elements.get(id)
    const plans = sections.map(section => {
      const band = section.items.filter(item => item.kind !== 'block'), flow = section.items.filter(item => item.kind === 'block')
      const ow = section.hub ? OVAL.hubWidth : OVAL.width, oh = section.hub ? OVAL.hubHeight : OVAL.height
      const flowHeights = flow.map(item => element(`${section.id}/${item.key}`)?.offsetHeight ?? 0)
      const columns = columnCount(flowHeights), width = Math.max(columns * (blockWidth + gutter), ow + 500), bandWidth = width - ow - ovalBandGap
      let bandY = 0
      const bandAt = band.map(item => { const el = element(`${section.id}/${item.key}`); if (el) el.style.width = `${bandWidth}px`; const y = bandY; bandY += (el?.offsetHeight ?? 0) + 16; return { key: item.key, x: ow + ovalBandGap, y } })
      const head = Math.max(bandY, oh), top = head + topGap
      const { placed: flowAt, height } = placeInColumns(flowHeights, columns, top)
      return { section, flow, flowAt, flowHeights, bandAt, ow, oh, head, top, columns, size: { id: section.id, width, height } }
    })
    const key = plans.map(plan => `${plan.size.width}x${Math.round(plan.size.height)}:${plan.flowHeights.join(',')}`).join('|')
    if (key === signature.current) return
    signature.current = key
    const sectionsAt = placeSections(plans.map(plan => plan.size))
    placed.current = new Map(sectionsAt.map(s => [s.id, s]))
    bounds.current = mapBounds(sectionsAt)
    const paths: { d: string; cls: string }[] = []
    plans.forEach((plan, index) => {
      const at = sectionsAt[index], random = seededRandom(stringSeed(plan.section.id)), wobble = (size: number) => (random() - .5) * 2 * size
      const topic = element(`topic/${plan.section.id}`), ox = at.x + plan.ow / 2, oy = at.y + plan.head / 2
      if (topic) { topic.style.left = `${ox}px`; topic.style.top = `${oy}px` }
      plan.bandAt.forEach(item => { const el = element(`${plan.section.id}/${item.key}`); if (el) { el.style.left = `${at.x + item.x}px`; el.style.top = `${at.y + item.y}px` } })
      plan.flow.forEach((item, i) => { const el = element(`${plan.section.id}/${item.key}`), spot = plan.flowAt[i]; if (el) { el.style.left = `${at.x + spot.x}px`; el.style.top = `${at.y + spot.y}px` } })
      for (let column = 0; column < plan.columns; column++) {
        const blocks = plan.flowAt.filter(spot => spot.column === column); if (!blocks.length) continue
        const x = at.x + blocks[0].x - 20, y0 = at.y + plan.top - 34, y1 = at.y + blocks[blocks.length - 1].y + 18, rail: Point[] = []
        for (let y = y0; y < y1; y += 170) rail.push([x + wobble(4), y])
        rail.push([x, y1])
        if (rail.length > 1) paths.push({ d: smoothPath(rail), cls: 'nmm-branch' })
        const trunk = arrowPaths([ox, oy + plan.oh / 2 - 8], [x, y0], .16, 0)
        paths.push({ d: trunk.line, cls: 'nmm-branch' })
        for (const spot of blocks) paths.push({ d: `M${x.toFixed(1)} ${(at.y + spot.y + 18).toFixed(1)} q10 ${wobble(3).toFixed(1)} 22 0`, cls: 'nmm-branch' })
      }
    })
    for (let i = 0; i + 1 < sectionsAt.length; i++) {
      const a = sectionsAt[i], b = sectionsAt[i + 1]
      const arrow = arrowPaths(boxEdge(a, b.x + b.width / 2, b.y + b.height / 2), boxEdge(b, a.x + a.width / 2, a.y + a.height / 2), .06, 54)
      paths.push({ d: arrow.line, cls: 'nmm-spine' }, { d: arrow.head, cls: 'nmm-head' })
    }
    if (ink.current) ink.current.innerHTML = paths.map(path => `<path class="${path.cls}" d="${path.d}"/>`).join('')
    const b = bounds.current, mini = miniSvg.current
    if (mini) {
      mini.setAttribute('viewBox', `${b.x0} ${b.y0} ${b.x1 - b.x0} ${b.y1 - b.y0}`)
      mini.querySelectorAll('.nmm-mini-section').forEach(rect => rect.remove())
      for (const s of sectionsAt) { const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); rect.setAttribute('class', 'nmm-mini-section'); rect.setAttribute('x', String(s.x)); rect.setAttribute('y', String(s.y)); rect.setAttribute('width', String(s.width)); rect.setAttribute('height', String(s.height)); rect.setAttribute('rx', '60'); mini.insertBefore(rect, miniWindow.current) }
    }
    inner.dataset.ready = 'true'
    if (framed.current) apply(); else { framed.current = true; home() }
  }, [sections, apply, home])

  useLayoutEffect(() => { signature.current = ''; framed.current = false; layout() }, [layout])
  useEffect(() => {
    // Figures load from device storage after the first paint; settle once they have.
    const inner = world.current, host = view.current; if (!inner || !host || typeof ResizeObserver === 'undefined') return
    let timer = 0
    const observer = new ResizeObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(layout, 120) })
    inner.querySelectorAll('.nmm-block').forEach(block => observer.observe(block))
    const hostObserver = new ResizeObserver(apply)
    hostObserver.observe(host)
    const imageLoaded = () => { window.clearTimeout(timer); timer = window.setTimeout(layout, 120) }
    inner.addEventListener('load', imageLoaded, true)
    return () => { window.clearTimeout(timer); observer.disconnect(); hostObserver.disconnect(); inner.removeEventListener('load', imageLoaded, true) }
  }, [layout, apply])
  useEffect(() => {
    const host = view.current; if (!host) return
    const wheel = (event: WheelEvent) => {
      if ((event.target as Element).closest('.nmm-outline')) return
      event.preventDefault()
      const box = host.getBoundingClientRect()
      if (event.ctrlKey || event.metaKey) zoomAt(event.clientX - box.left, event.clientY - box.top, Math.exp(-event.deltaY * .01))
      else { camera.current.x -= event.deltaX; camera.current.y -= event.deltaY; apply() }
    }
    host.addEventListener('wheel', wheel, { passive: false })
    return () => host.removeEventListener('wheel', wheel)
  }, [apply, zoomAt])
  useEffect(() => {
    const host = view.current; if (!host) return
    const pointers = new Map<number, { x: number; y: number }>(); let pinch = 0
    const down = (event: PointerEvent) => {
      if ((event.target as Element).closest('.nmm-tools, .nmm-mini, .nmm-outline, dialog')) return
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); dragged.current = false; host.classList.add('nmm-drag')
    }
    const move = (event: PointerEvent) => {
      const at = pointers.get(event.pointerId); if (!at) return
      if (pointers.size === 2) {
        at.x = event.clientX; at.y = event.clientY
        const [a, b] = [...pointers.values()], distance = Math.hypot(a.x - b.x, a.y - b.y), box = host.getBoundingClientRect()
        if (pinch) zoomAt((a.x + b.x) / 2 - box.left, (a.y + b.y) / 2 - box.top, distance / pinch)
        pinch = distance; dragged.current = true; return
      }
      const dx = event.clientX - at.x, dy = event.clientY - at.y
      if (Math.abs(dx) + Math.abs(dy) > 3) dragged.current = true
      camera.current.x += dx; camera.current.y += dy; at.x = event.clientX; at.y = event.clientY; apply()
    }
    const up = (event: PointerEvent) => { pointers.delete(event.pointerId); pinch = 0; if (!pointers.size) host.classList.remove('nmm-drag') }
    host.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
    return () => { host.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up) }
  }, [apply, zoomAt])
  useEffect(() => {
    if (!full) return
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setFull(false) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [full])
  useEffect(() => { fitBoxAfterResize(); function fitBoxAfterResize() { if (framed.current) home() } }, [full, home])

  const center = (): [number, number] => [(view.current?.clientWidth ?? 0) / 2, (view.current?.clientHeight ?? 0) / 2]
  const toggleRecall = () => {
    world.current?.querySelectorAll('.nmm-shown').forEach(block => block.classList.remove('nmm-shown'))
    setRevealed(0); setRecall(value => !value)
  }
  const reveal = (event: React.MouseEvent<HTMLElement>) => {
    if (!recall || dragged.current) return
    const block = (event.target as Element).closest('.nmm-block')
    if (block && !block.classList.contains('nmm-shown') && !block.classList.contains('nmm-question')) { block.classList.add('nmm-shown'); setRevealed(value => value + 1) }
  }

  return <div ref={view} className={`nmm${recall ? ' nmm-recall' : ''}${full ? ' nmm-full' : ''}`} role="region" aria-label="Mind map" onClick={reveal}>
    <div ref={world} className="nmm-world external-notebook en-document nbr-doc lf-document sg" data-reader-mode="study">
      <svg className="nmm-ink" aria-hidden="true"><g ref={ink} /></svg>
      {sections.map((section, index) => <div key={section.id} className="lf-sec sg-x nmm-group">
        <button type="button" data-nmm={`topic/${section.id}`} className={`nmm-topic${section.hub ? ' nmm-hub' : ''}`} onClick={() => { if (!dragged.current) fitSection(section.id) }}>
          <svg viewBox={`0 0 ${section.hub ? OVAL.hubWidth : OVAL.width} ${section.hub ? OVAL.hubHeight : OVAL.height}`} aria-hidden="true"><path d={handOval(section.hub ? OVAL.hubWidth : OVAL.width, section.hub ? OVAL.hubHeight : OVAL.height, stringSeed(section.id))} /></svg>
          <span>{section.title}</span>
        </button>
        {index === 0 && intro}
        {section.items.map(item => <div key={item.key} data-nmm={`${section.id}/${item.key}`} className={`nmm-block nmm-${item.kind}`}>{item.node}</div>)}
      </div>)}
    </div>
    {outline && <nav className="nmm-outline" aria-label="Map outline">{sections.map(section => <button type="button" key={section.id} onClick={() => fitSection(section.id)}>{section.title}</button>)}</nav>}
    <button type="button" className="nmm-mini" aria-label="Jump on the map" onPointerDown={event => {
      const svg = miniSvg.current, host = view.current; if (!svg || !host) return
      const r = svg.getBoundingClientRect(), b = bounds.current, scale = Math.max((b.x1 - b.x0) / r.width, (b.y1 - b.y0) / r.height), { k } = camera.current
      camera.current.x = host.clientWidth / 2 - ((b.x0 + b.x1) / 2 + (event.clientX - r.left - r.width / 2) * scale) * k
      camera.current.y = host.clientHeight / 2 - ((b.y0 + b.y1) / 2 + (event.clientY - r.top - r.height / 2) * scale) * k
      apply()
    }}><svg ref={miniSvg} preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect ref={miniWindow} className="nmm-mini-window" /></svg></button>
    <div className="nmm-tools" role="toolbar" aria-label="Map controls">
      <button type="button" aria-label="Zoom out" onClick={() => zoomAt(...center(), 1 / 1.35)}><Minus aria-hidden="true" /></button>
      <output ref={percent}>100%</output>
      <button type="button" aria-label="Zoom in" onClick={() => zoomAt(...center(), 1.35)}><Plus aria-hidden="true" /></button>
      <i />
      <button type="button" aria-label="Back to the whole map" onClick={home}><Home aria-hidden="true" /></button>
      <button type="button" aria-label="Outline" aria-pressed={outline} onClick={() => setOutline(value => !value)}><List aria-hidden="true" /></button>
      <button type="button" aria-label="Recall mode" aria-pressed={recall} onClick={toggleRecall}><EyeOff aria-hidden="true" /></button>
      {recall && <span className="nmm-count">{revealed}/{total}</span>}
      <button type="button" aria-label={full ? 'Exit full screen' : 'Full screen'} aria-pressed={full} onClick={() => setFull(value => !value)}>{full ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
    </div>
  </div>
}

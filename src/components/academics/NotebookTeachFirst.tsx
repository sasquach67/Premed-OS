import type { ReactNode } from 'react'
import type { NotebookBlock, NotebookEntry } from '@/lib/academics/notebook/types'
import type { NotebookStudyDiagramBlock } from '@/lib/academics/notebook/visualTypes'
import { NotebookInlineText } from './NotebookStudyGuide'
import type { NotebookReadingDetail } from './useNotebookReadingDetail'
import './notebookTeachFirst.css'

type Section = NotebookEntry['sections'][number]
type Walkthrough = Extract<NotebookBlock, { type: 'walkthrough' }>
type Callout = Extract<NotebookBlock, { type: 'callout' }>
type Paragraph = Extract<NotebookBlock, { type: 'paragraph' }>

/** Beta-33 sections teach through a walkthrough block (brief §2.1). */
export function isTeachFirstSection(section: Section) { return section.blocks.some(block => block.type === 'walkthrough') }
export function isTeachFirstEntry(entry: NotebookEntry) { return entry.sections.some(isTeachFirstSection) }

const termLine = /^\*\*[^*\n]+\*\*\s*[:—–-]\s*\S/
const isTermList = (block: NotebookBlock) => block.type === 'bullets' && block.items.length > 0 && block.items.every(item => termLine.test(item))
const correction = /^(Your notes|Easy to mix up):\s*/i

/** Teach first, then the reference: question, lede, walkthrough, so what, key idea, Keep it straight (map, terms, rest, gap). */
export function NotebookTeachFirstSection({ section, readingDetail, renderBlock }: { section: Section; readingDetail: NotebookReadingDetail; renderBlock: (block: NotebookBlock) => ReactNode }) {
  const condensed = readingDetail === 'condensed'
  const blocks = section.blocks.filter(block => block.type !== 'practice')
  const walkthroughs = blocks.filter((block): block is Walkthrough => block.type === 'walkthrough')
  const attached = new Set(walkthroughs.flatMap(block => block.items.flatMap(item => [item.figureBlockId, ...(item.attachedBlockIds ?? [])]).filter((id): id is string => Boolean(id))))
  const byId = new Map(blocks.map(block => [block.id, block]))
  const used = new Set<string>(attached)
  const take = (test: (block: NotebookBlock) => boolean) => { const found = blocks.filter(block => !used.has(block.id) && test(block)); found.forEach(block => used.add(block.id)); return found }
  const questions = take(block => block.type === 'callout' && block.tone === 'question') as Callout[]
  const ledes = take(block => block.type === 'paragraph' && block.role === 'lede') as Paragraph[]
  walkthroughs.forEach(block => used.add(block.id))
  const soWhat = take(block => block.type === 'paragraph' && block.role === 'why') as Paragraph[]
  const keyIdeas = take(block => block.type === 'callout' && block.tone === 'one-thing') as Callout[]
  const extras = take(block => block.type === 'callout') as Callout[]
  const maps = take(block => block.type === 'study-diagram') as NotebookStudyDiagramBlock[]
  const gaps = take(block => block.type === 'gap') as Extract<NotebookBlock, { type: 'gap' }>[]
  const termLists = take(isTermList) as Extract<NotebookBlock, { type: 'bullets' }>[]
  const rest = blocks.filter(block => !used.has(block.id))
  const terms = new Map<string, { term: string; definition: string }>()
  for (const block of blocks) for (const term of block.definedTerms ?? []) if (!terms.has(term.term.toLocaleLowerCase())) terms.set(term.term.toLocaleLowerCase(), term)
  for (const list of termLists) for (const item of list.items) {
    const match = /^\*\*([^*\n]+)\*\*\s*[:—–-]\s*(.+)$/.exec(item)
    if (match && !terms.has(match[1].toLocaleLowerCase())) terms.set(match[1].toLocaleLowerCase(), { term: match[1], definition: match[2] })
  }
  const cap = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1)
  const reference = maps.length > 0 || terms.size > 0 || rest.length > 0 || gaps.length > 0
  return <>
    {questions.map(block => <div key={block.id} data-q className="sg-q"><p><NotebookInlineText text={block.text} /></p></div>)}
    {ledes.map(block => <p key={block.id} className="sg-lede-big"><NotebookInlineText text={block.text} /></p>)}
    {walkthroughs.map(block => <ol key={block.id} className="sg-walk" data-condensed={condensed || undefined}>{block.items.map((item, index) => {
      const figure = item.figureBlockId ? byId.get(item.figureBlockId) : undefined
      return <li key={index}>
        <h4><NotebookInlineText text={item.point} /></h4>
        {!condensed && <>
          {item.paragraphs.map((paragraph, pi) => <p key={pi}><NotebookInlineText text={paragraph} /></p>)}
          {item.cards?.length ? <div className="sg-cond">{item.cards.map((card, ci) => <div key={ci}><b>{card.label}</b><NotebookInlineText text={card.text} /></div>)}</div> : null}
          {figure && <div className="sg-walkfig">{renderBlock(figure)}</div>}
          {(item.attachedBlockIds ?? []).flatMap(id => { const attachedBlock = byId.get(id); return attachedBlock ? [<div key={id} className="sg-tbl">{renderBlock(attachedBlock)}</div>] : [] })}
          {item.note && <div className="sg-note" data-label={item.note.label}><p className="sg-k">{item.note.label}</p><p><NotebookInlineText text={item.note.text.replace(correction, '')} /></p></div>}
        </>}
      </li>
    })}</ol>)}
    {!condensed && extras.map(block => {
      const label = block.tone === 'lecture-example' ? 'From lecture' : block.tone === 'analogy' ? 'Analogy' : block.tone === 'builds-on' ? 'Builds on' : correction.exec(block.text)?.[1] ?? 'Easy to mix up'
      return <div key={block.id} className="sg-note" data-tone={block.tone}><p className="sg-k">{cap(label)}</p><p><NotebookInlineText text={block.text.replace(correction, '')} /></p></div>
    })}
    {!condensed && soWhat.map(block => <div key={block.id} className="lf-why"><p><NotebookInlineText text={block.text} /></p></div>)}
    {keyIdeas.map(block => <div key={block.id} data-take className="sg-take"><p className="sg-k">Key idea</p><p><NotebookInlineText text={block.text} /></p></div>)}
    {reference && <p className="sg-ref">Keep it straight</p>}
    {maps.map(block => <TeachFirstMap key={block.id} block={block} />)}
    {!condensed && terms.size > 0 && <div className="lf-terms">{[...terms.values()].map(term => <div key={term.term} className="lf-tg"><ul className="wt-dots"><li><b>{cap(term.term)}</b><span>{cap(term.definition)}</span></li></ul></div>)}</div>}
    {!condensed && rest.map(block => <div key={block.id} className="sg-rest">{renderBlock(block)}</div>)}
    {!condensed && gaps.map(block => <p key={block.id} className="sg-gap">{block.text} {block.nextStep}</p>)}
  </>
}

const tone = (value?: string) => value === 'stimulatory' ? 'wt-node wt-go' : value === 'inhibitory' ? 'wt-node wt-stop' : value === 'external' || value === 'checkpoint' ? 'wt-node wt-ext' : 'wt-node'

/** Two-column outline: the root (or the diagram title) on top, then chip | text rows (brief §4 Map). */
export function TeachFirstMap({ block }: { block: NotebookStudyDiagramBlock }) {
  const nodes = new Map(block.nodes.map(node => [node.id, node]))
  const kids = new Map<string, typeof block.edges>()
  for (const edge of block.edges) kids.set(edge.from, [...(kids.get(edge.from) ?? []), edge])
  const incoming = new Set(block.edges.map(edge => edge.to))
  const roots = block.nodes.filter(node => !incoming.has(node.id))
  const single = roots.length === 1 && (kids.get(roots[0].id)?.length ?? 0) >= 2 ? roots[0] : null
  const groups = single ? (kids.get(single.id) ?? []).map(edge => nodes.get(edge.to)!).filter(Boolean) : roots
  const reached = new Set([...(single ? [single.id] : []), ...groups.map(node => node.id), ...groups.flatMap(node => (kids.get(node.id) ?? []).map(edge => edge.to))])
  const loose = block.nodes.filter(node => !reached.has(node.id))
  const row = (node: (typeof block.nodes)[number], members: string) => {
    const [head, tail] = node.label.includes(' — ') ? node.label.split(' — ', 2) : [node.label, '']
    return <li key={node.id}><span className={tone(node.tone)}><NotebookInlineText text={head} /></span><span className="sg-mem"><NotebookInlineText text={[tail, members].filter(Boolean).join(' · ')} /></span></li>
  }
  const outs = (id: string) => (kids.get(id) ?? []).map(edge => `${edge.label ? edge.label + ' → ' : ''}${nodes.get(edge.to)?.label ?? ''}`).join(' · ')
  return <figure className="wt-map" aria-label={block.title} data-extra={block.detail === 'extra' || undefined}><ul><li><span className="wt-node">{single?.label ?? block.title}</span><ul>
    {groups.map(node => row(node, (kids.get(node.id) ?? []).map(edge => nodes.get(edge.to)?.label ?? '').filter(Boolean).join(' · ')))}
    {loose.map(node => row(node, outs(node.id)))}
  </ul></li></ul></figure>
}

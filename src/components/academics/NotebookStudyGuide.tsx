import { createContext, useContext, useId, type ReactNode } from 'react'
import { Presentation, Lightbulb, TriangleAlert, Link, Star } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { NotebookBlock, NotebookEntry } from '@/lib/academics/notebook/types'
import type { NotebookStudyDiagramBlock } from '@/lib/academics/notebook/visualTypes'
import './notebookStudyGuide.css'

type Term = { term: string; definition: string }
const Terms = createContext<Term[]>([])
const BlockTargets = createContext('')
const LinesFirst = createContext(false)
export function isLinesFirstGuide(entry: NotebookEntry) { return Boolean(entry.argumentChain?.length || entry.sections.some(section => section.blocks.some(block => block.detail !== undefined || block.type === 'claim' || (block.type === 'paragraph' && block.role)))) }
export function useLinesFirstGuide() { return useContext(LinesFirst) }
export function guideTerms(entry: NotebookEntry): Term[] {
  const terms = new Map<string, Term>()
  for (const section of entry.sections) for (const block of section.blocks) {
    if (block.type === 'practice' || block.type === 'worked-example') continue
    for (const term of block.definedTerms ?? []) if (!terms.has(term.term.toLocaleLowerCase())) terms.set(term.term.toLocaleLowerCase(), term)
  }
  return [...terms.values()].sort((a, b) => a.term.localeCompare(b.term))
}
export function isGroupedGuide(entry: NotebookEntry) {
  return entry.sections.some(section => section.blocks.some(block => block.type === 'callout' || Boolean(block.definedTerms?.length)))
}
export function NotebookTermsProvider({ entry, children }: { entry: NotebookEntry; children: ReactNode }) {
  const prefix = useId()
  return <LinesFirst.Provider value={isLinesFirstGuide(entry)}><Terms.Provider value={guideTerms(entry)}><BlockTargets.Provider value={prefix}>{children}</BlockTargets.Provider></Terms.Provider></LinesFirst.Provider>
}
export function useGuideBlockId(id: string) { return `${useContext(BlockTargets)}-block-${id}` }
/** Deliberately bounded inline syntax: no HTML, arbitrary Markdown, or links. */
export function NotebookInlineText({ text }: { text: string }) {
  const terms = useContext(Terms)
  if (!terms.length) return <>{text}</>
  return <>{text.split(/(\*\*[^*\n]+\*\*)/g).map((part, index) => {
    if (!part.startsWith('**') || !part.endsWith('**')) return part
    const label = part.slice(2, -2), term = terms.find(item => item.term.toLocaleLowerCase() === label.toLocaleLowerCase())
    return term ? <Popover key={index}><PopoverTrigger asChild><button type="button" className="nsg-term" aria-label={`Define ${label}`}>{label}</button></PopoverTrigger><PopoverContent className="nsg-term-definition"><strong>{term.term}</strong><p>{term.definition}</p></PopoverContent></Popover> : <strong key={index}>{label}</strong>
  })}</>
}
const callouts = {
  question: { label: 'The question', icon: null },
  'lecture-example': { label: 'Lecture example', icon: Presentation },
  analogy: { label: 'Analogy / memory hook', icon: Lightbulb },
  'mix-up': { label: 'Easy to mix up', icon: TriangleAlert },
  'builds-on': { label: 'Builds on', icon: Link },
  'one-thing': { label: 'If you remember one thing', icon: Star },
}
export function NotebookCallout({ block }: { block: Extract<NotebookBlock, { type: 'callout' }> }) {
  const { label, icon: Icon } = callouts[block.tone]
  const notes = block.tone === 'mix-up' && /^Your notes:\s*/i.test(block.text)
  const content = notes ? block.text.replace(/^Your notes:\s*/i, '') : block.text
  return <aside className="nsg-callout" data-tone={block.tone}><div className="nsg-callout-label">{Icon && <Icon size={15} aria-hidden="true" />}{notes ? 'Your notes' : label}</div><p className="en-text"><NotebookInlineText text={content} /></p></aside>
}
export function ProfessorStressed() { return <span className="nsg-stressed"><Presentation size={12} aria-hidden="true" />Professor stressed</span> }
export function NotebookGlossary({ entry, headingId }: { entry: NotebookEntry; headingId?: string }) {
  const terms = guideTerms(entry)
  return terms.length ? <section className="nsg-glossary" aria-label="Glossary"><h2 id={headingId} tabIndex={headingId ? -1 : undefined}>Glossary</h2><dl>{terms.map(term => <div key={term.term}><dt>{term.term}</dt><dd>{term.definition}</dd></div>)}</dl></section> : null
}
/** Only a complete rooted tree can use containment connectors without losing links. */
export function isGroupedTree(block: NotebookStudyDiagramBlock) {
  if (!['hierarchy', 'concept-map'].includes(block.kind)) return false
  const incoming = new Map(block.nodes.map(node => [node.id, 0]))
  for (const edge of block.edges) incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1)
  const roots = block.nodes.filter(node => !incoming.get(node.id))
  if (roots.length !== 1 || [...incoming.values()].some(count => count > 1)) return false
  const visited = new Set<string>()
  function visit(id: string) { if (visited.has(id)) return; visited.add(id); for (const edge of block.edges.filter(edge => edge.from === id)) visit(edge.to) }
  visit(roots[0].id)
  return visited.size === block.nodes.length
}
export function NotebookGroupMap({ block }: { block: NotebookStudyDiagramBlock }) {
  const prefix = useContext(BlockTargets), linesFirst = useLinesFirstGuide()
  const incoming = new Set(block.edges.map(edge => edge.to))
  const roots = block.nodes.filter(node => !incoming.has(node.id))
  function render(id: string, ancestors: string[] = [], relation?: string): ReactNode {
    const node = block.nodes.find(node => node.id === id)
    if (!node || ancestors.includes(id)) return null
    const children = block.edges.filter(edge => edge.from === id)
    return <li key={id}><div className={`nsg-map-item${linesFirst && ancestors.length > 1 ? ' lf-map-member' : ''}`}>{relation && (!linesFirst || (ancestors.length === 1 && children.length === 0)) && <small className={['includes', 'contains'].includes(relation.toLowerCase()) ? 'sr-only' : undefined}>{relation}</small>}{node.targetBlockId ? <a className="nsg-node" data-tone={node.tone ?? 'neutral'} href={`#${prefix}-block-${node.targetBlockId}`} onClick={event => {
      const target = event.currentTarget.ownerDocument.getElementById(`${prefix}-block-${node.targetBlockId}`)
      if (target) { event.preventDefault(); target.scrollIntoView({ block: 'start', behavior: 'auto' }); target.focus({ preventScroll: true }) }
    }}>{node.label}</a> : <span className="nsg-node" data-tone={node.tone ?? 'neutral'}>{node.label}</span>}</div>{children.length > 0 && <ul>{children.map(edge => render(edge.to, [...ancestors, id], edge.label))}</ul>}</li>
  }
  return <figure className={`nsg-map${linesFirst ? ' lf-map wt-map' : ''}`} aria-label={block.title}><figcaption>{block.title}</figcaption><ul className="nsg-tree">{(roots.length ? roots : block.nodes).map(node => render(node.id))}</ul></figure>
}
export function NotebookSummary({ entry, renderMap }: { entry: NotebookEntry; renderMap: (block: NotebookStudyDiagramBlock) => ReactNode }) {
  return <section className="nsg-summary" aria-label="One-page summary"><h2>{entry.title}</h2><p className="nsg-summary-intro">Maps, key ideas and defined terms</p><div className="nsg-summary-grid">{entry.sections.filter(section => section.purpose !== 'practice').map(section => {
    const blocks = section.blocks.filter(block => block.type === 'study-diagram' || (block.type === 'callout' && block.tone === 'one-thing'))
    return blocks.length ? <section key={section.id}><h3>{section.title}</h3>{blocks.map(block => block.type === 'study-diagram' ? <div key={block.id}>{renderMap({ ...block, nodes: block.nodes.map(node => ({ ...node, targetBlockId: undefined })) })}</div> : block.type === 'callout' ? <NotebookCallout key={block.id} block={block} /> : null)}</section> : null
  })}<NotebookGlossary entry={entry} /></div></section>
}
/** Practice stays in its own view. Map section links through objective associations. */
export function sectionPracticeIds(entry: NotebookEntry, section: NotebookEntry['sections'][number]): string[] {
  const objectives = entry.objectives.filter(objective => section.learningObjectiveIds?.includes(objective.id) || entry.requirements.find(requirement => requirement.id === objective.requirementId)?.sectionIds.includes(section.id))
  return [...new Set([...section.blocks.filter(block => block.type === 'practice').map(block => block.id), ...objectives.flatMap(objective => objective.practiceBlockIds)])]
}

/** Fit the complete summary to one A3 landscape sheet, without dropping content. */
export function prepareNotebookSummaryPrint() {
  const summary = document.querySelector<HTMLElement>('.nsg-summary')
  if (!summary) return
  document.querySelector('.nsg-print-page')?.remove()
  const page = document.createElement('section'), content = summary.cloneNode(true) as HTMLElement
  page.className = 'nsg-print-page'; page.setAttribute('aria-hidden', 'true')
  content.classList.add('nsg-print-content'); page.append(content); document.body.append(page)
  const scale = Math.min(1, Math.max(1, page.clientHeight - 2) / Math.max(1, content.scrollHeight, content.getBoundingClientRect().height))
  content.style.transform = `scale(${scale})`
  return page
}
export async function printNotebookSummary() {
  await document.fonts.ready
  const page = prepareNotebookSummaryPrint()
  if (!page) return
  const clean = () => page.remove()
  window.addEventListener('afterprint', clean, { once: true })
  try { window.print() } catch (error) { clean(); throw error }
}

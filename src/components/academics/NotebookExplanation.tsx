import type { NotebookArgumentLink } from '@/lib/academics/notebook/types'
import { NotebookInlineText } from './NotebookStudyGuide'

export function NotebookArgumentChain({ items, targetId }: { items: NotebookArgumentLink[]; targetId: (sectionId: string) => string }) {
  return <section className="lf-argument" aria-label="Argument chain"><h2>How the argument fits together</h2><ol className="lf-chain">{items.map((item, index) => <li key={`${item.sectionId}-${index}`}><a href={`#${targetId(item.sectionId)}`} onClick={event => { const target = document.getElementById(targetId(item.sectionId)); if (target) { event.preventDefault(); target.scrollIntoView({ block: 'start' }); target.focus({ preventScroll: true }) } }}><strong>{item.label}</strong><span><NotebookInlineText text={item.line} /></span></a></li>)}</ol></section>
}

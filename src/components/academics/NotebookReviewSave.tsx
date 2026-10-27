import type { ReactNode } from 'react'
import { Check, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import './notebookReviewSave.css'

export function NotebookReviewSummary({ pkg, update = false, revision, onChooseDifferent }: { pkg: NotebookPackage; update?: boolean; revision?: number; onChooseDifferent: () => void }) {
  const sections = pkg.entries.flatMap(entry => entry.sections), practice = sections.flatMap(section => section.blocks).filter(block => block.type === 'practice')
  return <header className="nr-summary"><div><p className="en-eyebrow">{update ? revision ? `Update · revision ${revision}` : 'Notebook update' : 'New notebook'}</p><h2>{pkg.entries.map(entry => entry.title).join(' · ')}</h2><div className="nr-summary-counts"><span>{sections.length} sections</span><span>{practice.length} practice</span><span>{pkg.sources.length} sources</span></div></div><Button variant="ghost" onClick={onChooseDifferent}>Choose a different folder</Button></header>
}
export function NotebookReviewCheck({ title, detail, choice = false, children }: { title: string; detail?: string; choice?: boolean; children?: ReactNode }) {
  const Icon = choice ? TriangleAlert : Check
  return <li className="nr-check" data-state={choice ? 'choice' : 'ready'}><span className="nr-check-icon"><Icon size={18} aria-hidden="true" /></span><div><p>{title}</p>{detail && <small>{detail}</small>}{children && <div className="nr-check-actions">{children}</div>}</div></li>
}
/** Updates show a change count instead of a side-by-side comparison. */
export function NotebookUpdateCounts({ added, revised, removed, kept }: { added: number; revised: number; removed: number; kept: number }) {
  return <dl className="nr-diff" aria-label="Change summary"><div data-tone="added"><dt>sections added</dt><dd>{added ? `+${added}` : 0}</dd></div><div data-tone="revised"><dt>sections revised</dt><dd>{revised}</dd></div><div data-tone="removed"><dt>removed</dt><dd>{removed}</dd></div><div><dt>practice records kept</dt><dd>{kept}</dd></div></dl>
}

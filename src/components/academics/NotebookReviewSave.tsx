import type { ReactNode } from 'react'
import { Check, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import './notebookReviewSave.css'

export function NotebookReviewSummary({ pkg, update = false, onChooseDifferent }: { pkg: NotebookPackage; update?: boolean; onChooseDifferent: () => void }) {
  const sections = pkg.entries.flatMap(entry => entry.sections), practice = sections.flatMap(section => section.blocks).filter(block => block.type === 'practice')
  return <header className="nr-summary"><div><p className="en-eyebrow">{update ? 'Notebook update' : 'New notebook'}</p><h2>{pkg.entries.map(entry => entry.title).join(' · ')}</h2><div className="nr-summary-counts"><span>{sections.length} sections</span><span>{practice.length} practice</span><span>{pkg.sources.length} sources</span></div></div><Button variant="ghost" onClick={onChooseDifferent}>Choose a different folder</Button></header>
}
export function NotebookReviewCheck({ title, detail, choice = false, children }: { title: string; detail?: string; choice?: boolean; children?: ReactNode }) {
  const Icon = choice ? TriangleAlert : Check
  return <li className="nr-check" data-state={choice ? 'choice' : 'ready'}><span className="nr-check-icon"><Icon size={18} aria-hidden="true" /></span><div><p>{title}</p>{detail && <small>{detail}</small>}{children && <div className="nr-check-actions">{children}</div>}</div></li>
}

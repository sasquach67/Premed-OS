import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

/** A scrollable presentation boundary; save permissions belong to the import panel. */
export function NotebookImportPreview({ children, fullContent, title = 'Preview — not saved yet' }: { children: ReactNode; /** Shown in the full preview instead of the inline content. */ fullContent?: ReactNode; title?: string }) {
  const id = useId(), [full, setFull] = useState(false)
  return <section className="en-notebook-preview" aria-labelledby={`${id}-heading`}>
    <header className="en-notebook-preview-heading"><h3 id={`${id}-heading`}>{title}</h3><Button variant="ghost" onClick={() => setFull(true)}>Open full preview</Button></header>
    <div className="en-notebook-preview-scroll" role="region" aria-labelledby={`${id}-heading`} tabIndex={0}>{children}</div>
    <Dialog open={full} onOpenChange={setFull}><DialogContent className="nr-full-preview external-notebook"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription className="sr-only">Full notebook preview. Review the content, then close this preview to save.</DialogDescription></DialogHeader>{fullContent ?? children}</DialogContent></Dialog>
  </section>
}

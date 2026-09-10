import { useId, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/** A presentation boundary only: opening the preview never grants permission to save. */
export function NotebookImportPreview({ children, title = 'Preview — not saved yet' }: { children: ReactNode; title?: string }) {
  const id = useId()
  const viewport = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  return <section className="en-notebook-preview" data-expanded={expanded} aria-labelledby={`${id}-heading`}>
    <header className="en-notebook-preview-heading"><h3 id={`${id}-heading`}>{title}</h3></header>
    <div className="en-notebook-preview-window">
      <div ref={viewport} id={`${id}-content`} className="en-notebook-preview-scroll" role="region" aria-label="Notebook preview content" tabIndex={expanded ? 0 : -1} inert={!expanded} aria-hidden={!expanded}>
        {children}
      </div>
      {!expanded && <div className="en-notebook-preview-fade" aria-hidden="true" />}
    </div>
    <footer className="en-notebook-preview-footer">
      <p>{expanded ? 'Full preview · scroll within the panel' : 'Preview cut off here'}</p>
      <Button variant="outline" aria-expanded={expanded} aria-controls={`${id}-content`} onClick={() => {
        if (expanded && viewport.current) viewport.current.scrollTop = 0
        setExpanded(!expanded)
      }}>{expanded ? 'Collapse preview' : 'Expand preview'}</Button>
    </footer>
  </section>
}

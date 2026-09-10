import { useId, type ReactNode } from 'react'

/** A scrollable presentation boundary; save permissions belong to the import panel. */
export function NotebookImportPreview({ children, title = 'Preview — not saved yet' }: { children: ReactNode; title?: string }) {
  const id = useId()
  return <section className="en-notebook-preview" aria-labelledby={`${id}-heading`}>
    <header className="en-notebook-preview-heading"><h3 id={`${id}-heading`}>{title}</h3></header>
    <div className="en-notebook-preview-scroll" role="region" aria-labelledby={`${id}-heading`} tabIndex={0}>
      {children}
    </div>
  </section>
}

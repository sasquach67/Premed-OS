import { useMemo } from 'react'
import { notebookTableHeadingAdjustments } from '@/lib/academics/notebook/package'

export function NotebookImportAdjustments({ raw }: { raw: string }) {
  const changes = useMemo(() => notebookTableHeadingAdjustments(raw), [raw])
  if (!changes.length) return null
  return <details className="en-small-detail en-import-adjustments">
    <summary>Blank table headings adjusted ({changes.length})</summary>
    <p>Premed OS supplied neutral column labels. Table cells and source information were kept unchanged. Complete backups retain the exact input. Export original retains the first import’s text.</p>
    <ul>{changes.map(change => <li key={change.path}><code>{change.path}</code>: {JSON.stringify(change.original)} → <strong>{change.replacement}</strong></li>)}</ul>
    <p>For future files, give every table column a non-empty heading and keep each row the same width.</p>
  </details>
}

import { compareNotebooks, notebookPracticePolicy, readableDifference } from '@/lib/academics/notebook/revision'
import type { NotebookPackage } from '@/lib/academics/notebook/types'

export function NotebookComparison({ before, after, entryId, separate = false }: { before: NotebookPackage; after: NotebookPackage; entryId: string; separate?: boolean }) {
  const differences = compareNotebooks(before, after, entryId)
  const policy = notebookPracticePolicy(before, after, entryId)
  return <section className="en-comparison" aria-label="Notebook changes"><h3>What changes</h3><p>{differences.filter(d => d.status === 'Added').length} added / {differences.filter(d => d.status === 'Changed').length} changed / {differences.filter(d => d.status === 'Removed').length} removed</p><p className="en-muted">These are exact content differences, not an AI judgment of accuracy or meaning. Review teaching, coverage and source changes.</p>
    <aside className="en-notice" aria-label="Practice changes"><b>Practice and your notes</b>{separate ? <p>The separate copy starts with empty notes and practice records. Your existing notebook keeps its notes, responses and checkmarks unchanged; nothing transfers automatically.</p> : <><p>{policy.explanation}</p>{policy.affectedIds.length > 0 && <><p>Practice that starts fresh:</p><ul>{before.entries.find(e => e.id === entryId)?.sections.flatMap(s => s.blocks).filter(b => policy.affectedIds.includes(b.id)).map(b => <li key={b.id}>{b.type === 'practice' ? b.prompt : b.id}</li>)}</ul></>}<p>Your saved notes stay with the entry when you accept an update.</p></>}</aside>
    {differences.map((difference, i) => <details className="en-difference" key={i}><summary>{difference.status}: {difference.kind} / {difference.label}</summary><div className="en-diff-columns"><div><h4>Before</h4><pre>{readableDifference(difference.before)}</pre></div><div><h4>Proposed</h4><pre>{readableDifference(difference.after)}</pre></div></div></details>)}
    {!differences.length && <p>No content changes. Accepting will not create another history version.</p>}
  </section>
}

import { compareNotebooks, notebookPracticePolicy, readableDifference } from '@/lib/academics/notebook/revision'
import { canonical } from '@/lib/academics/notebook/package'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import './notebookReviewSave.css'

/** Word-level retained spans separate insertion from replacement; bounded for large source records. */
export function changedTextParts(before: string, after: string): { text: string; change?: 'added' | 'edited' }[] {
  const a = before.match(/\s+|\S+/g) ?? [], b = after.match(/\s+|\S+/g) ?? []
  if (!a.length) return [{ text: after, change: 'added' }]
  if (a.length * b.length > 160000) return [{ text: after, change: 'edited' }]
  const grid = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) grid[i][j] = a[i] === b[j] ? grid[i + 1][j + 1] + 1 : Math.max(grid[i + 1][j], grid[i][j + 1])
  const result: { text: string; change?: 'added' | 'edited' }[] = []
  let i = 0, j = 0
  while (j < b.length) {
    if (i < a.length && a[i] === b[j]) { result.push({ text: b[j++] }); i++; continue }
    const start = j, old = i
    while (j < b.length && !(i < a.length && a[i] === b[j])) {
      if (i < a.length && grid[i + 1][j] >= grid[i][j + 1]) i++
      else j++
    }
    if (j > start) result.push({ text: b.slice(start, j).join(''), change: i > old ? 'edited' : 'added' })
  }
  return result
}
export function changedNotebookSections(before: NotebookPackage, after: NotebookPackage, entryId: string) {
  const old = before.entries.find(entry => entry.id === entryId)
  const result: Record<string, 'added' | 'changed'> = {}
  for (const section of after.entries.find(entry => entry.id === entryId)?.sections ?? []) {
    const previous = old?.sections.find(item => item.id === section.id)
    if (!previous) result[section.id] = 'added'
    else if (canonical(previous) !== canonical(section)) result[section.id] = 'changed'
  }
  return result
}
export function NotebookComparison({ before, after, entryId, separate = false }: { before: NotebookPackage; after: NotebookPackage; entryId: string; separate?: boolean }) {
  const differences = compareNotebooks(before, after, entryId), policy = notebookPracticePolicy(before, after, entryId)
  return <section className="en-comparison nr-changes" aria-label="Notebook changes"><h3>Changes</h3><p>{differences.length} changes · {differences.filter(d => d.status === 'Added').length} added · {differences.filter(d => d.status === 'Changed').length} edited · {differences.filter(d => d.status === 'Removed').length} removed</p><p className="nr-change-legend"><span>Added text</span><span>Edited text</span></p>
    <details aria-label="Practice changes"><summary>Practice and your notes</summary>{separate ? <p>The separate copy starts with empty notes and practice records. Your existing notebook keeps its notes, responses and checkmarks.</p> : <><p>{policy.explanation}</p><p>Your saved notes stay with the entry.</p></>}</details>
    <div className="nr-change-list">{differences.map((difference, index) => <details className="en-difference" data-status={difference.status} key={index}><summary>{difference.status}: {difference.kind} / {difference.label}</summary><div className="nr-change-text">{difference.after === undefined ? <span className="nr-change-removed">Removed: {readableDifference(difference.before)}</span> : changedTextParts(difference.before === undefined ? '' : readableDifference(difference.before), readableDifference(difference.after)).map((part, pi) => part.change ? <mark data-change={part.change} key={pi}>{part.text}</mark> : <span key={pi}>{part.text}</span>)}</div></details>)}</div>
    {!differences.length && <p>No content changes. Saving will not create another history version.</p>}
  </section>
}

const NON_TEXT_KEYS = new Set(['id', 'type', 'sourceIds', 'excerptIds', 'practiceBlockIds', 'stimulusBlockIds', 'assetId', 'requirementId', 'sectionId', 'order', 'provenance', 'detail', 'tone', 'role', 'correctIndex'])
function plainText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(plainText).filter(Boolean).join(' ')
  if (value && typeof value === 'object') return Object.entries(value).filter(([key]) => !NON_TEXT_KEYS.has(key)).map(([, item]) => plainText(item)).filter(Boolean).join(' ')
  return ''
}
/** Changed words with a little surrounding context, so a revised section reads as a short excerpt. */
function changedExcerpt(before: string, after: string, context = 12) {
  const parts = changedTextParts(before, after)
  const near = parts.map((_, index) => parts.slice(Math.max(0, index - context), index + context + 1).some(part => part.change))
  const result: ({ text: string; change?: 'added' | 'edited' } | null)[] = []
  parts.forEach((part, index) => { if (near[index]) result.push(part); else if (result.at(-1) !== null) result.push(null) })
  while (result[0] === null) result.shift()
  // Join changed words split only by retained spaces, so a changed phrase reads as one mark.
  const merged: typeof result = []
  for (const part of result) {
    const last = merged.at(-1), gap = merged.at(-2)
    if (part?.change && gap?.change === part.change && last && !last.change && !last.text.trim()) { merged.pop(); merged[merged.length - 1] = { text: gap.text + last.text + part.text, change: part.change } }
    else merged.push(part)
  }
  return merged.some(part => part?.change) ? merged : []
}
/** Compact section rows for an update review: what was revised, added or removed, with changed wording marked. */
export function NotebookUpdateChanges({ before, after, entryId }: { before: NotebookPackage; after: NotebookPackage; entryId: string }) {
  const old = before.entries.find(entry => entry.id === entryId), next = after.entries.find(entry => entry.id === entryId)
  if (!old || !next) return null
  const status = changedNotebookSections(before, after, entryId)
  const removed = old.sections.filter(section => !next.sections.some(item => item.id === section.id))
  const label = { added: 'New', changed: 'Revised', removed: 'Removed' } as const
  const row = (key: string, index: number, title: string, state?: keyof typeof label) => <div className="nr-sec" data-status={state} key={key}><i>{String(index + 1).padStart(2, '0')}</i><span>{title}</span>{state && <em>{label[state]}</em>}</div>
  return <div className="nr-update-changes">
    <p className="nr-update-legend"><span><i aria-hidden="true" />Added</span><span><i aria-hidden="true" />Revised</span></p>
    {next.sections.map((section, index) => {
      const previous = old.sections.find(item => item.id === section.id)
      const excerpts = status[section.id] === 'changed' && previous ? section.blocks.map(block => { const prior = previous.blocks.find(item => item.id === block.id); return canonical(prior) === canonical(block) ? [] : changedExcerpt(plainText(prior), plainText(block)) }).filter(parts => parts.length).slice(0, 2) : []
      return <div key={section.id}>{row(section.id, index, section.title, status[section.id])}{excerpts.map((parts, ei) => <p className="nr-sec-body" key={ei}>{parts.map((part, pi) => part === null ? <span key={pi}> … </span> : part.change ? <mark className="nr-inline-change" data-change={part.change} key={pi}>{part.text}</mark> : <span key={pi}>{part.text}</span>)}</p>)}</div>
    })}
    {removed.map((section, index) => row(`removed-${section.id}`, next.sections.length + index, section.title, 'removed'))}
  </div>
}

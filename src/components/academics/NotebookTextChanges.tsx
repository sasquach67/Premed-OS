import { createContext, useContext, type ReactNode } from 'react'
import type { NotebookPackage } from '@/lib/academics/notebook/types'
import { changedTextParts } from './NotebookComparison'

const Baseline = createContext<{ before: NotebookPackage; after: NotebookPackage } | null>(null)
export function NotebookTextChanges({ before, after, children }: { before?: NotebookPackage; after: NotebookPackage; children: ReactNode }) {
  return <Baseline.Provider value={before ? { before, after } : null}>{children}</Baseline.Provider>
}
/** Match stable record IDs through reordered arrays rather than comparing unrelated positions. */
export function useNotebookChangedText(path: (string | number)[], value: string): ReactNode | undefined {
  const context = useContext(Baseline)
  if (!context) return undefined
  let before: unknown = context.before, after: unknown = context.after
  for (const key of path) {
    if (Array.isArray(after) && typeof key === 'number') {
      const item = after[key]
      before = Array.isArray(before) ? item && typeof item === 'object' && 'id' in item ? before.find(candidate => candidate && typeof candidate === 'object' && candidate.id === item.id) : before[key] : undefined
      after = item
    } else {
      before = before && typeof before === 'object' ? (before as Record<string | number, unknown>)[key] : undefined
      after = after && typeof after === 'object' ? (after as Record<string | number, unknown>)[key] : undefined
    }
  }
  if (before === value) return undefined
  return changedTextParts(typeof before === 'string' ? before : '', value).map((part, index) => part.change ? <mark className="nr-inline-change" data-change={part.change} key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>)
}

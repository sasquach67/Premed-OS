import { useMemo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { LectureRecord } from '@/lib/types'
import { parseNotebookPackage } from '@/lib/academics/notebook/package'
import { projectNotebookEntry } from '@/lib/academics/notebook/visualProjection'

/** Validate before the saved reader derives keys or opens update/edit controls.
 * Recovery uses the untouched record, never a stripped or normalized package. */
export function NotebookReadGuard({ lecture, downloadRecovery, children }: {
  lecture: LectureRecord
  downloadRecovery: (text: string) => void
  children: ReactNode
}) {
  const notebook = lecture.importedNotebook
  const current = notebook?.current, entryId = notebook?.entryId
  const error = useMemo(() => {
    try {
      if (!current || !entryId) throw new Error('The saved notebook record is missing.')
      const pkg = parseNotebookPackage(JSON.stringify(current))
      projectNotebookEntry(pkg, entryId)
      return null
    } catch (failure) {
      return failure instanceof Error ? failure.message : 'The saved notebook could not be validated.'
    }
  }, [current, entryId])
  if (!error) return children
  return <section className="external-notebook en-notice" aria-label="Notebook unavailable">
    <div role="alert"><h2>This notebook needs attention</h2><p>Its saved content could not be validated. Nothing was changed. Reopen the current version of Premed OS and try again. If this continues, keep a recovery copy before correcting the notebook.</p><p className="en-text">{error}</p></div>
    {notebook && <><Button variant="outline" onClick={() => downloadRecovery(JSON.stringify({ format: 'premed-os-notebook-backup', version: 1, destinationCourseId: lecture.courseId, notebook }, null, 2))}>Download saved JSON records</Button><p>These records retain the saved content, history, notes and progress. Image bytes are not included.</p></>}
  </section>
}

import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { pendingRollovers } from '@/lib/academics/termRollover'
import { createTermReport } from '@/lib/academics/termReport'
import { termReportRoute } from '@/lib/academics/termReportRoute'
import type { Course } from '@/lib/types'
import { Button } from '@/components/ui/button'

export function TermRollover() {
  const courses = useStore((state) => state.courses)
  const currentTerm = useStore((state) => state.profile.startTerm)
  const [archivedCourseId, setArchivedCourseId] = useState<string | null>(null)
  const course = courses.find((item) => item.id === archivedCourseId) ?? pendingRollovers(courses, currentTerm)[0]
  return course ? <CourseArchive key={course.id} course={course} currentTerm={currentTerm} onRetain={setArchivedCourseId} onContinue={() => setArchivedCourseId(null)} hasNext={pendingRollovers(courses, currentTerm).some((item) => item.id !== course.id)} /> : null
}

function CourseArchive({ course, currentTerm, onRetain, onContinue, hasNext }: { course: Course; currentTerm?: string; onRetain: (id: string) => void; onContinue: () => void; hasNext: boolean }) {
  const navigate = useNavigate()
  const [reportId, setReportId] = useState<string | null>(null)
  const [archived, setArchived] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  async function archive() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    let createdId: string | null = null
    // Retain this view while the store changes; this is not a success state.
    onRetain(course.id)
    try {
      await useStore.getState().update((draft) => {
        const saved = draft.courses.find((item) => item.id === course.id)
        if (!saved) throw new Error('This course is no longer available.')
        if (saved.rolloverAt != null) return
        saved.rolloverAt = Date.now()
        if (pendingRollovers(draft.courses, currentTerm).some((item) => item.term === course.term)) return
        const report = createTermReport({ id: uid(), input: { courses: draft.courses, center: draft.academics.classCenter, term: course.term }, order: draft.academics.classCenter.termReports.length })
        draft.academics.classCenter.termReports.push(report)
        createdId = report.id
      })
      setReportId(createdId)
      setArchived(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The course could not be archived. Please try again.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function dismiss() {
    setError('')
    try {
      await useStore.getState().update((draft) => {
        const saved = draft.courses.find((item) => item.id === course.id)
        if (saved && currentTerm) saved.rolloverDismissedTerm = currentTerm
      })
      onContinue()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The course could not be dismissed. Please try again.')
    }
  }
  return <section className="rounded-2xl border border-border bg-card p-4">
    <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Completed course</p>
    <h3 className="mt-1 font-display text-lg font-extrabold">{course.code} · {course.term}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{archived ? 'The course is archived. Your materials and study records are preserved.' : 'Keep the completed course in your academic record. Your materials and study records stay saved.'}</p>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    <div className="mt-3 flex flex-wrap gap-2">{!archived && <Button size="sm" disabled={busy} onClick={archive}>{busy ? 'Archiving…' : 'Archive completed course'}</Button>}{!archived && currentTerm && <Button size="sm" variant="ghost" disabled={busy} onClick={dismiss}>Not now</Button>}{reportId && <Button size="sm" variant="outline" onClick={() => navigate(termReportRoute(reportId))}>View your Term Report</Button>}{archived && <Button size="sm" variant="ghost" onClick={onContinue}>{hasNext ? 'Continue to next course' : 'Done'}</Button>}</div>
  </section>
}

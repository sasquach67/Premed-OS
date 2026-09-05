import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { LectureCapturePanel } from '@/components/academics/LectureCapturePanel'

export function JournalEntryPage() {
  const { courseId, entryId } = useParams()
  const navigate = useNavigate()
  const course = useStore(state => state.courses.find(item => item.id === courseId))
  const data = useStore(state => state.academics.classCenter)
  if (!course) return <section className="p-6"><h1>Class not found</h1><Button onClick={() => navigate('/academics')}>Back to Academics</Button></section>
  const back = `/academics/classes/${encodeURIComponent(course.id)}`
  const entry = entryId !== 'new' ? data.lectures.find(item => item.id === entryId && item.courseId === course.id) : undefined
  if (entryId !== 'new' && !entry) return <section className="p-6"><h1>Journal entry not found</h1><Button onClick={() => navigate(back)}>Back to Class Journal</Button></section>
  return <section className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
    <Button variant="ghost" onClick={() => navigate(back)}><ArrowLeft aria-hidden="true"/>Back to Class Journal</Button>
    <header><h1 className="font-display text-3xl font-extrabold">{entry ? 'Continue journal entry' : 'Add to journal'}</h1><p className="mt-2 text-muted-foreground">{course.code} · A lecture, a study session, or an exam review.</p></header>
    <LectureCapturePanel key={entryId} courseId={course.id} course={course} data={data} initialLectureId={entry?.id} initialDestination="transcript" onNavigateLecture={id => navigate(`/academics/classes/${encodeURIComponent(course.id)}/journal/${encodeURIComponent(id)}`, { replace: true })} onOpenNotes={() => navigate(`${back}?classTab=guide`)}/>
  </section>
}

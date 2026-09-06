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
  if (entryId !== 'new' && !entry) return <section className="p-6"><h1>Notebook entry not found</h1><Button onClick={() => navigate(back)}>Back to Class Notebook</Button></section>
  return <section className="notebook-entry-page w-full min-w-0 space-y-5 px-4 pb-8 pt-2 md:px-8">
    <Button variant="ghost" className="h-9 px-0 hover:bg-transparent" onClick={() => navigate(back)}><ArrowLeft aria-hidden="true"/>Back to Class Notebook</Button>
    <LectureCapturePanel key={entryId} courseId={course.id} course={course} data={data} initialLectureId={entry?.id} initialDestination="transcript" onNavigateLecture={id => navigate(`/academics/classes/${encodeURIComponent(course.id)}/lectures/${encodeURIComponent(id)}`, { replace: true })} onOpenNotes={() => navigate(`${back}?classTab=guide`)}/>
  </section>
}

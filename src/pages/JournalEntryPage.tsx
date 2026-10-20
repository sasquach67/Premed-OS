import { useRememberOpenedNotebook } from '@/hooks/useRememberOpenedNotebook'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Brain } from 'lucide-react'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { LectureCapturePanel } from '@/components/academics/LectureCapturePanel'
import { ExternalNotebookWorkflow } from '@/components/academics/ExternalNotebookWorkflow'
import { lessonTarget, type NotebookTarget } from '@/lib/academics/lessonContext'
import { buildReadingItems } from '@/lib/academics/readingGroups'

export function JournalEntryPage() {
  const [builtIn, setBuiltIn] = useState(false)
  const { courseId, entryId } = useParams()
  useRememberOpenedNotebook(courseId, entryId)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const update = useStore(state => state.update)
  const course = useStore(state => state.courses.find(item => item.id === courseId))
  const data = useStore(state => state.academics.classCenter)
  if (!course) return <section className="p-6"><h1>Class not found</h1><Button onClick={() => navigate('/academics')}>Back to Academics</Button></section>
  const back = `/academics/classes/${encodeURIComponent(course.id)}`
  // Started from a lesson or reading (Class days, Lessons tab): one notebook per lesson.
  const lessonParam = params.get('lesson'), readingParam = params.get('reading')
  const schedule = data.workspaces.find(item => item.courseId === course.id)?.syllabusSchedule
  const reading = readingParam ? buildReadingItems(data.assignedReadings.filter(item => item.courseId === course.id)).find(item => item.key === readingParam) : undefined
  const target: NotebookTarget | undefined = lessonParam && /^\d+$/.test(lessonParam) ? lessonTarget(schedule, Number(lessonParam))
    : reading ? { readingKey: reading.key, title: reading.title, label: reading.title } : undefined
  function linkTarget(id: string) {
    if (!target) return
    update(draft => { const saved = draft.academics.classCenter.lectures.find(item => item.id === id); if (!saved) return; if (target.lesson !== undefined) saved.lesson = target.lesson; if (target.readingKey) saved.readingKey = target.readingKey })
  }
  const entry = entryId !== 'new' ? data.lectures.find(item => item.id === entryId && item.courseId === course.id) : undefined
  if (entryId !== 'new' && !entry) return <section className="p-6"><h1>Notebook entry not found</h1><Button onClick={() => navigate(back)}>Back to Class Notebook</Button></section>
  return <section className="notebook-entry-page w-full min-w-0 space-y-5 px-4 pb-8 pt-2 md:px-8">
    <Button variant="ghost" className="h-9 px-0 hover:bg-transparent" onClick={() => navigate(back)}><ArrowLeft aria-hidden="true"/>Back to Class Notebook</Button>
    {entry && !entry.importedNotebook && <div className="flex justify-end"><Button variant="outline" onClick={() => navigate(`${back}/resources/flashcards?journal=${encodeURIComponent(entry.id)}`)}><Brain aria-hidden="true" />Create flashcards</Button></div>}
    {!entry && builtIn && <Button variant="outline" onClick={() => setBuiltIn(false)}>Use my preferred AI</Button>}
    {!entry && !builtIn ? <ExternalNotebookWorkflow key={`${course.id}:${target?.lesson ?? target?.readingKey ?? ''}`} courseId={course.id} target={target} initialGoal={target ? 'review' : undefined} initialScope={target?.label} workflowId={target ? `target-${target.lesson ?? target.readingKey}` : undefined} onImported={(id, destinationCourseId) => { linkTarget(id); navigate(`/academics/classes/${encodeURIComponent(destinationCourseId ?? course.id)}/journal/${encodeURIComponent(id)}`, { replace: true }) }} /> : <LectureCapturePanel key={entryId} courseId={course.id} course={course} data={data} initialLectureId={entry?.id} initialDestination="transcript" onNavigateLecture={(id, destinationCourseId) => navigate(`/academics/classes/${encodeURIComponent(destinationCourseId ?? course.id)}/journal/${encodeURIComponent(id)}`, { replace: true })} onOpenNotes={() => navigate(`${back}?classTab=guide`)}/>}
    {!entry && !builtIn && <details className="pt-8 text-sm text-muted-foreground"><summary>Other notebook tools</summary><Button variant="outline" className="mt-3" onClick={() => setBuiltIn(true)}>Use built-in generation</Button></details>}
  </section>
}

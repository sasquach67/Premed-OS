import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { FlashcardPromptPanel } from '@/components/academics/FlashcardPromptPanel'
import { RevisedNotesPanel } from '@/components/academics/RevisedNotesPanel'
import '@/components/academics/externalNotebook.css'

export function ResourceCreationPage() {
  const { courseId, resource } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const course = useStore(state => state.courses.find(item => item.id === courseId))
  const data = useStore(state => state.academics.classCenter)
  if (!course) return <section className="p-6"><h1>Class not found</h1><Button onClick={() => navigate('/academics')}>Back to Academics</Button></section>
  const classPath = `/academics/classes/${encodeURIComponent(course.id)}`
  if (resource !== 'flashcards' && resource !== 'revised-notes') return <section className="p-6"><h1>Resource not found</h1><Button onClick={() => navigate(classPath)}>Back to class</Button></section>
  const journalId = resource === 'flashcards' ? params.get('journal') ?? undefined : undefined
  const journalExists = journalId && data.lectures.some(item => item.id === journalId && item.courseId === course.id)
  const back = journalExists ? `${classPath}/journal/${encodeURIComponent(journalId)}` : classPath
  const title = resource === 'flashcards' ? 'Create flashcards' : 'Revise your notes'
  return <section className="notebook-entry-page w-full min-w-0 space-y-5 px-4 pb-8 pt-2 md:px-8">
    <Button variant="ghost" className="h-9 px-0 hover:bg-transparent" onClick={() => navigate(back)}><ArrowLeft aria-hidden="true" />{journalExists ? 'Back to Journal' : 'Back to class'}</Button>
    <section className="external-notebook en-flow space-y-6" aria-label={`${title} workflow`}>
      <header className="en-header en-flow-header"><div>
        <p className="en-eyebrow">{course.code} / {resource === 'flashcards' ? 'Flashcards' : 'Revised notes'}</p>
        <h1>{title}</h1>
        <p className="en-flow-lead">{resource === 'flashcards' ? 'Choose a completed Journal, copy your prompt, and create your Anki deck with your AI.' : 'Choose your notes and the course materials that will support the revision.'}</p>
      </div></header>
      <div className="en-stage-content">
        {resource === 'flashcards'
          ? <FlashcardPromptPanel key={`${course.id}-${journalId ?? 'choose'}`} courseId={course.id} courseLabel={course.code} lectureId={journalId} onClose={() => navigate(back)} showHeader={false} />
          : <RevisedNotesPanel key={course.id} courseId={course.id} files={data.files.filter(file => file.courseId === course.id)} data={data} />}
      </div>
    </section>
  </section>
}

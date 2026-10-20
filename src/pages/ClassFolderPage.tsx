import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { ClassFolderGuide } from '@/components/academics/ClassFolderGuide'
import { defaultFolderName } from '@/lib/academics/classFolder'
import type { ClassFolderSetup } from '@/lib/types'

/** Class folder setup for one class, opened from its Lessons tab. */
export function ClassFolderPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const update = useStore(state => state.update)
  const course = useStore(state => state.courses.find(item => item.id === courseId))
  const workspace = useStore(state => state.academics.classCenter.workspaces.find(item => item.courseId === courseId))
  if (!course || !workspace) return <section className="p-6"><h1>Class not found</h1><Button onClick={() => navigate('/academics')}>Back to Academics</Button></section>
  const lessons = `/academics/classes/${encodeURIComponent(course.id)}?classTab=lessons`
  const save = (setup: Omit<ClassFolderSetup, 'updatedAt'>) => {
    update(draft => {
      const item = draft.academics.classCenter.workspaces.find(row => row.courseId === course.id)
      if (item) item.classFolder = { ...setup, updatedAt: Date.now() }
    })
    navigate(lessons)
  }
  return <section className="w-full min-w-0 px-4 pb-8 pt-4 md:px-8">
    <ClassFolderGuide
      courseCode={course.code}
      initial={workspace.classFolder?.state === 'ready' ? workspace.classFolder : undefined}
      onBack={() => navigate(lessons)}
      onFinish={setup => save({ ...setup, state: 'ready' })}
      onSkip={() => save({ site: 'canvas', place: 'documents', mover: 'me', name: workspace.classFolder?.name ?? defaultFolderName(course.code), state: 'skipped' })}
    />
  </section>
}

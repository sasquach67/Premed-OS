import { useLayoutEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/store'
import { LectureCapturePanel } from '@/components/academics/LectureCapturePanel'
import './LecturePage.css'

/** A lecture owns a route, not a modal. Reading and navigation have separate scroll owners. */
export function LecturePage() {
  const { courseId, lectureId } = useParams()
  const navigate = useNavigate()
  const course = useStore((s) => s.courses.find((item) => item.id === courseId))
  const data = useStore((s) => s.academics.classCenter)
  const page = useRef<HTMLElement>(null)
  const back = `/academics/classes/${encodeURIComponent(courseId ?? '')}?classTab=overview`
  const lecture = data.lectures.find((item) => item.id === lectureId && item.courseId === courseId)

  useLayoutEffect(() => {
    const element = page.current
    const scroller = element?.closest<HTMLElement>('[data-app-scroll-container]')
    if (!element || !scroller) return
    scroller.scrollTop = 0
    const size = () => {
      // Use the actual shell height, including browser zoom and compact/mobile navigation.
      const available = scroller.clientHeight - (element.offsetTop - scroller.offsetTop) - 16
      element.style.height = `${Math.max(240, available)}px`
    }
    size()
    const observer = new ResizeObserver(size)
    observer.observe(scroller)
    window.addEventListener('resize', size)
    return () => { observer.disconnect(); window.removeEventListener('resize', size) }
  }, [courseId, lectureId])

  if (!course || (!lecture && lectureId !== 'new')) return <section className="space-y-4"><h1 className="font-display text-2xl font-bold">Lecture not found</h1><p>This lecture may have been deleted or isn’t available in this workspace.</p><Link to={back}>Back to class</Link></section>

  return <section ref={page} className="lecture-page" aria-label="Lecture page">
    <div className="lecture-page-back"><Link to={back}><ArrowLeft className="size-4" aria-hidden="true" />{course.code} · Class journal</Link></div>
    <div className="lecture-page-body">
      <LectureCapturePanel key={lectureId} courseId={course.id} course={course} data={data}
        initialLectureId={lecture?.id} displayMode="page"
        onNavigateLecture={(id) => navigate(`/academics/classes/${encodeURIComponent(course.id)}/lectures/${encodeURIComponent(id)}`)}
        onDeletedLecture={() => navigate(back, { replace: true })}
        onOpenNotes={() => navigate(`/academics/classes/${encodeURIComponent(course.id)}?classTab=guide`)} />
    </div>
  </section>
}

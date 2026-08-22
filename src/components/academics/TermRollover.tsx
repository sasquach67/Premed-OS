/**
 * End-of-term rollover (§4.1) — the December handoff.
 *
 * Drawing:   mockup-lab/01-academics/academics-term-rollover.html
 * Decisions: academics-term-rollover.md — "a transition map, not a
 *            three-column dashboard": origin → consequence → topics → quiet
 *            bulk action. The three fate paths are narrow and unequal on
 *            purpose; they must not become three loud equal cards.
 * Model:     lib/academics/termRollover.ts, which owns every rule.
 *
 * ⚠️ Nothing here deletes anything, and carrying a topic never rebuilds its
 * study state. The ledger archive happens regardless of any choice made below.
 */
import { useState } from 'react'
import { ArrowRight, ArrowUpRight, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { cn } from '@/lib/utils'
import {
  FATE_DETAIL, FATE_LABEL, applyFates, defaultFates, dismissUntilNextTerm,
  pauseEverything, pendingRollovers, type FateProposal,
} from '@/lib/academics/termRollover'
import { createTermReport } from '@/lib/academics/termReport'
import type { Course, Topic, TopicTermFate } from '@/lib/types'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'
const FATE_ICON = { retired: X, mcat: ArrowUpRight, prerequisite: ArrowRight } as const
const FATES: TopicTermFate[] = ['retired', 'mcat', 'prerequisite']

export function TermRollover() {
  const courses = useStore((s) => s.courses)
  const topics = useStore((s) => s.academics.classCenter.topics)
  const currentTerm = useStore((s) => s.profile.startTerm)
  const pending = pendingRollovers(courses, currentTerm)
  const course = pending[0]

  if (!course) return null
  return <Ritual key={course.id} course={course} courses={courses} topics={topics} currentTerm={currentTerm} />
}

function Ritual({ course, courses, topics, currentTerm }: {
  course: Course
  courses: Course[]
  topics: Topic[]
  currentTerm?: string
}) {
  const courseTopics = topics.filter((topic) => topic.courseId === course.id)
  const planned = courses.filter((item) => item.status === 'planned')
  const [fates, setFates] = useState<FateProposal[]>(() => defaultFates(courseTopics, planned))
  const [done, setDone] = useState<'none' | 'applied' | 'paused'>('none')
  const [reportId, setReportId] = useState<string | null>(null)

  function write(next: (state: { courses: Course[]; topics: Topic[] }) => { courses: Course[]; topics: Topic[] }) {
    useStore.getState().update((draft) => {
      const result = next({ courses: draft.courses, topics: draft.academics.classCenter.topics })
      draft.courses = result.courses
      draft.academics.classCenter.topics = result.topics
    })
  }

  /** A report happens only after the final pending course in this term is
   * handed off. That avoids making one duplicate report per course. */
  function finish(kind: 'apply' | 'pause') {
    let createdId: string | null = null
    useStore.getState().update((draft) => {
      const result = kind === 'apply'
        ? applyFates({ courses: draft.courses, topics: draft.academics.classCenter.topics }, { courseId: course.id, fates })
        : pauseEverything({ courses: draft.courses, topics: draft.academics.classCenter.topics }, course.id)
      draft.courses = result.courses
      draft.academics.classCenter.topics = result.topics

      const stillPending = pendingRollovers(result.courses, currentTerm).some((item) => item.term === course.term)
      if (stillPending) return
      const report = createTermReport({
        id: uid(),
        input: { courses: result.courses, center: draft.academics.classCenter, term: course.term },
        order: draft.academics.classCenter.termReports.length,
      })
      draft.academics.classCenter.termReports.push(report)
      createdId = report.id
    })
    setReportId(createdId)
    setDone(kind === 'apply' ? 'applied' : 'paused')
  }

  if (done === 'paused') {
    return (
      <section className={cn(CARD, 'p-6 text-center')}>
        <p className={EYEBROW}>Transition paused</p>
        <h3 className="mt-1 font-display text-lg font-extrabold">Everything is paused.</h3>
        <p className="mx-auto mt-1 max-w-md text-xs font-bold text-muted-foreground">
          All {course.code} topics retire for now. Nothing was deleted, and a topic can be carried
          later if a future course or MCAT plan makes it useful.
        </p>
        {reportId && <Button size="sm" variant="outline" className="mt-4" onClick={() => document.getElementById(`term-report-${reportId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View your Term Report</Button>}
      </section>
    )
  }

  if (done === 'applied') {
    return (
      <section className={cn(CARD, 'p-6 text-center')}>
        <p className={EYEBROW}>Transition complete</p>
        <h3 className="mt-1 font-display text-lg font-extrabold">{course.code} is handed off.</h3>
        <p className="mx-auto mt-1 max-w-md text-xs font-bold text-muted-foreground">
          Its record is in your ledger, and every choice above can be changed later.
        </p>
        {reportId && <Button size="sm" variant="outline" className="mt-4" onClick={() => document.getElementById(`term-report-${reportId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View your Term Report</Button>}
      </section>
    )
  }

  const setFate = (topicId: string, fate: TopicTermFate) =>
    setFates((current) => current.map((item) => item.topicId === topicId ? { ...item, fate } : item))

  return (
    <section className={cn(CARD, 'p-4')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={EYEBROW}>One bounded decision</p>
          <h3 className="mt-0.5 font-display text-lg font-extrabold">Keep what still matters.</h3>
          <p className="mt-0.5 max-w-xl text-xs font-bold text-muted-foreground">
            Defaults are already sorted. Change only the topic fates you disagree with; the
            permanent course record is safe either way.
          </p>
        </div>
        <span className="rounded-lg border border-border bg-muted px-2 py-1 font-display text-[10.5px] font-extrabold text-muted-foreground">
          About 30 seconds
        </span>
      </div>

      {/* Origin → connector → three narrow fates. The origin is deliberately
          wider than any single fate: it is the thing being transitioned. */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <article className="rounded-xl border border-border bg-muted p-3.5">
          <p className={EYEBROW}>Completed course</p>
          <h4 className="mt-0.5 font-display text-base font-extrabold">{course.code}</h4>
          <p className="text-xs font-bold text-muted-foreground">{course.title}<br />{course.term}</p>
          <div className="mt-3 rounded-lg border border-border bg-card p-2.5">
            <b className="font-display text-[11px] font-extrabold">Ledger archive</b>
            <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
              Grade, credits, and transcript facts carry over automatically.
            </p>
          </div>
        </article>

        <div className="grid gap-3 sm:grid-cols-3">
          {FATES.map((fate) => {
            const Icon = FATE_ICON[fate]
            const rows = fates.filter((item) => item.fate === fate)
            return (
              <article key={fate} className="rounded-xl border border-border bg-muted p-3">
                <Icon className={cn('size-4', fate === 'retired' ? 'text-muted-foreground' : 'text-[var(--cat-gpa)]')} />
                <h4 className="mt-1.5 font-display text-sm font-extrabold">{FATE_LABEL[fate]}</h4>
                <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">{FATE_DETAIL[fate]}</p>
                <div className="mt-2 space-y-1.5">
                  {rows.map((row) => {
                    const topic = courseTopics.find((item) => item.id === row.topicId)
                    if (!topic) return null
                    return (
                      <div key={row.topicId} className="rounded-lg border border-border bg-card px-2 py-1.5">
                        <p className="truncate font-display text-[11.5px] font-extrabold">{topic.title}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{row.reason}</p>
                        <div className="mt-1 flex gap-1">
                          {FATES.filter((other) => other !== fate).map((other) => (
                            <button
                              key={other} type="button" onClick={() => setFate(row.topicId, other)}
                              className="rounded border border-border px-1 py-0.5 text-[9.5px] font-bold text-muted-foreground hover:text-foreground"
                            >
                              → {FATE_LABEL[other]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {!rows.length && <p className="text-[10.5px] font-bold text-muted-foreground/70">None</p>}
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <p className="mt-3 border-t border-border pt-2.5 text-[11px] font-bold text-muted-foreground">
        Nothing is deleted by any choice here. Retiring stops scheduling and keeps the topic searchable.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => finish('apply')}>
          Confirm these fates
        </Button>
        {/* Spacious and non-celebratory, per the decisions file. */}
        <Button size="sm" variant="outline" onClick={() => finish('pause')}>
          Pause everything
        </Button>
        {currentTerm && (
          <Button size="sm" variant="ghost" onClick={() => write((state) => dismissUntilNextTerm(state, course.id, currentTerm))}>
            Not now
          </Button>
        )}
      </div>
    </section>
  )
}

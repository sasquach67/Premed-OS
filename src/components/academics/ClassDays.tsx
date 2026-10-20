import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildClassDays, dateOf, isoDay, mondayOf, stageStates, stagesFor,
  type ClassDay, type ClassDayExam, type StageState,
} from '@/lib/academics/classDays'
import type { SyllabusScheduleEntry } from '@/lib/types'
import './classDays.css'

/** Links a checklist row can offer, so a missing file is one click away. */
export interface ClassDayLinks {
  /** Open the day's notebook, when one exists. */
  openNotebook?: () => void
  /** Start a new notebook for the day. */
  newNotebook: () => void
}

/**
 * Class days on the class Overview (Andy, Oct 19 2026): only the days the
 * class meets, one week at a time, as calendar pages with a Prime / Learn /
 * Retain checklist. A term strip above the week shows every week at once.
 */
export function ClassDays({ schedule, meetingDays, exams, checks, trackedFrom, today = isoDay(new Date()), titleFor, linksFor, onToggle }: {
  schedule?: SyllabusScheduleEntry[]
  meetingDays?: string
  exams: ClassDayExam[]
  checks: Record<string, string[]>
  /** ISO date the class was added; earlier days are never marked missed. */
  trackedFrom?: string
  today?: string
  /** The notebook title for a class day, when one exists. */
  titleFor: (day: ClassDay) => string | undefined
  linksFor: (day: ClassDay) => ClassDayLinks
  onToggle: (date: string, itemId: string) => void
}) {
  const days = useMemo(() => buildClassDays({ schedule, meetingDays, exams }), [schedule, meetingDays, exams])
  const weeks = days.length ? days[days.length - 1].week : 0
  const nowWeek = useMemo(() => {
    if (!days.length) return 1
    const t = Math.round((mondayOf(today).getTime() - mondayOf(days[0].date).getTime()) / (7 * 86_400_000)) + 1
    return Math.min(Math.max(t, 1), weeks)
  }, [days, today, weeks])
  const [picked, setPicked] = useState<number>()
  const week = picked ?? nowWeek
  const strip = useRef<HTMLDivElement>(null)
  // On a phone the strip scrolls; keep the selected week in view.
  useEffect(() => {
    const el = strip.current
    if (!el) return
    const center = () => {
      const cell = el.querySelector<HTMLElement>('.is-selected')
      if (!cell || el.scrollWidth <= el.clientWidth) return
      const box = el.getBoundingClientRect(), at = cell.getBoundingClientRect()
      el.scrollLeft += at.left - box.left - (box.width - at.width) / 2
    }
    center()
    // The first layout can settle after mount; centre again when the strip resizes.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(center)
    observer.observe(el)
    return () => observer.disconnect()
  }, [week])

  if (!days.length) {
    return <section className="class-days" aria-labelledby="class-days-title">
      <h2 id="class-days-title" className="class-days-title">Class days</h2>
      <p className="class-days-empty">Your syllabus has no class dates yet. Once it does, each class day shows up here with what to do before and after it.</p>
    </section>
  }

  const shown = days.filter((d) => d.week === week)
  const monday = new Date(mondayOf(days[0].date).getTime() + (week - 1) * 7 * 86_400_000)
  const friday = new Date(monday.getTime() + 4 * 86_400_000)
  const range = `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${friday.toLocaleDateString(undefined, { month: monday.getMonth() === friday.getMonth() ? undefined : 'short', day: 'numeric' })}`
  const nextClass = days.find((d) => d.kind === 'class' && d.date >= today)
  const dot = (d: ClassDay) => {
    if (d.kind === 'exam') return 'exam'
    if (d.date >= today) return ''
    const states = stageStates(d, checks[d.date] ?? [], today, trackedFrom)
    return states.every((s) => s === 'done') ? 'done' : states.some((s) => s === 'late') ? 'late' : 'taught'
  }

  return <section className="class-days" aria-labelledby="class-days-title">
    <div className="class-days-head">
      <h2 id="class-days-title" className="class-days-title">Week {week}<small>{range}</small></h2>
      <div className="class-days-nav">
        {week !== nowWeek && <button type="button" className="class-days-today" onClick={() => setPicked(undefined)}>Today</button>}
        <button type="button" className="class-days-iconbtn" aria-label="Previous week" disabled={week <= 1} onClick={() => setPicked(Math.max(1, week - 1))}><ArrowLeft aria-hidden="true" /></button>
        <button type="button" className="class-days-iconbtn" aria-label="Next week" disabled={week >= weeks} onClick={() => setPicked(Math.min(weeks, week + 1))}><ArrowRight aria-hidden="true" /></button>
      </div>
    </div>
    <div ref={strip} className="class-days-term" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }} aria-label="Weeks of the term">
      {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => <button type="button" key={w} className={cn(w === week && 'is-selected', w === nowWeek && 'is-now')} aria-label={`Week ${w}`} aria-current={w === week ? 'true' : undefined} onClick={() => setPicked(w)}>
        <b>{w}</b><span className="class-days-dots">{days.filter((d) => d.week === w).map((d) => <i key={d.date} className={dot(d)} />)}</span>
      </button>)}
    </div>
    <div className="class-days-week" style={{ gridTemplateColumns: `repeat(${Math.max(2, shown.length)}, minmax(0, 1fr))` }}>
      {shown.length
        ? shown.map((d) => <DayCard key={d.date} day={d} today={today} isNext={d.date === nextClass?.date} checked={checks[d.date] ?? []} trackedFrom={trackedFrom} title={titleFor(d)} links={linksFor(d)} onToggle={(id) => onToggle(d.date, id)} />)
        : <p className="class-days-empty">No class this week.</p>}
    </div>
  </section>
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 14, c = 2 * Math.PI * r
  return <svg className="class-days-ring" width="38" height="38" viewBox="0 0 38 38" role="img" aria-label={`${done} of ${total} done`}>
    <circle className="bg" cx="19" cy="19" r={r} />
    <circle className="fg" cx="19" cy="19" r={r} strokeDasharray={c.toFixed(1)} strokeDashoffset={(c * (1 - (total ? done / total : 0))).toFixed(1)} transform="rotate(-90 19 19)" />
    <text x="19" y="22.5" textAnchor="middle">{done}/{total}</text>
  </svg>
}

const STATE_WORD: Record<StageState, string> = { done: 'done', part: 'started', late: 'missed', open: 'to do', locked: 'after class' }

function DayCard({ day, today, isNext, checked, trackedFrom, title, links, onToggle }: {
  day: ClassDay; today: string; isNext: boolean; checked: string[]; trackedFrom?: string; title?: string; links: ClassDayLinks; onToggle: (id: string) => void
}) {
  const date = dateOf(day.date)
  const past = day.date < today
  const stages = stagesFor(day)
  const states = stageStates(day, checked, today, trackedFrom)
  const items = stages.flatMap((s) => s.items)
  const done = items.filter((i) => checked.includes(i.id)).length
  const heading = day.kind === 'exam' ? day.examTitle ?? 'Exam' : `Lecture ${day.lecture}${title || day.topic ? ` — ${title || day.topic}` : ''}`
  const link = (id: string): [string, () => void] | undefined => {
    if (day.kind !== 'class') return undefined
    if (id === 'notebook') return links.openNotebook ? ['Open', links.openNotebook] : ['Import', links.newNotebook]
    if ((id === 'cards' || id === 'practice') && links.openNotebook) return ['Open notebook', links.openNotebook]
    return undefined
  }
  return <article className={cn('class-day', past ? 'is-past' : isNext ? 'is-next' : 'is-future', day.kind === 'exam' && 'is-exam')} aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}: ${heading}`}>
    <header className="class-day-page">
      <span className="num">{date.getDate()}</span>
      <span className="dm"><b>{date.toLocaleDateString(undefined, { weekday: 'short' })}</b>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
      {day.kind === 'exam' && <span className="tag">Exam</span>}
      <Ring done={done} total={items.length} />
    </header>
    <div className="class-day-body">
      <div><h3>{heading}</h3>{day.continued && <p className="sub">Continued</p>}</div>
      <ol className="class-day-stages">
        {stages.map((stage, i) => {
          const state = states[i]
          const locked = state === 'locked'
          return <li key={stage.name} className={cn('class-day-stage', `is-${state}`, !past && i === 0 && state !== 'done' && 'is-now')}>
            <span className="n" aria-hidden="true">{state === 'done' ? <Check /> : i + 1}</span>
            <p className="h">{stage.name}<small>{state === 'late' ? STATE_WORD.late : stage.when}</small></p>
            {stage.items.map((item) => {
              const on = checked.includes(item.id)
              const extra = !on && !locked ? link(item.id) : undefined
              return <div key={item.id} className={cn('class-day-check', on && 'is-on', state === 'late' && 'is-late')}>
                <button type="button" role="checkbox" aria-checked={on} disabled={locked} onClick={() => onToggle(item.id)}>
                  <span className="box" aria-hidden="true">{on && <Check />}</span><span className="lbl">{item.label}</span>
                </button>
                {extra && <button type="button" className="go" onClick={extra[1]}>{extra[0]}</button>}
              </div>
            })}
          </li>
        })}
      </ol>
    </div>
  </article>
}

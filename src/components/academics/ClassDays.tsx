import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarX2, Check, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildClassDays, dateOf, isoDay, lessonNumbers, mondayOf, stageStates, stagesFor,
  type ClassDay, type ClassDayExam, type ClassDayOverride, type StageState,
} from '@/lib/academics/classDays'
import type { SyllabusScheduleEntry } from '@/lib/types'
import './classDays.css'

/** A lesson's notebook, when one exists: one notebook per lesson (Andy, Oct 20). */
export interface LessonNotebookLinks {
  open: () => void
  /** Add another class's material to the same notebook. */
  update: () => void
}

/**
 * Class days on the class Overview (Andy, Oct 19 2026): only the days the
 * class meets, one week at a time, as calendar pages with a Prime / Learn /
 * Retain checklist. A term strip above the week shows every week at once.
 */
export function ClassDays({ schedule, meetingDays, exams, checks, overrides = {}, trackedFrom, today = isoDay(new Date()), titleFor, notebookFor, onNewNotebook, onToggle, onOverride }: {
  schedule?: SyllabusScheduleEntry[]
  meetingDays?: string
  exams: ClassDayExam[]
  checks: Record<string, string[]>
  /** ISO date the class was added; earlier days are never marked missed. */
  trackedFrom?: string
  today?: string
  /** Classes the student changed with the pencil. */
  overrides?: Record<string, ClassDayOverride>
  /** A lesson's notebook title, when one exists. */
  titleFor: (lesson: number, days: ClassDay[]) => string | undefined
  /** A lesson's notebook, found by its lesson first and its class dates second. */
  notebookFor: (lesson: number, days: ClassDay[]) => LessonNotebookLinks | undefined
  onNewNotebook: (lesson?: number) => void
  onToggle: (date: string, itemId: string) => void
  /** Change one class, or `undefined` to put it back to the syllabus. */
  onOverride: (date: string, change: ClassDayOverride | undefined) => void
}) {
  const days = useMemo(() => buildClassDays({ schedule, meetingDays, exams, overrides }), [schedule, meetingDays, exams, overrides])
  const lessonChoices = useMemo(() => lessonNumbers(days), [days])
  const [editing, setEditing] = useState<string>()
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
  const changedCount = Object.values(overrides).filter((o) => o.cancelled || o.lessons?.length).length
  const dot = (d: ClassDay) => {
    if (d.kind === 'exam') return 'exam'
    if (d.cancelled) return 'off'
    if (d.syllabusLesson !== undefined) return 'changed'
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
    {changedCount > 0 && <p className="class-days-changed"><Pencil aria-hidden="true" />{changedCount} class{changedCount > 1 ? 'es' : ''} changed from the syllabus<button type="button" onClick={() => Object.keys(overrides).forEach((date) => onOverride(date, undefined))}>Back to the syllabus</button></p>}
    <div className="class-days-week" style={{ gridTemplateColumns: `repeat(${Math.max(2, shown.length)}, minmax(0, 1fr))` }}>
      {shown.length
        ? shown.map((d) => editing === d.date
          ? <CoverEditor key={d.date} day={d} choices={lessonChoices} override={overrides[d.date]} onChange={(change) => onOverride(d.date, change)} onDone={() => setEditing(undefined)} />
          : <DayCard key={d.date} day={d} days={days} today={today} isNext={d.date === nextClass?.date} checked={checks[d.date] ?? []} trackedFrom={trackedFrom}
            titleFor={(l) => titleFor(l, days)} notebookFor={(l) => notebookFor(l, days)} onNewNotebook={onNewNotebook} onToggle={(id) => onToggle(d.date, id)}
            onEdit={lessonChoices.length ? () => setEditing(d.date) : undefined} onRestore={() => onOverride(d.date, undefined)} />)
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

function DayCard({ day, days, today, isNext, checked, trackedFrom, titleFor, notebookFor, onNewNotebook, onToggle, onEdit, onRestore }: {
  day: ClassDay; days: ClassDay[]; today: string; isNext: boolean; checked: string[]; trackedFrom?: string
  titleFor: (lesson: number) => string | undefined
  notebookFor: (lesson: number) => LessonNotebookLinks | undefined
  onNewNotebook: (lesson?: number) => void
  onToggle: (id: string) => void
  onEdit?: () => void
  onRestore: () => void
}) {
  const date = dateOf(day.date)
  const past = day.date < today
  const page = <header className="class-day-page">
    <span className="num">{date.getDate()}</span>
    <span className="dm"><b>{date.toLocaleDateString(undefined, { weekday: 'short' })}</b>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
    {day.kind === 'exam' && <span className="tag">Exam</span>}
    {day.kind === 'class' && !day.cancelled && <Ring done={stagesFor(day).flatMap((s) => s.items).filter((i) => checked.includes(i.id)).length} total={stagesFor(day).flatMap((s) => s.items).length} />}
    {onEdit && day.kind === 'class' && <button type="button" className="class-day-edit" aria-label={`Change what the ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} class covered`} onClick={onEdit}><Pencil aria-hidden="true" /></button>}
  </header>
  if (day.cancelled) {
    return <article className="class-day is-cancelled" aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}: class cancelled`}>
      {page}
      <div className="class-day-body">
        <div><h3>Class cancelled</h3>{day.syllabusLesson !== undefined && <p className="sub">The syllabus had Lesson {day.syllabusLesson}</p>}</div>
        <button type="button" className="class-day-restore" onClick={onRestore}>Class happened after all</button>
      </div>
    </article>
  }
  const stages = stagesFor(day)
  const states = stageStates(day, checked, today, trackedFrom)
  const lessons = day.lessons ?? []
  // Named by lesson, like the Lessons tab and the notebooks (Andy, Oct 20: the
  // running lecture count adds nothing). A week schedule has no lesson numbers,
  // so its day is named by the syllabus topic ("Week 3: Healing systems").
  const topic = day.lesson !== undefined ? titleFor(day.lesson) || day.topic : day.topic
  const heading = day.kind === 'exam' ? day.examTitle ?? 'Exam'
    : lessons.length > 1 ? `Lessons ${lessons.join(' & ')}`
      : day.lesson !== undefined ? `Lesson ${day.lesson}${topic ? ` — ${topic}` : ''}` : topic ?? 'Class'
  const subtitle = lessons.length > 1 ? lessons.map((l) => titleFor(l)).filter(Boolean).join(' · ') : undefined
  // One notebook per lesson: a lesson's later classes update the same notebook.
  const taughtBefore = (lesson: number) => days.some((d) => d.kind === 'class' && !d.cancelled && d.date < day.date && d.lessons?.includes(lesson))
  const notebookRow = (id: string): { label: string; link?: [string, () => void] } | undefined => {
    const lesson = id === 'notebook' ? day.lesson : id.startsWith('notebook-') ? Number(id.slice(9)) : undefined
    if (day.kind !== 'class' || lesson === undefined) return undefined
    const named = lessons.length > 1 ? `Lesson ${lesson} notebook` : 'notebook'
    const nb = notebookFor(lesson)
    if (taughtBefore(lesson)) return nb
      ? { label: `Add today’s class to the ${named}`, link: ['Update', nb.update] }
      : { label: `Make the ${named} (covers every class so far)`, link: ['Import', () => onNewNotebook(lesson)] }
    return { label: `Work through the ${named}`, link: nb ? ['Open', nb.open] : ['Import', () => onNewNotebook(lesson)] }
  }
  const retainLink = (id: string): [string, () => void] | undefined => {
    if ((id !== 'cards' && id !== 'practice') || day.lesson === undefined) return undefined
    const nb = notebookFor(day.lesson)
    return nb ? ['Open notebook', nb.open] : undefined
  }
  const items = stages.flatMap((s) => s.items)
  const done = items.filter((i) => checked.includes(i.id)).length
  return <article className={cn('class-day', past ? 'is-past' : isNext ? 'is-next' : 'is-future', day.kind === 'exam' && 'is-exam')} aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}: ${heading}`}>
    {page}
    <div className="class-day-body">
      <div>
        <h3>{heading}</h3>
        {subtitle && <p className="sub">{subtitle}</p>}
        {day.continued && <p className="sub">Continued</p>}
        {day.syllabusLesson !== undefined && <p className="class-day-syllabus">Syllabus: Lesson {day.syllabusLesson}</p>}
      </div>
      <ol className="class-day-stages" aria-label={`${done} of ${items.length} done`}>
        {stages.map((stage, i) => {
          const state = states[i]
          const locked = state === 'locked'
          return <li key={stage.name} className={cn('class-day-stage', `is-${state}`, !past && i === 0 && state !== 'done' && 'is-now')}>
            <span className="n" aria-hidden="true">{state === 'done' ? <Check /> : i + 1}</span>
            <p className="h">{stage.name}<small>{state === 'late' ? STATE_WORD.late : stage.when}</small></p>
            {stage.items.map((item) => {
              const on = checked.includes(item.id)
              const row = notebookRow(item.id)
              const extra = !on && !locked ? row?.link ?? retainLink(item.id) : undefined
              return <div key={item.id} className={cn('class-day-check', on && 'is-on', state === 'late' && 'is-late')}>
                <button type="button" role="checkbox" aria-checked={on} disabled={locked} onClick={() => onToggle(item.id)}>
                  <span className="box" aria-hidden="true">{on && <Check />}</span><span className="lbl">{row?.label ?? item.label}</span>
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

/** The pencil: which lessons this one class covered, or that it was cancelled. Only this class changes. */
function CoverEditor({ day, choices, override, onChange, onDone }: {
  day: ClassDay; choices: number[]; override?: ClassDayOverride
  onChange: (change: ClassDayOverride | undefined) => void
  onDone: () => void
}) {
  const date = dateOf(day.date)
  const base = day.syllabusLesson ?? day.lesson
  const current = day.cancelled ? [] : day.lessons ?? []
  const near = base === undefined ? choices.slice(0, 4) : choices.filter((l) => l >= base - 1 && l <= base + 2)
  const toggle = (lesson: number) => {
    const next = current.includes(lesson) ? current.filter((l) => l !== lesson) : [...current, lesson]
    if (!next.length) return
    onChange(next.length === 1 && next[0] === base ? undefined : { lessons: next })
  }
  return <article className="class-day is-next is-editing" aria-label={`Change the ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} class`}>
    <header className="class-day-page">
      <span className="num">{date.getDate()}</span>
      <span className="dm"><b>{date.toLocaleDateString(undefined, { weekday: 'short' })}</b>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
    </header>
    <div className="class-day-body class-day-cover">
      <div><h3>This class covers</h3><p className="sub">Pick one or more. Only this class changes.</p></div>
      <div className="class-day-chips" role="group" aria-label="Lessons this class covered">
        {near.map((l) => <button key={l} type="button" aria-pressed={current.includes(l)} className={cn(current.includes(l) && 'is-on')} onClick={() => toggle(l)}>
          {current.includes(l) && <Check aria-hidden="true" />}Lesson {l}
        </button>)}
      </div>
      <button type="button" aria-pressed={Boolean(day.cancelled)} className={cn('class-day-chip-cancel', day.cancelled && 'is-on')} onClick={() => onChange(day.cancelled ? undefined : { cancelled: true })}>
        <CalendarX2 aria-hidden="true" />No class — cancelled
      </button>
      <div className="class-day-cover-actions">
        <button type="button" className="quiet" disabled={!override} onClick={() => onChange(undefined)}>Back to the syllabus</button>
        <button type="button" className="done" onClick={onDone}>Done</button>
      </div>
    </div>
  </article>
}

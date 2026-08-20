import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Wifi } from 'lucide-react'
import { useStore } from '@/store/store'
import { useCalendarSync } from '@/hooks/useCalendarSync'
import type { NormalizedScheduleEvent } from '@/lib/types'
import {
  classScheduleEvents, eventState, formatClock, formatEventTimeRange, isSameLocalDay,
  minuteOfDay, normalizeTimedEvents, resolveTimelineRange, timelinePercent,
  type TimedScheduleEvent, type TimelineEventState,
} from '@/lib/schedule'
import { cn } from '@/lib/utils'

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function hasFreshCalendarCache(lastSyncedAt: number | undefined, date: Date) {
  return Boolean(lastSyncedAt && isSameLocalDay(new Date(lastSyncedAt), date))
}

/** Data source for the hero: Google Calendar (when connected) merged with the
 *  recurring class schedule, falling back to the schedule-only mock otherwise. */
export function useHeroScheduleSource() {
  const sync = useCalendarSync()
  const refreshAttempted = useRef('')
  const date = new Date()
  const key = todayKey(date)
  const freshCalendarCache = sync.calendar.enabled && hasFreshCalendarCache(sync.calendar.lastSyncedAt, date)

  useEffect(() => {
    if (!sync.calendar.enabled || !sync.configured || freshCalendarCache || refreshAttempted.current === key) return
    refreshAttempted.current = key
    void sync.connectSilent(date)
  }, [date, freshCalendarCache, key, sync])

  // Precedence, most trustworthy first: a live calendar, then the student's own
  // class records, then nothing. There is deliberately no fourth option — the
  // hero previously invented a day when it had neither.
  const workspaces = useStore((state) => state.academics.classCenter.workspaces)
  const courses = useStore((state) => state.courses)
  const derived = useMemo(
    () => classScheduleEvents(workspaces, courses, date),
    [workspaces, courses, key],
  )
  const events = freshCalendarCache ? sync.calendar.cachedEvents : derived

  return {
    ...sync,
    events,
    source: freshCalendarCache ? 'google' : derived.length ? 'class-records' : 'empty',
    // Never "your calendar" for a derived day — the label says which it is.
    sourceLabel: freshCalendarCache ? 'Google Calendar' : derived.length ? 'From your class records' : 'Calendar',
    stale: sync.calendar.enabled && !freshCalendarCache && sync.calendar.cachedEvents.length > 0,
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** H:MM:SS, or MM:SS in compact mode. Always tabular so it doesn't jitter. */
function smallCountdown(ms: number, compact: boolean) {
  const t = Math.max(0, Math.floor(ms / 1000))
  if (compact) return `${Math.floor(t / 60)}:${pad(t % 60)}`
  const h = Math.floor(t / 3600)
  return `${h}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`
}

function formatMinuteLabel(minute: number, format: '12h' | '24h') {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, Math.round(minute)))
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return formatClock(date, format)
}

function localMinute(hour: number, minute = 0) {
  return hour * 60 + minute
}

function seasonalDayMarkers(date: Date) {
  const month = date.getMonth()
  const markers = [
    [7, 20, 17, 25],
    [6, 55, 18, 0],
    [6, 25, 18, 30],
    [6, 35, 19, 55],
    [6, 5, 20, 20],
    [5, 58, 20, 37],
    [6, 12, 20, 30],
    [6, 40, 19, 58],
    [7, 5, 19, 15],
    [7, 25, 18, 32],
    [6, 55, 17, 12],
    [7, 15, 17, 5],
  ][month] ?? [6, 0, 20, 30]

  return {
    sunrise: localMinute(markers[0], markers[1]),
    sunset: localMinute(markers[2], markers[3]),
  }
}

function timeGreeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

function rotatingGreeting(now: Date, name: string) {
  const firstName = name.trim().split(/\s+/)[0] || 'there'
  const greetings = [
    `${timeGreeting(now)}, ${firstName}`,
    `Good to see you again, ${firstName}!`,
    `Hello, ${firstName}`,
    `Ready for the next move, ${firstName}?`,
    `Keep the momentum, ${firstName}`,
  ]
  return greetings[Math.floor(now.getTime() / 9000) % greetings.length]
}

/** Left block — personalized roadmap greeting with a discreet next-event timer. */
export function HeroCountdown({ events, name }: { events: NormalizedScheduleEvent[]; name: string }) {
  const now = useNow(1000)
  const analysis = useMemo(() => normalizeTimedEvents(events, now), [events, now])
  const [compact, setCompact] = useState(false)

  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const target = analysis.current ?? analysis.next
  const targetMs = target ? target.startDate.getTime() <= now.getTime()
    ? target.endDate.getTime() - now.getTime()
    : target.startDate.getTime() - now.getTime() : null
  const countdownCaption = analysis.current
    ? `${analysis.current.title} ends soon`
    : analysis.next
      ? `until ${analysis.next.title}`
      : ''
  return (
    <div className="relative max-w-2xl space-y-4 text-foreground">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground/70">
        <span>{dateLabel}</span>
        <span className="size-1 rounded-full bg-foreground/35" aria-hidden="true" />
        <span className="tabular-nums">{formatClock(now, '12h')}</span>
      </div>
      <div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground transition-opacity md:text-5xl">
          {rotatingGreeting(now, name)}
        </h1>
        <p className="mt-1 max-w-2xl text-base font-semibold text-muted-foreground md:whitespace-nowrap md:text-lg">
          One focused move at a time. Keep the day clear, kind, and quietly relentless.
        </p>
      </div>
      {targetMs != null && (
        <div className="relative w-fit max-w-full rounded-3xl border border-border/55 bg-card/82 px-4 py-3 pr-16 shadow-lg backdrop-blur-md dark:bg-card/60">
          <button
            onClick={() => setCompact((c) => !c)}
            className="absolute right-3 top-3 rounded-full border border-border/70 bg-card/70 px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
            title="Toggle countdown format"
          >
            {compact ? 'H:MM:SS' : 'MM:SS'}
          </button>
          <p className="font-display text-[clamp(2.9rem,8vw,5.4rem)] font-extrabold leading-[0.9] text-leaf tabular-nums">
            {smallCountdown(targetMs, compact)}
          </p>
          <p className="mt-1 text-sm font-extrabold text-foreground/72 dark:text-muted-foreground">{countdownCaption}</p>
        </div>
      )}
    </div>
  )
}

/** Position nodes by time-of-day, with a minimum gap so labels never collide. */
function placeNodes(events: TimedScheduleEvent[], range: { startMinute: number; endMinute: number }) {
  const out: { event: TimedScheduleEvent; top: number; side: 'left' | 'right' }[] = []
  let last = -Infinity
  for (const [index, event] of events.entries()) {
    const raw = timelinePercent(minuteOfDay(event.startDate), range)
    const top = Math.min(88, Math.max(14, raw, last + 15))
    last = top
    out.push({ event, top, side: index % 2 === 0 ? 'left' : 'right' })
  }
  return out
}

/** Right block — a single thin rail with evenly-spaced nodes + a live position dot. */
export function HeroSchedulePanel({ schedule }: { schedule: ReturnType<typeof useHeroScheduleSource> }) {
  const settings = schedule.calendar
  const now = useNow(30_000)
  const analysis = useMemo(() => normalizeTimedEvents(schedule.events, now), [schedule.events, now])
  const range = useMemo(() => resolveTimelineRange(analysis.timedEvents, settings), [analysis.timedEvents, settings])
  const nodes = useMemo(() => placeNodes(analysis.timedEvents, range), [analysis.timedEvents, range])
  const dayMarkers = useMemo(() => seasonalDayMarkers(now), [now])

  const nowMin = minuteOfDay(now)
  const markerInRange = nowMin >= range.startMinute && nowMin <= range.endMinute
  const sunriseTop = timelinePercent(dayMarkers.sunrise, range)
  const sunsetTop = timelinePercent(dayMarkers.sunset, range)

  return (
    <div className="relative flex h-full min-h-[22rem] flex-col text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,.6)] dark:text-white dark:drop-shadow-[0_2px_4px_rgba(0,0,0,.55)]">
      <div className="flex items-center justify-end gap-1.5 pb-1 text-[11px] font-extrabold text-slate-950 dark:text-white/82">
        <span>{schedule.sourceLabel}{schedule.stale ? ' · cached' : ''}</span>
        {schedule.source === 'google' ? (
          <button onClick={() => { void schedule.refresh(new Date()) }} className="rounded p-1 hover:bg-foreground/10 dark:hover:bg-white/10" aria-label="Refresh Google Calendar">
            <RefreshCw className={cn('size-3.5', schedule.status === 'syncing' && 'animate-spin')} />
          </button>
        ) : (
          <button
            onClick={() => { void schedule.connect(new Date()) }}
            disabled={!schedule.configured || schedule.status === 'connecting'}
            className="inline-flex items-center gap-1 rounded-full border border-slate-700/25 bg-white/25 px-2 py-0.5 text-[10px] font-bold hover:bg-white/45 disabled:opacity-50 dark:border-white/30 dark:bg-transparent dark:hover:bg-white/10"
          >
            <Wifi className="size-3" /> Connect
          </button>
        )}
      </div>

      {/* desktop rail */}
      <div className="relative hidden min-h-[20rem] flex-1 md:block" role="img" aria-label="Today’s schedule timeline">
        <div className="absolute inset-y-1 left-1/2 z-20 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.18),0_8px_20px_rgba(15,23,42,0.14)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.45),0_0_22px_rgba(255,255,255,0.68)]" />
        <DayMarker label="Sunrise" time={formatMinuteLabel(dayMarkers.sunrise, settings.timeFormat)} top={sunriseTop} side="left" />
        <DayMarker label="Sunset" time={formatMinuteLabel(dayMarkers.sunset, settings.timeFormat)} top={sunsetTop} side="right" />

        {analysis.timedEvents.length === 0 ? (
          <div className="grid h-full place-items-center"><p className="text-sm font-bold text-slate-950 dark:text-white/82">No timed events today.</p></div>
        ) : (
          nodes.map(({ event, top, side }) => (
            <RailNode key={event.id} event={event} top={top} side={side} state={eventState(event, now, analysis.next?.id)} timeFormat={settings.timeFormat} />
          ))
        )}

        {markerInRange && analysis.timedEvents.length > 0 && (
          <div
            className="absolute left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-700 motion-reduce:transition-none"
            style={{ top: `${timelinePercent(nowMin, range)}%` }}
            aria-hidden="true"
          >
            <span className="block size-4 rounded-full border-[3px] border-white bg-primary shadow-[0_0_0_3px_rgba(255,255,255,0.24),0_4px_13px_rgba(0,0,0,0.35)]" />
          </div>
        )}
      </div>

      {/* mobile: stacked list under the countdown */}
      <div className="space-y-1.5 md:hidden">
        {analysis.timedEvents.length === 0 ? (
          <p className="rounded-lg bg-white/40 px-3 py-3 text-sm text-slate-800/80 dark:bg-white/10 dark:text-[#f7efe1]/70">No timed events today.</p>
        ) : analysis.timedEvents.slice(0, 5).map((event) => {
          const state = eventState(event, now, analysis.next?.id)
          return (
            <div key={event.id} className={cn('flex items-center justify-between gap-2 rounded-lg bg-white/45 px-3 py-1.5 dark:bg-white/10', state === 'past' && 'opacity-50')}>
              <span className={cn('text-sm font-bold', state === 'next' && 'text-primary')}>{event.title}</span>
              <span className="shrink-0 text-xs font-semibold text-slate-700/80 tabular-nums dark:text-[#f7efe1]/75">{formatEventTimeRange(event, settings.timeFormat)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayMarker({ label, time, top, side }: { label: string; time: string; top: number; side: 'left' | 'right' }) {
  const safeTop = Math.min(96, Math.max(4, top))
  return (
    <div
      className="absolute inset-x-0 z-0 -translate-y-1/2"
      style={{ top: `${safeTop}%` }}
      aria-hidden="true"
    >
      <span
        className={cn(
          'absolute top-1/2 h-1.5 w-6 -translate-y-1/2 rounded-full bg-white/96 shadow-[0_0_0_1px_rgba(15,23,42,0.15),0_1px_8px_rgba(0,0,0,0.18)] dark:bg-white/92 dark:shadow-[0_1px_8px_rgba(0,0,0,0.25)]',
          side === 'left' ? 'left-1/2 -translate-x-full' : 'left-1/2'
        )}
      />
      <div
        className={cn(
          'absolute top-1/2 w-28 -translate-y-1/2 text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:text-white dark:drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)]',
          side === 'left' ? 'right-[calc(50%+2.1rem)] text-right' : 'left-[calc(50%+2.1rem)] text-left'
        )}
      >
        <p className="font-display text-base font-extrabold leading-none">{label}</p>
        <p className="mt-0.5 text-sm font-extrabold leading-none text-slate-950 tabular-nums dark:text-white/88">{time}</p>
      </div>
    </div>
  )
}

function RailNode({
  event, top, side, state, timeFormat,
}: { event: TimedScheduleEvent; top: number; side: 'left' | 'right'; state: TimelineEventState; timeFormat: '12h' | '24h' }) {
  const isNext = state === 'next' || state === 'current'
  return (
    <div
      className={cn(
        'absolute inset-x-0 z-10 -translate-y-1/2',
        state === 'past' && 'opacity-70'
      )}
      style={{ top: `${top}%` }}
    >
      {/* Same-material protrusion tucks under the spine so the rail reads as one continuous shape. */}
      <span
        className={cn(
          'absolute top-1/2 z-10 h-3 w-8 -translate-y-1/2 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.14),0_1px_8px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.2)]',
          side === 'left' ? 'right-1/2 translate-x-[6px] rounded-l-full' : 'left-1/2 -translate-x-[6px] rounded-r-full',
          state === 'past' && 'bg-white/70'
        )}
      />
      <div
        className={cn(
          'absolute top-1/2 w-36 -translate-y-1/2',
          side === 'left' ? 'right-[calc(50%+2.2rem)] text-right' : 'left-[calc(50%+2.2rem)] text-left'
        )}
      >
        <p className={cn('font-display text-[15px] font-extrabold leading-tight text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:text-white dark:drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)]', isNext && 'text-primary')}>{event.title}</p>
        <p className="mt-0.5 text-[13px] font-extrabold leading-tight text-slate-950 tabular-nums drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:text-white/90 dark:drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)]">{formatEventTimeRange(event, timeFormat)}</p>
      </div>
    </div>
  )
}

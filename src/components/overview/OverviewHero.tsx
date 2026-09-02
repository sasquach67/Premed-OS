import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { NumberFlow } from '@/components/motion'
import { useHeroScheduleSource } from '@/components/common/HeroDailySchedule'
import { MascotNote } from '@/components/common/MascotNote'
import { Button } from '@/components/ui/button'
import { formatClock, formatEventTimeRange, isSameLocalDay, normalizeTimedEvents, normalizeUpcomingTimedEvents } from '@/lib/schedule'
import { homeBanner, type VisualTheme } from '@/lib/themeAssets'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'there'
}

function secondsLeft(ms: number) {
  return Math.max(0, Math.floor(ms / 1000))
}

function hms(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function shortDuration(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 60000))
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (!hours) return `${minutes}m`
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

export function OverviewHero() {
  const visualTheme = useStore((state) => state.settings.visualTheme)
  const name = useStore((state) => state.profile.name)
  const schedule = useHeroScheduleSource()
  const now = useNow()
  const dateLine = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <section
      aria-labelledby="overview-heading"
      className="relative min-h-[22rem] overflow-hidden rounded-3xl border border-border bg-card shadow-lg md:min-h-[24rem]"
    >
      <ThemedHomeImage key={visualTheme} visualTheme={visualTheme} />
      <div className="absolute inset-0 bg-stone-50/38 dark:bg-slate-950/52" />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-50/76 via-stone-50/34 to-sky-50/10 dark:from-slate-950/78 dark:via-slate-950/40 dark:to-slate-950/16" />
      <div className="relative flex min-h-[22rem] flex-col p-5 text-foreground md:min-h-[24rem] md:p-7 dark:text-white">
        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(23rem,.9fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-foreground/65 dark:text-white/72">
              {dateLine} · <span className="tabular-nums">{formatClock(now, '12h')}</span>
            </p>
            <h1
              id="overview-heading"
              className="mt-1 text-balance font-display text-[clamp(2rem,3.2vw,2.75rem)] font-extrabold leading-none"
            >
              Good to see you again, {firstName(name)}!
            </h1>
            <HeroLiveStatus schedule={schedule} now={now} />
          </div>
          <TodaySchedulePanel schedule={schedule} now={now} />
        </div>
        <MascotNote
          variant="banner"
          priority={-10}
          source="r/premed"
          className="mt-5 w-full max-w-[42rem]"
        >
          Reflection matters as much as the activity. Log <strong className="font-extrabold">why</strong> it mattered while it’s fresh.
        </MascotNote>
      </div>
    </section>
  )
}

function HeroLiveStatus({ schedule, now }: { schedule: ReturnType<typeof useHeroScheduleSource>; now: Date }) {
  const analysis = useMemo(() => normalizeTimedEvents(schedule.events, now), [schedule.events, now])
  const previous = analysis.timedEvents.filter((event) => event.endDate <= now).at(-1)
  const dayEnd = useMemo(() => {
    const date = new Date(now)
    date.setHours(23, 59, 59, 999)
    return date
  }, [now])

  let eyebrow = 'Free window'
  let title = previous ? 'Open focus time' : 'Open block'
  let detail = 'until midnight'
  let remaining = secondsLeft(dayEnd.getTime() - now.getTime())
  let progress = 0

  if (analysis.current) {
    const left = analysis.current.endDate.getTime() - now.getTime()
    const duration = Math.max(1, analysis.current.endDate.getTime() - analysis.current.startDate.getTime())
    eyebrow = 'Happening now'
    title = analysis.current.title
    remaining = secondsLeft(left)
    progress = Math.min(100, Math.max(0, ((now.getTime() - analysis.current.startDate.getTime()) / duration) * 100))
    detail = `Ends ${formatClock(analysis.current.endDate, schedule.calendar.timeFormat)}`
  } else if (analysis.next) {
    const until = analysis.next.startDate.getTime() - now.getTime()
    eyebrow = previous ? 'Free window' : 'Next up'
    title = analysis.next.title
    remaining = secondsLeft(until)
    progress = previous ? 100 : 0
    detail = previous
      ? `${shortDuration(until)} until start`
      : `Starts ${formatClock(analysis.next.startDate, schedule.calendar.timeFormat)}`
  }

  return (
    <div className="mt-4 w-full max-w-[28rem] rounded-3xl border border-white/65 bg-card/78 px-5 py-4 text-left shadow-lg shadow-stone-900/10 backdrop-blur-md dark:border-white/14 dark:bg-slate-950/48 dark:shadow-black/15">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary/90">{eyebrow}</p>
          <p className="mt-1 truncate text-sm font-extrabold text-foreground dark:text-white">{title}</p>
        </div>
        <Badge className="border-border/70 bg-muted text-muted-foreground dark:border-white/10 dark:bg-white/8 dark:text-white/72">{detail}</Badge>
      </div>
      <NumberFlow
        value={remaining}
        format={hms}
        animationKey={Math.floor(remaining / 3600)}
        className="mt-3 font-display text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-none text-foreground dark:text-white"
      />
      <span className="sr-only">Countdown updates continuously.</span>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted dark:bg-white/16">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(116,192,252,.32)] transition-[width] duration-200"
          style={{ width: `${progress || 14}%` }}
        />
      </div>
    </div>
  )
}

function TodaySchedulePanel({ schedule, now }: { schedule: ReturnType<typeof useHeroScheduleSource>; now: Date }) {
  const analysis = useMemo(() => normalizeTimedEvents(schedule.events, now), [schedule.events, now])
  const upcoming = useMemo(() => normalizeUpcomingTimedEvents(schedule.events, now), [schedule.events, now])
  const visible = upcoming.timedEvents.slice(0, 4)
  const visibleToday = visible.filter((event) => isSameLocalDay(event.startDate, now))
  const hasLaterEvents = visible.some((event) => !isSameLocalDay(event.startDate, now))
  const scheduleLabel = hasLaterEvents ? (visibleToday.length ? 'Today + next' : 'Next up') : 'Today'
  const refreshCalendar = () => {
    // Keep the dashboard action stable after the first connection. If the
    // short-lived browser token has expired, this user click becomes the
    // Google-approved reconnect rather than bringing back a second Connect CTA.
    void (schedule.connected ? schedule.refresh(new Date()) : schedule.connect(new Date()))
  }
  const dayStart = useMemo(() => {
    const date = new Date(now)
    date.setHours(6, 0, 0, 0)
    return date
  }, [now])
  const dayEnd = useMemo(() => {
    const date = new Date(now)
    date.setHours(23, 0, 0, 0)
    return date
  }, [now])
  const span = Math.max(1, dayEnd.getTime() - dayStart.getTime())
  const timelinePercent = (date: Date) => Math.min(98, Math.max(2, ((date.getTime() - dayStart.getTime()) / span) * 100))

  return (
    <div className="relative rounded-3xl border border-white/65 bg-card/78 p-4 shadow-xl shadow-stone-900/10 backdrop-blur-md dark:border-white/14 dark:bg-slate-950/58 dark:shadow-black/15">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground dark:text-white/62">{scheduleLabel}</p>
        {schedule.calendar.enabled ? (
          <button
            type="button"
            onClick={refreshCalendar}
            disabled={!schedule.canConnect || schedule.status === 'syncing' || schedule.status === 'connecting'}
            title={!schedule.canConnect ? schedule.unavailableMessage : undefined}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/88 px-3 py-1 text-[11px] font-extrabold text-primary shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-45 dark:border-white/10 dark:bg-slate-950/62 dark:hover:bg-white/8"
          >
            <RefreshCw className={cn('size-3.5', (schedule.status === 'syncing' || schedule.status === 'connecting') && 'animate-spin')} />
            Refresh
          </button>
        ) : !!visible.length && (
          <button
            type="button"
            onClick={() => { void schedule.connect(new Date()) }}
            disabled={!schedule.canConnect || schedule.status === 'connecting'}
            title={!schedule.canConnect ? schedule.unavailableMessage : undefined}
            className="rounded-full border border-border/70 bg-card/88 px-3 py-1 text-[11px] font-extrabold text-primary shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-45 dark:border-white/10 dark:bg-slate-950/62 dark:hover:bg-white/8"
          >
            Connect calendar
          </button>
        )}
      </div>
      <div className="rounded-2xl border border-border/60 bg-white/58 px-4 py-4 shadow-inner shadow-stone-900/5 dark:border-white/10 dark:bg-white/[0.055] dark:shadow-black/10">
        {!visible.length && (
          <MascotNote
            variant="empty-state"
            priority={10}
            title="No upcoming events"
            actions={schedule.calendar.enabled ? (
              <Button
                type="button"
                size="sm"
                onClick={refreshCalendar}
                disabled={!schedule.canConnect || schedule.status === 'syncing' || schedule.status === 'connecting'}
                title={!schedule.canConnect ? schedule.unavailableMessage : undefined}
              >
                <RefreshCw className={cn('size-4', (schedule.status === 'syncing' || schedule.status === 'connecting') && 'animate-spin')} />
                Refresh calendar
              </Button>
            ) : schedule.canConnect ? (
              <Button
                type="button"
                size="sm"
                onClick={() => { void schedule.connect(new Date()) }}
                disabled={schedule.status === 'connecting'}
              >
                Connect calendar
              </Button>
            ) : <Button asChild size="sm"><Link to="/settings">Set up calendar</Link></Button>}
            className="border-border text-foreground dark:border-white/20 dark:text-white"
          >
            <span className="text-muted-foreground dark:text-white/75">
              {schedule.calendar.enabled ? 'Nothing timed is coming up yet.' : 'Connect your calendar to place your real schedule here.'}
            </span>
          </MascotNote>
        )}
        {!!visible.length && (
          <>
            {visibleToday.length > 0 && (
              <div className="relative h-8" role="img" aria-label="Today’s schedule timeline">
                <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-foreground/22 dark:bg-white/55" />
                <div
                  className="absolute top-1/2 z-20 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary"
                  style={{ left: `${timelinePercent(now)}%` }}
                />
                {visibleToday.map((event) => {
                  const active = analysis.current?.id === event.id
                  const start = timelinePercent(event.startDate)
                  const end = timelinePercent(event.endDate)
                  return (
                    <div key={event.id}>
                      <div
                        className={cn('absolute top-1/2 z-10 h-1.5 -translate-y-1/2 rounded-full', active ? 'bg-primary' : 'bg-leaf/70')}
                        style={{ left: `${start}%`, width: `${Math.max(2.5, end - start)}%` }}
                      />
                      <div
                        className="absolute top-1/2 z-20 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/75 dark:bg-white/90"
                        style={{ left: `${start}%` }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-2 space-y-1.5">
              {visible.slice(0, 3).map((event) => {
                const active = analysis.current?.id === event.id
                const dateLabel = isSameLocalDay(event.startDate, now)
                  ? formatClock(event.startDate, schedule.calendar.timeFormat).replace(/:00/g, '')
                  : event.startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                return (
                  <div key={event.id} className="grid grid-cols-[5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-xs">
                    <span className="truncate tabular-nums font-bold text-muted-foreground dark:text-white/55">{dateLabel}</span>
                    <span className={cn('truncate font-extrabold', active ? 'text-primary' : 'text-foreground/88 dark:text-white/86')}>{event.title}</span>
                    <span className={cn('truncate text-right text-[11px] font-bold tabular-nums', active ? 'text-primary' : 'text-muted-foreground dark:text-white/55')}>
                      {active
                        ? hms(secondsLeft(event.endDate.getTime() - now.getTime())).replace(/^0:/, '')
                        : formatEventTimeRange(event, schedule.calendar.timeFormat).split('-')[1]?.trim()}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ThemedHomeImage({ visualTheme }: { visualTheme: VisualTheme }) {
  const sources = visualTheme === 'doraemon'
    ? [homeBanner('doraemon'), homeBanner('ghibli')]
    : [homeBanner('ghibli')]
  const [index, setIndex] = useState(0)

  return (
    <img
      src={sources[index]}
      alt=""
      draggable={false}
      onError={() => setIndex((current) => Math.min(current + 1, sources.length - 1))}
      className="absolute inset-0 size-full object-cover"
    />
  )
}

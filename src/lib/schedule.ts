import type { CalendarSettings, NormalizedScheduleEvent } from '@/lib/types'

export type TimelineEventState = 'past' | 'current' | 'next' | 'future'

export interface TimedScheduleEvent extends NormalizedScheduleEvent {
  startDate: Date
  endDate: Date
}

export interface ScheduleAnalysis {
  timedEvents: TimedScheduleEvent[]
  allDayEvents: NormalizedScheduleEvent[]
  current: TimedScheduleEvent | null
  next: TimedScheduleEvent | null
  status: 'current' | 'upcoming' | 'free' | 'done' | 'empty'
}

export interface TimelineRange {
  startMinute: number
  endMinute: number
}

const DEFAULT_DURATION_MS = 50 * 60 * 1000

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function localIsoFor(date: Date, hour: number, minute = 0) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute).toISOString()
}

/**
 * Today's classes, derived from the student's own `ClassWorkspace` records.
 *
 * This replaced a set of hard-coded events — `CHEM 101 Lecture`, a
 * `Neuroscience Seminar`, a `Clinical Shift` — that the hero presented as the
 * student's day and labelled "Class schedule". None of them were real, and the
 * plausibility is what made it dangerous: a fabricated day is hardest to catch
 * when it looks like a day you might have had.
 *
 * ⚠️ A workspace whose meeting pattern cannot be parsed contributes **nothing**.
 * It is never rounded to a plausible hour — an invented 9am class is the bug
 * this function exists to remove.
 */
const DAY_TOKENS: Array<{ match: RegExp; day: number }> = [
  { match: /^su/i, day: 0 },
  { match: /^m/i, day: 1 },
  { match: /^tu/i, day: 2 },
  { match: /^w/i, day: 3 },
  { match: /^th/i, day: 4 },
  { match: /^f/i, day: 5 },
  { match: /^sa/i, day: 6 },
]

/** `MWF`, `Tue/Thu`, `Mon, Wed` → weekday numbers. Unrecognised input yields none. */
export function parseMeetingDays(value: string | undefined): number[] {
  if (!value?.trim()) return []
  const days = new Set<number>()
  const separated = /[/,\s]/.test(value)

  if (separated) {
    for (const token of value.split(/[/,\s]+/).filter(Boolean)) {
      const hit = DAY_TOKENS.find((entry) => entry.match.test(token))
      if (hit) days.add(hit.day)
    }
    return [...days].sort((a, b) => a - b)
  }

  // Compact forms like `MWF`, `TTh`, `TR`. A bare `T` is ambiguous on its own,
  // so two-letter tokens are consumed first and `R` is read as Thursday, which
  // is the convention that exists precisely to remove the ambiguity.
  const PAIRS: Array<[string, number]> = [['su', 0], ['tu', 2], ['th', 4], ['sa', 6]]
  const SINGLES: Record<string, number> = { m: 1, t: 2, w: 3, r: 4, f: 5 }

  // Every character must be a day token. `TBD` would otherwise parse as
  // Tuesday and put a class on the student's Tuesday that nobody scheduled —
  // a partial match means the string was not understood at all.
  let index = 0
  while (index < value.length) {
    const pair = value.slice(index, index + 2).toLowerCase()
    const matched = PAIRS.find(([token]) => token === pair)
    if (matched) { days.add(matched[1]); index += 2; continue }
    const single = SINGLES[value[index].toLowerCase()]
    if (single == null) return []
    days.add(single)
    index += 1
  }
  return [...days].sort((a, b) => a - b)
}

/** `10:10–11:00 AM` · `11:00 AM–12:15 PM` → 24h start/end minutes. */
export function parseMeetingTime(value: string | undefined): { start: number; end: number } | undefined {
  if (!value?.trim()) return undefined
  const parts = value.split(/[–—-]/).map((part) => part.trim()).filter(Boolean)
  if (parts.length !== 2) return undefined

  const meridiemOf = (text: string) => /pm/i.test(text) ? 'pm' : /am/i.test(text) ? 'am' : undefined
  const endMeridiem = meridiemOf(parts[1])

  const toMinutes = (text: string, fallback?: 'am' | 'pm') => {
    const match = /(\d{1,2}):(\d{2})/.exec(text)
    if (!match) return undefined
    let hour = Number(match[1])
    const minute = Number(match[2])
    const meridiem = meridiemOf(text) ?? fallback
    if (meridiem === 'pm' && hour < 12) hour += 12
    if (meridiem === 'am' && hour === 12) hour = 0
    return hour * 60 + minute
  }

  const start = toMinutes(parts[0], endMeridiem)
  const end = toMinutes(parts[1])
  if (start == null || end == null || end <= start) return undefined
  return { start, end }
}

export function classScheduleEvents(
  workspaces: Array<{ courseId: string; meetingDays?: string; meetingTime?: string; location?: string; status?: string }>,
  courses: Array<{ id: string; code: string; title: string }>,
  date = new Date(),
): NormalizedScheduleEvent[] {
  const weekday = date.getDay()
  const events: NormalizedScheduleEvent[] = []

  for (const workspace of workspaces) {
    if (workspace.status && workspace.status !== 'active') continue
    const days = parseMeetingDays(workspace.meetingDays)
    if (!days.includes(weekday)) continue
    const time = parseMeetingTime(workspace.meetingTime)
    // No usable time means no event. Placing it at a guessed hour would put a
    // class on the student's day that they never told us about.
    if (!time) continue
    const course = courses.find((item) => item.id === workspace.courseId)
    if (!course) continue

    events.push({
      id: `class-${workspace.courseId}`,
      title: `${course.code} ${course.title}`.trim(),
      start: localIsoFor(date, Math.floor(time.start / 60), time.start % 60),
      end: localIsoFor(date, Math.floor(time.end / 60), time.end % 60),
      location: workspace.location,
      calendarId: 'class-records',
      color: 'var(--cat-gpa)',
      status: 'confirmed',
    })
  }
  return events.sort((a, b) => a.start.localeCompare(b.start))
}

export function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

export function endOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function minuteOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}

export function parseClock(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const [h, m = '0'] = value.split(':')
  const hour = Number(h)
  const minute = Number(m)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback
  return Math.max(0, Math.min(24 * 60, hour * 60 + minute))
}

function normalizeTimedEvent(event: NormalizedScheduleEvent): TimedScheduleEvent | null {
  if (!event || event.status === 'cancelled' || event.allDay) return null

  const startDate = new Date(event.start)
  if (Number.isNaN(startDate.valueOf())) return null
  let endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + DEFAULT_DURATION_MS)
  if (Number.isNaN(endDate.valueOf())) endDate = new Date(startDate.getTime() + DEFAULT_DURATION_MS)
  if (endDate <= startDate) endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000)

  return { ...event, startDate, endDate }
}

function analyzeTimedEvents(timedEvents: TimedScheduleEvent[], allDayEvents: NormalizedScheduleEvent[], now: Date): ScheduleAnalysis {
  timedEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  const current = timedEvents.find((event) => event.startDate <= now && now < event.endDate) ?? null
  const next = timedEvents.find((event) => event.startDate > now) ?? null
  const status = current ? 'current' : next ? (next.startDate.getTime() - now.getTime() > 5 * 60 * 1000 ? 'free' : 'upcoming') : timedEvents.length ? 'done' : 'empty'

  return { timedEvents, allDayEvents, current, next, status }
}

export function normalizeTimedEvents(events: NormalizedScheduleEvent[], now = new Date()): ScheduleAnalysis {
  const timedEvents: TimedScheduleEvent[] = []
  const allDayEvents: NormalizedScheduleEvent[] = []

  for (const event of events) {
    if (!event || event.status === 'cancelled') continue
    if (event.allDay) {
      const start = new Date(event.start)
      if (!Number.isNaN(start.valueOf()) && isSameLocalDay(start, now)) allDayEvents.push(event)
      continue
    }

    const timed = normalizeTimedEvent(event)
    if (!timed) continue

    const touchesToday = isSameLocalDay(timed.startDate, now) || isSameLocalDay(timed.endDate, now) || (timed.startDate < startOfLocalDay(now) && timed.endDate > endOfLocalDay(now))
    if (touchesToday) timedEvents.push(timed)
  }

  return analyzeTimedEvents(timedEvents, allDayEvents, now)
}

/**
 * Timed commitments still ahead of the student, regardless of which local day
 * they fall on. The overview uses this alongside the day-scoped timeline so a
 * calendar that is quiet today can still surface the next few real events.
 */
export function normalizeUpcomingTimedEvents(events: NormalizedScheduleEvent[], now = new Date()): ScheduleAnalysis {
  const timedEvents = events
    .map(normalizeTimedEvent)
    .filter((event): event is TimedScheduleEvent => Boolean(event && event.endDate > now))

  return analyzeTimedEvents(timedEvents, [], now)
}

/** Events the overview should still ask the student to act on today.
 * Finished entries remain in Google Calendar's history rather than taking
 * over the compact, forward-looking dashboard card. */
export function upcomingTimedEvents(events: TimedScheduleEvent[], now = new Date()) {
  return events.filter((event) => event.endDate > now)
}

export function resolveTimelineRange(events: TimedScheduleEvent[], settings: Pick<CalendarSettings, 'timelineStart' | 'timelineEnd'>): TimelineRange {
  let startMinute = parseClock(settings.timelineStart, 6 * 60)
  let endMinute = parseClock(settings.timelineEnd, 23 * 60)
  if (endMinute <= startMinute) endMinute = startMinute + 17 * 60

  for (const event of events) {
    const eventStart = minuteOfDay(event.startDate)
    const eventEnd = event.endDate.getDate() !== event.startDate.getDate()
      ? 24 * 60
      : minuteOfDay(event.endDate)
    startMinute = Math.min(startMinute, Math.floor(eventStart / 30) * 30)
    endMinute = Math.max(endMinute, Math.ceil(eventEnd / 30) * 30)
  }

  return {
    startMinute: Math.max(0, startMinute),
    endMinute: Math.min(24 * 60, Math.max(startMinute + 60, endMinute)),
  }
}

export function timelinePercent(minute: number, range: TimelineRange) {
  return Math.max(0, Math.min(100, ((minute - range.startMinute) / (range.endMinute - range.startMinute)) * 100))
}

export function eventState(event: TimedScheduleEvent, now: Date, nextId?: string): TimelineEventState {
  if (event.startDate <= now && now < event.endDate) return 'current'
  if (event.id === nextId) return 'next'
  if (event.endDate <= now) return 'past'
  return 'future'
}

export function eventProgress(event: TimedScheduleEvent, now: Date) {
  const total = event.endDate.getTime() - event.startDate.getTime()
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, ((now.getTime() - event.startDate.getTime()) / total) * 100))
}

export function formatEventTimeRange(event: TimedScheduleEvent | NormalizedScheduleEvent, format: CalendarSettings['timeFormat'] = '12h') {
  if (event.allDay) return 'All day'
  const opts: Intl.DateTimeFormatOptions = format === '24h'
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { hour: 'numeric', minute: '2-digit' }
  const start = new Date(event.start)
  const end = event.end ? new Date(event.end) : null
  if (Number.isNaN(start.valueOf())) return ''
  if (!end || Number.isNaN(end.valueOf())) return start.toLocaleTimeString(undefined, opts)
  return `${start.toLocaleTimeString(undefined, opts)}-${end.toLocaleTimeString(undefined, opts)}`
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours} hr ${minutes} min`
  if (minutes > 0) return `${minutes} min ${pad(seconds)} sec`
  return `${seconds} sec`
}

export function formatClock(date: Date, format: CalendarSettings['timeFormat'] = '12h') {
  return date.toLocaleTimeString(undefined, format === '24h'
    ? { hour: '2-digit', minute: '2-digit', hour12: false }
    : { hour: 'numeric', minute: '2-digit' })
}

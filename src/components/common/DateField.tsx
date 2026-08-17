/* ============================================================
   DateField — themed date picker matching the app's UI (rounded,
   warm-paper / warm-dark, Baloo numerals). Replaces the native
   <input type="date"> whose OS popup clashes with the design.
   Built on the existing Radix Popover + date-fns; no new deps.
   Value is an ISO 'yyyy-MM-dd' string ('' = unset).
   ============================================================ */
import { useMemo, useState } from 'react'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay,
  isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { fmtDeadline, fmtEventDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toDate(iso: string): Date | null {
  if (!iso) return null
  const d = parseISO(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function DateField({
  value, onChange, placeholder = 'Pick a date', ariaLabel, className, align = 'start', display = 'date',
}: {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  align?: 'start' | 'center' | 'end'
  /** Show a contextual countdown in compact row controls; editors retain the exact date by default. */
  display?: 'date' | 'deadline' | 'event'
}) {
  const selected = toDate(value)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => selected ?? new Date())

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(view), { weekStartsOn: 0 })
    const gridEnd = endOfWeek(endOfMonth(view), { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [view])

  const today = new Date()
  const label = selected
    ? display === 'deadline' ? fmtDeadline(value)
      : display === 'event' ? fmtEventDate(value)
        : format(selected, 'MMM d, yyyy')
    : placeholder

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setView(selected ?? new Date()) }}>
      <PopoverTrigger
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'inline-flex h-auto min-h-8 w-full items-center gap-1.5 rounded-full border border-border/70 bg-transparent px-2.5 py-1 text-left text-sm font-normal shadow-none transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
          !selected && 'text-muted-foreground',
          className,
        )}
      >
        <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate tabular-nums" title={selected ? format(selected, 'MMM d, yyyy') : undefined}>{label}</span>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-[17rem] rounded-2xl border-border bg-card/95 p-3 font-display shadow-xl backdrop-blur-md"
      >
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Previous month" onClick={() => setView((v) => subMonths(v, 1))} className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-extrabold tabular-nums">{format(view, 'MMMM yyyy')}</span>
          <button type="button" aria-label="Next month" onClick={() => setView((v) => addMonths(v, 1))} className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="mb-1 grid grid-cols-7 text-center text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS.map((d, i) => <span key={i} className="py-1">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const isSel = selected != null && isSameDay(day, selected)
            const isToday = isSameDay(day, today)
            const inMonth = isSameMonth(day, view)
            return (
              <button
                key={day.toISOString()}
                type="button"
                aria-label={format(day, 'PPPP')}
                aria-pressed={isSel}
                onClick={() => { onChange(format(day, 'yyyy-MM-dd')); setOpen(false) }}
                className={cn(
                  'grid size-9 place-items-center rounded-lg text-sm font-bold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  !inMonth && 'text-muted-foreground/40',
                  inMonth && !isSel && 'hover:bg-muted',
                  isSel && 'bg-primary text-primary-foreground shadow-sm',
                  !isSel && isToday && 'ring-1 ring-primary/50',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
          <button type="button" onClick={() => { onChange(format(new Date(), 'yyyy-MM-dd')); setOpen(false) }} className="rounded-md px-2 py-1 text-xs font-bold text-primary transition hover:bg-primary/10">
            Today
          </button>
          {selected && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="rounded-md px-2 py-1 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground">
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function MonthField({
  value,
  onChange,
  placeholder = 'Pick a month',
  ariaLabel,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
}) {
  const parsedYear = Number(value.slice(0, 4)) || new Date().getFullYear()
  const [year, setYear] = useState(parsedYear)
  const [open, setOpen] = useState(false)
  const months = Array.from({ length: 12 }, (_, index) => format(new Date(year, index, 1), 'MMM'))

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setYear(parsedYear) }}>
      <PopoverTrigger
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'inline-flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-card px-3 py-1 text-left text-sm shadow-sm',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
        <span>{value ? format(new Date(`${value}-01T12:00:00`), 'MMMM yyyy') : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl p-3">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" className="grid size-8 place-items-center rounded-lg hover:bg-muted" onClick={() => setYear((current) => current - 1)} aria-label="Previous year"><ChevronLeft className="size-4" /></button>
          <strong className="text-sm">{year}</strong>
          <button type="button" className="grid size-8 place-items-center rounded-lg hover:bg-muted" onClick={() => setYear((current) => current + 1)} aria-label="Next year"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => {
            const next = `${year}-${String(index + 1).padStart(2, '0')}`
            return (
              <button
                key={month}
                type="button"
                onClick={() => { onChange(next); setOpen(false) }}
                className={cn('min-h-10 rounded-lg text-sm font-bold hover:bg-muted', value === next && 'bg-primary text-primary-foreground')}
              >
                {month}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TimeField({
  value,
  onChange,
  placeholder = 'Pick a time',
  ariaLabel,
  className,
  stepMinutes = 30,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  stepMinutes?: number
}) {
  const [open, setOpen] = useState(false)
  const times = Array.from({ length: Math.ceil((24 * 60) / stepMinutes) }, (_, index) => {
    const minutes = index * stepMinutes
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'inline-flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-card px-3 py-1 text-left text-sm shadow-sm',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <Clock3 className="size-4 shrink-0" aria-hidden="true" />
        <span>{value ? format(new Date(`2000-01-01T${value}`), 'h:mm a') : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="max-h-72 w-52 overflow-y-auto rounded-2xl p-1.5">
        {times.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => { onChange(time); setOpen(false) }}
            className={cn('block min-h-10 w-full rounded-lg px-3 text-left text-sm font-bold hover:bg-muted', value === time && 'bg-primary/10 text-primary')}
          >
            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ArrowRight } from 'lucide-react'
import { useStore } from '@/store/store'
import { daysUntil, fmtDate, fmtDeadline } from '@/lib/date'
import { Card, CardContent } from '@/components/ui/card'

/** A live ticking clock. */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/** Live "what's next" widget (D4): a ticking clock + a countdown to your next
 *  dated item. Reads from your tasks/milestones today; a Google Calendar
 *  connector can feed real events later (degrades gracefully until then). */
export function NextEventWidget() {
  const tasks = useStore((s) => s.tasks)
  const now = useNow()

  const next = tasks
    .filter((t) => t.deadline && !t.archived && t.progress !== 'Finished' && (daysUntil(t.deadline) ?? -1) >= 0)
    .sort((a, b) => (daysUntil(a.deadline) ?? 0) - (daysUntil(b.deadline) ?? 0))[0]

  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const seconds = now.toLocaleTimeString(undefined, { second: '2-digit' }).padStart(2, '0')
  const today = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <Card className="overflow-hidden border-primary/25">
      <CardContent className="relative bg-gradient-to-br from-secondary/60 to-card py-5">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold tabular-nums tracking-tight">{time}</span>
          <span className="text-lg font-bold tabular-nums text-muted-foreground">:{seconds}</span>
        </div>
        <p className="text-xs font-semibold text-muted-foreground">{today}</p>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><CalendarClock className="size-4" /></span>
          {next ? (
            <Link to="/overview/tasks" className="group min-w-0 flex-1">
              <p className="truncate text-sm font-bold group-hover:text-primary">{next.title || 'Untitled'}</p>
              <p className="text-xs text-muted-foreground">{fmtDeadline(next.deadline)} · {fmtDate(next.deadline)}</p>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">No dated tasks are coming up. Add one from <Link to="/overview/tasks" className="font-semibold text-primary hover:underline">Tasks</Link>.</p>
          )}
          {next && <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  )
}

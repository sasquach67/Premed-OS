import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { buildAttention, type AttentionItem } from './attention'

/** A slim, dismissible band reserved for overdue and due-today deadlines. */
export function AlertsStrip() {
  const data = useStore()
  const dismissedAlertKey = useStore((s) => s.settings.dismissedAlertKey)
  const update = useStore((s) => s.update)
  const alerts = buildAttention(data).filter((item) => (item.daysLeft ?? 1) <= 0).slice(0, 4)
  const alertKey = alerts.map((a) => `${a.id}:${a.date}`).join('|')
  if (!alerts.length || dismissedAlertKey === alertKey) return null

  return (
    <div className="border-b border-border bg-[color-mix(in_srgb,var(--warning)_8%,var(--card))]">
      <div className="mx-auto flex w-full max-w-[84rem] flex-wrap items-center gap-2 px-4 py-2 md:px-8">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--warning)_55%,var(--foreground))]">
          <AlertTriangle className="size-3.5" /> Needs attention
        </span>
        {alerts.map((a) => (
          <AlertChip key={a.id} a={a} />
        ))}
        <Link to="/overview/tasks" className="ml-auto text-xs font-semibold text-primary hover:underline">
          View all →
        </Link>
        <button
          onClick={() => update((d) => { d.settings.dismissedAlertKey = alertKey })}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Dismiss urgent alerts"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function AlertChip({ a }: { a: AttentionItem }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/35 bg-card px-2.5 py-1 text-xs font-medium text-destructive">
      <CalendarClock className="size-3.5 shrink-0" />
      <Link to={a.route} className="max-w-[12rem] truncate hover:underline">{a.title}</Link>
      <span className="font-bold">{a.why}</span>
    </span>
  )
}

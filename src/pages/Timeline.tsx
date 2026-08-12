import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import { daysUntil, fmtDate, fmtRelative } from '@/lib/date'
import { PageHeader } from '@/components/common/PageHeader'
import { cn } from '@/lib/utils'

export function Timeline() {
  const route = ROUTE_MAP.timeline
  return (
    <div>
      <PageHeader title={route.label} />
      <div className="mt-4"><RoadmapGraphic /></div>
    </div>
  )
}

/** The application cycle as a visual vertical timeline (not a flat list). */
function RoadmapGraphic() {
  const tasks = useStore((s) => s.tasks)
  const milestones = tasks.filter((t) => t.milestone && t.deadline).sort((a, b) => (daysUntil(a.deadline) ?? 0) - (daysUntil(b.deadline) ?? 0))

  if (!milestones.length) {
    return <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No roadmap milestones yet.</p>
  }

  return (
    <div className="relative ml-2 space-y-5 border-l-2 border-border pl-7 pt-2">
      {milestones.map((m, i) => {
        const d = daysUntil(m.deadline)
        const past = d != null && d < 0
        const soon = d != null && d >= 0 && d <= 60
        return (
          <div key={m.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <span className={cn('absolute -left-[2.35rem] top-1 grid size-6 place-items-center rounded-full text-[10px] font-bold ring-4 ring-background', past ? 'bg-muted text-muted-foreground' : soon ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
              {i + 1}
            </span>
            <div className={cn('rounded-xl border border-border bg-card p-4 card-soft', soon && 'border-primary/40')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{m.title}</h3>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', past ? 'bg-muted text-muted-foreground' : soon ? 'bg-primary/15 text-primary' : 'bg-secondary text-secondary-foreground')}>
                  {fmtDate(m.deadline)} · {fmtRelative(m.deadline)}
                </span>
              </div>
              {m.notes && <p className="mt-1 text-sm text-muted-foreground">{m.notes}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

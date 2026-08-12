import { GitBranch, ClipboardCheck, Pin } from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import { daysUntil, fmtDate, fmtRelative } from '@/lib/date'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export function Timeline() {
  const route = ROUTE_MAP.timeline
  return (
    <div>
      <PageHeader title={route.label} />

      <Tabs defaultValue="roadmap">
        <TabsList>
          <TabsTrigger value="roadmap"><GitBranch className="size-4" /> Roadmap</TabsTrigger>
          <TabsTrigger value="verify"><ClipboardCheck className="size-4" /> Verify</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap"><RoadmapGraphic /></TabsContent>
        <TabsContent value="verify"><VerifyChecklist /></TabsContent>
      </Tabs>
    </div>
  )
}

/** The application cycle as a visual vertical timeline (not a flat list). */
function RoadmapGraphic() {
  const tasks = useStore((s) => s.tasks)
  const milestones = tasks.filter((t) => t.milestone && t.deadline).sort((a, b) => (daysUntil(a.deadline) ?? 0) - (daysUntil(b.deadline) ?? 0))

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

function VerifyChecklist() {
  const advisingQs = useStore((s) => s.advisingQs)
  const patchItem = useStore((s) => s.patchItem)
  const tips = useStore((s) => s.tips).filter((t) => t.tag === 'andy')

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Verify with advisor / HPA</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {advisingQs.map((q) => (
            <label key={q.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1.5 hover:bg-muted/40">
              <Checkbox checked={q.answered} onCheckedChange={(v) => patchItem('advisingQs', q.id, { answered: Boolean(v) })} className="mt-0.5" />
              <span className={cn('text-sm', q.answered && 'text-muted-foreground line-through')}>{q.question}</span>
            </label>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Pin className="size-4 text-destructive" /> Don’t-do reminders</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {tips.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs">{t.text}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

import { Archive as ArchiveIcon, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/store/store'
import { ROUTE_MAP } from '@/app/routes'
import { fmtDate } from '@/lib/date'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/** Reminders-style archive: finished tasks + completed focus targets,
 *  restorable (un-check to bring back) (D3). */
export function Archive() {
  const route = ROUTE_MAP.archive
  const tasks = useStore((s) => s.tasks)
  const focusTargets = useStore((s) => s.focusTargets)
  const patchItem = useStore((s) => s.patchItem)
  const removeItem = useStore((s) => s.removeItem)

  // Milestones live in `tasks` with `milestone: true`; a completed roadmap
  // node is not a finished task and must not be restorable from here (S7).
  const doneTasks = tasks.filter((t) => !t.milestone && (t.archived || t.progress === 'Finished'))
  const doneFocus = focusTargets.filter((f) => f.done)

  return (
    <div>
      <PageHeader title={route.label} />

      {doneTasks.length === 0 && doneFocus.length === 0 ? (
        <EmptyState icon={ArchiveIcon} title="Nothing archived yet" hint="Finished tasks and completed focus targets land here. You can restore any of them." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Finished tasks <span className="text-xs font-normal text-muted-foreground">({doneTasks.length})</span></CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {doneTasks.length === 0 && <p className="py-2 text-sm text-muted-foreground">No finished tasks.</p>}
              {doneTasks.map((t) => (
                <div key={t.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/50">
                  <span className="flex-1 truncate text-sm text-muted-foreground line-through">{t.title || 'Untitled'}</span>
                  {t.deadline && <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(t.deadline)}</span>}
                  <Button size="sm" variant="ghost" className="h-7 opacity-0 group-hover:opacity-100" onClick={() => patchItem('tasks', t.id, { archived: false, progress: 'Working on', kanban: 'doing' })}>
                    <RotateCcw className="size-3.5" /> Restore
                  </Button>
                  <button onClick={() => removeItem('tasks', t.id)} className="rounded-md p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Completed focus <span className="text-xs font-normal text-muted-foreground">({doneFocus.length})</span></CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {doneFocus.length === 0 && <p className="py-2 text-sm text-muted-foreground">No completed focus targets.</p>}
              {doneFocus.map((f) => (
                <div key={f.id} className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/50">
                  <span className="flex-1 truncate text-sm text-muted-foreground line-through">{f.text}</span>
                  <Button size="sm" variant="ghost" className="h-7 opacity-0 group-hover:opacity-100" onClick={() => patchItem('focusTargets', f.id, { done: false })}>
                    <RotateCcw className="size-3.5" /> Restore
                  </Button>
                  <button onClick={() => removeItem('focusTargets', f.id)} className="rounded-md p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

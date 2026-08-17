import { Check, Link2, Plus, Target } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MascotNote } from '@/components/common/MascotNote'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { MOTION_TRANSITION, MOTION_VIEWPORT } from '@/lib/motion'
import { roadmapMilestones } from '@/lib/overview'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'

function formatTarget(value?: string) {
  if (!value) return 'Target not set'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return `Target · ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function OverviewRoadmap() {
  const milestonesData = useStore((state) => state.timelineMilestones)
  const tasks = useStore((state) => state.tasks)
  const trash = useStore((state) => state.trash)
  const profile = useStore((state) => state.profile)
  const patchItem = useStore((state) => state.patchItem)
  const createRoadmapImplementationTask = useStore((state) => state.createRoadmapImplementationTask)
  const reduceMotion = useReducedMotion()
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const milestones = roadmapMilestones(milestonesData)
  const current = milestones.find((milestone) => milestone.state === 'current')

  function startTask(milestoneId: string, title: string) {
    setCreatingFor(milestoneId)
    setTaskTitle(title)
  }

  function cancelTask() {
    setCreatingFor(null)
    setTaskTitle('')
  }

  function createTask() {
    if (!creatingFor) return
    const taskId = createRoadmapImplementationTask(creatingFor, taskTitle)
    if (taskId) cancelTask()
  }

  return (
    <Card role="region" aria-labelledby="roadmap-heading">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle id="roadmap-heading" className="flex items-center gap-2 text-lg"><Target className="size-5 text-primary" />Premed roadmap</CardTitle>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{profile.track} · {profile.applicationCycle} · {profile.matriculationTarget}</p>
        </div>
        <Button asChild size="sm" variant="outline"><Link to="/timeline">Open timeline</Link></Button>
      </CardHeader>
      <CardContent>
        {!milestones.length ? (
          <MascotNote
            variant="empty-state"
            priority={0}
            title="Your Plan"
            actions={<Button asChild size="sm"><Link to="/timeline">Set up milestones</Link></Button>}
            className="min-h-40 items-center"
          >
            Add your first milestone on Timeline and this roadmap will build around your real application cycle.
          </MascotNote>
        ) : (
          <>
            <MascotNote
              variant="tip"
              priority={0}
              title="Your Plan"
              className="mb-5"
            >
              This roadmap comes from your milestone records on Timeline, not a generic hardcoded schedule.
            </MascotNote>
            <div className="overflow-x-auto pb-2">
              <div className="relative min-w-[58rem] px-3 pt-5">
                <div className="absolute left-8 right-8 top-8 h-1 rounded-full bg-muted" aria-hidden="true" />
                <ol className="relative grid auto-cols-[minmax(9rem,1fr)] grid-flow-col gap-3">
                  {milestones.map((milestone) => {
                    const linkedTask = milestone.implementationTaskId ? tasks.find((task) => task.id === milestone.implementationTaskId) : undefined
                    const linkedTaskRoute = linkedTask && !linkedTask.archived
                      ? `/overview/tasks?task=${linkedTask.id}`
                      : linkedTask?.archived || (milestone.implementationTaskId && trash.some((item) => item.collection === 'tasks' && item.record.id === milestone.implementationTaskId))
                        ? '/settings?tab=archive'
                        : undefined

                    return (
                    <m.li
                      key={milestone.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={MOTION_VIEWPORT}
                      transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
                      className={cn(milestone.state === 'done' && 'opacity-65')}
                    >
                      <div className="relative z-10 mb-2 flex h-7 items-center">
                        <span className={cn(
                          'grid size-7 place-items-center rounded-full border-4 border-card bg-muted text-[10px] shadow-sm',
                          milestone.state === 'done' && 'bg-success text-success-foreground',
                          milestone.state === 'current' && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                        )}>
                          {milestone.state === 'done' && <Check className="size-3.5" />}
                        </span>
                      </div>
                      <div className={cn(
                        'min-h-32 rounded-2xl border border-border bg-card p-3 shadow-sm',
                        milestone.state === 'current' && 'border-primary shadow-lg shadow-primary/10',
                      )}>
                        {milestone.state === 'current' && <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">You are here</p>}
                        <Link to={milestone.route} className="mt-1 block font-display text-sm font-bold leading-tight hover:text-primary">{milestone.label}</Link>
                        <p className="mt-2 text-[11px] font-extrabold text-primary">{formatTarget(milestone.target)}</p>
                        {milestone.detail && <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-muted-foreground">{milestone.detail}</p>}
                        {milestone.implementationTaskId && milestone.state !== 'current' && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                            <Link2 className="size-3 text-primary" aria-hidden="true" />
                            {linkedTaskRoute
                              ? <Link to={linkedTaskRoute} className="truncate text-primary hover:underline">{linkedTask?.title || 'Open linked task'}</Link>
                              : <span className="truncate">{linkedTask ? 'Linked task' : 'Linked task unavailable'}</span>}
                          </div>
                        )}
                        {milestone.state === 'current' && !milestone.implementationTaskId && (
                          <Button type="button" size="sm" className="mt-3" onClick={() => startTask(milestone.id, milestone.label)}>
                            <Plus className="size-3.5" /> Add task
                          </Button>
                        )}
                        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] font-bold text-muted-foreground">
                          <Checkbox
                            checked={milestone.state === 'done'}
                            onCheckedChange={(checked) => patchItem('timelineMilestones', milestone.id, { completed: Boolean(checked) })}
                          />
                          Complete
                        </label>
                      </div>
                    </m.li>
                    )
                  })}
                </ol>
              </div>
            </div>
            {current && (
              <RoadmapTaskHandoff
                milestone={current}
                creating={creatingFor === current.id}
                taskTitle={taskTitle}
                onTaskTitleChange={setTaskTitle}
                onCreate={createTask}
                onCancel={cancelTask}
                task={tasks.find((task) => task.id === current.implementationTaskId)}
                inTrash={Boolean(current.implementationTaskId && trash.some((item) => item.collection === 'tasks' && item.record.id === current.implementationTaskId))}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function RoadmapTaskHandoff({
  milestone,
  creating,
  taskTitle,
  onTaskTitleChange,
  onCreate,
  onCancel,
  task,
  inTrash,
}: {
  milestone: ReturnType<typeof roadmapMilestones>[number]
  creating: boolean
  taskTitle: string
  onTaskTitleChange: (title: string) => void
  onCreate: () => void
  onCancel: () => void
  task?: { id: string; title: string; progress: string; archived: boolean }
  inTrash: boolean
}) {
  if (!milestone.implementationTaskId) {
    if (!creating) return null
    return (
      <section className="mt-4 rounded-2xl border border-border bg-muted/35 p-3 shadow-sm" aria-label="Create linked task">
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">1</span>
          <label className="min-w-0 text-sm font-bold">
            Task title
            <Input
              autoFocus
              value={taskTitle}
              onChange={(event) => onTaskTitleChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') onCancel()
                if (event.key === 'Enter' && taskTitle.trim()) onCreate()
              }}
              className="mt-1"
            />
          </label>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <span className="grid size-7 place-items-center rounded-full bg-muted text-xs font-extrabold text-muted-foreground">2</span>
          <p className="text-xs font-semibold text-muted-foreground">Linked from Timeline milestone “{milestone.label}.” Timeline remains the owner; this creates a separate Overview Task.</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onCreate} disabled={!taskTitle.trim()}>Create linked task</Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">No due date, priority, schedule, or completion state is copied from this milestone.</p>
      </section>
    )
  }

  const status = !task
    ? inTrash ? 'Task is in Trash' : 'Linked task is no longer available'
    : task.archived ? 'Task is archived' : task.progress === 'Finished' ? 'Task is complete' : 'Overview task'
  const taskRoute = task && !task.archived ? `/overview/tasks?task=${task.id}` : inTrash || task?.archived ? '/settings?tab=archive' : undefined

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/35 px-3 py-2.5 shadow-sm">
      <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Link2 className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{task?.title || milestone.label}</p>
        <p className="text-xs font-semibold text-muted-foreground">{status} · Timeline milestone remains separate</p>
      </div>
      {taskRoute && <Button asChild type="button" size="sm" variant="outline"><Link to={taskRoute}>{task && !task.archived ? 'Open task' : 'Open archive'}</Link></Button>}
    </div>
  )
}

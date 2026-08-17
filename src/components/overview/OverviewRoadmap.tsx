import { Check, Target } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { MascotNote } from '@/components/common/MascotNote'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  const profile = useStore((state) => state.profile)
  const patchItem = useStore((state) => state.patchItem)
  const reduceMotion = useReducedMotion()
  const milestones = roadmapMilestones(milestonesData)
  const completed = milestones.filter((milestone) => milestone.state === 'done').length
  const progress = milestones.length ? (completed / milestones.length) * 100 : 0

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
              actions={<Badge variant="success">{completed}/{milestones.length} milestones</Badge>}
              className="mb-5"
            >
              This roadmap comes from your milestone records on Timeline, not a generic hardcoded schedule.
            </MascotNote>
            <div className="overflow-x-auto pb-2">
              <div className="relative min-w-[58rem] px-3 pt-5">
                <div className="absolute left-8 right-8 top-8 h-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
                </div>
                <ol className="relative grid auto-cols-[minmax(9rem,1fr)] grid-flow-col gap-3">
                  {milestones.map((milestone) => (
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
                        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] font-bold text-muted-foreground">
                          <Checkbox
                            checked={milestone.state === 'done'}
                            onCheckedChange={(checked) => patchItem('timelineMilestones', milestone.id, { completed: Boolean(checked) })}
                          />
                          Complete
                        </label>
                      </div>
                    </m.li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

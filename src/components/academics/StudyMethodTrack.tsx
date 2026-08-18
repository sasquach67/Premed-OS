/**
 * The 9-dot track (§4.1-K placement A) — the atom.
 *
 * Sits AFTER the approved bar / figure / chip group on a topic row and
 * replaces none of it (C2, ruled Aug 18 2026). It encodes state and nothing
 * else: no tally, no count, no second bar (U-9), and no animation on load.
 */
import { CYCLE, completedSteps, STAGE_LABEL, type CycleStage } from '@/lib/academics/studyMethod'
import type { ReviewEvent, Topic } from '@/lib/types'
import { cn } from '@/lib/utils'

const STAGES: CycleStage[] = ['before', 'after', 'retain']

export function StudyMethodTrack({ topic, events }: { topic: Topic; events: ReviewEvent[] }) {
  const done = completedSteps(topic, events)
  return (
    <span className="flex items-center gap-2" aria-label="Study method progress">
      {STAGES.map((stage, index) => (
        <span key={stage} className="flex items-center gap-1">
          {index > 0 && <span className="mr-1 h-3 w-px bg-border" aria-hidden="true" />}
          <span className="mr-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.07em] text-muted-foreground">
            {STAGE_LABEL[stage]}
          </span>
          {CYCLE.filter((entry) => entry.stage === stage).map((entry) => {
            const filled = done.has(entry.step)
            return (
              <span
                key={entry.step}
                title={entry.hasEngine ? entry.label : `${entry.label} — not available yet`}
                data-step={entry.step}
                data-filled={filled ? 'true' : 'false'}
                className={cn(
                  'size-[7px] rounded-full',
                  filled ? 'bg-primary' : 'border-[1.5px] border-border bg-transparent',
                )}
              />
            )
          })}
        </span>
      ))}
    </span>
  )
}

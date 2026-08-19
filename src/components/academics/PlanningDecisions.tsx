/**
 * Planning decisions (§4.1) — the two states that run on records that exist.
 *
 * Drawing:   mockup-lab/01-academics/academics-planning-decisions.html
 * Decisions: academics-planning-decisions.md
 * Brief:     implementation/briefs/T1-academics-build-11.md, which records why
 *            the other four states are not here: requirement preview, plan
 *            comparison, substitute choice and registered term all need a
 *            planner TERM BOARD that does not exist yet.
 *
 * ⚠️ MCAT timing is "a reading path rather than a ranking table". Ordinal marks
 * and a sentence of named evidence — no gauge, no bar, no percentage, and no
 * number the model could hand over, because `relearningOrder` returns none.
 */
import { useState } from 'react'
import { Copy } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import {
  CONTENT_RETRIEVED_AT, relearningOrder, unknownsNote,
} from '@/lib/academics/mcatTiming'
import { buildAdvisorSnapshot } from '@/lib/academics/advisorExport'
import { useToast } from '@/components/common/useToast'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

export function PlanningDecisions() {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const mcatDate = useStore((s) => s.mcat.targetDate)
  const studentName = useStore((s) => s.profile.name)
  const toast = useToast()
  const [snapshot, setSnapshot] = useState<string | undefined>()

  const { entries, target } = relearningOrder(courses, { mcatDate })

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className={cn(CARD, 'p-4')}>
        <p className={EYEBROW}>Relative course timing</p>
        <h3 className="mt-0.5 font-display text-base font-extrabold">
          What this sequence could ask you to revisit later.
        </h3>
        <p className="mt-0.5 text-xs font-bold text-muted-foreground">
          Order uses course timing and MCAT content share. It is not a retention prediction and it is not a score.
        </p>

        {entries.length > 0 ? (
          <ol className="mt-3 space-y-2">
            {entries.map((entry) => (
              <li key={entry.course.id} className="flex gap-3 rounded-xl border border-border bg-muted p-3">
                {/* Ordinal, not a metric. */}
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--cat-mcat)_18%,transparent)] font-display text-[11px] font-extrabold text-[var(--cat-mcat)]">
                  {entry.position}
                </span>
                <div className="min-w-0">
                  <b className="font-display text-sm font-extrabold">{entry.course.code}</b>
                  <span className="ml-1.5 text-[11px] font-bold text-muted-foreground">{entry.course.title}</span>
                  <p className="mt-0.5 text-[11.5px] font-bold text-muted-foreground">{entry.evidence}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-xs font-bold text-muted-foreground">
            No recorded course maps to a named MCAT content area yet.
          </p>
        )}

        <div className="mt-3 rounded-xl border border-border bg-muted p-3 text-[11px] font-bold text-muted-foreground">
          <b className="font-display text-foreground">What this does not know. </b>
          {unknownsNote(entries)}
          {target.isPlanningWindow && ' Set an MCAT date to replace the planning window when you have one.'}
        </div>
        <p className="mt-2 text-[10.5px] font-bold text-muted-foreground/80">
          Content areas from the AAMC outline, retrieved {CONTENT_RETRIEVED_AT}.
        </p>
      </section>

      <aside className={cn(CARD, 'h-fit p-4')}>
        <p className={EYEBROW}>Advisor snapshot · prepared, not official</p>
        <h3 className="mt-0.5 font-display text-sm font-extrabold">Bring your plan to the meeting.</h3>
        <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">
          Every assumption and source boundary stays visible to the next person who reviews it.
          Open requirements are listed by name, never hidden behind a count.
        </p>
        <Button
          size="sm" className="mt-3"
          onClick={() => {
            const built = buildAdvisorSnapshot({
              courses, requirements, catalogDate: 'Aug 2026', studentName,
            })
            setSnapshot(built.text)
            navigator.clipboard?.writeText(built.text).then(
              () => toast({ title: 'Advisor summary copied', description: `${built.openRequirements.length} open requirements listed by name.` }),
              () => toast({ title: 'Snapshot ready', description: 'Copy it from the preview below.' }),
            )
          }}
        >
          <Copy className="size-4" /> Copy advisor summary
        </Button>
        {snapshot && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl border border-border bg-muted p-3 text-[10.5px] font-semibold whitespace-pre-wrap">
            {snapshot}
          </pre>
        )}
      </aside>
    </div>
  )
}

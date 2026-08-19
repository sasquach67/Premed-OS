/**
 * Planning's no-record state (§4.1 cold start).
 *
 * Decisions: academics-planning-cold-start.md — "a lightly constructed, empty
 * three-term plan, not a large centered empty card", asking for the one
 * durable fact that makes everything else honest.
 *
 * ⚠️ The point of this surface is that **zero metrics are worse than none**.
 * With no courses the Planner would otherwise render GPA rings reading `—`, an
 * empty ledger, and a What-if panel — three surfaces implying data exists. All
 * of it is suppressed until one real course does.
 *
 * ⚠️ The term slots stay EMPTY. An example course is indistinguishable from a
 * real one at a glance, and this is the one screen where the student has no
 * context to tell them apart.
 */
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'
const TERMS = ['This term', 'Next term', 'Later']

export function PlanningColdStart({ onAddCourse }: { onAddCourse?: () => void }) {
  return (
    <section className={cn(CARD, 'p-4')}>
      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div>
          <p className={EYEBROW}>Planning needs one durable fact</p>
          <h3 className="mt-0.5 font-display text-lg font-extrabold">Give the empty plan a starting point.</h3>
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            Add a course you are taking or completed. If your path began before college, add the
            prior credit exactly as it appears on your record instead.
          </p>
          {onAddCourse && (
            <Button size="sm" className="mt-3" onClick={onAddCourse}>
              <Plus className="size-4" /> Add your first course
            </Button>
          )}
          <div className="mt-3 grid gap-2 text-[11px] font-bold sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/25 p-2.5">
              <b className="font-display">Current or completed course</b>
              <p className="mt-0.5 text-muted-foreground">Title, credits, term, and grade.</p>
            </div>
            {/* Subordinate on purpose — starting from AP credit alone is rarer. */}
            <div className="rounded-lg border border-border bg-muted/25 p-2.5">
              <b className="font-display">Prior credit</b>
              <p className="mt-0.5 text-muted-foreground">AP, transfer, or dual-enrolment.</p>
            </div>
          </div>
        </div>

        <div>
          <div className="grid gap-2 sm:grid-cols-3">
            {TERMS.map((term) => (
              <div key={term} className="rounded-xl border border-border bg-muted/15 p-3">
                <p className={EYEBROW}>{term}</p>
                {/* Empty, never a sample course. */}
                <div className="mt-2 h-16 rounded-lg border border-dashed border-border" />
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-dashed border-[color-mix(in_srgb,var(--cat-gpa)_45%,var(--border))] p-3 text-center">
            <b className="font-display text-sm font-extrabold">Start with one course fact</b>
            <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
              No audit, projection, or recommendation appears until this is real.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

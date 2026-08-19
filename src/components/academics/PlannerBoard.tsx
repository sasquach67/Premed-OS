/**
 * The Planner term board (§4.2) — the ruled **A + C** composition.
 *
 * Drawing:   mockup-lab/01-academics/academics-planner-prototype.html
 * Decisions: academics-planner-prototype.md — A's whole-plan board with C's
 *            selected-course inspector on demand. The handoff there is six
 *            numbered rules and this file implements them literally:
 *            the inspector opens from a chip, marks it, REPLACES the outcome
 *            rail rather than rendering beside it, swaps contents when another
 *            chip is picked, and commits nothing by opening.
 * Model:     lib/academics/planner.ts — every rule and every number.
 *
 * ⚠️ This board sequences; it does not edit. The per-term `TrackerTable`
 * collapsibles below keep that job, and duplicating them here would create a
 * second editor with its own idea of the truth.
 *
 * ⚠️ U-9: credits and named requirements only. No readiness score, no
 * composite, no "on track" badge.
 */
import { useState } from 'react'
import { GraduationCap, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { fmtGpa } from '@/lib/selectors'
import {
  courseEffects, mcatDividerAfter, outcomeProjection,
  plannerTerms, prereqVsMcat, unplacedRequirements,
} from '@/lib/academics/planner'
import type { Course } from '@/lib/types'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

export function PlannerBoard() {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const mcatDate = useStore((s) => s.mcat.targetDate)
  const [selectedId, setSelectedId] = useState<string | undefined>()

  const columns = plannerTerms(courses)
  const divider = mcatDividerAfter(columns, mcatDate)
  const unplaced = unplacedRequirements(requirements, courses)
  const selected = courses.find((course) => course.id === selectedId)

  if (!columns.length) return null

  return (
    <section className={cn(CARD, 'p-4')}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={EYEBROW}>Course sequence</p>
          <h3 className="mt-0.5 font-display text-lg font-extrabold">Plan the order, not just the list.</h3>
          <p className="mt-0.5 text-xs font-bold text-muted-foreground">
            Select a course to see what it clears. Editing stays in the term tables below.
          </p>
        </div>
      </header>

      {/* Always visible, and above the board — the one thing that must not
          fall below the fold. */}
      <div className="mt-3 rounded-xl border border-dashed border-amber-500/45 bg-amber-500/5 p-3">
        <p className={EYEBROW}>Unplaced requirements</p>
        {unplaced.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {unplaced.map((item) => (
              <span key={item.id} className="rounded-lg border border-border bg-card px-2 py-1 font-display text-[11px] font-extrabold">
                {item.label}
                <span className="ml-1.5 font-body text-[10px] font-bold text-muted-foreground">
                  {item.verificationStatus === 'needs-verification' ? 'inferred' : 'verified'}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">
            Every recorded requirement has a course placed against it.
          </p>
        )}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* A — the board. Columns scroll; a term never wraps. */}
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2.5">
            {columns.map((column, index) => (
              <div key={column.term} className="flex items-stretch gap-2.5">
                <article className="w-52 shrink-0 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display text-xs font-extrabold">{column.term}</p>
                    {column.registered && (
                      <span className="rounded border border-border px-1 py-0.5 text-[9.5px] font-bold text-muted-foreground">
                        registered
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10.5px] font-bold text-muted-foreground">
                    {column.credits} cr · {column.bcpmCredits} BCPM
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {column.courses.map((course) => (
                      <button
                        key={course.id} type="button"
                        onClick={() => setSelectedId(course.id === selectedId ? undefined : course.id)}
                        className={cn(
                          'w-full rounded-lg border bg-card p-2 text-left transition-colors duration-150 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none',
                          course.id === selectedId
                            ? 'border-[var(--cat-gpa)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--cat-gpa)_32%,transparent)]'
                            : 'border-border hover:bg-muted/40',
                        )}
                      >
                        <b className="font-display text-[12.5px] font-extrabold">{course.code}</b>
                        <p className="truncate text-[10.5px] font-bold text-muted-foreground">{course.title}</p>
                        <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">
                          {course.credits} cr · {course.bcpm ? 'BCPM' : 'AO'}
                        </p>
                      </button>
                    ))}
                    {!column.courses.length && (
                      <p className="rounded-lg border border-dashed border-border p-2 text-[10.5px] font-bold text-muted-foreground">
                        Nothing placed
                      </p>
                    )}
                  </div>
                </article>

                {/* The MCAT is a divider between terms — never a chip. */}
                {divider === index && (
                  <div className="flex w-9 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--cat-mcat)_45%,var(--border))] bg-[color-mix(in_srgb,var(--cat-mcat)_9%,transparent)]">
                    <GraduationCap className="size-4 text-[var(--cat-mcat)]" />
                    <span className="font-display text-[10px] font-extrabold tracking-widest text-[var(--cat-mcat)] [writing-mode:vertical-rl]">
                      MCAT
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* C replaces the rail — the two never render at once. */}
        {selected
          ? <Inspector course={selected} onClose={() => setSelectedId(undefined)} />
          : <OutcomeRail mcatDate={mcatDate} />}
      </div>
    </section>
  )
}

function OutcomeRail({ mcatDate }: { mcatDate?: string }) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const projection = outcomeProjection(courses)
  const late = prereqVsMcat(courses, mcatDate)
  const open = unplacedRequirements(requirements, courses)

  return (
    <aside className={cn(CARD, 'h-fit p-3.5')}>
      <p className={EYEBROW}>Live outcome</p>
      <h4 className="mt-0.5 font-display text-sm font-extrabold">What the plan adds up to</h4>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Cumulative" value={fmtGpa(projection.cumulative)} />
        <Stat label="Science (BCPM)" value={fmtGpa(projection.science)} />
      </div>
      {/* The inputs, named — a number without them is the thing U-9 forbids. */}
      <p className="mt-2 text-[10.5px] font-bold text-muted-foreground">
        From {projection.gradedCredits} graded credits. {projection.inProgressCredits} in progress and{' '}
        {projection.plannedCredits} planned are not included.
      </p>

      <div className="mt-3 border-t border-border pt-2.5">
        <p className={EYEBROW}>Prerequisites vs the MCAT</p>
        {!mcatDate ? (
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            No MCAT date recorded, so no sequencing verdict is offered.
          </p>
        ) : late.length ? (
          <ul className="mt-1 space-y-1 text-[11px] font-bold">
            {late.map((course) => (
              <li key={course.id} className="text-amber-700 dark:text-amber-300">
                {course.code} sits in {course.term}, at or after the test.
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            Every recorded prerequisite is placed before the test date.
          </p>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-2.5">
        <p className={EYEBROW}>Open requirements</p>
        {/* Named, not counted — a count is how one hides. */}
        <ul className="mt-1 space-y-0.5 text-[11px] font-bold text-muted-foreground">
          {open.slice(0, 6).map((item) => <li key={item.id}>{item.label}</li>)}
          {!open.length && <li>None open against the recorded catalog.</li>}
        </ul>
        {open.length > 6 && (
          <p className="mt-1 text-[10.5px] font-bold text-muted-foreground/80">
            …and {open.length - 6} more, all listed in Tar Heel Tracker.
          </p>
        )}
      </div>
    </aside>
  )
}

/** C — opens from a chip, commits nothing, and says which mappings are inferred. */
function Inspector({ course, onClose }: { course: Course; onClose: () => void }) {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const effects = courseEffects(course, requirements, courses)

  return (
    <aside className={cn(CARD, 'h-fit p-3.5')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={EYEBROW}>Selected course</p>
          <h4 className="mt-0.5 font-display text-sm font-extrabold">{course.code}</h4>
          <p className="text-[11px] font-bold text-muted-foreground">{course.title}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close inspector">
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-2.5 border-t border-border pt-2.5">
        <p className={EYEBROW}>What it clears</p>
        {effects.clears.length ? (
          <ul className="mt-1.5 space-y-1.5">
            {effects.clears.map((effect) => (
              <li key={effect.label} className="rounded-lg border border-border bg-muted/25 p-2">
                <b className="font-display text-[11.5px] font-extrabold">{effect.label}</b>
                <p className="text-[10.5px] font-bold text-muted-foreground">{effect.group}</p>
                <p className={cn(
                  'mt-0.5 text-[10px] font-bold',
                  effect.confidence === 'verified' ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-300',
                )}>
                  {effect.confidence === 'verified'
                    ? `Verified${effect.source ? ` · ${effect.source}` : ''}`
                    : 'Inferred mapping · confirm with an advisor'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
            No recorded requirement names this course.
          </p>
        )}
      </div>

      {effects.unlocks.length > 0 && (
        <div className="mt-3 border-t border-border pt-2.5">
          <p className={EYEBROW}>What it unlocks</p>
          <ul className="mt-1 space-y-0.5 text-[11px] font-bold">
            {effects.unlocks.map((item) => <li key={item.id}>{item.code} — {item.title}</li>)}
          </ul>
        </div>
      )}

      {effects.offeringRisk && (
        <div className="mt-3 rounded-lg border border-amber-500/45 bg-amber-500/5 p-2 text-[11px] font-bold text-muted-foreground">
          <b className="font-display text-foreground">Offering risk. </b>{effects.offeringRisk}
        </div>
      )}

      <p className="mt-3 border-t border-border pt-2.5 text-[10.5px] font-bold text-muted-foreground">
        Nothing is placed or changed by looking. Editing stays in the term tables below.
      </p>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/25 p-2">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-extrabold tabular-nums">{value}</p>
    </div>
  )
}

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
import { inferAcademicTerm } from '@/store/migrations/academicsV4'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'
export function coldStartPlanningTerms(currentTerm: string) {
  const first = concreteAcademicTerm(currentTerm)
  const second = nextAcademicTerm(first)
  return [
    { label: 'This term', term: first },
    { label: 'Next term', term: second },
    { label: 'Later', term: nextAcademicTerm(second) },
  ]
}

function concreteAcademicTerm(value: string) {
  return /^(Spring|Summer|Fall)\s+\d{4}$/i.test(value.trim()) ? value.trim() : inferAcademicTerm()
}

function nextAcademicTerm(value: string) {
  const match = /^(Spring|Summer|Fall)\s+(\d{4})$/i.exec(value.trim())
  if (!match) return 'Spring 2027'
  const season = match[1].toLowerCase()
  const year = Number(match[2])
  return season === 'fall' ? `Spring ${year + 1}` : `Fall ${year}`
}

export function PlanningColdStart({ currentTerm, onAddCourse }: { currentTerm: string; onAddCourse?: (destination: string) => void }) {
  const terms = coldStartPlanningTerms(currentTerm)
  return (
    <section className="planning-workspace">
      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="self-center border-l-2 border-primary py-2 pl-4 pr-2">
          <p className={EYEBROW}>Planning needs one durable fact</p>
          <h3 className="mt-0.5 font-display text-lg font-extrabold">Give the empty plan a starting point.</h3>
          <p className="mt-1 text-xs font-bold text-muted-foreground">
            Add a course you are taking or completed. If your path began before college, add the
            prior credit exactly as it appears on your record instead.
          </p>
          {onAddCourse && (
            <Button size="sm" className="mt-3" onClick={() => onAddCourse(terms[0].term)}>
              <Plus className="size-4" /> Add your first course
            </Button>
          )}
          <div className="mt-3 divide-y divide-border border-y border-border text-[11px] font-bold">
            <div className="py-2.5">
              <b className="font-display">Current or completed course</b>
              <p className="mt-0.5 text-muted-foreground">Title, credits, term, and grade.</p>
            </div>
            {/* Subordinate on purpose — starting from AP credit alone is rarer. */}
            <a className="block py-2.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="#/academics?mode=planning&tab=archive&gradeView=ledger&transcript=intake">
              <b className="font-display">Prior credit</b>
              <p className="mt-0.5 text-muted-foreground">AP, transfer, or dual-enrolment.</p>
            </a>
          </div>
        </div>

        <div className={cn(CARD, 'p-4')}>
          <div className="grid gap-2 sm:grid-cols-3" aria-label="Choose where to place the first course">
            {terms.map(({ label, term }) => (
              <div key={term} className="rounded-xl border border-border bg-muted p-3">
                <p className={EYEBROW}>{label}</p>
                <p className="mt-0.5 text-[11px] font-extrabold text-foreground">{term}</p>
                {onAddCourse ? <button
                  type="button"
                  className="mt-2 flex h-16 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border font-display text-xs font-extrabold text-muted-foreground transition-colors hover:border-primary hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Add a course to ${term}`}
                  onClick={() => onAddCourse(term)}
                ><Plus className="size-3.5" /> Add course</button> : <div className="mt-2 h-16 rounded-lg border border-dashed border-border" />}
              </div>
            ))}
          </div>
          <p className="mt-2 border-t border-border pt-2 text-center text-[11px] font-bold text-muted-foreground">
            Choose a destination; nothing is added until you review and confirm the course.
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Grade decisions — the record layer inside Grades & archive (§4.1).
 *
 * Drawing:   mockup-lab/01-academics/academics-grade-decisions.html
 * Decisions: academics-grade-decisions.md — four STATE views of ONE record
 *            treatment. They share a hierarchy: eyebrow → statement →
 *            evidence → exactly one action. They are not visual variants and
 *            must not drift into four different card families.
 * Model:     lib/academics/gradeDecisions.ts, which owns every rule.
 *
 * ⚠️ Three things this surface never does: claim a regrade is justified,
 * estimate an unpublished curve, or turn one marked mistake into a diagnosis.
 */
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { fmtDate } from '@/lib/date'
import {
  appliedPolicies, missingInputs, regradeWindow, reviewableWork,
  type PolicyState,
} from '@/lib/academics/gradeDecisions'
import type { ClassAssignment, Course, GradeCategory } from '@/lib/types'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

/** `not-recorded` reads as absent, never as a settled "no". */
const POLICY_TONE: Record<PolicyState, string> = {
  applied: 'border-[color-mix(in_srgb,var(--cat-gpa)_38%,var(--border))] bg-[color-mix(in_srgb,var(--cat-gpa)_8%,transparent)]',
  'not-applied': 'border-border bg-muted',
  'not-recorded': 'border-dashed border-amber-500/45 bg-amber-500/5',
}
const POLICY_LABEL: Record<PolicyState, string> = {
  applied: 'Applied',
  'not-applied': 'Not applied',
  'not-recorded': 'Not recorded',
}

export function GradeDecisions({ course, assignments, categories }: {
  course: Course
  assignments: ClassAssignment[]
  categories: GradeCategory[]
}) {
  const reviewable = reviewableWork(assignments)
  const gaps = missingInputs(categories, assignments)
  const category = categories[0]

  // Nothing to decide about is not a state worth drawing (U-5).
  if (!reviewable.length && !gaps.length && !category) return null

  return (
    <section className="space-y-4">
      <header>
        <p className={EYEBROW}>{course.code} · grade decisions</p>
        <h3 className="font-display text-lg font-extrabold">Decisions about real records</h3>
        <p className="mt-0.5 text-xs font-bold text-muted-foreground">
          Each one names the record it read and offers a single next step.
        </p>
      </header>

      {reviewable.map((item) => <ReturnedWork key={item.id} item={item} course={course} />)}
      {category && <PolicyApplied category={category} />}
      {gaps.length > 0 && <MissingInputs gaps={gaps} />}
    </section>
  )
}

/** #44 — the deadline is factual and calm, and the action is review, not appeal. */
function ReturnedWork({ item, course }: { item: ClassAssignment; course: Course }) {
  const window = regradeWindow(item)
  return (
    <article className={cn(CARD, 'p-4')}>
      <p className={EYEBROW}>{course.code} · returned work</p>
      <h4 className="mt-0.5 font-display text-base font-extrabold">{item.title} can still be reviewed.</h4>
      <p className="mt-0.5 text-xs font-bold text-muted-foreground">
        This is a decision about one real item, not a generic grade alert.
      </p>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-xl border border-border bg-muted p-3">
          <p className={EYEBROW}>Instructor record</p>
          <div className="mt-2 space-y-2 text-xs font-bold">
            <Datum label="Regrade request window" value={window.closesOn ? `Closes ${fmtDate(window.closesOn, { weekday: 'long', month: 'short', day: 'numeric' })}` : 'Not recorded'} />
            <Datum label="Returned" value={item.returnedAt ? fmtDate(item.returnedAt) : 'Date not recorded'} />
            <Datum label="Recorded result" value={item.pointsEarned != null && item.pointsPossible != null ? `${item.pointsEarned}/${item.pointsPossible}` : 'Not recorded'} />
            <Datum label="Record integrity" value="Returned work stays unchanged" />
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-muted p-3">
          <p className={EYEBROW}>A bounded next step</p>
          <p className="mt-1 text-sm font-extrabold">Review the marked items first.</p>
          {/* The sentence that keeps this honest — do not soften it into advice. */}
          <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">
            Premed OS does not claim a regrade is justified. It keeps the instructor’s deadline
            and your original evidence in one place.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to={`/academics/classes/${item.courseId}?classTab=assignments`}>Open returned work</Link>
          </Button>
        </aside>
      </div>
    </article>
  )
}

/** #50 — every rule stays inspectable, including the ones nobody recorded. */
function PolicyApplied({ category }: { category: GradeCategory }) {
  const rows = appliedPolicies(category)
  return (
    <article className={cn(CARD, 'p-4')}>
      <p className={EYEBROW}>Policy disclosure</p>
      <h4 className="mt-0.5 font-display text-base font-extrabold">What this calculation used</h4>
      <p className="mt-0.5 text-xs font-bold text-muted-foreground">
        The result is only as complete as the course policy and posted work that support it.
      </p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <section key={row.id} className={cn('rounded-xl border p-3', POLICY_TONE[row.state])}>
            <div className="flex items-center justify-between gap-3">
              <b className="font-display text-sm font-extrabold">{row.title}</b>
              <span className="font-display text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
                {POLICY_LABEL[row.state]}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">{row.detail}</p>
            <p className="mt-1.5 text-[10.5px] font-bold text-muted-foreground/80">{row.source}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

/** One unresolved fact, one recovery path, no zero and no speculative outcome. */
function MissingInputs({ gaps }: { gaps: ReturnType<typeof missingInputs> }) {
  return (
    <article className={cn(CARD, 'p-4')}>
      <p className={EYEBROW}>Honest absence</p>
      <h4 className="mt-0.5 font-display text-base font-extrabold">
        {gaps.length === 1 ? 'This decision needs one more course fact.' : `This decision needs ${gaps.length} more course facts.`}
      </h4>
      <p className="mt-0.5 text-xs font-bold text-muted-foreground">No calculation is shown until the source exists.</p>
      <div className="mt-3 space-y-2">
        {gaps.map((gap) => (
          <div key={gap.id} className="rounded-xl border border-dashed border-border bg-muted p-3">
            <b className="font-display text-sm font-extrabold">{gap.fact}</b>
            <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">{gap.recovery}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <b className="font-display text-right">{value}</b>
    </div>
  )
}

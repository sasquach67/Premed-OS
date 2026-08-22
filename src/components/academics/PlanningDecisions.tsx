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
import { applyPlanRestore, applyPlannerTermRestore, capturePlan, planDiff, plannerTermDiff } from '@/lib/academics/savedPlans'
import type { SavedPlan } from '@/lib/types'
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
    <div className="space-y-4">
    <PlanComparison />
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
    </div>
  )
}

/**
 * §4.1 plan comparison. **Neither plan is coloured as the recommended one** —
 * the decisions file says so outright, and the whole point is that the student
 * decides which fits their actual situation.
 *
 * Restore never applies directly: it opens the diff, which states both what
 * would move and what will not be touched.
 */
function PlanComparison() {
  const courses = useStore((s) => s.courses)
  const plans = useStore((s) => s.academics.classCenter.savedPlans ?? [])
  const plannerTerms = useStore((s) => s.academics.classCenter.plannerTerms ?? [])
  const [restoring, setRestoring] = useState<SavedPlan | undefined>()
  const [name, setName] = useState('')
  const toast = useToast()

  const save = () => {
    useStore.getState().update((draft) => {
      draft.academics.classCenter.savedPlans = [
        ...(draft.academics.classCenter.savedPlans ?? []),
        capturePlan(draft.courses, {
          name,
          plannerTerms: draft.academics.classCenter.plannerTerms ?? [],
          order: (draft.academics.classCenter.savedPlans ?? []).length,
        }),
      ]
    })
    setName('')
  }

  const diff = restoring ? planDiff(restoring, courses) : undefined
  const slotChanges = restoring ? plannerTermDiff(restoring, plannerTerms) : []

  return (
    <section className={cn(CARD, 'p-4')}>
      <p className={EYEBROW}>Saved plan comparison</p>
      <h3 className="mt-0.5 font-display text-base font-extrabold">See the choice side by side.</h3>
      <p className="mt-0.5 text-xs font-bold text-muted-foreground">
        Neither plan is marked as the better one. Restore the one that fits your actual decision.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={name} onChange={(event) => setName(event.target.value)}
          placeholder="Name this plan…"
          className="rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-bold"
        />
        <Button size="sm" variant="outline" onClick={save} disabled={!name.trim()}>Save current plan</Button>
      </div>

      {plans.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {plans.slice(0, 2).map((plan) => (
            <article key={plan.id} className="rounded-xl border border-border bg-muted p-3">
              <p className={EYEBROW}>Saved plan</p>
              <b className="mt-0.5 block font-display text-sm font-extrabold">{plan.name}</b>
              <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                {plan.placements.length} courses · saved {new Date(plan.createdAt).toLocaleDateString()}
              </p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setRestoring(plan)}>
                Review restore
              </Button>
            </article>
          ))}
        </div>
      )}

      {restoring && diff && (
        <div className="mt-3 rounded-xl border border-border bg-muted p-3">
          <b className="font-display text-sm font-extrabold">Restoring “{restoring.name}”</b>
          {diff.changes.length ? (
            <ul className="mt-2 space-y-1 text-[11.5px] font-bold">
              {diff.changes.map((change) => (
                <li key={change.course.id}>
                  {change.course.code}: {change.from} → {change.to}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11.5px] font-bold text-muted-foreground">Nothing would move.</p>
          )}

          {/* Stated, not hidden: the restore is partial and here is why. */}
          {diff.skipped.length > 0 && (
            <div className="mt-2 border-t border-border pt-2">
              <p className={EYEBROW}>Left untouched</p>
              <ul className="mt-1 space-y-0.5 text-[11px] font-bold text-muted-foreground">
                {diff.skipped.map((skip) => <li key={skip.courseId}>{skip.label} — {skip.reason}</li>)}
              </ul>
            </div>
          )}

          {restoring.plannerTerms ? (
            <div className="mt-2 border-t border-border pt-2">
              <p className={EYEBROW}>Planning slots</p>
              {slotChanges.length ? (
                <ul className="mt-1 space-y-0.5 text-[11px] font-bold text-muted-foreground">
                  {slotChanges.map((change) => <li key={change.term.id}>{change.kind === 'add' ? 'Add' : 'Update'} {change.term.label}{change.term.lockedAt ? ' · locked' : ''}</li>)}
                </ul>
              ) : <p className="mt-1 text-[11px] font-bold text-muted-foreground">No saved slot details would change.</p>}
            </div>
          ) : (
            <p className="mt-2 border-t border-border pt-2 text-[11px] font-bold text-muted-foreground">This older saved plan predates planning slots; only course moves can be restored.</p>
          )}

          <div className="mt-3 flex gap-2">
            <Button
              size="sm" disabled={!diff.changes.length && !slotChanges.length}
              onClick={() => {
                useStore.getState().update((draft) => {
                  draft.courses = applyPlanRestore(draft.courses, diff.changes)
                  draft.academics.classCenter.plannerTerms = applyPlannerTermRestore(
                    draft.academics.classCenter.plannerTerms ?? [],
                    slotChanges,
                  )
                })
                toast({ title: 'Plan restored', description: `${diff.changes.length} courses moved. Nothing graded was touched.` })
                setRestoring(undefined)
              }}
            >
              Apply saved plan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRestoring(undefined)}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  )
}

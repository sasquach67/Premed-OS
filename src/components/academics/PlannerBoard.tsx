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
import { CalendarPlus, GraduationCap, LockKeyhole, Pencil, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { uid } from '@/lib/id'
import { fmtGpa } from '@/lib/selectors'
import {
  courseEffects, mcatDividerAfter, outcomeProjection,
  plannerTerms, prereqVsMcat, unplacedRequirements,
} from '@/lib/academics/planner'
import { isProtected } from '@/lib/academics/savedPlans'
import type { Course, PlannerTerm } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

export function PlannerBoard() {
  const courses = useStore((s) => s.courses)
  const requirements = useStore((s) => s.requirements)
  const mcatDate = useStore((s) => s.mcat.targetDate)
  const slots = useStore((s) => s.academics.classCenter.plannerTerms ?? [])
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [placingCourse, setPlacingCourse] = useState<Course | undefined>()
  const [placementOpen, setPlacementOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<PlannerTerm | undefined>()
  const [newTermLabel, setNewTermLabel] = useState('')
  const [newTermKind, setNewTermKind] = useState<PlannerTerm['kind']>('standard')

  const columns = plannerTerms(courses, slots)
  const divider = mcatDividerAfter(columns, mcatDate)
  const unplaced = unplacedRequirements(requirements, courses)
  const selected = courses.find((course) => course.id === selectedId)

  if (!columns.length) return null

  const addSlot = () => {
    const label = newTermLabel.trim()
    if (!label) return
    const already = slots.some((slot) => slot.label.trim().toLocaleLowerCase() === label.toLocaleLowerCase())
    if (already) return
    const now = Date.now()
    const slot: PlannerTerm = {
      id: uid(), label, kind: newTermKind, origin: 'student-created', createdAt: now, updatedAt: now, order: slots.length,
    }
    useStore.getState().update((draft) => { draft.academics.classCenter.plannerTerms.push(slot) })
    setNewTermLabel('')
  }

  const place = (course: Course, term: { id?: string; term: string; lockedAt?: number; registered: boolean }) => {
    if (term.lockedAt || term.registered || isProtected(course)) return
    useStore.getState().update((draft) => {
      const row = draft.courses.find((item) => item.id === course.id)
      if (row && !isProtected(row)) {
        row.term = term.term
        row.plannerTermId = term.id
      }
    })
    setPlacingCourse(undefined)
  }

  return (
    <section className={cn(CARD, 'p-4')}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={EYEBROW}>Course sequence</p>
          <h3 className="mt-0.5 font-display text-lg font-extrabold">Plan the order, not just the list.</h3>
          <p className="mt-0.5 text-xs font-bold text-muted-foreground">
            Select a course to see what it clears, then preview its placement before saving it.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { setPlacingCourse(undefined); setPlacementOpen(true) }}>
          <CalendarPlus className="size-4" /> Add term
        </Button>
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
              <div key={column.id ?? column.term} className="flex items-stretch gap-2.5">
                <article className="w-52 shrink-0 rounded-xl border border-border bg-muted p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <p className="truncate font-display text-xs font-extrabold">{column.term}</p>
                      {column.lockedAt && <LockKeyhole className="size-3 text-muted-foreground" aria-label="Term locked" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {column.registered && <span className="rounded border border-border px-1 py-0.5 text-[9.5px] font-bold text-muted-foreground">registered</span>}
                      {column.id && <Button size="icon" variant="ghost" className="size-6" onClick={() => setEditingSlot(slots.find((slot) => slot.id === column.id))} aria-label={`Edit ${column.term}`}><Pencil className="size-3" /></Button>}
                    </div>
                  </div>
                  <p className="mt-0.5 text-[10.5px] font-bold text-muted-foreground">
                    {column.credits} cr · {column.bcpmCredits} BCPM
                  </p>
                  {column.note && <p className="mt-1 line-clamp-2 text-[10px] font-bold text-muted-foreground">{column.note}</p>}
                  <div className="mt-2 space-y-1.5">
                    {column.courses.map((course) => (
                      <button
                        key={course.id} type="button"
                        onClick={() => setSelectedId(course.id === selectedId ? undefined : course.id)}
                        className={cn(
                          'w-full rounded-lg border bg-card p-2 text-left transition-colors duration-150 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none',
                          course.id === selectedId
                            ? 'border-[var(--cat-gpa)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--cat-gpa)_32%,transparent)]'
                            : 'border-border hover:bg-muted',
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
          ? <Inspector course={selected} onClose={() => setSelectedId(undefined)} onPlace={() => { setPlacingCourse(selected); setPlacementOpen(true) }} />
          : <OutcomeRail mcatDate={mcatDate} />}
      </div>

      <PlacementDialog key={placingCourse?.id ?? 'new-term'}
        course={placingCourse}
        open={placementOpen}
        columns={columns}
        label={newTermLabel}
        onLabelChange={setNewTermLabel}
        kind={newTermKind}
        onKindChange={setNewTermKind}
        onAdd={addSlot}
        onPlace={place}
        onOpenChange={(open) => { setPlacementOpen(open); if (!open) setPlacingCourse(undefined) }}
      />
      <TermEditor key={editingSlot?.id ?? 'term-editor-closed'} term={editingSlot} onOpenChange={(open) => { if (!open) setEditingSlot(undefined) }} />
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
function Inspector({ course, onClose, onPlace }: { course: Course; onClose: () => void; onPlace: () => void }) {
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
              <li key={effect.label} className="rounded-lg border border-border bg-muted p-2">
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

      <div className="mt-3 border-t border-border pt-2.5">
        {isProtected(course) ? (
          <p className="text-[10.5px] font-bold text-muted-foreground">This recorded course is locked from planning moves.</p>
        ) : (
          <Button size="sm" variant="outline" onClick={onPlace}>Choose term</Button>
        )}
        <p className="mt-2 text-[10.5px] font-bold text-muted-foreground">Nothing changes until you choose a destination.</p>
      </div>
    </aside>
  )
}

function PlacementDialog({
  course, open, columns, label, onLabelChange, kind, onKindChange, onAdd, onPlace, onOpenChange,
}: {
  course?: Course
  open: boolean
  columns: ReturnType<typeof plannerTerms>
  label: string
  onLabelChange: (value: string) => void
  kind: PlannerTerm['kind']
  onKindChange: (value: PlannerTerm['kind']) => void
  onAdd: () => void
  onPlace: (course: Course, term: { id?: string; term: string; lockedAt?: number; registered: boolean }) => void
  onOpenChange: (open: boolean) => void
}) {
  const [previewTermId, setPreviewTermId] = useState<string | undefined>()
  const preview = columns.find((column) => (column.id ?? column.term) === previewTermId)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{course ? `Place ${course.code}` : 'Add a planning term'}</DialogTitle>
          <DialogDescription>{course ? 'Choose a recorded term. Locked or registered terms cannot be changed here.' : 'A term is a planning slot, not an official registration record.'}</DialogDescription>
        </DialogHeader>
        {course && <div className="grid gap-2 sm:grid-cols-2">
          {columns.map((column) => {
            const blocked = Boolean(column.lockedAt || column.registered)
            return <Button key={column.id ?? column.term} variant={preview === column ? 'default' : 'outline'} className="h-auto justify-start py-3 text-left" disabled={blocked} onClick={() => setPreviewTermId(column.id ?? column.term)}>
              <span><b className="block font-display">{column.term}</b><span className="text-[11px] text-muted-foreground">{blocked ? (column.lockedAt ? 'Locked term' : 'Registered term') : `${column.credits} credits placed`}</span></span>
            </Button>
          })}
        </div>}
        {course && preview && <div className="rounded-xl border border-border bg-muted p-3 text-xs font-bold">
          <p><b className="font-display">Preview:</b> move {course.code} from {course.term} to {preview.term}.</p>
          <p className="mt-1 text-[11px] text-muted-foreground">The inspector names recorded requirement effects; no catalog substitute or official completion is inferred here.</p>
          <Button size="sm" className="mt-2" onClick={() => onPlace(course, preview)}>Place in {preview.term}</Button>
        </div>}
        <div className="border-t border-border pt-3">
          <p className={EYEBROW}>New term slot</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="e.g. Summer 2027" className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-2.5 py-2 text-xs font-bold" />
            <select value={kind} onChange={(event) => onKindChange(event.target.value as PlannerTerm['kind'])} className="rounded-lg border border-border bg-muted px-2 text-xs font-bold"><option value="standard">Standard</option><option value="summer">Summer</option><option value="gap">Gap</option></select>
            <Button size="sm" variant="outline" onClick={onAdd} disabled={!label.trim()}>Add term</Button>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TermEditor({ term, onOpenChange }: { term?: PlannerTerm; onOpenChange: (open: boolean) => void }) {
  const [note, setNote] = useState(term?.note ?? '')
  const [locked, setLocked] = useState(Boolean(term?.lockedAt))
  const openedId = term?.id
  return (
    <Dialog open={Boolean(term)} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader><DialogTitle>Term details</DialogTitle><DialogDescription>Keep a short reason for a locked planning term. This is not an official registration status.</DialogDescription></DialogHeader>
        {term && <div className="space-y-3">
          <p className="font-display text-sm font-extrabold">{term.label}</p>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note or constraint" className="min-h-20 w-full rounded-lg border border-border bg-muted p-2 text-xs font-bold" />
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} /> Lock this planning term</label>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => {
          if (!openedId) return
          useStore.getState().update((draft) => {
            const target = draft.academics.classCenter.plannerTerms.find((slot) => slot.id === openedId)
            if (!target) return
            target.note = note.trim() || undefined
            target.lockedAt = locked ? (target.lockedAt ?? Date.now()) : undefined
            target.updatedAt = Date.now()
          })
          onOpenChange(false)
        }}>Save term details</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-2">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-extrabold tabular-nums">{value}</p>
    </div>
  )
}

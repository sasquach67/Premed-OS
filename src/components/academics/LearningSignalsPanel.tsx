/**
 * Learning signals — the class-Overview panel (§4.1), in the ruled
 * **A · priority rail** composition (`academics-learning-signals.md`,
 * Aug 18 2026).
 *
 * Drawing:   mockup-lab/01-academics/academics-learning-signals.html (variant A)
 * Model:     lib/academics/learningSignals.ts — every rule lives there. This
 *            file draws whatever it returns and derives nothing of its own.
 *
 * Two things this component must never grow: a chart (retrievability has an
 * owner — `ForgettingCurve`) and an empty state (§4.1 renders no panel at all
 * when nothing is earned).
 *
 * ⚠️ Mobile follows the DECISIONS FILE, not the frame. The drawing hides the
 * evidence rail below its breakpoint, which would drop §4.1's evidence
 * requirement on phones. Ruled instead: the rail CARD is what goes, and each
 * signal's evidence renders inline under its cause line.
 */
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  learningSignals, signalsShouldRender,
  type LearningSignal, type SignalKind,
} from '@/lib/academics/learningSignals'
import type { ClassAssignment, ClassWorkspaceType, ReviewEvent, Topic, TopicLink } from '@/lib/types'

/** The row's KIND, never its severity — colour says what sort of thing it is. */
const MARK: Record<SignalKind, string> = {
  routine: 'bg-[var(--cat-gpa)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--cat-gpa)_12%,transparent)]',
  timing: 'bg-amber-500 shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-amber-500)_12%,transparent)]',
  proposal: 'bg-[var(--cat-mcat)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--cat-mcat)_12%,transparent)]',
}

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'

export function LearningSignalsPanel({ courseId, topics, events, assignments, classType, onTab, topicLinks = [] }: {
  courseId: string
  topics: Topic[]
  events: ReviewEvent[]
  assignments: ClassAssignment[]
  classType?: ClassWorkspaceType
  onTab: (tab: string) => void
  topicLinks?: TopicLink[]
}) {
  const signals = learningSignals({ courseId, topics, events, assignments, topicLinks })
  // The STEM boundary and the no-empty-panel rule are both the model's, so
  // neither can drift into this file and be forgotten.
  if (!signalsShouldRender(signals, classType)) return null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20.5rem]">
      <section className={cn(CARD, 'p-[18px]')}>
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className={EYEBROW}>Learning signals</p>
            <h3 className="font-display text-base font-extrabold">
              {signals.length === 1 ? 'One thing worth changing' : `${signals.length === 2 ? 'Two' : 'Three'} things worth changing`}
            </h3>
            <p className="mt-0.5 text-xs font-bold text-muted-foreground">
              Shown only when class records give them a cause.
            </p>
          </div>
          <span className="shrink-0 text-[10.5px] font-bold text-muted-foreground/80">STEM only</span>
        </header>

        <div>
          {signals.map((signal) => (
            <SignalRow key={signal.id} signal={signal} onTab={onTab} />
          ))}
        </div>
      </section>

      {/* States records, never conclusions. Hidden below `lg`, where each row
          carries its own evidence instead — the facts never disappear. */}
      <aside className={cn(CARD, 'hidden h-fit p-[17px] lg:block')}>
        <p className={EYEBROW}>Why these appear</p>
        <h3 className="mt-0.5 mb-2.5 font-display text-[15px] font-extrabold">Evidence stays visible</h3>
        {signals.map((signal) => (
          <div key={signal.id} className="border-t border-border py-2.5 text-[11px] font-bold text-muted-foreground first:border-t-0">
            <span className="block font-display text-foreground">{signal.evidenceLabel}</span>
            {signal.evidenceDetail}
          </div>
        ))}
      </aside>
    </div>
  )
}

function SignalRow({ signal, onTab }: { signal: LearningSignal; onTab: (tab: string) => void }) {
  const { action } = signal
  const routeClass = 'mt-2 inline-block font-display text-[11px] font-extrabold text-[var(--cat-gpa)] transition-opacity duration-150 ease-[cubic-bezier(.16,1,.3,1)] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cat-gpa)] motion-reduce:transition-none'

  return (
    <section className="relative border-t border-border py-[13px] pl-[18px] first:border-t-0">
      <span aria-hidden className={cn('absolute left-0 top-[19px] size-[7px] rounded-[3px]', MARK[signal.kind])} />
      <b className="block font-display text-sm font-extrabold">{signal.title}</b>
      <p className="mt-0.5 text-[11.5px] font-bold text-muted-foreground">{signal.cause}</p>

      {/* The rail's job, done inline, on the layouts that have no rail. */}
      <p className="mt-1.5 text-[11px] font-bold text-muted-foreground lg:hidden">
        <span className="font-display text-foreground">{signal.evidenceLabel} · </span>
        {signal.evidenceDetail}
      </p>

      {action.type === 'route' ? (
        <Link to={action.to} className={routeClass}>{signal.actionLabel} →</Link>
      ) : (
        <button type="button" onClick={() => onTab(action.tab)} className={routeClass}>
          {signal.actionLabel} →
        </button>
      )}
    </section>
  )
}

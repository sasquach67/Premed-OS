/**
 * Calendar review (§4.1 materials extensions) — the read-only handoff trail.
 *
 * Drawing:   mockup-lab/01-academics/academics-materials-extensions.html
 * Decisions: academics-materials-extensions.md — "a left-to-right handoff
 *            trail … so the calendar source, one proposed change, and the
 *            student-controlled course record feel sequential rather than like
 *            three settings cards."
 * Model:     lib/academics/calendarReview.ts.
 *
 * ⚠️ Premed OS never calls Canvas and never holds a Canvas token. Canvas
 * publishes a personal feed, the student subscribes to it in Google Calendar,
 * and this reads Google. Neither button here writes a date without an explicit
 * click, and neither is styled as the recommended one.
 */
import { CalendarClock, CircleAlert, Link2 } from 'lucide-react'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { fmtDate } from '@/lib/date'
import { useCalendarSync } from '@/hooks/useCalendarSync'
import {
  applyProposedDate, feedState, proposedDateChanges,
} from '@/lib/academics/calendarReview'
import type { ClassAssignment } from '@/lib/types'
import { Button } from '@/components/ui/button'

const CARD = 'rounded-2xl border border-border bg-card shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]'
const EYEBROW = 'font-display text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted-foreground'
const STEP = 'rounded-xl border border-border bg-muted/25 p-3'

export function CalendarReview({ assignments }: { assignments: ClassAssignment[] }) {
  const calendar = useStore((s) => s.settings.calendar)
  const { connected } = useCalendarSync()
  const events = calendar.cachedEvents ?? []
  const state = feedState({ connected, events, lastError: calendar.lastError })
  // Only a live feed proposes. `cachedEvents` survives a disconnect, and
  // offering changes from a feed the student has switched off would contradict
  // "disconnecting stops new context".
  const proposals = state === 'connected' ? proposedDateChanges(events, assignments) : []

  function accept(assignmentId: string, date: string) {
    useStore.getState().update((draft) => {
      draft.academics.classCenter.assignments = applyProposedDate(
        draft.academics.classCenter.assignments, { assignmentId, date },
      )
    })
  }

  return (
    <section className={cn(CARD, 'p-4')}>
      <p className={EYEBROW}>Read-only handoff</p>
      <h3 className="mt-0.5 font-display text-base font-extrabold">Canvas dates, in the calendar you already use.</h3>
      <p className="mt-0.5 max-w-2xl text-xs font-bold text-muted-foreground">
        Premed OS never asks for a Canvas token. Canvas publishes a personal calendar feed, you
        subscribe to it in Google Calendar, and any difference stays reviewable here.
      </p>

      {/* The trail: source → difference → your record. Sequential on purpose. */}
      <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
        <div className={STEP}>
          <Link2 className="size-4 text-[var(--cat-gpa)]" />
          <b className="mt-1.5 block font-display text-[12.5px] font-extrabold">Canvas → Google Calendar</b>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
            Canvas publishes its dates and remains the coursework owner.
          </p>
        </div>

        <div className={cn(STEP, proposals.length && 'border-amber-500/45 bg-amber-500/5')}>
          <CalendarClock className={cn('size-4', proposals.length ? 'text-amber-600 dark:text-amber-300' : 'text-muted-foreground')} />
          <b className="mt-1.5 block font-display text-[12.5px] font-extrabold">
            {proposals.length
              ? `${proposals.length} proposed ${proposals.length === 1 ? 'difference' : 'differences'}`
              : 'No differences to review'}
          </b>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
            {proposals.length
              ? 'Each one names both dates. Nothing changes until you accept it.'
              : 'Where a date matches your record, there is nothing to decide.'}
          </p>
        </div>

        <div className={STEP}>
          <b className="block font-display text-[12.5px] font-extrabold">Your class record</b>
          <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
            No date is overwritten silently. Disconnecting stops new context and keeps your class.
          </p>
        </div>
      </div>

      {state === 'disconnected' && (
        <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-[11.5px] font-bold text-muted-foreground">
          Google Calendar is not connected, so there is no feed context yet. Connect it in Settings
          to see subscribed course dates here — your class works exactly the same without it.
        </p>
      )}

      {/* Ordinary, not an error. */}
      {state === 'connected-empty' && (
        <p className="mt-3 rounded-xl border border-border bg-muted/25 p-3 text-[11.5px] font-bold text-muted-foreground">
          <b className="font-display text-foreground">Connected, no course match yet. </b>
          That is ordinary. Add assignments manually or import a syllabus instead.
        </p>
      )}

      {state === 'unavailable' && (
        <div className="mt-3 rounded-xl border border-amber-500/45 bg-amber-500/5 p-3">
          <CircleAlert className="size-4 text-amber-600 dark:text-amber-300" />
          <b className="mt-1.5 block font-display text-[12.5px] font-extrabold">
            That feed is not reachable right now.
          </b>
          <p className="mt-0.5 text-[11.5px] font-bold text-muted-foreground">
            <b className="text-foreground">No course dates were changed.</b> Reconnect Google Calendar,
            check the personal Canvas feed, or continue with your syllabus and manual records.
          </p>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="mt-3 space-y-2">
          {proposals.map((proposal) => (
            <div key={proposal.assignment.id} className="rounded-xl border border-border bg-muted/25 p-3">
              <b className="font-display text-sm font-extrabold">{proposal.assignment.title} moved</b>
              <p className="mt-0.5 text-[11.5px] font-bold text-muted-foreground">
                Calendar says {fmtDate(proposal.calendarDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}your record says {fmtDate(proposal.recordedDate, { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              {/* Neither is the recommended one. */}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => accept(proposal.assignment.id, proposal.calendarDate)}>
                  Use the calendar date
                </Button>
                <Button size="sm" variant="ghost">Keep mine</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

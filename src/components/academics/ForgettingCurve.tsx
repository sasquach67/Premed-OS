/**
 * The sawtooth panel (§4.1-L) — "will I still know this on exam day?"
 *
 * Drawing:   mockup-lab/01-academics/academics-forgetting-curve.html
 * Decisions: academics-forgetting-curve.md
 * Model:     lib/academics/forgettingCurve.ts, which renders fsrs.ts. This file
 *            draws; it computes no decay of its own.
 *
 * C1 (ruled Aug 18 2026): the exam-day figure and its band label are one
 * render. There is no path here that emits the number alone.
 */
import { useId } from 'react'
import type { ReviewEvent, ClassAssignment, Topic } from '@/lib/types'
import {
  examDayReading, hasEnoughHistory, historySegments, projectionSegment,
  reviewGapsInDays, reviewTimestamps, reviewsForTopic, stateAfterLastReview,
} from '@/lib/academics/forgettingCurve'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

const PAD = { left: 52, right: 40, top: 40, bottom: 26 }
const W = 920
const H = 250

export function ForgettingCurve({ topic, events, exam }: {
  topic: Topic
  events: ReviewEvent[]
  exam?: ClassAssignment
}) {
  const titleId = useId()
  const reviews = reviewsForTopic(events, topic.id)
  const stamps = reviewTimestamps(reviews)

  if (!hasEnoughHistory(stamps)) return <ThinHistory topic={topic} reviewCount={reviews.length} />

  const examAt = exam?.dueDate ? new Date(exam.dueDate).getTime() : undefined
  const firstReview = stamps[0]
  const lastReview = stamps[stamps.length - 1]
  const span = Math.max(lastReview - firstReview, 1)
  // Draw past the last review so the projection is visible, and always far
  // enough to include the exam when there is one — with headroom, so the exam
  // line lands inside the plot rather than flush against its right edge.
  const end = Math.max(lastReview + span, examAt ? examAt + span * 0.18 : 0, Date.now())

  const x = (t: number) => PAD.left + ((t - firstReview) / (end - firstReview)) * (W - PAD.left - PAD.right)
  const y = (r: number) => H - PAD.bottom - r * (H - PAD.bottom - PAD.top)
  const path = (points: Array<{ t: number; retention: number }>) =>
    points.map((point) => `${x(point.t).toFixed(1)},${y(point.retention).toFixed(1)}`).join(' ')

  const history = historySegments(reviews)
  const projection = projectionSegment(reviews, end)
  const gaps = reviewGapsInDays(stamps)
  // Measured from the state the last review left, not from today's drifted value.
  const governing = stateAfterLastReview(reviews)
  const reading = examAt && governing ? examDayReading(governing, examAt) : null

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <header className="mb-1">
        <h3 className="font-display text-base font-extrabold">Will I still know this on exam day?</h3>
        <p className="text-xs font-semibold text-muted-foreground">
          {topic.title} · every review resets you to 100%, and each reset slows the next fall.
        </p>
      </header>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-auto w-full" role="img" aria-labelledby={titleId}>
        <title id={titleId}>
          Retention for {topic.title}. {reviews.length} reviews, each resetting retention to 100 percent.
          History is solid; the projection after the last review is dashed.
          {reading ? ` Projected ${Math.round(reading.retention * 100)} percent on exam day — ${reading.label}.` : ''}
        </title>

        <g stroke="currentColor" className="text-border" strokeWidth={1}>
          {[0, 0.25, 0.5, 0.75, 1].map((r) => <line key={r} x1={PAD.left} y1={y(r)} x2={W - PAD.right} y2={y(r)} />)}
        </g>
        <g className="fill-muted-foreground font-display text-[10px] font-extrabold" textAnchor="end">
          {[0, 0.25, 0.5, 0.75, 1].map((r) => <text key={r} x={PAD.left - 8} y={y(r) + 4}>{r * 100}%</text>)}
        </g>

        {/* Each review snaps retention back to full — the teeth of the sawtooth. */}
        <g className="stroke-success" strokeWidth={2}>
          {stamps.map((at) => <line key={at} x1={x(at)} y1={y(1)} x2={x(at)} y2={y(0)} opacity={0.35} />)}
        </g>

        {/* HISTORY — solid, never dashed. */}
        <g fill="none" className="stroke-primary" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round">
          {history.map((segment) => <polyline key={segment.from} points={path(segment.points)} />)}
        </g>

        {/* PROJECTION — dashed, beginning exactly at the last real review. */}
        {projection && (
          <polyline
            fill="none" className="stroke-primary" strokeWidth={2.5} strokeDasharray="6 5" opacity={0.9}
            strokeLinejoin="round" strokeLinecap="round" points={path(projection.points)}
            data-testid="projection"
          />
        )}

        {reading && examAt && (
          <g>
            <line x1={x(examAt)} y1={y(1) - 6} x2={x(examAt)} y2={y(0)} className="stroke-warning" strokeWidth={2} strokeDasharray="5 4" />
            <circle cx={x(examAt)} cy={y(reading.retention)} r={5} className="fill-warning stroke-card" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* C1: figure and reading are one block. Never one without the other. */}
      {reading && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl border border-warning/40 bg-warning/8 px-3 py-2">
          <span className="font-display text-lg font-extrabold tabular-nums text-warning">≈{Math.round(reading.retention * 100)}%</span>
          <span className="text-xs font-extrabold text-muted-foreground">on exam day</span>
          <span className="font-display text-sm font-extrabold">{reading.label}</span>
          {reading.clause && <span className="text-xs font-semibold text-muted-foreground">— {reading.clause}</span>}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="inline-block h-0 w-6 border-t-[2.5px] border-primary" aria-hidden="true" />History</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-0 w-6 border-t-[2.5px] border-dashed border-primary" aria-hidden="true" />Projection</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-4 w-0 border-l-2 border-success" aria-hidden="true" />A review</span>
        {exam && <span className="flex items-center gap-1.5"><i className="inline-block h-4 w-0 border-l-2 border-dashed border-warning" aria-hidden="true" />Exam day</span>}
      </div>

      {/* The legend is always present, in plain language — this is a teaching artifact. */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          ['Each review resets you to 100%', 'Retrieving it successfully puts the memory back at full strength.'],
          ['Every reset slows the next fall', 'That is why the curve flattens each time, and why the gaps can widen.'],
          ['Reviews land just before you’d forget', 'Earlier wastes the effort. Later loses the memory.'],
        ].map(([title, detail]) => (
          <div key={title} className="rounded-xl border border-border bg-muted p-2.5">
            <p className="font-display text-xs font-extrabold">{title}</p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>

      {gaps.length > 0 && (
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          Your gaps so far: <b className="font-display tabular-nums text-primary">{gaps.join(' → ')}</b> days.
          Computed on this device from your own review log — no model call.
        </p>
      )}
    </section>
  )
}

/** §4.1-L: one review is a dot, not a curve. Nothing is drawn rather than something invented. */
function ThinHistory({ topic, reviewCount }: { topic: Topic; reviewCount: number }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-muted p-6 text-center">
      <div className="mb-3 flex justify-center gap-1.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-primary" />
        <span className={reviewCount >= 1 ? 'size-2.5 rounded-full border-[1.5px] border-border' : 'size-2.5 rounded-full border-[1.5px] border-border'} />
      </div>
      <p className="font-display text-base font-extrabold">
        {reviewCount === 1 ? 'One review down. Come back after the next one.' : 'No reviews yet.'}
      </p>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold text-muted-foreground">
        A forgetting curve needs at least two reviews — the second is what shows how fast the first faded, and that
        is the whole shape. With one point there is nothing honest to draw, so nothing is drawn.
      </p>
      <Button asChild className="mt-3">
        <Link to={`/academics/review/${topic.courseId}?topicId=${topic.id}`}>Review it now</Link>
      </Button>
    </section>
  )
}

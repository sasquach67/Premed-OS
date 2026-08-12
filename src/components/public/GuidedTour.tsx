/* ============================================================
   GuidedTour — annotated screenshots, one per tab, Overview first
   because it is home and it is the tab that explains the others.

   ⚠ THE MASCOT IS NOT A RAM. `05-public-and-account.md` §6.1 forbids ram
   or Rameses imagery outright and states that root `CLAUDE.md`'s "Ram
   mascot" line is stale. The guide here is a Ghibli-adjacent DOCTOR
   character — stethoscope, coat, no horns — and it must stay visibly
   unrelated to any university mascot.

   `src/components/mascot/Ram.tsx` exists in this repo and renders
   `/art/mascot.gif`. It is deliberately NOT used here; see the P1 report.

   The guide is an ILLUSTRATION and never a UI icon: it stands beside a
   callout, and the pulsing pin — not the character — marks the region.
   It is calm here. A tour is explanation, not a milestone, so there is no
   confetti and no cheering copy (04's celebration rule).

   Callout coordinates are per-screenshot and have to be redone whenever a
   screenshot is retaken. That cost was accepted (decisions §4e).
   ============================================================ */
import { useEffect, useRef, useState, type UIEvent } from 'react'
import { PublicHeadline } from '@/components/public/PublicHeadline'

/* ⭐ Aug 2026 (Andy) — the guide is the REAL mascot art at /art/mascot.gif,
   not the placeholder silhouette that shipped first.

   ⚠️ Recorded because it cuts against a written rule: `05` §6.1 bans ram
   imagery on the public layer, and this asset is the existing mascot. Andy
   asked for it by name ("that Ghibli template that was already in one of
   the files"). If the art is ever confirmed to read as a university mascot,
   this is the line to revisit — not the tour itself.

   Still an ILLUSTRATION, never a UI icon: it stands beside a callout, and
   the pulsing pin marks the region. Calm here — a tour is explanation. */
function GuideFigure() {
  return (
    <span className="pl-guide" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}art/mascot.gif`} alt="" width={40} height={40} />
    </span>
  )
}


interface TourCue {
  /** Position in this rendered tour page, from top (0) to bottom (1). */
  threshold: number
  lead: string
  body: string
}

interface TourStep {
  tab: string
  /** Captured from the working local product with demo data — never an
   *  illustration, device frame, or token-only reconstruction. */
  shot: string
  alt: string
  cues: TourCue[]
}

const STEPS: TourStep[] = [
  {
    tab: 'Overview',
    shot: `${import.meta.env.BASE_URL}art/tour/overview.png`,
    alt: 'The Overview tab, populated with demo data',
    cues: [
      {
        threshold: 0,
        lead: 'Start here.',
        body: 'Overview is everything that needs you today, pulled from every tab.',
      },
      {
        threshold: 0.42,
        lead: 'Your day, at a glance.',
        body: 'The schedule stays visible beside the one thing happening now.',
      },
      {
        threshold: 0.76,
        lead: 'What matters next.',
        body: 'A small, explainable set of next actions—not another dashboard to maintain.',
      },
    ],
  },
  {
    tab: 'Academics · Daily',
    shot: `${import.meta.env.BASE_URL}art/tour/academics-daily.png`,
    alt: 'The Academics Daily view, populated with demo data',
    cues: [
      {
        threshold: 0,
        lead: 'One calm daily view.',
        body: 'Classes, assignments, and the study loop share the same academic home.',
      },
      {
        threshold: 0.56,
        lead: 'Heads up, with a reason.',
        body: 'Useful prompts say why they appeared and point to the next small action.',
      },
    ],
  },
  {
    tab: 'Academics · Planning',
    shot: `${import.meta.env.BASE_URL}art/tour/academics-planning.png`,
    alt: 'The Academics Planning view, populated with demo data',
    cues: [
      {
        threshold: 0,
        lead: 'AMCAS GPA, clearly separated.',
        body: 'Cumulative, science, and all-other coursework stay legible without collapsing into one score.',
      },
      {
        threshold: 0.56,
        lead: 'What-if stays hypothetical.',
        body: 'Test a future grade without confusing a projection for your actual record.',
      },
    ],
  },
]

export function GuidedTour() {
  const [active, setActive] = useState(0)
  const [activeCue, setActiveCue] = useState(0)
  const [progress, setProgress] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const step = STEPS[active]
  const cue = step.cues[activeCue]

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setActiveCue(0)
    setProgress(0)
  }, [active])

  function chooseStep(index: number) {
    setActive(index)
  }

  function updateTourPosition(event: UIEvent<HTMLDivElement>) {
    const viewport = event.currentTarget
    const maxScroll = viewport.scrollHeight - viewport.clientHeight
    const nextProgress = maxScroll > 0 ? viewport.scrollTop / maxScroll : 0
    setProgress(nextProgress)
    let nextCue = 0
    step.cues.forEach((item, index) => {
      if (nextProgress >= item.threshold) nextCue = index
    })
    setActiveCue(nextCue)
  }

  return (
    <section className="pl-tour" aria-labelledby="tour-heading">
      <div className="pl-tourin pl-reveal">
        <span className="pl-eyebrow pl-eyebrow-solid">A look inside</span>
        <PublicHeadline
          id="tour-heading"
          setup="This is what it looks like"
          payoff="when it's yours."
          size="section"
          tone="page"
        />

        <div className="pl-tourtabs" role="tablist" aria-label="Tour steps">
          {STEPS.map((s, i) => (
            <button
              key={s.tab}
              type="button"
              role="tab"
              className="pl-ttab"
              aria-selected={i === active}
              onClick={() => chooseStep(i)}
            >
              {s.tab}
            </button>
          ))}
        </div>

        <div className="pl-shotstage pl-reveal">
          <div
            ref={viewportRef}
            className="pl-shotwin pl-tourviewport"
            tabIndex={0}
            role="region"
            aria-label={`${step.tab} guided preview. Scroll to continue the walkthrough.`}
            onScroll={updateTourPosition}
          >
            <div className="pl-tourimage">
              <img src={step.shot} alt={step.alt} />
            </div>
          </div>
          <div className="pl-tourcoach" key={`${step.tab}-${cue.lead}`} aria-live="polite">
            <GuideFigure />
            <div className="pl-bubble">
              <b>{cue.lead}</b> {cue.body}
            </div>
          </div>
          <div className="pl-tourprogress" aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(0.08, progress)})` }} /></div>
        </div>

        {/* Without this line the first empty session reads as a bug. */}
        <p className="pl-tourfoot">
          Demo data. Your workspace starts empty, and stays on your device until you say otherwise.
        </p>
      </div>
    </section>
  )
}

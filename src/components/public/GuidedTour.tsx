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
import { useState } from 'react'
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


/* ⭐ Aug 2026 (Andy: "can you actually render something there?") — the shot
   window used to hold a line of text saying a screenshot was missing, which
   was honest and looked like a bug.

   This renders a SIMPLIFIED VIEW OF THE REAL INTERFACE from the app's own
   tokens. It is deliberately NOT dressed up as a photograph: no browser
   chrome, no device frame, no blur. It is a diagram of the layout, and it is
   labelled as a preview.

   ⚠️ It does NOT satisfy the "real screenshots with demo data" requirement
   (P1 §4.4) — that item stays open until actual captures exist. This is a
   better placeholder, not the deliverable. */
function TourPreview({ tab }: { tab: string }) {
  const NAV = ['Overview', 'Academics', 'MCAT', 'Clinical', 'Volunteering', 'Research']
  const STATS = [
    { k: 'AMCAS GPA', v: '3.71', c: 'var(--cat-gpa)' },
    { k: 'Clinical hours', v: '146', c: 'var(--cat-clinical)' },
    { k: 'Weeks to MCAT', v: '31', c: 'var(--cat-mcat)' },
  ]
  const ROWS = [
    { t: 'CHEM 262 · Problem set 7', m: 'due tomorrow', c: 'var(--cat-gpa)' },
    { t: 'Review: amino acid side chains', m: '12 topics due', c: 'var(--cat-mcat)' },
    { t: 'Carolina ED · Thursday shift', m: '4 hrs, unlogged', c: 'var(--cat-clinical)' },
  ]
  return (
    <div className="pl-prev" aria-hidden="true">
      <aside className="pl-prev-nav">
        <span className="pl-prev-brand">Premed OS</span>
        {NAV.map((n) => (
          <span key={n} className={`pl-prev-navlk${n === tab ? ' on' : ''}`}>
            {n}
          </span>
        ))}
      </aside>
      <div className="pl-prev-main">
        <div className="pl-prev-hd">
          <span className="pl-prev-h">Good to see you again, Andy</span>
          <span className="pl-prev-chip">Tuesday · week 6</span>
        </div>
        <div className="pl-prev-stats">
          {STATS.map((st) => (
            <div key={st.k} className="pl-prev-stat" style={{ ['--c' as string]: st.c }}>
              <span className="pl-prev-k">{st.k}</span>
              <span className="pl-prev-v">{st.v}</span>
            </div>
          ))}
        </div>
        <div className="pl-prev-list">
          {ROWS.map((r) => (
            <div key={r.t} className="pl-prev-row">
              <i style={{ ['--c' as string]: r.c }} />
              <span className="pl-prev-t">{r.t}</span>
              <span className="pl-prev-m">{r.m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Callout {
  /** Where the pulsing pin sits, as CSS percentages. */
  pin: { left: string; top: string }
  /** Where the bubble sits. */
  at: React.CSSProperties
  lead: string
  body: string
}

interface TourStep {
  tab: string
  /** Real screenshot with demo data — never an illustration of an
   *  interface, never a laptop device frame, never a blurred fake. */
  shot?: string
  alt: string
  callouts: Callout[]
}

const STEPS: TourStep[] = [
  {
    tab: 'Overview',
    alt: 'The Overview tab, populated with demo data',
    callouts: [
      {
        pin: { left: '16%', top: '20%' },
        at: { left: '5%', top: '26%' },
        lead: 'Start here.',
        body: 'Overview is everything that needs you today, pulled from every tab.',
      },
      {
        pin: { left: '52%', top: '15%' },
        at: { left: '41%', top: '21%' },
        lead: 'Where you stand.',
        body: "GPA, hours and practice scores, live, with the AMCAS number beside your school's.",
      },
      {
        pin: { left: '81%', top: '47%' },
        at: { right: '4%', top: '53%' },
        lead: "Today's plan.",
        body: 'Built from one hour budget shared across classes and MCAT prep, so it actually fits.',
      },
      {
        pin: { left: '26%', top: '75%' },
        at: { left: '13%', top: '81%' },
        lead: 'The bell is quiet.',
        body: 'Three interruptions a week, maximum. Everything else waits until you look.',
      },
    ],
  },
  {
    tab: 'Academics',
    alt: 'The Academics tab, populated with demo data',
    callouts: [
      {
        pin: { left: '20%', top: '22%' },
        at: { left: '6%', top: '28%' },
        lead: 'AMCAS GPA math.',
        body: 'BCPM is classified per course, and the number beside it is the one AMCAS will compute.',
      },
      {
        pin: { left: '68%', top: '38%' },
        at: { right: '5%', top: '44%' },
        lead: 'One class, one hub.',
        body: 'Syllabus, assignments, topics, files and the people who teach it, in one place.',
      },
    ],
  },
  {
    tab: 'MCAT',
    alt: 'The MCAT tab, populated with demo data',
    callouts: [
      {
        pin: { left: '24%', top: '26%' },
        at: { left: '8%', top: '32%' },
        lead: 'Your own mistakes.',
        body: 'Every missed question becomes a drill, tagged by why you missed it rather than by topic alone.',
      },
      {
        pin: { left: '70%', top: '60%' },
        at: { right: '5%', top: '66%' },
        lead: 'Before the exam.',
        body: "What you learned two years ago decays. HQ schedules it back before it costs you a point.",
      },
    ],
  },
  {
    tab: 'Clinical',
    alt: 'The Clinical tab, populated with demo data',
    callouts: [
      {
        pin: { left: '18%', top: '24%' },
        at: { left: '5%', top: '30%' },
        lead: 'Hours that hold up.',
        body: 'Each shift carries its site, its supervisor and its dates, so verification is already done.',
      },
      {
        pin: { left: '64%', top: '55%' },
        at: { right: '6%', top: '61%' },
        lead: 'Written while you remember it.',
        body: 'A reflection prompt after a shift beats reconstructing eighteen months of them in June.',
      },
    ],
  },
]

export function GuidedTour() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]

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
              onClick={() => setActive(i)}
            >
              {s.tab}
            </button>
          ))}
        </div>

        <div className="pl-shotstage pl-reveal">
          <div className="pl-shotwin">
            {step.shot ? (
              <img src={step.shot} alt={step.alt} />
            ) : (
              <TourPreview tab={step.tab} />
            )}
          </div>

          {step.callouts.map((c) => (
            <span key={`pin-${c.lead}`} className="pl-pin" style={c.pin} aria-hidden="true" />
          ))}
          {step.callouts.map((c) => (
            <div key={c.lead} className="pl-call" style={c.at}>
              <GuideFigure />
              <div className="pl-bubble">
                <b>{c.lead}</b> {c.body}
              </div>
            </div>
          ))}
        </div>

        {/* Without this line the first empty session reads as a bug. */}
        <p className="pl-tourfoot">
          Demo data. Your workspace starts empty, and stays on your device until you say otherwise.
        </p>
      </div>
    </section>
  )
}

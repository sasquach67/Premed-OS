/* ============================================================
   Landing — one page, not a marketing site (05 §1).

   Hero → Features → Guided tour → three specifics → About → privacy and
   cost → footer.

   The copy is SETTLED (decisions file, Aug 2026) and every rejected
   wording is recorded there with its reason. Do not "improve" a string on
   this page without reading that file first — several of these sentences
   are the third or fourth attempt.

   Three constraints that are easy to break by accident:
     • `Sign up` appears NOWHERE. `Start tracking` is primary everywhere.
     • The no-account line must be visible WITHOUT SCROLLING, because it
       is the thing that stops a bounce.
     • Glass stops at the bottom of the Features section. Everything below
       is solid-with-depth.
   ============================================================ */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight, CalendarDays, ClipboardCheck, FileText, GraduationCap,
  History, LayoutGrid, MessagesSquare, Repeat, Shield, Unplug,
} from 'lucide-react'
import { PublicShell } from '@/components/public/PublicShell'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicHeadline } from '@/components/public/PublicHeadline'
import { GlassSurface } from '@/components/public/GlassSurface'
import { GuidedTour } from '@/components/public/GuidedTour'
import { useEnterApp } from '@/components/public/useEnterApp'

/* All ten capabilities. Breadth IS the pitch, and prose cannot carry ten
   items (decisions §4b, which REVERSES the earlier "no feature grid" rule).

   HARD LIMITS: lucide outlines, never emoji. TITLES ONLY — the moment a
   tile grows a description sentence it has become the generic SaaS grid
   this page rejects, and the reversal above no longer covers it.
   NO PILLAR LABELS — the colour tint carries the grouping, because a
   visitor doesn't know HQ's pillar names yet (decisions §4d). */
const TILES = [
  {
    icon: LayoutGrid,
    title: 'Every part of the application, one place',
    tint: 'var(--cat-gpa)',
    example:
      'Classes, grades, MCAT prep, clinical and volunteer hours, shadowing, research, extracurriculars, letters, essays, school list. One record set, so the parts can read each other.',
  },
  {
    icon: FileText,
    title: 'Upload a syllabus, get your semester',
    tint: 'var(--cat-gpa)',
    example:
      'Drop in the CHEM 262 syllabus and the semester builds itself: units, due dates, exam dates, grading weights, late policy. One person in your section uploads it and everyone else imports the same structure.',
  },
  {
    icon: Repeat,
    title: 'Study sessions with spaced repetition',
    tint: 'var(--cat-gpa)',
    example:
      'A session knows which topics are due, times itself, and logs the hours as you work. Your misses become tagged cards you export to Anki in one click — HQ never becomes a second flashcard app.',
  },
  {
    icon: CalendarDays,
    title: 'One weekly plan across classes and MCAT',
    tint: 'var(--cat-volunteer)',
    example:
      "Two study plans that each look reasonable add up to 34 hours a week. HQ builds both against the same calendar and says so before you commit. Miss a week and the plan reflows instead of becoming a backlog.",
  },
  {
    icon: History,
    title: "Flags what you've forgotten before the exam",
    tint: 'var(--cat-mcat)',
    example:
      "You took psych freshman year and sit the MCAT in 2029. HQ models what you'll be relearning from zero, weighted by how much of the exam it actually is, and schedules it back before it costs you.",
  },
  {
    icon: GraduationCap,
    title: 'UNC graduation and major requirements',
    tint: 'var(--cat-gpa)',
    example:
      'Every requirement, what satisfies it, and what a course you are about to drop would break. Prereq order, term load, and the withdrawal deadline you did not know was this week.',
  },
  {
    icon: ClipboardCheck,
    title: 'Everything logged AMCAS-ready',
    tint: 'var(--cat-letters)',
    example:
      'Course titles exactly as the transcript prints them, hours by activity, verifiers attached. When the cycle opens you export it instead of reconstructing three years from memory.',
  },
  // The ONE marker on the grid, and it is an honesty gate rather than
  // decoration: Atlas is a placeholder route (00 §2.1). Do not remove
  // this until Atlas actually ships.
  {
    icon: MessagesSquare,
    title: 'Advice from people ahead of you',
    tint: '#e7b06a',
    soon: true,
    example:
      'What pre-meds, med students and physicians actually say, attributed and dated, never presented as fact. Plus a place to keep the twenty minutes an M2 gave you over coffee.',
  },
  // Names Canvas and says NOTHING about grades — only the calendar-feed
  // path exists (integration-map §2). Do not add a grades claim here.
  {
    icon: Unplug,
    title: 'Google Calendar, Canvas, Drive, dictation',
    tint: 'var(--cat-research)',
    example:
      'Canvas due dates arrive through your calendar feed. Drive holds the files. Dictate into any field with the tools you already use. Nothing here asks you to move house.',
  },
  {
    icon: Shield,
    title: 'Works signed out. Your data stays yours.',
    tint: 'var(--cat-clinical)',
    example:
      'The whole app runs with no account, stored in your browser. An account adds sync across devices and nothing else. Export any time, delete in one action, no third-party analytics.',
  },
] as const

export function Landing() {
  const enterApp = useEnterApp()
  const location = useLocation()

  /* ⭐ Aug 2026 (Andy) — the three pitch cards are GONE. Their job now
     belongs to the tiles: open one and it shows how that feature actually
     works, in place. Three cards could only ever explain three of ten, and
     they sat far below the grid they were explaining.
     Titles-only still holds on the CLOSED tile — the example appears on
     interaction, so the grid at rest is exactly what it was. */
  const [openTile, setOpenTile] = useState<string | null>(null)

  // `Features` in the nav navigates home first when the visitor is on a
  // doc page; the section only exists once this component has mounted.
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (!target) return
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.state])

  return (
    <PublicShell title="Premed HQ — your whole pre-med application, in one place">
      {/* ── HERO: five elements, full stop ─────────────────────────────── */}
      <section className="pl-hero">

        <PublicNav />

        <div className="pl-hero-in">
          {/* 1 · badge — beta status is STATED, not implied */}
          <GlassSurface pill refract className="pl-chip pl-an pl-an2" as="span">
            <span className="tagpill">Beta</span> Built for UNC pre-meds
          </GlassSurface>

          {/* 2 · the two-weight headline */}
          <PublicHeadline
            as="h1"
            size="hero"
            className="pl-an pl-an3"
            setup="Stop tracking your pre-med application"
            payoff="in a spreadsheet."
          />

          {/* 3 · ONE line, and it stays one line */}
          <p className="pl-lede pl-an pl-an4">
            Everything from your first semester to the day you submit.
          </p>

          {/* 4 · two buttons. Primary is Start tracking — never Sign up. */}
          <div className="pl-ctarow pl-an pl-an5">
            <button type="button" className="pl-btn pl-btn-solid" onClick={enterApp}>
              Start tracking
              <ArrowRight />
            </button>
            <Link to="/auth" className="pl-btn pl-btn-ghost">
              Sign in
            </Link>
          </div>

          {/* 5 · the local-first promise, above the fold, verbatim */}
          <p className="pl-noacct pl-an pl-an5">
            No account needed. Your data stays on this device until you choose to sync it.
          </p>

          {/* 05 §6.1 requires this in the HERO REGION, not only the footer. */}
          <p className="pl-disc pl-an pl-an5">
            An independent student project. Not affiliated with UNC-Chapel Hill or the AAMC.
          </p>
        </div>
      </section>

      {/* ── FEATURES: ten glass tiles ──────────────────────────────────── */}
      <section className="pl-feat" id="features" aria-labelledby="features-heading">
        <div className="pl-featin pl-reveal">
          <GlassSurface pill refract className="pl-eyebrow" as="span">
            Features
          </GlassSurface>
          <PublicHeadline
            id="features-heading"
            size="section"
            setup="Ten things it does that"
            payoff="a spreadsheet can't."
          />
          <p className="pl-feats">
            Every part of the application, in one system that can read across all of it.
          </p>

          <ul className="pl-ftiles pl-stagger pl-reveal">
            {TILES.map((tile) => {
              const Icon = tile.icon
              const isOpen = openTile === tile.title
              return (
                <li key={tile.title} className="pl-ftwrap">
                  <button
                    type="button"
                    className={`pl-ftile${'soon' in tile && tile.soon ? ' pl-ftile-soon' : ''}${isOpen ? ' is-open' : ''}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenTile(isOpen ? null : tile.title)}
                  >
                    {'soon' in tile && tile.soon ? <span className="pl-soonmark">Soon</span> : null}
                    <div className="pl-ficon" style={{ ['--c' as string]: tile.tint }}>
                      <Icon aria-hidden="true" />
                    </div>
                    <div className="pl-ftl">{tile.title}</div>
                    <span className="pl-fthint" aria-hidden="true">
                      {isOpen ? 'Close' : 'See how'}
                    </span>
                  </button>
                  {isOpen ? (
                    <p className="pl-ftex" style={{ ['--c' as string]: tile.tint }}>
                      {tile.example}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── GUIDED TOUR ────────────────────────────────────────────────── */}
      <GuidedTour />

      {/* ── Below here: SOLID with depth. No glass past this line. ─────── */}
      <div className="pl-body">
        <div className="pl-bento pl-stagger pl-reveal">
          {/* The three pitch cards lived here and were REMOVED (Andy, Aug
              2026) — the tiles now carry the examples. The About card was
              removed with them: /about holds the note, and repeating it
              here made the landing page end on a second, thinner copy.
              Do not reinstate either without reading decisions §4c. */}

          <article className="pl-card pl-c7">
            <div className="pl-hd">
              <h2 className="pl-ti pl-ti-sm">Your grades don't leave your device unless you ask</h2>
            </div>
            <div className="pl-bd">
              <p className="pl-privtext">
                <b>HQ is local-first.</b> Everything works signed out, stored in your browser. An
                account adds sync across devices — nothing more. AI features send only what they
                need, we name every processor that receives anything, and there's a local-only path
                for the parts you'd rather keep offline. <b>No third-party analytics. No ad tech.
                Your data is never sold.</b>
              </p>
              <Link className="pl-lk" to="/privacy">
                Read the privacy policy →
              </Link>
            </div>
          </article>

          <article className="pl-card pl-c5">
            <div className="pl-hd">
              <h2 className="pl-ti pl-ti-sm">What it costs</h2>
            </div>
            <div className="pl-bd">
              <div className="pl-costbig">Free</div>
              <p className="pl-privtext" style={{ fontSize: 13 }}>
                Free during public beta. If that changes you'll know well before it does — and you
                can export everything, always.
              </p>
              <Link className="pl-lk" to="/pricing">
                What happens after beta →
              </Link>
            </div>
          </article>
        </div>
      </div>
    </PublicShell>
  )
}

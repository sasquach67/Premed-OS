/* ============================================================
   Landing — one page, not a marketing site (05 §1).

   Hero → Features → Guided tour → three specifics → About → privacy and
   cost → footer.

   The copy is SETTLED (decisions file, Aug 2026) and every rejected
   wording is recorded there with its reason. Do not "improve" a string on
   this page without reading that file first — several of these sentences
   are the third or fourth attempt.

   Three constraints that are easy to break by accident:
     • `Get started` opens account access; guest mode is always explicitly
       secondary, so the local-only path is never confused with sync.
     • The account/local-storage line must be visible WITHOUT SCROLLING.
     • Glass stops at the bottom of the Features section. Everything below
       is solid-with-depth.
   ============================================================ */
import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight, BookOpenText, CalendarDays, ChevronDown, ClipboardCheck, FileText,
  GraduationCap, LayoutGrid, MessagesSquare, Shield, TrendingUp, Unplug,
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
   visitor doesn't know Premed OS's pillar names yet (decisions §4d). */
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
    icon: TrendingUp,
    title: 'Your real GPA, always current',
    tint: 'var(--cat-gpa)',
    example:
      'Log courses, grades, and prior credit once. Keep your cumulative and science GPA distinct, with the exact course record behind every number.',
  },
  {
    icon: CalendarDays,
    title: 'One weekly plan across classes and MCAT',
    tint: 'var(--cat-volunteer)',
    example:
      "Two study plans that each look reasonable add up to 34 hours a week. Premed OS builds both against the same calendar and says so before you commit. Miss a week and the plan reflows instead of becoming a backlog.",
  },
  {
    icon: BookOpenText,
    title: 'Capture stories before you need them',
    tint: 'var(--cat-mcat)',
    example:
      'Save the clinical moment, mentor advice, or hard-earned lesson while it is still specific. Tag it now; find it when you write a personal statement or prepare for an interview.',
  },
  {
    icon: GraduationCap,
    title: 'Plan a UNC course path with sources',
    tint: 'var(--cat-gpa)',
    example:
      'See published course details and prerequisite context beside the plan you are building. It helps you explore options; ConnectCarolina remains your official degree audit.',
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
    title: 'Google Calendar, Drive backup, dictation',
    tint: 'var(--cat-research)',
    example:
      'Canvas can publish due dates to your calendar feed. Connect Google Calendar to view your primary calendar; Drive backup and dictation stay optional.',
  },
  {
    icon: Shield,
    title: 'Start locally. Your data stays yours.',
    tint: 'var(--cat-clinical)',
    example:
      'Track locally in your browser. Sign in to sync across devices or use server-side AI study tools. Export any time and delete account data yourself.',
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

  // A browser will otherwise restore its last document position on refresh,
  // which can reopen the landing page halfway down at Features. The landing
  // page is a front door: every fresh load starts at its hero. Explicit
  // section navigation below still runs afterwards when it was requested.
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  // `Features` in the nav navigates home first when the visitor is on a
  // doc page; the section only exists once this component has mounted.
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (!target) return
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.state])

  return (
    <PublicShell title="Premed OS — your whole pre-med application, in one place">
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

          {/* 4 · Account access leads; guest mode is available but visibly
              secondary. */}
          <div className="pl-ctarow pl-an pl-an5">
            <Link to="/auth" className="pl-btn pl-btn-solid pl-btn-lg">
              Get started
              <ArrowRight className="pl-arw" />
            </Link>
            <button type="button" className="pl-btn pl-btn-ghost pl-btn-lg" onClick={enterApp}>
              Continue as guest
            </button>
          </div>

          {/* 5 · Make the storage boundary plain before anyone chooses a
              path: an account syncs; guest work remains on this device. */}
          <p className="pl-finerow pl-an pl-an5">
            <span>Create an account to sync across devices. Guest work stays in this browser.</span>
            <span className="sep" aria-hidden="true">·</span>
            <span className="ind">
              An independent student project. Not affiliated with UNC-Chapel Hill or the AAMC.
            </span>
          </p>
        </div>

        {/* The hero owns the whole first screen, so it has to say there is
            more. Last child of the 100svh hero, `flex: none`, so it lands
            just inside the fold — and it is the canary for §6: if this is
            not visible on load, the nav has been lifted out of the hero. */}
        <div className="pl-cue" aria-hidden="true">
          <span>
            Scroll
            <ChevronDown />
          </span>
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
                <b>Premed OS is local-first.</b> Everything works signed out, stored in your browser. An
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

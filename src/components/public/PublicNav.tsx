/* ============================================================
   PublicNav — three floating islands. ONE component, all public routes.

   Brand · a glass pill of links · the CTA. Three separate elements, NOT
   one merged rail — merging was proposed and rejected (`public-landing-v2.md`
   §2). The islands are the design; placement was the defect.

   ⚠️ THE PLACEMENT BUG, so it is not reintroduced: `justify-content:
   space-between` across three children centres the middle one BETWEEN ITS
   NEIGHBOURS, not on the page. `premedOS` and `Get started ↗` are
   different widths, so the pill sat off-centre by half that difference —
   and because the error is a fraction of the leftover space, it GREW as
   the viewport widened. Fine in a small window, visibly wrong at full
   screen. The fix is a `1fr auto 1fr` grid in the stylesheet, which forces
   the side columns equal. Do not reintroduce flex here.

   ⚠️ THE PILL HOLDS THE FIVE LINKS AND NOTHING ELSE. Sign out goes in the
   right-hand column beside the CTA — never inside the pill, and never with
   an inline `marginLeft: auto`, which breaks the grid distribution
   entirely.

   ⚠️ THIS COMPONENT RENDERS INSIDE `.pl-hero`, not above it. `.pl-hero` is
   `100svh`; as a sibling, the nav pushes the hero's scroll cue below the
   fold by exactly its own height, silently. See `public-layer.css` §Hero.

   **No nav item anywhere goes nowhere** (P1 §10). `Features` scrolls the
   landing page's Features section into view, navigating home first when
   the visitor is on a doc page. Every other item is a real route.
   ============================================================ */
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Wordmark } from '@/components/public/Wordmark'
import { supabase } from '@/lib/supabase'
import { activateGuestWorkspace } from '@/store/store'

interface NavLink {
  label: string
  to: string
  /** Set when the target is a section of the landing page, not a route. */
  section?: string
}

const LINKS: NavLink[] = [
  { label: 'Features', to: '/landing', section: 'features' },
  { label: 'About', to: '/about' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
]

export function PublicNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  /* Sign-out lives here as well as in the app sidebar and `/auth`. Every
     other control was behind the very session someone would be trying to
     leave, so a public page that cannot end a session is a dead end. */
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    if (!supabase) return
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setSignedIn(Boolean(data.session?.user))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (alive) setSignedIn(Boolean(session?.user))
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const goToFeatures = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const scroll = () =>
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (pathname === '/' || pathname === '/landing') scroll()
      // Landing has to mount before the section exists to scroll to.
      else navigate('/landing', { state: { scrollTo: 'features' } })
    },
    [pathname, navigate],
  )

  return (
    <div className="pl-navwrap">
      <div className="pl-navbar pl-an pl-an1">
        <Wordmark className="pl-navbrand" />

        <nav className="pl-navpill" aria-label="Public pages">
          {LINKS.map((link) =>
            link.section ? (
              <a key={link.label} href="#/landing" className="pl-navlk" onClick={goToFeatures}>
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className="pl-navlk"
                aria-current={pathname === link.to ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="pl-navend">
          {signedIn ? (
            <button
              type="button"
              className="pl-navlk"
              onClick={() => {
                if (!window.confirm('Sign out of Premed OS? Your account data will stay saved.')) return
                void supabase?.auth.signOut().then(() => activateGuestWorkspace())
              }}
            >
              Sign out
            </button>
          ) : null}

          <Link to="/auth" className="pl-btn pl-btn-tint">
            Get started
            <ArrowUpRight className="pl-arw" />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   PublicNav — the floating pill nav. ONE component, all seven routes.

   Not a solid top bar: a brand on the left, a glass pill of text links in
   the centre, and the gooey CTA on the right (P1 §4.1). The gooey filter
   fuses the label pill and the arrow pill mid-slide so there is no seam.

   PILL RADIUS IS PUBLIC-LAYER ONLY (P1 §3). In-app buttons keep the 10px
   system radius; this must not leak past `/` and `/auth*`.

   **No nav item anywhere goes nowhere** (P1 §10). `Features` scrolls the
   landing page's Features section into view, navigating home first when
   the visitor is on a doc page. Every other item is a real route.
   ============================================================ */
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useEnterApp } from '@/components/public/useEnterApp'
import { supabase } from '@/lib/supabase'

interface NavLink {
  label: string
  to: string
  /** Set when the target is a section of the landing page rather than a
   *  route of its own. */
  section?: string
}

const LINKS: NavLink[] = [
  { label: 'Features', to: '/', section: 'features' },
  { label: 'About', to: '/about' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
]

export function PublicNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const enterApp = useEnterApp()

  /* ⭐ Aug 2026 — sign-out lives HERE too, not only in the app sidebar and
     `/auth`. Andy could not sign out to re-test the sign-in flow, because
     every existing control was behind the very session he was trying to
     leave. A public page that cannot end a session is a dead end. */
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
      if (pathname === '/') scroll()
      // Landing has to mount before the section exists to scroll to.
      else navigate('/', { state: { scrollTo: 'features' } })
    },
    [pathname, navigate],
  )

  return (
    <div className="pl-navwrap">
      <div className="pl-navbar pl-an pl-an1">
        <Link to="/" className="pl-navbrand">
          Premed OS
        </Link>

        <nav className="pl-navpill" aria-label="Public pages">
          {LINKS.map((link) =>
            link.section ? (
              <a key={link.label} href="/" className="pl-navlk" onClick={goToFeatures}>
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

        {signedIn ? (
          <button
            type="button"
            className="pl-navlk"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              void supabase?.auth.signOut()
            }}
          >
            Sign out
          </button>
        ) : null}

        {/* Gooey CTA. Both halves do the same thing, so the arrow is
            decorative to assistive tech and the label carries the name. */}
        <div className="pl-gooey">
          <button type="button" className="lead" onClick={enterApp}>
            Start tracking
          </button>
          <button type="button" className="tail" tabIndex={-1} aria-hidden="true" onClick={enterApp}>
            <ArrowUpRight />
          </button>
        </div>
      </div>
    </div>
  )
}

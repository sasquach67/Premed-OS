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
import { useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useEnterApp } from '@/components/public/useEnterApp'

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
          Premed HQ
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

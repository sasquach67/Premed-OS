/* ============================================================
   PublicFooter — ONE component, every public route.

   ⚠️ THE DISCLAIMER IS SPLIT BY DESIGN, and this is two requirements
   rather than one repeated. The hero carries the ONE-LINE independence
   statement (05 §6.1); this carries the LONG form plus the AAMC line
   (05 §6.2). Removing either because "it already says that" drops a
   requirement.

   ⚠️ NEVER REVEAL-GATED. This footer was given `.pl-reveal` once and its
   required legal lines started at opacity 0, where they could stay if the
   observer never fired for the last element on the page. A required
   disclaimer behind a scroll animation is a compliance problem, not a
   visual one. `.pl-foot` carries `opacity: 1 !important` for exactly that
   reason — do not remove it, and do not add the reveal class here.

   The palette is the product's own and is never described as an
   institutional colour anywhere in this group.
   ============================================================ */
import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/public/Wordmark'

const CONTACT_EMAIL = 'elephon08@gmail.com'

const LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
]

export function PublicFooter() {
  return (
    <footer className="pl-foot">
      <Wordmark small className="pl-footbrand" />

      <div className="pl-footlinks">
        {LINKS.map((link) => (
          <Link key={link.label} className="pl-nlk" to={link.to}>
            {link.label}
          </Link>
        ))}
        <a className="pl-nlk" href={`mailto:${CONTACT_EMAIL}`}>
          Contact
        </a>
      </div>

      <p className="pl-footdisc">
        Premed OS is an independent project. Not affiliated with, endorsed by, or sponsored by the
        University of North Carolina at Chapel Hill, the AAMC, or any other institution. MCAT is a
        program of the AAMC, which does not sponsor or endorse this product.
      </p>
    </footer>
  )
}

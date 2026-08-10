/* ============================================================
   PublicFooter — ONE component, all seven routes.

   Carries the FULL independence disclaimer plus the AAMC line (05 §6.1).
   The hero region states independence too — the footer is the long
   version, never the only version.

   The palette is HQ's own and is never described as an institutional
   colour anywhere in this group.
   ============================================================ */
import { Link } from 'react-router-dom'

const CONTACT_EMAIL = 'elephon08@gmail.com'

export function PublicFooter() {
  return (
    <footer className="pl-foot">
      <div className="fl">
        <Link className="pl-nlk" to="/about">About</Link>
        <Link className="pl-nlk" to="/pricing">Pricing</Link>
        <Link className="pl-nlk" to="/privacy">Privacy</Link>
        <Link className="pl-nlk" to="/terms">Terms</Link>
        <a className="pl-nlk" href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
      </div>
      <p className="fd">
        Premed OS is an independent project. Not affiliated with, endorsed by, or sponsored by the
        University of North Carolina at Chapel Hill, the AAMC, or any other institution. MCAT is a
        program of the AAMC, which does not sponsor or endorse this product.
      </p>
    </footer>
  )
}

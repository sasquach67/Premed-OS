/* ============================================================
   Wordmark — `premed` + blue `OS`, with the four-bar mark.

   ONE component. It appears in the nav, the footer, the auth card, and
   later the app shell; inline nav markup would be copied and would drift,
   which is the same failure the two-weight headline already had once.

   ⚠️ FONTS DO NOT CHANGE. Andy's six references are geometric sans and
   Baloo 2 is rounded. The two-tone FORMAT transfers; the letterforms stay
   warm. Do not substitute a font to match a reference.

   ⚠️ THE LOCKUP'S NAVY IS INVISIBLE HERE. `premed` is `#1E3044` in the
   supplied artwork, which disappears on the public layer's dark field —
   the result reads as a logo that just says `OS`. On this layer the word
   is set in `--pl-fg` and the mark's short bars inherit it through
   `currentColor`, exactly as `public/art/brand/README.md` describes.

   ⚠️ THE TAGLINE IS NOT HERE. "organize. optimize. get ahead." ships with
   the lockup but is not approved copy, and the hero has a settled
   headline. It stays off the landing page (P2 §4).

   The bar geometry is the master asset's, `public/art/brand/premedos-mark.svg`.
   It is inlined rather than loaded through `<img>` because an `<img>`
   cannot inherit `currentColor` — which is the whole reason that file uses
   it. If the mark is ever redrawn, redraw it there and copy the geometry
   across.
   ============================================================ */
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface WordmarkProps {
  /** Render as a link to `/`. Off for the auth card, where it is a label. */
  asLink?: boolean
  /** Slightly smaller — the footer and the auth card. */
  small?: boolean
  className?: string
}

function Mark() {
  return (
    <svg
      className="pl-wm-mark"
      viewBox="0 0 232 142"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* three short bars — inherit the wordmark's colour */}
      <g fill="currentColor">
        <rect x="0" y="110" width="30" height="32" rx="15" opacity="0.42" />
        <rect x="68" y="72" width="30" height="70" rx="15" opacity="0.42" />
        <rect x="136" y="39" width="30" height="103" rx="15" opacity="0.42" />
      </g>
      {/* the tall bar carries the accent — see `_visual-recipes.md` §Two blues */}
      <rect className="pl-wm-accent" x="204" y="0" width="28" height="142" rx="14" />
    </svg>
  )
}

export function Wordmark({ asLink = true, small = false, className }: WordmarkProps) {
  const inner = (
    <>
      <Mark />
      <span>
        <span className="pl-wm-a">premed</span>
        <span className="pl-wm-b">OS</span>
      </span>
    </>
  )

  const classes = cn('pl-wm', small && 'pl-wm-sm', className)

  if (!asLink) {
    return (
      <span className={classes} aria-label="Premed OS">
        {inner}
      </span>
    )
  }

  return (
    <Link to="/" className={classes} aria-label="Premed OS home">
      {inner}
    </Link>
  )
}

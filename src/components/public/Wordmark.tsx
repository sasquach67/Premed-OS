/* ============================================================
   Wordmark — `premed` + blue `OS`, with the four-bar mark.

   ONE component. It appears in the nav, the footer, the auth card, and
   later the app shell; inline nav markup would be copied and would drift,
   which is the same failure the two-weight headline already had once.

   ⚠️ FONTS DO NOT CHANGE. Andy's six references are geometric sans and
   Baloo 2 is rounded. The two-tone FORMAT transfers; the letterforms stay
   warm. Do not substitute a font to match a reference.

   ⚠️ THE MARK GOES ABOVE THE WORD, NOT BESIDE IT. This component used to
   set them inline, which matched nothing in the supplied artwork. Andy,
   Aug 2026: the stack is the logo. In the nav that overhang is absorbed by
   a negative block margin (see `.pl-navbrand`) so the row does not grow —
   do not "fix" the stack back to a row to reclaim the height.

   ⚠️ THE LOCKUP'S NAVY IS INVISIBLE HERE. `premed` is `#132535` in the
   supplied artwork, which disappears on the public layer's dark field —
   the result reads as a logo that just says `OS`. On this layer the word
   is set in `--pl-fg`. The four bars are NOT recoloured: their ramp runs
   light-to-dark and reads on cream and on the dark field alike.

   ⚠️ THE TAGLINE IS NOT HERE. "organize. optimize. get ahead." ships with
   the lockup but is not approved copy, and the hero has a settled
   headline. It stays off the landing page (P2 §4).

   The bar geometry is the master asset's, `public/art/brand/premedos-mark.svg`.
   It is inlined rather than loaded through `<img>` so it scales with the
   type instead of needing a pixel size at every call site. If the mark is
   ever redrawn, redraw it there and copy the geometry across — the two
   files are the same numbers twice and must not drift.
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

/** Four 48-wide bars on an 88 pitch, rising 58/101/147/205 off a shared
 *  baseline. Geometry measured off the master, not redrawn by eye — it is
 *  the same data as `public/art/brand/premedos-mark.svg`; change both or
 *  neither. Inlined rather than `<img>` so it scales with the type. */
const BARS = [
  { x: 0, y: 147, h: 58, fill: '#BAD1E8' },
  { x: 88, y: 104, h: 101, fill: '#9EC0E0' },
  { x: 176, y: 58, h: 147, fill: '#79ABD7' },
  { x: 264, y: 0, h: 205, fill: '#5293CC' },
]

function Mark() {
  return (
    <svg
      className="pl-wm-mark"
      viewBox="0 0 312 205"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {BARS.map((bar) => (
        <rect key={bar.x} x={bar.x} y={bar.y} width={48} height={bar.h} rx={24} fill={bar.fill} />
      ))}
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

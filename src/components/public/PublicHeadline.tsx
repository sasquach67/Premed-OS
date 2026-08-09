/* ============================================================
   PublicHeadline — the two-weight headline. ONE component.

   A light setup line (`l1`) over a heavy gradient payoff line (`l2`).
   The size-and-weight contrast IS the device; it does not exist at a
   single size, which is why this reverses the in-app 30px `.h1` scale
   (P1 §3). PUBLIC LAYER ONLY.

   Three sizes, one recipe:
     hero    27/46 — the landing hero
     section 19/33 — Features, the tour, Pricing
     about   26/56 — About, the one page in the group with a voice

   The mockups carried two copies of this recipe and they drifted: for one
   pass the doc-pages file was missing it entirely and every title on all
   four pages rendered as unstyled body text. In the build it is this file,
   and only this file (P1 §8b · doc-decisions §"One shared component").
   ============================================================ */
import { cn } from '@/lib/utils'

interface PublicHeadlineProps {
  /** The light setup line. */
  setup: string
  /** The heavy gradient payoff line. */
  payoff: string
  size?: 'hero' | 'section' | 'about'
  /**
   * `art` — over the dark hero or title band (white setup line, the
   *   white→blue→amber payoff gradient).
   * `page` — over a solid page background, where those colours vanish in
   *   the paper theme. Same device, cut from theme tokens.
   */
  tone?: 'art' | 'page'
  className?: string
  /** Heading level for the document outline. The visual size is `size`. */
  as?: 'h1' | 'h2' | 'h3' | 'div'
  /** Anchor target, for the doc pages' contents rail. */
  id?: string
}

const SIZE_CLASS = {
  hero: 'pl-hl-hero',
  section: 'pl-hl-section',
  about: 'pl-hl-about',
} as const

export function PublicHeadline({
  setup,
  payoff,
  size = 'section',
  tone = 'art',
  className,
  as: Tag = 'h2',
  id,
}: PublicHeadlineProps) {
  return (
    <Tag id={id} className={cn('pl-hl', SIZE_CLASS[size], tone === 'page' && 'pl-hl-page', className)}>
      <span className="l1">{setup}</span>
      <span className="l2">{payoff}</span>
    </Tag>
  )
}

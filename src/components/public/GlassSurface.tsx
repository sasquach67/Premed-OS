/* ============================================================
   GlassSurface — the ONE glass implementation for the public layer.

   `_visual-recipes.md` §Glass, verbatim, including
   `box-shadow: inset 0 1px 0 rgba(255,255,255,.16)`. That inset highlight
   is what makes a surface read as glass rather than as a translucent box,
   and it is the single most likely fidelity miss in this chunk (P1 §3) —
   so the recipe lives in exactly one place and cannot be half-applied.

   `refract` adds the feTurbulence displacement filter, which makes an edge
   refract what's behind it instead of only blurring it.

   PUBLIC LAYER ONLY. Glass stops at the bottom of the hero region; every
   surface below it is solid-with-depth (04 §0c, and P1 §4's closing rule).
   ============================================================ */
import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassSurfaceProps {
  children?: ReactNode
  /** 999px instead of the recipe's 13px — the mode-pill variant. */
  pill?: boolean
  /** Apply the feTurbulence refraction filter (needs <PublicFilters /> mounted). */
  refract?: boolean
  className?: string
  as?: ElementType
  style?: React.CSSProperties
}

export function GlassSurface({
  children,
  pill = false,
  refract = false,
  className,
  as: Tag = 'div',
  style,
}: GlassSurfaceProps) {
  return (
    <Tag
      className={cn('pl-glass', pill && 'pl-glass-pill', refract && 'pl-glassfx', className)}
      style={style}
    >
      {children}
    </Tag>
  )
}

/**
 * SVG filter defs used by the public layer. Mounted once per public route.
 *
 * These are the two pieces the brief says to port LITERALLY from the mockup
 * (P1 §8) because they are behaviour rather than styling:
 *   • hq-glass — feTurbulence + feDisplacementMap at scale 0.3. Higher
 *     values look melted.
 *   • hq-gooey — feGaussianBlur + feColorMatrix, which fuses the CTA's
 *     label pill and arrow pill mid-slide instead of showing a seam.
 */
export function PublicFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="hq-glass" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
          <feColorMatrix type="matrix" values="1 0 0 0 0.02  0 1 0 0 0.02  0 0 1 0 0.04  0 0 0 .92 0" />
        </filter>
        <filter id="hq-gooey" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="gooey"
          />
          <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}


/** The drifting mesh. Mounted ONCE by PublicShell, behind the entire public
 *  layer — not per section. Sections used to carry their own, which is what
 *  made each one look like a different page. */
export function PublicMesh() {
  return (
    <div className="pl-mesh" aria-hidden="true">
      <i className="m1" />
      <i className="m2" />
      <i className="m3" />
    </div>
  )
}

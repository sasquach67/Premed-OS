/* ============================================================
   PublicShell — the `.pl` root every public route mounts inside.

   Three jobs: scope the public-layer CSS (nothing outside `.pl` can see
   it, which is how the four scoped departures stay scoped), mount the SVG
   filter defs once, and put the footer at the bottom of every route.

   It does NOT render the nav — the landing page's nav floats inside the
   hero and the doc pages' nav floats inside the title band, so each page
   places `PublicNav` in its own art region.
   ============================================================ */
import { useEffect, useRef, type ReactNode } from 'react'
import { PublicFilters } from '@/components/public/GlassSurface'
import { PublicFooter } from '@/components/public/PublicFooter'
import { useReveal } from '@/components/public/useReveal'
import { PublicMesh } from '@/components/public/GlassSurface'
import './public-layer.css'

interface PublicShellProps {
  children: ReactNode
  /** Browser tab title for this route. */
  title: string
}

export function PublicShell({ children, title }: PublicShellProps) {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])

  return (
    <div className="pl" ref={root}>
      <PublicFilters />
      {/* One drifting mesh behind the WHOLE page — not one per section. */}
      <PublicMesh />
      {children}
      <PublicFooter />
    </div>
  )
}

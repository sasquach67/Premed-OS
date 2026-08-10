/* ============================================================
   useReveal — scroll-triggered entrance for the public layer.

   The hero animates on load (`.pl-an`). Everything below the fold waits
   until it enters the viewport and then plays the SAME fade-rise, so the
   page reveals itself as you scroll instead of firing behind the fold.

   ⚠️ FAIL-VISIBLE, and this is the important part. `.pl-reveal` only hides
   once this hook has set `data-reveal-ready="1"` on the root. If the script
   never runs, IntersectionObserver is missing, or the user prefers reduced
   motion, every section renders normally. A reveal that can strand content
   unread is worse than no reveal at all.

   Once revealed, a section STAYS revealed — it does not re-hide on scroll
   up. Content that disappears when you scroll back is a bug, not an effect.
   ============================================================ */
import { useEffect, type RefObject } from 'react'

export function useReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || typeof IntersectionObserver === 'undefined') return

    const targets = Array.from(root.querySelectorAll<HTMLElement>('.pl-reveal'))
    if (targets.length === 0) return

    // Only now do the hidden styles apply — see the fail-visible note above.
    root.dataset.revealReady = '1'

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          io.unobserve(entry.target) // once revealed, stays revealed
        }
      },
      // Fire a little before the section's top edge arrives, so the motion
      // reads as the page arriving rather than as a delayed pop.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )

    for (const t of targets) io.observe(t)

    // Anything already on screen at mount (short viewport, deep-link, or a
    // restored scroll position) reveals immediately rather than waiting.
    requestAnimationFrame(() => {
      for (const t of targets) {
        const box = t.getBoundingClientRect()
        if (box.top < window.innerHeight && box.bottom > 0) {
          t.classList.add('is-in')
          io.unobserve(t)
        }
      }
    })

    /* Safety net. An element that sits at the very bottom of the document
       can fail to satisfy the negative bottom rootMargin, and would then
       stay hidden forever. If the visitor reaches the end of the page,
       reveal anything still waiting. This is how the footer's legal lines
       got stranded once — see public-layer.css. */
    const onEnd = () => {
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 120
      if (!atBottom) return
      for (const t of targets) t.classList.add('is-in')
      window.removeEventListener('scroll', onEnd)
    }
    window.addEventListener('scroll', onEnd, { passive: true })

    return () => {
      window.removeEventListener('scroll', onEnd)
      io.disconnect()
    }
  }, [rootRef])
}

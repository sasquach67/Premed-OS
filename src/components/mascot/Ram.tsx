import { useEffect, useState } from 'react'
import { useStore } from '@/store/store'
import { mascotGif } from '@/lib/themeAssets'
import { cn } from '@/lib/utils'

// Kept for call-site compatibility (the animated GIF ignores mood).
export type RamMood = 'happy' | 'wink' | 'cheer'

/* The mascot. Renders the animated GIF at /art/mascot.gif as a plain <img>
   so it animates. Falls back to a soft placeholder if the file is missing,
   so the app never breaks while art is being swapped. */
export function Ram({
  size = 96, className,
}: { size?: number; mood?: RamMood; className?: string }) {
  const visualTheme = useStore((s) => s.settings.visualTheme)
  const sources = visualTheme === 'doraemon'
    ? [mascotGif('doraemon'), mascotGif('ghibli')]
    : [mascotGif('ghibli')]
  const [sourceIndex, setSourceIndex] = useState(0)
  const failed = sourceIndex >= sources.length

  useEffect(() => setSourceIndex(0), [visualTheme])

  if (failed) {
    return (
      <div
        className={cn('grid place-items-center rounded-full bg-leaf-soft text-leaf', className)}
        style={{ width: size, height: size }}
        aria-label="mascot"
      >
        <span className="font-display text-lg font-bold">HQ</span>
      </div>
    )
  }

  return (
    <img
      src={sources[sourceIndex]}
      width={size}
      height={size}
      alt="Premed OS mascot"
      onError={() => setSourceIndex((i) => i + 1)}
      className={cn('select-none object-contain drop-shadow-[0_6px_10px_rgba(58,53,48,0.14)]', className)}
      style={{ imageRendering: 'auto' }}
      draggable={false}
    />
  )
}

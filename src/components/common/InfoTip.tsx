import { useRef, useState, type PointerEvent } from 'react'
import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { glossary } from '@/lib/glossary'
import { cn } from '@/lib/utils'

/**
 * Defines a term of art at the moment of choosing it (01 §4f-i).
 *
 * Not a MascotNote: that teaches a *concept* once on a surface and is
 * dismissed forever. This defines a *term*, on demand, every time, and is
 * never dismissed — it answers a question the student just asked by
 * hesitating over an option they have not met before.
 *
 * Built on Popover rather than Tooltip because hover does not exist on
 * touch: a tooltip-only affordance is invisible to half the users who need
 * it. This opens on hover (mouse), focus (keyboard), and tap (touch).
 */
export function InfoTip({
  field,
  value,
  className,
}: {
  /** Glossary key, e.g. `course.bcpm`. Content never lives in JSX. */
  field: string
  /** Optional value within that field — omit to define the field itself. */
  value?: string | number | boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const pointerType = useRef('')
  const text = glossary(field, value)

  // Nothing written for this term yet — render no affordance rather than an
  // empty one. The option's own label still does the primary work.
  if (!text) return null

  // Mouse only: on touch, pointerenter fires alongside the tap that Radix
  // already toggles on, which would open and immediately close it.
  function hover(next: boolean) {
    return (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'mouse') setOpen(next)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`What does this mean? ${text}`}
          onPointerDown={(event) => { pointerType.current = event.pointerType }}
          onClick={(event) => {
            // Hover already opened the mouse experience. Do not let the
            // following click toggle it closed; touch and keyboard still use
            // Radix's normal click activation.
            if (pointerType.current === 'mouse' && open) event.preventDefault()
          }}
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          onFocus={(event) => {
            // Mouse focus is immediately followed by Radix's click toggle.
            // Opening here only for :focus-visible avoids an open-then-close
            // race while preserving keyboard discovery.
            if (event.currentTarget.matches(':focus-visible')) setOpen(true)
          }}
          onBlur={() => setOpen(false)}
          className={cn(
            'inline-grid size-5 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <Info className="size-3" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        // Keep focus where the student was working — this is never a step.
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="max-w-72 text-xs font-semibold leading-snug text-foreground"
      >
        {text}
      </PopoverContent>
    </Popover>
  )
}

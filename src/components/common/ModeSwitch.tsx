import { m } from 'motion/react'
import { cn } from '@/lib/utils'
import { MOTION_TRANSITION } from '@/lib/motion'

export interface ModeSwitchOption<T extends string> {
  id: T
  label: string
}

export function ModeSwitch<T extends string>({
  value,
  options,
  onChange,
  label = 'Page mode',
  className,
}: {
  value: T
  options: ModeSwitchOption<T>[]
  onChange: (value: T) => void
  label?: string
  className?: string
}) {
  const left = options[0]
  const right = options[1]
  if (!left || !right) return null

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    onChange(event.key === 'ArrowRight' ? right.id : left.id)
  }

  const checked = value === right.id

  /* A single binary switch announces only "on/off", which never says WHICH
   * mode is selected. A radiogroup of two named radios announces the label of
   * the active option, so the control is self-describing. Roving tabindex
   * keeps it one tab stop, with arrow keys moving between options. */
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'glass-surface glass-surface--pill relative inline-grid min-w-56 grid-cols-2 items-stretch gap-1 p-1 transition-colors duration-150 ease-out motion-reduce:transition-none',
        className,
      )}
    >
      <m.span
        aria-hidden
        className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-full bg-white"
        animate={{ x: checked ? '100%' : '0%' }}
        transition={MOTION_TRANSITION.standard}
      />
      {[left, right].map((option) => {
        const selected = value === option.id
        return (
          <m.button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={onKeyDown}
            whileTap={{ scale: 0.985 }}
            transition={MOTION_TRANSITION.micro}
            className={cn(
              'relative z-10 flex min-w-20 items-center justify-center rounded-full px-5 py-2 font-display text-sm font-bold text-white/75 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
              selected && 'font-extrabold text-slate-900',
            )}
          >
            {option.label}
          </m.button>
        )
      })}
    </div>
  )
}

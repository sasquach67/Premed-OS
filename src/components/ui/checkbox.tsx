import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { m } from 'motion/react'
import { cn } from '@/lib/utils'
import { MOTION_GESTURE, MOTION_TRANSITION } from '@/lib/motion'

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  animated?: boolean
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, animated = true, ...props }, ref) => (
  <CheckboxPrimitive.Root asChild {...props}>
    <m.button
      ref={ref}
      whileTap={animated ? MOTION_GESTURE.press : undefined}
      transition={animated ? MOTION_TRANSITION.micro : undefined}
      className={cn(
        'field-solid peer size-5 shrink-0 rounded-[6px] border-2 transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        !animated && 'transition-none',
        className
      )}
    >
      <CheckboxPrimitive.Indicator asChild>
        {animated ? (
          <m.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={MOTION_TRANSITION.micro}
            className="flex items-center justify-center text-current"
          >
            <Check className="size-3.5 stroke-[3]" />
          </m.span>
        ) : (
          <span className="flex items-center justify-center text-current">
            <Check className="size-3.5 stroke-[3]" />
          </span>
        )}
      </CheckboxPrimitive.Indicator>
    </m.button>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

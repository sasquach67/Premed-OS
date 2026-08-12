import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function EqualHeightGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid min-w-0 items-stretch gap-4 [&>*]:h-full [&>*]:min-w-0 [&>*>*]:h-full', className)}
      {...props}
    />
  )
}

export function BoundedRegion({
  size = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: 'compact' | 'default' | 'tall' }) {
  return (
    <div
      className={cn(
        'max-w-full overflow-auto overscroll-contain',
        size === 'compact' && 'max-h-80',
        size === 'default' && 'max-h-[32rem]',
        size === 'tall' && 'max-h-[42rem]',
        className,
      )}
      {...props}
    />
  )
}

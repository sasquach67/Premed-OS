import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Shared expandable shell; callers retain their domain-specific contents. */
export function ExpandableEntryRow({ summary, children, label, className, triggerClassName, contentClassName }: {
  summary: ReactNode; children: ReactNode; label: string; className?: string; triggerClassName?: string; contentClassName?: string
}) {
  const [open, setOpen] = useState(false)
  return <article className={cn('rounded-xl border bg-card', className)}>
    <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen(value => !value)} className={cn("flex w-full min-w-0 items-start gap-3 p-3 text-left", triggerClassName)}>
      <ChevronDown className={cn('mt-1 size-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')} />
      {summary}
    </button>
    {open && <div className={cn("border-t border-border p-3", contentClassName)}>{children}</div>}
  </article>
}

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/** Friendly placeholder so an unfilled tracker still has structure + a clear
 *  next action (Andy's rule: outline + functionality must always be there). */
export function EmptyState({
  icon: Icon, title, hint, action,
}: { icon: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted px-6 py-10 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

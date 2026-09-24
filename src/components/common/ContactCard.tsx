import type { ReactNode } from 'react'
import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ContactCard({ name, role, children, actions, initials, className, wrapText = false }: {
  name: string; role?: string; children?: ReactNode; actions?: ReactNode; initials?: string; className?: string; wrapText?: boolean
}) {
  return <div className={cn('rounded-xl border bg-card p-4', className)}>
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-display font-bold text-primary">{initials ?? <UserRound className="size-5" />}</span>
      <div className="min-w-0 flex-1"><p className={cn(wrapText ? 'break-words' : 'truncate', 'font-bold')}>{name}</p><p className={cn(!wrapText && 'truncate', 'text-xs font-semibold text-muted-foreground')}>{role}</p></div>
    </div>
    {children}
    {actions && <div className="mt-4 flex flex-wrap items-center justify-between gap-2">{actions}</div>}
  </div>
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellRing, CalendarClock, Clock3, ShieldAlert, Settings2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useStore } from '@/store/store'
import { buildAttention, type AttentionItem, type AttentionSource } from './attention'
import { cn } from '@/lib/utils'

const FEEDS: { source: AttentionSource; label: string; icon: typeof Bell }[] = [
  { source: 'deadline', label: 'Deadlines', icon: CalendarClock },
  { source: 'data-health', label: 'Data health', icon: ShieldAlert },
  { source: 'system', label: 'System', icon: Settings2 },
]

const DOT: Record<AttentionItem['priority'], string> = {
  blocking: 'bg-destructive',
  important: 'bg-primary',
  suggested: 'bg-muted-foreground',
}

const SEVERITY_LABEL: Record<AttentionItem['priority'], string> = {
  blocking: 'Blocking',
  important: 'Important',
  suggested: 'Suggested',
}

export function AttentionBell() {
  const data = useStore()
  const update = useStore((state) => state.update)
  const [open, setOpen] = useState(false)
  const items = useMemo(() => buildAttention(data), [data])
  // Suggested items never badge (shell §7.5) — only real urgency earns a count.
  const count = items.filter((item) => item.priority === 'blocking' || item.priority === 'important').length

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener('premed:attention', show)
    return () => window.removeEventListener('premed:attention', show)
  }, [])

  function snooze(id: string, days: number) {
    update((draft) => { draft.settings.attentionSnoozedUntil[id] = Date.now() + days * 24 * 60 * 60 * 1000 })
  }

  /** Dismiss-with-reason is offered for suggested items only; blocking and
   *  important items can be snoozed but never permanently waved away. */
  function dismiss(id: string) {
    update((draft) => { draft.settings.attentionSnoozedUntil[id] = Number.MAX_SAFE_INTEGER })
  }

  const groups = FEEDS
    .map((feed) => ({ ...feed, rows: items.filter((item) => item.source === feed.source) }))
    .filter((group) => group.rows.length > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative size-8 rounded-full bg-card" aria-label={`Attention${count ? `, ${count} important items` : ''}`}>
          {count ? <BellRing className="size-4" /> : <Bell className="size-4" />}
          {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-extrabold leading-4 text-destructive-foreground">{count > 9 ? '9+' : count}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(25rem,calc(100vw-1rem))] p-0 max-sm:fixed max-sm:bottom-2 max-sm:left-2 max-sm:right-2 max-sm:top-auto max-sm:w-auto">
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-base font-extrabold">Attention</p>
          <p className="text-xs text-muted-foreground">Deadlines, data health, and system checks.</p>
        </div>
        <div className="max-h-[min(60vh,30rem)] overflow-y-auto">
          <div className="p-2">
            {!items.length && (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto size-6 text-primary" />
                <p className="mt-2 text-sm font-bold">Nothing needs attention</p>
                <p className="mt-1 text-xs text-muted-foreground">You’re clear for now.</p>
              </div>
            )}
            {groups.map((group) => (
              <section key={group.source} aria-label={group.label} className="mb-1">
                <h3 className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  <group.icon className="size-3.5" aria-hidden="true" /> {group.label}
                </h3>
                {group.rows.map((item) => (
                  <div key={item.id} className="rounded-xl px-3 py-3 hover:bg-muted/55">
                    <div className="flex items-start gap-3">
                      <span className={cn('mt-1 size-2 shrink-0 rounded-full', DOT[item.priority])} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">{item.title}</p>
                        {/* Every item states why it appeared — architecture/02 explainability. */}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="sr-only">{SEVERITY_LABEL[item.priority]}. </span>{item.why}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button asChild size="sm" onClick={() => setOpen(false)}>
                            <Link to={item.route}>{item.actionLabel}</Link>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => snooze(item.id, 1)}>
                            <Clock3 className="size-3.5" /> Tomorrow
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => snooze(item.id, 7)}>Next week</Button>
                          {item.priority === 'suggested' && (
                            <Button size="sm" variant="ghost" onClick={() => dismiss(item.id)} aria-label={`Dismiss: ${item.title}`}>
                              <X className="size-3.5" /> Dismiss
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

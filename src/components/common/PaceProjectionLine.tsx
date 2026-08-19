import { Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/store'

export function PaceProjectionLine({
  id,
  rate,
  outcome,
  date,
  insufficientLabel = 'Not enough data yet.',
}: {
  id: string
  rate?: string | null
  outcome?: string | null
  date?: string | null
  insufficientLabel?: string
}) {
  const dismissed = useStore((state) => Boolean(state.settings.projectionDismissals[id]))
  const update = useStore((state) => state.update)

  if (dismissed) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => update((draft) => { delete draft.settings.projectionDismissals[id] })}
      >
        <Eye className="size-4" />
        Show projection
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs">
      <p className="min-w-0 flex-1 font-semibold text-muted-foreground">
        {rate && outcome && date
          ? <><span className="font-extrabold text-foreground">At {rate}</span> → {outcome} by <span className="font-extrabold text-foreground">{date}</span></>
          : insufficientLabel}
      </p>
      <Button
        type="button"
        size="icon"
        className="size-8"
        variant="ghost"
        aria-label="Hide projection"
        onClick={() => update((draft) => { draft.settings.projectionDismissals[id] = true })}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

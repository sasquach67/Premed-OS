import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface StatStripMetric {
  id: string
  label: string
  value: ReactNode
  detail?: ReactNode
  icon?: ReactNode
  direction?: 'up' | 'down'
}

export interface BannerStatStripMetric extends StatStripMetric {
  /** Banner metrics must be able to change as the student's records change. */
  cadence: 'variable'
}

type StatStripProps =
  | { variant: 'banner'; metrics: BannerStatStripMetric[]; className?: string }
  | { variant?: 'surface'; metrics: StatStripMetric[]; className?: string }

export function validateBannerMetricCount(metrics: BannerStatStripMetric[]) {
  return metrics.length >= 3 && metrics.length <= 5
}

/** One metric row for both banner-borne variable stats and solid page stats. */
export function StatStrip(props: StatStripProps) {
  const { metrics, className } = props

  if (metrics.length === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>No changing metrics yet.</p>
  }

  if (props.variant === 'banner') {
    if (import.meta.env.DEV && !validateBannerMetricCount(props.metrics)) {
      console.warn('Banner StatStrip expects 3–5 variable metrics.')
    }

    return (
      <div
        className={cn('glass-surface glass-surface--dark grid shrink-0 grid-flow-col auto-cols-fr overflow-hidden text-white', className)}
        aria-label="Current metrics"
      >
        {metrics.slice(0, 5).map((metric) => {
          const Direction = metric.direction === 'up' ? ArrowUpRight : metric.direction === 'down' ? ArrowDownRight : null
          return (
            <div key={metric.id} className="min-w-20 border-r border-white/10 px-4 py-2 last:border-r-0">
              <p className="whitespace-nowrap text-xs font-bold text-white/70">{metric.label}</p>
              <p className="flex items-center gap-1 truncate font-display text-lg font-extrabold leading-tight tabular-nums text-white" title={typeof metric.value === 'string' ? metric.value : undefined}>
                {metric.icon}{metric.value}
                {Direction && (
                  <Direction
                    className={cn('size-3.5 shrink-0', metric.direction === 'up' ? 'text-success' : 'text-destructive')}
                    aria-hidden="true"
                  />
                )}
              </p>
              {metric.detail && <p className="truncate text-xs font-semibold text-white/60">{metric.detail}</p>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex min-w-0 flex-wrap gap-2', className)} aria-label="Current metrics">
      {metrics.map((metric) => (
        <div key={metric.id} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-bold shadow-sm">
          <span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-primary/12 px-1.5 text-primary">
            {metric.icon}{metric.value}
          </span>
          <span>{metric.label}</span>
          {metric.detail && <span className="truncate text-muted-foreground">· {metric.detail}</span>}
        </div>
      ))}
    </div>
  )
}

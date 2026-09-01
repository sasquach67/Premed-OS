import { AlertCircle, Check, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationPhase } from '@/lib/generation/progress'

export type { GenerationPhase }

export type GenerationProgressStep = {
  label: string
  detail: string
}

const DEFAULT_STEPS: GenerationProgressStep[] = [
  { label: 'Prepare sources', detail: 'Confirming the selected material' },
  { label: 'Create output', detail: 'Grounding the draft in your sources' },
  { label: 'Save result', detail: 'Adding the finished work to your workspace' },
]

const phaseIndex: Record<Exclude<GenerationPhase, 'idle' | 'error'>, number> = {
  preparing: 0,
  generating: 1,
  saving: 2,
  complete: 3,
}

function statusFor(index: number, phase: GenerationPhase, errorStep: number) {
  if (phase === 'complete') return 'complete' as const
  if (phase === 'error') {
    if (index < errorStep) return 'complete' as const
    if (index === errorStep) return 'error' as const
    return 'pending' as const
  }
  if (phase === 'idle') return 'pending' as const
  const current = phaseIndex[phase]
  if (index < current) return 'complete' as const
  if (index === current) return 'active' as const
  return 'pending' as const
}

/**
 * Small, reusable progress language for source-grounded work. The checks mark
 * client-side milestones around the real generation request; they do not claim
 * to represent model token-level progress.
 */
export function GenerationProgress({
  phase,
  outputLabel,
  errorMessage,
  steps = DEFAULT_STEPS,
  errorStep = 1,
}: {
  phase: GenerationPhase
  outputLabel: string
  errorMessage?: string
  steps?: GenerationProgressStep[]
  errorStep?: number
}) {
  if (phase === 'idle') return null

  const completed = steps.filter((_, index) => statusFor(index, phase, errorStep) === 'complete').length
  const statusText = phase === 'complete'
    ? 'Ready'
    : phase === 'error'
      ? 'Needs attention'
      : `${completed} of ${steps.length} complete`

  return (
    <section
      aria-label={`${outputLabel} progress`}
      aria-live="polite"
      className="rounded-xl border border-border bg-card/70 p-3 shadow-[0_8px_22px_-18px_rgba(0,0,0,0.72)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{phase === 'complete' ? 'Created' : 'Creating'}</p>
          <p className="mt-0.5 truncate font-display text-sm font-extrabold">{outputLabel}</p>
        </div>
        <span className={cn(
          'shrink-0 rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]',
          phase === 'error' ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' :
            phase === 'complete' ? 'border-[color-mix(in_srgb,var(--success)_48%,var(--border))] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]' :
              'border-primary/30 bg-primary/10 text-primary',
        )}>{statusText}</span>
      </div>

      <ol className="mt-3 grid gap-1.5 sm:grid-cols-3">
        {steps.map((step, index) => {
          const status = statusFor(index, phase, errorStep)
          return (
            <li
              key={step.label}
              data-generation-step={step.label}
              data-generation-status={status}
              className={cn(
                'flex min-w-0 items-start gap-2 rounded-lg border px-2.5 py-2 transition-[border-color,background-color,transform] duration-300 motion-reduce:transition-none',
                status === 'complete' && 'border-[color-mix(in_srgb,var(--success)_40%,var(--border))] bg-[color-mix(in_srgb,var(--success)_9%,transparent)]',
                status === 'active' && 'border-primary/40 bg-primary/10',
                status === 'error' && 'border-amber-500/40 bg-amber-500/10',
                status === 'pending' && 'border-border bg-muted/20 opacity-65',
              )}
            >
              <span className={cn(
                'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border',
                status === 'complete' && 'border-[var(--success)] bg-[var(--success)] text-[var(--success-foreground,#fff)] motion-safe:animate-in motion-safe:zoom-in-75',
                status === 'active' && 'border-primary text-primary',
                status === 'error' && 'border-amber-600 text-amber-700 dark:text-amber-300',
                status === 'pending' && 'border-muted-foreground/35 text-muted-foreground',
              )}>
                {status === 'complete' ? <Check className="size-2.5" strokeWidth={3} aria-hidden="true" /> :
                  status === 'active' ? <LoaderCircle className="size-2.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> :
                    status === 'error' ? <AlertCircle className="size-2.5" aria-hidden="true" /> : <span className="size-1 rounded-full bg-current" aria-hidden="true" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-extrabold">{step.label}</span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold text-muted-foreground">{step.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {phase === 'error' && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">{errorMessage ?? 'Generation stopped safely. Nothing new was saved.'}</p>}
      {phase === 'complete' && <p className="mt-2 text-xs font-semibold text-muted-foreground">Saved with its source trace. You can keep working while it settles into Materials.</p>}
    </section>
  )
}

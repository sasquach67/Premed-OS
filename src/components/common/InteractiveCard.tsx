import { AlertCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import {
  RecordActionMenu,
  type RecordAction,
} from '@/components/common/RecordActionMenu'
import { cn } from '@/lib/utils'

export type InteractiveCardState = 'ready' | 'loading' | 'empty' | 'error' | 'disabled'

export function InteractiveCard({
  label,
  title,
  secondary,
  hoverAffordance,
  identityDotClassName = 'bg-primary',
  accentClassName = 'bg-primary',
  state = 'ready',
  stateMessage,
  onOpen,
  children,
  primaryAction,
  actions = [],
  className,
}: {
  label: string
  title: ReactNode
  secondary?: ReactNode
  hoverAffordance: string
  identityDotClassName?: string
  accentClassName?: string
  state?: InteractiveCardState
  stateMessage?: string
  onOpen: () => void
  children?: ReactNode
  primaryAction?: ReactNode
  actions?: RecordAction[]
  className?: string
}) {
  const [actionsActive, setActionsActive] = useState(false)
  const canOpen = state === 'ready' || state === 'empty' || state === 'error'

  const card = (overflowAction?: ReactNode) => (
    <Card
      data-actions-active={actionsActive ? 'true' : 'false'}
      className={cn(
        'group/card relative min-w-0 overflow-hidden p-0 transition-[transform,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
        !actionsActive && canOpen && 'hover:-translate-y-[3px] hover:border-primary/55 hover:shadow-lg hover:shadow-primary/15 motion-reduce:hover:translate-y-0',
        state === 'disabled' && 'opacity-55',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-1 origin-left scale-x-0 transition-transform duration-150 ease-out motion-reduce:transition-none',
          accentClassName,
          !actionsActive && canOpen && 'group-hover/card:scale-x-100 group-focus-within/card:scale-x-100',
        )}
      />

      <button
        type="button"
        aria-label={label}
        disabled={!canOpen}
        onClick={onOpen}
        className="block w-full min-w-0 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-2 font-display font-bold">
          <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-full', identityDotClassName)} />
          <span className="min-w-0 truncate">{title}</span>
        </span>

        {state === 'loading' ? (
          <span className="mt-3 block space-y-2" aria-label="Loading card">
            <span className="block h-3 w-2/3 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
            <span className="block h-3 w-1/2 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          </span>
        ) : state === 'error' ? (
          <span className="mt-3 flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            {stateMessage || 'This card could not load. Try again.'}
          </span>
        ) : state === 'empty' ? (
          <span className="mt-3 block text-sm font-semibold text-muted-foreground">
            {stateMessage || 'Nothing here yet. Add the first record to begin.'}
          </span>
        ) : (
          children
        )}

        {secondary && state === 'ready' && (
          <span className="mt-3 block text-sm font-semibold text-muted-foreground">
            <span className={cn(!actionsActive && 'group-hover/card:hidden group-focus-within/card:hidden')}>{secondary}</span>
            <span className={cn('hidden text-primary', !actionsActive && 'group-hover/card:inline group-focus-within/card:inline')}>{hoverAffordance}</span>
          </span>
        )}
      </button>

      {(primaryAction || actions.length > 0) && state !== 'loading' && (
        <div
          className="relative z-10 flex items-center justify-end gap-2 border-t border-border px-3 py-2"
          onPointerEnter={() => setActionsActive(true)}
          onPointerLeave={() => setActionsActive(false)}
          onFocusCapture={() => setActionsActive(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setActionsActive(false)
          }}
        >
          {primaryAction}
          {overflowAction}
        </div>
      )}
    </Card>
  )

  return actions.length > 0 ? (
    <RecordActionMenu actions={actions} label={`${label} actions`}>
      {(overflow) => card(overflow)}
    </RecordActionMenu>
  ) : card()
}

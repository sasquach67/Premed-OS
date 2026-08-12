import { Ellipsis } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface RecordAction {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
  separatorBefore?: boolean
  onSelect: () => void
}

export function recordActionIds(actions: RecordAction[]) {
  return actions.map((action) => action.id)
}

export function RecordActionMenu({
  actions,
  label,
  children,
}: {
  actions: RecordAction[]
  label: string
  children: (overflow: ReactElement) => ReactElement
}) {
  return (
    <RecordContextMenu actions={actions}>
      {children(<RecordActionOverflow actions={actions} label={label} />)}
    </RecordContextMenu>
  )
}

/**
 * Context and overflow menus deliberately consume the same action array.
 * This makes a right-click-only capability structurally impossible when the
 * pair is used: mouse, keyboard, touch overflow, and Radix's touch/pen
 * long-press all reach the same callbacks.
 */
export function RecordContextMenu({
  actions,
  children,
}: {
  actions: RecordAction[]
  children: ReactElement
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {actions.map((action) => (
          <RecordContextAction key={action.id} action={action} />
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function RecordActionOverflow({ actions, label }: { actions: RecordAction[]; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="ghost" aria-label={label}>
          <Ellipsis className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <RecordOverflowAction key={action.id} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RecordContextAction({ action }: { action: RecordAction }) {
  return (
    <>
      {action.separatorBefore && <ContextMenuSeparator />}
      <ContextMenuItem
        disabled={action.disabled}
        variant={action.destructive ? 'destructive' : 'default'}
        onSelect={action.onSelect}
      >
        {action.icon}{action.label}
        {action.shortcut && <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>}
      </ContextMenuItem>
    </>
  )
}

function RecordOverflowAction({ action }: { action: RecordAction }) {
  return (
    <>
      {action.separatorBefore && <DropdownMenuSeparator />}
      <DropdownMenuItem
        disabled={action.disabled}
        className={action.destructive ? 'text-destructive focus:text-destructive' : undefined}
        onClick={action.onSelect}
      >
        {action.icon}{action.label}
        {action.shortcut && <span className="ml-auto text-xs tracking-widest text-muted-foreground">{action.shortcut}</span>}
      </DropdownMenuItem>
    </>
  )
}

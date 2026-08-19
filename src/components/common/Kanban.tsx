import { type ReactNode, useState } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { CollectionState, type CollectionLoadState } from '@/components/common/CollectionState'
import type { CollectionKey } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionBar } from '@/components/common/BulkActionBar'
import { useToast } from '@/components/common/useToast'

export interface KanbanItem {
  id: string
  title: string
  subtitle?: string
  badge?: ReactNode
  column: string
}
export interface KanbanColumnDef {
  id: string
  title: string
  accent?: string
}

/** Reusable To-Do / In-Progress / Done board with drag between columns. */
export function Kanban({
  columns, items, onMove, footer, state = 'ready', errorMessage, onRetry, onOpen, collection,
}: {
  columns: KanbanColumnDef[]
  items: KanbanItem[]
  onMove: (id: string, column: string) => void
  footer?: (columnId: string) => ReactNode
  state?: CollectionLoadState
  errorMessage?: string
  onRetry?: () => void
  onOpen?: (id: string) => void
  collection?: CollectionKey
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const toast = useToast()

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    const item = items.find((candidate) => candidate.id === String(active.id))
    if (over && item && item.column !== String(over.id)) {
      onMove(String(active.id), String(over.id))
      toast({
        title: 'Card moved',
        description: `Moved to ${columns.find((column) => column.id === String(over.id))?.title ?? 'another column'}.`,
        onUndo: () => onMove(item.id, item.column),
      })
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (state !== 'ready') return <CollectionState state={state} errorMessage={errorMessage} onRetry={onRetry} />

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid max-h-[42rem] items-stretch gap-3 overflow-y-auto md:grid-cols-3">
        {columns.map((col) => (
          <Column key={col.id} col={col} count={items.filter((i) => i.column === col.id).length} footer={footer}>
            {items.filter((i) => i.column === col.id).map((i) => (
              <Card
                key={i.id}
                item={i}
                onOpen={onOpen ? () => onOpen(i.id) : undefined}
                selected={selectedIds.has(i.id)}
                onToggleSelected={collection ? () => toggleSelected(i.id) : undefined}
              />
            ))}
          </Column>
        ))}
      </div>
      {collection && (
        <BulkActionBar
          collection={collection}
          rows={items}
          selectedIds={selectedIds}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </DndContext>
  )
}

function Column({
  col, count, children, footer,
}: { col: KanbanColumnDef; count: number; children: ReactNode; footer?: (id: string) => ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  return (
    <div className="flex min-h-48 flex-col rounded-xl border border-border bg-muted p-2.5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="size-2.5 rounded-full" style={{ background: col.accent ?? 'var(--primary)' }} />
        <span className="text-sm font-bold">{col.title}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div ref={setNodeRef} className={cn('flex-1 space-y-2 rounded-lg p-1 transition-colors', isOver && 'bg-secondary/60 ring-2 ring-primary/30')}>
        {children}
      </div>
      {footer && <div className="px-1 pt-2">{footer(col.id)}</div>}
    </div>
  )
}

function Card({
  item, onOpen, selected, onToggleSelected,
}: {
  item: KanbanItem
  onOpen?: () => void
  selected?: boolean
  onToggleSelected?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-card p-2.5 text-sm card-soft active:cursor-grabbing motion-reduce:transition-none',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {onToggleSelected && (
            <span onPointerDown={(event) => event.stopPropagation()}>
              <Checkbox checked={selected} onCheckedChange={onToggleSelected} aria-label={`Select ${item.title}`} />
            </span>
          )}
          <span className="font-medium leading-snug">{item.title}</span>
        </div>
        {item.badge}
      </div>
      {item.subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>}
      {onOpen && <button type="button" className="mt-2 min-h-8 text-xs font-bold text-primary" onClick={onOpen}>Open</button>}
    </div>
  )
}

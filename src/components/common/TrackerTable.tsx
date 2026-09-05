import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlignLeft, ArrowUpDown, CalendarDays, CheckSquare2, ChevronLeft, ChevronRight,
  ExternalLink, GripVertical, Hash, Link2, ListFilter, Search, StickyNote, ToggleLeft, Trash2, Type,
} from 'lucide-react'
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
  useReactTable, type ColumnDef as TanStackColumnDef, type PaginationState, type SortingState,
} from '@tanstack/react-table'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import type { CollectionKey } from '@/lib/types'
import { useStore } from '@/store/store'
import { cn } from '@/lib/utils'
import { DateField } from './DateField'
import { InfoTip } from '@/components/common/InfoTip'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { AutosaveStatus, type SaveStatus } from '@/components/common/AutosaveStatus'
import { CollectionState, type CollectionLoadState } from '@/components/common/CollectionState'
import { BulkActionBar } from '@/components/common/BulkActionBar'
import { SavedViewControls } from '@/components/common/SavedViewControls'
import { useSavedViews } from '@/components/common/useSavedViews'
import { useToast } from '@/components/common/useToast'
import { MOTION_DISTANCE, MOTION_TRANSITION } from '@/lib/motion'

export type CellType = 'text' | 'number' | 'date' | 'select' | 'longtext' | 'link' | 'toggle' | 'read' | 'custom'

export type TrackerRow = { id: string }

export interface ColumnDef {
  key: string
  header: string
  type: CellType
  width?: string
  options?: string[]
  optionDots?: Record<string, string>
  selectDisplay?: 'label' | 'dot'
  allowEmpty?: boolean
  /** for 'toggle': [offLabel, onLabel] */
  toggleLabels?: [string, string]
  /** for 'longtext': show an AMCAS-style character counter against this limit */
  maxLength?: number
  align?: 'left' | 'right'
  placeholder?: string
  wrap?: boolean
  /** Glossary key (`src/lib/glossary.ts`) defining this column's term of
   *  art, surfaced as an InfoTip beside the header (01 §4f-i). */
  glossaryField?: string
  read?: (row: Row) => ReactNode
  render?: (ctx: { row: Row; value: unknown; checked: boolean; onChange: (v: unknown) => void }) => ReactNode
  validate?: (value: unknown, row: Row) => string | undefined
}

/** TrackerTable accepts any row with an id; cells read fields by key name. */
type Row = TrackerRow
function field(row: Row, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

const CELL_TYPE_ICON: Record<CellType, LucideIcon> = {
  text: Type,
  number: Hash,
  date: CalendarDays,
  select: ListFilter,
  longtext: AlignLeft,
  link: Link2,
  toggle: ToggleLeft,
  read: Hash,
  custom: ListFilter,
}

function columnWidthPx(width?: string) {
  const match = /^(\d+)px$/.exec(width ?? '')
  return match ? Number(match[1]) : 160
}

interface TrackerTableProps {
  collection?: CollectionKey
  rows: Row[]
  columns: ColumnDef[]
  /** boolean field that drives the check-off control (left of each row) */
  checkKey?: string
  reorder?: boolean
  /** custom right-aligned actions per row */
  rowActions?: (row: Row) => ReactNode
  onDelete?: (id: string) => void
  /** Adapter seams for canonical nested collections such as class assignments. */
  onPatch?: (id: string, key: string, value: unknown) => void
  onReorder?: (fromId: string, toId: string) => void
  empty?: ReactNode
  state?: CollectionLoadState
  errorMessage?: string
  onRetry?: () => void
  onOpen?: (id: string) => void
  selectedIds?: Set<string>
  onToggleSelected?: (id: string) => void
  listId?: string
}

/** The detailed editable TABLE behind every pillar tracker.
 *  Inline edit · check-off · drag-reorder · delete (Notion-like). */
export function TrackerTable({
  collection, rows, columns, checkKey, reorder = true, rowActions, onDelete, empty,
  onPatch, onReorder, state = 'ready', errorMessage, onRetry, onOpen, selectedIds, onToggleSelected, listId,
}: TrackerTableProps) {
  const patchItem = useStore((s) => s.patchItem)
  const reorderItems = useStore((s) => s.reorderItems)
  const undoRecovery = useStore((s) => s.undoRecovery)
  const toast = useToast()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(() => new Set())
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const views = useSavedViews(listId ?? collection ?? 'tracker', { visibleColumns: columns.map((column) => column.key) })
  const effectiveSelectedIds = selectedIds ?? internalSelectedIds
  const visibleColumns = views.state.visibleColumns.length
    ? columns.filter((column) => views.state.visibleColumns.includes(column.key))
    : columns
  // TanStack resets pagination when data changes. Keep unchanged rows stable
  // so that the reset cannot itself trigger another data change and reset.
  const activeRows = useMemo(() => rows.filter((row) => !field(row, 'deletedAt') && !field(row, 'archived')), [rows])
  const tableColumns = useMemo<TanStackColumnDef<Row>[]>(
    () => columns.map((column) => ({
      id: column.key,
      accessorFn: (row) => field(row, column.key),
    })),
    [columns]
  )
  const dataTable = useReactTable({
    data: activeRows,
    columns: tableColumns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLocaleLowerCase()
      if (!query) return true
      return columns.some((column) => String(field(row.original, column.key) ?? '').toLocaleLowerCase().includes(query))
    },
  })
  const displayedRows = dataTable.getRowModel().rows.map((row) => row.original)

  function toggleSelected(id: string) {
    if (onToggleSelected) {
      onToggleSelected(id)
      return
    }
    setInternalSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    if (selectedIds && onToggleSelected) {
      for (const id of selectedIds) onToggleSelected(id)
      return
    }
    setInternalSelectedIds(new Set())
  }

  function selectAll() {
    const allSelected = displayedRows.length > 0 && displayedRows.every((row) => effectiveSelectedIds.has(row.id))
    if (selectedIds && onToggleSelected) {
      for (const row of displayedRows) {
        if (allSelected === effectiveSelectedIds.has(row.id)) onToggleSelected(row.id)
      }
      return
    }
    setInternalSelectedIds(allSelected ? new Set() : new Set(displayedRows.map((row) => row.id)))
  }

  function patch(id: string, key: string, value: unknown) {
    const previous = field(rows.find((row) => row.id === id) ?? { id }, key)
    setSaveStatus('saving')
    if (onPatch) onPatch(id, key, value)
    else if (collection) patchItem(collection, id, { [key]: value })
    if (key === checkKey && previous !== value) {
      toast({
        title: value ? 'Marked complete' : 'Reopened',
        onUndo: () => {
          if (onPatch) onPatch(id, key, previous)
          else if (collection) patchItem(collection, id, { [key]: previous })
        },
      })
    }
    window.setTimeout(() => setSaveStatus('saved'), 350)
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) {
      if (onReorder) {
        onReorder(String(active.id), String(over.id))
        toast({ title: 'Record moved' })
      } else if (collection) {
        reorderItems(collection, String(active.id), String(over.id))
        const recoveryId = useStore.getState().meta.recoveryStack[0]?.id
        toast({ title: 'Record moved', onUndo: recoveryId ? () => undoRecovery(recoveryId) : undefined })
      }
    }
  }

  if (state !== 'ready') return <CollectionState state={state} errorMessage={errorMessage} onRetry={onRetry} />
  if (!activeRows.length && empty) return <>{empty}</>

  const ids = displayedRows.map((r) => r.id)
  const minWidth = visibleColumns.reduce((sum, column) => sum + columnWidthPx(column.width), 120 + (reorder ? 32 : 0) + (checkKey ? 40 : 0))
  const allSelected = displayedRows.length > 0 && displayedRows.every((row) => effectiveSelectedIds.has(row.id))
  const someSelected = displayedRows.some((row) => effectiveSelectedIds.has(row.id))

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="bg-card card-soft overflow-hidden rounded-2xl border">
        <div className="flex min-h-10 flex-wrap items-center justify-end gap-3 border-b border-border px-3 py-1.5">
          <div className="relative mr-auto min-w-48 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} className="h-8 pl-8" placeholder="Filter records..." aria-label="Filter records" />
          </div>
          <AutosaveStatus status={saveStatus} />
          <SavedViewControls
            state={views.state}
            savedViews={views.savedViews}
            activeId={views.activeId}
            columns={columns.map((column) => ({ key: column.key, label: column.header }))}
            onChange={views.setState}
            onSave={views.save}
            onRestore={views.restore}
            onRemove={views.remove}
          />
        </div>
        <div className="hidden max-h-[42rem] overflow-auto md:block">
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border/80 bg-card text-left text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            {reorder && (
              <th className="w-8 px-1 py-3">
                <GripVertical className="size-3.5 opacity-45" aria-hidden="true" />
              </th>
            )}
            <th className="w-10 px-2 py-3">
              <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={selectAll} aria-label="Select all records" />
            </th>
            {checkKey && (
              <th className="w-10 px-2 py-3">
                <CheckSquare2 className="size-3.5 opacity-60" aria-hidden="true" />
              </th>
            )}
            {visibleColumns.map((c) => (
              <th key={c.key} className={cn('px-3 py-3', c.align === 'right' && 'text-right')} style={{ width: c.width }}>
                {/* The InfoTip is a sibling of the sort button, never inside
                    it — a button within a button is invalid and unreachable
                    by keyboard. */}
                <span className={cn('inline-flex items-center gap-1', c.align === 'right' && 'justify-end')}>
                  <button type="button" onClick={() => dataTable.getColumn(c.key)?.toggleSorting()} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', c.align === 'right' && 'justify-end')}>
                    {(() => {
                      const Icon = CELL_TYPE_ICON[c.type]
                      return <Icon className="size-3.5 opacity-65" aria-hidden="true" />
                    })()}
                    {c.header}
                    <m.span
                      animate={{ rotate: dataTable.getColumn(c.key)?.getIsSorted() === 'desc' ? 180 : 0 }}
                      transition={MOTION_TRANSITION.micro}
                      className="inline-flex"
                    >
                      <ArrowUpDown className={cn('size-3 opacity-35', dataTable.getColumn(c.key)?.getIsSorted() && 'text-primary opacity-100')} aria-hidden="true" />
                    </m.span>
                  </button>
                  {c.glossaryField && <InfoTip field={c.glossaryField} />}
                </span>
              </th>
            ))}
            <th className="w-16 px-2 py-3" />
          </tr>
          </thead>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <tbody>
              <AnimatePresence initial={false}>
                {displayedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    columns={visibleColumns}
                    checkKey={checkKey}
                    reorder={reorder}
                    rowActions={rowActions}
                    onChange={(k, v) => patch(row.id, k, v)}
                    onDelete={() => (onDelete ? onDelete(row.id) : toggleSelected(row.id))}
                    onOpen={onOpen ? () => onOpen(row.id) : undefined}
                    selected={effectiveSelectedIds.has(row.id)}
                    onToggleSelected={() => toggleSelected(row.id)}
                    density={views.state.density}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </SortableContext>
        </table>
        </div>
        <div className={cn('max-h-[42rem] overflow-y-auto p-3 md:hidden', views.state.density === 'compact' ? 'space-y-1.5' : 'space-y-3')}>
          <AnimatePresence initial={false}>
          {displayedRows.map((row) => (
            <m.article
              key={row.id}
              initial={{ opacity: 0, y: MOTION_DISTANCE.small }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -MOTION_DISTANCE.small }}
              transition={MOTION_TRANSITION.standard}
              className={cn('rounded-xl border border-border bg-card card-soft', views.state.density === 'compact' ? 'p-2' : 'p-3')}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <Checkbox checked={effectiveSelectedIds.has(row.id)} onCheckedChange={() => toggleSelected(row.id)} aria-label="Select record" />
                {onOpen && <button type="button" className="ml-auto text-sm font-bold text-primary" onClick={() => onOpen(row.id)}>Open</button>}
              </div>
              <dl className="space-y-3">
                {visibleColumns.map((column) => (
                  <div key={column.key}>
                    <dt className="mb-1 flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                      {column.header}
                      {column.glossaryField && <InfoTip field={column.glossaryField} />}
                    </dt>
                    <dd>
                      <Cell row={row} column={column} value={field(row, column.key)} checked={checkKey ? Boolean(field(row, checkKey)) : false} onChange={(value) => patch(row.id, column.key, value)} />
                      {column.validate?.(field(row, column.key), row) && <p className="mt-1 text-xs font-semibold text-destructive" role="alert">{column.validate(field(row, column.key), row)}</p>}
                    </dd>
                  </div>
                ))}
              </dl>
            </m.article>
          ))}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>{dataTable.getFilteredRowModel().rows.length} records · page {dataTable.getState().pagination.pageIndex + 1} of {Math.max(1, dataTable.getPageCount())}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => dataTable.previousPage()} disabled={!dataTable.getCanPreviousPage()} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => dataTable.nextPage()} disabled={!dataTable.getCanNextPage()} aria-label="Next page"><ChevronRight className="size-4" /></Button>
          </div>
        </div>
        {collection && <BulkActionBar collection={collection} rows={activeRows as Row[]} selectedIds={effectiveSelectedIds} onClear={clearSelection} />}
      </div>
    </DndContext>
  )
}

function TableRow({
  row, columns, checkKey, reorder, rowActions, onChange, onDelete, onOpen, selected, onToggleSelected, density,
}: {
  row: Row
  columns: ColumnDef[]
  checkKey?: string
  reorder: boolean
  rowActions?: (row: Row) => ReactNode
  onChange: (key: string, value: unknown) => void
  onDelete: () => void
  onOpen?: () => void
  selected?: boolean
  onToggleSelected?: () => void
  density: 'comfortable' | 'compact'
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id })
  const checked = checkKey ? Boolean(field(row, checkKey)) : false
  const reduceMotion = useReducedMotion()

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <m.tr
          ref={setNodeRef}
          style={{ transform: CSS.Transform.toString(transform), transition }}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: isDragging ? 0.6 : checked ? 0.55 : 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={reduceMotion ? MOTION_TRANSITION.instant : MOTION_TRANSITION.standard}
          data-glass-row="true"
          className={cn('group border-b border-border/70 last:border-0 hover:bg-muted/35', density === 'compact' ? 'min-h-10' : 'min-h-14', isDragging && 'opacity-60', checked && 'opacity-55')}
        >
      {reorder && (
        <td className="px-1 text-muted-foreground">
          <button {...attributes} {...listeners} className="grid size-7 cursor-grab place-items-center rounded-md opacity-55 transition hover:bg-muted hover:text-foreground hover:opacity-100 active:cursor-grabbing" aria-label="Drag to reorder">
            <GripVertical className="size-4" />
          </button>
        </td>
      )}
      <td className="px-2">
        <Checkbox checked={selected} onCheckedChange={onToggleSelected} aria-label="Select record" />
      </td>
      {checkKey && (
        <td className="px-2">
          <Checkbox checked={checked} onCheckedChange={(v) => onChange(checkKey, Boolean(v))} />
        </td>
      )}
      {columns.map((c) => (
        <td key={c.key} className={cn('px-3 align-top', density === 'compact' ? 'py-1.5' : 'py-3', c.align === 'right' && 'text-right')}>
          <Cell row={row} column={c} value={field(row, c.key)} checked={checked} onChange={(v) => onChange(c.key, v)} />
          {c.validate?.(field(row, c.key), row) && <p className="mt-1 text-xs font-semibold text-destructive" role="alert">{c.validate(field(row, c.key), row)}</p>}
        </td>
      ))}
      <td className="px-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {rowActions?.(row)}
          {onOpen && <button type="button" onClick={onOpen} className="min-h-8 rounded-md px-2 text-xs font-bold text-primary hover:bg-primary/10">Open</button>}
          <button onClick={onDelete} className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-45 transition hover:bg-muted hover:text-destructive hover:opacity-100 group-hover:opacity-100 motion-reduce:transition-none" aria-label="Select row for removal">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </td>
        </m.tr>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onOpen && <ContextMenuItem onSelect={onOpen}>Open record</ContextMenuItem>}
        <ContextMenuItem onSelect={onToggleSelected}>
          <CheckSquare2 className="size-4" /> {selected ? 'Clear selection' : 'Select record'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="size-4" /> Select for removal
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function Cell({
  row, column, value, checked, onChange,
}: { row: Row; column: ColumnDef; value: unknown; checked: boolean; onChange: (v: unknown) => void }) {
  const base = 'w-full rounded-md bg-transparent px-1.5 py-1 text-sm outline-none transition-colors hover:bg-muted/45 focus:bg-card focus:ring-2 focus:ring-ring/35 placeholder:text-muted-foreground/70'

  if (column.render) {
    return <>{column.render({ row, value, checked, onChange })}</>
  }

  if (column.type === 'read') {
    return (
      <div className={cn('px-1.5 py-1 text-sm text-foreground', column.align === 'right' && 'text-right')}>
        {column.read?.(row)}
      </div>
    )
  }

  if (column.type === 'toggle') {
    const on = Boolean(value)
    const [off, onL] = column.toggleLabels ?? ['Off', 'On']
    return (
      <button
        onClick={() => onChange(!on)}
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-bold transition-colors',
          on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {on ? onL : off}
      </button>
    )
  }

  if (column.type === 'select') {
    const emptyValue = '__empty__'
    const selected = String(value ?? '') || emptyValue
    const selectedDot = selected !== emptyValue ? column.optionDots?.[selected] : undefined
    const dotOnly = column.selectDisplay === 'dot' && Boolean(selectedDot)
    return (
      <Select value={selected} onValueChange={(next) => onChange(next === emptyValue ? '' : next)}>
        <SelectTrigger
          className={cn(
            'h-auto min-h-8 max-w-full rounded-full border-border/70 bg-transparent px-2.5 py-1 text-left text-sm font-normal shadow-none hover:bg-muted/45 focus:ring-2 focus:ring-ring/35',
            dotOnly && 'w-fit min-w-12 justify-center px-2',
            !value && 'text-muted-foreground'
          )}
        >
          {dotOnly ? (
            <span className="flex items-center gap-1">
              <span className={cn('size-2.5 shrink-0 rounded-full', selectedDot)} aria-hidden="true" />
              <span className="sr-only">{selected}</span>
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-2 overflow-hidden">
              {selectedDot && <span className={cn('size-2 shrink-0 rounded-full', selectedDot)} aria-hidden="true" />}
              <span className="min-w-0 truncate">
                {selected === emptyValue ? column.placeholder || 'Select…' : selected}
              </span>
            </span>
          )}
        </SelectTrigger>
        <SelectContent className="glass-surface rounded-2xl border-border font-display shadow-xl">
          {column.allowEmpty && <SelectItem value={emptyValue}>{column.placeholder || 'Select…'}</SelectItem>}
          {(column.options ?? []).map((o) => (
            <SelectItem key={o} value={o}>
              <span className="flex items-center gap-2">
                {column.optionDots?.[o] && <span className={cn('size-2 shrink-0 rounded-full', column.optionDots[o])} aria-hidden="true" />}
                <span>{o}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (column.type === 'longtext') {
    return <LongText column={column} value={String(value ?? '')} onChange={onChange} />
  }

  if (column.type === 'link') {
    const url = String(value ?? '')
    return (
      <div className="flex items-center gap-1">
        <input
          value={url}
          placeholder={column.placeholder || 'Paste URL…'}
          onChange={(e) => onChange(e.target.value)}
          className={cn(base, 'min-w-[6rem]')}
        />
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="grid size-7 shrink-0 place-items-center rounded-md text-primary transition hover:bg-secondary hover:text-primary/80">
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    )
  }

  if (column.wrap && column.type === 'text') {
    return (
      <AutoGrowTextarea
        value={value == null ? '' : String(value)}
        placeholder={column.placeholder}
        checked={checked}
        onChange={(next) => onChange(next)}
      />
    )
  }

  if (column.type === 'date') {
    return <DateField value={value == null ? '' : String(value)} onChange={(iso) => onChange(iso)} placeholder={column.placeholder || 'Pick a date'} ariaLabel={column.header} />
  }

  return (
    <input
      type={column.type === 'number' ? 'number' : 'text'}
      value={value == null ? '' : String(value)}
      placeholder={column.placeholder}
      onChange={(e) => onChange(column.type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
      className={cn(base, column.align === 'right' && 'text-right', checked && 'line-through')}
    />
  )
}

function AutoGrowTextarea({
  value, placeholder, checked, onChange,
}: { value: string; placeholder?: string; checked: boolean; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.max(36, el.scrollHeight)}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full resize-none overflow-hidden rounded-md bg-transparent px-1.5 py-1 text-sm leading-snug outline-none transition-colors hover:bg-muted/45 focus:bg-card focus:ring-2 focus:ring-ring/35 placeholder:text-muted-foreground/70',
        checked && 'line-through'
      )}
    />
  )
}

/** Long-text editor in a popover, with a live AMCAS character counter when a limit is set. */
function LongText({ column, value, onChange }: { column: ColumnDef; value: string; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(value)
  const max = column.maxLength
  const over = max != null && text.length > max
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          'flex items-start gap-1.5 rounded-md px-1.5 py-1 -ml-1.5 text-left transition-colors hover:bg-muted/55',
          column.wrap ? 'max-w-[22rem] whitespace-normal break-words leading-snug' : 'max-w-[18rem] truncate'
        )}>
          <StickyNote className="size-3.5 shrink-0 text-muted-foreground" />
          <span className={cn(column.wrap ? 'whitespace-normal break-words' : 'truncate', !value && 'text-muted-foreground/70')}>{value || column.placeholder || 'Add notes…'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Textarea
          autoFocus
          value={text}
          placeholder={column.placeholder}
          onChange={(e) => {
            setText(e.target.value)
            onChange(e.target.value)
          }}
          className="min-h-32"
        />
        {max != null && (
          <div className={cn('mt-1 text-right text-[11px] font-semibold', over ? 'text-destructive' : 'text-muted-foreground')}>
            {text.length.toLocaleString()} / {max.toLocaleString()} chars{over ? ' · over AMCAS limit' : ''}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

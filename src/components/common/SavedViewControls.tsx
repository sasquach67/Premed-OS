import { useState, type ReactNode } from 'react'
import { Bookmark, Columns3, MoreHorizontal, Rows3, Trash2 } from 'lucide-react'
import type { ListDensity, ListViewState, SavedListView } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function SavedViewControls({
  state, savedViews, activeId, columns, onChange, onSave, onRestore, onRemove,
}: {
  state: ListViewState
  savedViews: SavedListView[]
  activeId?: string
  columns: Array<{ key: string; label: string }>
  onChange: (state: ListViewState) => void
  onSave: (name: string) => void
  onRestore: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState('')

  function densityButton(value: ListDensity, label: string, icon: ReactNode) {
    return (
      <button
        type="button"
        aria-pressed={state.density === value}
        onClick={() => onChange({ ...state, density: value })}
        className={cn(
          'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-bold transition-colors motion-reduce:transition-none',
          state.density === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {icon}{label}
      </button>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="inline-flex rounded-lg bg-muted p-0.5" aria-label="List density">
          {densityButton('comfortable', 'Comfortable', <Rows3 className="size-3.5" />)}
          {densityButton('compact', 'Compact', <Rows3 className="size-3.5" />)}
        </div>
        <Popover>
          <PopoverTrigger asChild><Button size="sm" variant="ghost"><Columns3 className="size-4" /> Columns</Button></PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Visible columns</p>
            <div className="space-y-1">
              {columns.map((column) => {
                const visible = state.visibleColumns.length === 0 || state.visibleColumns.includes(column.key)
                return (
                  <label key={column.key} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
                    <Checkbox
                      checked={visible}
                      disabled={visible && (state.visibleColumns.length ? state.visibleColumns.length : columns.length) === 1}
                      onCheckedChange={(checked) => {
                        const current = state.visibleColumns.length ? state.visibleColumns : columns.map((item) => item.key)
                        const next = checked
                          ? [...new Set([...current, column.key])]
                          : current.filter((key) => key !== column.key)
                        if (next.length) onChange({ ...state, visibleColumns: next })
                      }}
                    />
                    {column.label}
                  </label>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="sm" variant="ghost"><Bookmark className="size-4" /> Views <MoreHorizontal className="size-3.5" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={() => setSaveOpen(true)}>Save current view</DropdownMenuItem>
            {savedViews.length > 0 && <DropdownMenuLabel>Saved views</DropdownMenuLabel>}
            {savedViews.map((view) => (
              <div key={view.id} className="flex items-center gap-1 px-1">
                <DropdownMenuItem className="min-w-0 flex-1" onSelect={() => onRestore(view.id)}>
                  <span className="truncate">{view.name}</span>{activeId === view.id && <span className="ml-auto text-xs text-primary">Active</span>}
                </DropdownMenuItem>
                <button type="button" onClick={() => onRemove(view.id)} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Delete ${view.name}`}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this view</DialogTitle>
            <DialogDescription>Keep this list’s filters, sorting, grouping, columns, density, date range, and view switch together.</DialogDescription>
          </DialogHeader>
          <label className="text-sm font-bold">View name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Application priorities" autoFocus /></label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button disabled={!name.trim()} onClick={() => { onSave(name.trim()); setName(''); setSaveOpen(false) }}>Save view</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
